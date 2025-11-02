import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const AnswerReveal: React.FC<{
  readonly answer: string;
  readonly revealTime: number; // in seconds, when to reveal the answer
  readonly animationDuration?: number; // in seconds, default 1
}> = ({ answer, revealTime, animationDuration = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Calculate animation progress
  const revealStartFrame = revealTime * fps;
  const animationFrames = animationDuration * fps;
  const framesSinceReveal = frame - revealStartFrame;

  // Fade in animation (0 to 1)
  const fadeProgress = interpolate(
    framesSinceReveal,
    [0, animationFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Blur animation (20px to 0px)
  const blurAmount = interpolate(
    framesSinceReveal,
    [0, animationFrames],
    [20, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Scale animation (slight zoom in)
  const scale = interpolate(
    framesSinceReveal,
    [0, animationFrames],
    [0.8, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Don't show before reveal time
  if (currentTime < revealTime) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: "80px",
        left: "50%",
        transform: `translateX(-50%) scale(${scale})`,
        textAlign: "center",
        opacity: fadeProgress,
        filter: `blur(${blurAmount}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <span
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            textShadow: "0 4px 8px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          Answer:
        </span>
        <span
          style={{
            fontSize: "64px",
            fontWeight: "900",
            fontFamily: "Arial, sans-serif",
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "#FFD700",
            backgroundClip: "text",
            textShadow: "0 4px 8px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          {answer}
        </span>
      </div>
    </div>
  );
};
