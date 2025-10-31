import { spring } from "remotion";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  staticFile,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Timer } from "./Quiz/Timer";
import { Question } from "./Quiz/Question";
import { QuizImage } from "./Quiz/QuizImage";
import { BubbleBackground } from "./Quiz/BubbleBackground";

export const myCompSchema = z.object({
  titleText: z.string(),
  titleColor: zColor(),
  logoColor1: zColor(),
  logoColor2: zColor(),
});

export const HelloWorld: React.FC<z.infer<typeof myCompSchema>> = ({
  titleText: propOne,
  titleColor: propTwo,
  logoColor1,
  logoColor2,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Animate from 0 to 1 after 25 frames
  const logoTranslationProgress = spring({
    frame: frame - 25,
    fps,
    config: {
      damping: 100,
    },
  });

  // Move the logo up by 150 pixels once the transition starts
  const logoTranslation = interpolate(
    logoTranslationProgress,
    [0, 1],
    [0, -150],
  );

  // Fade out the animation at the end
  const opacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames - 15],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // A <AbsoluteFill> is just a absolutely positioned <div>!
  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      <BubbleBackground bubbleCount={40} />
      {/* Correct answer sound effect at 9 seconds */}
      <Sequence from={9 * fps}>
        <Audio src={staticFile("mixkit-correct-answer-tone-2870.wav")} />
      </Sequence>
      <AbsoluteFill style={{ opacity }}>
        <Sequence from={0}>
          <QuizImage
            questionImageSrc="1040-500x500.jpg"
            answerImageSrc="290-500x500.jpg"
            transitionStartTime={6}
          />
          <Question questionText="What is the outer layer of a tooth called?" />
          <AbsoluteFill
            style={{
              justifyContent: "flex-end",
              alignItems: "center",
              paddingBottom: "200px",
            }}
          >
            <Timer time={7} startTime={2} />
          </AbsoluteFill>
          {/* <Subtitle /> */}
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
