import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig, Sequence, interpolate, useCurrentFrame, spring } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Timer } from "./Timer";
import { BubbleBackground } from "./BubbleBackground";

export const shortsSchema = z.object({
  questionNumber: z.number(),
  questionText: z.string(),
  questionImageSrc: z.string(),
  answerImageSrc: z.string(),
  answer: z.string(),
  questionAudioSrc: z.string(),
  answerAudioSrc: z.string(),
  bgColor: zColor(),
});

export const ShortsQuizQuestion: React.FC<z.infer<typeof shortsSchema>> = ({
  questionNumber,
  questionText,
  questionImageSrc,
  answerImageSrc,
  answer,
  questionAudioSrc,
  answerAudioSrc,
  bgColor,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Animations
  const revealProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  
  const revealY = interpolate(revealProgress, [0, 1], [100, 0]);
  const revealOpacity = interpolate(revealProgress, [0, 1], [0, 1]);

  // Answer Reveal (at 6s)
  const answerRevealFrame = 6 * fps;
  const answerProgress = spring({
    frame: frame - answerRevealFrame,
    fps,
    config: { damping: 200 },
  });
  const answerScale = interpolate(answerProgress, [0, 1], [0.8, 1]);
  const answerOpacity = interpolate(answerProgress, [0, 1], [0, 1]);

  // Image Transition Logic
  const transitionDuration = 60; // frames
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
      
      <Sequence from={6 * fps}>
        <Audio src={staticFile("mixkit-correct-answer-tone-2870.wav")} />
      </Sequence>
      
      <Sequence from={6 * fps}>
        <Audio src={staticFile(answerAudioSrc)} />
      </Sequence>

      {/* Layout */}
      <AbsoluteFill style={{ padding: 30, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ 
            width: '100%', 
            height: '12%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 20,
            opacity: revealOpacity,
            transform: `translateY(${revealY}px)`
        }}>
            <div style={{
                width: 130, height: 130, borderRadius: '50%', backgroundColor: '#f9d013',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '5px solid #222', fontSize: 64, fontWeight: 'bold', color: '#222',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
                {questionNumber}
            </div>
            <div style={{
                fontSize: 80,
                fontWeight: '900',
                color: 'white',
                textShadow: '4px 4px 0 #000',
                fontFamily: 'sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                TRIVIA TIME
            </div>
        </div>

        {/* Image Area */}
        <div style={{ 
            width: '100%', 
            height: '38%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            opacity: revealOpacity,
            transform: `translateY(${revealY}px)`
        }}>
            <div style={{
                width: '800px',
                height: '800px',
                maxWidth: '90%',
                aspectRatio: '1/1',
                backgroundColor: '#ffffff',
                borderRadius: '30px',
                border: '6px solid white',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                 {/* Question Image */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${staticFile(questionImageSrc)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: questionImageOpacity,
                  }}
                />

                {/* Answer Image */}
                {frame >= answerRevealFrame && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundImage: `url(${staticFile(answerImageSrc)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: answerImageOpacity,
                    }}
                  />
                )}
            </div>
        </div>

        {/* Question Text */}
        <div style={{ 
            width: '100%', 
            height: '20%', 
            backgroundColor: '#f9d013', 
            borderRadius: 30, 
            padding: 15,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            fontSize: 68, 
            fontWeight: 'bold',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            opacity: revealOpacity,
            transform: `translateY(${revealY}px)`,
            color: '#111',
            lineHeight: 1.2
        }}>
            {questionText}
        </div>

        {/* Timer & Answer Container */}
        <div style={{ width: '100%', height: '15%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(-100px)`, opacity: revealOpacity }}>
             {/* Timer - Hidden when answer reveals */}
             <div style={{ opacity: frame < answerRevealFrame ? 1 : 0, width: '100%', display: 'flex', justifyContent: 'center', paddingLeft: 40 }}>
                <Timer time={5} startTime={1} />
             </div>

             {/* Answer Area - Shows when timer hides */}
             {frame >= answerRevealFrame && (
                <div style={{ 
                    position: 'absolute',
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: answerOpacity,
                    transform: `scale(${answerScale})`
                }}>
                    <div style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '20px 60px',
                        borderRadius: 50,
                        fontSize: 56,
                        fontWeight: 'bold',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                        {answer}
                    </div>
                </div>
             )}
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
