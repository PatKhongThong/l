import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useShipStore } from '../store/useShipStore';

function makePodLidTexture(label: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  // Weathered khaki-tan armored composite base
  ctx.fillStyle = '#b4a68b';
  ctx.fillRect(0, 0, 256, 512);

  // Subtle grime & panel seam lines
  ctx.strokeStyle = 'rgba(20, 24, 30, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 240, 496);

  // Tactical blue side accent stripes
  ctx.fillStyle = '#24527a';
  ctx.fillRect(10, 40, 18, 360);
  ctx.fillRect(228, 40, 18, 360);

  // Smoked dark glass upper viewport
  ctx.fillStyle = '#0e131a';
  ctx.fillRect(54, 48, 148, 210);
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 5;
  ctx.strokeRect(54, 48, 148, 210);

  // Stenciled graffiti / pod ID on glass
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, 128, 165);

  // Side stenciling CP-12
  ctx.fillStyle = '#2c2924';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('CP-12', 128, 355);

  // Lower perforated air vent grille
  ctx.fillStyle = '#1c2128';
  ctx.fillRect(92, 385, 72, 62);
  ctx.fillStyle = '#090c10';
  for (let gx = 100; gx <= 156; gx += 11) {
    for (let gy = 394; gy <= 438; gy += 11) {
      ctx.beginPath();
      ctx.arc(gx, gy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return new THREE.CanvasTexture(c);
}

const SingleEscapePod: React.FC<{
  index: number;
  position: [number, number, number];
  code: string;
  isOpen: boolean;
  onToggle: () => void;
  onLaunch: () => void;
}> = ({ position, code, isOpen, onToggle, onLaunch }) => {
  const lidPivotRef = useRef<THREE.Group>(null);
  const latchRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const latchAnim = useRef(0);
  const [latchHover, setLatchHover] = useState(false);
  const [ejectHover, setEjectHover] = useState(false);

  const lidTex = useMemo(() => makePodLidTexture(code), [code]);

  useFrame((state, dt) => {
    if (lidPivotRef.current) {
      const targetAngle = isOpen ? -1.08 : 0;
      lidPivotRef.current.rotation.x = THREE.MathUtils.lerp(lidPivotRef.current.rotation.x, targetAngle, Math.min(1, dt * 5.5));
    }
    latchAnim.current = Math.max(0, latchAnim.current - dt * 5);
    if (latchRef.current) {
      latchRef.current.position.z = 0.2 - latchAnim.current * 0.05;
    }
    if (glowRef.current) {
      const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 3.5) * 0.15;
      glowRef.current.intensity = isOpen ? 3.6 * pulse : 0.15;
    }
  });

  const pressRelease = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    latchAnim.current = 1;
    onToggle();
  };

  return (
    <group position={position}>
      {/* Floor Steel Launch Rails & Industrial Grating */}
      <mesh position={[-0.48, 0.08, 0]}>
        <boxGeometry args={[0.16, 0.16, 2.4]} />
        <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.3} />
      </mesh>
      <mesh position={[0.48, 0.08, 0]}>
        <boxGeometry args={[0.16, 0.16, 2.4]} />
        <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.03, 1.35]}>
        <boxGeometry args={[1.35, 0.05, 0.7]} />
        <meshStandardMaterial color="#1e242d" metalness={0.8} roughness={0.45} />
      </mesh>

      {/* Rear Hydraulic Support Struts & Braided Conduit Pipes */}
      <mesh position={[-0.58, 1.3, -0.78]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 2.4, 10]} />
        <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.25} />
      </mesh>
      <mesh position={[0.58, 1.3, -0.78]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 2.4, 10]} />
        <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.25} />
      </mesh>
      {/* Industrial Coolant/Hydraulic Side Pipes */}
      <mesh position={[-0.78, 1.6, -0.65]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.06, 0.06, 2.2, 8]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Main Tilted Escape Pod Assembly (32° Recline) */}
      <group position={[0, 1.25, 0]} rotation={[-0.56, 0, 0]}>
        {/* Heavy Dark Gunmetal Chassis Tub */}
        <mesh position={[0, 0, -0.18]}>
          <boxGeometry args={[1.18, 2.35, 0.42]} />
          <meshStandardMaterial color="#1b2028" metalness={0.82} roughness={0.38} />
        </mesh>
        {/* Left & Right Armored Tub Walls with Side Clamps */}
        <mesh position={[-0.56, 0, 0.12]}>
          <boxGeometry args={[0.12, 2.25, 0.48]} />
          <meshStandardMaterial color="#1f252e" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[0.56, 0, 0.12]}>
          <boxGeometry args={[0.12, 2.25, 0.48]} />
          <meshStandardMaterial color="#1f252e" metalness={0.8} roughness={0.35} />
        </mesh>

        {/* Quilted Burnt-Orange Padded Crash Couch */}
        <mesh position={[0, 0.86, 0.12]}>
          <boxGeometry args={[0.46, 0.24, 0.22]} />
          <meshStandardMaterial color="#d95b26" roughness={0.78} metalness={0.08} />
        </mesh>
        {[0.56, 0.3, 0.04, -0.24, -0.52, -0.78].map((cy, idx) => (
          <mesh key={idx} position={[0, cy, 0.1]}>
            <boxGeometry args={[0.82, 0.21, 0.2]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#cf5220' : '#df6430'} roughness={0.82} metalness={0.05} />
          </mesh>
        ))}
        {/* Fold-Down Metallic Footrest */}
        <mesh position={[0, -1.18, 0.32]} rotation={[0.85, 0, 0]}>
          <boxGeometry args={[0.76, 0.08, 0.42]} />
          <meshStandardMaterial color="#2c3440" metalness={0.8} roughness={0.35} />
        </mesh>

        {/* ACTUAL PHYSICAL CLICKABLE 3D EJECT LEVER INSIDE OPEN POD ARMREST! */}
        {isOpen && (
          <group position={[0.44, -0.1, 0.36]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onLaunch();
              }}
              onPointerOver={() => {
                setEjectHover(true);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setEjectHover(false);
                document.body.style.cursor = 'auto';
              }}
            >
              <boxGeometry args={[0.14, 0.34, 0.16]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={ejectHover ? 1.8 : 0.85}
                metalness={0.4}
                roughness={0.3}
              />
            </mesh>
            {ejectHover && (
              <Html position={[0.25, 0.15, 0.2]} center distanceFactor={7}>
                <div style={{ background: '#7f1d1d', border: '1px solid #fcd34d', color: '#fff', padding: '2px 6px', fontSize: 8.5, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                  🚀 PULL TO EJECT {code}
                </div>
              </Html>
            )}
          </group>
        )}

        {/* Warm Red-Orange Emergency Cabin Light */}
        <pointLight ref={glowRef} position={[0, 0.72, 0.42]} color="#ff4d1a" distance={4.5} intensity={2.5} />

        {/* HINGED ARMORED CANOPY LID */}
        <group ref={lidPivotRef} position={[0, 1.15, 0.34]}>
          <mesh position={[0, -1.14, 0.08]}>
            <boxGeometry args={[1.12, 2.28, 0.18]} />
            <meshStandardMaterial map={lidTex} metalness={0.45} roughness={0.55} />
          </mesh>

          {/* ACTUAL PHYSICAL 3D CLICKABLE "RELEASE" LATCH BUTTON ON LID! */}
          <mesh
            ref={latchRef}
            position={[0, -1.32, 0.2]}
            onClick={pressRelease}
            onPointerOver={() => {
              setLatchHover(true);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setLatchHover(false);
              document.body.style.cursor = 'auto';
            }}
          >
            <boxGeometry args={[0.36, 0.22, 0.09]} />
            <meshStandardMaterial
              color={latchHover ? '#f59e0b' : '#1e293b'}
              emissive={latchHover ? '#f59e0b' : '#24527a'}
              emissiveIntensity={latchHover ? 1.2 : 0.35}
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
          {latchHover && (
            <Html position={[0, -1.1, 0.35]} center distanceFactor={7}>
              <div style={{ background: 'rgba(2,6,14,0.92)', border: '1px solid #f59e0b', color: '#fcd34d', padding: '2px 6px', fontSize: 8.5, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                [CLICK] RELEASE LATCH ({isOpen ? 'CLOSE' : 'OPEN'})
              </div>
            </Html>
          )}

          {/* Glowing Red-Orange Underside Emergency Light Bar */}
          <mesh position={[0, -0.25, -0.02]}>
            <boxGeometry args={[0.76, 0.14, 0.04]} />
            <meshBasicMaterial color="#ff4500" />
          </mesh>
        </group>
      </group>
    </group>
  );
};

export const EscapePodBank: React.FC = () => {
  const openPodIndex = useShipStore((s) => s.openPodIndex);
  const togglePodLid = useShipStore((s) => s.togglePodLid);
  const launchEscapePod = useShipStore((s) => s.launchEscapePod);

  const pods = [
    { idx: 0, pos: [-2.1, 0, -1.6] as [number, number, number], code: 'CP-12A' },
    { idx: 1, pos: [0, 0, -1.6] as [number, number, number], code: 'CP-12B' },
    { idx: 2, pos: [2.1, 0, -1.6] as [number, number, number], code: 'CP-12C' },
  ];

  return (
    <group>
      <pointLight position={[0, 3.3, -1.2]} color="#ff5a1f" intensity={2.4} distance={10} />
      {/* Overhead Industrial Conduit Pipes */}
      <mesh position={[0, 3.6, -2.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 7.4, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.25, -2.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 7.4, 10]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.8} roughness={0.35} />
      </mesh>
      {pods.map((p) => (
        <SingleEscapePod
          key={p.code}
          index={p.idx}
          position={p.pos}
          code={p.code}
          isOpen={openPodIndex === p.idx}
          onToggle={() => togglePodLid(p.idx)}
          onLaunch={() => launchEscapePod(p.idx)}
        />
      ))}
    </group>
  );
};
