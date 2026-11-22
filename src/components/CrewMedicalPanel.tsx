import React, { useState } from 'react';
import { HeartPulse, Users, X, Coffee, Stethoscope } from 'lucide-react';
import { SHIP_ROOMS } from '../data/shipInterior';
import { useShipStore } from '../store/useShipStore';

export const CrewMedicalPanel: React.FC = () => {
  const { crew, activeEmergencies, assignCrewToRoom, restCrewMember, treatCrewMember, setActiveView } = useShipStore();
  const [selectedCrewId, setSelectedCrewId] = useState(crew[0]?.id || '');

  const selected = crew.find((c) => c.id === selectedCrewId) || crew[0];
  const hasEmergency = activeEmergencies.length > 0;

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
      <div className="star-panel" style={{ width: 'min(980px, 96vw)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div className="star-panel-header" style={{ padding: '10px 14px', fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} /> CREW OPERATIONS &amp; MEDICAL BAY TELEMETRY ({crew.length} PERSONNEL)
          </span>
          <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
            <X size={13} /> CLOSE
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, padding: 16, overflowY: 'auto' }}>
          {/* Crew Roster */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {crew.map((m) => {
              const active = m.id === selected?.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedCrewId(m.id)}
                  style={{
                    cursor: 'pointer',
                    border: active ? '1px solid var(--cyan)' : '1px solid var(--border-dim)',
                    background: active ? 'rgba(0, 229, 255, 0.12)' : 'rgba(5, 12, 24, 0.72)',
                    padding: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{m.name}</span>
                    <span style={{ width: 8, height: 8, background: m.avatarColor, borderRadius: '50%' }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--cyan-soft)', marginTop: 2 }}>{m.role}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 5 }}>
                    LOC: {m.currentRoomId.toUpperCase()} • {m.status}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 9 }}>
                    <span style={{ color: '#6ee7b7' }}>HP {m.health}%</span>
                    <span style={{ color: '#38bdf8' }}>MOR {m.morale}%</span>
                    <span style={{ color: m.fatigue > 60 ? '#f59e0b' : 'var(--text-muted)' }}>FAT {m.fatigue}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Crew Details, Dialogue & Assignment */}
          {selected && (
            <div
              style={{
                border: '1px solid var(--border-dim)',
                background: 'rgba(4, 10, 22, 0.78)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>{selected.role}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', marginTop: 2 }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                  TASK: {selected.currentTask}
                </div>
              </div>

              {/* Contextual Crew Dialogue */}
              <div
                style={{
                  background: 'rgba(0, 229, 255, 0.07)',
                  borderLeft: `3px solid ${selected.avatarColor}`,
                  padding: '9px 11px',
                  fontSize: 10.5,
                  color: '#e2f1ff',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}
              >
                “{hasEmergency ? selected.dialogue.emergency : selected.fatigue > 55 ? selected.dialogue.tired : selected.dialogue.normal}”
              </div>

              {/* Medical & Rest Controls */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="star-btn" style={{ flex: 1 }} onClick={() => restCrewMember(selected.id)}>
                  <Coffee size={12} /> ROTATE TO QUARTERS
                </button>
                <button className="star-btn success" style={{ flex: 1 }} onClick={() => treatCrewMember(selected.id)}>
                  <Stethoscope size={12} /> MEDBAY BIOBED
                </button>
              </div>

              {/* Deck Assignment Selector */}
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--cyan)', letterSpacing: '0.14em', marginBottom: 6 }}>
                  REASSIGN TO SHIP COMPARTMENT
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {SHIP_ROOMS.slice(0, 10).map((room) => (
                    <button
                      key={room.id}
                      className={`star-btn ${selected.currentRoomId === room.id ? 'active' : ''}`}
                      style={{ padding: '4px 6px', fontSize: 8.5 }}
                      onClick={() =>
                        assignCrewToRoom(selected.id, room.id, `Assigned to ${room.name} watch`)
                      }
                    >
                      {room.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'auto', fontSize: 9.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <HeartPulse size={12} color="#10b981" /> Biometrics synced with Medical Bay. Crew automatically respond to emergencies.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

