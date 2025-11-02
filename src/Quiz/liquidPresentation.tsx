import type {TransitionPresentationComponentProps} from '@remotion/transitions';
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
 
export type CustomPresentationProps = {
  width: number;
  height: number;
};

// Generate liquid blob shapes
const generateLiquidPath = (progress: number, seed: number, index: number) => {
  const blobSeed = random(`blob-${seed}-${index}`);
  
  // Random starting position from left edge
  const startY = random(`blob-y-${seed}-${index}`) * 100;
  
  // Calculate horizontal progress (blobs flow from left to right)
  const xProgress = interpolate(
    progress,
    [0, 1],
    [-30, 130], // Start off-screen left, end off-screen right
  );
  
  // Add some vertical wave motion
  const wave = Math.sin(progress * Math.PI * 2 + index) * 10;
  
  // Blob size - varies per blob
  const size = 10 + blobSeed * 25;
  const width = size * (1.5 + Math.sin(progress * Math.PI * 4) * 0.3);
  const height = size * (1 + Math.cos(progress * Math.PI * 3) * 0.2);
  
  const cx = xProgress;
  const cy = startY + wave;
  
  // Create organic blob shape using ellipse with multiple points
  return `M ${cx - width},${cy}
          Q ${cx - width},${cy - height} ${cx},${cy - height}
          Q ${cx + width},${cy - height} ${cx + width},${cy}
          Q ${cx + width},${cy + height} ${cx},${cy + height}
          Q ${cx - width},${cy + height} ${cx - width},${cy}
          Z`;
};
 
const LiquidPresentationComponent: React.FC<
  TransitionPresentationComponentProps<CustomPresentationProps>
> = ({children, presentationDirection, presentationProgress, passedProps}) => {
  
  const clipPath = useMemo(() => {
    const blobs: string[] = [];
    const numBlobs = 12;
    const seed = Math.random();
    
    for (let i = 0; i < numBlobs; i++) {
      blobs.push(generateLiquidPath(presentationProgress, seed, i));
    }
    
    return blobs.join(' ');
  }, [presentationProgress]);
  
  const clipId = useMemo(() => `liquid-${Math.random()}`, []);
  
  const style: React.CSSProperties = useMemo(() => {
    return {
      width: '100%',
      height: '100%',
      clipPath: presentationDirection === 'exiting' ? undefined : `url(#${clipId})`,
    };
  }, [clipId, presentationDirection]);
 
  return (
    <AbsoluteFill>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {presentationDirection === 'exiting' ? null : (
        <AbsoluteFill>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                <path 
                  d={clipPath} 
                  fill="white"
                  transform="scale(0.01, 0.01)"
                />
              </clipPath>
            </defs>
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const liquidPresentation = (props: CustomPresentationProps) => {
  return {
    component: LiquidPresentationComponent,
    props,
  };
};