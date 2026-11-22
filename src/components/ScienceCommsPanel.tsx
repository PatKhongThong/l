import React from 'react';
import { Microscope, Radio, Send, X } from 'lucide-react';
import { useShipStore } from '../store/useShipStore';

export const ScienceCommsPanel: React.FC = () => {
  const {
    discoveries,
    commsInbox,
    commsOnline,
    triggerDeepScan,
    sendCommHail,
    setActiveView,
  } = useShipStore();

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
            <Microscope size={14} /> SCIENCE DATABASE &amp; SUBSPACE COMMUNICATIONS
          </span>
          <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
            <X size={13} /> CLOSE
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 14, padding: 16, overflowY: 'auto' }}>
          {/* Left: Science & Discovery Database */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#c084fc', letterSpacing: '0.16em' }}>
                CATALOGED DISCOVERIES &amp; SAMPLES ({discoveries.length})
              </span>
              <button className="star-btn active" style={{ padding: '4px 9px', fontSize: 9.5 }} onClick={triggerDeepScan}>
                RUN DEEP SCAN [R]
              </button>
            </div>

            {discoveries.length === 0 ? (
              <div style={{ border: '1px solid var(--border-dim)', padding: 16, fontSize: 10.5, color: 'var(--text-secondary)' }}>
                No planetary samples or anomalies cataloged yet. Approach planets, satellites, comets, or anomalies and
                press <strong>[R] DEEP SCAN</strong> to record spectral data and earn Science Grants.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                {discoveries.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      background: 'rgba(18, 10, 32, 0.65)',
                      padding: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                      <span>{d.name}</span>
                      <span style={{ color: '#c084fc', fontSize: 9.5 }}>{d.classification}</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--cyan-soft)', marginTop: 3 }}>
                      SAMPLE: {d.sampleName} • RAD: {d.radiationReading} • {d.systemName}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                      {d.notes}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Subspace Communications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Radio size={12} /> SUBSPACE ARRAY ({commsOnline ? 'ONLINE' : 'OFFLINE'})
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              <button className="star-btn" onClick={() => sendCommHail('MISSION CONTROL')}>
                <Send size={10} /> MISSION CTRL
              </button>
              <button className="star-btn" onClick={() => sendCommHail('NEAREST STATION')}>
                <Send size={10} /> HAIL STATION
              </button>
              <button className="star-btn" onClick={() => sendCommHail('DISTRESS BROADCAST')}>
                <Send size={10} /> PING SECTOR
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
              {commsInbox.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    border: '1px solid var(--border-dim)',
                    background: 'rgba(4, 12, 24, 0.78)',
                    padding: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--cyan)' }}>
                    <strong>{msg.sender}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {msg.channel} • {msg.time}
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-primary)', marginTop: 5, lineHeight: 1.45 }}>
                    {msg.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

