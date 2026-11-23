import React from 'react';
import { ArrowLeft, DoorOpen, Orbit, Wrench } from 'lucide-react';
import { getRoomById, SHIP_ROOMS } from '../data/shipInterior';
import { useShipStore } from '../store/useShipStore';
import { multiplayerClient } from '../utils/multiplayer';

export const InteriorEvaHUD: React.FC = () => {
  const {
    playerMode,
    interiorRoomId,
    evaOxygen,
    evaTetherDistance,
    shipName,
    redAlert,
    activeEmergencies,
    lockedRooms,
    boardedHostId,
    remotePlayers,
    speed,
    setPlayerMode,
    leaveBoardedShip,
    recoverFromEscapePod,
    setActiveView,
  } = useShipStore();

  if (playerMode === 'escape_pod') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 18, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 120px rgba(255, 77, 26, 0.25)',
            border: '5px solid rgba(180, 166, 139, 0.35)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 16,
            right: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'auto',
          }}
        >
          <div className="star-panel" style={{ padding: '8px 14px', borderColor: '#f97316' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#fb923c', letterSpacing: '0.18em' }}>
              CP-12 ESCAPE POD // EMERGENCY EJECTION ACTIVE
            </div>
            <div style={{ fontSize: 10, color: '#fed7aa', marginTop: 2 }}>
              DISTRESS TRANSPONDER BROADCASTING • VELOCITY: {Math.round(speed)} m/s
            </div>
          </div>
          <button className="star-btn active" onClick={recoverFromEscapePod}>
            RESCUE / RETURN TO STARSHIP
          </button>
        </div>
        <div
          className="star-panel"
          style={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '7px 16px',
            fontSize: 9.5,
            color: '#fed7aa',
            display: 'flex',
            gap: 16,
          }}
        >
          <span>W/S: POD THRUSTERS</span>
          <span>A/D: ROLL</span>
          <span>ARROWS: STEER</span>
          <span>SPACE: RETRO-BRAKE</span>
        </div>
      </div>
    );
  }

  if (playerMode === 'interior') {
    const room = getRoomById(interiorRoomId);
    const hasRoomEmergency = activeEmergencies.some((e) => e.compartmentId === room.id);
    const myShipId = boardedHostId || multiplayerClient.playerId;
    const activePilot = Object.values(remotePlayers).find(
      (p) => p.shipHostId === myShipId && p.playerMode === 'flight'
    );
    const hostPlayer = boardedHostId ? remotePlayers[boardedHostId] : null;

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 15, pointerEvents: 'none' }}>
        {/* Top Interior Bar */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 14,
            right: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'auto',
          }}
        >
          <div className="star-panel" style={{ padding: '7px 14px', borderColor: redAlert || hasRoomEmergency ? 'var(--red)' : room.accentColor }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: room.accentColor, letterSpacing: '0.18em' }}>
              {shipName} // {room.name} {hasRoomEmergency ? '⚠ EMERGENCY' : ''}
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', marginTop: 2 }}>{room.purpose}</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {boardedHostId && (
              <button className="star-btn warning" onClick={leaveBoardedShip}>
                LEAVE {hostPlayer?.callsign || 'HOST'}&apos;S SHIP
              </button>
            )}
            {room.isAirlock ? (
              <button className="star-btn danger active" onClick={() => setPlayerMode('eva')}>
                <Orbit size={13} /> ENTER EVA SPACEWALK [E]
              </button>
            ) : room.id === 'command-bridge' ? (
              <button
                className={`star-btn ${activePilot ? 'warning' : 'active'}`}
                disabled={Boolean(activePilot)}
                onClick={() => setPlayerMode('flight')}
              >
                <ArrowLeft size={13} />{' '}
                {activePilot ? `HELM OCCUPIED BY ${activePilot.callsign}` : 'TAKE FLIGHT HELM [E]'}
              </button>
            ) : (
              room.linkedStation && (
                <button className="star-btn active" onClick={() => setActiveView(room.linkedStation!)}>
                  ACCESS {room.shortName} CONSOLE [E]
                </button>
              )
            )}
          </div>
        </div>

        {/* Deck Directory / Spatial Guide (Bottom-Right) */}
        <div
          className="star-panel"
          style={{
            position: 'absolute',
            bottom: 54,
            right: 14,
            width: 230,
            padding: '8px 10px',
            fontSize: 9,
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan)', letterSpacing: '0.14em', marginBottom: 6 }}>
            DECK DIRECTORY (18 ROOMS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {SHIP_ROOMS.map((r) => {
              const isHere = r.id === interiorRoomId;
              const isAlert = activeEmergencies.some((e) => e.compartmentId === r.id);
              const isLocked = lockedRooms.includes(r.id);
              return (
                <div
                  key={r.id}
                  style={{
                    padding: '3px 5px',
                    border: `1px solid ${isAlert ? '#ef4444' : isHere ? 'var(--cyan)' : 'rgba(0,229,255,0.14)'}`,
                    background: isHere ? 'rgba(0,229,255,0.18)' : isAlert ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.35)',
                    color: isAlert ? '#fca5a5' : isHere ? '#fff' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isHere ? '▸ ' : ''}
                  {r.shortName} {isLocked ? '🔒' : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Crosshair */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(0, 229, 255, 0.7)',
          }}
        />

        {/* Bottom Walk Controls */}
        <div
          className="star-panel"
          style={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '7px 16px',
            fontSize: 9.5,
            color: 'var(--text-secondary)',
            display: 'flex',
            gap: 16,
          }}
        >
          <span>WASD: WALK</span>
          <span>SHIFT: SPRINT</span>
          <span>DRAG MOUSE / ARROWS: LOOK</span>
          <span style={{ color: 'var(--cyan)' }}>E: USE ROOM CONSOLE / HELM / AIRLOCK</span>
        </div>
      </div>
    );
  }

  // EVA Spacewalk Visor HUD
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 15, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 110px rgba(0, 180, 255, 0.18), inset 0 0 28px rgba(0, 0, 0, 0.85)',
          border: '6px solid rgba(15, 23, 42, 0.7)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div className="star-panel" style={{ padding: '8px 14px', display: 'flex', gap: 18, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--cyan)', letterSpacing: '0.16em' }}>
              EVA SPACESUIT MK-IX
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>ZERO-G EXTERNAL MAINTENANCE</div>
          </div>
          <div style={{ fontSize: 10.5 }}>
            SUIT O2:{' '}
            <strong style={{ color: evaOxygen < 25 ? 'var(--red)' : '#6ee7b7' }}>{Math.round(evaOxygen)}%</strong>
          </div>
          <div style={{ fontSize: 10.5 }}>
            TETHER:{' '}
            <strong style={{ color: evaTetherDistance > 36 ? 'var(--amber)' : 'var(--cyan)' }}>
              {evaTetherDistance.toFixed(1)}m / 45.0m
            </strong>
          </div>
        </div>

        <button className="star-btn active" onClick={() => setPlayerMode('interior')}>
          <DoorOpen size={13} /> RE-ENTER AIRLOCK
        </button>
      </div>

      <div
        className="star-panel"
        style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '7px 16px',
          fontSize: 9.5,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span>WASD: THRUSTERS</span>
        <span>SPACE / SHIFT: UP / DOWN</span>
        <span>DRAG / ARROWS: LOOK</span>
        <span style={{ color: '#fcd34d', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Wrench size={11} /> CLICK HULL NODES OR PRESS [E] TO WELD
        </span>
      </div>
    </div>
  );
};
