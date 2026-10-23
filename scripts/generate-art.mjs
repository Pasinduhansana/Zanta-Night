/* Procedural art generator for ZANTA NIGHT — writes layered SVG scenes to public/images. */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images");
mkdirSync(OUT, { recursive: true });

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

function defs(seed) {
  return `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#00130d"/>
    <stop offset="0.55" stop-color="#00251a"/>
    <stop offset="1" stop-color="#001009"/>
  </linearGradient>
  <radialGradient id="stageGlow" cx="0.5" cy="0.42" r="0.55">
    <stop offset="0" stop-color="#9dffc4" stop-opacity="0.75"/>
    <stop offset="0.35" stop-color="#008f55" stop-opacity="0.42"/>
    <stop offset="1" stop-color="#008f55" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="limeGlow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#b6ff00" stop-opacity="0.6"/>
    <stop offset="1" stop-color="#b6ff00" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d6ff6e" stop-opacity="0.85"/>
    <stop offset="0.6" stop-color="#b6ff00" stop-opacity="0.28"/>
    <stop offset="1" stop-color="#39ff14" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="beamGrad2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7dffb0" stop-opacity="0.8"/>
    <stop offset="1" stop-color="#008f55" stop-opacity="0"/>
  </linearGradient>
  <filter id="fog${seed}" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.007" numOctaves="4" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="matrix"
      values="0 0 0 0 0.02
              0 0 0 0 0.72
              0 0 0 0 0.44
              0 0 0 -1.15 1.05"/>
    <feGaussianBlur stdDeviation="7"/>
  </filter>
  <filter id="fogLite${seed}" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="3" seed="${seed + 3}" result="n"/>
    <feColorMatrix in="n" type="matrix"
      values="0 0 0 0 0.45
              0 0 0 0 1
              0 0 0 0 0.2
              0 0 0 -1.35 1.15"/>
    <feGaussianBlur stdDeviation="9"/>
  </filter>
  <filter id="soft${seed}" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="${seed % 7 + 5}"/>
  </filter>
  <filter id="grainF" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed + 11}" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <filter id="soft0" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.2"/></filter>
  <filter id="soft1" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.4"/></filter>
  <filter id="soft2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.6"/></filter>
  <filter id="soft3" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.8"/></filter>
  <filter id="soft4" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.1"/></filter>
  <filter id="soft5" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="0.5"/></filter>
</defs>`;
}

/** Layered crowd silhouette band. */
function crowd({ w, h, y0, layers, seed }) {
  const rnd = mulberry32(seed);
  let out = "";
  for (let L = 0; L < layers; L++) {
    const t = L / (layers - 1 || 1);
    const baseY = y0 + (h - y0) * (0.18 + t * 0.78);
    const headR = 7 + t * 20 + rnd() * 4;
    const gap = headR * (2.5 - t * 0.7);
    const fill = t > 0.7 ? "#000d08" : t > 0.4 ? "#00150e" : "#00271c";
    const op = 0.72 + t * 0.28;
    const blur = t < 0.35 ? 2.4 - t * 5 : 0;
    let bodies = "";
    let x = -gap * rnd();
    while (x < w + gap) {
      const jitter = (rnd() - 0.5) * gap * 0.5;
      const hx = x + jitter;
      const hy = baseY + (rnd() - 0.5) * headR * 1.6;
      bodies += `<circle cx="${r2(hx)}" cy="${r2(hy)}" r="${r2(headR)}"/>`;
      bodies += `<path d="M${r2(hx - headR * 2.35)} ${r2(hy + headR * 5.2)} q${r2(headR * 0.5)} ${r2(-headR * 2.6)} ${r2(headR * 2.35)} ${r2(-headR * 2.6)} q${r2(headR * 1.85)} 0 ${r2(headR * 2.35)} ${r2(headR * 2.6)} Z"/>`;
      if (rnd() > 0.55) {
        const armH = headR * (4 + rnd() * 4.5);
        const ax = hx + (rnd() > 0.5 ? 1 : -1) * headR * (1.4 + rnd());
        const tilt = (rnd() - 0.5) * headR * 2;
        bodies += `<path d="M${r2(ax)} ${r2(hy + headR * 2.4)} Q${r2(ax + tilt * 0.4)} ${r2(hy + headR * 2.4 - armH * 0.6)} ${r2(ax + tilt)} ${r2(hy + headR * 2 - armH)}" stroke="${fill}" stroke-width="${r2(headR * 0.78)}" stroke-linecap="round" fill="none"/>`;
        bodies += `<circle cx="${r2(ax + tilt)}" cy="${r2(hy + headR * 1.7 - armH)}" r="${r2(headR * 0.5)}" fill="${fill}"/>`;
      }
      x += gap;
    }
    out += `<g fill="${fill}" opacity="${r2(op)}"${blur ? ` filter="url(#soft${L})"` : ""}>${bodies}</g>`;
  }
  return out;
}

/** Thin light beams radiating from an origin. */
function lasers({ ox, oy, count, len, spread, seed, grad = "beamGrad", wMin = 3, wMax = 16, opacity = 1 }) {
  const rnd = mulberry32(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const a = spread[0] + ((spread[1] - spread[0]) * (i + rnd() * 0.7)) / count;
    const rad = (a * Math.PI) / 180;
    const wdt = wMin + rnd() * (wMax - wMin);
    const L = len * (0.72 + rnd() * 0.5);
    const ex = ox + Math.sin(rad) * L;
    const ey = oy + Math.cos(rad) * L;
    const px = Math.cos(rad) * wdt;
    const py = -Math.sin(rad) * wdt;
    out += `<polygon points="${r2(ox + px)},${r2(oy + py)} ${r2(ex + px * 2.4)},${r2(ey + py * 2.4)} ${r2(ex - px * 2.4)},${r2(ey - py * 2.4)} ${r2(ox - px)},${r2(oy - py)}" fill="url(#${grad})" opacity="${r2((0.35 + rnd() * 0.6) * opacity)}"/>`;
  }
  return out;
}

function bokeh({ w, h, count, seed, color = "limeGlow" }) {
  const rnd = mulberry32(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const rr = 3 + rnd() * 26;
    out += `<circle cx="${r2(rnd() * w)}" cy="${r2(rnd() * h)}" r="${r2(rr)}" fill="url(#${color})" opacity="${r2(0.1 + rnd() * 0.45)}"/>`;
  }
  return out;
}

function grain(w, h, opacity = 0.07) {
  return `<rect width="${w}" height="${h}" filter="url(#grainF)" opacity="${opacity}" style="mix-blend-mode:overlay"/>`;
}

function frame(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;
}

function vignette(w, h) {
  return `<defs><radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
    <stop offset="0.55" stop-color="#001a14" stop-opacity="0"/>
    <stop offset="1" stop-color="#000a06" stop-opacity="0.92"/>
  </radialGradient></defs><rect width="${w}" height="${h}" fill="url(#vig)"/>`;
}

/* ------------------------------------------------------------------- scenes */

function heroBg() {
  const w = 1600, h = 900;
  const ox = w * 0.52, oy = h * 0.4;
  let s = `<rect width="${w}" height="${h}" fill="url(#sky)"/>`;
  s += `<ellipse cx="${ox}" cy="${oy}" rx="620" ry="380" fill="url(#stageGlow)" opacity="0.75"/>`;
  s += `<ellipse cx="${ox}" cy="${oy - 40}" rx="190" ry="120" fill="url(#limeGlow)" opacity="0.8"/>`;
  s += `<rect width="${w}" height="${h}" filter="url(#fog7)" opacity="0.55"/>`;
  s += lasers({ ox, oy, count: 7, len: 1500, spread: [-118, 118], seed: 21, opacity: 0.9 });
  s += lasers({ ox: w * 0.12, oy: -60, count: 4, len: 1250, spread: [-24, 46], seed: 5, grad: "beamGrad2", wMin: 5, wMax: 22, opacity: 0.55 });
  s += lasers({ ox: w * 0.88, oy: -60, count: 4, len: 1250, spread: [-46, 24], seed: 9, grad: "beamGrad2", wMin: 5, wMax: 22, opacity: 0.55 });
  s += bokeh({ w, h: h * 0.7, count: 46, seed: 33 });
  s += `<rect y="${h * 0.52}" width="${w}" height="${h * 0.48}" filter="url(#fogLite40)" opacity="0.5"/>`;
  s += crowd({ w, h, y0: h * 0.6, layers: 6, seed: 77 });
  s += vignette(w, h);
  s += grain(w, h);
  return frame(w, h, defs(7) + s);
}

function introCrowd() {
  const w = 1400, h = 1000;
  let s = `<rect width="${w}" height="${h}" fill="url(#sky)"/>`;
  s += `<ellipse cx="${w * 0.7}" cy="${h * 0.22}" rx="520" ry="330" fill="url(#stageGlow)" opacity="0.65"/>`;
  s += `<rect width="${w}" height="${h}" filter="url(#fog12)" opacity="0.6"/>`;
  s += lasers({ ox: w * 0.72, oy: h * 0.06, count: 6, len: 1450, spread: [-70, 78], seed: 44, opacity: 0.85 });
  s += lasers({ ox: w * 0.1, oy: -40, count: 3, len: 1300, spread: [-8, 58], seed: 18, grad: "beamGrad2", wMin: 6, wMax: 26, opacity: 0.5 });
  s += bokeh({ w, h: h * 0.6, count: 60, seed: 51 });
  s += `<rect y="${h * 0.45}" width="${w}" height="${h * 0.55}" filter="url(#fogLite40)" opacity="0.55"/>`;
  s += crowd({ w, h, y0: h * 0.44, layers: 6, seed: 91 });
  s += vignette(w, h);
  s += grain(w, h);
  return frame(w, h, defs(12) + s);
}

function expLights() {
  const w = 1000, h = 1000;
  let s = `<rect width="${w}" height="${h}" fill="#001009"/>`;
  s += `<ellipse cx="${w * 0.5}" cy="${h * 0.55}" rx="460" ry="380" fill="url(#stageGlow)" opacity="0.5"/>`;
  s += `<rect width="${w}" height="${h}" filter="url(#fog19)" opacity="0.55"/>`;
  s += lasers({ ox: -30, oy: -30, count: 6, len: 1350, spread: [8, 78], seed: 61, opacity: 0.95 });
  s += lasers({ ox: w + 30, oy: -30, count: 6, len: 1350, spread: [-78, -8], seed: 62, opacity: 0.95 });
  s += lasers({ ox: w * 0.5, oy: h + 60, count: 5, len: 1150, spread: [-140, -40], seed: 63, grad: "beamGrad2", wMin: 4, wMax: 14, opacity: 0.6 });
  s += `<rect width="${w}" height="${h}" filter="url(#fogLite40)" opacity="0.35"/>`;
  s += bokeh({ w, h, count: 70, seed: 71 });
  s += vignette(w, h);
  s += grain(w, h, 0.09);
  return frame(w, h, defs(19) + s);
}

function expParty() {
  const w = 1000, h = 1000;
  let s = `<rect width="${w}" height="${h}" fill="url(#sky)"/>`;
  s += `<ellipse cx="${w * 0.5}" cy="${h * 0.6}" rx="520" ry="420" fill="url(#stageGlow)" opacity="0.7"/>`;
  s += `<g opacity="0.8"><circle cx="${w * 0.5}" cy="${h * 0.58}" r="120" fill="none" stroke="#b6ff00" stroke-opacity="0.35" stroke-width="2"/><circle cx="${w * 0.5}" cy="${h * 0.58}" r="210" fill="none" stroke="#39ff14" stroke-opacity="0.22" stroke-width="2"/><circle cx="${w * 0.5}" cy="${h * 0.58}" r="310" fill="none" stroke="#008f55" stroke-opacity="0.3" stroke-width="3"/></g>`;
  s += `<rect width="${w}" height="${h}" filter="url(#fog27)" opacity="0.6"/>`;
  s += lasers({ ox: w * 0.5, oy: h * 0.1, count: 9, len: 1250, spread: [-120, 120], seed: 81, opacity: 0.8 });
  const rnd = mulberry32(99);
  let confetti = "";
  for (let i = 0; i < 130; i++) {
    const x = rnd() * w, y = rnd() * h * 0.85;
    const size = 4 + rnd() * 9;
    const col = rnd() > 0.5 ? "#b6ff00" : rnd() > 0.5 ? "#39ff14" : "#9dffc4";
    confetti += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(size)}" height="${r2(size * 0.6)}" fill="${col}" opacity="${r2(0.25 + rnd() * 0.6)}" transform="rotate(${r2(rnd() * 90)} ${r2(x)} ${r2(y)})"/>`;
  }
  s += confetti;
  s += `<rect y="${h * 0.5}" width="${w}" height="${h * 0.5}" filter="url(#fogLite40)" opacity="0.5"/>`;
  s += crowd({ w, h, y0: h * 0.5, layers: 6, seed: 47 });
  s += vignette(w, h);
  s += grain(w, h);
  return frame(w, h, defs(27) + s);
}

function expFood() {
  const w = 1000, h = 1000;
  const rnd = mulberry32(303);
  let s = `<rect width="${w}" height="${h}" fill="url(#sky)"/>`;
  s += `<ellipse cx="${w * 0.5}" cy="${h * 0.45}" rx="520" ry="330" fill="url(#stageGlow)" opacity="0.45"/>`;
  s += `<rect width="${w}" height="${h}" filter="url(#fog31)" opacity="0.5"/>`;

  // string lights
  let bulbs = `<path d="M-20 140 Q 250 260 500 200 T 1020 240" fill="none" stroke="#0a3325" stroke-width="4"/>`;
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const x = -20 + t * 1040;
    const y = 140 + Math.sin(t * Math.PI * 1.6) * 110 + t * 90;
    bulbs += `<circle cx="${r2(x)}" cy="${r2(y + 14)}" r="7" fill="#b6ff00" opacity="0.85"/><circle cx="${r2(x)}" cy="${r2(y + 14)}" r="20" fill="url(#limeGlow)" opacity="0.7"/>`;
  }
  s += bulbs;

  // stalls
  let stalls = "";
  const stallW = 260;
  for (let i = -1; i < 5; i++) {
    const x = i * (stallW + 26) + (i % 2) * 20;
    const y = 330 + (i % 2) * 46;
    stalls += `<rect x="${x}" y="${y}" width="${stallW}" height="300" fill="#00150e"/>`;
    stalls += `<path d="M${x - 16} ${y} L${x + stallW / 2} ${y - 78} L${x + stallW + 16} ${y} Z" fill="#00271c"/>`;
    stalls += `<rect x="${x + 18}" y="${y + 96}" width="${stallW - 36}" height="96" rx="4" fill="#b6ff00" opacity="0.14"/>`;
    stalls += `<rect x="${x + 18}" y="${y + 96}" width="${stallW - 36}" height="6" fill="#b6ff00" opacity="0.75"/>`;
    // silhouetted vendor
    stalls += `<circle cx="${x + stallW / 2}" cy="${y + 150}" r="26" fill="#000d08"/><path d="M${x + stallW / 2 - 52} ${y + 262} q4 -66 52 -66 q48 0 52 66 Z" fill="#000d08"/>`;
  }
  s += stalls;

  // steam
  let steam = "";
  for (let i = 0; i < 7; i++) {
    const x = 90 + rnd() * 820;
    const y = 360 + rnd() * 90;
    steam += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(60 + rnd() * 90)}" ry="${r2(40 + rnd() * 60)}" fill="#c8ffe0" opacity="${r2(0.05 + rnd() * 0.1)}" filter="url(#soft31)"/>`;
  }
  s += steam;

  // grill sparks
  let sparks = "";
  for (let i = 0; i < 60; i++) {
    sparks += `<circle cx="${r2(rnd() * w)}" cy="${r2(480 + rnd() * 320)}" r="${r2(1 + rnd() * 3)}" fill="#b6ff00" opacity="${r2(0.2 + rnd() * 0.7)}"/>`;
  }
  s += sparks;

  // crowd in front
  s += `<rect y="${h * 0.62}" width="${w}" height="${h * 0.38}" filter="url(#fogLite40)" opacity="0.5"/>`;
  s += crowd({ w, h, y0: h * 0.72, layers: 4, seed: 555 });
  s += vignette(w, h);
  s += grain(w, h);
  return frame(w, h, defs(31) + s);
}

/* ------------------------------------------------------- artist signal art */

function artistBase(w, h, seed) {
  let s = `<rect width="${w}" height="${h}" fill="url(#sky)"/>`;
  s += `<ellipse cx="${w * 0.5}" cy="${h * 0.34}" rx="${w * 0.62}" ry="${h * 0.42}" fill="url(#stageGlow)" opacity="0.6"/>`;
  s += `<rect width="${w}" height="${h}" filter="url(#fog${seed})" opacity="0.5"/>`;
  s += lasers({ ox: w * 0.5, oy: -30, count: 6, len: h * 1.5, spread: [-88, 88], seed: seed * 3, wMin: 3, wMax: 12, opacity: 0.75 });
  s += bokeh({ w, h, count: 34, seed: seed * 7 });
  return s;
}

function artistPercussion() {
  const w = 800, h = 1067, cx = w / 2, cy = h * 0.42;
  let s = artistBase(w, h, 41);
  let rings = "";
  for (let i = 0; i < 9; i++) {
    const rr = 46 + i * 34;
    rings += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${i % 3 === 0 ? "#b6ff00" : "#008f55"}" stroke-opacity="${r2(0.75 - i * 0.06)}" stroke-width="${i % 3 === 0 ? 4 : 2}" ${i % 2 ? 'stroke-dasharray="14 22"' : ""}/>`;
  }
  // radial ticks (drum lugs)
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r1 = 320, r2t = 348;
    rings += `<line x1="${r2(cx + Math.cos(a) * r1)}" y1="${r2(cy + Math.sin(a) * r1)}" x2="${r2(cx + Math.cos(a) * r2t)}" y2="${r2(cy + Math.sin(a) * r2t)}" stroke="#39ff14" stroke-opacity="0.6" stroke-width="5" stroke-linecap="round"/>`;
  }
  rings += `<circle cx="${cx}" cy="${cy}" r="26" fill="#b6ff00"/><circle cx="${cx}" cy="${cy}" r="60" fill="url(#limeGlow)"/>`;
  s += rings;
  // waveform
  const rnd = mulberry32(424);
  let wave = "";
  for (let i = 0; i < 52; i++) {
    const bw = 6, gap = 8;
    const x = 40 + i * (bw + gap);
    const bh = 24 + rnd() * 210;
    wave += `<rect x="${x}" y="${r2(h - 110 - bh)}" width="${bw}" height="${r2(bh)}" rx="3" fill="${i % 4 === 0 ? "#b6ff00" : "#008f55"}" opacity="${r2(0.5 + rnd() * 0.5)}"/>`;
  }
  s += wave;
  s += vignette(w, h);
  s += grain(w, h);
  return frame(w, h, defs(41) + s);
}

function artistYakee() {
  const w = 800, h = 1067, cx = w / 2, cy = h * 0.44;
  let s = artistBase(w, h, 52);
  let burst = "";
  const rnd = mulberry32(525);
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2 + rnd() * 0.05;
    const r1 = 70 + rnd() * 30;
    const r2t = 210 + rnd() * 240;
    burst += `<line x1="${r2(cx + Math.cos(a) * r1)}" y1="${r2(cy + Math.sin(a) * r1)}" x2="${r2(cx + Math.cos(a) * r2t)}" y2="${r2(cy + Math.sin(a) * r2t)}" stroke="${i % 5 === 0 ? "#b6ff00" : i % 5 === 1 ? "#39ff14" : "#008f55"}" stroke-opacity="${r2(0.3 + rnd() * 0.6)}" stroke-width="${r2(2 + rnd() * 6)}" stroke-linecap="round"/>`;
  }
  s += burst;
  s += `<circle cx="${cx}" cy="${cy}" r="54" fill="none" stroke="#b6ff00" stroke-width="5"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="34" fill="#b6ff00" opacity="0.9"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="96" fill="url(#limeGlow)"/>`;
  // equalizer at the bottom
  let eq = "";
  for (let i = 0; i < 30; i++) {
    const bh = 30 + rnd() * 260;
    const x = 44 + i * 24;
    eq += `<rect x="${x}" y="${r2(h - 90 - bh)}" width="14" height="${r2(bh)}" fill="url(#beamGrad)" opacity="0.9"/>`;
  }
  s += eq;
  s += vignette(w, h);
  s += grain(w, h);
  return frame(w, h, defs(52) + s);
}

function artistDenon() {
  const w = 800, h = 1067;
  let s = artistBase(w, h, 63);
  // perspective grid
  let grid = "";
  const hz = h * 0.5;
  for (let i = -10; i <= 10; i++) {
    grid += `<line x1="${r2(w / 2 + i * 44)}" y1="${hz}" x2="${r2(w / 2 + i * 210)}" y2="${h}" stroke="#008f55" stroke-opacity="0.45" stroke-width="2"/>`;
  }
  for (let i = 1; i <= 12; i++) {
    const y = hz + Math.pow(i / 12, 2.1) * (h - hz);
    grid += `<line x1="0" y1="${r2(y)}" x2="${w}" y2="${r2(y)}" stroke="#008f55" stroke-opacity="0.35" stroke-width="1.6"/>`;
  }
  s += `<g>${grid}</g>`;
  // twin jog wheels
  for (const cx of [w * 0.3, w * 0.7]) {
    const cy = h * 0.4;
    s += `<circle cx="${cx}" cy="${cy}" r="120" fill="#00150e" stroke="#b6ff00" stroke-opacity="0.75" stroke-width="5"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="86" fill="none" stroke="#39ff14" stroke-opacity="0.5" stroke-width="3" stroke-dasharray="6 12"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="34" fill="#b6ff00" opacity="0.9"/>`;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      s += `<line x1="${r2(cx + Math.cos(a) * 126)}" y1="${r2(cy + Math.sin(a) * 126)}" x2="${r2(cx + Math.cos(a) * 138)}" y2="${r2(cy + Math.sin(a) * 138)}" stroke="#c8d2ce" stroke-opacity="0.5" stroke-width="4"/>`;
    }
  }
  // waveform bridge between decks
  const rnd = mulberry32(636);
  let wave = "";
  for (let i = 0; i < 46; i++) {
    const x = 70 + i * 15;
    const bh = 20 + rnd() * 150;
    wave += `<rect x="${x}" y="${r2(h * 0.72 - bh / 2)}" width="8" height="${r2(bh)}" rx="4" fill="${i % 3 === 0 ? "#b6ff00" : "#39ff14"}" opacity="${r2(0.45 + rnd() * 0.5)}"/>`;
  }
  s += wave;
  s += vignette(w, h);
  s += grain(w, h);
  return frame(w, h, defs(63) + s);
}

/* --------------------------------------------------------------------- main */

const files = {
  "hero-bg.svg": heroBg(),
  "intro-crowd.svg": introCrowd(),
  "exp-lights.svg": expLights(),
  "exp-party.svg": expParty(),
  "exp-food.svg": expFood(),
  "artist-percussion.svg": artistPercussion(),
  "artist-yakee.svg": artistYakee(),
  "artist-denon.svg": artistDenon(),
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
  console.log(`wrote ${name} (${Math.round(content.length / 1024)} KB)`);
}
