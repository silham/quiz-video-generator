import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from "remotion";

export const QuizImage: React.FC<{
  readonly questionImageSrc: string;
  readonly answerImageSrc: string;
  readonly transitionStartTime: number; // in seconds, when to start transitioning to answer
}> = ({ questionImageSrc, answerImageSrc, transitionStartTime }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide in animation from the left
  const slideProgress = spring({
    frame,
    fps,
    config: {
      damping: 30,
      stiffness: 100,
    },
  });

  const translateX = interpolate(slideProgress, [0, 1], [-1000, 0]);

  // Transition to answer image
  const transitionStartFrame = transitionStartTime * fps;
  const transitionDuration = 60; // frames for the wave effect
  
  // Calculate transition progress (0 to 1)
  const transitionProgress = Math.min(
    1,
    Math.max(0, (frame - transitionStartFrame) / transitionDuration)
  );
  
  // Opacity for question image (fade out during transition)
  const questionOpacity = interpolate(
    transitionProgress,
    [0, 0.3],
    [1, 0],
    {
      extrapolateRight: "clamp",
    }
  );
  
  // Opacity for answer image (fade in during transition)
  const answerOpacity = interpolate(
    transitionProgress,
    [0, 1],
    [0, 1],
    {
      extrapolateRight: "clamp",
    }
  );

  return (
    <div
      style={{
        position: "absolute",
        left: "80px",
        top: "50%",
        transform: `translate(${translateX}px, -50%)`,
        width: "700px",
        height: "700px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "40px",
          border: "6px solid #ffffff",
          boxShadow: "0 8px 0 rgba(0, 0, 0, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
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
            borderRadius: "36px",
            opacity: questionOpacity,
          }}
        />

        {/* Answer Image */}
        {frame >= transitionStartFrame && (
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
              borderRadius: "36px",
              opacity: answerOpacity,
            }}
          />
        )}
      </div>
    </div>
  );
};
