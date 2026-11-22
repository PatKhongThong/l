import React, { useEffect, useRef } from 'react';
import {
  Anchor,
  Bot,
  Camera,
  EyeOff,
  FileText,
  Footprints,
  Lightbulb,
  MapPin,
  Music,
  Navigation,
  Radar,
  RefreshCw,
  Shield,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getStarSystem } from '../data/starSystems';
import { hudTargetScreenPos } from '../scene/FlightController';
import { useShipStore } from '../store/useShipStore';
import { RadarScreen } from './RadarScreen';

const StatBar: React.FC<{
  label: string;
  value: number;
  display: string;
  color: string;
  warn?: boolean;
}> = ({ label, value, display, color, warn }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, letterSpacing: '0.08em' }}>
      <span style={{ color: warn ? 'var(--red)' : 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: warn ? '#fca5a5' : '#fff', fontWeight: 600 }}>{display}</span>
    </div>
    <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          background: warn ? 'var(--red)' : color,
          boxShadow: `0 0 8px ${warn ? '#ef4444' : color}`,
          transition: 'width 120ms linear',
        }}
      />
    </div>
  </div>
);

export const CockpitHUD: React.FC = () => {
  const {
    activeView,
    cameraMode,
    audioMuted,
    redAlert,
    shipName,
    currentSystemId,
    position,
    speed,
    throttle,
    boostActive,
    braking,
    flightAssist,
    autopilot,
    headlights,
    shieldsOnline,
    hull,
    shields,
    fuel,
    oxygen,
    temperature,
    coolantReserve,
    engineHealth,
    reactorOutput,
    hullDamageFlash,
    dockedStationId,
    landedPlanetId,
    activeHazard,
    activeEmergencies,
    warp,
    logs,
    boostCells,
    torpedoes,
    overdriveTimer,
    cloakActive,
    spaceRadioOn,
    mpConnected,
    remotePlayers,
    empCooldown,
    microJumpCooldown,
    pointDefenseOn,
    autoMinerOn,
    activateBoostCell,
    fireMiningLaser,
    firePulseCannon,
    fireTorpedo,
    fireEmpShockwave,
    triggerMicroJump,
    togglePointDefense,
    toggleAutoMiner,
    deployReconSatellite,
    activateTractorBeam,
    toggleCloak,
    triggerShieldCapacitor,
    toggleSpaceRadio,
    dropWaypoint,
    setPlayerMode,
    setActiveView,
    toggleCamera,
    toggleAudio,
    setThrottle,
    toggleFlightAssist,
    toggleAutopilot,
    toggleHeadlights,
    triggerDeepScan,
    attemptDock,
    undock,
    attemptPlanetaryLanding,
    launchFromPlanet,
    resetShip,
  } = useShipStore();

  const targetBracketRef = useRef<HTMLDivElement>(null);
  const targetLabelRef = useRef<HTMLDivElement>(null);
  const dockAlignRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const updateBracket = () => {
      const el = targetBracketRef.current;
      const lbl = targetLabelRef.current;
      const dockEl = dockAlignRef.current;
      const st = useShipStore.getState();

      if (el && lbl) {
        if (hudTargetScreenPos.visible && st.activeView === 'bridge' && st.playerMode === 'flight') {
          const px = Math.max(0.05, Math.min(0.95, hudTargetScreenPos.x)) * 100;
          const py = Math.max(0.08, Math.min(0.82, hudTargetScreenPos.y)) * 100;
          el.style.display = 'block';
          el.style.left = `${px}%`;
          el.style.top = `${py}%`;
          lbl.textContent = `${hudTargetScreenPos.name} // ${Math.round(hudTargetScreenPos.distance)}m`;
        } else {
          el.style.display = 'none';
        }
      }

      if (dockEl) {
        const showGuide =
          st.activeView === 'bridge' &&
          !st.dockedStationId &&
          !st.landedPlanetId &&
          (hudTargetScreenPos.dockable || hudTargetScreenPos.landable) &&
          hudTargetScreenPos.distance < 220;
        if (showGuide) {
          dockEl.style.display = 'flex';
          const ready = hudTargetScreenPos.distance < (hudTargetScreenPos.dockable ? 95 : 115);
          dockEl.textContent = `${hudTargetScreenPos.dockable ? 'DOCKING COMPUTER' : 'LANDING COMPUTER'} // DIST ${Math.round(hudTargetScreenPos.distance)}m • ALIGN ${Math.round(hudTargetScreenPos.alignmentError)}° • ${ready ? (hudTargetScreenPos.dockable ? 'PRESS [X] TO DOCK' : 'PRESS [L] TO LAND') : 'APPROACHING...'}`;
        } else {
          dockEl.style.display = 'none';
        }
      }

      raf = requestAnimationFrame(updateBracket);
    };
    raf = requestAnimationFrame(updateBracket);
    return () => cancelAnimationFrame(raf);
  }, []);

  const system = getStarSystem(currentSystemId);
  const criticalAlert = redAlert || hull < 25 || oxygen < 20 || temperature > 880 || hullDamageFlash > 0.2;
  const latestLog = logs[0];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
      <div className="hud-scanlines" style={{ position: 'absolute', inset: 0 }} />

      {criticalAlert && <div className="alert-vignette" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />}

      {/* 3D-Projected Target Lock Diamond */}
      <div
        ref={targetBracketRef}
        style={{
          position: 'absolute',
          display: 'none',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            border: `1.5px solid ${redAlert ? '#ef4444' : 'var(--cyan)'}`,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 12px ${redAlert ? 'rgba(239,68,68,0.6)' : 'rgba(0, 229, 255, 0.55)'}`,
          }}
        />
        <div
          ref={targetLabelRef}
          style={{
            position: 'absolute',
            top: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontSize: 9.5,
            color: redAlert ? '#fca5a5' : 'var(--cyan)',
            background: 'rgba(2, 7, 16, 0.78)',
            padding: '2px 6px',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            letterSpacing: '0.1em',
          }}
        />
      </div>

      {/* Docking / Planetary Landing Alignment Computer Strip */}
      <div
        ref={dockAlignRef}
        className="star-panel"
        style={{
          display: 'none',
          position: 'absolute',
          top: 66,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 14px',
          fontSize: 10,
          color: '#6ee7b7',
          borderColor: 'var(--green)',
          letterSpacing: '0.12em',
        }}
      />

      {/* Active Emergency Notification Banner (Directs player to walk to Maintenance/Engineering) */}
      {activeEmergencies.length > 0 && activeView === 'bridge' && (
        <div
          className="star-panel"
          style={{
            position: 'absolute',
            top: 64,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 14px',
            borderColor: 'var(--red)',
            fontSize: 10,
            color: '#fca5a5',
            letterSpacing: '0.1em',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>
            ⚠ EMERGENCY: {activeEmergencies[0].title} ({activeEmergencies[0].compartmentId.toUpperCase()})
          </span>
          <button className="star-btn danger" style={{ padding: '3px 8px', fontSize: 9 }} onClick={() => setPlayerMode('interior')}>
            LEAVE HELM TO RESPOND
          </button>
        </div>
      )}

      {/* Environmental Hazard Warning Banner */}
      {activeHazard && activeView === 'bridge' && (
        <div
          className="star-panel"
          style={{
            position: 'absolute',
            top: 104,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px 14px',
            borderColor: activeHazard.color,
            fontSize: 10,
            color: '#fcd34d',
            letterSpacing: '0.12em',
          }}
        >
          ⚠ HAZARD ZONE: {activeHazard.name} ({activeHazard.type.replace('_', ' ')})
        </div>
      )}

      {/* Center Windshield Boresight Reticle */}
      {activeView === 'bridge' && !warp.active && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 56,
            height: 56,
            pointerEvents: 'none',
            opacity: 0.55,
          }}
        >
          <svg viewBox="0 0 60 60" width="56" height="56">
            <circle cx="30" cy="30" r="18" fill="none" stroke={redAlert ? '#ef4444' : '#00e5ff'} strokeWidth="0.9" strokeDasharray="6 6" />
            <line x1="30" y1="6" x2="30" y2="15" stroke={redAlert ? '#ef4444' : '#00e5ff'} strokeWidth="1" />
            <line x1="30" y1="45" x2="30" y2="54" stroke={redAlert ? '#ef4444' : '#00e5ff'} strokeWidth="1" />
            <line x1="6" y1="30" x2="15" y2="30" stroke={redAlert ? '#ef4444' : '#00e5ff'} strokeWidth="1" />
            <line x1="45" y1="30" x2="54" y2="30" stroke={redAlert ? '#ef4444' : '#00e5ff'} strokeWidth="1" />
            <circle cx="30" cy="30" r="1.5" fill={redAlert ? '#ef4444' : '#00e5ff'} />
          </svg>
        </div>
      )}

      {/* Quantum Warp Banner */}
      {warp.active && (
        <div
          className="star-panel"
          style={{
            position: 'absolute',
            top: '22%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 26px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.24em', color: 'var(--cyan)' }}>
            QUANTUM JUMP IN PROGRESS
          </div>
          <div style={{ fontSize: 10, color: '#fff', marginTop: 4 }}>
            TRANSIT PROGRESS: {Math.round(warp.progress * 100)}% // {Math.round(speed)} c/s
          </div>
        </div>
      )}

      {/* Docked / Landed Banner */}
      {(dockedStationId || landedPlanetId) && activeView === 'bridge' && (
        <div
          className="star-panel"
          style={{
            position: 'absolute',
            top: 68,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            pointerEvents: 'auto',
            borderColor: 'var(--green)',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--green)', letterSpacing: '0.16em' }}>
              {dockedStationId
                ? 'STATION DOCKING CLAMPS ENGAGED'
                : landedPlanetId === 'earth'
                  ? 'LANDED ON EARTH // TERRAN HEAVY SHIPYARDS'
                  : 'PLANETARY SURFACE LANDING COMPLETE'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {dockedStationId
                ? 'SHIP RESTORED • WALK TO CARGO BAY TO TRADE'
                : landedPlanetId === 'earth'
                  ? 'WALK TO UPGRADE BAY TO REPLACE & UPGRADE ENGINES, SENSORS & COOLANT'
                  : 'ATMOSPHERIC CYCLE ACTIVE • READY FOR ASCENT'}
            </div>
          </div>
          <button className="star-btn success" onClick={dockedStationId ? undock : launchFromPlanet}>
            {dockedStationId ? 'UNDOCK & LAUNCH' : 'LAUNCH TO ORBIT'}
          </button>
        </div>
      )}

      {/* Hull Critical Recovery */}
      {hull <= 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 2, 4, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            zIndex: 60,
          }}
        >
          <div className="star-panel" style={{ padding: 28, textAlign: 'center', maxWidth: 420, borderColor: 'var(--red)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--red)', letterSpacing: '0.2em', marginBottom: 10 }}>
              HULL BREACH CRITICAL
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
              Vessel structural integrity reached 0%. Emergency orbital tow beacon can reconstruct your spacecraft at
              sector origin.
            </p>
            <button className="star-btn active" onClick={resetShip}>
              <RefreshCw size={13} /> RECONSTRUCT VESSEL
            </button>
          </div>
        </div>
      )}

      {/* TOP BRIDGE COMMAND BAR (Only Flight Helm, Missions, ARIA & Leave Helm) */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        <div className="star-panel" style={{ padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 12, borderColor: redAlert ? 'var(--red)' : undefined }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10.5, color: redAlert ? '#fca5a5' : 'var(--cyan)', letterSpacing: '0.14em' }}>
              {shipName} • {system.name}
            </div>
            <div style={{ fontSize: 8.5, color: 'var(--text-secondary)' }}>
              POS [{Math.round(position[0])}, {Math.round(position[1])}, {Math.round(position[2])}]
            </div>
          </div>
        </div>

        {/* Bridge-Only Consoles (Ship rooms like Engineering, Nav Map, Medbay, Science, Comms, Cargo & Airlock EVA require walking!) */}
        <div className="star-panel" style={{ padding: '4px 6px', display: 'flex', gap: 5, alignItems: 'center' }}>
          <button className={`star-btn ${activeView === 'bridge' ? 'active' : ''}`} onClick={() => setActiveView('bridge')}>
            <Navigation size={11} /> HELM
          </button>
          <button className={`star-btn ${activeView === 'missions' ? 'active' : ''}`} onClick={() => setActiveView('missions')}>
            <FileText size={11} /> MISSIONS
          </button>
          <button className={`star-btn ${activeView === 'ai' ? 'active' : ''}`} onClick={() => setActiveView('ai')}>
            <Bot size={11} /> ARIA / SAVE
          </button>
          <button
            className={`star-btn ${mpConnected ? 'success' : activeView === 'multiplayer' ? 'active' : ''}`}
            onClick={() => setActiveView('multiplayer')}
          >
            <Users size={11} /> MULTIPLAYER {mpConnected ? `(${Object.keys(remotePlayers).length + 1})` : ''}
          </button>
          <button
            className={`star-btn ${activeView === 'galactic' ? 'active' : ''}`}
            onClick={() => setActiveView('galactic')}
          >
            GALACTIC NET
          </button>
          <button
            className={`star-btn ${spaceRadioOn ? 'active' : ''}`}
            onClick={toggleSpaceRadio}
            title="Toggle Ambient Space Synth Radio"
          >
            <Music size={11} /> RADIO
          </button>
          <button className="star-btn" onClick={dropWaypoint} title="Drop Nav Waypoint Beacon at Current Position">
            <MapPin size={11} /> BEACON
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="star-btn active"
            onClick={() => setPlayerMode('interior')}
            title="Stand up from the helm and walk to Engineering, Navigation, Science, Medical, Cargo, or Airlock"
          >
            <Footprints size={12} /> LEAVE HELM (WALK SHIP)
          </button>
          <button className="star-btn" onClick={toggleAudio} title="Toggle Cockpit Audio" style={{ height: 30, width: 30, padding: 0 }}>
            {audioMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>
      </div>

      {/* BOTTOM FLIGHT CONTROL DECK (Strictly Flight, Attitude, Scan, Dock & Land) */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 12,
          right: 12,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <RadarScreen />
        </div>

        <div
          className="star-panel"
          style={{
            pointerEvents: 'auto',
            flex: '0 1 500px',
            display: 'flex',
            flexDirection: 'column',
            borderColor: redAlert ? 'var(--red)' : undefined,
          }}
        >
          <div className="star-panel-header">
            <span>FLIGHT CONTROL DECK</span>
            <span style={{ color: redAlert ? '#fca5a5' : autopilot ? 'var(--green)' : boostActive ? 'var(--amber)' : 'var(--cyan-soft)' }}>
              {redAlert
                ? 'RED ALERT'
                : autopilot
                  ? 'AUTOPILOT ACTIVE'
                  : braking
                    ? 'RETRO-BRAKE'
                    : boostActive
                      ? 'AFTERBURNER'
                      : flightAssist
                        ? 'ASSIST ON'
                        : 'NEWTONIAN DRIFT'}
            </span>
          </div>

          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 78px', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 8.5, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>VELOCITY</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', lineHeight: 1.1 }}>
                  {Math.round(speed)}
                  <span style={{ fontSize: 9.5, color: 'var(--cyan)', marginLeft: 4 }}>m/s</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  <span>THRUST LEVER</span>
                  <span style={{ color: 'var(--cyan)' }}>{Math.round(throttle * 100)}%</span>
                </div>
                <input
                  type="range"
                  className="star-slider"
                  min={-60}
                  max={100}
                  value={Math.round(throttle * 100)}
                  onChange={(e) => setThrottle(Number(e.target.value) / 100)}
                />
              </div>

              <button
                className={`star-btn ${cameraMode === 'external' ? 'active' : ''}`}
                onClick={toggleCamera}
                style={{ flexDirection: 'column', gap: 2, padding: '5px 6px', fontSize: 8.5 }}
                title="Switch Camera (C)"
              >
                <Camera size={13} />
                {cameraMode === 'cockpit' ? '1P COCKPIT' : '3P EXTERIOR'}
              </button>
            </div>

            {/* Strictly Flight-Helm Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              <button className={`star-btn ${autopilot ? 'success' : ''}`} onClick={toggleAutopilot}>
                <Navigation size={11} /> AUTOPILOT
              </button>
              <button className="star-btn" onClick={triggerDeepScan}>
                <Radar size={11} /> SCAN [R]
              </button>
              <button className="star-btn" onClick={attemptDock}>
                <Anchor size={11} /> DOCK [X]
              </button>
              <button className="star-btn" onClick={attemptPlanetaryLanding}>
                LAND [L]
              </button>
              <button className="star-btn warning" onClick={fireMiningLaser} title="Mine Nearby Asteroid (<115m) for Deuterium & Titanium">
                MINE [M]
              </button>
              <button className="star-btn danger" onClick={firePulseCannon} title="Fire Twin Plasma Pulse Cannons">
                PULSE [B]
              </button>
              <button className="star-btn danger" onClick={fireTorpedo} disabled={torpedoes <= 0} title="Launch Homing Plasma Torpedo [T]">
                TORP [T] ({torpedoes})
              </button>
              <button className="star-btn" onClick={activateTractorBeam} title="Tractor Beam Salvage Pull [G]">
                TRACTOR [G]
              </button>
              <button className={`star-btn ${cloakActive ? 'active' : ''}`} onClick={toggleCloak} title="Toggle Optical Cloaking Field [V]">
                <EyeOff size={11} /> CLOAK [V]
              </button>
              <button className="star-btn" onClick={triggerShieldCapacitor} title="Emergency Shield Burst (+35% Shields / -15% Backup Batt)">
                <Shield size={11} /> SHD BURST
              </button>
              <button className="star-btn active" disabled={empCooldown > 0} onClick={fireEmpShockwave} title="EMP Shockwave Pulse [P]">
                {empCooldown > 0 ? `EMP ${Math.ceil(empCooldown)}s` : 'EMP [P]'}
              </button>
              <button className="star-btn active" disabled={microJumpCooldown > 0} onClick={triggerMicroJump} title="Instant 180m Forward Micro-Blink Jump">
                {microJumpCooldown > 0 ? `BLINK ${Math.ceil(microJumpCooldown)}s` : 'BLINK +180m'}
              </button>
              <button className={`star-btn ${pointDefenseOn ? 'success' : ''}`} onClick={togglePointDefense} title="Toggle Automated Point-Defense Turret">
                PDT {pointDefenseOn ? 'ON' : 'OFF'}
              </button>
              <button className={`star-btn ${autoMinerOn ? 'warning' : ''}`} onClick={toggleAutoMiner} title="Toggle Autonomous Asteroid Mining Drone Swarm">
                AUTO-MINE
              </button>
              <button className="star-btn" onClick={deployReconSatellite} title="Deploy Recon Satellite (1,200 CR -> Passive Income)">
                DEPLOY SAT
              </button>
              <button
                className={`star-btn ${overdriveTimer > 0 ? 'success' : 'warning'}`}
                disabled={boostCells <= 0 && overdriveTimer <= 0}
                onClick={activateBoostCell}
                title="Inject Hyper-Overdrive Boost Cell (+60% Thrust for 10s)"
              >
                {overdriveTimer > 0
                  ? `BOOST ${Math.ceil(overdriveTimer)}s`
                  : `BOOST (${boostCells})`}
              </button>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-dim)',
                paddingTop: 5,
                fontSize: 8.5,
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>W/S: THRUST</span>
              <span>A/D: ROLL</span>
              <span>ARROWS: PITCH/YAW</span>
              <span style={{ cursor: 'pointer', color: flightAssist ? 'var(--cyan)' : 'var(--amber)' }} onClick={toggleFlightAssist}>
                DAMP[F]: {flightAssist ? 'ON' : 'OFF'}
              </span>
              <span style={{ cursor: 'pointer', color: headlights ? 'var(--cyan)' : undefined }} onClick={toggleHeadlights}>
                <Lightbulb size={9} style={{ verticalAlign: 'middle' }} /> LIGHTS
              </span>
            </div>
          </div>
        </div>

        {/* Bottom-Right: Read-Only Ship Condition Monitor */}
        <div className="star-panel" style={{ width: 256, pointerEvents: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div className="star-panel-header">
            <span>SHIP TELEMETRY</span>
            <span style={{ color: criticalAlert ? 'var(--red)' : 'var(--green)' }}>
              {criticalAlert ? 'ALERT' : 'NOMINAL'}
            </span>
          </div>

          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <StatBar label="HULL INTEGRITY" value={hull} display={`${Math.round(hull)}%`} color="#00e5ff" warn={hull < 30} />
            <StatBar
              label="DEFLECTOR SHIELDS"
              value={shields}
              display={shieldsOnline ? `${Math.round(shields)}%` : 'OFFLINE'}
              color="#3b82f6"
              warn={!shieldsOnline || shields < 15}
            />
            <StatBar label="DEUTERIUM FUEL" value={fuel} display={`${Math.round(fuel)}%`} color="#f59e0b" warn={fuel < 20} />
            <StatBar label="OXYGEN RESERVE" value={oxygen} display={`${Math.round(oxygen)}%`} color="#10b981" warn={oxygen < 25} />
            <StatBar
              label="CORE TEMPERATURE"
              value={((temperature - 290) / 910) * 100}
              display={`${Math.round(temperature)} K`}
              color={temperature > 700 ? '#f59e0b' : '#38bdf8'}
              warn={temperature > 880}
            />
            <StatBar
              label="CRYO COOLANT TANK"
              value={coolantReserve}
              display={`${Math.round(coolantReserve)}%`}
              color="#22d3ee"
              warn={coolantReserve < 20}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 9.5,
                paddingTop: 4,
                borderTop: '1px solid var(--border-dim)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>
                ENG: <strong style={{ color: engineHealth < 45 ? 'var(--red)' : '#fff' }}>{Math.round(engineHealth)}%</strong>
              </span>
              <span>
                REACTOR: <strong style={{ color: 'var(--cyan)' }}>{reactorOutput} MW</strong>
              </span>
            </div>
          </div>

          {latestLog && (
            <div
              style={{
                borderTop: '1px solid var(--border-dim)',
                padding: '6px 10px',
                fontSize: 9,
                background: 'rgba(2, 6, 14, 0.8)',
                color:
                  latestLog.level === 'alert'
                    ? '#fca5a5'
                    : latestLog.level === 'warn'
                      ? '#fcd34d'
                      : latestLog.level === 'success'
                        ? '#6ee7b7'
                        : 'var(--cyan-soft)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={latestLog.message}
            >
              ▸ {latestLog.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
