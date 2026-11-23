import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/useShipStore';
import { PlayerShipModel } from './PlayerShipModel';

const podKeys: Record<string, boolean> = {};

export const EscapePodFlight: React.FC = () => {
  const { camera } = useThree();
  const shipPos = useShipStore((s) => s.position);
  const shipQuat = useShipStore((s) => s.quaternion);

  const podRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const podPos = useRef(new THREE.Vector3(shipPos[0] + 8, shipPos[1] + 2, shipPos[2] + 4));
  const podVel = useRef(new THREE.Vector3(18, 4, 12));
  const podQuat = useRef(new THREE.Quaternion());
  const camPos = useRef(new THREE.Vector3(shipPos[0] + 14, shipPos[1] + 5, shipPos[2] + 12));

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      podKeys[e.code] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      podKeys[e.code] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      Object.keys(podKeys).forEach((k) => {
        podKeys[k] = false;
      });
    };
  }, []);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useShipStore.getState();

    const pitch = ((podKeys['ArrowUp'] ? 1 : 0) - (podKeys['ArrowDown'] ? 1 : 0)) * 1.8 * dt;
    const yaw = ((podKeys['ArrowLeft'] ? 1 : 0) - (podKeys['ArrowRight'] ? 1 : 0)) * 1.8 * dt;
    const roll = ((podKeys['KeyA'] ? 1 : 0) - (podKeys['KeyD'] ? 1 : 0)) * 2.0 * dt;
    const thrust = (podKeys['KeyW'] ? 1 : 0) - (podKeys['KeyS'] ? 0.6 : 0);

    const dq = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ'));
    podQuat.current.multiply(dq).normalize();

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(podQuat.current);
    if (thrust !== 0) {
      podVel.current.addScaledVector(forward, thrust * 38 * dt);
    }
    if (podKeys['Space']) {
      podVel.current.multiplyScalar(Math.exp(-dt * 4.5));
    } else {
      podVel.current.multiplyScalar(Math.exp(-dt * 0.8));
    }

    podPos.current.addScaledVector(podVel.current, dt);

    if (podRef.current) {
      podRef.current.position.copy(podPos.current);
      podRef.current.quaternion.copy(podQuat.current);
    }
    if (flameRef.current) {
      const f = 0.85 + Math.sin(state.clock.elapsedTime * 42) * 0.15;
      flameRef.current.scale.set(1, 1, (Math.abs(thrust) > 0.1 ? 1.5 : 0.45) * f);
    }

    // Smooth chase camera behind the ejected CP-12 Escape Pod
    const desiredCam = new THREE.Vector3(0, 2.2, 7.2).applyQuaternion(podQuat.current).add(podPos.current);
    camPos.current.lerp(desiredCam, Math.min(1, dt * 8));
    camera.position.copy(camPos.current);
    camera.lookAt(podPos.current);

    s.applyTick({ simTime: s.simTime + dt, speed: podVel.current.length() });
  });

  return (
    <group>
      {/* Your Main Starship Drifting Behind You After Ejection */}
      <group position={shipPos} quaternion={shipQuat}>
        <PlayerShipModel />
      </group>

      {/* Playable 3D CP-12 Armored Escape Pod */}
      <group ref={podRef}>
        <mesh>
          <boxGeometry args={[1.4, 1.1, 2.8]} />
          <meshStandardMaterial color="#b4a68b" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Tactical Blue Side Trim */}
        <mesh position={[-0.72, 0, 0]}>
          <boxGeometry args={[0.06, 0.35, 2.3]} />
          <meshStandardMaterial color="#24527a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.72, 0, 0]}>
          <boxGeometry args={[0.06, 0.35, 2.3]} />
          <meshStandardMaterial color="#24527a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Front Smoked Viewport */}
        <mesh position={[0, 0.25, -1.25]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.92, 0.55, 0.4]} />
          <meshStandardMaterial color="#11161d" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Glowing Emergency Beacon */}
        <pointLight position={[0, 0.9, 0]} color="#ff4d1a" distance={18} intensity={3.5} />
        {/* Orange Retro-Thruster Exhaust Plume */}
        <mesh ref={flameRef} position={[0, 0, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.42, 1.8, 12]} />
          <meshBasicMaterial color="#ff5a1f" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
};

