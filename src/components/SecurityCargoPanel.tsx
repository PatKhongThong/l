import React, { useState } from 'react';
import { Camera, Lock, Unlock, Package, Palette, Shield, X } from 'lucide-react';
import { SHIP_ROOMS } from '../data/shipInterior';
import { CargoHold, SHIP_LIVERIES, useShipStore } from '../store/useShipStore';

const MARKET_ITEMS: Array<{ key: keyof CargoHold; name: string; price: number }> = [
  { key: 'deuterium', name: 'REFINED DEUTERIUM', price: 180 },
  { key: 'cryoMeds', name: 'CRYO-MED SUPPLIES', price: 320 },
  { key: 'titanium', name: 'TITANIUM ALLOY', price: 140 },
  { key: 'quantumRelays', name: 'QUANTUM RELAYS', price: 650 },
  { key: 'xenoArtifacts', name: 'XENO ARTIFACTS', price: 1450 },
];

export const SecurityCargoPanel: React.FC = () => {
  const {
    crew,
    robots,
    lockedRooms,
    escapePodsArmed,
    cargo,
    credits,
    dockedStationId,
    shipName,
    liveryId,
    toggleRoomLock,
    toggleEscapePods,
    tradeCargo,
    setShipCustomization,
    setActiveView,
  } = useShipStore();

  const [camRoomId, setCamRoomId] = useState('reactor-room');
  const [nameInput, setNameInput] = useState(shipName);

  const camRoom = SHIP_ROOMS.find((r) => r.id === camRoomId) || SHIP_ROOMS[0];
  const crewInCam = crew.filter((c) => c.currentRoomId === camRoomId);
  const botsInCam = robots.filter((b) => b.assignedRoomId === camRoomId);

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
      <div className="star-panel" style={{ width: 'min(1020px, 96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="star-panel-header" style={{ padding: '10px 14px', fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={14} /> SECURITY CCTV, CARGO MARKET &amp; SHIP CUSTOMIZATION
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--green)', fontSize: 11 }}>{credits.toLocaleString()} CR</span>
            <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
              <X size={13} /> CLOSE
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: 16, overflowY: 'auto' }}>
          {/* Left: Internal Security Cameras & Bulkhead Locks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ border: '1px solid var(--border-dim)', padding: 12, background: 'rgba(3, 9, 20, 0.85)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--cyan)', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Camera size={12} /> INTERNAL CCTV FEED // {camRoom.name}
                </span>
                <span style={{ color: '#ef4444' }}>● REC LIVE</span>
              </div>

              {/* Simulated CCTV Monitor View */}
              <div
                style={{
                  height: 120,
                  background: `radial-gradient(circle at center, ${camRoom.accentColor}22 0%, #02050a 100%)`,
                  border: '1px solid rgba(0,229,255,0.22)',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>CAM-{camRoom.shortName}</span>
                  <span>BULKHEAD: {lockedRooms.includes(camRoomId) ? 'LOCKED' : 'OPEN'}</span>
                </div>
                <div style={{ color: '#fff' }}>
                  PERSONNEL DETECTED: {crewInCam.length > 0 ? crewInCam.map((c) => c.name).join(', ') : 'NONE'}
                  {botsInCam.length > 0 && ` | DRONES: ${botsInCam.map((b) => b.name).join(', ')}`}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{camRoom.purpose}</div>
              </div>

              {/* Camera Selector & Lock Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginTop: 10 }}>
                {SHIP_ROOMS.slice(0, 12).map((room) => {
                  const locked = lockedRooms.includes(room.id);
                  return (
                    <div key={room.id} style={{ display: 'flex', gap: 2 }}>
                      <button
                        className={`star-btn ${camRoomId === room.id ? 'active' : ''}`}
                        style={{ flex: 1, padding: '4px 4px', fontSize: 8 }}
                        onClick={() => setCamRoomId(room.id)}
                      >
                        {room.shortName}
                      </button>
                      <button
                        className={`star-btn ${locked ? 'danger' : ''}`}
                        style={{ padding: '4px 5px' }}
                        onClick={() => toggleRoomLock(room.id)}
                        title={locked ? 'Unlock Bulkhead' : 'Lock Bulkhead'}
                      >
                        {locked ? <Lock size={9} /> : <Unlock size={9} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                className={`star-btn ${escapePodsArmed ? 'danger active' : 'warning'}`}
                style={{ width: '100%', marginTop: 10 }}
                onClick={toggleEscapePods}
              >
                {escapePodsArmed ? 'ESCAPE PODS ARMED — EVACUATION STANDBY' : 'ARM EMERGENCY ESCAPE PODS'}
              </button>
            </div>
          </div>

          {/* Right: Cargo Trading + Ship Customization */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Cargo Bay & Trading */}
            <div style={{ border: '1px solid var(--border-dim)', padding: 12, background: 'rgba(3, 9, 20, 0.85)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--cyan)', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={12} /> CARGO HOLD &amp; STATION EXCHANGE
                </span>
                <span style={{ color: dockedStationId ? 'var(--green)' : 'var(--amber)' }}>
                  {dockedStationId ? 'MARKET CONNECTED' : 'DOCK TO TRADE'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MARKET_ITEMS.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 56px 56px 96px',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 9.5,
                      padding: '5px 7px',
                      background: 'rgba(0,0,0,0.35)',
                    }}
                  >
                    <span style={{ color: '#fff' }}>{item.name}</span>
                    <span style={{ color: 'var(--cyan)' }}>QTY: {cargo[item.key]}</span>
                    <span style={{ color: 'var(--amber)' }}>{item.price} CR</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="star-btn"
                        style={{ padding: '2px 6px', fontSize: 8.5 }}
                        disabled={!dockedStationId || credits < item.price}
                        onClick={() => tradeCargo(item.key, 1, item.price)}
                      >
                        BUY
                      </button>
                      <button
                        className="star-btn success"
                        style={{ padding: '2px 6px', fontSize: 8.5 }}
                        disabled={!dockedStationId || cargo[item.key] <= 0}
                        onClick={() => tradeCargo(item.key, -1, item.price)}
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ship Customization & Hull Livery */}
            <div style={{ border: '1px solid var(--border-dim)', padding: 12, background: 'rgba(3, 9, 20, 0.85)' }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Palette size={12} /> VESSEL IDENTITY &amp; HULL LIVERY (LIVE 3D UPDATE)
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-dim)',
                    color: '#fff',
                    padding: '5px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                  }}
                />
                <button className="star-btn active" onClick={() => setShipCustomization(nameInput, liveryId)}>
                  RENAME
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {SHIP_LIVERIES.map((liv) => (
                  <button
                    key={liv.id}
                    className={`star-btn ${liveryId === liv.id ? 'active' : ''}`}
                    style={{ padding: '6px 6px', fontSize: 8.5, justifyContent: 'flex-start' }}
                    onClick={() => setShipCustomization(nameInput, liv.id)}
                  >
                    <span style={{ width: 10, height: 10, background: liv.accentColor, border: `2px solid ${liv.hullColor}` }} />
                    {liv.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

