import React, { useEffect, useState } from 'react';
import HoloMosaic from './HoloMosaic';
import { useShipStore } from '../store/useShipStore';

const BOOT_STEPS = [
  'QUANTUM CORE IGNITION [OK]',
  'INERTIAL DAMPENERS CALIBRATED [OK]',
  'ASTROGATION STAR CHART SYNCED [4 SECTORS]',
  'LIFE SUPPORT & ATMOSPHERIC SCRUBBERS [ONLINE]',
  'DEFLECTOR SHIELD MATRIX CHARGED [100%]',
  'NEURAL BRIDGE INTERFACE READY',
];

export const LoadingScreen: React.FC = () => {
  const finishBoot = useShipStore((s) => s.finishBoot);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 2600;
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(100, Math.round(((now - start) / duration) * 100));
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setReady(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const visibleSteps = Math.max(1, Math.ceil((progress / 100) * BOOT_STEPS.length));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#05080f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* React Bits HoloMosaic Interactive WebGL2 Backdrop */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <HoloMosaic
          color="#070c16"
          metalColor="#bae6fd"
          spectrum="cool"
          tileSize={1}
          gap={0.08}
          scatter={0.3}
          tilt={0.35}
          saturation={0.22}
          intensity={1.3}
          ripple={0.6}
          glitter={0.85}
          sheen={0.85}
          grain={0.08}
          speed={0.55}
          intro={true}
          mouseInteraction={true}
          flipOnClick={true}
        />
      </div>

      {/* Subtle vignette so center boot console pops sharply */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(3, 8, 18, 0.42) 0%, rgba(2, 5, 10, 0.85) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Boot Console Card */}
      <div
        className="star-panel"
        style={{
          position: 'relative',
          zIndex: 2,
          width: 'min(540px, 92vw)',
          padding: '28px 32px',
          background: 'rgba(4, 10, 20, 0.84)',
          borderColor: 'rgba(0, 229, 255, 0.35)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'var(--cyan)',
          }}
        >
          <span>STARSHIP OS // KERNEL v4.9.2</span>
          <span>SEC-01 SOLARIS</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 800,
            letterSpacing: '0.26em',
            color: '#fff',
            textShadow: '0 0 26px rgba(0, 229, 255, 0.55)',
            marginBottom: 6,
          }}
        >
          STARSHIP
        </h1>
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            letterSpacing: '0.14em',
            marginBottom: 22,
          }}
        >
          ORBITAL COMMAND &amp; DEEP SPACE FLIGHT SIMULATOR
        </p>

        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--cyan-soft)',
              marginBottom: 6,
              letterSpacing: '0.12em',
            }}
          >
            <span>{ready ? 'ALL SYSTEMS SYNCHRONIZED' : 'INITIALIZING BRIDGE TELEMETRY...'}</span>
            <span>{progress}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: 5,
              background: 'rgba(0, 229, 255, 0.14)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2563eb, #00e5ff)',
                boxShadow: '0 0 14px #00e5ff',
                transition: 'width 60ms linear',
              }}
            />
          </div>
        </div>

        {/* Boot log lines */}
        <div
          style={{
            background: 'rgba(2, 6, 14, 0.72)',
            border: '1px solid rgba(0, 229, 255, 0.14)',
            padding: '10px 12px',
            marginBottom: 22,
            minHeight: 116,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            fontSize: 10.5,
            color: 'var(--text-secondary)',
          }}
        >
          {BOOT_STEPS.slice(0, visibleSteps).map((step, idx) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: idx === visibleSteps - 1 && !ready ? 'var(--amber)' : 'var(--cyan)' }}>▸</span>
              <span style={{ color: idx === visibleSteps - 1 ? '#e2f1ff' : 'var(--text-secondary)' }}>{step}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            CLICK HOLO-TILES TO INTERACT
          </span>
          <button
            className={`star-btn ${ready ? 'active' : ''}`}
            onClick={finishBoot}
            disabled={!ready}
            style={{
              padding: '10px 22px',
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.18em',
            }}
          >
            {ready ? 'INITIALIZE BRIDGE ▸' : 'BOOTING...'}
          </button>
        </div>
      </div>
    </div>
  );
};

