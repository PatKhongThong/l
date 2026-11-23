import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { findRoomAtPosition, SHIP_ROOMS } from '../data/shipInterior';
import { useShipStore } from '../store/useShipStore';
import { multiplayerClient, RemotePlayer } from '../utils/multiplayer';
import { getDeckTexture } from '../utils/proceduralTextures';
import { EscapePodBank } from './EscapePodBank';
import { PhysicalPushButton, PhysicalToggleSwitch } from './TactileControls';

const walkKeys: Record<string, boolean> = {};

const RemoteInteriorAvatar: React.FC<{ player: RemotePlayer }> = ({ player }) => {
  const grpRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3());

  // If the remote player is flying at the helm, show them stationed at the Command Bridge helm console!
  const desired =
    player.playerMode === 'flight'
      ? ([0, 0, -15.5] as [number, number, number])
      : ([player.interiorPos[0], 0, player.interiorPos[2]] as [number, number, number]);

  targetPos.current.set(desired[0], 0, desired[2]);

  useFrame((_, dt) => {
    if (!grpRef.current) return;
    grpRef.current.position.lerp(targetPos.current, Math.min(1, dt * 10));
    grpRef.current.rotation.y = THREE.MathUtils.lerp(grpRef.current.rotation.y, player.interiorYaw || 0, Math.min(1, dt * 10));
  });

  const suitColor =
    player.job === 'PILOT'
      ? '#00e5ff'
      : player.job === 'ENGINEER'
        ? '#f59e0b'
        : player.job === 'WEAPONS'
          ? '#ef4444'
          : player.job === 'SCIENTIST'
            ? '#a855f7'
            : '#10b981';

  return (
    <group ref={grpRef} position={[desired[0], 0, desired[2]]}>
      {/* Spacesuit Torso */}
      <mesh position={[0, 1.0, 0]}>
        <capsuleGeometry args={[0.3, 0.9, 8, 14]} />
        <meshStandardMaterial color={suitColor} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Life-Support Backpack */}
      <mesh position={[0, 1.12, 0.28]}>
        <boxGeometry args={[0.42, 0.58, 0.22]} />
        <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Helmet + Glowing Cyan Visor */}
      <mesh position={[0, 1.78, 0]}>
        <sphereGeometry args={[0.25, 16, 14]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.78, -0.18]} scale={[0.9, 0.65, 0.6]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.85} metalness={0.9} roughness={0.1} />
      </mesh>
      <pointLight position={[0, 2.0, 0]} color={suitColor} distance={5} intensity={1.1} />
      <Html position={[0, 2.35, 0]} center distanceFactor={11}>
        <div
          style={{
            background: 'rgba(4, 22, 18, 0.92)',
            border: `1px solid ${suitColor}`,
            color: '#fff',
            padding: '2px 7px',
            fontSize: 9.5,
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 10px ${suitColor}55`,
          }}
        >
          ★ {player.callsign} [{player.job}] {player.playerMode === 'flight' ? '• AT HELM' : '• WALKING'}
        </div>
      </Html>
    </group>
  );
};

export const ShipInteriorScene: React.FC = () => {
  const { camera, gl } = useThree();
  const redAlert = useShipStore((s) => s.redAlert);
  const crew = useShipStore((s) => s.crew);
  const robots = useShipStore((s) => s.robots);
  const lockedRooms = useShipStore((s) => s.lockedRooms);
  const remotePlayers = useShipStore((s) => s.remotePlayers);
  const boardedHostId = useShipStore((s) => s.boardedHostId);
  const myShipId = boardedHostId || multiplayerClient.playerId;
  const shipPosition = useShipStore((s) => s.position);
  const shipQuaternion = useShipStore((s) => s.quaternion);
  const deuteriumCores = useShipStore((s) => s.deuteriumCores);
  const coolantCanisters = useShipStore((s) => s.coolantCanisters);
  const enginesOnline = useShipStore((s) => s.enginesOnline);
  const shieldsOnline = useShipStore((s) => s.shieldsOnline);
  const lifeSupportOnline = useShipStore((s) => s.lifeSupportOnline);
  const internalGravityOnline = useShipStore((s) => s.internalGravityOnline);
  const backupGeneratorOnline = useShipStore((s) => s.backupGeneratorOnline);
  const headlights = useShipStore((s) => s.headlights);
  const toggleSystem = useShipStore((s) => s.toggleSystem);
  const toggleRedAlert = useShipStore((s) => s.toggleRedAlert);
  const toggleHeadlights = useShipStore((s) => s.toggleHeadlights);
  const loadDeuteriumCore = useShipStore((s) => s.loadDeuteriumCore);
  const loadCoolantCanister = useShipStore((s) => s.loadCoolantCanister);
  const triggerCoolantFlush = useShipStore((s) => s.triggerCoolantFlush);
  const triggerFireSuppression = useShipStore((s) => s.triggerFireSuppression);
  const setPlayerMode = useShipStore((s) => s.setPlayerMode);

  const deckTex = useMemo(() => getDeckTexture(), []);
  const initialInteriorPos = useShipStore.getState().interiorPos;
  const playerPos = useRef(new THREE.Vector3(initialInteriorPos[0], 1.65, initialInteriorPos[2]));
  const yaw = useRef(useShipStore.getState().interiorYaw || 0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const reactorRing1 = useRef<THREE.Mesh>(null);
  const reactorRing2 = useRef<THREE.Mesh>(null);
  const upgradeHologram = useRef<THREE.Mesh>(null);

  const shipPosVec = useRef(new THREE.Vector3());
  const shipQuat = useRef(new THREE.Quaternion());
  const localCamQuat = useRef(new THREE.Quaternion());
  const localEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      walkKeys[e.code] = true;
      if (e.code === 'KeyE') {
        const s = useShipStore.getState();
        const room = findRoomAtPosition(playerPos.current.x, playerPos.current.z);
        if (room) {
          if (room.isAirlock) {
            s.setPlayerMode('eva');
          } else if (room.id === 'command-bridge') {
            s.setPlayerMode('flight');
          } else if (room.linkedStation) {
            s.setActiveView(room.linkedStation);
          }
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      walkKeys[e.code] = false;
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
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0035, -0.8, 0.8);
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
      Object.keys(walkKeys).forEach((k) => {
        walkKeys[k] = false;
      });
    };
  }, [gl.domElement]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useShipStore.getState();

    // Keep universe simTime ticking + publish live interior walking coordinates for multiplayer!
    s.applyTick({
      simTime: s.simTime + dt,
      interiorPos: [playerPos.current.x, playerPos.current.y, playerPos.current.z],
      interiorYaw: yaw.current,
    });

    if (reactorRing1.current) reactorRing1.current.rotation.y += dt * 1.1;
    if (reactorRing2.current) reactorRing2.current.rotation.x -= dt * 0.85;
    if (upgradeHologram.current) upgradeHologram.current.rotation.y += dt * 0.9;

    if (s.activeView === 'bridge') {
      if (walkKeys['ArrowLeft']) yaw.current += dt * 2.0;
      if (walkKeys['ArrowRight']) yaw.current -= dt * 2.0;
      if (walkKeys['ArrowUp']) pitch.current = Math.min(0.8, pitch.current + dt * 1.3);
      if (walkKeys['ArrowDown']) pitch.current = Math.max(-0.8, pitch.current - dt * 1.3);

      const speed = walkKeys['ShiftLeft'] ? 10.5 : 6.2;
      const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
      const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));

      const move = new THREE.Vector3();
      if (walkKeys['KeyW']) move.add(forward);
      if (walkKeys['KeyS']) move.sub(forward);
      if (walkKeys['KeyD']) move.add(right);
      if (walkKeys['KeyA']) move.sub(right);

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed * dt);
        const nx = THREE.MathUtils.clamp(playerPos.current.x + move.x, -13.5, 13.5);
        const nz = THREE.MathUtils.clamp(playerPos.current.z + move.z, -27.2, 33.8);
        const targetRoom = findRoomAtPosition(nx, nz);
        if (!targetRoom || !s.lockedRooms.includes(targetRoom.id)) {
          playerPos.current.x = nx;
          playerPos.current.z = nz;
        }
      }

      const currentRoom = findRoomAtPosition(playerPos.current.x, playerPos.current.z);
      if (currentRoom && currentRoom.id !== s.interiorRoomId) {
        s.setInteriorRoom(currentRoom.id);
      }
    }

    // Transform ship-local walking camera into world space so real planets/stars/stations sit outside the windows!
    shipPosVec.current.set(s.position[0], s.position[1], s.position[2]);
    shipQuat.current.set(s.quaternion[0], s.quaternion[1], s.quaternion[2], s.quaternion[3]);

    const worldEye = playerPos.current.clone().applyQuaternion(shipQuat.current).add(shipPosVec.current);
    camera.position.copy(worldEye);

    localEuler.current.set(pitch.current, yaw.current, 0, 'YXZ');
    localCamQuat.current.setFromEuler(localEuler.current);
    camera.quaternion.copy(shipQuat.current).multiply(localCamQuat.current);
  });

  const lightColor = redAlert ? '#ef4444' : '#38bdf8';

  return (
    <group position={shipPosition} quaternion={shipQuaternion}>
      <ambientLight intensity={redAlert ? 0.35 : 0.48} color={redAlert ? '#fca5a5' : '#bae6fd'} />

      {/* Main Pressurized Deck Floor */}
      <mesh position={[0, 0, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 68]} />
        <meshStandardMaterial map={deckTex} roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Translucent Armored Glass Skylight Roof over Corridor & Observation Deck so you can look UP at stars & planets! */}
      <mesh position={[0, 4.35, 3]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 66]} />
        <meshPhysicalMaterial
          color="#0ea5e9"
          transparent
          opacity={0.14}
          roughness={0.1}
          metalness={0.2}
          depthWrite={false}
        />
      </mesh>
      {/* Solid Side Ceiling Wings */}
      <mesh position={[-9.5, 4.35, 7]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 56]} />
        <meshStandardMaterial color="#09111f" roughness={0.8} metalness={0.5} />
      </mesh>
      <mesh position={[9.5, 4.35, 7]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 56]} />
        <meshStandardMaterial color="#09111f" roughness={0.8} metalness={0.5} />
      </mesh>

      {/* Observation Deck Panoramic Forward Glass Window Frame (Wide open view into real 3D space!) */}
      <group position={[0, 2.2, -28]}>
        <mesh position={[0, -2.0, 0]}>
          <boxGeometry args={[11, 0.4, 0.3]} />
          <meshStandardMaterial color="#162133" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.0, 0]}>
          <boxGeometry args={[11, 0.35, 0.3]} />
          <meshStandardMaterial color="#162133" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh>
          <planeGeometry args={[10.6, 3.8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>

      {/* Industrial Corridor Steel Arch Ribs & Overhead Conduit Piping */}
      {[-20, -10, 0, 10, 20, 30].map((rz) => (
        <group key={rz} position={[0, 0, rz]}>
          <mesh position={[-3.2, 2.2, 0]}>
            <boxGeometry args={[0.28, 4.4, 0.35]} />
            <meshStandardMaterial color="#182234" metalness={0.85} roughness={0.32} />
          </mesh>
          <mesh position={[3.2, 2.2, 0]}>
            <boxGeometry args={[0.28, 4.4, 0.35]} />
            <meshStandardMaterial color="#182234" metalness={0.85} roughness={0.32} />
          </mesh>
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[6.6, 0.24, 0.35]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Glowing Central Corridor Spine Guide Lines */}
      <mesh position={[-1.4, 0.02, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 58]} />
        <meshBasicMaterial color={lightColor} />
      </mesh>
      <mesh position={[1.4, 0.02, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 58]} />
        <meshBasicMaterial color={lightColor} />
      </mesh>

      {/* Render All 15 Connected Rooms */}
      {SHIP_ROOMS.map((room) => {
        const [cx, , cz] = room.center;
        const [rw, rh, rd] = room.size;
        const isLocked = lockedRooms.includes(room.id);
        return (
          <group key={room.id} position={[cx, 0, cz]}>
            <pointLight position={[0, rh - 0.5, 0]} color={redAlert ? '#ef4444' : room.accentColor} intensity={1.8} distance={14} />

            {/* Room floor perimeter strip */}
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[Math.min(rw, rd) * 0.44, Math.min(rw, rd) * 0.46, 4]} />
              <meshBasicMaterial color={isLocked ? '#ef4444' : room.accentColor} transparent opacity={0.45} />
            </mesh>

            {/* Corner Structural Pillars (keeping outer walls open-windowed so space is visible!) */}
            {[
              [-rw / 2 + 0.3, -rd / 2 + 0.3],
              [rw / 2 - 0.3, -rd / 2 + 0.3],
              [-rw / 2 + 0.3, rd / 2 - 0.3],
              [rw / 2 - 0.3, rd / 2 - 0.3],
            ].map(([px, pz], i) => (
              <mesh key={i} position={[px, rh / 2, pz]}>
                <boxGeometry args={[0.35, rh, 0.35]} />
                <meshStandardMaterial color="#162133" metalness={0.8} roughness={0.35} />
              </mesh>
            ))}

            {/* Glowing Floating Room Sign */}
            <Html position={[0, rh - 0.7, 0]} center distanceFactor={14}>
              <div
                style={{
                  background: 'rgba(3, 9, 20, 0.86)',
                  border: `1px solid ${isLocked ? '#ef4444' : room.accentColor}`,
                  color: '#fff',
                  padding: '2px 8px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 9,
                  letterSpacing: '0.16em',
                  whiteSpace: 'nowrap',
                }}
              >
                {room.name} {isLocked ? '[LOCKED]' : ''}
              </div>
            </Html>

            {/* Room-Specific 3D Machinery + REAL PHYSICAL CLICKABLE 3D SWITCHES & BUTTONS! */}
            {room.id === 'reactor-room' && (
              <group>
                <group position={[0, 2.2, 0]}>
                  <mesh>
                    <cylinderGeometry args={[1.1, 1.1, 4.2, 16]} />
                    <meshStandardMaterial
                      color="#0ea5e9"
                      emissive={redAlert ? '#ef4444' : '#00e5ff'}
                      emissiveIntensity={1.6}
                      transparent
                      opacity={0.75}
                    />
                  </mesh>
                  <mesh ref={reactorRing1}>
                    <torusGeometry args={[2.1, 0.14, 10, 28]} />
                    <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
                  </mesh>
                  <mesh ref={reactorRing2} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.7, 0.1, 10, 28]} />
                    <meshBasicMaterial color={redAlert ? '#ef4444' : '#00e5ff'} />
                  </mesh>
                </group>
                {/* Physical Reactor Control Pedestal with Clickable Switches */}
                <group position={[0, 1.1, -3.2]}>
                  <mesh>
                    <boxGeometry args={[2.4, 1.2, 0.6]} />
                    <meshStandardMaterial color="#131c2b" metalness={0.85} roughness={0.3} />
                  </mesh>
                  <PhysicalToggleSwitch
                    position={[-0.65, 0.25, 0.32]}
                    label="BACKUP GEN"
                    active={backupGeneratorOnline}
                    onToggle={() => toggleSystem('backupGeneratorOnline')}
                  />
                  <PhysicalPushButton
                    position={[0.1, 0.25, 0.32]}
                    label="HALON SUPPRESS (-180K)"
                    color="#ef4444"
                    onPress={triggerFireSuppression}
                  />
                  <PhysicalPushButton
                    position={[0.75, 0.25, 0.32]}
                    label="VENT COOLANT"
                    color="#22d3ee"
                    onPress={triggerCoolantFlush}
                  />
                </group>
              </group>
            )}

            {/* MAIN ENGINEERING: Physical 3D Circuit Breaker Switch Wall! */}
            {room.id === 'main-engineering' && (
              <group position={[0, 1.25, -2.8]}>
                <mesh>
                  <boxGeometry args={[3.4, 1.4, 0.5]} />
                  <meshStandardMaterial color="#111927" metalness={0.85} roughness={0.32} />
                </mesh>
                <PhysicalToggleSwitch
                  position={[-1.15, 0.15, 0.28]}
                  label="MAIN ENGINES"
                  active={enginesOnline}
                  onToggle={() => toggleSystem('enginesOnline')}
                />
                <PhysicalToggleSwitch
                  position={[-0.4, 0.15, 0.28]}
                  label="DEFLECTOR SHIELDS"
                  active={shieldsOnline}
                  onToggle={() => toggleSystem('shieldsOnline')}
                />
                <PhysicalToggleSwitch
                  position={[0.35, 0.15, 0.28]}
                  label="LIFE SUPPORT"
                  active={lifeSupportOnline}
                  onToggle={() => toggleSystem('lifeSupportOnline')}
                />
                <PhysicalToggleSwitch
                  position={[1.1, 0.15, 0.28]}
                  label="INTERNAL GRAVITY"
                  active={internalGravityOnline}
                  onToggle={() => toggleSystem('internalGravityOnline')}
                />
              </group>
            )}

            {/* FUEL BAY: Glowing Deuterium Core Intake + Physical 3D LOAD CORE Button! */}
            {room.id === 'fuel-bay' && (
              <group>
                <mesh position={[0, 1.3, 0]}>
                  <cylinderGeometry args={[0.9, 1.0, 2.6, 16]} />
                  <meshStandardMaterial color="#451a03" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[0, 1.3, 0]}>
                  <cylinderGeometry args={[0.55, 0.55, 2.1, 12]} />
                  <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} />
                </mesh>
                <PhysicalPushButton
                  position={[1.25, 1.3, 0.8]}
                  rotation={[0, -0.5, 0]}
                  label={`LOAD DEUTERIUM CORE (${deuteriumCores})`}
                  color="#f59e0b"
                  onPress={loadDeuteriumCore}
                />
                {Array.from({ length: Math.min(4, deuteriumCores) }).map((_, i) => (
                  <mesh key={i} position={[-2.2 + i * 0.85, 0.75, -2.2]}>
                    <cylinderGeometry args={[0.22, 0.22, 1.2, 10]} />
                    <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.2} />
                  </mesh>
                ))}
              </group>
            )}

            {/* COOLANT BAY: Cryo Tanks + Physical 3D LOAD CANISTER & VENT Buttons! */}
            {room.id === 'coolant-bay' && (
              <group>
                <mesh position={[-1.4, 1.4, 0]}>
                  <cylinderGeometry args={[0.7, 0.7, 2.8, 16]} />
                  <meshStandardMaterial color="#083344" emissive="#22d3ee" emissiveIntensity={0.7} />
                </mesh>
                <mesh position={[1.4, 1.4, 0]}>
                  <cylinderGeometry args={[0.7, 0.7, 2.8, 16]} />
                  <meshStandardMaterial color="#083344" emissive="#22d3ee" emissiveIntensity={0.7} />
                </mesh>
                <PhysicalPushButton
                  position={[-0.35, 1.25, 1.2]}
                  label={`LOAD COOLANT CANISTER (${coolantCanisters})`}
                  color="#22d3ee"
                  onPress={loadCoolantCanister}
                />
                <PhysicalPushButton
                  position={[0.45, 1.25, 1.2]}
                  label="VENT COOLANT (-160K)"
                  color="#38bdf8"
                  onPress={triggerCoolantFlush}
                />
                {Array.from({ length: Math.min(4, coolantCanisters) }).map((_, i) => (
                  <mesh key={i} position={[-1.6 + i * 0.9, 0.65, -2.2]}>
                    <cylinderGeometry args={[0.2, 0.2, 1.0, 10]} />
                    <meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={1.1} />
                  </mesh>
                ))}
              </group>
            )}

            {/* UPGRADE BAY: Rotating Holographic Ship Upgrade Pedestal */}
            {room.id === 'upgrade-bay' && (
              <group position={[0, 1.0, 0]}>
                <mesh>
                  <cylinderGeometry args={[1.3, 1.5, 0.8, 16]} />
                  <meshStandardMaterial color="#0f2922" metalness={0.85} roughness={0.25} />
                </mesh>
                <mesh ref={upgradeHologram} position={[0, 1.15, 0]}>
                  <octahedronGeometry args={[0.72, 0]} />
                  <meshBasicMaterial color="#34d399" wireframe />
                </mesh>
              </group>
            )}

            {/* ONBOARD ROBOTIC FABRICATOR BAY: Mini Articulated Mechanical Arm! */}
            {room.id === 'fabricator-bay' && (
              <group position={[0, 0.6, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.9, 1.1, 1.2, 12]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
                </mesh>
                <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0.3]}>
                  <boxGeometry args={[0.35, 1.8, 0.35]} />
                  <meshStandardMaterial color="#facc15" metalness={0.75} roughness={0.3} />
                </mesh>
                <mesh position={[-0.45, 2.0, 0]}>
                  <octahedronGeometry args={[0.28, 0]} />
                  <meshBasicMaterial color="#00e5ff" />
                </mesh>
              </group>
            )}

            {/* CARGO BAY B: Heavy Alloy Pallets */}
            {room.id === 'cargo-bay-b' && (
              <group>
                <mesh position={[-1.6, 0.9, -1.2]}>
                  <boxGeometry args={[1.8, 1.8, 1.8]} />
                  <meshStandardMaterial color="#c2410c" metalness={0.55} roughness={0.5} />
                </mesh>
                <mesh position={[1.6, 0.9, 1.2]}>
                  <boxGeometry args={[1.8, 1.8, 1.8]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.55} roughness={0.5} />
                </mesh>
              </group>
            )}

            {/* DRONE & SHUTTLE HANGAR */}
            {room.id === 'hangar-bay' && (
              <group position={[0, 1.1, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <coneGeometry args={[1.4, 3.8, 4]} />
                  <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.28} />
                </mesh>
                <mesh position={[0, 0, 2.1]}>
                  <sphereGeometry args={[0.45, 10, 10]} />
                  <meshBasicMaterial color="#22d3ee" />
                </mesh>
              </group>
            )}

            {room.id === 'command-bridge' && (
              <group position={[0, 0.9, -2.5]}>
                <mesh>
                  <boxGeometry args={[4.4, 0.9, 1.2]} />
                  <meshStandardMaterial color="#111a2c" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.65, -0.3]} rotation={[-0.4, 0, 0]}>
                  <planeGeometry args={[3.8, 0.7]} />
                  <meshBasicMaterial color={redAlert ? '#ef4444' : '#00e5ff'} transparent opacity={0.38} />
                </mesh>
                {/* Physical Clickable Bridge Console Buttons */}
                <PhysicalPushButton
                  position={[-1.45, 0.5, 0.42]}
                  rotation={[-0.6, 0, 0]}
                  label={redAlert ? 'STAND DOWN RED ALERT' : 'ENGAGE RED ALERT'}
                  color="#ef4444"
                  onPress={toggleRedAlert}
                />
                <PhysicalToggleSwitch
                  position={[1.45, 0.5, 0.42]}
                  rotation={[-0.6, 0, 0]}
                  label="SHIP HEADLIGHTS"
                  active={headlights}
                  onToggle={toggleHeadlights}
                />
              </group>
            )}

            {room.id === 'navigation-room' && (
              <group position={[0, 1.0, 0]}>
                <mesh>
                  <cylinderGeometry args={[1.4, 1.6, 0.85, 16]} />
                  <meshStandardMaterial color="#132036" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.9, 0]}>
                  <sphereGeometry args={[0.55, 16, 12]} />
                  <meshBasicMaterial color="#00e5ff" wireframe />
                </mesh>
              </group>
            )}

            {room.id === 'medical-bay' && (
              <group>
                <mesh position={[-1.6, 0.55, 0]}>
                  <boxGeometry args={[1.3, 0.55, 2.4]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
                </mesh>
                <mesh position={[1.6, 0.55, 0]}>
                  <boxGeometry args={[1.3, 0.55, 2.4]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
                </mesh>
              </group>
            )}

            {room.id === 'science-lab' && (
              <group>
                {[-1.8, 0, 1.8].map((ox, i) => (
                  <mesh key={i} position={[ox, 1.4, -1.6]}>
                    <cylinderGeometry args={[0.42, 0.42, 2.4, 14]} />
                    <meshStandardMaterial
                      color="#a855f7"
                      emissive="#a855f7"
                      emissiveIntensity={0.6}
                      transparent
                      opacity={0.5}
                    />
                  </mesh>
                ))}
              </group>
            )}

            {room.id === 'cargo-bay' && (
              <group>
                <mesh position={[-1.5, 0.8, -1.2]}>
                  <boxGeometry args={[1.6, 1.6, 1.6]} />
                  <meshStandardMaterial color="#9a3412" metalness={0.5} roughness={0.6} />
                </mesh>
                <mesh position={[1.4, 0.8, 1.1]}>
                  <boxGeometry args={[1.8, 1.5, 1.8]} />
                  <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.6} />
                </mesh>
              </group>
            )}

            {room.id === 'airlock' && (
              <group>
                {/* Outer EVA Airlock Hatch */}
                <group position={[2.9, 1.6, 1.8]}>
                  <mesh>
                    <boxGeometry args={[0.4, 2.8, 2.4]} />
                    <meshStandardMaterial color="#7f1d1d" metalness={0.8} roughness={0.3} />
                  </mesh>
                  <mesh position={[-0.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[0.8, 0.08, 8, 20]} />
                    <meshBasicMaterial color="#ef4444" />
                  </mesh>
                  {/* Physical 3D EVA Depressurize Hatch Button */}
                  <PhysicalPushButton
                    position={[-0.3, -0.2, 1.55]}
                    rotation={[0, -Math.PI / 2, 0]}
                    label="DEPRESSURIZE & ENTER EVA"
                    color="#ef4444"
                    onPress={() => setPlayerMode('eva')}
                  />
                </group>
                {/* Trio of High-Detail Industrial CP-12 Escape Pods (Matches Reference!) */}
                <EscapePodBank />
              </group>
            )}
          </group>
        );
      })}

      {/* 3D Crew Avatars */}
      {crew.map((member, idx) => {
        const room = SHIP_ROOMS.find((r) => r.id === member.currentRoomId) || SHIP_ROOMS[1];
        const offsetX = ((idx % 3) - 1) * 1.4;
        const offsetZ = (Math.floor(idx / 3) - 1) * 1.2;
        return (
          <group key={member.id} position={[room.center[0] + offsetX, 0, room.center[2] + offsetZ]}>
            <mesh position={[0, 0.95, 0]}>
              <capsuleGeometry args={[0.26, 0.95, 6, 12]} />
              <meshStandardMaterial color={member.avatarColor} metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.72, 0]}>
              <sphereGeometry args={[0.22, 12, 10]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
            </mesh>
            <Html position={[0, 2.2, 0]} center distanceFactor={11}>
              <div
                style={{
                  background: 'rgba(2, 6, 14, 0.84)',
                  border: `1px solid ${member.avatarColor}`,
                  padding: '2px 6px',
                  fontSize: 8.5,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {member.name} • {member.status}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Live Remote Crewmates Boarded on THIS Same Ship */}
      {Object.values(remotePlayers)
        .filter((player) => player.shipHostId === myShipId)
        .map((player) => (
          <RemoteInteriorAvatar key={player.id} player={player} />
        ))}

      {/* 3D Maintenance Robots */}
      {robots.map((bot, idx) => {
        const room = SHIP_ROOMS.find((r) => r.id === bot.assignedRoomId) || SHIP_ROOMS[8];
        return (
          <group key={bot.id} position={[room.center[0] + (idx === 0 ? -1.8 : 1.8), 0.75, room.center[2] + 1.8]}>
            <mesh>
              <sphereGeometry args={[0.38, 16, 12]} />
              <meshStandardMaterial color="#facc15" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.05, -0.36]}>
              <sphereGeometry args={[0.12, 10, 10]} />
              <meshBasicMaterial color="#00e5ff" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
