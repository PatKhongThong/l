import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { ComponentIntegrity, useShipStore } from '../store/useShipStore';
import { PlayerShipModel } from './PlayerShipModel';

const evaKeys: Record<string, boolean> = {};

const EVA_REPAIR_NODES: Array<{
  key: keyof ComponentIntegrity;
  label: string;
  localPos: [number, number, number];
}> = [
  { key: 'engines', label: 'MAIN PLASMA ENGINES', localPos: [-2.5, 0.5, 7.9] },
  { key: 'reactor', label: 'REACTOR RADIATOR SPINE', localPos: [0, 2.0, 4.1] },
  { key: 'comms', label: 'SUBSPACE COMM DISH', localPos: [0, 3.2, -1.9] },
  { key: 'sensors', label: 'FORWARD SENSOR ARRAY', localPos: [0, 0.5, -8.4] },
  { key: 'hullPort', label: 'PORT WING PLATING', localPos: [-6.2, 0.6, 1.6] },
  { key: 'hullStarboard', label: 'STARBOARD WING PLATING', localPos: [6.2, 0.6, 1.6] },
];

export const EvaController: React.FC = () => {
  const { camera, gl } = useThree();
  const components = useShipStore((s) => s.components);
  const shipPos = useShipStore((s) => s.position);
  const shipQuat = useShipStore((s) => s.quaternion);
  const evaWeldComponent = useShipStore((s) => s.evaWeldComponent);

  const evaPos = useRef(new THREE.Vector3(shipPos[0] + 10.5, shipPos[1] + 4.5, shipPos[2] + 7.5));
  const evaVel = useRef(new THREE.Vector3());
  const yaw = useRef(0.6);
  const pitch = useRef(-0.15);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      evaKeys[e.code] = true;
      if (e.code === 'KeyE') {
        // Weld nearest damaged component within 7m
        const s = useShipStore.getState();
        const origin = new THREE.Vector3(...s.position);
        for (const node of EVA_REPAIR_NODES) {
          const worldNode = new THREE.Vector3(...node.localPos).add(origin);
          if (worldNode.distanceTo(evaPos.current) < 7 && s.components[node.key] < 100) {
            s.evaWeldComponent(node.key);
            break;
          }
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      evaKeys[e.code] = false;
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
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0035, -1.2, 1.2);
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
      Object.keys(evaKeys).forEach((k) => {
        evaKeys[k] = false;
      });
    };
  }, [gl.domElement]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useShipStore.getState();

    if (evaKeys['ArrowLeft']) yaw.current += dt * 1.8;
    if (evaKeys['ArrowRight']) yaw.current -= dt * 1.8;
    if (evaKeys['ArrowUp']) pitch.current = Math.min(1.2, pitch.current + dt * 1.3);
    if (evaKeys['ArrowDown']) pitch.current = Math.max(-1.2, pitch.current - dt * 1.3);

    const forward = new THREE.Vector3(
      -Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      -Math.cos(yaw.current) * Math.cos(pitch.current)
    ).normalize();
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current)).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    const accel = 9.5;
    if (evaKeys['KeyW']) evaVel.current.addScaledVector(forward, accel * dt);
    if (evaKeys['KeyS']) evaVel.current.addScaledVector(forward, -accel * dt);
    if (evaKeys['KeyD']) evaVel.current.addScaledVector(right, accel * dt);
    if (evaKeys['KeyA']) evaVel.current.addScaledVector(right, -accel * dt);
    if (evaKeys['Space']) evaVel.current.addScaledVector(up, accel * dt);
    if (evaKeys['ShiftLeft'] || evaKeys['ShiftRight']) evaVel.current.addScaledVector(up, -accel * dt);

    // Zero-G gentle jetpack damping
    evaVel.current.multiplyScalar(Math.exp(-dt * 1.35));
    evaPos.current.addScaledVector(evaVel.current, dt);

    // Tether constraint (max 55m from airlock)
    const airlockWorld = new THREE.Vector3(s.position[0], s.position[1] + 2.2, s.position[2] + 1.3);
    const toEva = evaPos.current.clone().sub(airlockWorld);
    const dist = toEva.length();
    if (dist > 55) {
      toEva.setLength(55);
      evaPos.current.copy(airlockWorld).add(toEva);
      evaVel.current.multiplyScalar(-0.2);
    }

    camera.position.copy(evaPos.current);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    camera.rotation.z = 0;

    // Suit oxygen drain
    const nextO2 = Math.max(0, s.evaOxygen - dt * 0.45);
    s.applyTick({
      simTime: s.simTime + dt,
      evaOxygen: nextO2,
      evaTetherDistance: dist,
    });
  });

  return (
    <group>
      {/* Full External 3D Spacecraft for Inspection & Repair */}
      <group position={shipPos} quaternion={shipQuat}>
        <PlayerShipModel />

        {/* Interactive External Repair Nodes */}
        {EVA_REPAIR_NODES.map((node) => {
          const health = components[node.key];
          const damaged = health < 100;
          return (
            <group key={node.key} position={node.localPos}>
              <mesh onClick={() => evaWeldComponent(node.key)}>
                <sphereGeometry args={[damaged ? 0.35 : 0.2, 12, 10]} />
                <meshBasicMaterial color={damaged ? '#f59e0b' : '#10b981'} wireframe />
              </mesh>
              <Html position={[0, 0.55, 0]} center distanceFactor={10}>
                <button
                  onClick={() => evaWeldComponent(node.key)}
                  style={{
                    cursor: 'pointer',
                    background: damaged ? 'rgba(245, 158, 11, 0.25)' : 'rgba(4, 12, 24, 0.8)',
                    border: `1px solid ${damaged ? '#f59e0b' : '#10b981'}`,
                    color: '#fff',
                    fontSize: 8.5,
                    padding: '2px 6px',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.label} ({Math.round(health)}%) {damaged ? '• WELD' : '✓'}
                </button>
              </Html>
            </group>
          );
        })}
      </group>

      {/* Safety Tether Line */}
      <Line
        points={[
          [shipPos[0], shipPos[1] + 2.2, shipPos[2] + 1.3],
          [evaPos.current.x, evaPos.current.y - 0.6, evaPos.current.z],
        ]}
        color="#f59e0b"
        lineWidth={1.2}
        transparent
        opacity={0.6}
      />
    </group>
  );
};

