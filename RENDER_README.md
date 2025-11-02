# Quiz Video Generator

Automated quiz video generation using Remotion, Gemini AI, and Google Cloud Text-to-Speech.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` and add your credentials:

#### Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Add it to `.env` as `GEMINI_API_KEY`

#### Get Google Cloud Text-to-Speech Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the "Cloud Text-to-Speech API"
4. Go to "APIs & Services" > "Credentials"
5. Create a service account
6. Download the JSON key file
7. Save it in your project directory
8. Add the path to `.env` as `GOOGLE_APPLICATION_CREDENTIALS`

Example `.env`:
```
GEMINI_API_KEY=AIzaSyC...your-key-here
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

## Usage

### Render Quiz Videos from JSON

```bash
node render.mjs ./public/questions-export-2025-11-02\ \(2\).json
```

### Workflow

The script will:

1. **Load questions** from the JSON file
2. **Generate narratives** using Gemini AI (converts quiz questions into friendly, conversational text)
3. **Download images** from the URLs in the JSON
4. **Generate audio** using Google Cloud Text-to-Speech (Chirp 3)
5. **Render videos** for each question using Remotion

### Output

- Generated images: `public/question-{N}.jpg`, `public/answer-{N}.jpg`
- Generated audio: `public/question-{N}.mp3`, `public/answer-{N}.mp3`
- Rendered videos: `out/question-{N}.mp4`

## JSON Format

Your questions JSON should follow this structure:

```json
[
  {
    "question": "Which country has the largest population in the world?",
    "answers": ["India", "China", "United States"],
    "correctAnswerIndex": 0,
    "questionImage": "https://example.com/question.jpg",
    "answerImage": "https://example.com/answer.jpg",
    "categories": ["Geography", "General Knowledge"],
    "country": null
  }
]
```

## Development

### Preview in Remotion Studio

```bash
npm run dev
```

### Manual Render

```bash
npm run render HelloWorld
```

## Customization

Edit `render.mjs` to customize:
- Voice settings (currently using `en-US-Neural2-J`)
- Background colors
- Video codec settings
- Narrative generation prompts

## Troubleshooting

### "GEMINI_API_KEY is not defined"
Make sure you've created a `.env` file with your API key.

### "Google Cloud authentication failed"
Verify your service account JSON path in `.env` is correct and the file exists.

### "Permission denied" errors
Ensure the Text-to-Speech API is enabled in your Google Cloud project.
