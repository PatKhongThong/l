import React from 'react';
import { Flame, Shield, Wind, Cpu, Wrench, Zap, Radio, X, BatteryCharging } from 'lucide-react';
import { PowerAllocation, useShipStore } from '../store/useShipStore';

export const EngineeringPanel: React.FC = () => {
  const {
    reactorThrottle,
    reactorOutput,
    backupGeneratorOnline,
    backupBattery,
    power,
    enginesOnline,
    shieldsOnline,
    lifeSupportOnline,
    internalGravityOnline,
    commsOnline,
    navComputerOnline,
    waterRecyclingOnline,
    airFiltrationOnline,
    temperature,
    hull,
    engineHealth,
    fuel,
    coolantCooldown,
    repairActive,
    setReactorThrottle,
    setPowerAllocation,
    applyPowerPreset,
    toggleSystem,
    triggerCoolantFlush,
    toggleRepair,
    emergencyRefuelScoop,
    setActiveView,
  } = useShipStore();

  const totalAllocated = power.engines + power.shields + power.lifeSupport + power.sensors;
  const reactorFactor = reactorThrottle / 100 + (backupGeneratorOnline ? 0.25 : 0);
  const maxSpeedEst = enginesOnline
    ? Math.round(92 * (0.35 + (power.engines / 100) * 1.45) * reactorFactor * (0.3 + (engineHealth / 100) * 0.7))
    : 0;
  const shieldRegenEst = shieldsOnline ? ((power.shields / 100) * reactorFactor * 4.8).toFixed(1) : '0.0';
  const o2RateEst =
    lifeSupportOnline && (power.lifeSupport / 100) * reactorFactor >= 0.16
      ? `+${(((power.lifeSupport / 100) * reactorFactor - 0.12) * 3.8).toFixed(1)}%/s`
      : '-1.5%/s';
  const scanRangeEst = Math.round(200 + power.sensors * 2.5);

  const channels: Array<{ key: keyof PowerAllocation; label: string; icon: React.ReactNode; color: string; impact: string }> = [
    { key: 'engines', label: 'MAIN PROPULSION', icon: <Zap size={13} />, color: '#00e5ff', impact: `MAX ${maxSpeedEst} m/s` },
    { key: 'shields', label: 'DEFLECTOR MATRIX', icon: <Shield size={13} />, color: '#3b82f6', impact: `+${shieldRegenEst}%/s` },
    { key: 'lifeSupport', label: 'LIFE SUPPORT / O2', icon: <Wind size={13} />, color: '#10b981', impact: o2RateEst },
    { key: 'sensors', label: 'SENSOR & SCANNER', icon: <Radio size={13} />, color: '#a855f7', impact: `${scanRangeEst}m LOCK` },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(2, 6, 14, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div className="star-panel" style={{ width: 'min(940px, 96vw)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="star-panel-header" style={{ padding: '10px 14px', fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={14} /> ENGINEERING STATION // REACTOR, BACKUP CORE &amp; AUXILIARY BUS
          </span>
          <button className="star-btn" onClick={() => setActiveView('bridge')} style={{ padding: '3px 8px' }}>
            <X size={13} /> RETURN TO BRIDGE
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 16,
            padding: 16,
          }}
        >
          {/* Left Column: Reactor Core, Backup Generator & Breakers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ border: '1px solid var(--border-dim)', padding: 14, background: 'rgba(4, 10, 22, 0.65)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 11 }}>
                <span style={{ color: 'var(--cyan)', letterSpacing: '0.14em' }}>FUSION REACTOR THROTTLE</span>
                <span style={{ color: reactorThrottle > 95 ? 'var(--red)' : 'var(--cyan)', fontWeight: 700 }}>
                  {reactorThrottle}% {reactorThrottle > 95 ? '(OVERCLOCK)' : ''}
                </span>
              </div>

              <input
                type="range"
                className="star-slider"
                min={10}
                max={120}
                value={reactorThrottle}
                onChange={(e) => setReactorThrottle(Number(e.target.value))}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12, fontSize: 10 }}>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: 8, border: '1px solid rgba(0,229,255,0.12)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 8.5 }}>NET OUTPUT</div>
                  <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>{reactorOutput} MW</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: 8, border: '1px solid rgba(0,229,255,0.12)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 8.5 }}>CORE TEMP</div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: temperature > 850 ? 'var(--red)' : temperature > 620 ? 'var(--amber)' : 'var(--cyan)',
                    }}
                  >
                    {Math.round(temperature)} K
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: 8, border: '1px solid rgba(0,229,255,0.12)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 8.5 }}>BACKUP BATT</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: backupBattery < 25 ? 'var(--amber)' : '#6ee7b7' }}>
                    {Math.round(backupBattery)}%
                  </div>
                </div>
              </div>

              <button
                className={`star-btn ${backupGeneratorOnline ? 'success' : ''}`}
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => toggleSystem('backupGeneratorOnline')}
                disabled={backupBattery <= 1 && !backupGeneratorOnline}
              >
                <BatteryCharging size={13} />
                {backupGeneratorOnline
                  ? 'BACKUP GENERATOR ONLINE (+25% BUS BOOST)'
                  : 'ENGAGE EMERGENCY BACKUP GENERATOR'}
              </button>
            </div>

            {/* Subsystem Circuit Breakers */}
            <div style={{ border: '1px solid var(--border-dim)', padding: 14, background: 'rgba(4, 10, 22, 0.65)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--cyan)', letterSpacing: '0.14em', marginBottom: 10 }}>
                SHIP-WIDE SUBSYSTEM CIRCUIT BREAKERS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                <button className={`star-btn ${enginesOnline ? 'active' : 'danger'}`} onClick={() => toggleSystem('enginesOnline')}>
                  ENG: {enginesOnline ? 'ON' : 'OFF'}
                </button>
                <button className={`star-btn ${shieldsOnline ? 'active' : 'danger'}`} onClick={() => toggleSystem('shieldsOnline')}>
                  SHD: {shieldsOnline ? 'ON' : 'OFF'}
                </button>
                <button className={`star-btn ${lifeSupportOnline ? 'active' : 'danger'}`} onClick={() => toggleSystem('lifeSupportOnline')}>
                  O2: {lifeSupportOnline ? 'ON' : 'OFF'}
                </button>
                <button className={`star-btn ${internalGravityOnline ? 'active' : 'warning'}`} onClick={() => toggleSystem('internalGravityOnline')}>
                  GRAV: {internalGravityOnline ? '1G' : '0G'}
                </button>
                <button className={`star-btn ${navComputerOnline ? 'active' : 'danger'}`} onClick={() => toggleSystem('navComputerOnline')}>
                  NAV: {navComputerOnline ? 'ON' : 'OFF'}
                </button>
                <button className={`star-btn ${commsOnline ? 'active' : 'danger'}`} onClick={() => toggleSystem('commsOnline')}>
                  COMMS: {commsOnline ? 'ON' : 'OFF'}
                </button>
                <button className={`star-btn ${airFiltrationOnline ? 'active' : 'warning'}`} onClick={() => toggleSystem('airFiltrationOnline')}>
                  AIR: {airFiltrationOnline ? 'ON' : 'OFF'}
                </button>
                <button className={`star-btn ${waterRecyclingOnline ? 'active' : 'warning'}`} onClick={() => toggleSystem('waterRecyclingOnline')}>
                  H2O: {waterRecyclingOnline ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Maintenance & Emergency Controls */}
            <div style={{ border: '1px solid var(--border-dim)', padding: 14, background: 'rgba(4, 10, 22, 0.65)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--cyan)', letterSpacing: '0.14em', marginBottom: 10 }}>
                THERMAL &amp; FIELD MAINTENANCE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className={`star-btn ${temperature > 700 ? 'warning' : ''}`}
                  onClick={triggerCoolantFlush}
                  disabled={coolantCooldown > 0}
                >
                  <Flame size={13} />
                  {coolantCooldown > 0
                    ? `COOLANT RECHARGING (${Math.ceil(coolantCooldown)}s)`
                    : 'EXECUTE CRYOGENIC COOLANT FLUSH (-260K)'}
                </button>

                <button
                  className={`star-btn ${repairActive ? 'success' : ''}`}
                  onClick={toggleRepair}
                  disabled={hull >= 100 && engineHealth >= 100}
                >
                  <Wrench size={13} />
                  {repairActive
                    ? 'NANITE REPAIR ACTIVE (USING FUEL)...'
                    : `INITIATE NANITE REPAIR (HULL ${Math.round(hull)}% / ENG ${Math.round(engineHealth)}%)`}
                </button>

                {fuel < 25 && (
                  <button className="star-btn warning" onClick={emergencyRefuelScoop}>
                    <Zap size={13} /> EMERGENCY SOLAR RAMSCOOP (+25% FUEL / +120K HEAT)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Electrical Power Grid */}
          <div style={{ border: '1px solid var(--border-dim)', padding: 14, background: 'rgba(4, 10, 22, 0.65)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: '0.14em' }}>
                ELECTRICAL DISTRIBUTION BUS
              </span>
              <span style={{ fontSize: 11, color: totalAllocated === 100 ? 'var(--cyan)' : 'var(--amber)' }}>
                ALLOCATED: {totalAllocated}% / 100%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              <button className="star-btn" onClick={() => applyPowerPreset('balanced')}>BALANCED</button>
              <button className="star-btn" onClick={() => applyPowerPreset('thrust')}>THRUST</button>
              <button className="star-btn" onClick={() => applyPowerPreset('tactical')}>SHIELDS</button>
              <button className="star-btn" onClick={() => applyPowerPreset('stealth')}>SENSORS</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
              {channels.map((ch) => (
                <div key={ch.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}>
                      <span style={{ color: ch.color }}>{ch.icon}</span>
                      {ch.label}
                    </span>
                    <span style={{ display: 'flex', gap: 10 }}>
                      <span style={{ color: ch.color }}>{ch.impact}</span>
                      <span style={{ color: 'var(--text-secondary)', width: 34, textAlign: 'right' }}>
                        {power[ch.key]}%
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    className="star-slider"
                    min={0}
                    max={100}
                    value={power[ch.key]}
                    onChange={(e) => setPowerAllocation(ch.key, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: 10,
                background: 'rgba(0, 229, 255, 0.06)',
                border: '1px solid rgba(0, 229, 255, 0.18)',
                fontSize: 10,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              SYSTEM DEPENDENCIES: Backup Generator provides +25% auxiliary power during Power Bus failures until battery
              depletes. External component damage can be welded directly during an EVA Spacewalk.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
