import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig, Sequence, interpolate, useCurrentFrame, spring, interpolateColors } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { BubbleBackground } from "./BubbleBackground";
import { Timer } from "./Timer";
import { QuizImage } from "./QuizImage";

export const verticalMCQSchema = z.object({
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

const VerticalMCQOption: React.FC<{
  option: string;
  index: number;
  isCorrect: boolean;
  revealTime: number;
}> = ({ option, index, isCorrect, revealTime }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stagger entrance animation
  const entranceDelay = index * 5;
  const entranceProgress = spring({
    frame: frame - entranceDelay,
    fps,
    config: { damping: 200 },
  });

  const translateY = interpolate(entranceProgress, [0, 1], [50, 0]);
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
  const defaultLabelBg = '#bf2eef';
  const defaultTextBg = '#f9d013';
  
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

  // Blur effect for incorrect options
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
        height: '100px',
        display: 'flex',
        borderRadius: '20px',
        border: '5px solid #ffffff',
        boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
        transform: `translateY(${translateY}px) scale(${scale})`,
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
          width: '100px',
          backgroundColor: labelBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '15px',
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
            fontSize: '42px',
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
            fontSize: '36px',
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

export const VerticalMCQQuizQuestion: React.FC<z.infer<typeof verticalMCQSchema>> = ({
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

  // Answer reveal at 6 seconds
  const answerRevealTime = 6;
  const answerRevealFrame = answerRevealTime * fps;

  // Animations
  const revealProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  
  const revealY = interpolate(revealProgress, [0, 1], [100, 0]);
  const revealOpacity = interpolate(revealProgress, [0, 1], [0, 1]);

  // Image Transition Logic
  const transitionDuration = 60;
  const transitionProgress = Math.min(
    1,
    Math.max(0, (frame - answerRevealFrame) / transitionDuration)
  );
  
  const questionImageOpacity = interpolate(transitionProgress, [0, 0.3], [1, 0], { extrapolateRight: "clamp" });
  const answerImageOpacity = interpolate(transitionProgress, [0, 1], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <BubbleBackground bubbleCount={40} bgColor={bgColor} />
      
      {/* Audio */}
      <Sequence from={0}>
        <Audio src={staticFile(questionAudioSrc)} />
      </Sequence>
      
      <Sequence from={1 * fps} durationInFrames={5 * fps}>
        <Audio src={staticFile("clock.mp3")} />
      </Sequence>
      
      <Sequence from={answerRevealFrame}>
        <Audio src={staticFile("mixkit-correct-answer-tone-2870.wav")} />
      </Sequence>
      
      <Sequence from={answerRevealFrame}>
        <Audio src={staticFile(answerAudioSrc)} />
      </Sequence>

      {/* Layout */}
      <AbsoluteFill style={{ 
        padding: '150px 40px 350px 40px', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 20
      }}>
        
        {/* Question Text */}
        <div style={{ 
          width: '100%', 
          backgroundColor: '#f9d013', 
          borderRadius: 25, 
          padding: 20,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: 56, 
          fontWeight: 'bold',
          boxShadow: '0 6px 0 rgba(0,0,0,0.2)',
          border: '5px solid white',
          opacity: revealOpacity,
          transform: `translateY(${revealY}px)`,
          color: '#111',
          lineHeight: 1.2,
          minHeight: '140px'
        }}>
          {questionText}
        </div>

        {/* Image Area */}
        <div style={{ 
          width: '100%', 
          height: '40%',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          opacity: revealOpacity,
          transform: `translateY(${revealY}px)`
        }}>
            <div style={{ 
                height: '100%', 
                aspectRatio: '1/1',
                position: 'relative'
            }}>
                <QuizImage
                    questionImageSrc={questionImageSrc}
                    answerImageSrc={answerImageSrc}
                    transitionStartTime={answerRevealTime}
                    style={{
                        position: 'relative',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        transform: 'none'
                    }}
                />
            </div>
        </div>

        {/* Options */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            width: '100%',
          }}
        >
          {options.map((option, index) => (
            <VerticalMCQOption
              key={index}
              option={option}
              index={index}
              isCorrect={index === correctAnswerIndex}
              revealTime={answerRevealTime}
            />
          ))}
        </div>

        {/* Timer */}
        <div style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          opacity: revealOpacity,
          transform: `translateY(${revealY}px)`,
          paddingLeft: 40,
        }}>
          <Timer time={5} startTime={1} />
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
