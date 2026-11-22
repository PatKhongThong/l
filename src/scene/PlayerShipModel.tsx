import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENGINE_MODELS, SHIP_LIVERIES, useShipStore } from '../store/useShipStore';
import { getHullTexture } from '../utils/proceduralTextures';

const DamageSpark: React.FC<{ position: [number, number, number]; active: boolean }> = ({ position, active }) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.elapsedTime;
    const pulse = Math.sin(t * 26) * Math.cos(t * 13) > 0.2 ? 1 : 0.15;
    if (lightRef.current) lightRef.current.intensity = pulse * 4.5;
    if (meshRef.current) meshRef.current.scale.setScalar(0.6 + pulse * 0.8);
  });

  if (!active) return null;
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshBasicMaterial color="#fb923c" />
      </mesh>
      <pointLight ref={lightRef} color="#f97316" distance={9} intensity={3} />
    </group>
  );
};

export const PlayerShipModel: React.FC = () => {
  const liveryId = useShipStore((s) => s.liveryId);
  const installedEngineId = useShipStore((s) => s.installedEngineId);
  const roofPart = useShipStore((s) => s.roofPart);
  const aeroPart = useShipStore((s) => s.aeroPart);
  const nosePart = useShipStore((s) => s.nosePart);
  const boosterPart = useShipStore((s) => s.boosterPart);
  const underglowColor = useShipStore((s) => s.underglowColor);
  const components = useShipStore((s) => s.components);
  const livery = SHIP_LIVERIES.find((l) => l.id === liveryId) || SHIP_LIVERIES[0];
  const engineModel = ENGINE_MODELS.find((e) => e.id === installedEngineId) || ENGINE_MODELS[0];

  const hullTex = useMemo(() => getHullTexture(livery.hullColor, livery.accentColor), [livery]);

  const leftFlameRef = useRef<THREE.Mesh>(null);
  const rightFlameRef = useRef<THREE.Mesh>(null);
  const dishRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const strobeRef = useRef<THREE.PointLight>(null);
  const miningBeamRef = useRef<THREE.Mesh>(null);
  const cannonLeftRef = useRef<THREE.Mesh>(null);
  const cannonRightRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const s = useShipStore.getState();
    const thrustVisual = s.enginesOnline
      ? Math.max(0.18, Math.abs(s.throttle) * 1.45 + (s.boostActive ? 1.25 : 0) + (s.overdriveTimer > 0 ? 1.6 : 0) + s.speed * 0.015)
      : 0.02;

    if (miningBeamRef.current) {
      miningBeamRef.current.visible = s.miningLaserActive > 0.05;
      miningBeamRef.current.scale.set(1, 1, 1);
    }
    if (cannonLeftRef.current && cannonRightRef.current) {
      const showCannon = s.cannonPulse > 0.05;
      cannonLeftRef.current.visible = showCannon;
      cannonRightRef.current.visible = showCannon;
      const zPos = -5 - (1 - s.cannonPulse) * 48;
      cannonLeftRef.current.position.z = zPos;
      cannonRightRef.current.position.z = zPos;
    }

    const flicker = 0.92 + Math.sin(state.clock.elapsedTime * 38) * 0.08;
    if (leftFlameRef.current) {
      leftFlameRef.current.scale.set(1, 1, thrustVisual * flicker);
      leftFlameRef.current.visible = s.enginesOnline;
    }
    if (rightFlameRef.current) {
      rightFlameRef.current.scale.set(1, 1, thrustVisual * flicker);
      rightFlameRef.current.visible = s.enginesOnline;
    }
    if (dishRef.current && s.commsOnline) {
      dishRef.current.rotation.y += dt * 0.6;
    }
    if (shieldRef.current) {
      const mat = shieldRef.current.material as THREE.MeshBasicMaterial;
      const baseOpacity = s.shieldsOnline && s.shields > 1 ? 0.04 + s.shieldImpactFlash * 0.38 : 0;
      mat.opacity = baseOpacity;
      shieldRef.current.visible = baseOpacity > 0.005;
    }
    if (strobeRef.current) {
      strobeRef.current.intensity = Math.sin(state.clock.elapsedTime * 5) > 0.7 ? 2.8 : 0.2;
    }
  });

  return (
    <group scale={2.4}>
      {/* Main Armored Fuselage Spine */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.85, 5.6]} />
        <meshStandardMaterial map={hullTex} metalness={0.78} roughness={0.32} />
      </mesh>

      {/* Upper Command Deck Hull Tier */}
      <mesh position={[0, 0.55, -0.4]}>
        <boxGeometry args={[1.35, 0.42, 3.2]} />
        <meshStandardMaterial map={hullTex} metalness={0.82} roughness={0.28} />
      </mesh>

      {/* Forward Armored Bow / Nose */}
      <mesh position={[0, -0.04, -3.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1.05, 2.35, 4]} />
        <meshStandardMaterial map={hullTex} metalness={0.84} roughness={0.26} />
      </mesh>

      {/* Forward Twin Sensor Mandibles */}
      <mesh position={[-0.86, -0.1, -2.65]}>
        <boxGeometry args={[0.38, 0.3, 2.4]} />
        <meshStandardMaterial color="#111927" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0.86, -0.1, -2.65]}>
        <boxGeometry args={[0.38, 0.3, 2.4]} />
        <meshStandardMaterial color="#111927" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Ventral Pressurized Cargo Module */}
      <mesh position={[0, -0.58, 0.45]}>
        <boxGeometry args={[1.45, 0.48, 2.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.72} roughness={0.42} />
      </mesh>

      {/* Port & Starboard Escape Pod Bays */}
      <mesh position={[-1.08, 0.25, 0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.4, 12]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[1.08, 0.25, 0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.4, 12]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Dorsal Docking Ring / Airlock Collar */}
      <mesh position={[0, 0.82, 0.55]}>
        <cylinderGeometry args={[0.52, 0.58, 0.18, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.92, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.04, 8, 20]} />
        <meshBasicMaterial color={livery.accentColor} />
      </mesh>

      {/* Articulated Subspace Communications Dish */}
      <group ref={dishRef} position={[0, 0.96, -0.8]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.3, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.34, 0.08]} rotation={[0.55, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.08, 0.14, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* Bridge Observation Canopy */}
      <mesh position={[0, 0.66, -1.35]} scale={[1.05, 0.55, 1.75]}>
        <sphereGeometry args={[0.62, 20, 14]} />
        <meshStandardMaterial
          color={livery.accentColor}
          emissive={livery.accentColor}
          emissiveIntensity={0.38}
          metalness={0.92}
          roughness={0.08}
          transparent
          opacity={0.78}
        />
      </mesh>

      {/* Swept Armored Delta Wings */}
      <mesh position={[-2.35, -0.06, 0.65]} rotation={[0, 0.28, -0.08]}>
        <boxGeometry args={[3.4, 0.2, 2.05]} />
        <meshStandardMaterial map={hullTex} metalness={0.82} roughness={0.3} />
      </mesh>
      <mesh position={[2.35, -0.06, 0.65]} rotation={[0, -0.28, 0.08]}>
        <boxGeometry args={[3.4, 0.2, 2.05]} />
        <meshStandardMaterial map={hullTex} metalness={0.82} roughness={0.3} />
      </mesh>

      {/* Twin Angled Stabilizer Tail Fins */}
      <mesh position={[-1.55, 0.62, 1.95]} rotation={[0.25, 0, 0.24]}>
        <boxGeometry args={[0.16, 1.25, 1.45]} />
        <meshStandardMaterial map={hullTex} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[1.55, 0.62, 1.95]} rotation={[0.25, 0, -0.24]}>
        <boxGeometry args={[0.16, 1.25, 1.45]} />
        <meshStandardMaterial map={hullTex} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Glowing Leading-Edge Accent Strips */}
      <mesh position={[-2.35, 0.02, -0.36]} rotation={[0, 0.28, -0.08]}>
        <boxGeometry args={[3.2, 0.055, 0.06]} />
        <meshBasicMaterial color={livery.accentColor} />
      </mesh>
      <mesh position={[2.35, 0.02, -0.36]} rotation={[0, -0.28, 0.08]}>
        <boxGeometry args={[3.2, 0.055, 0.06]} />
        <meshBasicMaterial color={livery.accentColor} />
      </mesh>

      {/* Glowing Fusion Reactor Core Radiator Spine */}
      <mesh position={[0, 0.48, 1.7]}>
        <boxGeometry args={[0.42, 0.22, 1.8]} />
        <meshStandardMaterial
          color={livery.accentColor}
          emissive={livery.accentColor}
          emissiveIntensity={1.4}
        />
      </mesh>

      {/* Twin Main Plasma Engine Nacelles */}
      <mesh position={[-1.05, -0.05, 2.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.54, 1.75, 18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.05, -0.05, 2.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.54, 1.75, 18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Thruster Exhaust Glow Rings */}
      <mesh position={[-1.05, -0.05, 3.44]}>
        <circleGeometry args={[0.4, 18]} />
        <meshBasicMaterial color={livery.accentColor} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[1.05, -0.05, 3.44]}>
        <circleGeometry args={[0.4, 18]} />
        <meshBasicMaterial color={livery.accentColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Dynamic Plasma Thruster Plumes (Color reflects your installed Earth Engine Model!) */}
      <mesh ref={leftFlameRef} position={[-1.05, -0.05, 4.3]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.38, 2.1, 14]} />
        <meshBasicMaterial
          color={engineModel.flameColor}
          transparent
          opacity={0.78}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={rightFlameRef} position={[1.05, -0.05, 4.3]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.38, 2.1, 14]} />
        <meshBasicMaterial
          color={engineModel.flameColor}
          transparent
          opacity={0.78}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Navigation Strobe Lights */}
      <mesh position={[-3.95, -0.2, 1.15]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[3.95, -0.2, 1.15]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      <pointLight ref={strobeRef} position={[0, 0.9, 1.8]} color={livery.accentColor} distance={15} intensity={1.6} />

      {/* Visible Physical Component Damage Emitters */}
      <DamageSpark position={[-1.05, 0.1, 2.8]} active={components.engines < 80} />
      <DamageSpark position={[0, 0.6, 1.7]} active={components.reactor < 80} />
      <DamageSpark position={[0, 1.25, -0.8]} active={components.comms < 80} />
      <DamageSpark position={[0, 0.2, -3.2]} active={components.sensors < 80} />
      <DamageSpark position={[-2.4, 0.1, 0.6]} active={components.hullPort < 80} />
      <DamageSpark position={[2.4, 0.1, 0.6]} active={components.hullStarboard < 80} />

      {/* Mining Laser Beam & Twin Pulse Cannon Bolts */}
      <mesh ref={miningBeamRef} position={[0, -0.1, -28]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <cylinderGeometry args={[0.14, 0.24, 48, 10]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.82} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={cannonLeftRef} position={[-0.9, -0.1, -8]} visible={false}>
        <boxGeometry args={[0.16, 0.16, 4.5]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>
      <mesh ref={cannonRightRef} position={[0.9, -0.1, -8]} visible={false}>
        <boxGeometry args={[0.16, 0.16, 4.5]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>

      {/* EARTH SHOP PHYSICAL ROOF UPGRADES */}
      {roofPart === 'panoramic-dome' && (
        <mesh position={[0, 0.88, 0.25]} scale={[0.92, 0.45, 2.3]}>
          <sphereGeometry args={[0.78, 22, 14]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.6}
            metalness={0.95}
            roughness={0.05}
            transparent
            opacity={0.78}
          />
        </mesh>
      )}
      {roofPart === 'command-bridge-deck' && (
        <group position={[0, 1.05, 0.2]}>
          <mesh>
            <boxGeometry args={[1.45, 0.65, 2.3]} />
            <meshStandardMaterial map={hullTex} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.08, -1.16]}>
            <planeGeometry args={[1.2, 0.26]} />
            <meshBasicMaterial color={livery.accentColor} />
          </mesh>
        </group>
      )}
      {roofPart === 'solar-wing-roof' && (
        <group position={[0, 0.95, 0.6]}>
          <mesh position={[-1.9, 0.15, 0]} rotation={[0, 0, 0.18]}>
            <boxGeometry args={[2.8, 0.06, 1.4]} />
            <meshStandardMaterial color="#1d4ed8" emissive="#1e3a8a" emissiveIntensity={0.7} metalness={0.7} roughness={0.18} />
          </mesh>
          <mesh position={[1.9, 0.15, 0]} rotation={[0, 0, -0.18]}>
            <boxGeometry args={[2.8, 0.06, 1.4]} />
            <meshStandardMaterial color="#1d4ed8" emissive="#1e3a8a" emissiveIntensity={0.7} metalness={0.7} roughness={0.18} />
          </mesh>
        </group>
      )}

      {/* EARTH SHOP AERODYNAMIC UPGRADES */}
      {(aeroPart === 'forward-canards' || aeroPart === 'hypersonic-swept') && (
        <group position={[0, -0.04, -2.75]}>
          <mesh position={[-1.35, 0, 0]} rotation={[0, 0.42, -0.06]}>
            <boxGeometry args={[1.65, 0.1, 0.72]} />
            <meshStandardMaterial map={hullTex} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[1.35, 0, 0]} rotation={[0, -0.42, 0.06]}>
            <boxGeometry args={[1.65, 0.1, 0.72]} />
            <meshStandardMaterial map={hullTex} metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      )}
      {(aeroPart === 'twin-winglet-fins' || aeroPart === 'hypersonic-swept') && (
        <group>
          <mesh position={[-3.95, 0.35, 0.95]} rotation={[0.2, 0, 0.18]}>
            <boxGeometry args={[0.12, 1.15, 1.4]} />
            <meshStandardMaterial map={hullTex} metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[3.95, 0.35, 0.95]} rotation={[0.2, 0, -0.18]}>
            <boxGeometry args={[0.12, 1.15, 1.4]} />
            <meshStandardMaterial map={hullTex} metalness={0.88} roughness={0.22} />
          </mesh>
        </group>
      )}
      {aeroPart === 'hypersonic-swept' && (
        <group>
          <mesh position={[-3.3, -0.1, 1.15]} rotation={[0, 0.45, -0.08]}>
            <boxGeometry args={[2.6, 0.14, 1.35]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[3.3, -0.1, 1.15]} rotation={[0, -0.45, 0.08]}>
            <boxGeometry args={[2.6, 0.14, 1.35]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* EARTH SHOP NOSE / PROW UPGRADES */}
      {nosePart === 'needle-lance' && (
        <mesh position={[0, -0.04, -5.65]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.36, 2.2, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
        </mesh>
      )}
      {nosePart === 'heavy-ram-prow' && (
        <group position={[0, -0.12, -3.5]}>
          <mesh position={[-1.05, 0, 0]}>
            <boxGeometry args={[0.45, 0.55, 1.8]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.35} />
          </mesh>
          <mesh position={[1.05, 0, 0]}>
            <boxGeometry args={[0.45, 0.55, 1.8]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, -0.8]}>
            <boxGeometry args={[2.3, 0.32, 0.45]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.75} roughness={0.35} />
          </mesh>
        </group>
      )}

      {/* EARTH TURBO LAB PHYSICAL BOOSTER PODS */}
      {(boosterPart === 'wing-turbo-jets' || boosterPart === 'apex-quad-rings') && (
        <group>
          <mesh position={[-2.65, -0.35, 1.35]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.4, 2.1, 14]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[2.65, -0.35, 1.35]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.4, 2.1, 14]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-2.65, -0.35, 3.1]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.3, 1.8, 12]} />
            <meshBasicMaterial color={engineModel.flameColor} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh position={[2.65, -0.35, 3.1]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.3, 1.8, 12]} />
            <meshBasicMaterial color={engineModel.flameColor} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      )}
      {boosterPart === 'antimatter-nitro' && (
        <group>
          <mesh position={[-1.35, 0.55, 2.1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.34, 2.4, 14]} />
            <meshStandardMaterial color="#4a044e" emissive="#ec4899" emissiveIntensity={0.85} metalness={0.85} />
          </mesh>
          <mesh position={[1.35, 0.55, 2.1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.34, 2.4, 14]} />
            <meshStandardMaterial color="#4a044e" emissive="#ec4899" emissiveIntensity={0.85} metalness={0.85} />
          </mesh>
          <mesh position={[-1.35, 0.55, 4.1]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.32, 2.4, 12]} />
            <meshBasicMaterial color="#ec4899" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh position={[1.35, 0.55, 4.1]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.32, 2.4, 12]} />
            <meshBasicMaterial color="#ec4899" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      )}
      {boosterPart === 'apex-quad-rings' && (
        <group position={[0, 0.05, 3.55]}>
          <mesh position={[-1.1, 0, 0]}>
            <torusGeometry args={[0.68, 0.09, 10, 24]} />
            <meshBasicMaterial color="#e0f2fe" />
          </mesh>
          <mesh position={[1.1, 0, 0]}>
            <torusGeometry args={[0.68, 0.09, 10, 24]} />
            <meshBasicMaterial color="#e0f2fe" />
          </mesh>
          <mesh position={[0, 0.1, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[1.15, 3.8, 16]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* EARTH SHOP PLASMA UNDERGLOW */}
      {underglowColor && (
        <group position={[0, -0.88, 0.2]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.2, 4.6]} />
            <meshBasicMaterial color={underglowColor} transparent opacity={0.45} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color={underglowColor} distance={16} intensity={3.5} />
        </group>
      )}

      {/* Deflector Shield Bubble */}
      <mesh ref={shieldRef} scale={[4.6, 2.0, 5.6]} visible={false}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          wireframe
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
