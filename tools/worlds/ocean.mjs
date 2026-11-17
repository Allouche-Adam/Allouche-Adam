// World 1: the aquarium. Glowing ASCII sharks + colorful tropical fish, and a seabed footer.
import { hash, mix, charLine, svgDoc, asciiName, waveCss, tagline, shapesAscii, MONO, NAME, TAGLINE } from "../lib.mjs";

const W = 900, BG = "#050B1A";
const CW = 6.6, LH = 11;
const RAMP = " .:-=+*#%@";

// ---------- shapes ----------
const seg = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
const inTri = (px, py, [a, b, c]) => {
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const d1 = s([px, py], a, b), d2 = s([px, py], b, c), d3 = s([px, py], c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};
const blue = (d) => { const q = Math.round(Math.min(1, Math.max(0, d)) * 5) / 5; return q < 0.5 ? mix("#16285E", "#3B6CFF", q / 0.5) : mix("#3B6CFF", "#E6EEFF", (q - 0.5) / 0.5); };

// A shark facing right, as characters. wiggle 0/1 moves the tail.
function shark(cols, wiggle, seed) {
  const rows = Math.round(cols * 0.38), cy = rows * 0.55, ry = rows * 0.25, sw = wiggle ? 1 : -1;
  const g = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const t = x / (cols - 1);
    let d = 0;
    const prof = t < 0.14 ? 0.22 : Math.pow(Math.sin(Math.PI * Math.min(1, (t - 0.14) / 0.86)), 0.7) * (t > 0.9 ? 0.9 : 1);
    const v = (y - cy) / (ry * Math.max(prof, 0.18));
    if (Math.abs(v) <= 1) d = 0.3 + 0.55 * Math.sqrt(1 - v * v) + (v < 0 ? 0.15 : -0.05) + t * 0.1;
    const tx = 0.14 * (cols - 1);
    if (seg(x, y, tx, cy, cols * 0.02, cy - ry * 1.9 + sw) < 1.1 || seg(x, y, tx, cy, cols * 0.05, cy + ry * 1.3 + sw) < 1) d = Math.max(d, 0.55);
    if (inTri(x, y, [[cols * 0.42, cy - ry * 0.8], [cols * 0.6, cy - ry * 0.8], [cols * 0.47, cy - ry * 2.6]])) d = Math.max(d, 0.62);
    if (inTri(x, y, [[cols * 0.55, cy + ry * 0.7], [cols * 0.66, cy + ry * 0.7], [cols * 0.5, cy + ry * 2.2]])) d = Math.max(d, 0.45);
    if (!d) continue;
    d += (hash(x, y, seed) - 0.5) * 0.18;
    g[y][x] = { ch: RAMP[Math.max(1, Math.min(9, Math.round(d * 9)))], color: blue(d) };
  }
  const ex = Math.round(cols * 0.87), ey = Math.round(cy - ry * 0.35);
  if (g[ey] && g[ey][ex]) g[ey][ex] = { ch: "o", color: "#FFFFFF" };
  return g;
}

// Small tropical fish: body color depends on (along = tail 0 .. head 1, v = top -1 .. bottom 1).
const TROPICAL = {
  clown: { h: 6, fin: "#FF7A1A", color: (a) => (Math.abs(a - 0.78) < 0.07 || Math.abs(a - 0.45) < 0.08) ? "#FFF6EA" : "#FF7A1A" },
  tang: { h: 7, fin: "#FFD23F", color: (a, v) => (v < -0.1 && a > 0.2 && a < 0.75 && Math.abs(v + 0.45 - (a - 0.45) * 0.6) < 0.22) ? "#10142E" : "#2F7BFF" },
  neon: { h: 4, fin: "#39C6FF", color: (a, v) => (v < 0 ? "#39E0FF" : "#FF2D55") },
  angel: { h: 7, fin: "#FFC93C", color: (a) => (Math.floor(a * 7) % 2 ? "#5A6BFF" : "#FFC93C") },
};
function tropical(sp, wiggle) {
  const s = TROPICAL[sp], h = s.h, L = Math.round(h * 2.6), tw = Math.max(3, Math.round(h * 0.6));
  const rows = h + 2, cols = tw + L, cy = (h - 1) / 2 + 1, ry = h / 2, rx = L / 2, bx = tw + rx;
  const g = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const u = (x + 0.5 - bx) / rx, v = (y - cy) / ry, r = Math.hypot(u, v);
    if (x >= tw && r <= 1) {
      let color = s.color((x - tw) / L, v);
      if (r > 0.82) color = mix(color, "#000000", 0.25);
      g[y][x] = { ch: r < 0.45 ? "@" : r < 0.7 ? "%" : r < 0.88 ? "*" : "+", color };
    } else if (x < tw) {
      const t = x / tw, hh = (1 - t) * ry * 0.8 + 0.3, dy = y - cy - (wiggle ? 0.6 : -0.6) * (1 - t);
      if (Math.abs(dy) <= hh) g[y][x] = { ch: dy < -0.5 ? "\\" : dy > 0.5 ? "/" : "=", color: s.fin };
    }
  }
  const ex = Math.round(tw + L * 0.82), ey = Math.round(cy - ry * 0.3);
  g[ey][ex] = { ch: "o", color: "#FFFFFF" };
  return g;
}
const flip = (g) => g.map((r) => r.slice().reverse().map((c) => c && { ...c, ch: { "\\": "/", "/": "\\" }[c.ch] || c.ch }));

// Swimmers: each is drawn twice (tail positions) and slid across with CSS.
function swimmers(list, Wd) {
  let css = "", svg = "";
  list.forEach((f, i) => {
    const grids = [0, 1].map((w) => { const g = f.make(w); return f.dir > 0 ? g : flip(g); });
    const sw = grids[0][0].length * f.cw;
    const [from, to] = f.dir > 0 ? [-sw - 30, Wd + 30] : [Wd + 30, -sw - 30];
    css += `@keyframes ${f.id}{from{transform:translate(${from}px,${f.y}px)}to{transform:translate(${to}px,${f.y}px)}}.${f.id}{animation:${f.id} ${f.dur}s linear infinite;animation-delay:-${f.delay}s}`;
    const variants = grids.map((g, w) => `<g class="t${w}">${g.map((row, r) => charLine(row, 0, (r + 1) * f.lh, f.cw)).join("")}</g>`).join("");
    svg += `<g class="${f.id}"><g class="bob" style="animation-delay:-${i * 1.1}s;font-size:${f.lh}px">${variants}</g></g>`;
  });
  return { css, svg };
}
const SWIM_CSS = `@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}.bob{animation:bob 5s ease-in-out infinite}
@keyframes tail{0%,49.9%{opacity:1}50%,100%{opacity:0}}.t0{animation:tail 1.2s infinite}.t1{animation:tail 1.2s infinite reverse}
text{${MONO}}`;

function bubbles(n, Wd, Hd, seed) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = (hash(i, 1, seed) * Wd).toFixed(0), d = (7 + hash(i, 2, seed) * 9).toFixed(1);
    s += `<text class="bub" x="${x}" y="${Hd + 10}" style="animation-duration:${d}s;animation-delay:-${(hash(i, 3, seed) * d).toFixed(1)}s">${["o", "°", ".", "o"][i % 4]}</text>`;
  }
  return s;
}
const bubbleCss = (Hd) => `@keyframes rise{from{transform:translateY(0);opacity:0}15%{opacity:.7}to{transform:translateY(-${Hd + 20}px);opacity:0}}.bub{fill:#9EDCFF;font-size:12px;font-weight:400;animation:rise linear infinite}`;

// ---------- header ----------
export function header({ withName = true } = {}) {
  const H = withName ? 330 : 160;
  const fish = [
    { id: "a", make: (w) => shark(62, w, 1), cw: CW, lh: LH, y: 8, dir: 1, dur: 42, delay: 6 },
    { id: "b", make: (w) => shark(40, w, 2), cw: CW, lh: LH, y: 196, dir: -1, dur: 48, delay: 24 },
    { id: "c", make: (w) => tropical("clown", w), cw: 7.4, lh: 12, y: 120, dir: 1, dur: 24, delay: 4 },
    { id: "d", make: (w) => tropical("tang", w), cw: 7.4, lh: 12, y: 30, dir: -1, dur: 30, delay: 14 },
    { id: "e", make: (w) => tropical("neon", w), cw: 7.4, lh: 12, y: 250, dir: 1, dur: 18, delay: 9 },
    { id: "f", make: (w) => tropical("angel", w), cw: 7.4, lh: 12, y: 160, dir: -1, dur: 34, delay: 20 },
  ].filter((f) => withName || f.y < 120).map((f) => (withName ? f : { ...f, y: f.y % 100 }));
  const sw = swimmers(fish, W);
  const nm = withName && asciiName({ text: NAME, cx: W / 2, baseline: 176, size: 140, maxW: 800, color: "#EAF6FF" });
  const calm = nm ? `<ellipse cx="${W / 2}" cy="${176 - nm.size * 0.3}" rx="${(nm.box.x2 - nm.box.x1) / 2 + 90}" ry="${nm.size * 0.75}" fill="url(#calm)"/>` : "";
  return svgDoc({
    w: W, h: H, label: withName ? `${NAME}: ${TAGLINE}. ASCII sharks and tropical fish swim behind the name.` : "ASCII fish swimming",
    defs: `<radialGradient id="sea" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#123A7A"/><stop offset=".6" stop-color="${BG}"/></radialGradient>
<radialGradient id="calm"><stop offset="0" stop-color="${BG}" stop-opacity=".9"/><stop offset=".6" stop-color="${BG}" stop-opacity=".7"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    css: SWIM_CSS + sw.css + bubbleCss(H) + waveCss("#EAF6FF", "#7FE3FF"),
    body: `<rect width="${W}" height="${H}" fill="url(#sea)"/>${bubbles(16, W, H, 1)}<g filter="url(#glow)">${sw.svg}</g>${calm}${nm ? `<g filter="url(#glow)">${nm.svg}</g>${tagline(TAGLINE, W / 2, 176 + 40, "#8FB4E0", BG)}` : ""}`,
  });
}

// ---------- footer: the seabed ----------
export function footer() {
  const H = 210, cw = 7, lh = 12, cols = Math.ceil(W / cw), rows = Math.ceil(H / lh);
  let weeds = "", coral = "";
  // seaweed: columns of ( ) that sway from their base
  for (let i = 0; i < 16; i++) {
    const c = Math.round(hash(i, 1, 7) * (cols - 2)), hgt = 4 + Math.round(hash(i, 2, 7) * 9), col = hash(i, 3, 7) > 0.5 ? "#2EC48A" : "#1F8A5B";
    let t = "";
    for (let r = 0; r < hgt; r++) t += `<text x="${c * cw}" y="${H - 18 - r * lh}" fill="${r % 2 ? col : mix(col, "#B8FFDE", 0.25)}">${r % 2 ? ")" : "("}</text>`;
    weeds += `<g class="weed" style="transform-origin:${c * cw + 3}px ${H - 18}px;animation-delay:-${(i * 0.7).toFixed(1)}s">${t}</g>`;
  }
  // coral: little round clusters of pink / orange characters
  for (let k = 0; k < 7; k++) {
    const cx = 40 + hash(k, 1, 9) * (W - 80), r = 3 + hash(k, 2, 9) * 3, col = ["#FF6FA3", "#FF9F5A", "#C77DFF", "#FF5D5D"][k % 4];
    for (let y = -Math.ceil(r); y <= 0; y++) for (let x = -Math.ceil(r * 1.6); x <= Math.ceil(r * 1.6); x++) {
      const d = Math.hypot(x / 1.6, y) / r;
      if (d > 1 || hash(x + k * 13, y, 4) > 0.85) continue;
      coral += `<text x="${(cx + x * cw).toFixed(0)}" y="${(H - 22 + y * lh).toFixed(0)}" fill="${mix(col, "#FFFFFF", d < 0.4 ? 0.25 : 0)}">${d < 0.5 ? "@" : d < 0.8 ? "%" : "*"}</text>`;
    }
  }
  // sand
  let sand = "";
  for (let i = 0; i < cols; i++) sand += ".,:'`"[Math.floor(hash(i, 5, 2) * 5)];
  const sw = swimmers([{ id: "g", make: (w) => tropical("clown", w), cw: 7.4, lh: 12, y: 40, dir: -1, dur: 22, delay: 3 }], W);
  return svgDoc({
    w: W, h: H, label: "A seabed made of text characters: swaying seaweed, coral and bubbles",
    defs: `<linearGradient id="deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG}"/><stop offset="1" stop-color="#0B2340"/></linearGradient>`,
    css: SWIM_CSS + sw.css + bubbleCss(H) + `@keyframes weed{0%,100%{transform:skewX(-7deg)}50%{transform:skewX(7deg)}}.weed{animation:weed 4.5s ease-in-out infinite}`,
    body: `<rect width="${W}" height="${H}" fill="url(#deep)"/>${bubbles(14, W, H, 3)}${sw.svg}${weeds}${coral}<text x="0" y="${H - 6}" fill="#C9A86A" textLength="${W}" lengthAdjust="spacingAndGlyphs">${sand}</text>`,
  });
}

// Divider 1: rolling wave lines, a neon fish swimming through.
export function wave() {
  const H = 110, cw = 7;
  const line = (y, txt, dur, dir, col) => {
    const s = txt.repeat(Math.ceil((W * 1.6) / (txt.length * cw)));
    return `<g style="animation:${dir} ${dur}s linear infinite"><text x="0" y="${y}" fill="${col}" textLength="${(s.length * cw).toFixed(0)}" lengthAdjust="spacingAndGlyphs">${s}</text></g>`;
  };
  const sw = swimmers([{ id: "w1", make: (w) => tropical("neon", w), cw: 7.4, lh: 12, y: 36, dir: 1, dur: 14, delay: 4 }], W);
  return svgDoc({
    w: W, h: H, label: "Rolling ASCII waves with a fish swimming through",
    defs: `<linearGradient id="wv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG}"/><stop offset="1" stop-color="#0E2E5C"/></linearGradient>`,
    css: SWIM_CSS + sw.css + `@keyframes L{from{transform:translateX(0)}to{transform:translateX(-${cw * 20}px)}}@keyframes R{from{transform:translateX(-${cw * 20}px)}to{transform:translateX(0)}}text{font-size:12px}`,
    body: `<rect width="${W}" height="${H}" fill="url(#wv)"/>${line(30, "~≈~-~≈≈~-~", 6, "L", "#2B5FB3")}${sw.svg}${line(62, "≈~-~~≈~-~≈", 4, "R", "#3FA9F5")}${line(86, "~-≈~~-≈~≈~", 5, "L", "#7FE3FF")}${line(104, "≈≈~-~≈~~-~", 7, "R", "#2B5FB3")}`,
  });
}

// Divider 2: glowing jellyfish pulsing slowly upward.
export function jellies() {
  const H = 170;
  const jelly = (cx, col, seed) => {
    const shapes = [{ kind: "ellipse", cx, cy: 40, rx: 30, ry: 22, color: (d) => mix(col, "#FFFFFF", d * 0.5) }];
    for (let t = 0; t < 5; t++) {
      const x = cx - 20 + t * 10;
      for (let k = 0; k < 6; k++) shapes.push({ kind: "line", x1: x + Math.sin(k + t) * 4, y1: 52 + k * 10, x2: x + Math.sin(k + 1 + t) * 4, y2: 62 + k * 10, w: 2.2, color: mix(col, "#FFFFFF", 0.2), ramp: " :|" });
    }
    return shapesAscii(shapes, { x0: cx - 40, y0: 14, w: 80, h: 116, cw: 4.6, lh: 7.6, seed });
  };
  let css = "", s = "";
  [[160, "#FF6FB5", 1, 9], [470, "#9B7BFF", 2, 12], [760, "#5CE1FF", 3, 10]].forEach(([cx, col, seed, dur], i) => {
    css += `@keyframes up${i}{0%{transform:translateY(40px)}50%{transform:translateY(-10px)}100%{transform:translateY(40px)}}`;
    s += `<g style="animation:up${i} ${dur}s ease-in-out infinite;animation-delay:-${i * 2}s"><g class="pulse" style="transform-origin:${cx}px 40px">${jelly(cx, col, seed)}</g></g>`;
  });
  return svgDoc({
    w: W, h: H, label: "Glowing ASCII jellyfish drifting upward",
    defs: `<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    css: css + bubbleCss(H) + `text{${MONO};font-size:7.6px}@keyframes pulse{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.86)}}.pulse{animation:pulse 2.2s ease-in-out infinite}`,
    body: `<rect width="${W}" height="${H}" fill="${BG}"/>${bubbles(10, W, H, 5)}<g filter="url(#glow)">${s}</g>`,
  });
}
