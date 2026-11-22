import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getNpcPosition, getStarSystem } from '../data/starSystems';
import { useShipStore } from '../store/useShipStore';

export const RadarScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarRange = useShipStore((s) => s.radarRange);
  const cycleRadarRange = useShipStore((s) => s.cycleRadarRange);
  const currentSystemId = useShipStore((s) => s.currentSystemId);
  const selectedTargetId = useShipStore((s) => s.selectedTargetId);
  const selectTarget = useShipStore((s) => s.selectTarget);

  useEffect(() => {
    let raf = 0;
    const invQuat = new THREE.Quaternion();
    const rel = new THREE.Vector3();

    const draw = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = useShipStore.getState();
      const system = getStarSystem(s.currentSystemId);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) - 10;

      ctx.clearRect(0, 0, w, h);

      // Background radial glow
      const bg = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
      bg.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
      bg.addColorStop(0.7, 'rgba(4, 15, 32, 0.85)');
      bg.addColorStop(1, 'rgba(2, 6, 14, 0.96)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Concentric range rings
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.lineWidth = 1;
      [0.33, 0.66, 1].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Forward FOV cone
      ctx.fillStyle = 'rgba(0, 229, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, -Math.PI * 0.72, -Math.PI * 0.28);
      ctx.closePath();
      ctx.fill();

      // Animated sweep beam
      const sweepAngle = ((now * 0.0018) % (Math.PI * 2)) - Math.PI / 2;
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
      ctx.stroke();

      // Transform world contacts into ship-local coordinates
      invQuat.set(s.quaternion[0], s.quaternion[1], s.quaternion[2], s.quaternion[3]).invert();
      const range = s.radarRange;

      const projectPoint = (worldPos: [number, number, number]) => {
        rel.set(
          worldPos[0] - s.position[0],
          worldPos[1] - s.position[1],
          worldPos[2] - s.position[2]
        );
        rel.applyQuaternion(invQuat);
        // Forward is -Z, Right is +X, Up is +Y
        const nx = rel.x / range;
        const ny = rel.z / range; // -Z is up on radar
        const mag = Math.hypot(nx, ny);
        const clamped = mag > 0.94 ? 0.94 / mag : 1;
        return {
          px: cx + nx * clamped * radius,
          py: cy + ny * clamped * radius,
          elev: rel.y / range,
          inRange: mag <= 1.05,
        };
      };

      // Draw Asteroids
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      for (const ast of system.asteroids) {
        const pt = projectPoint(ast.position);
        if (!pt.inRange) continue;
        ctx.fillRect(pt.px - 1.2, pt.py - 1.2, 2.4, 2.4);
      }

      // Draw NPC Spacecraft
      for (const npc of system.npcs) {
        const pos = getNpcPosition(npc, s.simTime);
        const pt = projectPoint(pos);
        if (!pt.inRange) continue;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(pt.px, pt.py - 4);
        ctx.lineTo(pt.px + 3.5, pt.py + 3);
        ctx.lineTo(pt.px - 3.5, pt.py + 3);
        ctx.closePath();
        ctx.fill();
      }

      // Draw Planets, Stations, Anomalies
      for (const obj of system.objects) {
        if (obj.type === 'star') continue;
        const pt = projectPoint(obj.position);
        const isSel = obj.id === s.selectedTargetId;

        // Elevation stem line
        const elevPx = Math.max(-10, Math.min(10, pt.elev * 22));
        if (Math.abs(elevPx) > 1.5) {
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pt.px, pt.py);
          ctx.lineTo(pt.px, pt.py - elevPx);
          ctx.stroke();
        }

        const drawY = pt.py - elevPx;

        if (obj.type === 'planet') {
          ctx.strokeStyle = obj.atmosphereColor || '#60a5fa';
          ctx.fillStyle = 'rgba(59, 130, 246, 0.32)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pt.px, drawY, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (obj.type === 'station') {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(pt.px - 3.5, drawY - 3.5, 7, 7);
        } else if (obj.type === 'anomaly') {
          const pulse = 0.6 + 0.4 * Math.sin(now * 0.008);
          ctx.fillStyle = `rgba(245, 158, 11, ${pulse})`;
          ctx.beginPath();
          ctx.moveTo(pt.px, drawY - 5);
          ctx.lineTo(pt.px + 5, drawY);
          ctx.lineTo(pt.px, drawY + 5);
          ctx.lineTo(pt.px - 5, drawY);
          ctx.closePath();
          ctx.fill();
        }

        if (isSel) {
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(pt.px - 8, drawY - 8, 16, 16);
        }
      }

      // Hostile Raider Drones (Red Triangles)
      for (const r of s.raiders) {
        if (r.systemId !== s.currentSystemId || r.hp <= 0) continue;
        const angle = r.phase + s.simTime * r.orbitSpeed;
        const rPos: [number, number, number] = [
          r.orbitCenter[0] + Math.cos(angle) * r.orbitRadius,
          r.orbitCenter[1] + Math.sin(angle * 1.4) * 18,
          r.orbitCenter[2] + Math.sin(angle) * r.orbitRadius,
        ];
        const pt = projectPoint(rPos);
        if (!pt.inRange) continue;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(pt.px, pt.py - 5);
        ctx.lineTo(pt.px + 4.5, pt.py + 4);
        ctx.lineTo(pt.px - 4.5, pt.py + 4);
        ctx.closePath();
        ctx.fill();
      }

      // Remote Multiplayer Fleet Pilots (Emerald Diamonds)
      for (const p of Object.values(s.remotePlayers)) {
        if (p.systemId !== s.currentSystemId) continue;
        const pt = projectPoint(p.position);
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.moveTo(pt.px, pt.py - 5);
        ctx.lineTo(pt.px + 5, pt.py);
        ctx.lineTo(pt.px, pt.py + 5);
        ctx.lineTo(pt.px - 5, pt.py);
        ctx.closePath();
        ctx.fill();
      }

      // Player Ship Center Triangle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx + 4, cy + 4);
      ctx.lineTo(cx - 4, cy + 4);
      ctx.closePath();
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const system = getStarSystem(currentSystemId);
  const trackables = system.objects.filter((o) => o.type !== 'star');

  return (
    <div className="star-panel" style={{ width: 248, display: 'flex', flexDirection: 'column' }}>
      <div className="star-panel-header">
        <span>TACTICAL RADAR</span>
        <button
          onClick={cycleRadarRange}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,229,255,0.35)',
            color: 'var(--cyan)',
            fontSize: 9,
            padding: '1px 5px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
          title="Click to cycle radar range"
        >
          {radarRange}m
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 8px 4px' }}>
        <canvas ref={canvasRef} width={174} height={174} style={{ display: 'block' }} />
      </div>

      {/* Contact Quick-Lock List */}
      <div
        style={{
          borderTop: '1px solid var(--border-dim)',
          padding: '5px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxHeight: 82,
          overflowY: 'auto',
        }}
      >
        {trackables.map((obj) => {
          const active = obj.id === selectedTargetId;
          const dotColor =
            obj.type === 'station' ? '#10b981' : obj.type === 'anomaly' ? '#f59e0b' : '#38bdf8';
          return (
            <button
              key={obj.id}
              onClick={() => selectTarget(obj.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: active ? 'rgba(0, 229, 255, 0.16)' : 'transparent',
                border: active ? '1px solid rgba(0, 229, 255, 0.45)' : '1px solid transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize: 9.5,
                padding: '2px 5px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ width: 6, height: 6, background: dotColor, display: 'inline-block', flexShrink: 0 }} />
                {obj.name}
              </span>
              <span style={{ fontSize: 8.5, color: 'var(--text-muted)' }}>
                {obj.type === 'anomaly' ? 'SIG' : obj.type === 'station' ? 'STN' : 'PLN'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

