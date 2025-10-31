import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from "remotion";

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
        width: "40%",
        maxWidth: "700px",
        height: "700px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "40px",
          border: "4px solid #eee",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Question Image */}
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Img
            src={staticFile(questionImageSrc)}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: "20px",
              opacity: questionOpacity,
              transition: "opacity 0.3s ease-out",
            }}
          />

          {/* Answer Image with Wave Effect */}
          {frame >= transitionStartFrame && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: "20px",
                opacity: answerOpacity,
              }}
            >
              <Img
                src={staticFile(answerImageSrc)}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: "20px",
                }}
              />
              {/* Wave effect mask */}
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <clipPath id="wave-clip">
                    {[...Array(15)].map((_, i) => {
                      const waveProgress = Math.min(
                        1,
                        Math.max(0, (frame - transitionStartFrame - i * 2) / transitionDuration)
                      );
                      const waveY = interpolate(waveProgress, [0, 1], [100, -20]);

                      return (
                        <path
                          key={i}
                          d={`M 0,${waveY + i * 1.5} Q 25,${waveY + i * 1.5 - 8} 50,${waveY + i * 1.5} T 100,${waveY + i * 1.5} L 100,100 L 0,100 Z`}
                          fill="white"
                        />
                      );
                    })}
                  </clipPath>
                </defs>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
