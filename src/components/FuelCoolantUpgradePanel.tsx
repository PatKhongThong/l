import React from 'react';
import { Flame, Fuel, Lock, Rocket, Snowflake, Sparkles, X } from 'lucide-react';
import { getUpgradeCost, ShipUpgrades, useShipStore } from '../store/useShipStore';

const UPGRADE_LIST: Array<{
  key: keyof ShipUpgrades;
  name: string;
  desc: string;
  perLevel: string;
  color: string;
}> = [
  { key: 'engines', name: 'PLASMA THRUSTER OVERDRIVE', desc: 'High-impulse magnetic nozzles for higher cruise speed & acceleration.', perLevel: '+18% SPEED', color: '#00e5ff' },
  { key: 'boost', name: 'AFTERBURNER CAPACITOR', desc: 'Supercharges Shift boost thrust while cutting boost thermal buildup.', perLevel: '+25% BOOST', color: '#f59e0b' },
  { key: 'fuelEfficiency', name: 'QUANTUM FUEL INJECTORS', desc: 'Optimizes deuterium burn efficiency during sub-light thrust.', perLevel: '-14% FUEL BURN', color: '#34d399' },
  { key: 'cooling', name: 'CRYO-THERMAL RADIATORS', desc: 'Increases passive heat dissipation and raises safe core temperature.', perLevel: '+22% COOLING', color: '#22d3ee' },
  { key: 'shields', name: 'DEFLECTOR SHIELD MATRIX', desc: 'Accelerates deflector recharge rate and boosts impact absorption.', perLevel: '+22% SHIELDS', color: '#3b82f6' },
  { key: 'hullArmor', name: 'TITANIUM COMPOSITE ARMOR', desc: 'Reinforces hull plating to mitigate asteroid & hazard damage.', perLevel: '-15% HULL DMG', color: '#94a3b8' },
  { key: 'sensors', name: 'PHASED-ARRAY SCANNERS', desc: 'Extends Deep Scan lock radius across planets and anomalies.', perLevel: '+80m RANGE', color: '#a855f7' },
  { key: 'warpCoils', name: 'ZERO-POINT WARP COILS', desc: 'Reduces interstellar Quantum Jump fuel cost & speeds transit.', perLevel: '-15% JUMP FUEL', color: '#818cf8' },
];

export const FuelCoolantUpgradePanel: React.FC = () => {
  const {
    activeView,
    credits,
    fuel,
    temperature,
    coolantReserve,
    coolantCooldown,
    deuteriumCores,
    coolantCanisters,
    boostCells,
    cargo,
    dockedStationId,
    landedPlanetId,
    components,
    engineHealth,
    hull,
    upgrades,
    loadDeuteriumCore,
    refineCargoToCore,
    loadCoolantCanister,
    triggerCoolantFlush,
    buySupply,
    purchaseUpgrade,
    replaceModuleOnEarth,
    setActiveView,
  } = useShipStore();

  const isFuel = activeView === 'fuel';
  const isCoolant = activeView === 'coolant';
  const onEarth = landedPlanetId === 'earth';
  const canBuySupplies = Boolean(dockedStationId) || onEarth;

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
      <div className="star-panel" style={{ width: 'min(960px, 96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="star-panel-header" style={{ padding: '10px 14px', fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isFuel ? (
              <>
                <Fuel size={14} /> DEUTERIUM FUEL BAY // CORE INTAKE &amp; REFINERY
              </>
            ) : isCoolant ? (
              <>
                <Snowflake size={14} /> CRYO-COOLANT BAY // THERMAL CHILLER MANIFOLD
              </>
            ) : (
              <>
                <Sparkles size={14} /> UPGRADE &amp; BOOST BAY // EARTH SHIPYARD GANTRY
              </>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 10, color: onEarth ? '#6ee7b7' : canBuySupplies ? 'var(--cyan)' : 'var(--amber)' }}>
              {onEarth
                ? '● LANDED ON EARTH (FULL SHIPYARD)'
                : canBuySupplies
                  ? '● STATION DOCKED (SUPPLIES ONLY)'
                  : '○ DEEP SPACE (LAND ON EARTH TO UPGRADE)'}
            </span>
            <span style={{ color: 'var(--green)', fontSize: 11 }}>{credits.toLocaleString()} CR</span>
            <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
              <X size={13} /> CLOSE
            </button>
          </div>
        </div>

        {/* FUEL BAY VIEW */}
        {isFuel && (
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(20, 12, 4, 0.65)', padding: 16 }}>
              <div style={{ fontSize: 10, color: '#f59e0b', letterSpacing: '0.16em', marginBottom: 8 }}>
                DEUTERIUM FUEL TANK STATUS
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: '#fff', marginBottom: 8 }}>
                {Math.round(fuel)}%
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', marginBottom: 16 }}>
                <div
                  style={{
                    width: `${fuel}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #d97706, #fbbf24)',
                    boxShadow: '0 0 12px #f59e0b',
                  }}
                />
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>
                DEUTERIUM CORES IN RACK: <strong style={{ color: '#fbbf24', fontSize: 14 }}>{deuteriumCores}</strong>
              </div>

              <button
                className="star-btn active"
                style={{ width: '100%', padding: '12px 14px', fontSize: 11 }}
                disabled={deuteriumCores <= 0 || fuel >= 99.5}
                onClick={loadDeuteriumCore}
              >
                <Fuel size={14} /> LOAD DEUTERIUM CORE INTO INTAKE (+35% FUEL)
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4, 10, 22, 0.72)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>
                ONBOARD REFINERY &amp; STATION RESUPPLY
              </div>

              <div style={{ background: 'rgba(0,0,0,0.35)', padding: 10, border: '1px solid rgba(52,211,153,0.25)' }}>
                <div style={{ fontSize: 10, color: '#6ee7b7', marginBottom: 6 }}>
                  ONBOARD CORE SYNTHESIS (WORKS IN DEEP SPACE)
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Cargo Refined Deuterium: <strong style={{ color: '#fff' }}>{cargo.deuterium}</strong> (Mine asteroids with [M])
                </div>
                <button
                  className="star-btn success"
                  style={{ width: '100%' }}
                  disabled={cargo.deuterium < 2}
                  onClick={refineCargoToCore}
                >
                  REFINE 2x CARGO DEUTERIUM → +1 DEUTERIUM CORE
                </button>
              </div>

              <div style={{ fontSize: 9.5, color: canBuySupplies ? 'var(--green)' : 'var(--amber)' }}>
                {canBuySupplies
                  ? 'LOGISTICS CONNECTED — PURCHASES ENABLED'
                  : 'LOCKED IN DEEP SPACE — DOCK AT A STATION OR LAND ON EARTH'}
              </div>
              <button
                className="star-btn warning"
                onClick={() => buySupply('deuteriumCores', 350)}
                disabled={!canBuySupplies || credits < 350}
              >
                {!canBuySupplies && <Lock size={11} />} +1 DEUTERIUM CORE (350 CR)
              </button>
              <button
                className="star-btn"
                onClick={() => buySupply('boostCells', 450)}
                disabled={!canBuySupplies || credits < 450}
              >
                {!canBuySupplies ? <Lock size={11} /> : <Rocket size={12} />} +1 OVERDRIVE BOOST CELL (450 CR) — OWNED: {boostCells}
              </button>
            </div>
          </div>
        )}

        {/* COOLANT BAY VIEW */}
        {isCoolant && (
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ border: '1px solid rgba(34, 211, 238, 0.35)', background: 'rgba(4, 18, 28, 0.72)', padding: 16 }}>
              <div style={{ fontSize: 10, color: '#22d3ee', letterSpacing: '0.16em', marginBottom: 8 }}>
                CRYO-COOLANT RESERVOIR &amp; CORE THERMAL STATE
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>CRYO TANK</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: coolantReserve < 25 ? 'var(--red)' : '#22d3ee' }}>
                    {Math.round(coolantReserve)}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>CORE TEMP</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: temperature > 800 ? 'var(--red)' : '#fff' }}>
                    {Math.round(temperature)} K
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>
                CRYO-COOLANT CANISTERS IN RACK: <strong style={{ color: '#22d3ee', fontSize: 14 }}>{coolantCanisters}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="star-btn active"
                  style={{ width: '100%', padding: '11px 14px', fontSize: 11 }}
                  disabled={coolantCanisters <= 0}
                  onClick={loadCoolantCanister}
                >
                  <Snowflake size={14} /> LOAD COOLANT CANISTER (+45% TANK &amp; -140K)
                </button>
                <button className="star-btn" onClick={triggerCoolantFlush} disabled={coolantReserve < 30 || coolantCooldown > 0}>
                  <Flame size={13} />{' '}
                  {coolantCooldown > 0
                    ? `MANIFOLD REPRESSURIZING (${Math.ceil(coolantCooldown)}s)`
                    : 'VENT COOLANT MANIFOLD (-160K / -30% TANK)'}
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-dim)', background: 'rgba(4, 10, 22, 0.72)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em' }}>
                THERMAL LOOP BALANCE &amp; RESTOCK
              </div>
              <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Active cryo-cooling slowly consumes tank reserve whenever the reactor exceeds 520K. If the tank runs
                dry (0%), passive cooling efficiency drops by 55%.
              </p>
              <div style={{ fontSize: 9.5, color: canBuySupplies ? 'var(--green)' : 'var(--amber)' }}>
                {canBuySupplies
                  ? 'CRYO-LINE CONNECTED — RESTOCK ENABLED'
                  : 'DOCK AT A STATION OR LAND ON EARTH TO PURCHASE COOLANT CANISTERS'}
              </div>
              <button
                className="star-btn active"
                onClick={() => buySupply('coolantCanisters', 300)}
                disabled={!canBuySupplies || credits < 300}
              >
                {!canBuySupplies && <Lock size={11} />} +1 CRYO-COOLANT CANISTER (300 CR)
              </button>
            </div>
          </div>
        )}

        {/* UPGRADE & EARTH MODULE REPLACEMENT BAY */}
        {!isFuel && !isCoolant && (
          <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!onEarth && (
              <div
                style={{
                  border: '1px solid var(--amber)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '8px 12px',
                  fontSize: 10.5,
                  color: '#fcd34d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Lock size={13} /> EARTH SHIPYARD REQUIRED: Fly to EARTH in Solaris Prime and press [L] to Land in order to replace or upgrade Engines, Sensors, Coolant, and Ship Hardware.
              </div>
            )}

            {/* EARTH-ONLY FACTORY MODULE REPLACEMENT */}
            <div style={{ border: '1px solid rgba(0, 229, 255, 0.25)', background: 'rgba(4, 12, 24, 0.8)', padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.16em', marginBottom: 8 }}>
                EARTH SHIPYARD // FACTORY MODULE REPLACEMENT (RESTORES 100%)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { id: 'engines' as const, label: 'MAIN ENGINES', val: Math.min(engineHealth, components.engines), cost: 600 },
                  { id: 'sensors' as const, label: 'SENSOR ARRAY', val: components.sensors, cost: 450 },
                  { id: 'cooling' as const, label: 'COOLANT LOOP', val: coolantReserve, cost: 400 },
                  { id: 'reactor' as const, label: 'FUSION REACTOR', val: components.reactor, cost: 750 },
                  { id: 'comms' as const, label: 'SUBSPACE COMMS', val: components.comms, cost: 380 },
                  { id: 'hull' as const, label: 'HULL PLATING', val: hull, cost: 650 },
                ].map((mod) => (
                  <div
                    key={mod.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      background: 'rgba(0,0,0,0.38)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 9.5, color: '#fff', fontWeight: 700 }}>{mod.label}</div>
                      <div style={{ fontSize: 8.5, color: mod.val < 85 ? 'var(--amber)' : '#6ee7b7' }}>
                        COND: {Math.round(mod.val)}%
                      </div>
                    </div>
                    <button
                      className="star-btn active"
                      style={{ padding: '3px 7px', fontSize: 8.5 }}
                      disabled={!onEarth || credits < mod.cost || mod.val >= 99.5}
                      onClick={() => replaceModuleOnEarth(mod.id, mod.cost)}
                    >
                      {mod.val >= 99.5 ? 'OK' : !onEarth ? 'EARTH' : `${mod.cost} CR`}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Consumable Cores & Boost Cells Row */}
            <div
              style={{
                border: '1px solid rgba(52, 211, 153, 0.35)',
                background: 'rgba(4, 16, 22, 0.75)',
                padding: 12,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>DEUTERIUM CORE</div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>OWNED: {deuteriumCores} • +35% FUEL</div>
                </div>
                <button className="star-btn warning" disabled={!canBuySupplies || credits < 350} onClick={() => buySupply('deuteriumCores', 350)}>
                  350 CR
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#22d3ee', fontWeight: 700 }}>COOLANT CANISTER</div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>OWNED: {coolantCanisters} • +45% TANK</div>
                </div>
                <button className="star-btn active" disabled={!canBuySupplies || credits < 300} onClick={() => buySupply('coolantCanisters', 300)}>
                  300 CR
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>OVERDRIVE BOOST CELL</div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>OWNED: {boostCells} • +60% 10s</div>
                </div>
                <button className="star-btn success" disabled={!canBuySupplies || credits < 450} onClick={() => buySupply('boostCells', 450)}>
                  450 CR
                </button>
              </div>
            </div>

            {/* 8 Permanent CR Ship Upgrades (EARTH ONLY) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {UPGRADE_LIST.map((u) => {
                const lv = upgrades[u.key];
                const maxed = lv >= 5;
                const cost = getUpgradeCost(lv);
                return (
                  <div
                    key={u.key}
                    style={{
                      border: `1px solid ${maxed ? '#10b981' : 'var(--border-dim)'}`,
                      background: 'rgba(5, 12, 24, 0.78)',
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 7,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: u.color }}>{u.name}</span>
                      <span style={{ fontSize: 9.5, color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '1px 6px' }}>
                        MK-{lv} / 5
                      </span>
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{u.desc}</div>
                    <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                      {[1, 2, 3, 4, 5].map((pip) => (
                        <div
                          key={pip}
                          style={{
                            flex: 1,
                            height: 4,
                            background: pip <= lv ? u.color : 'rgba(255,255,255,0.1)',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 9, color: '#6ee7b7' }}>{u.perLevel}</span>
                      <button
                        className={`star-btn ${maxed ? 'success' : 'active'}`}
                        style={{ padding: '4px 10px', fontSize: 9.5 }}
                        disabled={!onEarth || maxed || credits < cost}
                        onClick={() => purchaseUpgrade(u.key)}
                      >
                        {maxed ? 'MAXED ✓' : !onEarth ? 'EARTH ONLY' : `UPGRADE (${cost.toLocaleString()} CR)`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
