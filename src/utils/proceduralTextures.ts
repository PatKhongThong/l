import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

export function getHullTexture(baseHex = '#1a2436', accentHex = '#00e5ff'): THREE.CanvasTexture {
  const key = `hull-${baseHex}-${accentHex}`;
  if (cache.has(key)) return cache.get(key)!;

  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Armored panel grid
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Subtle tonal panel variation + rivets
  for (let gx = 0; gx < 8; gx++) {
    for (let gy = 0; gy < 8; gy++) {
      const shade = ((gx * 7 + gy * 13) % 5) * 0.03;
      ctx.fillStyle = `rgba(255, 255, 255, ${shade})`;
      ctx.fillRect(gx * 64 + 3, gy * 64 + 3, 58, 58);

      // Corner rivets
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(gx * 64 + 6, gy * 64 + 6, 3, 3);
      ctx.fillRect(gx * 64 + 55, gy * 64 + 6, 3, 3);
      ctx.fillRect(gx * 64 + 6, gy * 64 + 55, 3, 3);
      ctx.fillRect(gx * 64 + 55, gy * 64 + 55, 3, 3);
    }
  }

  // Technical accent stripe
  ctx.fillStyle = accentHex;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(0, 248, 512, 8);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

export function getDeckTexture(): THREE.CanvasTexture {
  const key = 'deck-grate';
  if (cache.has(key)) return cache.get(key)!;

  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#0c1320';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#1b2940';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // Tread dots
  ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
  for (let x = 8; x < 256; x += 32) {
    for (let y = 8; y < 256; y += 32) {
      ctx.fillRect(x, y, 16, 4);
      ctx.fillRect(x, y + 10, 16, 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  cache.set(key, tex);
  return tex;
}

export function getPlanetTexture(
  id: string,
  primary: string,
  secondary = '#334155',
  style: 'oceanic' | 'cryogenic' | 'volcanic' | 'gas' | 'barren' = 'oceanic'
): THREE.CanvasTexture {
  const key = `planet-${id}-${style}`;
  if (cache.has(key)) return cache.get(key)!;

  const [canvas, ctx] = makeCanvas(512, 256);
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, 512, 256);

  // Deterministic pseudo-random based on id
  let seed = 1337;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  if (style === 'gas') {
    // Banded storm layers
    for (let y = 0; y < 256; y += 6) {
      const alpha = 0.12 + rand() * 0.35;
      ctx.fillStyle = y % 12 === 0 ? secondary : '#ffffff';
      ctx.globalAlpha = alpha;
      ctx.fillRect(0, y, 512, 3 + rand() * 8);
    }
    // Great storm oval
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.ellipse(290, 145, 42, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (style === 'volcanic') {
    // Dark basalt + glowing magma rifts
    for (let i = 0; i < 65; i++) {
      ctx.fillStyle = '#1c1917';
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(rand() * 512, rand() * 256, 10 + rand() * 35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      let x = rand() * 512;
      let y = rand() * 256;
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        x += (rand() - 0.5) * 44;
        y += (rand() - 0.5) * 28;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    // Continents / craters / ice sheets
    for (let i = 0; i < 55; i++) {
      ctx.fillStyle = secondary;
      ctx.globalAlpha = style === 'barren' ? 0.35 : 0.65;
      ctx.beginPath();
      ctx.ellipse(rand() * 512, rand() * 256, 12 + rand() * 48, 8 + rand() * 28, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Polar ice caps for oceanic / cryogenic
    if (style === 'oceanic' || style === 'cryogenic') {
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, 512, 22);
      ctx.fillRect(0, 234, 512, 22);
      // Wispy clouds
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 28; i++) {
        ctx.beginPath();
        ctx.ellipse(rand() * 512, 28 + rand() * 200, 25 + rand() * 65, 4 + rand() * 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  cache.set(key, tex);
  return tex;
}

