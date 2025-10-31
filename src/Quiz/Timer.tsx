import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Timer: React.FC<{
  readonly time: number;
  readonly startTime?: number; // in seconds, when to start filling the timer
}> = ({ time, startTime = 0 }) => {
  const videoConfig = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / videoConfig.fps;

  // Calculate fill progress using linear animation
  let widthPercent = 0;

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
  }

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", paddingRight: "80px" }}>
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
            transition: "width 0.05s linear",
            borderRadius: "40px",
          }}
        />
      </div>
    </div>
  );
};
