// Builds partials/hero-art.hbs: the isometric illustration on the right side of the home hero.
// Static SVG (no text, no JS needed to draw it); motion is plain CSS in screen.css (.ha-*).
// Run: node tools/hero-art.mjs   (seeded, so the output only changes when this file changes)
import { writeFileSync } from 'node:fs';

const W = 900, H = 600, OX = 470, OY = 330, C = Math.cos(Math.PI / 6), S = 0.5;
const COL = { blue: '#2563d9', green: '#2f9e55', orange: '#ec7a2c', cream: '#efe7d6', sky: '#4cc3ee' };

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const r1 = (n) => Math.round(n * 10) / 10;
const P = (x, y, z) => [r1(OX + (x - y) * C), r1(OY + (x + y) * S - z)];
const pts = (a) => a.map((p) => P(...p).join(',')).join(' ');
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(f > 0 ? c + (255 - c) * f : c * (1 + f)));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}
const poly = (a, fill) => `<polygon points="${pts(a)}" fill="${fill}"/>`;

function box(x, y, z, w, d, h, color) {
  return poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], shade(color, -0.12)) +
    poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], shade(color, -0.32)) +
    poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], shade(color, 0.18));
}

function panel(x, y, z, w, h, plane, bg, content) {
  const t = 5;
  const L = plane === 'y' ? (u, v) => [x + u, y + t, z + h - v] : (u, v) => [x + t, y + w - u, z + h - v];
  let s = plane === 'y' ? box(x, y, z, w, t, h, shade(bg, -0.25)) : box(x, y, z, t, w, h, shade(bg, -0.25));
  s += poly([L(0, 0), L(w, 0), L(w, h), L(0, h)], bg);
  const q = (u0, v0, u1, v1, fill) => poly([L(u0, v0), L(u1, v0), L(u1, v1), L(u0, v1)], fill);
  const m = w * 0.12;
  if (content === 'lines') {
    s += q(m, h * 0.14, w * 0.62, h * 0.22, shade(bg, -0.45));
    for (let i = 0; i < 4; i++) s += q(m, h * (0.34 + i * 0.14), w - m - (i % 2) * w * 0.2, h * (0.39 + i * 0.14), shade(bg, -0.22));
  } else if (content === 'bars') {
    [COL.blue, COL.green, COL.orange, COL.blue].forEach((c, i) => {
      const bh = h * (0.25 + rnd() * 0.5), bw = (w - 2 * m) / 5.5;
      s += `<g class="ha-bar" style="--i:${i}">${q(m + i * bw * 1.4, h - m - bh, m + i * bw * 1.4 + bw, h - m, c)}</g>`;
    });
  } else if (content === 'image') {
    s += q(m, m, w - m, h - m, shade(COL.sky, 0.55));
    s += poly([L(m, h - m), L(w * 0.42, h * 0.38), L(w * 0.7, h - m)], COL.green);
    s += poly([L(w * 0.45, h - m), L(w * 0.68, h * 0.5), L(w - m, h - m)], shade(COL.green, -0.25));
    const r = w * 0.08, cu = w * 0.72, cv = h * 0.3;
    s += poly(Array.from({ length: 12 }, (_, i) => L(cu + r * Math.cos(i / 12 * 6.283), cv + r * Math.sin(i / 12 * 6.283))), COL.orange);
  } else if (content === 'pie') {
    const r = Math.min(w, h) * 0.32, cu = w / 2, cv = h / 2;
    for (const [a0, a1, c] of [[0, 0.45, COL.blue], [0.45, 0.72, COL.orange], [0.72, 1, COL.green]]) {
      const arc = [L(cu, cv)];
      for (let k = 0; k <= 12; k++) { const a = (a0 + (a1 - a0) * k / 12) * 6.283 - 1.57; arc.push(L(cu + r * Math.cos(a), cv + r * Math.sin(a))); }
      s += poly(arc, c);
    }
  } else if (content === 'table') {
    const cw = (w - 2 * m) / 4, chh = (h - 2 * m) / 4;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++)
      s += q(m + c * cw + 1.5, m + r * chh + 1.5, m + (c + 1) * cw - 1.5, m + (r + 1) * chh - 1.5, r === 0 ? COL.blue : (c + r) % 3 ? shade(bg, -0.18) : COL.green);
  } else if (content === 'line') {
    const path = Array.from({ length: 6 }, (_, i) => P(...L(m + i * (w - 2 * m) / 5, h * (0.3 + rnd() * 0.45))));
    s += `<polyline class="ha-draw" pathLength="1" points="${path.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`;
  }
  return s;
}

function cylinder(x, y, z, r, h, color) {
  const cx = x + r, cy = y + r, rx = r1(r * C * 1.414), ry = r1(r * S * 1.414);
  const [bx, by] = P(cx, cy, z), [tx, ty] = P(cx, cy, z + h);
  let s = `<path d="M${bx - rx},${by}A${rx},${ry} 0 0 0 ${r1(bx + rx)},${by}L${r1(tx + rx)},${ty}L${r1(tx - rx)},${ty}Z" fill="${shade(color, -0.2)}"/>`;
  for (let k = 1; k < 3; k++) { const yy = r1(by - (by - ty) * k / 3); s += `<path d="M${r1(bx - rx)},${yy}A${rx},${ry} 0 0 0 ${r1(bx + rx)},${yy}" fill="none" stroke="${shade(color, -0.45)}" stroke-width="2"/>`; }
  return s + `<ellipse cx="${tx}" cy="${ty}" rx="${rx}" ry="${ry}" fill="${shade(color, 0.25)}"/>`;
}

function graph(x, y, z) {
  const nodes = Array.from({ length: 5 }, () => P(x + rnd() * 90, y + rnd() * 90, z + 20 + rnd() * 70));
  let s = '';
  nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b) => { if (rnd() < 0.55) s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${shade(COL.sky, 0.3)}" stroke-width="2" opacity=".8"/>`; }));
  nodes.forEach(([cx, cy], i) => {
    s += `<circle class="ha-node" style="--i:${i}" cx="${cx}" cy="${cy}" r="7" fill="${pick([COL.green, COL.orange, COL.sky, COL.cream])}"/>`;
  });
  return s;
}

function cluster(x, y, z) {
  const sz = 22;
  let s = '';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const n = Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) s += box(x + i * sz, y + j * sz, z + k * sz, sz - 2, sz - 2, sz - 2, pick([COL.blue, COL.green, COL.orange, COL.blue]));
  }
  return s;
}

// ---------- scene ----------
let floor = '';
for (let i = -900; i <= 900; i += 30) for (let j = -900; j <= 900; j += 30) {
  const [sx, sy] = P(i, j, 0);
  if (sx > 0 && sx < W && sy > 0 && sy < H) floor += `M${sx},${sy}h.1`;
}
let traces = '';
for (let k = 0; k < 14; k++) {
  const a = Math.round((rnd() * 1400 - 700) / 30) * 30, b0 = rnd() * 1200 - 600, b1 = b0 + 120 + rnd() * 240, alongX = rnd() < 0.5;
  const p0 = alongX ? P(b0, a, 0) : P(a, b0, 0), p1 = alongX ? P(b1, a, 0) : P(a, b1, 0);
  traces += `<path class="ha-trace" style="--i:${k}" pathLength="1" d="M${p0}L${p1}"/>`;
}

const items = [];
const STEP = 124;
for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) {
  const x = i * STEP + (rnd() - 0.5) * 24, y = j * STEP + (rnd() - 0.5) * 24;
  const [sx, sy] = P(x + 40, y + 40, 40);
  if (sx < -60 || sx > W + 60 || sy < -40 || sy > H + 110) continue;
  if (Math.abs(i) <= 1 && Math.abs(j) <= 1) continue;
  items.push({ x, y, kind: pick(['panel', 'panel', 'panel', 'box', 'cyl', 'graph', 'cluster', 'panel']) });
}
items.push({ x: -75, y: -75, kind: 'main' });
items.sort((a, b) => a.x + a.y - (b.x + b.y));

let body = '';
for (const it of items) {
  const { x, y } = it;
  if (it.kind === 'main') {
    const s = 170, h = 40, cs = [COL.blue, COL.orange, COL.green, COL.blue];
    let stack = '';
    cs.forEach((c, k) => {
      const z = k * (h + 6);
      stack += `<g class="ha-layer" style="--i:${k}">` + box(x, y, z, s, s, h, c) +
        poly([[x + 24, y + s, z + 12], [x + 92, y + s, z + 12], [x + 92, y + s, z + 28], [x + 24, y + s, z + 28]], COL.cream) +
        poly([[x + s, y + 120, z + 12], [x + s, y + 60, z + 12], [x + s, y + 60, z + 28], [x + s, y + 120, z + 28]], shade(COL.cream, -0.15)) + '</g>';
    });
    const z = 4 * (h + 6);
    let card = box(x + 30, y + 30, z, 110, 110, 6, COL.cream);
    [[COL.blue, 55], [COL.green, 80], [COL.orange, 40]].forEach(([c, hh], k) => { card += `<g class="ha-bar" style="--i:${k + 4}">${box(x + 48 + k * 26, y + 70, z + 6, 16, 16, hh * 0.5, c)}</g>`; });
    stack += `<g class="ha-layer" style="--i:4">${card}</g>`;
    body += `<g class="ha-main">${stack}</g>`;
    continue;
  }
  let part = '';
  if (it.kind === 'panel') {
    const w = 60 + rnd() * 40, h = 70 + rnd() * 45, bg = rnd() < 0.72 ? COL.cream : pick([COL.blue, COL.green, COL.orange]);
    const content = bg === COL.cream ? pick(['lines', 'bars', 'image', 'pie', 'table', 'line', 'lines']) : pick(['line', 'lines', 'bars']);
    part = panel(x, y, rnd() < 0.3 ? 30 : 0, w, h, rnd() < 0.5 ? 'x' : 'y', bg, content);
  } else if (it.kind === 'box') {
    const sz = 40 + rnd() * 26;
    part = box(x, y, 0, sz, sz, sz * (0.6 + rnd() * 0.5), pick([COL.blue, COL.green, COL.orange]));
  } else if (it.kind === 'cyl') part = cylinder(x, y, 0, 26 + rnd() * 8, 60 + rnd() * 30, pick([COL.blue, COL.cream, COL.blue]));
  else if (it.kind === 'graph') part = graph(x, y, 0);
  else part = cluster(x, y, 0);
  // each object floats on its own rhythm (duration and phase vary)
  body += `<g class="ha-float" style="--d:${(4.5 + rnd() * 3.5).toFixed(1)}s;--p:-${(rnd() * 6).toFixed(1)}s">${part}</g>`;
}

const svg = `{{!-- Generated by tools/hero-art.mjs. Decorative only: hidden from assistive tech. --}}
<svg class="hero-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
<path class="ha-dots" d="${floor}"/>
<g class="ha-traces">${traces}</g>
${body}
</svg>
`;
writeFileSync(new URL('../partials/hero-art.hbs', import.meta.url), svg);
console.log('partials/hero-art.hbs', (svg.length / 1024).toFixed(1), 'KB,', items.length, 'objects');
