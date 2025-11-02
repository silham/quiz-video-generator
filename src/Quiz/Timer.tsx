import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Timer: React.FC<{
  readonly time: number;
  readonly startTime?: number; // in seconds, when to start filling the timer
  readonly fadeInDuration?: number; // in seconds, default 0.5
  readonly fadeOutDuration?: number; // in seconds, default 0.5
}> = ({ time, startTime = 0, fadeInDuration = 0.2, fadeOutDuration = 0.5 }) => {
  const videoConfig = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / videoConfig.fps;

  // Calculate fill progress using linear animation
  let widthPercent = 0;
  let opacity = 0;

  if (currentTime >= startTime) {
    // Calculate how many frames have passed since startTime
    const framesSinceStart = frame - startTime * videoConfig.fps;
    const totalFramesForFill = time * videoConfig.fps;
    
    // Use linear interpolation for steady fill
    const fillProgress = interpolate(
      framesSinceStart,
      [0, totalFramesForFill],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    widthPercent = fillProgress * 100;

    // Fade in animation at the start
    const fadeInFrames = fadeInDuration * videoConfig.fps;
    const fadeInProgress = interpolate(
      framesSinceStart,
      [0, fadeInFrames],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    // Fade out animation after timer completes
    const fadeOutStartFrame = totalFramesForFill;
    const fadeOutFrames = fadeOutDuration * videoConfig.fps;
    const fadeOutProgress = interpolate(
      framesSinceStart,
      [fadeOutStartFrame, fadeOutStartFrame + fadeOutFrames],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    // Combine fade in and fade out
    opacity = Math.min(fadeInProgress, fadeOutProgress);
  }

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", paddingRight: "80px", opacity }}>
      <div
        style={{
          width: "1000px",
          height: "80px",
          backgroundColor: "#ddd",
          borderRadius: "40px",
          overflow: "hidden",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          position: "relative",
        }}
      >
        {/* Diagonal stripes background */}
        <div
          style={{
            width: `${widthPercent}%`,
            height: "100%",
            background: `repeating-linear-gradient(
              45deg,
              #7ed957,
              #7ed957 20px,
              #6bc947 20px,
              #6bc947 40px
            )`,
            borderRadius: "40px",
          }}
        />
      </div>
    </div>
  );
};
