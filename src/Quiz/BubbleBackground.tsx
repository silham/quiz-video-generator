import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";

const Bubble: React.FC<{
  index: number;
  startFrame: number;
}> = ({ index, startFrame }) => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  // Use only index for consistent randomization (not startFrame to avoid issues)
  const startX = random(`bubble-x-${index}`) * width;
  const size = 20 + random(`bubble-size-${index}`) * 60; // 20-80px
  const duration = 180 + random(`bubble-duration-${index}`) * 120; // 180-300 frames (fixed duration)
  const drift = (random(`bubble-drift-${index}`) - 0.5) * 100; // -50 to 50px drift
  const opacity = 0.15 + random(`bubble-opacity-${index}`) * 0.25; // 0.15-0.4

  // Animate from bottom to top
  const framesSinceStart = frame - startFrame;
  const progress = Math.min(1, Math.max(0, framesSinceStart / duration));
  
  const y = interpolate(progress, [0, 1], [height + size, -size], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Horizontal drift
  const x = startX + Math.sin(progress * Math.PI * 2) * drift;

  // Pop effect near the top
  const popProgress = interpolate(progress, [0.85, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scale effect (slight grow then pop)
  const scale = interpolate(progress, [0, 0.1, 0.9, 1], [0.5, 1, 1.1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Only show if in valid progress range
  if (framesSinceStart < 0 || progress > 1) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: `rgba(255, 255, 255, ${opacity * popProgress})`,
        border: `2px solid rgba(255, 255, 255, ${opacity * 0.5 * popProgress})`,
        transform: `scale(${scale})`,
        pointerEvents: "none",
      }}
    />
  );
};

export const BubbleBackground: React.FC<{
  bubbleCount?: number;
}> = ({ bubbleCount = 30 }) => {
  const frame = useCurrentFrame();

  // Generate bubbles continuously - spawn new bubbles every N frames
  const spawnInterval = 10; // New bubble every 10 frames
  const maxBubbleDuration = 300; // Maximum duration a bubble can live
  
  // Calculate which bubbles should be visible based on current frame
  const visibleBubbles: Array<{ index: number; startFrame: number }> = [];
  
  // Only look at frames where bubbles actually spawn (every spawnInterval)
  const startSearchFrame = Math.max(0, frame - maxBubbleDuration);
  const firstBubbleIndex = Math.ceil(startSearchFrame / spawnInterval);
  const currentBubbleIndex = Math.floor(frame / spawnInterval);
  
  // Generate only bubbles that should exist in this timeframe
  for (let bubbleIndex = firstBubbleIndex; bubbleIndex <= currentBubbleIndex; bubbleIndex++) {
    const startFrame = bubbleIndex * spawnInterval;
    visibleBubbles.push({
      index: bubbleIndex,
      startFrame: startFrame,
    });
  }
  
  // Limit total number of bubbles on screen
  const limitedBubbles = visibleBubbles.slice(-bubbleCount);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        backgroundColor: "#ee3452",
      }}
    >
      {limitedBubbles.map((bubble) => (
        <Bubble
          key={`bubble-${bubble.startFrame}-${bubble.index}`}
          index={bubble.index}
          startFrame={bubble.startFrame}
        />
      ))}
    </div>
  );
};
