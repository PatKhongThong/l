import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useShipStore } from '../store/useShipStore';
import { SpaceEnvironment } from './SpaceEnvironment';
import { FlightController } from './FlightController';
import { ShipInteriorScene } from './ShipInteriorScene';
import { EvaController } from './EvaController';
import { EarthSurfaceScene } from './EarthSurfaceScene';
import { EscapePodFlight } from './EscapePodFlight';

export const StarshipScene: React.FC = () => {
  const playerMode = useShipStore((s) => s.playerMode);
  const onEarthScene =
    playerMode === 'earth_cutscene' || playerMode === 'earth_surface' || playerMode === 'earth_liftoff';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ fov: 68, near: 0.2, far: 250000000, position: [0, 10, 40] }}
        gl={{ antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true }}
        dpr={[1, 1.75]}
      >
        {onEarthScene ? (
          <EarthSurfaceScene />
        ) : (
          <>
            <SpaceEnvironment />
            {playerMode === 'flight' && <FlightController />}
            {playerMode === 'interior' && <ShipInteriorScene />}
            {playerMode === 'eva' && <EvaController />}
            {playerMode === 'escape_pod' && <EscapePodFlight />}
          </>
        )}
      </Canvas>
    </div>
  );
};
