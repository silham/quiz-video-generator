import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const Question: React.FC<{
  readonly questionText: string;
}> = ({ questionText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide in animation from the right
  const slideProgress = spring({
    frame,
    fps,
    config: {
      damping: 30,
      stiffness: 100,
    },
  });

  const translateX = interpolate(slideProgress, [0, 1], [1000, 0]);

  return (
    <div
      style={{
        position: "absolute",
        right: "80px",
        top: "190px",
        transform: `translate(${translateX}px, 0)`,
        width: "60%",
        maxWidth: "1000px",
      }}
    >
      <div
        style={{
          backgroundColor: "#f9d013",
          borderRadius: "40px",
          padding: "60px 80px",
          border: "4px solid #eee",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
          height: "550px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          
        }}
      >
        <p
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "#000000",
            margin: 0,
            lineHeight: 1.3,
            textAlign: "center",
          }}
        >
          {questionText}
        </p>
      </div>
    </div>
  );
};