import { spring } from "remotion";
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { BubbleBackground } from "./Quiz/BubbleBackground";
import { QuizQuestion } from "./Quiz/QuizQuestion";

export const myCompSchema = z.object({
  questionNumber: z.number(),
  questionText: z.string(),
  questionImageSrc: z.string(),
  answerImageSrc: z.string(),
  answer: z.string(),
  questionAudioSrc: z.string(),
  answerAudioSrc: z.string(),
  bgColor: zColor(),
});

export const HelloWorld: React.FC<z.infer<typeof myCompSchema>> = ({
  questionNumber,
  questionText,
  questionImageSrc,
  answerImageSrc,
  answer,
  questionAudioSrc,
  answerAudioSrc,
  bgColor,
}) => {
  // const frame = useCurrentFrame();
  // const { durationInFrames, fps } = useVideoConfig();




  // Fade out the animation at the end
  // const opacity = interpolate(
  //   frame,
  //   [durationInFrames - 25, durationInFrames - 15],
  //   [1, 0],
  //   {
  //     extrapolateLeft: "clamp",
  //     extrapolateRight: "clamp",
  //   },
  // );

  // A <AbsoluteFill> is just a absolutely positioned <div>!
  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      <BubbleBackground bubbleCount={40} bgColor={bgColor} />
      
      <AbsoluteFill>
        {/* Single question - transitions disabled */}
        <QuizQuestion
          questionNumber={questionNumber}
          questionText={questionText}
          questionImageSrc={questionImageSrc}
          answerImageSrc={answerImageSrc}
          answer={answer}
          questionAudioSrc={questionAudioSrc}
          answerAudioSrc={answerAudioSrc}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
