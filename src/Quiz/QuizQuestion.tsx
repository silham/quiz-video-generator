import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig, Sequence } from "remotion";
import { QuestionNumber } from "./QuestionNumber";
import { QuizTitle } from "./QuizTitle";
import { QuizImage } from "./QuizImage";
import { Question } from "./Question";
import { Timer } from "./Timer";
import { AnswerReveal } from "./AnswerReveal";

export const QuizQuestion: React.FC<{
  readonly questionNumber: number;
  readonly questionText: string;
  readonly questionImageSrc: string;
  readonly answerImageSrc: string;
  readonly answer: string;
  readonly questionAudioSrc?: string;
  readonly answerAudioSrc?: string;
}> = ({
  questionNumber,
  questionText,
  questionImageSrc,
  answerImageSrc,
  answer,
  questionAudioSrc = "question1.wav",
  answerAudioSrc = "answer1.wav",
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Audio: Question voice-over at frame 30 (~1 second at 30fps) */}
      <Sequence from={30}>
        <Audio src={staticFile(questionAudioSrc)} />
      </Sequence>
      
      {/* Audio: Clock ticking from 1s to 8s */}
      <Sequence from={1 * fps} durationInFrames={7 * fps}>
        <Audio src={staticFile("clock.mp3")} />
      </Sequence>
      
      {/* Audio: Correct answer sound effect at 8 seconds */}
      <Sequence from={8 * fps}>
        <Audio src={staticFile("mixkit-correct-answer-tone-2870.wav")} />
      </Sequence>
      
      {/* Audio: Answer voice-over at 8 seconds */}
      <Sequence from={8 * fps}>
        <Audio src={staticFile(answerAudioSrc)} />
      </Sequence>

      {/* Visual: Question Number */}
      <QuestionNumber number={questionNumber} />

      {/* Visual: Quiz Title */}
      <QuizTitle />

      {/* Visual: Question Image */}
      <QuizImage
        questionImageSrc={questionImageSrc}
        answerImageSrc={answerImageSrc}
        transitionStartTime={8}
      />

      {/* Visual: Question Text */}
      <Question questionText={questionText} />

      {/* Visual: Timer */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: "200px",
        }}
      >
        <Timer time={7} startTime={1} />
      </AbsoluteFill>

      {/* Visual: Answer Reveal */}
      <AnswerReveal answer={answer} revealTime={8} animationDuration={1} />
    </AbsoluteFill>
  );
};
