import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SHIP_LIVERIES } from '../store/useShipStore';
import { RemotePlayer } from '../utils/multiplayer';
import { getHullTexture } from '../utils/proceduralTextures';

export const RemoteShipModel: React.FC<{ player: RemotePlayer }> = ({ player }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftFlameRef = useRef<THREE.Mesh>(null);
  const rightFlameRef = useRef<THREE.Mesh>(null);

  const livery = SHIP_LIVERIES.find((l) => l.id === player.liveryId) || SHIP_LIVERIES[0];
  const hullTex = useMemo(() => getHullTexture(livery.hullColor, livery.accentColor), [livery]);

  const targetPos = useRef(new THREE.Vector3(...player.position));
  const targetQuat = useRef(new THREE.Quaternion(...player.quaternion));

  targetPos.current.set(...player.position);
  targetQuat.current.set(...player.quaternion);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    // Smooth 60fps network interpolation so other players' ships fly smoothly
    groupRef.current.position.lerp(targetPos.current, Math.min(1, dt * 10));
    groupRef.current.quaternion.slerp(targetQuat.current, Math.min(1, dt * 10));

    const flicker = 0.85 + Math.sin(state.clock.elapsedTime * 34) * 0.15;
    if (leftFlameRef.current) leftFlameRef.current.scale.set(1, 1, 0.85 * flicker);
    if (rightFlameRef.current) rightFlameRef.current.scale.set(1, 1, 0.85 * flicker);
  });

  return (
    <group ref={groupRef} position={player.position} quaternion={player.quaternion} scale={2.4}>
      {/* Main Armored Fuselage */}
      <mesh>
        <boxGeometry args={[1.9, 0.85, 5.6]} />
        <meshStandardMaterial map={hullTex} metalness={0.78} roughness={0.32} />
      </mesh>

      {/* Upper Command Deck */}
      <mesh position={[0, 0.55, -0.4]}>
        <boxGeometry args={[1.35, 0.42, 3.2]} />
        <meshStandardMaterial map={hullTex} metalness={0.82} roughness={0.28} />
      </mesh>

      {/* Forward Bow Cone */}
      <mesh position={[0, -0.04, -3.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1.05, 2.35, 4]} />
        <meshStandardMaterial map={hullTex} metalness={0.84} roughness={0.26} />
      </mesh>

      {/* Forward Mandibles */}
      <mesh position={[-0.86, -0.1, -2.65]}>
        <boxGeometry args={[0.38, 0.3, 2.4]} />
        <meshStandardMaterial color="#111927" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0.86, -0.1, -2.65]}>
        <boxGeometry args={[0.38, 0.3, 2.4]} />
        <meshStandardMaterial color="#111927" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Bridge Canopy */}
      <mesh position={[0, 0.66, -1.35]} scale={[1.05, 0.55, 1.75]}>
        <sphereGeometry args={[0.62, 16, 12]} />
        <meshStandardMaterial
          color={livery.accentColor}
          emissive={livery.accentColor}
          emissiveIntensity={0.45}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Swept Delta Wings */}
      <mesh position={[-2.35, -0.06, 0.65]} rotation={[0, 0.28, -0.08]}>
        <boxGeometry args={[3.4, 0.2, 2.05]} />
        <meshStandardMaterial map={hullTex} metalness={0.82} roughness={0.3} />
      </mesh>
      <mesh position={[2.35, -0.06, 0.65]} rotation={[0, -0.28, 0.08]}>
        <boxGeometry args={[3.4, 0.2, 2.05]} />
        <meshStandardMaterial map={hullTex} metalness={0.82} roughness={0.3} />
      </mesh>

      {/* Leading-Edge Accent Trim */}
      <mesh position={[-2.35, 0.02, -0.36]} rotation={[0, 0.28, -0.08]}>
        <boxGeometry args={[3.2, 0.06, 0.06]} />
        <meshBasicMaterial color={livery.accentColor} />
      </mesh>
      <mesh position={[2.35, 0.02, -0.36]} rotation={[0, -0.28, 0.08]}>
        <boxGeometry args={[3.2, 0.06, 0.06]} />
        <meshBasicMaterial color={livery.accentColor} />
      </mesh>

      {/* Twin Tail Fins */}
      <mesh position={[-1.55, 0.62, 1.95]} rotation={[0.25, 0, 0.24]}>
        <boxGeometry args={[0.16, 1.25, 1.45]} />
        <meshStandardMaterial map={hullTex} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[1.55, 0.62, 1.95]} rotation={[0.25, 0, -0.24]}>
        <boxGeometry args={[0.16, 1.25, 1.45]} />
        <meshStandardMaterial map={hullTex} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Twin Plasma Engine Nacelles & Plumes */}
      <mesh position={[-1.05, -0.05, 2.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.54, 1.75, 14]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.05, -0.05, 2.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.54, 1.75, 14]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh ref={leftFlameRef} position={[-1.05, -0.05, 4.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.36, 2.0, 12]} />
        <meshBasicMaterial color={livery.accentColor} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={rightFlameRef} position={[1.05, -0.05, 4.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.36, 2.0, 12]} />
        <meshBasicMaterial color={livery.accentColor} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Wingtip Nav Strobes + Friendly Fleet Beacon */}
      <mesh position={[-3.95, -0.2, 1.15]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[3.95, -0.2, 1.15]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color="#34d399" distance={45} intensity={2.2} />

      {/* Floating Fleet Callsign & Role Tag */}
      <Html position={[0, 2.8, 0]} center distanceFactor={45}>
        <div
          style={{
            background: 'rgba(4, 20, 16, 0.9)',
            border: '1px solid #34d399',
            color: '#6ee7b7',
            padding: '2px 7px',
            fontSize: 9.5,
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.35)',
          }}
        >
          ★ {player.callsign} • {player.job} [{player.rank}]
        </div>
      </Html>
    </group>
  );
};

