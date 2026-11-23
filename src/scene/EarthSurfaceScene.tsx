import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useShipStore } from '../store/useShipStore';
import { PlayerShipModel } from './PlayerShipModel';
import { starshipAudio } from '../utils/audio';

const groundKeys: Record<string, boolean> = {};

// Simple event bus so clicking physical 3D shops on Earth opens the exact shop modal in EarthSurfaceHUD
export type EarthShopTab = 'engine' | 'aero' | 'roof' | 'turbo' | 'xeno' | 'factory' | 'cargo';

// Animated 3D Articulated Mechanical Robotic Arm for Earth Factories!
const MechanicalRoboticArm: React.FC<{
  position: [number, number, number];
  phase?: number;
  color?: string;
}> = ({ position, phase = 0, color = '#f59e0b' }) => {
  const baseRef = useRef<THREE.Group>(null);
  const upperRef = useRef<THREE.Group>(null);
  const sparkRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const overdrive = useShipStore.getState().roboticArmOverdrive ? 2.2 : 1.0;
    const t = state.clock.elapsedTime * overdrive + phase;
    if (baseRef.current) baseRef.current.rotation.y = Math.sin(t * 0.9) * 0.75;
    if (upperRef.current) upperRef.current.rotation.z = -0.35 + Math.sin(t * 1.8) * 0.45;
    if (sparkRef.current) {
      sparkRef.current.intensity = Math.sin(t * 16) > 0.35 ? 4.5 : 0.4;
    }
  });

  return (
    <group position={position}>
      {/* Heavy Pedestal Base */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[1.4, 1.8, 1.6, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Rotating Shoulder Joint */}
      <group ref={baseRef} position={[0, 1.8, 0]}>
        <mesh position={[0, 2.2, 0]} rotation={[0, 0, 0.22]}>
          <boxGeometry args={[0.75, 4.8, 0.75]} />
          <meshStandardMaterial color={color} metalness={0.72} roughness={0.32} />
        </mesh>
        {/* Articulated Elbow + Forearm + Plasma Welder Tip */}
        <group ref={upperRef} position={[-0.95, 4.4, 0]}>
          <mesh>
            <sphereGeometry args={[0.65, 12, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[2.1, 0.4, 0]} rotation={[0, 0, -1.35]}>
            <boxGeometry args={[0.55, 4.4, 0.55]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Glowing Plasma Welding Head */}
          <mesh position={[4.1, 0.85, 0]}>
            <octahedronGeometry args={[0.42, 0]} />
            <meshBasicMaterial color="#00e5ff" />
          </mesh>
          <pointLight ref={sparkRef} position={[4.2, 0.85, 0]} color="#38bdf8" distance={14} intensity={2.5} />
        </group>
      </group>
    </group>
  );
};
const shopListeners = new Set<(tab: EarthShopTab) => void>();
export function openEarthShop(tab: EarthShopTab) {
  starshipAudio.playClick(820);
  shopListeners.forEach((cb) => cb(tab));
}
export function onOpenEarthShop(cb: (tab: EarthShopTab) => void) {
  shopListeners.add(cb);
  return () => {
    shopListeners.delete(cb);
  };
}

// Procedural glowing skyscraper window texture
function makeBuildingTexture(accent: string) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 246; y += 14) {
    for (let x = 8; x < 120; x += 16) {
      const lit = (x * 13 + y * 7) % 5 !== 0;
      ctx.fillStyle = lit ? accent : '#1e293b';
      ctx.globalAlpha = lit ? 0.55 + ((x + y) % 3) * 0.15 : 0.7;
      ctx.fillRect(x, y, 10, 7);
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const CITY_BUILDINGS: Array<{ x: number; z: number; w: number; h: number; d: number; accent: string; spire?: boolean }> = [
  // North Skyline District
  { x: -65, z: -78, w: 16, h: 68, d: 16, accent: '#38bdf8', spire: true },
  { x: -42, z: -85, w: 14, h: 92, d: 14, accent: '#00e5ff', spire: true },
  { x: -18, z: -92, w: 18, h: 118, d: 18, accent: '#60a5fa', spire: true },
  { x: 10, z: -88, w: 15, h: 84, d: 15, accent: '#38bdf8' },
  { x: 35, z: -95, w: 20, h: 132, d: 18, accent: '#00e5ff', spire: true },
  { x: 64, z: -82, w: 16, h: 74, d: 16, accent: '#f59e0b' },
  { x: 88, z: -72, w: 14, h: 58, d: 14, accent: '#38bdf8' },
  // Mid-North Commercial Towers
  { x: -78, z: -48, w: 14, h: 52, d: 14, accent: '#22d3ee' },
  { x: -55, z: -56, w: 13, h: 44, d: 13, accent: '#38bdf8' },
  { x: 58, z: -52, w: 15, h: 64, d: 15, accent: '#a855f7', spire: true },
  { x: 82, z: -38, w: 16, h: 78, d: 14, accent: '#00e5ff' },
  // East Downtown District
  { x: 74, z: -6, w: 16, h: 62, d: 16, accent: '#38bdf8' },
  { x: 86, z: 22, w: 18, h: 88, d: 16, accent: '#00e5ff', spire: true },
  { x: 72, z: 52, w: 15, h: 54, d: 15, accent: '#34d399' },
  // West Industrial & Tech Towers
  { x: -76, z: -12, w: 16, h: 58, d: 16, accent: '#f59e0b' },
  { x: -84, z: 22, w: 18, h: 76, d: 16, accent: '#38bdf8', spire: true },
  { x: -70, z: 54, w: 14, h: 48, d: 14, accent: '#00e5ff' },
  // South Boulevard Highrises
  { x: -38, z: 82, w: 16, h: 72, d: 16, accent: '#60a5fa' },
  { x: -8, z: 90, w: 18, h: 98, d: 18, accent: '#00e5ff', spire: true },
  { x: 26, z: 86, w: 15, h: 66, d: 15, accent: '#34d399' },
  { x: 54, z: 78, w: 16, h: 82, d: 16, accent: '#38bdf8', spire: true },
];

export const EarthSurfaceScene: React.FC = () => {
  const { camera, gl } = useThree();
  const playerMode = useShipStore((s) => s.playerMode);
  const earthWeather = useShipStore((s) => s.earthWeather);
  const components = useShipStore((s) => s.components);
  const launchFromEarth = useShipStore((s) => s.launchFromEarth);

  const bldgTexCyan = useMemo(() => makeBuildingTexture('#38bdf8'), []);
  const bldgTexAmber = useMemo(() => makeBuildingTexture('#fbbf24'), []);

  const shipDescentRef = useRef<THREE.Group>(null);
  const trafficRefs = useRef<Array<THREE.Group | null>>([]);
  const monorailRef = useRef<THREE.Group>(null);
  const turretRefs = useRef<Array<THREE.Group | null>>([]);
  const walkPos = useRef(new THREE.Vector3(16, 1.75, 28));
  const yaw = useRef(0.45);
  const pitch = useRef(0.05);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const cutsceneTime = useRef(0);

  useEffect(() => {
    cutsceneTime.current = 0;
  }, [playerMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      groundKeys[e.code] = true;
      if (e.code === 'KeyE' && useShipStore.getState().playerMode === 'earth_surface') {
        const p = walkPos.current;
        if (p.distanceTo(new THREE.Vector3(36, 1.75, 16)) < 16) {
          openEarthShop('aero');
        } else if (p.distanceTo(new THREE.Vector3(0, 1.75, -42)) < 16) {
          openEarthShop('roof');
        } else if (p.distanceTo(new THREE.Vector3(-34, 1.75, 42)) < 16) {
          openEarthShop('turbo');
        } else if (p.distanceTo(new THREE.Vector3(34, 1.75, 44)) < 16) {
          openEarthShop('xeno');
        } else if (p.distanceTo(new THREE.Vector3(-42, 1.75, -30)) < 18) {
          openEarthShop('factory');
        } else if (p.distanceTo(new THREE.Vector3(44, 1.75, -24)) < 18) {
          openEarthShop('cargo');
        } else if (p.distanceTo(new THREE.Vector3(-34, 1.75, 12)) < 16 || p.distanceTo(new THREE.Vector3(0, 1.75, 0)) < 18) {
          openEarthShop('engine');
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      groundKeys[e.code] = false;
    };
    const dom = gl.domElement;
    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      dragging.current = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      yaw.current -= dx * 0.0045;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0035, -0.75, 0.85);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
      Object.keys(groundKeys).forEach((k) => {
        groundKeys[k] = false;
      });
    };
  }, [gl.domElement]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useShipStore.getState();

    // Animate flying city commuter traffic + Maglev Monorail Train + Defense Turrets!
    if (monorailRef.current) {
      const mAngle = state.clock.elapsedTime * 0.35;
      monorailRef.current.position.set(Math.cos(mAngle) * 58, 5.2, Math.sin(mAngle) * 58);
      monorailRef.current.rotation.y = -mAngle;
    }
    turretRefs.current.forEach((tur, idx) => {
      if (tur) tur.rotation.y = Math.sin(state.clock.elapsedTime * 0.7 + idx * 1.5) * 1.4;
    });
    trafficRefs.current.forEach((car, i) => {
      if (!car) return;
      const speed = 18 + (i % 3) * 8;
      const dir = i % 2 === 0 ? 1 : -1;
      const laneZ = i < 4 ? -60 - i * 6 : 62 + (i - 4) * 6;
      const x = (((state.clock.elapsedTime * speed * dir + i * 37) % 220) + 220) % 220 - 110;
      car.position.set(x, 26 + (i % 4) * 9, laneZ);
      car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    });

    // 1. ATMOSPHERIC LANDING CUTSCENE ON EARTH
    if (s.playerMode === 'earth_cutscene') {
      cutsceneTime.current += dt;
      const duration = 4.6;
      const t = Math.min(1, cutsceneTime.current / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const altitude = (1 - ease) * 120 + 2.4;
      const zApproach = (1 - ease) * -70;

      if (shipDescentRef.current) {
        shipDescentRef.current.position.set(0, altitude, zApproach);
        shipDescentRef.current.rotation.set(Math.sin(t * Math.PI) * 0.16, 0, 0);
      }

      camera.position.set(34 - ease * 8, 10 + (1 - ease) * 32, 40 - ease * 6);
      camera.lookAt(0, altitude, zApproach);

      s.applyTick({ earthCutsceneProgress: t });

      if (t >= 1) {
        starshipAudio.playSuccess();
        s.addLog('TOUCHDOWN AT NEW GENEVA SPACEPORT, EARTH — EXPLORE THE CITY SHOPS!', 'success');
        s.applyTick({ playerMode: 'earth_surface', earthCutsceneProgress: 1 });
      }
      return;
    }

    // 1B. ORBITAL LIFTOFF / ASCENT CUTSCENE FROM EARTH
    if (s.playerMode === 'earth_liftoff') {
      cutsceneTime.current += dt;
      const duration = 3.5;
      const t = Math.min(1, cutsceneTime.current / duration);
      const easeIn = t * t * t;
      const altitude = 2.4 + easeIn * 185;
      const zClimb = -easeIn * 65;

      if (shipDescentRef.current) {
        shipDescentRef.current.position.set(0, altitude, zClimb);
        shipDescentRef.current.rotation.set(-t * 0.52, 0, Math.sin(t * 24) * 0.025);
      }

      const shake = (1 - t) * 0.45;
      camera.position.set(
        28 + Math.sin(state.clock.elapsedTime * 42) * shake,
        6 + easeIn * 24 + Math.cos(state.clock.elapsedTime * 38) * shake,
        36 + easeIn * 14
      );
      camera.lookAt(0, altitude + 4, zClimb);

      s.applyTick({ earthCutsceneProgress: t });

      if (t >= 1) {
        starshipAudio.playSuccess();
        s.addLog('ORBITAL INSERTION COMPLETE — WELCOME BACK TO SOLARIS PRIME', 'success');
        s.applyTick({
          playerMode: 'flight',
          landedPlanetId: null,
          activeView: 'bridge',
          currentSystemId: 'solaris-prime',
          position: [190, 20, -225],
          velocity: [0, 0, -28],
          quaternion: [0, 0, 0, 1],
          earthCutsceneProgress: 0,
        });
      }
      return;
    }

    // 2. EXPLORABLE EARTH CITY & SPACEPORT WALKING
    if (shipDescentRef.current) {
      shipDescentRef.current.position.set(0, 2.4, 0);
      shipDescentRef.current.rotation.set(0, 0, 0);
    }

    if (s.activeView === 'bridge') {
      if (groundKeys['ArrowLeft']) yaw.current += dt * 2.0;
      if (groundKeys['ArrowRight']) yaw.current -= dt * 2.0;
      if (groundKeys['ArrowUp']) pitch.current = Math.min(0.85, pitch.current + dt * 1.3);
      if (groundKeys['ArrowDown']) pitch.current = Math.max(-0.75, pitch.current - dt * 1.3);

      const moveSpeed = groundKeys['ShiftLeft'] ? 16 : 9;
      const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
      const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
      const delta = new THREE.Vector3();
      if (groundKeys['KeyW']) delta.add(forward);
      if (groundKeys['KeyS']) delta.sub(forward);
      if (groundKeys['KeyD']) delta.add(right);
      if (groundKeys['KeyA']) delta.sub(right);

      if (delta.lengthSq() > 0) {
        delta.normalize().multiplyScalar(moveSpeed * dt);
        walkPos.current.x = THREE.MathUtils.clamp(walkPos.current.x + delta.x, -68, 68);
        walkPos.current.z = THREE.MathUtils.clamp(walkPos.current.z + delta.z, -68, 68);
      }
    }

    camera.position.copy(walkPos.current);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    camera.rotation.z = 0;
  });

  const isGround = playerMode === 'earth_surface';
  const skyBg =
    earthWeather === 'night'
      ? '#030712'
      : earthWeather === 'sunset'
        ? '#f97316'
        : earthWeather === 'storm'
          ? '#1e293b'
          : '#38bdf8';
  const fogCol =
    earthWeather === 'night'
      ? '#0f172a'
      : earthWeather === 'sunset'
        ? '#fb923c'
        : earthWeather === 'storm'
          ? '#334155'
          : '#bae6fd';
  const sunInt = earthWeather === 'night' ? 0.35 : earthWeather === 'storm' ? 0.85 : earthWeather === 'sunset' ? 1.8 : 2.3;

  return (
    <group>
      {/* Dynamic Earth Day / Sunset / Neon Night / Storm Sky */}
      <color attach="background" args={[skyBg]} />
      <fog attach="fog" args={[fogCol, 85, 340]} />

      <ambientLight intensity={earthWeather === 'night' ? 0.3 : 0.68} color="#e0f2fe" />
      <hemisphereLight args={[fogCol, '#15803d', earthWeather === 'night' ? 0.3 : 0.72]} />
      <directionalLight position={[90, 140, 70]} intensity={sunInt} color={earthWeather === 'sunset' ? '#fdba74' : '#fffbeb'} castShadow />

      {/* EARTH SPACE ELEVATOR MEGASTRUCTURE (Rising straight into orbit!) */}
      <group position={[0, 0, -115]}>
        <mesh position={[0, 160, 0]}>
          <cylinderGeometry args={[2.4, 4.5, 320, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 160, 0]}>
          <cylinderGeometry args={[2.8, 2.8, 320, 12]} />
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.35} />
        </mesh>
      </group>

      {/* ANIMATED MAGLEV MONORAIL TRACK & HIGH-SPEED TRAIN */}
      <mesh position={[0, 4.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[58, 0.45, 8, 64]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      <group ref={monorailRef} position={[58, 5.2, 0]}>
        <mesh>
          <boxGeometry args={[2.2, 1.8, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[2.3, 0.35, 11.4]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
      </group>

      {/* PLANETARY AUTOMATED DEFENSE TURRETS */}
      {[
        [-30, 0, -30],
        [30, 0, 30],
      ].map(([tx, ty, tz], idx) => (
        <group key={idx} position={[tx, ty, tz]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[2.2, 2.8, 3, 10]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <group
            ref={(el) => {
              turretRefs.current[idx] = el;
            }}
            position={[0, 3.2, 0]}
          >
            <mesh>
              <boxGeometry args={[2.4, 1.4, 2.8]} />
              <meshStandardMaterial color="#334155" metalness={0.85} />
            </mesh>
            <mesh position={[-0.6, 0.2, -2.5]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 3.5, 8]} />
              <meshBasicMaterial color="#00e5ff" />
            </mesh>
            <mesh position={[0.6, 0.2, -2.5]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 3.5, 8]} />
              <meshBasicMaterial color="#00e5ff" />
            </mesh>
          </group>
        </group>
      ))}

      {/* HOLOGRAPHIC FLOATING CITY BILLBOARDS */}
      <mesh position={[-18, 22, -46]} rotation={[0, 0.25, 0]}>
        <planeGeometry args={[14, 6]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[20, 22, -46]} rotation={[0, -0.25, 0]}>
        <planeGeometry args={[14, 6]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>

      {/* Lush Earth Parklands & Ground */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[560, 560]} />
        <meshStandardMaterial color="#166534" roughness={0.95} />
      </mesh>

      {/* Paved New Geneva Spaceport Plaza & Cross-City Boulevards */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[128, 128]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.18} />
      </mesh>
      {/* Glowing Boulevard Lane Strips */}
      <mesh position={[0, 0.01, -46]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 36]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.28} />
      </mesh>
      <mesh position={[44, 0.01, 14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 5]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.25} />
      </mesh>
      <mesh position={[-42, 0.01, 12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 5]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.25} />
      </mesh>

      {/* Main Terran Landing Pad */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[30, 48]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[27, 28.4, 48]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[14.5, 15.2, 36]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>

      {/* NEW GENEVA CITY SKYLINE (21 Detailed Skyscrapers with Window Grids & Spires!) */}
      {CITY_BUILDINGS.map((b, idx) => (
        <group key={idx} position={[b.x, b.h / 2, b.z]}>
          <mesh>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              map={idx % 3 === 0 ? bldgTexAmber : bldgTexCyan}
              metalness={0.68}
              roughness={0.28}
            />
          </mesh>
          {/* Glowing Rooftop Trim */}
          <mesh position={[0, b.h / 2 + 0.3, 0]}>
            <boxGeometry args={[b.w + 0.4, 0.5, b.d + 0.4]} />
            <meshBasicMaterial color={b.accent} />
          </mesh>
          {/* Communications Spire */}
          {b.spire && (
            <group position={[0, b.h / 2 + 9, 0]}>
              <mesh>
                <cylinderGeometry args={[0.18, 0.45, 18, 8]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
              </mesh>
              <mesh position={[0, 9.2, 0]}>
                <sphereGeometry args={[0.6, 8, 8]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* Flying City Commuter Traffic */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            trafficRefs.current[i] = el;
          }}
        >
          <mesh>
            <boxGeometry args={[1.6, 0.7, 3.8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 2.0]}>
            <sphereGeometry args={[0.45, 8, 8]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#00e5ff' : '#f59e0b'} />
          </mesh>
        </group>
      ))}

      {/* Urban Park Trees & Streetlamps Lining the Spaceport */}
      {[
        [-18, -32], [18, -32], [-28, -22], [28, -22],
        [-28, 32], [28, 32], [-18, 42], [18, 42],
        [48, -14], [48, 36], [-48, -14], [-48, 36],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          {/* Tree */}
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.32, 0.45, 3.2, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 4.4, 0]}>
            <coneGeometry args={[2.2, 4.8, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.85} />
          </mesh>
          {/* Futuristic Streetlamp beside tree */}
          <mesh position={[2.2, 2.8, 0]}>
            <cylinderGeometry args={[0.1, 0.14, 5.6, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          <mesh position={[2.2, 5.7, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshBasicMaterial color="#e0f2fe" />
          </mesh>
        </group>
      ))}

      {/* Spaceport Fuel Silos & Ground Support Rover */}
      <group position={[-24, 0, -24]}>
        <mesh position={[0, 5, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 10, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[7.5, 5, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 10, 16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {/* Parked Ground Support Rover */}
      <group position={[20, 0.8, 22]} rotation={[0, -0.5, 0]}>
        <mesh>
          <boxGeometry args={[2.8, 1.2, 4.6]} />
          <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.9, -0.4]}>
          <boxGeometry args={[2.2, 0.8, 2.0]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* SHOP 1 (WEST): TERRAN ENGINE FORGE & TUNING GARAGE */}
      <group position={[-36, 0, 12]}>
        <mesh position={[0, 4.5, 0]}>
          <boxGeometry args={[10, 9, 14]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.32} />
        </mesh>
        <mesh position={[0, 9.4, 0]}>
          <boxGeometry args={[10.6, 0.8, 14.6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[5.1, 3.5, 0]}>
          <planeGeometry args={[11, 5]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.22} side={THREE.DoubleSide} />
        </mesh>
        {isGround && (
          <Html position={[5.8, 6.2, 0]} center distanceFactor={26}>
            <button
              onClick={() => openEarthShop('engine')}
              style={{
                cursor: 'pointer',
                background: 'rgba(20, 10, 4, 0.94)',
                border: '1.5px solid #f59e0b',
                color: '#fcd34d',
                padding: '5px 11px',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              ⚙ TERRAN ENGINE FORGE &amp; TUNING [CLICK / E]
            </button>
          </Html>
        )}
      </group>

      {/* SHOP 2 (EAST): AERO-DYNAMICS & WING WORKS */}
      <group position={[36, 0, 16]}>
        <mesh position={[0, 4.5, 0]}>
          <boxGeometry args={[10, 9, 14]} />
          <meshStandardMaterial color="#0b1526" metalness={0.82} roughness={0.28} />
        </mesh>
        <mesh position={[0, 9.4, 0]}>
          <boxGeometry args={[10.6, 0.8, 14.6]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
        <mesh position={[-5.1, 3.5, 0]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[11, 5]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.22} side={THREE.DoubleSide} />
        </mesh>
        {isGround && (
          <Html position={[-5.8, 6.2, 0]} center distanceFactor={26}>
            <button
              onClick={() => openEarthShop('aero')}
              style={{
                cursor: 'pointer',
                background: 'rgba(4, 16, 28, 0.94)',
                border: '1.5px solid #00e5ff',
                color: '#67e8f9',
                padding: '5px 11px',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              ✈ AERO-DYNAMICS &amp; WING SHOP [CLICK / E]
            </button>
          </Html>
        )}
      </group>

      {/* SHOP 3 (NORTH): APEX ROOF, HULL & NEON CUSTOMS */}
      <group position={[0, 0, -44]}>
        <mesh position={[0, 4.5, 0]}>
          <boxGeometry args={[16, 9, 10]} />
          <meshStandardMaterial color="#140d26" metalness={0.82} roughness={0.28} />
        </mesh>
        <mesh position={[0, 9.4, 0]}>
          <boxGeometry args={[16.6, 0.8, 10.6]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>
        <mesh position={[0, 3.5, 5.1]}>
          <planeGeometry args={[13, 5]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.24} side={THREE.DoubleSide} />
        </mesh>
        {isGround && (
          <Html position={[0, 6.4, 5.8]} center distanceFactor={26}>
            <button
              onClick={() => openEarthShop('roof')}
              style={{
                cursor: 'pointer',
                background: 'rgba(18, 8, 32, 0.94)',
                border: '1.5px solid #a855f7',
                color: '#d8b4fe',
                padding: '5px 11px',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              ✦ APEX ROOF, PROW &amp; UNDERGLOW SHOP [CLICK / E]
            </button>
          </Html>
        )}
      </group>

      {/* SHOP 4 (SOUTH-WEST): HYPER-THRUST & NITRO TURBO LAB */}
      <group position={[-34, 0, 42]}>
        <mesh position={[0, 4.5, 0]}>
          <boxGeometry args={[12, 9, 10]} />
          <meshStandardMaterial color="#1f081a" metalness={0.84} roughness={0.26} />
        </mesh>
        <mesh position={[0, 9.4, 0]}>
          <boxGeometry args={[12.6, 0.8, 10.6]} />
          <meshBasicMaterial color="#ec4899" />
        </mesh>
        {isGround && (
          <Html position={[0, 6.4, -5.8]} center distanceFactor={26}>
            <button
              onClick={() => openEarthShop('turbo')}
              style={{
                cursor: 'pointer',
                background: 'rgba(30, 6, 22, 0.94)',
                border: '1.5px solid #ec4899',
                color: '#f9a8d4',
                padding: '5px 11px',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              ⚡ HYPER-THRUST &amp; NITRO TURBO LAB [CLICK / E]
            </button>
          </Html>
        )}
      </group>

      {/* SHOP 5 (SOUTH-EAST): XENO BLACK-MARKET TECH & BULK DEPOT */}
      <group position={[34, 0, 44]}>
        <mesh position={[0, 4.5, 0]}>
          <boxGeometry args={[12, 9, 10]} />
          <meshStandardMaterial color="#052019" metalness={0.84} roughness={0.26} />
        </mesh>
        <mesh position={[0, 9.4, 0]}>
          <boxGeometry args={[12.6, 0.8, 10.6]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        {isGround && (
          <Html position={[0, 6.4, -5.8]} center distanceFactor={26}>
            <button
              onClick={() => openEarthShop('xeno')}
              style={{
                cursor: 'pointer',
                background: 'rgba(4, 24, 18, 0.94)',
                border: '1.5px solid #10b981',
                color: '#6ee7b7',
                padding: '5px 11px',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              ☢ XENO BLACK-MARKET TECH &amp; BULK [CLICK / E]
            </button>
          </Html>
        )}
      </group>

      {/* SHOP 6 (NORTH-WEST): AUTOMATED PLANETARY FACTORIES & ANIMATED MECHANICAL ROBOTIC ARMS */}
      <group position={[-44, 0, -32]}>
        <mesh position={[0, 5.5, 0]}>
          <boxGeometry args={[18, 11, 14]} />
          <meshStandardMaterial color="#18181b" metalness={0.78} roughness={0.38} />
        </mesh>
        {/* Factory Smokestacks / Cooling Towers */}
        <mesh position={[-5, 14, -3]}>
          <cylinderGeometry args={[1.4, 2.0, 9, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[5, 14, -3]}>
          <cylinderGeometry args={[1.4, 2.0, 9, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, 11.4, 0]}>
          <boxGeometry args={[18.6, 0.8, 14.6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {/* 2 Articulated 3D Mechanical Robotic Arms Building Ship Modules Right Outside! */}
        <MechanicalRoboticArm position={[-5, 0, 10.5]} phase={0} color="#f59e0b" />
        <MechanicalRoboticArm position={[5, 0, 10.5]} phase={2.1} color="#00e5ff" />
        {/* Assembly Conveyor Pad */}
        <mesh position={[0, 0.5, 11]}>
          <boxGeometry args={[12, 1.0, 4.5]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {isGround && (
          <Html position={[0, 7.6, 8.2]} center distanceFactor={28}>
            <button
              onClick={() => openEarthShop('factory')}
              style={{
                cursor: 'pointer',
                background: 'rgba(22, 14, 4, 0.94)',
                border: '1.5px solid #f59e0b',
                color: '#fcd34d',
                padding: '5px 11px',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              🏭 PLANETARY FACTORIES &amp; ROBOTIC ARMS [CLICK / E]
            </button>
          </Html>
        )}
      </group>

      {/* SHOP 7 (NORTH-EAST): GALACTIC CARGO BAY EXPANSION & FREIGHT DEPOT */}
      <group position={[46, 0, -24]}>
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[16, 10, 14]} />
          <meshStandardMaterial color="#0c1c2e" metalness={0.78} roughness={0.34} />
        </mesh>
        <mesh position={[0, 10.4, 0]}>
          <boxGeometry args={[16.6, 0.8, 14.6]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
        {/* Stacked Freight Containers + Robotic Loader Arm */}
        <mesh position={[-5, 1.8, 10]}>
          <boxGeometry args={[4.5, 3.6, 3.2]} />
          <meshStandardMaterial color="#c2410c" metalness={0.5} roughness={0.6} />
        </mesh>
        <mesh position={[2, 1.8, 10]}>
          <boxGeometry args={[4.5, 3.6, 3.2]} />
          <meshStandardMaterial color="#1d4ed8" metalness={0.5} roughness={0.6} />
        </mesh>
        <MechanicalRoboticArm position={[7.5, 0, 10]} phase={1.2} color="#34d399" />
        {isGround && (
          <Html position={[0, 7.2, 8.0]} center distanceFactor={28}>
            <button
              onClick={() => openEarthShop('cargo')}
              style={{
                cursor: 'pointer',
                background: 'rgba(4, 22, 18, 0.94)',
                border: '1.5px solid #34d399',
                color: '#6ee7b7',
                padding: '5px 11px',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              📦 CARGO BAY EXPANSION &amp; FREIGHT DEPOT [CLICK / E]
            </button>
          </Html>
        )}
      </group>

      {/* Spaceport Control Tower */}
      <group position={[30, 0, -28]}>
        <mesh position={[0, 12, 0]}>
          <cylinderGeometry args={[2.5, 4.0, 24, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.72} roughness={0.35} />
        </mesh>
        <mesh position={[0, 25, 0]}>
          <cylinderGeometry args={[6.6, 5.0, 4.8, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.88} roughness={0.12} />
        </mesh>
      </group>

      {/* Fluffy White Clouds Overhead */}
      {[
        [-55, 78, -60],
        [45, 86, -80],
        [85, 72, -20],
        [-80, 82, 40],
        [15, 84, 70],
      ].map(([cx, cy, cz], idx) => (
        <group key={idx} position={[cx, cy, cz]}>
          <mesh>
            <sphereGeometry args={[14, 12, 10]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.82} />
          </mesh>
          <mesh position={[12, -2, 3]}>
            <sphereGeometry args={[10, 12, 10]} />
            <meshBasicMaterial color="#f0f9ff" transparent opacity={0.78} />
          </mesh>
        </group>
      ))}

      {/* YOUR FULL-SCALE 3D STARSHIP (SHOWS ALL INSTALLED ROOFS, WINGS, CANARDS, PROWS & UNDERGLOW LIVE!) */}
      <group ref={shipDescentRef} position={[0, 2.4, 0]}>
        <PlayerShipModel />

        {isGround && (
          <>
            <Html position={[0, 3.2, 9.5]} center distanceFactor={24}>
              <button
                onClick={() => openEarthShop('engine')}
                style={{
                  cursor: 'pointer',
                  background: 'rgba(20, 10, 4, 0.92)',
                  border: '1px solid #f59e0b',
                  color: '#fcd34d',
                  padding: '3px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9.5,
                  whiteSpace: 'nowrap',
                }}
              >
                🔧 MAIN ENGINES ({Math.round(components.engines)}%) — REPLACE / TUNE
              </button>
            </Html>
            <Html position={[6.8, 1.8, 1.5]} center distanceFactor={24}>
              <button
                onClick={launchFromEarth}
                style={{
                  cursor: 'pointer',
                  background: 'rgba(4, 24, 18, 0.94)',
                  border: '1px solid #10b981',
                  color: '#6ee7b7',
                  padding: '4px 9px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 9.5,
                  whiteSpace: 'nowrap',
                }}
              >
                🚀 BOARD SHIP &amp; LAUNCH TO ORBIT
              </button>
            </Html>
          </>
        )}
      </group>
    </group>
  );
};
