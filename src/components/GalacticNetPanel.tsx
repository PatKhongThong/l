import React from 'react';
import { Award, Flame, Globe, Landmark, Palette, ShieldAlert, Skull, Sparkles, TrendingUp, X } from 'lucide-react';
import { ACHIEVEMENTS, HudThemeId, SHIP_CLASSES, useShipStore } from '../store/useShipStore';

const HUD_THEMES: Array<{ id: HudThemeId; label: string; color: string }> = [
  { id: 'cyan', label: 'ORBITAL CYAN', color: '#00e5ff' },
  { id: 'emerald', label: 'MATRIX EMERALD', color: '#10b981' },
  { id: 'amber', label: 'TACTICAL AMBER', color: '#f59e0b' },
  { id: 'violet', label: 'QUANTUM VIOLET', color: '#a855f7' },
  { id: 'crimson', label: 'IMPERIAL CRIMSON', color: '#ef4444' },
];

export const GalacticNetPanel: React.FC = () => {
  const {
    credits,
    bankVault,
    stocks,
    unlockedAchievements,
    peakSpeed,
    hudTheme,
    shipClass,
    ownedShipClasses,
    landedPlanetId,
    deployedSatellites,
    tradeStock,
    bankTransfer,
    setHudTheme,
    buyOrSelectShipClass,
    summonLeviathanBoss,
    hostHoloDeckParty,
    triggerFireSuppression,
    setActiveView,
  } = useShipStore();

  const [tab, setTab] = React.useState<'market' | 'achievements' | 'classes' | 'tactical'>('market');
  const onEarth = landedPlanetId === 'earth';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 44,
        background: 'rgba(2, 6, 14, 0.86)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
    >
      <div className="star-panel" style={{ width: 'min(1020px, 96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="star-panel-header" style={{ padding: '10px 14px', fontSize: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 6 }}>
              <Globe size={14} /> GALACTIC NET
            </span>
            <button className={`star-btn ${tab === 'market' ? 'active' : ''}`} onClick={() => setTab('market')}>
              <TrendingUp size={11} /> STOCKS &amp; BANK
            </button>
            <button className={`star-btn ${tab === 'achievements' ? 'active' : ''}`} onClick={() => setTab('achievements')}>
              <Award size={11} /> ACHIEVEMENTS ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </button>
            <button className={`star-btn ${tab === 'classes' ? 'active' : ''}`} onClick={() => setTab('classes')}>
              <Sparkles size={11} /> SHIP CLASSES &amp; THEMES
            </button>
            <button className={`star-btn ${tab === 'tactical' ? 'active' : ''}`} onClick={() => setTab('tactical')}>
              <Skull size={11} /> BOSS &amp; SHIP OPS
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#6ee7b7', fontSize: 11 }}>{credits.toLocaleString()} CR</span>
            <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
              <X size={13} /> CLOSE
            </button>
          </div>
        </div>

        {/* TAB 1: GALACTIC STOCK MARKET & ORBITAL BANK VAULT */}
        {tab === 'market' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, padding: 16, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>
                GALACTIC STOCK EXCHANGE (PRICES FLUCTUATE LIVE EVERY 8 SECONDS)
              </div>
              {stocks.map((st) => (
                <div
                  key={st.symbol}
                  style={{
                    border: '1px solid var(--border-dim)',
                    background: 'rgba(4,10,22,0.8)',
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: '#fff' }}>
                      {st.symbol} <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>// {st.name}</span>
                    </div>
                    <div style={{ fontSize: 10, marginTop: 4 }}>
                      <strong style={{ color: '#fff' }}>{st.price.toLocaleString()} CR</strong>{' '}
                      <span style={{ color: st.change >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                        ({st.change >= 0 ? '+' : ''}{st.change}%)
                      </span>{' '}
                      • OWNED: <strong style={{ color: 'var(--cyan)' }}>{st.owned}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="star-btn active" disabled={credits < st.price} onClick={() => tradeStock(st.symbol, 1)}>
                      BUY 1
                    </button>
                    <button className="star-btn active" disabled={credits < st.price * 10} onClick={() => tradeStock(st.symbol, 10)}>
                      BUY 10
                    </button>
                    <button className="star-btn success" disabled={st.owned < 1} onClick={() => tradeStock(st.symbol, -st.owned)}>
                      SELL ALL
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4,12,24,0.82)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 10, color: '#fbbf24', letterSpacing: '0.16em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Landmark size={13} /> ORBITAL HIGH-YIELD VAULT (+0.8% INTEREST / TICK)
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#6ee7b7' }}>
                {bankVault.toLocaleString()} CR
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="star-btn active" disabled={credits < 5000} onClick={() => bankTransfer(5000)}>
                  DEPOSIT 5,000
                </button>
                <button className="star-btn active" disabled={credits < 50000} onClick={() => bankTransfer(50000)}>
                  DEPOSIT 50,000
                </button>
                <button className="star-btn warning" disabled={bankVault < 5000} onClick={() => bankTransfer(-5000)}>
                  WITHDRAW 5,000
                </button>
                <button className="star-btn success" disabled={bankVault <= 0} onClick={() => bankTransfer(-bankVault)}>
                  WITHDRAW ALL
                </button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 'auto', lineHeight: 1.5 }}>
                DEPLOYED RECON SATELLITES: <strong style={{ color: 'var(--cyan)' }}>{deployedSatellites.length}</strong>{' '}
                (earning +{deployedSatellites.length * 45} CR passive telemetry every tick!)
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 12 ACHIEVEMENTS & SPEED RECORDS */}
        {tab === 'achievements' && (
          <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#fcd34d' }}>
              <span>ALL-TIME PEAK SPEED RECORD: <strong>{Math.round(peakSpeed)} m/s</strong></span>
              <span>UNLOCKED: {unlockedAchievements.length} / {ACHIEVEMENTS.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {ACHIEVEMENTS.map((a) => {
                const done = unlockedAchievements.includes(a.id);
                return (
                  <div
                    key={a.id}
                    style={{
                      border: `1px solid ${done ? '#10b981' : 'var(--border-dim)'}`,
                      background: done ? 'rgba(16, 185, 129, 0.12)' : 'rgba(4,10,22,0.75)',
                      padding: 10,
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: done ? '#6ee7b7' : '#fff' }}>
                      {done ? '🏆 ' : '○ '}
                      {a.title}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', marginTop: 4 }}>{a.desc}</div>
                    <div style={{ fontSize: 9, color: done ? '#6ee7b7' : 'var(--amber)', marginTop: 6 }}>
                      {done ? 'CLAIMED ✓' : `REWARD: +${a.reward.toLocaleString()} CR`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SHIP CLASSES & OS HUD THEMES */}
        {tab === 'classes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, padding: 16, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>
                COMMISSION SPACECRAFT CLASS ({onEarth ? 'EARTH SHIPYARD READY' : 'LAND ON EARTH TO REFIT'})
              </div>
              {SHIP_CLASSES.map((cls) => {
                const active = shipClass === cls.id;
                const owned = ownedShipClasses.includes(cls.id);
                return (
                  <div key={cls.id} style={{ border: `1px solid ${active ? 'var(--cyan)' : 'var(--border-dim)'}`, background: 'rgba(4,10,22,0.8)', padding: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11.5, color: '#fff' }}>{cls.name}</div>
                      <div style={{ fontSize: 9.5, color: '#6ee7b7', marginTop: 3 }}>{cls.perk}</div>
                    </div>
                    <button
                      className={`star-btn ${active ? 'success' : 'active'}`}
                      disabled={!onEarth || active || (!owned && credits < cls.cost)}
                      onClick={() => buyOrSelectShipClass(cls.id)}
                    >
                      {active ? 'ACTIVE ✓' : !onEarth ? 'EARTH ONLY' : owned ? 'SWITCH' : `${cls.cost.toLocaleString()} CR`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4,10,22,0.8)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Palette size={12} /> STARSHIP OS HUD COLOR THEME
              </div>
              {HUD_THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`star-btn ${hudTheme === t.id ? 'active' : ''}`}
                  style={{ justifyContent: 'space-between', padding: '9px 12px' }}
                  onClick={() => setHudTheme(t.id)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                    {t.label}
                  </span>
                  {hudTheme === t.id && <span>ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BOSS BOUNTY SUMMONER, HOLO-DECK PARTY & HALON SUPPRESSION */}
        {tab === 'tactical' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, padding: 16 }}>
            <div style={{ border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(24,6,8,0.8)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Skull size={14} /> LEVIATHAN BOSS BOUNTY
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Broadcast an open challenge beacon to lure the 650-HP Leviathan Dreadnought Boss into your sector for a
                massive <strong>25,000 CR</strong> bounty!
              </p>
              <button className="star-btn danger active" style={{ marginTop: 'auto' }} onClick={summonLeviathanBoss}>
                SUMMON LEVIATHAN BOSS
              </button>
            </div>

            <div style={{ border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(4,20,16,0.8)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> CREW HOLO-DECK BANQUET
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Host a ship-wide Holo-Deck morale celebration to instantly restore all 8 crew members to 100% health,
                100% morale, and 0% fatigue.
              </p>
              <button className="star-btn success" style={{ marginTop: 'auto' }} disabled={credits < 500} onClick={hostHoloDeckParty}>
                HOST BANQUET (500 CR)
              </button>
            </div>

            <div style={{ border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(22,12,4,0.8)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: '#fcd34d', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={14} /> HALON FIRE SUPPRESSION
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Flood reactor manifolds with inert Halon gas to instantly suppress thermal spikes (-180K core temp)
                without spending cryo-coolant canisters.
              </p>
              <button className="star-btn warning" style={{ marginTop: 'auto' }} onClick={triggerFireSuppression}>
                <ShieldAlert size={12} /> FLOOD HALON (-180K)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

