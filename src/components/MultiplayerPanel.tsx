import React, { useEffect, useState } from 'react';
import { Award, Copy, Radio, RefreshCw, Send, Users, Wifi, WifiOff, X } from 'lucide-react';
import { getDefaultWsUrl, MultiplayerJob, multiplayerClient } from '../utils/multiplayer';
import { getPilotRank, useShipStore } from '../store/useShipStore';

const MP_JOBS: Array<{ id: MultiplayerJob; title: string; perk: string; color: string }> = [
  { id: 'PILOT', title: 'PILOT', perk: '+15% THRUST & AGILITY', color: '#00e5ff' },
  { id: 'ENGINEER', title: 'ENGINEER', perk: '+25% COOLING & REPAIR', color: '#f59e0b' },
  { id: 'WEAPONS', title: 'WEAPONS OFFICER', perk: '+40% CANNON DMG', color: '#ef4444' },
  { id: 'NAVIGATOR', title: 'NAVIGATOR', perk: '-20% JUMP FUEL & +SCAN', color: '#38bdf8' },
  { id: 'SCIENTIST', title: 'SCIENTIST', perk: '+35% SCIENCE GRANT CR', color: '#a855f7' },
  { id: 'MEDIC', title: 'MEDIC / SEC', perk: '+30% CREW & SHIELDS', color: '#10b981' },
  { id: 'FOREMAN', title: 'FACTORY FOREMAN', perk: '+50% EARTH FACTORY OUTPUT', color: '#fbbf24' },
  { id: 'ROBOTICS', title: 'ROBOTICS TECH', perk: '+80% ROBOTIC ARM SPEED', color: '#22d3ee' },
  { id: 'MINER', title: 'MINING SPECIALIST', perk: '2x ASTEROID ORE YIELD', color: '#fb923c' },
  { id: 'QUARTERMASTER', title: 'CARGO MASTER', perk: '+40% TRADE & FREIGHT', color: '#34d399' },
];

export const MultiplayerPanel: React.FC = () => {
  const {
    mpConnected,
    mpRoom,
    mpCallsign,
    mpJob,
    boardedHostId,
    remotePlayers,
    fleetChat,
    xp,
    credits,
    raidersDestroyed,
    asteroidsMined,
    discoveries,
    missions,
    connectMultiplayer,
    disconnectMultiplayer,
    boardPlayerShip,
    leaveBoardedShip,
    setMpJob,
    sendFleetChat,
    sendFleetCredits,
    sendSquadPing,
    setActiveView,
  } = useShipStore();

  const defaultWs = getDefaultWsUrl();
  const [roomInput, setRoomInput] = useState(mpRoom);
  const [callsignInput, setCallsignInput] = useState(mpCallsign);
  const [wsUrlInput, setWsUrlInput] = useState(defaultWs);
  const [wsOnline, setWsOnline] = useState(multiplayerClient.isWsConnected());
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setWsOnline(multiplayerClient.isWsConnected());
    return multiplayerClient.onStatus((online) => setWsOnline(online));
  }, []);

  const createFleetCode = () => {
    const code = `FLT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setRoomInput(code);
    connectMultiplayer(code, callsignInput, wsUrlInput);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/?fleet=${encodeURIComponent(roomInput || mpRoom)}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rank = getPilotRank(xp);
  const remoteList = Object.values(remotePlayers);
  const completedMissions = missions.filter((m) => m.completed).length;

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendFleetChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 42,
        background: 'rgba(2, 6, 14, 0.85)',
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
            <Users size={14} /> MULTIPLAYER FLEET LINK, CO-OP JOBS &amp; PILOT CAREER
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: mpConnected ? (wsOnline ? '#6ee7b7' : '#fcd34d') : 'var(--text-muted)' }}>
              {mpConnected
                ? `● CONNECTED [${mpRoom}] (${wsOnline ? 'LIVE SERVER SYNC' : 'LOCAL TABS'})`
                : '○ OFFLINE'}
            </span>
            <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
              <X size={13} /> CLOSE
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 14, padding: 16, overflowY: 'auto' }}>
          {/* Left: Connection, Crew Job Selection & Fleet Roster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4, 10, 22, 0.8)', padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginBottom: 8 }}>
                ENTER A FLEET CODE TO JOIN THE SAME FLEET (RUN `npm.cmd run play` FOR LAN/CROSS-PC)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <input
                  value={callsignInput}
                  onChange={(e) => setCallsignInput(e.target.value)}
                  placeholder="Callsign"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-dim)',
                    color: '#fff',
                    padding: '6px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                  }}
                />
                <input
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  placeholder="Fleet Code (e.g. STAR-01)"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-glow)',
                    color: '#00e5ff',
                    fontWeight: 700,
                    padding: '6px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.12em',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <button className="star-btn" style={{ flex: 1 }} onClick={createFleetCode}>
                  <RefreshCw size={11} /> NEW FLEET CODE
                </button>
                <button className="star-btn success" style={{ flex: 1 }} onClick={copyInviteLink}>
                  <Copy size={11} /> {copied ? 'INVITE LINK COPIED ✓' : 'COPY INVITE LINK'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={wsUrlInput}
                  onChange={(e) => setWsUrlInput(e.target.value)}
                  placeholder="Optional WebSocket URL (ws://...)"
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-dim)',
                    color: 'var(--text-secondary)',
                    padding: '6px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                  }}
                />
                {mpConnected ? (
                  <button className="star-btn danger" onClick={disconnectMultiplayer}>
                    <WifiOff size={12} /> DISCONNECT
                  </button>
                ) : (
                  <button
                    className="star-btn active"
                    onClick={() => connectMultiplayer(roomInput, callsignInput, wsUrlInput)}
                  >
                    <Wifi size={12} /> JOIN FLEET
                  </button>
                )}
              </div>
            </div>

            {/* Multiplayer Crew Job / Role Selector */}
            <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4, 10, 22, 0.8)', padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginBottom: 8 }}>
                SELECT FLEET JOB ROLE (ACTIVE PASSIVE PERK)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {MP_JOBS.map((j) => {
                  const active = mpJob === j.id;
                  return (
                    <button
                      key={j.id}
                      className={`star-btn ${active ? 'active' : ''}`}
                      style={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '7px 9px',
                        borderColor: active ? j.color : undefined,
                      }}
                      onClick={() => setMpJob(j.id)}
                    >
                      <span style={{ color: j.color, fontWeight: 700, fontSize: 10 }}>{j.title}</span>
                      <span style={{ fontSize: 8.5, color: 'var(--text-secondary)' }}>{j.perk}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pilot Career Rank & Achievements */}
            <div style={{ border: '1px solid rgba(0, 229, 255, 0.25)', background: 'rgba(4, 14, 28, 0.8)', padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={13} /> CAREER RANK: {rank} ({xp} XP)
                </span>
                <span style={{ fontSize: 10, color: '#6ee7b7' }}>{credits.toLocaleString()} CR</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontSize: 9.5, textAlign: 'center' }}>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: 6 }}>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 13 }}>{raidersDestroyed}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>RAIDERS</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: 6 }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>{asteroidsMined}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>MINED</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: 6 }}>
                  <div style={{ color: '#a855f7', fontWeight: 700, fontSize: 13 }}>{discoveries.length}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>SCANS</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: 6 }}>
                  <div style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>{completedMissions}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>QUESTS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Connected Players Leaderboard + Live Fleet Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4, 10, 22, 0.8)', padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginBottom: 8 }}>
                CONNECTED FLEET PILOTS ({remoteList.length + (mpConnected ? 1 : 0)})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 140, overflowY: 'auto', fontSize: 9.5 }}>
                {mpConnected && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: 'rgba(0,229,255,0.12)', border: '1px solid var(--cyan)' }}>
                    <span>
                      <strong>{mpCallsign} (YOU)</strong> • {mpJob}
                    </span>
                    <span style={{ color: '#6ee7b7' }}>{rank}</span>
                  </div>
                )}
                {remoteList.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', padding: '6px 2px' }}>
                    {mpConnected
                      ? 'Waiting for other pilots... Open a second browser tab and join the same Room Code!'
                      : 'Click JOIN FLEET to connect and see other spacecraft in 3D space.'}
                  </div>
                ) : (
                  remoteList.map((p) => {
                    const isBoardedHere = boardedHostId === (p.shipHostId || p.id);
                    return (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'rgba(0,0,0,0.38)', gap: 8 }}>
                        <span>
                          <strong style={{ color: '#6ee7b7' }}>{p.callsign}</strong> • {p.job} ({p.systemId.toUpperCase()})
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="star-btn success"
                            style={{ padding: '2px 6px', fontSize: 8.5 }}
                            disabled={credits < 1000}
                            onClick={() => sendFleetCredits(p.callsign, 1000)}
                            title="Wire 1,000 CR to this fleet pilot"
                          >
                            +1k CR
                          </button>
                          {isBoardedHere ? (
                            <button className="star-btn warning" style={{ padding: '2px 7px', fontSize: 8.5 }} onClick={leaveBoardedShip}>
                              RETURN TO OWN SHIP
                            </button>
                          ) : (
                            <button className="star-btn active" style={{ padding: '2px 7px', fontSize: 8.5 }} onClick={() => boardPlayerShip(p.id)}>
                              BOARD SHIP
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Subspace Fleet Chat */}
            <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4, 10, 22, 0.8)', padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Radio size={12} /> SUBSPACE FLEET CHAT
                </span>
                <button
                  className="star-btn active"
                  style={{ padding: '2px 8px', fontSize: 8.5 }}
                  onClick={sendSquadPing}
                  title="Drop a Squad Waypoint & broadcast your exact coordinates to fleet chat"
                >
                  📍 SQUAD PING
                </button>
              </div>
              <div style={{ flex: 1, minHeight: 165, maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10, marginBottom: 8 }}>
                {fleetChat.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>No fleet messages yet. Co-op mission rewards also broadcast here!</div>
                ) : (
                  fleetChat.map((m) => (
                    <div key={m.id} style={{ lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>[{m.time}]</span>{' '}
                      <strong style={{ color: 'var(--cyan)' }}>{m.sender}</strong>{' '}
                      <span style={{ color: 'var(--amber)', fontSize: 8.5 }}>[{m.job}]</span>: {m.text}
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleChat} style={{ display: 'flex', gap: 6 }}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={!mpConnected}
                  placeholder={mpConnected ? 'Transmit to squad...' : 'Join a Fleet Room to chat...'}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.55)',
                    border: '1px solid var(--border-dim)',
                    color: '#fff',
                    padding: '6px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                  }}
                />
                <button type="submit" className="star-btn active" disabled={!mpConnected}>
                  <Send size={11} /> SEND
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

