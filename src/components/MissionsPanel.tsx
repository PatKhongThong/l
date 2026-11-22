import React from 'react';
import { CheckCircle2, Compass, FileText, PlusCircle, Target, X } from 'lucide-react';
import { getStarSystem } from '../data/starSystems';
import { useShipStore } from '../store/useShipStore';

export const MissionsPanel: React.FC = () => {
  const { missions, activeMissionId, credits, logs, playerMode, setActiveMission, generateNewMission, setActiveView } =
    useShipStore();
  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(2, 6, 14, 0.8)',
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
          width: 'min(960px, 96vw)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="star-panel-header" style={{ padding: '10px 14px', fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={14} /> EXPLORATION MISSIONS &amp; DYNAMIC CONTRACTS ({completedCount}/{missions.length} COMPLETE)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="star-btn active" onClick={generateNewMission} style={{ padding: '3px 9px' }}>
              <PlusCircle size={12} /> GENERATE CONTRACT
            </button>
            <span style={{ color: 'var(--green)', fontSize: 11 }}>{credits.toLocaleString()} CR</span>
            <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
              <X size={13} /> CLOSE
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.35fr 1fr',
            gap: 14,
            padding: 16,
            overflowY: 'auto',
          }}
        >
          {/* Mission List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {missions.map((m) => {
              const isActive = m.id === activeMissionId;
              const sys = getStarSystem(m.targetSystemId);
              return (
                <div
                  key={m.id}
                  style={{
                    border: m.completed
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : isActive
                        ? '1px solid var(--cyan)'
                        : '1px solid var(--border-dim)',
                    background: isActive ? 'rgba(0, 229, 255, 0.09)' : 'rgba(5, 12, 24, 0.72)',
                    padding: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(0,229,255,0.14)', color: 'var(--cyan)' }}>
                        {m.code} // {m.category}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: '#fff' }}>{m.title}</span>
                    </span>
                    <span style={{ fontSize: 10, color: m.completed ? 'var(--green)' : 'var(--amber)' }}>
                      {m.completed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> COMPLETE {m.completedAt ? `(${m.completedAt})` : ''}
                        </span>
                      ) : (
                        `+${m.rewardCredits} CR`
                      )}
                    </span>
                  </div>

                  <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>
                    {m.description}
                  </p>

                  <div
                    style={{
                      fontSize: 10,
                      color: '#bae6fd',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '6px 8px',
                      borderLeft: '2px solid var(--cyan)',
                      marginBottom: 8,
                    }}
                  >
                    OBJECTIVE: {m.objectiveText}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>SECTOR: {sys.name}</span>
                    {!m.completed && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          className={`star-btn ${isActive ? 'active' : ''}`}
                          style={{ padding: '4px 8px', fontSize: 9.5 }}
                          onClick={() => setActiveMission(m.id)}
                        >
                          <Target size={11} /> {isActive ? 'TRACKING' : 'TRACK MISSION'}
                        </button>
                        {playerMode === 'interior' ? (
                          <button
                            className="star-btn"
                            style={{ padding: '4px 8px', fontSize: 9.5 }}
                            onClick={() => {
                              setActiveMission(m.id);
                              setActiveView('starmap');
                            }}
                          >
                            <Compass size={11} /> OPEN STARMAP
                          </button>
                        ) : (
                          <span style={{ fontSize: 8.5, color: 'var(--text-muted)' }}>
                            WALK TO NAV ROOM TO JUMP
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Command Telemetry Log */}
          <div
            style={{
              border: '1px solid var(--border-dim)',
              background: 'rgba(3, 8, 18, 0.78)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 540,
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginBottom: 10 }}>
              BRIDGE EVENT LOG
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', fontSize: 10 }}>
              {logs.map((entry) => {
                const color =
                  entry.level === 'alert'
                    ? '#fca5a5'
                    : entry.level === 'warn'
                      ? '#fcd34d'
                      : entry.level === 'success'
                        ? '#6ee7b7'
                        : 'var(--text-secondary)';
                return (
                  <div
                    key={entry.id}
                    style={{
                      borderBottom: '1px solid rgba(0,229,255,0.08)',
                      paddingBottom: 5,
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>[{entry.time}]</span>
                    <span style={{ color }}>{entry.message}</span>
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
