import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { getNpcPosition, getStarSystem, SpaceObject } from '../data/starSystems';
import { useShipStore } from '../store/useShipStore';
import { getPlanetTexture } from '../utils/proceduralTextures';
import { RemoteShipModel } from './RemoteShipModel';

const PlanetMesh: React.FC<{ obj: SpaceObject; selected: boolean }> = ({ obj, selected }) => {
  const ref = useRef<THREE.Group>(null);
  const tex = useMemo(
    () => getPlanetTexture(obj.id, obj.color, obj.secondaryColor || '#334155', obj.planetStyle || 'oceanic'),
    [obj.id, obj.color, obj.secondaryColor, obj.planetStyle]
  );

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.03;
  });

  return (
    <group position={obj.position} ref={ref}>
      <mesh>
        <sphereGeometry args={[obj.radius, 48, 36]} />
        <meshStandardMaterial map={tex} roughness={0.82} metalness={0.1} />
      </mesh>
      {obj.atmosphereColor && (
        <mesh scale={1.06}>
          <sphereGeometry args={[obj.radius, 32, 24]} />
          <meshBasicMaterial
            color={obj.atmosphereColor}
            transparent
            opacity={0.19}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
      {obj.hasRings && (
        <mesh rotation={[Math.PI * 0.42, 0.25, 0]}>
          <ringGeometry args={[obj.radius * 1.32, obj.radius * 1.98, 72]} />
          <meshBasicMaterial
            color={obj.ringColor || '#67e8f9'}
            transparent
            opacity={0.34}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      {selected && (
        <mesh>
          <sphereGeometry args={[obj.radius * 1.14, 16, 12]} />
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.14} />
        </mesh>
      )}
    </group>
  );
};

const StationMesh: React.FC<{ obj: SpaceObject; selected: boolean }> = ({ obj, selected }) => {
  const ringRef = useRef<THREE.Group>(null);
  const lowerRingRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  useFrame((state, dt) => {
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.22;
    if (lowerRingRef.current) lowerRingRef.current.rotation.z -= dt * 0.14;
    if (beaconRef.current) {
      beaconRef.current.intensity = 2.5 + Math.sin(state.clock.elapsedTime * 3.5) * 1.6;
    }
  });

  return (
    <group position={obj.position}>
      {/* Central Command Spire */}
      <mesh>
        <cylinderGeometry args={[5.5, 8.5, 44, 14]} />
        <meshStandardMaterial color="#1e293b" metalness={0.84} roughness={0.28} />
      </mesh>
      {/* Docking Port Hub */}
      <mesh position={[0, -24, 0]}>
        <cylinderGeometry args={[7, 5, 8, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.32} />
      </mesh>
      {/* Upper Rotating Habitat Ring */}
      <group ref={ringRef} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[22, 3.2, 12, 36]} />
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.28} />
        </mesh>
        <mesh>
          <boxGeometry args={[44, 2.2, 2.2]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[44, 2.2, 2.2]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh>
          <torusGeometry args={[22, 0.5, 8, 36]} />
          <meshBasicMaterial color={obj.color} />
        </mesh>
      </group>
      {/* Lower Counter-Rotating Solar Array Ring */}
      <group ref={lowerRingRef} position={[0, -10, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[15, 1.5, 10, 28]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {/* Docking Beacon */}
      <mesh position={[0, 25, 0]}>
        <octahedronGeometry args={[3.2, 0]} />
        <meshBasicMaterial color={selected ? '#00e5ff' : obj.color} />
      </mesh>
      <pointLight ref={beaconRef} position={[0, 27, 0]} color={obj.color} distance={160} intensity={3.5} />
    </group>
  );
};

const SatelliteMesh: React.FC<{ obj: SpaceObject }> = ({ obj }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25;
  });
  return (
    <group position={obj.position} ref={ref}>
      {/* Gold foil core bus */}
      <mesh>
        <boxGeometry args={[5, 5, 6]} />
        <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.25} />
      </mesh>
      {/* Solar Wing Arrays */}
      <mesh position={[-11, 0, 0]}>
        <boxGeometry args={[14, 0.25, 4.5]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.65} roughness={0.2} emissive="#1e3a8a" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[11, 0, 0]}>
        <boxGeometry args={[14, 0.25, 4.5]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.65} roughness={0.2} emissive="#1e3a8a" emissiveIntensity={0.4} />
      </mesh>
      {/* High-gain dish */}
      <mesh position={[0, 4.2, 0]}>
        <cylinderGeometry args={[3.2, 0.6, 1.4, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
      </mesh>
      <pointLight color="#00e5ff" distance={70} intensity={2} />
    </group>
  );
};

const DerelictMesh: React.FC<{ obj: SpaceObject }> = ({ obj }) => {
  const ref = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);
  useFrame((state, dt) => {
    if (ref.current) {
      ref.current.rotation.z += dt * 0.08;
      ref.current.rotation.x += dt * 0.05;
    }
    if (beaconRef.current) {
      beaconRef.current.intensity = Math.sin(state.clock.elapsedTime * 6) > 0.3 ? 4 : 0.2;
    }
  });
  return (
    <group position={obj.position} ref={ref}>
      <mesh>
        <boxGeometry args={[8, 6, 26]} />
        <meshStandardMaterial color="#27272a" roughness={0.85} metalness={0.5} />
      </mesh>
      <mesh position={[7, 2, -4]} rotation={[0.2, 0.1, -0.4]}>
        <boxGeometry args={[10, 1.2, 7]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.8} metalness={0.45} />
      </mesh>
      <mesh position={[-6, -2, 6]} rotation={[-0.3, 0.2, 0.5]}>
        <boxGeometry args={[8, 1.5, 6]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.8} metalness={0.45} />
      </mesh>
      <pointLight ref={beaconRef} position={[0, 4, 0]} color="#ef4444" distance={130} intensity={3} />
    </group>
  );
};

const CometMesh: React.FC<{ obj: SpaceObject }> = ({ obj }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.5;
  });
  return (
    <group position={obj.position}>
      <mesh ref={ref}>
        <dodecahedronGeometry args={[obj.radius, 1]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.4} roughness={0.7} />
      </mesh>
      {/* Ionized Cometary Tail */}
      <mesh position={[35, 12, 35]} rotation={[0.3, 0.78, -1.25]}>
        <coneGeometry args={[14, 95, 16]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight color="#7dd3fc" distance={120} intensity={3} />
    </group>
  );
};

const AnomalyMesh: React.FC<{ obj: SpaceObject }> = ({ obj }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    if (outerRef.current) {
      outerRef.current.rotation.x += dt * 0.4;
      outerRef.current.rotation.y += dt * 0.55;
    }
    if (innerRef.current) {
      innerRef.current.rotation.z -= dt * 0.9;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.14;
      innerRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={obj.position}>
      <mesh ref={outerRef}>
        <torusGeometry args={[obj.radius * 0.85, obj.radius * 0.12, 10, 28]} />
        <meshStandardMaterial
          color="#1e1b4b"
          emissive={obj.color}
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      <mesh ref={innerRef}>
        <octahedronGeometry args={[obj.radius * 0.42, 0]} />
        <meshBasicMaterial color={obj.color} wireframe />
      </mesh>
      <pointLight color={obj.color} distance={180} intensity={4} />
    </group>
  );
};

const WarpTunnel: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const streaks = useMemo(() => {
    const arr: Array<{ x: number; y: number; z: number; len: number }> = [];
    for (let i = 0; i < 140; i++) {
      const angle = (i / 140) * Math.PI * 2 + (i % 7) * 0.3;
      const r = 6 + (i % 19) * 1.4;
      arr.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        z: -((i * 11) % 160),
        len: 12 + (i % 5) * 6,
      });
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    const s = useShipStore.getState();
    if (!groupRef.current) return;
    groupRef.current.visible = s.warp.active;
    if (!s.warp.active) return;
    groupRef.current.position.set(s.position[0], s.position[1], s.position[2]);
    groupRef.current.quaternion.set(s.quaternion[0], s.quaternion[1], s.quaternion[2], s.quaternion[3]);
    groupRef.current.children.forEach((child) => {
      child.position.z += dt * 320;
      if (child.position.z > 20) child.position.z = -150;
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {streaks.map((st, idx) => (
        <mesh key={idx} position={[st.x, st.y, st.z]}>
          <boxGeometry args={[0.09, 0.09, st.len]} />
          <meshBasicMaterial color={idx % 3 === 0 ? '#ffffff' : '#00e5ff'} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
};

const ScanWave: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const s = useShipStore.getState();
    if (!meshRef.current) return;
    if (s.scanPulse > 0.01) {
      meshRef.current.visible = true;
      meshRef.current.position.set(s.position[0], s.position[1], s.position[2]);
      const radius = (1 - s.scanPulse) * 280 + 5;
      meshRef.current.scale.setScalar(radius);
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = s.scanPulse * 0.35;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
};

const EmpWave: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const s = useShipStore.getState();
    if (!ref.current) return;
    if (s.empPulse > 0.02) {
      ref.current.visible = true;
      ref.current.position.set(s.position[0], s.position[1], s.position[2]);
      ref.current.scale.setScalar((1 - s.empPulse) * 320 + 6);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = s.empPulse * 0.45;
    } else {
      ref.current.visible = false;
    }
  });
  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
};

export const SpaceEnvironment: React.FC = () => {
  const currentSystemId = useShipStore((s) => s.currentSystemId);
  const selectedTargetId = useShipStore((s) => s.selectedTargetId);
  const raiders = useShipStore((s) => s.raiders);
  const remotePlayers = useShipStore((s) => s.remotePlayers);
  const waypoints = useShipStore((s) => s.waypoints);
  const deployedSatellites = useShipStore((s) => s.deployedSatellites);
  const system = useMemo(() => getStarSystem(currentSystemId), [currentSystemId]);

  const npcRefs = useRef<Array<THREE.Group | null>>([]);
  const astRefs = useRef<Array<THREE.Mesh | null>>([]);
  const raiderRefs = useRef<Record<string, THREE.Group | null>>({});

  useFrame((_, dt) => {
    const simTime = useShipStore.getState().simTime;
    system.npcs.forEach((npc, idx) => {
      const grp = npcRefs.current[idx];
      if (!grp) return;
      const pos = getNpcPosition(npc, simTime);
      const nextPos = getNpcPosition(npc, simTime + 0.15);
      grp.position.set(pos[0], pos[1], pos[2]);
      grp.lookAt(nextPos[0], nextPos[1], nextPos[2]);
    });

    // Update hostile Raider Drones
    useShipStore.getState().raiders.forEach((r) => {
      const grp = raiderRefs.current[r.id];
      if (!grp || r.systemId !== currentSystemId) return;
      const angle = r.phase + simTime * r.orbitSpeed;
      const rx = r.orbitCenter[0] + Math.cos(angle) * r.orbitRadius;
      const ry = r.orbitCenter[1] + Math.sin(angle * 1.4) * 18;
      const rz = r.orbitCenter[2] + Math.sin(angle) * r.orbitRadius;
      grp.position.set(rx, ry, rz);
      grp.rotation.y = -angle;
    });

    system.asteroids.forEach((ast, idx) => {
      const mesh = astRefs.current[idx];
      if (!mesh) return;
      mesh.rotation.x += ast.rotationSpeed[0] * dt;
      mesh.rotation.y += ast.rotationSpeed[1] * dt;
    });
  });

  const starObj = system.objects.find((o) => o.type === 'star');

  return (
    <group>
      <color attach="background" args={['#02050b']} />
      <fogExp2 attach="fog" args={[system.nebulaColor, 0.00028]} />
      <Stars radius={1600} depth={450} count={6000} factor={5} saturation={0.35} fade speed={0.4} />

      <ambientLight intensity={0.3} color="#93c5fd" />
      <hemisphereLight args={['#38bdf8', '#090d16', 0.35]} />
      {starObj && <directionalLight position={starObj.position} intensity={2.5} color={system.starColor} />}

      {/* Environmental Hazard Zones */}
      {system.hazards.map((hz) => (
        <mesh key={hz.id} position={hz.position}>
          <sphereGeometry args={[hz.radius, 20, 14]} />
          <meshBasicMaterial
            color={hz.color}
            transparent
            opacity={0.055}
            wireframe={hz.type === 'GRAVITY_WELL'}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Celestial Objects */}
      {system.objects.map((obj) => {
        const isSelected = obj.id === selectedTargetId;
        if (obj.type === 'star') {
          return (
            <group key={obj.id} position={obj.position}>
              <mesh>
                <sphereGeometry args={[obj.radius, 36, 28]} />
                <meshBasicMaterial color={system.starColor} />
              </mesh>
              <mesh scale={1.22}>
                <sphereGeometry args={[obj.radius, 24, 18]} />
                <meshBasicMaterial
                  color={system.starEmissive}
                  transparent
                  opacity={0.24}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>
          );
        }
        if (obj.type === 'planet') return <PlanetMesh key={obj.id} obj={obj} selected={isSelected} />;
        if (obj.type === 'station') return <StationMesh key={obj.id} obj={obj} selected={isSelected} />;
        if (obj.type === 'satellite') return <SatelliteMesh key={obj.id} obj={obj} />;
        if (obj.type === 'derelict') return <DerelictMesh key={obj.id} obj={obj} />;
        if (obj.type === 'comet') return <CometMesh key={obj.id} obj={obj} />;
        if (obj.type === 'anomaly') return <AnomalyMesh key={obj.id} obj={obj} />;
        return null;
      })}

      {/* Asteroids */}
      {system.asteroids.map((ast, idx) => (
        <mesh
          key={ast.id}
          ref={(el) => {
            astRefs.current[idx] = el;
          }}
          position={ast.position}
        >
          <dodecahedronGeometry args={[ast.radius, 1]} />
          <meshStandardMaterial color="#475569" roughness={0.92} metalness={0.18} flatShading />
        </mesh>
      ))}

      {/* Patrolling NPC Spacecraft */}
      {system.npcs.map((npc, idx) => (
        <group
          key={npc.id}
          ref={(el) => {
            npcRefs.current[idx] = el;
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[2.2, 8.5, 5]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -4.5]}>
            <sphereGeometry args={[1.1, 8, 8]} />
            <meshBasicMaterial color={npc.color} />
          </mesh>
        </group>
      ))}

      {/* Hostile Pirate Raider Drones */}
      {raiders
        .filter((r) => r.systemId === currentSystemId && r.hp > 0)
        .map((r) => (
          <group
            key={r.id}
            ref={(el) => {
              raiderRefs.current[r.id] = el;
            }}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[2.8, 9.5, 4]} />
              <meshStandardMaterial color="#450a0a" metalness={0.8} roughness={0.25} emissive="#dc2626" emissiveIntensity={0.5} />
            </mesh>
            <pointLight color="#ef4444" distance={65} intensity={3} />
            <Html position={[0, 4.2, 0]} center distanceFactor={60}>
              <div
                style={{
                  background: 'rgba(40, 6, 8, 0.85)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '2px 6px',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                }}
              >
                ☠ {r.name} ({r.hp} HP)
              </div>
            </Html>
          </group>
        ))}

      {/* Live Remote Multiplayer Fleet Ships (Only players flying their own ship!) */}
      {Object.values(remotePlayers)
        .filter((p) => p.systemId === currentSystemId && p.shipHostId === p.id)
        .map((p) => (
          <RemoteShipModel key={p.id} player={p} />
        ))}

      {/* Player-Dropped Nav Waypoint Beacons */}
      {waypoints
        .filter((w) => w.systemId === currentSystemId)
        .map((w) => (
          <group key={w.id} position={w.position}>
            <mesh>
              <cylinderGeometry args={[0.35, 0.35, 16, 10]} />
              <meshBasicMaterial color="#00e5ff" transparent opacity={0.45} />
            </mesh>
            <Html position={[0, 9.5, 0]} center distanceFactor={55}>
              <div style={{ color: '#00e5ff', fontSize: 9, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                ◈ {w.name}
              </div>
            </Html>
          </group>
        ))}

      {/* Player-Deployed Recon Satellites */}
      {deployedSatellites
        .filter((sat) => sat.systemId === currentSystemId)
        .map((sat) => (
          <group key={sat.id} position={sat.position}>
            <mesh>
              <octahedronGeometry args={[2.2, 0]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.85} emissive="#f59e0b" emissiveIntensity={0.6} />
            </mesh>
            <mesh>
              <boxGeometry args={[9, 0.2, 2.2]} />
              <meshStandardMaterial color="#1d4ed8" metalness={0.7} />
            </mesh>
          </group>
        ))}

      <WarpTunnel />
      <ScanWave />
      <EmpWave />
    </group>
  );
};
