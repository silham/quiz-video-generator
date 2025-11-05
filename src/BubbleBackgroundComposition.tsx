import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { BubbleBackground } from "./Quiz/BubbleBackground";

export const bubbleBackgroundSchema = z.object({
  bubbleCount: z.number().default(40),
  bgColor: zColor(),
});

export const BubbleBackgroundComposition: React.FC<
  z.infer<typeof bubbleBackgroundSchema>
> = ({ bubbleCount, bgColor }) => {
  return (
    <AbsoluteFill>
      <BubbleBackground bubbleCount={bubbleCount} bgColor={bgColor} />
    </AbsoluteFill>
  );
};
