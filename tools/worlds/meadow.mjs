// World 3: the meadow. Sky with drifting ASCII clouds and birds; a grassy footer
// with flowers and a tree on the right edge whose red apple falls now and then.
import { hash, mix, svgDoc, asciiName, waveCss, tagline, shapesAscii, MONO, NAME, TAGLINE, esc } from "../lib.mjs";

const W = 900;

// A blob made of a few overlapping circles, drawn with characters: dense in the middle, light at the edge.
// circles: [cx, cy, r] in cells. Returns <text> lines.
function blob(circles, cols, rows, cw, lh, x0, y0, colorAt, seed, ramp = " .:-=+*#%@") {
  let out = "";
  for (let r = 0; r < rows; r++) {
    let line = "", fills = [];
    for (let c = 0; c < cols; c++) {
      let best = 0;
      for (const [cx, cy, rad] of circles) best = Math.max(best, 1 - Math.hypot((c - cx) / 1.8, r - cy) / rad);
      if (best <= 0 || (best < 0.12 && hash(c, r, seed) > 0.5)) { line += " "; fills.push(null); continue; }
      const d = Math.min(1, best * 1.6 + (hash(c, r, seed + 1) - 0.5) * 0.25);
      line += ramp[Math.max(1, Math.min(ramp.length - 1, Math.round(d * (ramp.length - 1))))];
      fills.push(colorAt(d, c, r));
    }
    // color runs -> tspans
    let t = "", run = "", col = null;
    const flush = () => { if (run) t += col ? `<tspan fill="${col}">${esc(run)}</tspan>` : esc(run); run = ""; };
    for (let i = 0; i < line.length; i++) { const f = line[i] === " " ? null : fills[i]; if (f !== col) { flush(); col = f; } run += line[i]; }
    flush();
    if (line.trim()) out += `<text x="${x0}" y="${(y0 + (r + 0.8) * lh).toFixed(1)}" textLength="${(cols * cw).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${t}</text>`;
  }
  return out;
}

function cloud(i, seed) {
  const n = 3 + Math.floor(hash(i, 1, seed) * 2), circles = [];
  for (let k = 0; k < n; k++) circles.push([8 + k * 7 + hash(i, k, seed) * 3, 3 + hash(k, i, seed) * 1.5, 2.6 + hash(k, 3, seed) * 1.8]);
  const cols = 14 + n * 7;
  return blob(circles, cols, 7, 5.4, 8.6, 0, 0, (d) => mix("#DCEBFA", "#FFFFFF", d), seed + i);
}

export function header() {
  const H = 330;
  let clouds = "", css = "";
  [[20, 34, 70, 0], [150, 70, 90, 30], [60, 20, 110, 55], [240, 48, 80, 70]].forEach(([y, s, dur, delay], i) => {
    css += `@keyframes cl${i}{from{transform:translate(-260px,${y}px)}to{transform:translate(${W + 40}px,${y}px)}}`;
    clouds += `<g style="animation:cl${i} ${dur}s linear infinite;animation-delay:-${delay}s;font-size:8.6px">${cloud(i, s)}</g>`;
  });
  // birds: a "v" that flaps into "^" and back, flying across
  let birds = "";
  for (let i = 0; i < 5; i++) {
    const y = 40 + hash(i, 2, 5) * 90, dur = 16 + hash(i, 3, 5) * 10;
    css += `@keyframes bd${i}{from{transform:translate(-30px,${y.toFixed(0)}px)}to{transform:translate(${W + 30}px,${(y - 30).toFixed(0)}px)}}`;
    birds += `<g style="animation:bd${i} ${dur.toFixed(1)}s linear infinite;animation-delay:-${(i * 4.1).toFixed(1)}s"><text class="w0">v</text><text class="w1">^</text></g>`;
  }
  // Smaller cells than the other worlds = more characters per letter = smoother curves.
  // Dark letters on a light sky need dense characters, with a few light ones on the edges.
  const nm = asciiName({ text: NAME, cx: W / 2, baseline: 186, size: 140, maxW: 800, color: "#0E3B1C", cw: 3.4, lh: 5.8, ramp: " .:+*#%@@@" });
  return svgDoc({
    w: W, h: H, label: `${NAME}: ${TAGLINE}. A sunny sky with drifting clouds and birds.`,
    defs: `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4E9EEB"/><stop offset=".7" stop-color="#BFE3FF"/><stop offset="1" stop-color="#E9F7E6"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".25" stop-color="#FFE27A" stop-opacity=".95"/><stop offset="1" stop-color="#FFE27A" stop-opacity="0"/></radialGradient>
<radialGradient id="calm"><stop offset="0" stop-color="#F4FBFF" stop-opacity=".95"/><stop offset=".6" stop-color="#F4FBFF" stop-opacity=".8"/><stop offset="1" stop-color="#EAF6FF" stop-opacity="0"/></radialGradient>`,
    css: css + `text{${MONO}}
@keyframes flap{0%,49.9%{opacity:1}50%,100%{opacity:0}}.w0{fill:#2B3A55;font-size:13px;animation:flap .5s infinite}.w1{fill:#2B3A55;font-size:13px;animation:flap .5s infinite reverse}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}.sun{transform-box:fill-box;transform-origin:center;animation:pulse 6s ease-in-out infinite}
` + waveCss("#0E3B1C", "#2E8B3E", 12, 3.2),
    body: `<rect width="${W}" height="${H}" fill="url(#sky)"/><circle class="sun" cx="780" cy="70" r="120" fill="url(#sun)"/>${clouds}${birds}
<ellipse cx="${W / 2}" cy="${186 - nm.size * 0.3}" rx="${(nm.box.x2 - nm.box.x1) / 2 + 80}" ry="${nm.size * 0.7}" fill="url(#calm)"/>${nm.svg}${tagline(TAGLINE, W / 2, 228, "#1E3A5F", "#EAF6FF")}`,
  });
}

export function footer() {
  const H = 300, cw = 6, lh = 10, groundY = 230;
  let css = "";
  // grass: columns of blades, in clumps that sway at slightly different times
  let grass = "";
  const GREENS = ["#2F8F3A", "#3FA34D", "#56C15A", "#7AD36A"];
  for (let g = 0; g < 30; g++) {
    const x0 = g * 30;
    let t = "";
    for (let k = 0; k < 5; k++) for (let r = 0; r < 6 + Math.floor(hash(g, k, 2) * 4); r++) {
      const ch = r === 0 ? "," : ["|", "/", "\\", "|", "|"][Math.floor(hash(g, k + r * 7, 3) * 5)];
      t += `<text x="${x0 + k * cw}" y="${groundY + 64 - r * lh}" fill="${GREENS[Math.floor(hash(g, k, r) * 4)]}">${esc(ch)}</text>`;
    }
    grass += `<g style="transform-origin:${x0 + 12}px ${groundY + 64}px;animation:sway ${(3 + hash(g, 1, 9) * 2).toFixed(1)}s ease-in-out infinite;animation-delay:-${(g * 0.37).toFixed(2)}s">${t}</g>`;
  }
  css += `@keyframes sway{0%,100%{transform:skewX(-8deg)}50%{transform:skewX(8deg)}}`;
  // flowers
  let flowers = "";
  for (let i = 0; i < 26; i++) {
    const x = hash(i, 1, 4) * (W - 230) + 10, y = groundY + 14 + hash(i, 2, 4) * 40, col = ["#FF4D6D", "#FFD23F", "#FFFFFF", "#B57CFF", "#FF8FB1"][i % 5];
    flowers += `<text x="${x.toFixed(0)}" y="${y.toFixed(0)}" fill="${col}" style="font-size:14px">${i % 3 ? "*" : "@"}</text>`;
  }
  // the tree on the right edge: trunk of | and #, canopy of greens
  const tx = 770;
  let trunk = "";
  for (let r = 0; r < 9; r++) trunk += `<text x="${tx - 34 + (r > 6 ? -6 : 0)}" y="${groundY + 50 - r * lh}" fill="${r % 2 ? "#7A4E2D" : "#8E5B33"}">${r > 6 ? "/|##|\\" : " |##|"}</text>`;
  const canopy = blob([[14, 6, 5.5], [24, 4.5, 5], [32, 7, 5], [20, 10, 4.5], [10, 10, 3.5], [30, 11, 3.8]], 46, 16, cw, lh, tx - 150, groundY - 175, (d, c, r) => mix("#1F6B2C", "#7BD36E", Math.min(1, d * 0.7 + (r < 6 ? 0.3 : 0))), 31, " .:+*%&@#@");
  // apples: three hang still, one falls, rests on the grass, fades and grows back
  const apples = [[tx - 95, groundY - 120], [tx - 40, groundY - 140], [tx + 5, groundY - 95]].map(([x, y]) => `<text x="${x}" y="${y}" class="apple">●</text>`).join("");
  const fall = groundY + 30 - (groundY - 105);
  css += `@keyframes drop{0%,55%{transform:translateY(0);opacity:1}68%{transform:translateY(${fall}px)}72%{transform:translateY(${fall - 10}px)}76%,90%{transform:translateY(${fall}px);opacity:1}95%{transform:translateY(${fall}px);opacity:0}96%{transform:translateY(0);opacity:0}100%{transform:translateY(0);opacity:1}}
.apple{fill:#E11D2E;font-size:16px;font-family:Arial,sans-serif}.falling{animation:drop 9s ease-in infinite}`;
  const falling = `<text x="${tx - 70}" y="${groundY - 105}" class="apple falling">●</text>`;
  // small bush on the left edge
  const bush = blob([[8, 4, 3.2], [15, 3, 3.6], [22, 4.5, 3]], 30, 8, cw, lh, 6, groundY - 30, (d) => mix("#2E7D32", "#81C784", d * 0.8), 44, " .:+*%&@");
  return svgDoc({
    w: W, h: H, label: "A meadow made of text characters: swaying grass, flowers, and a tree whose red apple falls",
    defs: `<linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE3FF"/><stop offset="1" stop-color="#EAF7FF"/></linearGradient>
<linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CCB6B"/><stop offset="1" stop-color="#2F7D32"/></linearGradient>`,
    css: css + `text{${MONO};font-size:${lh}px}`,
    body: `<rect width="${W}" height="${H}" fill="url(#sky2)"/><ellipse cx="${W / 2}" cy="${groundY + 120}" rx="${W * 0.75}" ry="140" fill="url(#hill)"/>${bush}<g style="font-size:${lh}px">${trunk}${canopy}</g>${apples}${falling}${flowers}${grass}
<text x="${W / 2 - 60}" y="40" text-anchor="middle" fill="#2B4A6F" style="font-size:12px;font-weight:500;letter-spacing:2px">thanks for stopping by</text>`,
  });
}

// Divider 1: butterflies fluttering over a row of flowers.
export function butterflies() {
  const H = 120;
  let css = "", flies = "", flowers = "";
  for (let i = 0; i < 70; i++) {
    const x = (i / 70) * W + hash(i, 1, 3) * 10, col = ["#FF4D6D", "#FFD23F", "#FFFFFF", "#B57CFF", "#FF8FB1", "#5CC8FF"][i % 6];
    flowers += `<text x="${x.toFixed(0)}" y="${(H - 14 - hash(i, 2, 3) * 10).toFixed(0)}" fill="${col}" style="font-size:13px">${i % 2 ? "*" : "@"}</text><text x="${x.toFixed(0)}" y="${H - 2}" fill="#4E9A3A" style="font-size:12px">|</text>`;
  }
  [["#FF8A3D", 20, 13], ["#3B8EEA", 50, 17], ["#FF5FA2", 28, 15], ["#E0A800", 60, 19]].forEach(([col, y, dur], i) => {
    css += `@keyframes fly${i}{from{transform:translate(-40px,${y}px)}to{transform:translate(${W + 40}px,${y - 10}px)}}@keyframes hop${i}{0%,100%{transform:translateY(0)}50%{transform:translateY(-${14 + i * 3}px)}}`;
    flies += `<g style="animation:fly${i} ${dur}s linear infinite;animation-delay:-${i * 4}s"><g style="animation:hop${i} ${(1.6 + i * 0.3).toFixed(1)}s ease-in-out infinite"><text class="f0" fill="${col}">}|{</text><text class="f1" fill="${col}">&gt;|&lt;</text></g></g>`;
  });
  return svgDoc({
    w: W, h: H, label: "ASCII butterflies fluttering over a row of flowers",
    defs: `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDF0FF"/><stop offset="1" stop-color="#C7EBC0"/></linearGradient>`,
    css: css + `text{${MONO}}.f0,.f1{font-size:15px}@keyframes flap{0%,49.9%{opacity:1}50%,100%{opacity:0}}.f0{animation:flap .3s infinite}.f1{animation:flap .3s infinite reverse}`,
    body: `<rect width="${W}" height="${H}" fill="url(#bg)"/>${flowers}${flies}`,
  });
}

// Divider 2: sunflowers swaying in front of a wooden fence.
export function sunflowers() {
  const H = 160, ground = 150;
  let fence = "", flowers = "";
  for (let x = 0; x < W; x += 40) fence += `<rect x="${x + 4}" y="${ground - 70}" width="10" height="70" fill="#B98552"/><path d="M ${x + 4} ${ground - 70} l 5 -8 l 5 8 z" fill="#B98552"/>`;
  fence += `<rect x="0" y="${ground - 58}" width="${W}" height="7" fill="#9C6B3E"/><rect x="0" y="${ground - 28}" width="${W}" height="7" fill="#9C6B3E"/>`;
  for (let i = 0; i < 9; i++) {
    const cx = 50 + i * 100 + hash(i, 1, 2) * 20, top = 30 + hash(i, 2, 2) * 25;
    const shapes = [{ kind: "line", x1: cx, y1: ground, x2: cx, y2: top + 20, w: 4, color: "#3E8E3A", ramp: " :|" },
      { kind: "ellipse", cx: cx + 12, cy: (ground + top) / 2 + 20, rx: 12, ry: 5, color: "#4FA24A" },
      { kind: "circle", cx, cy: top + 14, r: 21, color: (d) => mix("#FFB000", "#FFE45C", d) },
      { kind: "circle", cx, cy: top + 14, r: 9, color: "#6B3E1F" }];
    // dense characters: on a light sky, thin ones like ":" would fade away
    flowers += `<g style="transform-origin:${cx.toFixed(0)}px ${ground}px;animation:sw ${(3.5 + hash(i, 3, 2) * 1.5).toFixed(1)}s ease-in-out infinite;animation-delay:-${(i * 0.6).toFixed(1)}s">${shapesAscii(shapes, { x0: cx - 26, y0: top - 10, w: 52, h: ground - top + 10, cw: 4.6, lh: 7.6, seed: i + 1, ramp: " +#%@@@@", grain: 0.08 })}</g>`;
  }
  return svgDoc({
    w: W, h: H, label: "ASCII sunflowers swaying in front of a wooden fence",
    defs: `<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD3FF"/><stop offset="1" stop-color="#E6F6FF"/></linearGradient>`,
    css: `text{${MONO};font-size:7.6px}@keyframes sw{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}`,
    body: `<rect width="${W}" height="${H}" fill="url(#sk)"/>${fence}${flowers}<rect x="0" y="${ground}" width="${W}" height="${H - ground}" fill="#5DAE45"/>`,
  });
}
