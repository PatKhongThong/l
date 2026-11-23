import React, { useState } from 'react';
import { Bot, Database, HardDrive, Save, FolderOpen, X, Activity, KeyRound } from 'lucide-react';
import { useShipStore } from '../store/useShipStore';
import { starshipAudio } from '../utils/audio';

export const AriaTerminal: React.FC = () => {
  const {
    shipName,
    hull,
    fuel,
    oxygen,
    temperature,
    activeEmergencies,
    blackBox,
    maintenanceHistory,
    runFullDiagnostic,
    triggerCoolantFlush,
    triggerDeepScan,
    toggleRedAlert,
    saveGame,
    loadGame,
    clearSavedGame,
    applyTick,
    addLog,
    setActiveView,
  } = useShipStore();

  const [input, setInput] = useState('');
  const [devCode, setDevCode] = useState('');
  const [chat, setChat] = useState<Array<{ from: 'ARIA' | 'CMD'; text: string }>>([
    {
      from: 'ARIA',
      text: `ARIA Ship AI online aboard ${shipName}. Type a command: "status", "diagnostic", "scan", "coolant", "red alert", "save", or "help".`,
    },
  ]);

  const redeemDevCode = (rawCode: string): string => {
    if (rawCode.trim() === 'devdevdevsahur') {
      const currentCredits = useShipStore.getState().credits;
      applyTick({ credits: currentCredits + 100_000_000 });
      starshipAudio.playSuccess();
      addLog('DEV OVERRIDE ACCEPTED — +100,000,000 CR CREDITED TO ACCOUNT', 'success');
      return 'DEV OVERRIDE ACCEPTED: +100,000,000 CR added to ship treasury.';
    }
    starshipAudio.playAlert('LOW');
    return 'INVALID DEV ACCESS CODE.';
  };

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devCode.trim()) return;
    const reply = redeemDevCode(devCode);
    setChat((prev) => [...prev, { from: 'CMD', text: '[DEV CODE REDACTED]' }, { from: 'ARIA', text: reply }]);
    setDevCode('');
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.trim();
    const cmd = raw.toLowerCase();
    if (!cmd) return;
    let reply = 'Unknown directive. Try: status, diagnostic, scan, coolant, red alert, save, help.';

    if (raw === 'devdevdevsahur') {
      reply = redeemDevCode(raw);
    } else if (cmd.includes('help')) {
      reply = 'COMMANDS: status | diagnostic | scan | coolant | red alert | save | load';
    } else if (cmd.includes('status')) {
      reply = `HULL ${Math.round(hull)}% | FUEL ${Math.round(fuel)}% | O2 ${Math.round(oxygen)}% | TEMP ${Math.round(temperature)}K | EMERGENCIES: ${activeEmergencies.length}.`;
    } else if (cmd.includes('diag')) {
      reply = runFullDiagnostic();
    } else if (cmd.includes('scan')) {
      triggerDeepScan();
      reply = 'Deep-space sensor sweep executed.';
    } else if (cmd.includes('cool')) {
      triggerCoolantFlush();
      reply = 'Cryogenic coolant flush initiated.';
    } else if (cmd.includes('red')) {
      toggleRedAlert();
      reply = 'Red Alert lighting & tactical condition toggled.';
    } else if (cmd.includes('save')) {
      saveGame();
      reply = 'Persistent simulation snapshot written to local core.';
    } else if (cmd.includes('load')) {
      const ok = loadGame();
      reply = ok ? 'Saved snapshot loaded successfully.' : 'No saved snapshot found in local core.';
    }

    setChat((prev) => [...prev, { from: 'CMD', text: input.trim() }, { from: 'ARIA', text: reply }]);
    setInput('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(2, 6, 14, 0.84)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
    >
      <div className="star-panel" style={{ width: 'min(1000px, 96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="star-panel-header" style={{ padding: '10px 14px', fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={14} /> ARIA AI COMPUTER, BLACK BOX RECORDER &amp; PERSISTENT CORE
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="star-btn success" onClick={() => saveGame(false)} style={{ padding: '3px 9px' }}>
              <Save size={12} /> SAVE NOW
            </button>
            <button className="star-btn" onClick={() => loadGame(false)} style={{ padding: '3px 9px' }}>
              <FolderOpen size={12} /> LOAD
            </button>
            <button className="star-btn danger" onClick={clearSavedGame} style={{ padding: '3px 8px' }} title="Clear Local Save">
              WIPE SAVE
            </button>
            <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
              <X size={13} /> CLOSE
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14, padding: 16, overflowY: 'auto' }}>
          {/* Left: ARIA Interactive Terminal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>ARIA NEURAL ASSISTANT</span>
              <button
                className="star-btn active"
                style={{ padding: '3px 8px', fontSize: 9 }}
                onClick={() => setChat((p) => [...p, { from: 'ARIA', text: runFullDiagnostic() }])}
              >
                <Activity size={11} /> AUTO-DIAGNOSTIC
              </button>
            </div>

            <div
              style={{
                border: '1px solid var(--border-dim)',
                background: 'rgba(2, 6, 14, 0.85)',
                padding: 12,
                height: 300,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 10.5,
              }}
            >
              {chat.map((line, i) => (
                <div key={i} style={{ color: line.from === 'ARIA' ? 'var(--cyan-soft)' : '#fff', lineHeight: 1.45 }}>
                  <strong style={{ color: line.from === 'ARIA' ? 'var(--cyan)' : 'var(--amber)' }}>
                    [{line.from}]
                  </strong>{' '}
                  {line.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleCommand} style={{ display: 'flex', gap: 6 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type directive (status, diagnostic, scan, coolant, save)..."
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.55)',
                  border: '1px solid var(--border-glow)',
                  color: '#fff',
                  padding: '7px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                }}
              />
              <button type="submit" className="star-btn active">
                EXECUTE
              </button>
            </form>

            {/* Dev Override Access Code Box */}
            <form
              onSubmit={handleDevSubmit}
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                padding: '7px 9px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                background: 'rgba(20, 12, 4, 0.55)',
              }}
            >
              <KeyRound size={13} color="#fbbf24" />
              <input
                value={devCode}
                onChange={(e) => setDevCode(e.target.value)}
                placeholder="Enter Dev Code..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fcd34d',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                }}
              />
              <button type="submit" className="star-btn warning" style={{ padding: '4px 10px', fontSize: 9.5 }}>
                REDEEM CODE
              </button>
            </form>
          </div>

          {/* Right: Black Box Recorder + Maintenance History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ border: '1px solid var(--border-dim)', padding: 10, background: 'rgba(3, 9, 20, 0.8)' }}>
              <div style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.14em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HardDrive size={12} /> BLACK BOX FLIGHT RECORDER ({blackBox.length})
              </div>
              <div style={{ maxHeight: 155, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 9.5 }}>
                {blackBox.map((b, i) => (
                  <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>[{b.time}]</span>{' '}
                    <span style={{ color: '#fff' }}>{b.event}</span>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 8.5 }}>
                      {b.sector} • SPD {b.speed} m/s • HULL {b.hull}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-dim)', padding: 10, background: 'rgba(3, 9, 20, 0.8)' }}>
              <div style={{ fontSize: 10, color: 'var(--green)', letterSpacing: '0.14em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Database size={12} /> MAINTENANCE HISTORY LEDGER ({maintenanceHistory.length})
              </div>
              <div style={{ maxHeight: 155, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 9.5 }}>
                {maintenanceHistory.map((m) => (
                  <div key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 4 }}>
                    <span style={{ color: '#6ee7b7' }}>{m.system}</span> — {m.action}
                    <div style={{ color: 'var(--text-muted)', fontSize: 8.5 }}>
                      {m.time} • BY {m.performedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

