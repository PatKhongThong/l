import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Line, OrbitControls, Html } from '@react-three/drei';
import { Compass, Navigation, Rocket, X, MapPin } from 'lucide-react';
import { calculateJumpFuel, getStarSystem, STAR_SYSTEMS, StarSystem } from '../data/starSystems';
import { useShipStore } from '../store/useShipStore';

const GalaxyMapScene: React.FC<{
  inspectedId: string;
  currentId: string;
  onSelect: (id: string) => void;
}> = ({ inspectedId, currentId, onSelect }) => {
  const lanes = useMemo(() => {
    const pairs: Array<{ from: [number, number, number]; to: [number, number, number]; key: string }> = [];
    const seen = new Set<string>();
    for (const sys of STAR_SYSTEMS) {
      for (const conn of sys.connections) {
        const key = [sys.id, conn].sort().join('--');
        if (seen.has(key)) continue;
        seen.add(key);
        const target = getStarSystem(conn);
        pairs.push({ from: sys.galaxyPos, to: target.galaxyPos, key });
      }
    }
    return pairs;
  }, []);

  return (
    <>
      <color attach="background" args={['#030812']} />
      <ambientLight intensity={0.6} />
      <OrbitControls enablePan={false} minDistance={4} maxDistance={14} autoRotate autoRotateSpeed={0.35} />

      {/* Subtle coordinate grid */}
      <gridHelper args={[14, 14, '#0c2742', '#071729']} position={[0, -1.6, -1.8]} />

      {/* Jump Lanes */}
      {lanes.map((lane) => (
        <Line
          key={lane.key}
          points={[lane.from, lane.to]}
          color="#0ea5e9"
          lineWidth={1.2}
          transparent
          opacity={0.45}
        />
      ))}

      {/* Star Nodes */}
      {STAR_SYSTEMS.map((sys: StarSystem) => {
        const isCurrent = sys.id === currentId;
        const isSelected = sys.id === inspectedId;
        return (
          <group key={sys.id} position={sys.galaxyPos}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(sys.id);
              }}
            >
              <sphereGeometry args={[isSelected ? 0.34 : 0.25, 24, 18]} />
              <meshBasicMaterial color={sys.starEmissive} />
            </mesh>

            {/* Selection Halo */}
            {(isSelected || isCurrent) && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.42, 0.49, 32]} />
                <meshBasicMaterial
                  color={isCurrent ? '#10b981' : '#00e5ff'}
                  side={2}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            )}

            <Html position={[0, 0.52, 0]} center distanceFactor={9}>
              <div
                onClick={() => onSelect(sys.id)}
                style={{
                  cursor: 'pointer',
                  padding: '2px 7px',
                  background: isSelected ? 'rgba(0, 229, 255, 0.22)' : 'rgba(3, 9, 20, 0.85)',
                  border: `1px solid ${isCurrent ? '#10b981' : isSelected ? '#00e5ff' : 'rgba(0,229,255,0.28)'}`,
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  whiteSpace: 'nowrap',
                }}
              >
                {sys.name} {isCurrent ? '• HERE' : ''}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
};

export const StarMapModal: React.FC = () => {
  const {
    currentSystemId,
    selectedTargetId,
    plottedSystemId,
    fuel,
    discoveredSystems,
    scannedObjects,
    selectTarget,
    plotSystemRoute,
    initiateWarp,
    toggleAutopilot,
    setActiveView,
  } = useShipStore();

  const [inspectedSystemId, setInspectedSystemId] = useState(currentSystemId);
  const inspected = getStarSystem(inspectedSystemId);
  const isHere = inspected.id === currentSystemId;
  const jumpCost = isHere ? 0 : calculateJumpFuel(currentSystemId, inspected.id);
  const canJump = !isHere && fuel >= jumpCost;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(2, 6, 14, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
    >
      <div
        className="star-panel"
        style={{
          width: 'min(1060px, 96vw)',
          height: 'min(660px, 90vh)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="star-panel-header" style={{ padding: '10px 14px', fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={14} /> 3D ASTROGATION STAR MAP // INTERSTELLAR NAVIGATION
          </span>
          <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
            <X size={13} /> CLOSE STARMAP
          </button>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.35fr 1fr', minHeight: 0 }}>
          {/* Interactive 3D Star Map Canvas */}
          <div style={{ position: 'relative', borderRight: '1px solid var(--border-dim)', minHeight: 300 }}>
            <Canvas camera={{ position: [0, 4.2, 6.2], fov: 46 }}>
              <GalaxyMapScene
                inspectedId={inspectedSystemId}
                currentId={currentSystemId}
                onSelect={setInspectedSystemId}
              />
            </Canvas>

            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: 12,
                fontSize: 9.5,
                color: 'var(--text-secondary)',
                background: 'rgba(2, 6, 14, 0.78)',
                padding: '4px 8px',
                border: '1px solid var(--border-dim)',
                pointerEvents: 'none',
              }}
            >
              DRAG TO ORBIT • SCROLL TO ZOOM • CLICK STAR NODE TO INSPECT
            </div>
          </div>

          {/* Right Panel: System Intel & Destinations */}
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>
                  {inspected.sectorCode}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    color: discoveredSystems.includes(inspected.id) ? 'var(--green)' : 'var(--amber)',
                  }}
                >
                  {discoveredSystems.includes(inspected.id) ? 'CHARTED' : 'UNCHARTED'}
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.14em', color: '#fff' }}>
                {inspected.name}
              </h2>
              <div style={{ fontSize: 10, color: 'var(--cyan-soft)', marginTop: 2 }}>{inspected.starClass}</div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                {inspected.description}
              </p>
            </div>

            {/* Interstellar Jump Controls */}
            {!isHere && (
              <div
                style={{
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  background: 'rgba(0, 229, 255, 0.06)',
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}>
                  <span>QUANTUM JUMP FUEL COST</span>
                  <span style={{ color: canJump ? 'var(--cyan)' : 'var(--red)', fontWeight: 700 }}>
                    {jumpCost}% (AVAILABLE: {Math.round(fuel)}%)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`star-btn ${plottedSystemId === inspected.id ? 'active' : ''}`}
                    style={{ flex: 1 }}
                    onClick={() => plotSystemRoute(inspected.id)}
                  >
                    <MapPin size={12} /> {plottedSystemId === inspected.id ? 'ROUTE PLOTTED' : 'PLOT ROUTE'}
                  </button>
                  <button
                    className="star-btn active"
                    style={{ flex: 1 }}
                    disabled={!canJump}
                    onClick={() => initiateWarp(inspected.id)}
                  >
                    <Rocket size={12} /> QUANTUM JUMP
                  </button>
                </div>
              </div>
            )}

            {/* Local Celestial Bodies & Stations */}
            <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginTop: 4 }}>
              SYSTEM BODIES &amp; STATIONS ({inspected.objects.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {inspected.objects.map((obj) => {
                const locked = isHere && selectedTargetId === obj.id;
                const scanned = scannedObjects.includes(obj.id);
                return (
                  <div
                    key={obj.id}
                    style={{
                      border: locked ? '1px solid var(--cyan)' : '1px solid var(--border-dim)',
                      background: locked ? 'rgba(0, 229, 255, 0.12)' : 'rgba(5, 12, 24, 0.72)',
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{obj.name}</span>
                      <span style={{ fontSize: 9, color: obj.dockable ? 'var(--green)' : 'var(--cyan-soft)' }}>
                        {obj.classification}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
                      {obj.description}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
                      <span style={{ fontSize: 9, color: scanned ? 'var(--green)' : 'var(--text-muted)' }}>
                        {scanned ? '✓ SCANNED' : obj.dockable ? 'DOCKABLE STATION' : `HAZARD: ${obj.hazardLevel || 'LOW'}`}
                      </span>
                      {isHere && obj.type !== 'star' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className={`star-btn ${locked ? 'active' : ''}`}
                            style={{ padding: '3px 7px', fontSize: 9 }}
                            onClick={() => selectTarget(obj.id)}
                          >
                            {locked ? 'LOCKED' : 'LOCK TARGET'}
                          </button>
                          <button
                            className="star-btn"
                            style={{ padding: '3px 7px', fontSize: 9 }}
                            onClick={() => {
                              selectTarget(obj.id);
                              setActiveView('bridge');
                              if (!useShipStore.getState().autopilot) toggleAutopilot();
                            }}
                          >
                            <Navigation size={10} /> AUTOPILOT
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

