import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/useShipStore';

export const CockpitInterior: React.FC = () => {
  const yokeRef = useRef<THREE.Group>(null);
  const throttleLeverRef = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Group>(null);
  const cabinLightRef = useRef<THREE.PointLight>(null);
  const trimMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const s = useShipStore.getState();
    if (yokeRef.current) {
      yokeRef.current.rotation.x = THREE.MathUtils.lerp(yokeRef.current.rotation.x, s.angularVelocity[0] * 0.45, 0.15);
      yokeRef.current.rotation.z = THREE.MathUtils.lerp(yokeRef.current.rotation.z, s.angularVelocity[2] * 0.5, 0.15);
    }
    if (throttleLeverRef.current) {
      const targetRot = -s.throttle * 0.55;
      throttleLeverRef.current.rotation.x = THREE.MathUtils.lerp(throttleLeverRef.current.rotation.x, targetRot, 0.15);
    }
    if (reticleRef.current) {
      reticleRef.current.rotation.z += 0.004;
    }
    if (cabinLightRef.current) {
      if (s.redAlert) {
        cabinLightRef.current.color.set('#ef4444');
        cabinLightRef.current.intensity = 0.8 + Math.abs(Math.sin(state.clock.elapsedTime * 4.5)) * 1.6;
      } else {
        cabinLightRef.current.color.set('#00e5ff');
        cabinLightRef.current.intensity = 0.95;
      }
    }
    if (trimMatRef.current) {
      trimMatRef.current.color.set(s.redAlert ? '#ef4444' : '#00e5ff');
    }
  });

  return (
    <group position={[0, 0.35, -0.8]}>
      {/* Dynamic Bridge Lighting (Cyan normal / Pulsing Crimson in Red Alert) */}
      <pointLight ref={cabinLightRef} position={[0, 0.2, -0.7]} color="#00e5ff" intensity={0.95} distance={5} />

      {/* Lower Instrument Dashboard Shelf */}
      <mesh position={[0, -0.58, -1.05]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[2.35, 0.22, 0.98]} />
        <meshStandardMaterial color="#0b1322" metalness={0.78} roughness={0.38} />
      </mesh>

      {/* Recessed Glowing Instrument Displays */}
      <mesh position={[-0.55, -0.45, -1.02]} rotation={[-0.35, 0.12, 0]}>
        <planeGeometry args={[0.48, 0.24]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.32} />
      </mesh>
      <mesh position={[0.55, -0.45, -1.02]} rotation={[-0.35, -0.12, 0]}>
        <planeGeometry args={[0.48, 0.24]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.32} />
      </mesh>

      {/* Glowing Trim Strip along Dashboard */}
      <mesh position={[0, -0.45, -1.46]}>
        <boxGeometry args={[2.12, 0.018, 0.02]} />
        <meshBasicMaterial ref={trimMatRef} color="#00e5ff" />
      </mesh>

      {/* Left Canopy Strut */}
      <mesh position={[-1.02, 0.25, -1.15]} rotation={[0.42, 0.22, -0.32]}>
        <boxGeometry args={[0.075, 1.55, 0.09]} />
        <meshStandardMaterial color="#111a2b" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[-0.98, 0.25, -1.12]} rotation={[0.42, 0.22, -0.32]}>
        <boxGeometry args={[0.014, 1.45, 0.014]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.65} />
      </mesh>

      {/* Right Canopy Strut */}
      <mesh position={[1.02, 0.25, -1.15]} rotation={[0.42, -0.22, 0.32]}>
        <boxGeometry args={[0.075, 1.55, 0.09]} />
        <meshStandardMaterial color="#111a2b" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0.98, 0.25, -1.12]} rotation={[0.42, -0.22, 0.32]}>
        <boxGeometry args={[0.014, 1.45, 0.014]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.65} />
      </mesh>

      {/* Upper Overhead Canopy Brow */}
      <mesh position={[0, 0.92, -0.82]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1.9, 0.14, 0.45]} />
        <meshStandardMaterial color="#0b1220" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.84, -1.0]}>
        <boxGeometry args={[1.5, 0.015, 0.015]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} />
      </mesh>

      {/* Side Armrest Consoles */}
      <mesh position={[-1.08, -0.52, -0.45]} rotation={[0, 0.18, 0]}>
        <boxGeometry args={[0.42, 0.3, 1.2]} />
        <meshStandardMaterial color="#0d1626" metalness={0.75} roughness={0.42} />
      </mesh>
      <mesh position={[1.08, -0.52, -0.45]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[0.42, 0.3, 1.2]} />
        <meshStandardMaterial color="#0d1626" metalness={0.75} roughness={0.42} />
      </mesh>

      {/* Physical Left Throttle Lever */}
      <group position={[-0.78, -0.42, -0.82]}>
        <mesh ref={throttleLeverRef} position={[0, 0.08, 0]}>
          <boxGeometry args={[0.14, 0.16, 0.06]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* Physical Right Flight Stick / Yoke */}
      <group ref={yokeRef} position={[0.75, -0.46, -0.82]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.025, 0.032, 0.22, 10]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <boxGeometry args={[0.06, 0.05, 0.06]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* 3D Holographic Windshield Reticle */}
      <group ref={reticleRef} position={[0, 0.02, -1.8]}>
        <mesh>
          <ringGeometry args={[0.085, 0.092, 32]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
};
