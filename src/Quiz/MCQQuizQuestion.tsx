import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig, Sequence, interpolate, useCurrentFrame, spring, interpolateColors } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { BubbleBackground } from "./BubbleBackground";
import { QuizTimer } from "./QuizTimer";
import { QuizImage } from "./QuizImage";

export const mcqSchema = z.object({
  questionNumber: z.number(),
  questionText: z.string(),
  questionImageSrc: z.string(),
  answerImageSrc: z.string(),
  options: z.array(z.string()),
  correctAnswerIndex: z.number(),
  questionAudioSrc: z.string(),
  answerAudioSrc: z.string(),
  bgColor: zColor(),
});

const MCQOption: React.FC<{
  option: string;
  index: number;
  isCorrect: boolean;
  revealTime: number;
}> = ({ option, index, isCorrect, revealTime }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stagger entrance animation
  const entranceDelay = index * 5; // 5 frames delay between each option
  const entranceProgress = spring({
    frame: frame - entranceDelay,
    fps,
    config: { damping: 200 },
  });

  const translateX = interpolate(entranceProgress, [0, 1], [100, 0]);
  const entranceOpacity = interpolate(entranceProgress, [0, 1], [0, 1]);

  // Reveal animation
  const revealFrame = revealTime * fps;
  
  const revealProgress = spring({
    frame: frame - revealFrame,
    fps,
    config: { damping: 100 },
  });

  const scale = isCorrect 
    ? interpolate(revealProgress, [0, 1], [1, 1.05])
    : 1;

  // Option labels (A, B, C)
  const labels = ['A', 'B', 'C'];
  const label = labels[index];

  // Colors
  const defaultLabelBg = '#bf2eef'; // Purple
  const defaultTextBg = '#f9d013'; // Yellow
  
  const correctColor = '#4CAF50';
  const incorrectColor = '#f44336';

  const targetColor = isCorrect ? correctColor : incorrectColor;

  const labelBg = interpolateColors(
    revealProgress,
    [0, 1],
    [defaultLabelBg, targetColor]
  );
    
  const textBg = interpolateColors(
    revealProgress,
    [0, 1],
    [defaultTextBg, targetColor]
  );

  // Blur effect for incorrect options when answer is revealed
  const blurAmount = !isCorrect 
    ? interpolate(revealProgress, [0, 1], [0, 4]) 
    : 0;
    
  const dimmingOpacity = !isCorrect
    ? interpolate(revealProgress, [0, 1], [1, 0.6])
    : 1;

  const finalOpacity = entranceOpacity * dimmingOpacity;

  return (
    <div
      style={{
        width: '100%',
        height: '120px',
        display: 'flex',
        borderRadius: '25px',
        border: '6px solid #ffffff',
        boxShadow: '0 6px 0 rgba(0,0,0,0.2)',
        transform: `translateX(${translateX}px) scale(${scale})`,
        opacity: finalOpacity,
        filter: `blur(${blurAmount}px)`,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: textBg,
      }}
    >
      {/* Label Section */}
      <div
        style={{
          width: '120px',
          backgroundColor: labelBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px',
        }}
      >
        <span
          style={{
            fontSize: '48px',
            fontWeight: '900',
            color: '#ffffff',
            textShadow: '2px 2px 0 rgba(0,0,0,0.2)',
            fontFamily: 'sans-serif',
          }}
        >
          {label}
        </span>
      </div>

      {/* Text Section */}
      <div
        style={{
          flex: 1,
          backgroundColor: textBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
        }}
      >
        <span
          style={{
            fontSize: '48px',
            fontWeight: '800',
            color: '#111',
            textShadow: '2px 2px 0 rgba(255,255,255,0.3)',
            textAlign: 'center',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {option}
        </span>
      </div>

      {/* Check Mark for Correct Answer */}
      {isCorrect && (
        <div
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '40px',
            color: '#ffffff',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: revealProgress,
          }}
        >
          ✓
        </div>
      )}
    </div>
  );
};

export const MCQQuizQuestion: React.FC<z.infer<typeof mcqSchema>> = ({
  questionNumber,
  questionText,
  questionImageSrc,
  answerImageSrc,
  options,
  correctAnswerIndex,
  questionAudioSrc,
  answerAudioSrc,
  bgColor,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Timeline: 0-1s reveal, 1-8s read question, 8s+ answer reveal
  const answerRevealTime = 8;

  return (
    <AbsoluteFill>
      <BubbleBackground bubbleCount={40} bgColor={bgColor} />

      {/* Audio */}
      <Sequence from={30}>
        <Audio src={staticFile(questionAudioSrc)} />
      </Sequence>

      {/* Audio: Clock ticking from 1s to 8s */}
      <Sequence from={1 * fps} durationInFrames={7 * fps}>
        <Audio src={staticFile("clock.mp3")} />
      </Sequence>

      <Sequence from={8 * fps}>
        <Audio src={staticFile("mixkit-correct-answer-tone-2870.wav")} />
      </Sequence>

      <Sequence from={8 * fps}>
        <Audio src={staticFile(answerAudioSrc)} />
      </Sequence>

      {/* Main Layout */}
      <AbsoluteFill style={{ padding: '60px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', gap: '30px', width: '100%', minHeight: '140px', flexShrink: 0 }}>
            {/* Question Number */}
            <div
            style={{
                width: '140px',
                height: '140px',
                borderRadius: '20px',
                backgroundColor: '#f9d013',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 0 rgba(0, 0, 0, 0.2)',
                border: '6px solid #ffffff',
                flexShrink: 0,
            }}
            >
            <span
                style={{
                fontSize: '64px',
                fontWeight: '900',
                color: '#222',
                fontFamily: 'sans-serif',
                }}
            >
                {questionNumber}
            </span>
            </div>

            {/* Question Text */}
            <div
            style={{
                flex: 1,
                backgroundColor: '#ff6f00', // Orange from image
                borderRadius: '20px',
                padding: '20px 40px',
                border: '6px solid #ffffff',
                boxShadow: '0 8px 0 rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                minHeight: '140px',
            }}
            >
            <p
                style={{
                fontSize: '48px',
                fontWeight: '900',
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.2,
                textShadow: '2px 2px 0 rgba(0,0,0,0.2)',
                fontFamily: 'sans-serif',
                }}
            >
                {questionText}
            </p>
            </div>
        </div>

        {/* Content Row */}
        <div style={{ flex: 1, display: 'flex', gap: '40px', width: '100%', position: 'relative', minHeight: 0 }}>
            {/* Left Column - Image */}
            <div style={{ position: 'relative', width: '800px', height: '100%', flexShrink: 0 }}>
                <QuizImage
                    questionImageSrc={questionImageSrc}
                    answerImageSrc={answerImageSrc}
                    transitionStartTime={answerRevealTime}
                />
            </div>

            {/* Right Column - Options & Timer */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', paddingBottom: '40px', paddingTop: '50px' }}>
                {/* Options */}
                <div
                    style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    justifyContent: 'center',
                    flex: 1,
                    }}
                >
                    {options.map((option, index) => (
                    <MCQOption
                        key={index}
                        option={option}
                        index={index}
                        isCorrect={index === correctAnswerIndex}
                        revealTime={answerRevealTime}
                    />
                    ))}
                </div>

                {/* Timer */}
                <div style={{ width: '100%', marginTop: '0px' }}>
                    <QuizTimer time={7} startTime={1} height={70} />
                </div>
            </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
