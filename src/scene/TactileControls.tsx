import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Physical 3D Industrial Toggle Switch with animated metal lever & glowing status LED
 */
export const PhysicalToggleSwitch: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  label: string;
  active: boolean;
  onToggle: () => void;
  onColor?: string;
  offColor?: string;
}> = ({ position, rotation = [0, 0, 0], label, active, onToggle, onColor = '#10b981', offColor = '#ef4444' }) => {
  const leverRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, dt) => {
    if (!leverRef.current) return;
    const targetX = active ? -0.55 : 0.55;
    leverRef.current.rotation.x = THREE.MathUtils.lerp(leverRef.current.rotation.x, targetX, Math.min(1, dt * 14));
  });

  const ledColor = active ? onColor : offColor;

  return (
    <group position={position} rotation={rotation}>
      {/* Beveled Gunmetal Switch Plate */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[0.38, 0.52, 0.08]} />
        <meshStandardMaterial color={hovered ? '#334155' : '#1e293b'} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Glowing Status LED */}
      <mesh position={[0, 0.17, 0.05]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshBasicMaterial color={ledColor} />
      </mesh>
      {/* Switch Collar */}
      <mesh position={[0, -0.02, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.06, 10]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Articulated Metal Toggle Lever */}
      <group ref={leverRef} position={[0, -0.02, 0.06]}>
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.026, 0.018, 0.2, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0, 0.2]}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={0.6} />
        </mesh>
      </group>
      {hovered && (
        <Html position={[0, 0.36, 0.12]} center distanceFactor={8}>
          <div
            style={{
              background: 'rgba(2, 6, 14, 0.92)',
              border: `1px solid ${ledColor}`,
              color: '#fff',
              padding: '2px 6px',
              fontSize: 8.5,
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {label}: {active ? 'ON' : 'OFF'}
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * Physical 3D Recessed Illuminated Push-Button (depresses smoothly on click!)
 */
export const PhysicalPushButton: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  label: string;
  color?: string;
  onPress: () => void;
}> = ({ position, rotation = [0, 0, 0], label, color = '#f59e0b', onPress }) => {
  const capRef = useRef<THREE.Mesh>(null);
  const pressAnim = useRef(0);
  const [hovered, setHovered] = useState(false);

  useFrame((_, dt) => {
    pressAnim.current = Math.max(0, pressAnim.current - dt * 5);
    if (capRef.current) {
      capRef.current.position.z = 0.08 - pressAnim.current * 0.055;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    pressAnim.current = 1;
    onPress();
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Guarded Outer Bezel */}
      <mesh>
        <boxGeometry args={[0.46, 0.32, 0.1]} />
        <meshStandardMaterial color="#181f2a" metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Illuminated Button Cap */}
      <mesh
        ref={capRef}
        position={[0, 0, 0.08]}
        onClick={handleClick}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[0.34, 0.2, 0.09]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.35 : 0.65}
          metalness={0.3}
          roughness={0.35}
        />
      </mesh>
      {hovered && (
        <Html position={[0, 0.28, 0.12]} center distanceFactor={8}>
          <div
            style={{
              background: 'rgba(2, 6, 14, 0.92)',
              border: `1px solid ${color}`,
              color: '#fff',
              padding: '2px 7px',
              fontSize: 8.5,
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            ▸ {label}
          </div>
        </Html>
      )}
    </group>
  );
};

