import type { HTMLAttributes } from 'react';

export interface HoloMosaicProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  metalColor?: string;
  spectrum?: 'full' | 'warm' | 'cool' | 'pearl';
  tileSize?: number;
  gap?: number;
  roundness?: number;
  bevel?: number;
  rotation?: number;
  scatter?: number;
  tilt?: number;
  swirl?: number;
  ripple?: number;
  bands?: number;
  softness?: number;
  intensity?: number;
  saturation?: number;
  glitter?: number;
  sheen?: number;
  grain?: number;
  speed?: number;
  variation?: number;
  filter?: 'none' | 'ascii' | 'dither';
  filterSize?: number;
  fade?: number;
  opacity?: number;
  intro?: boolean;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  flipOnClick?: boolean;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
  className?: string;
}

declare const HoloMosaic: React.FC<HoloMosaicProps>;
export default HoloMosaic;

