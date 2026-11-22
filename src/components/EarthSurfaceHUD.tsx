import React, { useEffect, useState } from 'react';
import { Factory, Flame, Package, Palette, Rocket, Sliders, Sparkles, Users, Wind, Wrench, X, Zap } from 'lucide-react';
import { EARTH_SHOP_PARTS, ENGINE_MODELS, useShipStore, XENO_BLACK_MARKET_MODS } from '../store/useShipStore';
import { EarthShopTab, onOpenEarthShop } from '../scene/EarthSurfaceScene';

const UNDERGLOW_OPTIONS = [
  { name: 'OFF', color: null, cost: 0 },
  { name: 'CYAN', color: '#00e5ff', cost: 1200 },
  { name: 'ELECTRIC BLUE', color: '#3b82f6', cost: 1200 },
  { name: 'AMBER GOLD', color: '#f59e0b', cost: 1500 },
  { name: 'EMERALD', color: '#10b981', cost: 1500 },
  { name: 'CRIMSON', color: '#ef4444', cost: 1800 },
  { name: 'ULTRAVIOLET', color: '#a855f7', cost: 2000 },
];

export const EarthSurfaceHUD: React.FC = () => {
  const {
    playerMode,
    earthCutsceneProgress,
    shipName,
    credits,
    installedEngineId,
    ownedEngines,
    engineConfig,
    roofPart,
    aeroPart,
    nosePart,
    boosterPart,
    xenoMods,
    underglowColor,
    ownedParts,
    factories,
    cargoBayLevel,
    roboticArmOverdrive,
    cargo,
    earthWeather,
    setEarthWeather,
    setActiveView,
    installEngineModel,
    setEngineConfig,
    buyOrEquipEarthPart,
    buyXenoMod,
    buyBulkSupplies,
    setUnderglowColor,
    upgradeFactory,
    hireFactoryWorker,
    collectFactoryOutput,
    toggleRoboticArmOverdrive,
    upgradeCargoBays,
    launchFromEarth,
  } = useShipStore();

  const [shopTab, setShopTab] = useState<EarthShopTab | null>(null);

  useEffect(() => {
    return onOpenEarthShop((tab) => setShopTab(tab));
  }, []);

  // 1. ATMOSPHERIC RE-ENTRY & LANDING CUTSCENE OVERLAY
  if (playerMode === 'earth_cutscene') {
    const altitude = Math.max(0, Math.round((1 - earthCutsceneProgress) * 42000));
    const phase =
      earthCutsceneProgress < 0.35
        ? 'ATMOSPHERIC RE-ENTRY // HEAT SHIELD ACTIVE'
        : earthCutsceneProgress < 0.72
          ? 'DESCENDING OVER NEW GENEVA SKYLINE CITY'
          : 'LANDING GEAR DEPLOYED // TOUCHDOWN AT PAD 01';

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 25, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 52, background: '#02050a' }} />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            background: '#02050a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--cyan)', letterSpacing: '0.2em' }}>
            {shipName} // EARTH LANDING SEQUENCE
          </div>
          <div style={{ fontSize: 11, color: '#fcd34d', letterSpacing: '0.14em' }}>{phase}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#fff' }}>
            ALT: {altitude.toLocaleString()} m
          </div>
        </div>
      </div>
    );
  }

  const aeroParts = EARTH_SHOP_PARTS.filter((p) => p.slot === 'aero');
  const noseParts = EARTH_SHOP_PARTS.filter((p) => p.slot === 'nose');
  const roofParts = EARTH_SHOP_PARTS.filter((p) => p.slot === 'roof');
  const boosterParts = EARTH_SHOP_PARTS.filter((p) => p.slot === 'booster');

  // 2. NEW GENEVA CITY & EARTH SURFACE HUD
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
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
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div className="star-panel" style={{ padding: '7px 14px', borderColor: '#10b981' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#6ee7b7', letterSpacing: '0.16em' }}>
            EARTH // NEW GENEVA SPACEPORT &amp; CITY
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', marginTop: 2 }}>
            EXPLORE THE CITY SHOPS — ALL INSTALLED ROOFS, WINGS &amp; ENGINES APPEAR LIVE ON YOUR 3D SHIP
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="star-panel" style={{ padding: '6px 11px', fontSize: 11, color: '#6ee7b7' }}>
            {credits.toLocaleString()} CR
          </span>
          <button className="star-btn active" onClick={() => setShopTab('aero')}>
            <Wind size={12} /> AERO
          </button>
          <button className="star-btn" style={{ borderColor: '#a855f7', color: '#d8b4fe' }} onClick={() => setShopTab('roof')}>
            <Sparkles size={12} /> ROOF
          </button>
          <button className="star-btn" style={{ borderColor: '#ec4899', color: '#f9a8d4' }} onClick={() => setShopTab('turbo')}>
            <Flame size={12} /> TURBO
          </button>
          <button className="star-btn success" onClick={() => setShopTab('xeno')}>
            <Zap size={12} /> XENO
          </button>
          <button className="star-btn warning" onClick={() => setShopTab('factory')}>
            <Factory size={12} /> FACTORIES
          </button>
          <button className="star-btn" style={{ borderColor: '#34d399', color: '#6ee7b7' }} onClick={() => setShopTab('cargo')}>
            <Package size={12} /> CARGO BAYS
          </button>
          <button className="star-btn warning" onClick={() => setShopTab('engine')}>
            <Sliders size={12} /> ENGINES
          </button>
          <button className="star-btn" onClick={() => setActiveView('upgrades')}>
            <Wrench size={12} /> MK-5
          </button>
          <button
            className="star-btn"
            onClick={() => {
              const order = ['day', 'sunset', 'night', 'storm'] as const;
              const next = order[(order.indexOf(earthWeather) + 1) % order.length];
              setEarthWeather(next);
            }}
            title="Cycle Earth Sky & Weather"
          >
            SKY: {earthWeather.toUpperCase()}
          </button>
          <button className="star-btn" onClick={() => setActiveView('galactic')}>
            CLASSES / NET
          </button>
          <button className="star-btn success" onClick={launchFromEarth}>
            <Rocket size={12} /> LAUNCH
          </button>
        </div>
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
          gap: 16,
        }}
      >
        <span>WASD: WALK CITY</span>
        <span>SHIFT: SPRINT</span>
        <span>DRAG / ARROWS: LOOK</span>
        <span style={{ color: '#6ee7b7' }}>WALK TO WEST / EAST / NORTH SHOPS &amp; PRESS [E]</span>
      </div>

      {/* NEW GENEVA CITY SHOPS MODAL */}
      {shopTab && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(2, 6, 14, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
            pointerEvents: 'auto',
          }}
        >
          <div className="star-panel" style={{ width: 'min(980px, 96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="star-panel-header" style={{ padding: '10px 14px', fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className={`star-btn ${shopTab === 'aero' ? 'active' : ''}`} onClick={() => setShopTab('aero')}>
                  <Wind size={11} /> AERO
                </button>
                <button className={`star-btn ${shopTab === 'roof' ? 'active' : ''}`} onClick={() => setShopTab('roof')}>
                  <Sparkles size={11} /> ROOF
                </button>
                <button className={`star-btn ${shopTab === 'turbo' ? 'active' : ''}`} onClick={() => setShopTab('turbo')}>
                  <Flame size={11} /> TURBO LAB
                </button>
                <button className={`star-btn ${shopTab === 'xeno' ? 'active' : ''}`} onClick={() => setShopTab('xeno')}>
                  <Zap size={11} /> XENO TECH
                </button>
                <button className={`star-btn ${shopTab === 'factory' ? 'active' : ''}`} onClick={() => setShopTab('factory')}>
                  <Factory size={11} /> FACTORIES
                </button>
                <button className={`star-btn ${shopTab === 'cargo' ? 'active' : ''}`} onClick={() => setShopTab('cargo')}>
                  <Package size={11} /> CARGO BAYS
                </button>
                <button className={`star-btn ${shopTab === 'engine' ? 'active' : ''}`} onClick={() => setShopTab('engine')}>
                  <Sliders size={11} /> ENGINE FORGE
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#6ee7b7' }}>{credits.toLocaleString()} CR</span>
                <button className="star-btn" onClick={() => setShopTab(null)} style={{ padding: '3px 8px' }}>
                  <X size={13} /> CLOSE
                </button>
              </div>
            </div>

            {/* TAB 1: AERODYNAMIC WINGS & NOSE PROW SHOP */}
            {shopTab === 'aero' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: '0.16em' }}>
                    AERODYNAMIC WING &amp; CANARD KITS (VISIBLE 3D PARTS!)
                  </div>
                  {aeroParts.map((p) => {
                    const equipped = aeroPart === p.id;
                    const owned = ownedParts.includes(`aero:${p.id}`);
                    return (
                      <div key={p.id} style={{ border: `1px solid ${equipped ? '#00e5ff' : 'var(--border-dim)'}`, background: 'rgba(4,12,24,0.8)', padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#fff' }}>{p.name}</span>
                          <span style={{ fontSize: 9.5, color: '#6ee7b7' }}>{p.perk}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{p.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <button
                            className={`star-btn ${equipped ? 'success' : 'active'}`}
                            disabled={equipped || (!owned && credits < p.cost)}
                            onClick={() => buyOrEquipEarthPart('aero', p.id)}
                          >
                            {equipped ? 'EQUIPPED ✓' : owned ? 'EQUIP' : `BUY & INSTALL (${p.cost.toLocaleString()} CR)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 10, color: '#f59e0b', letterSpacing: '0.16em' }}>
                    NOSE CONE &amp; ARMORED PROW FAIRINGS
                  </div>
                  {noseParts.map((p) => {
                    const equipped = nosePart === p.id;
                    const owned = ownedParts.includes(`nose:${p.id}`);
                    return (
                      <div key={p.id} style={{ border: `1px solid ${equipped ? '#f59e0b' : 'var(--border-dim)'}`, background: 'rgba(4,12,24,0.8)', padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#fff' }}>{p.name}</span>
                          <span style={{ fontSize: 9.5, color: '#fcd34d' }}>{p.perk}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{p.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <button
                            className={`star-btn ${equipped ? 'success' : 'active'}`}
                            disabled={equipped || (!owned && credits < p.cost)}
                            onClick={() => buyOrEquipEarthPart('nose', p.id)}
                          >
                            {equipped ? 'EQUIPPED ✓' : owned ? 'EQUIP' : `BUY & INSTALL (${p.cost.toLocaleString()} CR)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: ROOF SUPERSTRUCTURES & PLASMA UNDERGLOW SHOP */}
            {shopTab === 'roof' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16, padding: 16, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 10, color: '#c084fc', letterSpacing: '0.16em' }}>
                    DORSAL ROOF &amp; SUPERSTRUCTURE MODULES (VISIBLE ON YOUR 3D SHIP!)
                  </div>
                  {roofParts.map((p) => {
                    const equipped = roofPart === p.id;
                    const owned = ownedParts.includes(`roof:${p.id}`);
                    return (
                      <div key={p.id} style={{ border: `1px solid ${equipped ? '#a855f7' : 'var(--border-dim)'}`, background: 'rgba(12,8,24,0.8)', padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#fff' }}>{p.name}</span>
                          <span style={{ fontSize: 9.5, color: '#d8b4fe' }}>{p.perk}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{p.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <button
                            className={`star-btn ${equipped ? 'success' : 'active'}`}
                            disabled={equipped || (!owned && credits < p.cost)}
                            onClick={() => buyOrEquipEarthPart('roof', p.id)}
                          >
                            {equipped ? 'EQUIPPED ✓' : owned ? 'EQUIP' : `BUY & INSTALL (${p.cost.toLocaleString()} CR)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4,10,22,0.8)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: '0.16em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Palette size={12} /> HULL PLASMA UNDERGLOW KIT
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {UNDERGLOW_OPTIONS.map((opt) => {
                      const active = underglowColor === opt.color;
                      return (
                        <button
                          key={opt.name}
                          className={`star-btn ${active ? 'active' : ''}`}
                          style={{ justifyContent: 'space-between', padding: '8px 10px' }}
                          disabled={active || credits < opt.cost}
                          onClick={() => setUnderglowColor(opt.color, opt.cost)}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: opt.color || '#334155',
                                boxShadow: opt.color ? `0 0 8px ${opt.color}` : 'none',
                              }}
                            />
                            {opt.name}
                          </span>
                          <span style={{ fontSize: 8.5, color: 'var(--amber)' }}>
                            {active ? 'ON' : opt.cost === 0 ? 'FREE' : `${opt.cost}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: HYPER-THRUST & NITRO TURBO LAB */}
            {shopTab === 'turbo' && (
              <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 10, color: '#f9a8d4', letterSpacing: '0.16em' }}>
                  AUXILIARY HYPER-THRUST BOOSTER PODS (BOLTS LIVE ONTO YOUR 3D SHIP FOR EXTREME SPEED!)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {boosterParts.map((p) => {
                    const equipped = boosterPart === p.id;
                    const owned = ownedParts.includes(`booster:${p.id}`);
                    return (
                      <div key={p.id} style={{ border: `1px solid ${equipped ? '#ec4899' : 'var(--border-dim)'}`, background: 'rgba(26,6,20,0.8)', padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#fff' }}>{p.name}</span>
                          <span style={{ fontSize: 9.5, color: '#f9a8d4' }}>{p.perk}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{p.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                          <button
                            className={`star-btn ${equipped ? 'success' : 'active'}`}
                            disabled={equipped || (!owned && credits < p.cost)}
                            onClick={() => buyOrEquipEarthPart('booster', p.id)}
                          >
                            {equipped ? 'EQUIPPED ✓' : owned ? 'EQUIP' : `BUY & BOLT ON (${p.cost.toLocaleString()} CR)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: XENO BLACK-MARKET TECH & BULK SUPPLY DEPOT */}
            {shopTab === 'xeno' && (
              <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 10, color: '#6ee7b7', letterSpacing: '0.16em' }}>
                  EXOTIC XENO-TECH SPEED &amp; CHASSIS MODIFICATIONS (PERMANENT STACKING PERKS!)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {XENO_BLACK_MARKET_MODS.map((m) => {
                    const owned = xenoMods.includes(m.id);
                    return (
                      <div key={m.id} style={{ border: `1px solid ${owned ? '#10b981' : 'var(--border-dim)'}`, background: 'rgba(4,20,16,0.82)', padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#6ee7b7' }}>{m.name}</div>
                        <div style={{ fontSize: 9.5, color: '#fcd34d' }}>{m.perk}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{m.description}</div>
                        <button
                          className={`star-btn ${owned ? 'success' : 'active'}`}
                          style={{ marginTop: 'auto' }}
                          disabled={owned || credits < m.cost}
                          onClick={() => buyXenoMod(m.id)}
                        >
                          {owned ? 'INSTALLED ✓' : `INSTALL (${m.cost.toLocaleString()} CR)`}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div style={{ border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(20, 12, 4, 0.72)', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#fbbf24' }}>
                      FLEET COMMANDER BULK SUPPLY CRATE
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>
                      Instant +10 Deuterium Cores, +10 Cryo-Coolant Canisters, +10 Overdrive Boost Cells &amp; +10 Homing Torpedoes!
                    </div>
                  </div>
                  <button className="star-btn warning" disabled={credits < 8500} onClick={buyBulkSupplies}>
                    BUY CRATE (8,500 CR)
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: PLANETARY FACTORIES, WORKERS & MECHANICAL ROBOTIC ARMS */}
            {shopTab === 'factory' && (
              <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#fbbf24', letterSpacing: '0.16em' }}>
                    AUTOMATED PLANETARY FACTORIES (PRODUCE RESOURCES PASSIVELY EVEN WHILE IN SPACE!)
                  </span>
                  <button
                    className={`star-btn ${roboticArmOverdrive ? 'success' : 'warning'}`}
                    onClick={toggleRoboticArmOverdrive}
                  >
                    ⚙ ROBOTIC ARMS: {roboticArmOverdrive ? '2X OVERDRIVE ON' : 'STANDARD SPEED'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {factories.map((f) => {
                    const nextCost = Math.round(f.buildCost * (f.level + 1));
                    const readyQty = Math.floor(f.storedUnits);
                    const maxWorkers = f.level * 3;
                    return (
                      <div
                        key={f.id}
                        style={{
                          border: `1px solid ${f.level > 0 ? f.accentColor : 'var(--border-dim)'}`,
                          background: 'rgba(10, 14, 24, 0.85)',
                          padding: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: f.accentColor }}>{f.name}</span>
                          <span style={{ fontSize: 9.5, color: '#fff' }}>LV {f.level} / 5</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>OUTPUT: {f.productLabel}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#bae6fd' }}>
                          <span>WORKERS: {f.workers} / {maxWorkers}</span>
                          <span>READY TO COLLECT: <strong style={{ color: '#6ee7b7' }}>{readyQty}</strong></span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <button
                            className="star-btn active"
                            style={{ flex: 1 }}
                            disabled={f.level >= 5 || credits < nextCost}
                            onClick={() => upgradeFactory(f.id)}
                          >
                            {f.level === 0 ? `BUILD (${nextCost.toLocaleString()} CR)` : f.level >= 5 ? 'MAX LV' : `UPGRADE (${nextCost.toLocaleString()} CR)`}
                          </button>
                          <button
                            className="star-btn"
                            disabled={f.level === 0 || f.workers >= maxWorkers || credits < 1500}
                            onClick={() => hireFactoryWorker(f.id)}
                          >
                            <Users size={11} /> +WORKER (1.5k)
                          </button>
                          <button
                            className="star-btn success"
                            disabled={readyQty < 1}
                            onClick={() => collectFactoryOutput(f.id)}
                          >
                            COLLECT ({readyQty})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 7: CARGO BAY EXPANSION & FREIGHT DEPOT */}
            {shopTab === 'cargo' && (
              <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ border: '1px solid rgba(52, 211, 153, 0.35)', background: 'rgba(4, 20, 18, 0.8)', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#6ee7b7' }}>
                      SHIP CARGO BAY CAPACITY: TIER {cargoBayLevel} / 4
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Expanding Cargo Bays increases planetary factory storage cap ({cargoBayLevel * 20} units/plant) and unlocks heavy freight compartments inside your ship!
                    </div>
                  </div>
                  <button
                    className="star-btn active"
                    disabled={cargoBayLevel >= 4 || credits < 5000 * cargoBayLevel}
                    onClick={upgradeCargoBays}
                  >
                    {cargoBayLevel >= 4 ? 'MAX TIER ✓' : `EXPAND BAYS (${(5000 * cargoBayLevel).toLocaleString()} CR)`}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, textAlign: 'center', fontSize: 10 }}>
                  {Object.entries(cargo).map(([k, v]) => (
                    <div key={k} style={{ border: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.4)', padding: 10 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 8.5, textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff', marginTop: 4 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TERRAN ENGINE FORGE & PRECISION TUNING */}
            {shopTab === 'engine' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, padding: 16, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>
                    REPLACE MAIN ENGINE ASSEMBLY (CHANGES THRUST, HEAT &amp; PLASMA COLOR!)
                  </div>
                  {ENGINE_MODELS.map((eng) => {
                    const installed = installedEngineId === eng.id;
                    const owned = ownedEngines.includes(eng.id);
                    return (
                      <div
                        key={eng.id}
                        style={{
                          border: `1px solid ${installed ? eng.flameColor : 'var(--border-dim)'}`,
                          background: installed ? 'rgba(0, 229, 255, 0.1)' : 'rgba(4, 10, 22, 0.78)',
                          padding: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11.5, color: eng.flameColor }}>
                            {eng.name}
                          </span>
                          <span style={{ fontSize: 9.5, color: installed ? '#6ee7b7' : 'var(--amber)' }}>
                            {installed ? 'INSTALLED ✓' : owned ? 'OWNED' : `${eng.cost.toLocaleString()} CR`}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{eng.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <span style={{ fontSize: 9, color: '#bae6fd' }}>
                            SPD ×{eng.speedMult.toFixed(2)} • FUEL ×{eng.fuelMult.toFixed(2)} • HEAT ×{eng.heatMult.toFixed(2)}
                          </span>
                          <button
                            className={`star-btn ${installed ? 'success' : 'active'}`}
                            style={{ padding: '4px 10px', fontSize: 9.5 }}
                            disabled={installed || (!owned && credits < eng.cost)}
                            onClick={() => installEngineModel(eng.id)}
                          >
                            {installed ? 'ACTIVE' : owned ? 'EQUIP ENGINE' : `BUY & INSTALL (${eng.cost} CR)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4, 10, 22, 0.78)', padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>
                    PRECISION HARDWARE CONFIGURATION
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 5 }}>
                      <span>NOZZLE BIAS (AGILITY ↔ TOP SPEED)</span>
                      <strong style={{ color: 'var(--cyan)' }}>{engineConfig.thrustBias}%</strong>
                    </div>
                    <input
                      type="range"
                      className="star-slider"
                      min={0}
                      max={100}
                      value={engineConfig.thrustBias}
                      onChange={(e) => setEngineConfig({ thrustBias: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 5 }}>
                      <span>FUEL MIXTURE (ECO ↔ OVERDRIVE)</span>
                      <strong style={{ color: '#fbbf24' }}>{engineConfig.fuelMix}%</strong>
                    </div>
                    <input
                      type="range"
                      className="star-slider"
                      min={0}
                      max={100}
                      value={engineConfig.fuelMix}
                      onChange={(e) => setEngineConfig({ fuelMix: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 5 }}>
                      <span>COOLANT LOOP PRESSURE (CONSERVE ↔ HIGH-FLOW)</span>
                      <strong style={{ color: '#22d3ee' }}>{engineConfig.coolantFlow}%</strong>
                    </div>
                    <input
                      type="range"
                      className="star-slider"
                      min={0}
                      max={100}
                      value={engineConfig.coolantFlow}
                      onChange={(e) => setEngineConfig({ coolantFlow: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 5 }}>
                      <span>SENSOR ARRAY GAIN (STANDARD ↔ DEEP-LOCK)</span>
                      <strong style={{ color: '#c084fc' }}>{engineConfig.sensorGain}%</strong>
                    </div>
                    <input
                      type="range"
                      className="star-slider"
                      min={0}
                      max={100}
                      value={engineConfig.sensorGain}
                      onChange={(e) => setEngineConfig({ sensorGain: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
