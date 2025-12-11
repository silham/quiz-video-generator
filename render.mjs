import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Load environment variables
import 'dotenv/config';

// The directory of the current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get CLI arguments
const args = process.argv.slice(2);
const isShort = args.includes('--short');
const apiUrlArg = args.find(arg => !arg.startsWith('--')); // Can be API URL or JSON file path

// The composition you want to render
const compositionId = isShort ? 'ShortsQuiz' : 'HelloWorld';

// Rate limiting configuration
const RATE_LIMIT_PER_MINUTE = 30;
const RATE_LIMIT_DELAY = 60000 / RATE_LIMIT_PER_MINUTE; // milliseconds between requests
let lastRequestTime = 0;

// Function to prompt user for input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Rate limiting helper
async function rateLimitedDelay() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delayNeeded = RATE_LIMIT_DELAY - timeSinceLastRequest;
    console.log(`  Rate limiting: waiting ${Math.ceil(delayNeeded / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  
  lastRequestTime = Date.now();
}

// Initialize Google Cloud Text-to-Speech client
const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Function to download image from URL
async function downloadImage(url, outputPath) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));
  return outputPath;
}

// Function to fetch questions from API
async function fetchQuestionsFromAPI(apiUrl) {
  console.log(`Fetching questions from API: ${apiUrl}`);
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error('Invalid API response format');
  }
  
  // Handle new API structure where questions are nested in data.questions
  const questions = data.data.questions || data.data;
  
  console.log(`✅ Fetched ${questions.length} questions from API`);
  console.log(`   Quiz: ${data.data.name || 'Unknown'}`);
  if (data.updatedAt) {
    console.log(`   Last updated: ${data.updatedAt}`);
  }
  console.log();
  
  return questions;
}

// Function to generate narrative versions using Groq
async function generateNarrative(question, correctAnswer) {
  // Apply rate limiting
  await rateLimitedDelay();
  
  const prompt = `Generate a very short answer reveal phrase for a quiz video. Keep it under 5 words.

Correct Answer: ${correctAnswer}

Examples:
- If answer is "Sahara Desert" → "It's the Sahara Desert"
- If answer is "India" → "Correct, it's India"
- If answer is "Mount Everest" → "Yes, Mount Everest"
- If answer is "Paris" → "It's Paris"

Generate ONLY the short phrase for: ${correctAnswer}

Return ONLY a JSON object with this format:
{"answerNarrative": "your short phrase here"}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates short, friendly answer phrases for quiz videos. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 50,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);
  
  // Return question as-is, only modify answer
  return {
    questionNarrative: question,
    answerNarrative: parsed.answerNarrative
  };
}

// Function to generate audio using Google TTS
async function generateAudio(text, outputPath, voiceName = 'en-US-Chirp3-HD-Achernar') {
  const request = {
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0,
    },
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  await fs.writeFile(outputPath, response.audioContent, 'binary');
  console.log(`Audio saved to ${outputPath}`);
  return outputPath;
}

// Main rendering function
async function renderQuiz() {
  console.log('Starting quiz generation...\n');

  try {
    // Ask for quiz name
    const quizName = await askQuestion('Enter quiz name (e.g., geography-quiz): ');
    if (!quizName || quizName.trim() === '') {
      console.error('❌ Quiz name is required!');
      process.exit(1);
    }

    // Create quiz folder structure
    const quizFolderName = quizName.trim().toLowerCase().replace(/\s+/g, '-');
    const quizPublicPath = path.join(__dirname, 'public', quizFolderName);
    const quizOutputPath = path.join(__dirname, 'out', quizFolderName);
    
    // Create directories if they don't exist
    await fs.mkdir(quizPublicPath, { recursive: true });
    await fs.mkdir(quizOutputPath, { recursive: true });
    
    console.log(`\n📁 Quiz folder created: ${quizFolderName}`);
    console.log(`   Public assets: public/${quizFolderName}/`);
    console.log(`   Output videos: out/${quizFolderName}/\n`);

    // 1. Load questions from JSON file or API
    let questions;
    if (apiUrlArg) {
      // Check if it's a URL or file path
      if (apiUrlArg.startsWith('http://') || apiUrlArg.startsWith('https://')) {
        console.log('1. Fetching from API...');
        questions = await fetchQuestionsFromAPI(apiUrlArg);
      } else {
        console.log('1. Loading questions from JSON file...');
        const jsonContent = await fs.readFile(apiUrlArg, 'utf-8');
        questions = JSON.parse(jsonContent);
        console.log(`Loaded ${questions.length} questions from file\n`);
      }
    } else {
      console.log('1. No API URL or JSON file provided, prompting for API endpoint...');
      const apiUrl = await askQuestion('Enter API endpoint URL (e.g., https://quiz-db-one.vercel.app/api/quiz/gk50): ');
      if (!apiUrl || apiUrl.trim() === '') {
        console.error('❌ API URL is required!');
        process.exit(1);
      }
      questions = await fetchQuestionsFromAPI(apiUrl.trim());
    }

    // Process each question to generate assets first
    console.log('Generating all assets before bundling...\n');
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionNumber = i + 1;
      console.log(`\n========== Generating Assets for Question ${questionNumber}/${questions.length} ==========`);
      console.log(`Question: ${q.question}`);
      console.log(`Correct Answer: ${q.answers[q.correctAnswerIndex]}\n`);

      // 2. Generate narrative versions using Gemini
      console.log('2. Generating narrative versions with Gemini AI...');
      const narrative = await generateNarrative(q.question, q.answers[q.correctAnswerIndex]);
      console.log(`Question Narrative: ${narrative.questionNarrative}`);
      console.log(`Answer Narrative: ${narrative.answerNarrative}\n`);

      // Download images
      console.log('3. Downloading images...');
      const questionImageFilename = `question-${questionNumber}.jpg`;
      const answerImageFilename = `answer-${questionNumber}.jpg`;
      const questionImagePath = path.join(quizPublicPath, questionImageFilename);
      const answerImagePath = path.join(quizPublicPath, answerImageFilename);
      await downloadImage(q.questionImage, questionImagePath);
      await downloadImage(q.answerImage, answerImagePath);
      console.log('Images downloaded\n');

      // 4. Generate audio using Google TTS
      console.log('4. Generating audio with Google Cloud TTS...');
      const questionAudioFilename = `question-${questionNumber}.mp3`;
      const answerAudioFilename = `answer-${questionNumber}.mp3`;
      const questionAudioPath = path.join(quizPublicPath, questionAudioFilename);
      const answerAudioPath = path.join(quizPublicPath, answerAudioFilename);
      await generateAudio(narrative.questionNarrative, questionAudioPath);
      await generateAudio(narrative.answerNarrative, answerAudioPath);
      console.log('Audio files generated\n');
    }

    console.log('\n✅ All assets generated!\n');

    // Bundle Remotion project once (reuse for all renders)
    console.log('Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve(__dirname, './src/index.ts'),
      webpackOverride: (config) => config,
      publicDir: path.resolve(__dirname, './public'),
    });
    console.log('Bundle complete!\n');

    const bgColors = ['#239df3', '#de60a3', '#1daa88', '#f78f6e'];

    // Now render each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionNumber = i + 1;
      console.log(`\n========== Rendering Question ${questionNumber}/${questions.length} ==========`);

      const inputProps = {
        questionNumber,
        questionText: q.question,
        questionImageSrc: `${quizFolderName}/question-${questionNumber}.jpg`,
        answerImageSrc: `${quizFolderName}/answer-${questionNumber}.jpg`,
        answer: q.answers[q.correctAnswerIndex],
        questionAudioSrc: `${quizFolderName}/question-${questionNumber}.mp3`,
        answerAudioSrc: `${quizFolderName}/answer-${questionNumber}.mp3`,
        bgColor: bgColors[questionNumber % 4],
      };

      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
        inputProps,
      });

      const outputPath = path.join(quizOutputPath, `question-${questionNumber}.mp4`);
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps,
      });

      console.log(`✅ Video rendered: ${outputPath}\n`);
    }

    console.log('\n🎉 All videos rendered successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

renderQuiz();
