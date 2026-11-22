import React from 'react';
import { AlertTriangle, Bot, ShieldAlert, Wrench, X, Activity, Power } from 'lucide-react';
import { useShipStore } from '../store/useShipStore';

export const EmergencyPanel: React.FC = () => {
  const {
    activeEmergencies,
    emergencyHistory,
    robots,
    redAlert,
    components,
    toggleRedAlert,
    triggerRandomEmergency,
    diagnoseEmergency,
    isolateEmergency,
    engageBackupForEmergency,
    dispatchRobotToEmergency,
    manualRepairEmergency,
    setActiveView,
  } = useShipStore();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 42,
        background: 'rgba(2, 6, 14, 0.84)',
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
          width: 'min(980px, 96vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderColor: redAlert ? 'var(--red)' : 'var(--border-glow)',
        }}
      >
        <div
          className="star-panel-header"
          style={{
            padding: '10px 14px',
            fontSize: 12,
            color: redAlert ? '#fca5a5' : 'var(--cyan)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={14} /> EMERGENCY RESPONSE &amp; DAMAGE CONTROL ({activeEmergencies.length} ACTIVE)
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`star-btn ${redAlert ? 'danger active' : 'danger'}`}
              onClick={toggleRedAlert}
              style={{ padding: '4px 10px' }}
            >
              {redAlert ? 'STAND DOWN RED ALERT' : 'ENGAGE RED ALERT'}
            </button>
            <button
              className="star-btn warning"
              onClick={() => triggerRandomEmergency(true)}
              style={{ padding: '4px 10px' }}
              title="Automatic emergencies are very rare; use this to run a live emergency drill."
            >
              <AlertTriangle size={12} /> SIMULATE DRILL
            </button>
            <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '4px 8px' }}>
              <X size={13} /> CLOSE
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.45fr 1fr',
            gap: 14,
            padding: 16,
            overflowY: 'auto',
          }}
        >
          {/* Left: Active Emergencies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>
              ACTIVE INCIDENTS
            </div>

            {activeEmergencies.length === 0 ? (
              <div
                style={{
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  padding: 18,
                  fontSize: 11,
                  color: '#6ee7b7',
                }}
              >
                ALL COMPARTMENTS NOMINAL — NO ACTIVE EMERGENCIES.
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
                  Automatic emergencies are very rare. You can click <strong>SIMULATE DRILL</strong> above to test
                  Red Alert response, robot dispatch, and system isolation at any time.
                </div>
              </div>
            ) : (
              activeEmergencies.map((emg) => {
                const sevColor =
                  emg.severity === 'CRITICAL' ? '#ef4444' : emg.severity === 'MODERATE' ? '#f59e0b' : '#38bdf8';
                return (
                  <div
                    key={emg.uid}
                    style={{
                      border: `1px solid ${sevColor}`,
                      background: 'rgba(14, 8, 12, 0.85)',
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 9,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, color: '#fff' }}>
                        [{emg.code}] {emg.title}
                      </span>
                      <span
                        style={{
                          fontSize: 9.5,
                          padding: '2px 7px',
                          background: sevColor,
                          color: '#000',
                          fontWeight: 700,
                        }}
                      >
                        {emg.severity} // {emg.category}
                      </span>
                    </div>

                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {emg.description}
                    </div>

                    <div style={{ fontSize: 10, color: '#fca5a5' }}>
                      COMPARTMENT: <strong>{emg.compartmentId.toUpperCase()}</strong> • IMPACT: {emg.consequenceSummary}
                    </div>

                    {/* Repair Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, marginBottom: 4 }}>
                        <span style={{ color: 'var(--cyan)' }}>RESTORATION PROGRESS</span>
                        <span>{Math.round(emg.repairProgress)}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)' }}>
                        <div
                          style={{
                            width: `${emg.repairProgress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                            transition: 'width 150ms linear',
                          }}
                        />
                      </div>
                    </div>

                    {/* Response Action Deck */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      <button
                        className={`star-btn ${emg.diagnosed ? 'success' : ''}`}
                        disabled={emg.diagnosed}
                        onClick={() => diagnoseEmergency(emg.uid)}
                      >
                        <Activity size={11} /> {emg.diagnosed ? 'DIAGNOSED ✓' : '1. DIAGNOSE'}
                      </button>
                      <button
                        className={`star-btn ${emg.isolated ? 'success' : ''}`}
                        disabled={emg.isolated}
                        onClick={() => isolateEmergency(emg.uid)}
                      >
                        {emg.isolated ? 'ISOLATED ✓' : '2. ISOLATE FAULT'}
                      </button>
                      <button
                        className={`star-btn ${emg.backupEngaged ? 'success' : ''}`}
                        disabled={emg.backupEngaged}
                        onClick={() => engageBackupForEmergency(emg.uid)}
                      >
                        <Power size={11} /> {emg.backupEngaged ? 'BACKUP ON ✓' : '3. ENGAGE BACKUP'}
                      </button>
                      <button
                        className={`star-btn ${emg.robotDispatched ? 'active' : ''}`}
                        disabled={emg.robotDispatched}
                        onClick={() => dispatchRobotToEmergency(emg.uid)}
                      >
                        <Bot size={11} /> {emg.robotDispatched ? 'M-BOT WORKING...' : 'DISPATCH M-BOT'}
                      </button>
                      <button className="star-btn active" onClick={() => manualRepairEmergency(emg.uid)}>
                        <Wrench size={11} /> MANUAL REPAIR (+34%)
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Physical Component Integrity Grid */}
            <div style={{ border: '1px solid var(--border-dim)', padding: 12, background: 'rgba(4,10,22,0.72)' }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginBottom: 10 }}>
                PHYSICAL COMPONENT INTEGRITY (REPAIRABLE VIA EVA / DOCK)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {Object.entries(components).map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      padding: 7,
                      background: 'rgba(0,0,0,0.35)',
                      border: `1px solid ${val < 75 ? 'var(--amber)' : 'rgba(0,229,255,0.16)'}`,
                    }}
                  >
                    <div style={{ fontSize: 8.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{key}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: val < 60 ? 'var(--red)' : val < 85 ? 'var(--amber)' : '#6ee7b7' }}>
                      {Math.round(val)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Maintenance Robots & Incident History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ border: '1px solid var(--border-dim)', padding: 12, background: 'rgba(4,10,22,0.72)' }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginBottom: 8 }}>
                MAINTENANCE ROBOT BAY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {robots.map((bot) => (
                  <div
                    key={bot.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 9px',
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(0,229,255,0.16)',
                      fontSize: 10,
                    }}
                  >
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{bot.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>LOC: {bot.assignedRoomId.toUpperCase()}</div>
                    </div>
                    <span style={{ color: bot.status === 'DISPATCHED' ? 'var(--amber)' : 'var(--green)' }}>
                      {bot.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-dim)', padding: 12, background: 'rgba(4,10,22,0.72)', flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginBottom: 8 }}>
                RESOLVED EMERGENCY HISTORY ({emergencyHistory.length})
              </div>
              {emergencyHistory.length === 0 ? (
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>No past emergencies logged.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                  {emergencyHistory.map((rec) => (
                    <div key={rec.uid} style={{ fontSize: 9.5, borderBottom: '1px solid rgba(0,229,255,0.08)', paddingBottom: 5 }}>
                      <div style={{ color: '#6ee7b7' }}>✓ {rec.title}</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {rec.startedAt} → {rec.resolvedAt} ({rec.severity})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

