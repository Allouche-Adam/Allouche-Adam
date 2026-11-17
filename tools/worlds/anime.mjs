// World 4: anime atmosphere (no characters, just the mood): a sunset with a striped
// retro sun, a city skyline with twinkling windows, power lines and falling cherry
// petals; the footer is the same city at night under a crescent moon.
import { hash, mix, svgDoc, asciiName, waveCss, tagline, shapesAscii, MONO, NAME, TAGLINE } from "../lib.mjs";

const W = 900;

// City silhouette: buildings of random heights, with windows that light up and dim.
function skyline(H, base, seed, color, winColor) {
  let b = "", wins = "", x = -10;
  let i = 0;
  while (x < W) {
    const bw = 30 + hash(i, 1, seed) * 50, bh = 22 + hash(i, 2, seed) * Math.min(70, H * 0.2);
    b += `<rect x="${x.toFixed(0)}" y="${(base - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${(bh + 40).toFixed(0)}" fill="${color}"/>`;
    for (let wy = base - bh + 8; wy < base - 6; wy += 10) for (let wx = x + 5; wx < x + bw - 6; wx += 9) {
      if (hash(Math.round(wx), Math.round(wy), seed) > 0.72) {
        const d = (3 + hash(Math.round(wx), 3, seed) * 6).toFixed(1);
        wins += `<rect class="win" x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="4" height="5" fill="${winColor}" style="animation-duration:${d}s;animation-delay:-${(hash(Math.round(wy), 5, seed) * d).toFixed(1)}s"/>`;
      }
    }
    x += bw + 2; i++;
  }
  return b + wins;
}
const WIN_CSS = `@keyframes win{0%,100%{opacity:.25}40%,70%{opacity:1}}.win{animation:win ease-in-out infinite}`;

// Power lines: two poles and sagging wires between them and off the edges.
function powerLines(base, color) {
  const poles = [210, 640];
  let s = "";
  for (const px of poles) s += `<rect x="${px}" y="${base - 150}" width="5" height="160" fill="${color}"/><rect x="${px - 26}" y="${base - 140}" width="57" height="4" fill="${color}"/><rect x="${px - 18}" y="${base - 118}" width="41" height="3" fill="${color}"/>`;
  for (const [y, sag] of [[-138, 26], [-116, 20], [-138, 30]]) {
    s += `<path d="M -20 ${base + y + 6} Q ${poles[0] / 2} ${base + y + sag + 6} ${poles[0] + 2} ${base + y} Q ${(poles[0] + poles[1]) / 2} ${base + y + sag * 1.6} ${poles[1] + 2} ${base + y} Q ${(poles[1] + W) / 2} ${base + y + sag} ${W + 20} ${base + y + 8}" stroke="${color}" stroke-width="1.4" fill="none"/>`;
  }
  return s;
}

// Cherry petals: small pink shapes drifting down and sideways while spinning.
function petals(H, n, seed) {
  let s = "", css = "";
  for (let i = 0; i < n; i++) {
    const x = hash(i, 1, seed) * (W + 200) - 100, d = 7 + hash(i, 2, seed) * 8, drift = 80 + hash(i, 3, seed) * 140;
    css += `@keyframes pt${seed}${i}{from{transform:translate(${x.toFixed(0)}px,-20px) rotate(0)}to{transform:translate(${(x + drift).toFixed(0)}px,${H + 20}px) rotate(${(360 + hash(i, 4, seed) * 360).toFixed(0)}deg)}}`;
    s += `<g style="animation:pt${seed}${i} ${d.toFixed(1)}s linear infinite;animation-delay:-${(hash(i, 5, seed) * d).toFixed(1)}s"><ellipse rx="${(3 + hash(i, 6, seed) * 2.5).toFixed(1)}" ry="${(2 + hash(i, 7, seed) * 1.5).toFixed(1)}" fill="${i % 3 ? "#FFB7D5" : "#FFD9E8"}" opacity=".9"/></g>`;
  }
  return { s, css };
}

function stars(H, n, seed, maxY) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const d = (2 + hash(i, 3, seed) * 3).toFixed(1);
    s += `<circle class="star" cx="${(hash(i, 1, seed) * W).toFixed(0)}" cy="${(hash(i, 2, seed) * maxY).toFixed(0)}" r="${(0.6 + hash(i, 4, seed)).toFixed(1)}" style="animation-duration:${d}s;animation-delay:-${(hash(i, 5, seed) * d).toFixed(1)}s"/>`;
  }
  return s;
}
const STAR_CSS = `@keyframes tw{0%,100%{opacity:.2}50%{opacity:1}}.star{fill:#FFF;animation:tw ease-in-out infinite}`;

// The retro sun: a big gradient circle cut by horizontal stripes that get thicker lower down.
function retroSun(cx, cy, r) {
  let stripes = "";
  for (let k = 0; k < 7; k++) { const y = cy + k * (r / 7) - 4, h = 2 + k * 1.6; stripes += `<rect x="${cx - r}" y="${y.toFixed(0)}" width="${2 * r}" height="${h.toFixed(1)}" fill="black"/>`; }
  return `<mask id="cut"><rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="white"/>${stripes}</mask>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sungrad)" mask="url(#cut)"/>`;
}

export function header({ withName = true } = {}) {
  const H = withName ? 330 : 150, base = H - 30;
  const pt = petals(H, withName ? 24 : 14, withName ? 1 : 2);
  const nm = withName && asciiName({ text: NAME, cx: W / 2, baseline: 150, size: 140, maxW: 800, color: "#FFFFFF" });
  const calm = nm ? `<ellipse cx="${W / 2}" cy="${150 - nm.size * 0.3}" rx="${(nm.box.x2 - nm.box.x1) / 2 + 80}" ry="${nm.size * 0.7}" fill="url(#calm)"/>` : "";
  return svgDoc({
    w: W, h: H, label: withName ? `${NAME}: ${TAGLINE}. An anime-style sunset over a city with falling cherry petals.` : "Anime sunset over a city, with power lines and falling cherry petals",
    defs: `<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B1040"/><stop offset=".35" stop-color="#5B2A86"/><stop offset=".65" stop-color="#D9468F"/><stop offset=".85" stop-color="#FF8A5B"/><stop offset="1" stop-color="#FFC46B"/></linearGradient>
<linearGradient id="sungrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="#FF5FA2"/></linearGradient>
<radialGradient id="calm"><stop offset="0" stop-color="#2A0F45" stop-opacity=".6"/><stop offset="1" stop-color="#2A0F45" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    css: WIN_CSS + STAR_CSS + pt.css + waveCss("#FFFFFF", "#FFC2DD", 12, 3.2) + `text{${MONO}}`,
    body: `<rect width="${W}" height="${H}" fill="url(#dusk)"/>${stars(H, 30, 1, H * 0.35)}${retroSun(W * 0.72, base - (withName ? 105 : 60), withName ? 95 : 60)}
${skyline(H, base, 3, "#2A0F45", "#FFD27A")}${powerLines(base, "#1A0830")}${pt.s}
${calm}${nm ? `<g filter="url(#glow)">${nm.svg}</g>${tagline(TAGLINE, W / 2, 192, "#FFE3F0", "#3A1450")}` : ""}`,
  });
}

// Big pink ASCII peonies (from the ink-brush manga mood), standing on the rooftop.
function peonies() {
  const petal = (d) => mix("#E8246F", "#FFC6DF", Math.min(1, d * 0.9));
  return [
    { kind: "ellipse", cx: 380, cy: 290, rx: 26, ry: 8, color: "#5DAE45" },
    { kind: "ellipse", cx: 540, cy: 292, rx: 30, ry: 8, color: "#5DAE45" },
    { kind: "line", x1: 460, y1: 300, x2: 450, y2: 240, w: 4, color: "#4E9A3A" },
    { kind: "line", x1: 520, y1: 300, x2: 528, y2: 262, w: 3, color: "#4E9A3A" },
    { kind: "circle", cx: 448, cy: 226, r: 36, color: petal },
    { kind: "circle", cx: 470, cy: 214, r: 26, color: petal },
    { kind: "circle", cx: 428, cy: 214, r: 22, color: petal },
    { kind: "circle", cx: 530, cy: 256, r: 22, color: petal },
    { kind: "circle", cx: 392, cy: 278, r: 16, color: petal },
  ];
}

export function footer() {
  const H = 360, ground = 306;
  const pt = petals(H, 22, 3);
  const fl = shapesAscii(peonies(), { x0: 350, y0: 180, w: 230, h: 126, cw: 4.6, lh: 7.6, grain: 0.2, seed: 4 });
  return svgDoc({
    w: W, h: H, label: "Night rooftop under a crescent moon, with pink ASCII peonies and falling petals",
    defs: `<linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070418"/><stop offset="1" stop-color="#2B1250"/></linearGradient>
<radialGradient id="moonglow"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".5"/><stop offset="1" stop-color="#FFF6D6" stop-opacity="0"/></radialGradient>
<mask id="crescent"><rect width="${W}" height="${H}" fill="white"/><circle cx="${W * 0.5 + 16}" cy="66" r="34" fill="black"/></mask>`,
    css: WIN_CSS + STAR_CSS + pt.css + `text{${MONO};font-size:7.6px}
@keyframes shoot{0%,88%{transform:translate(0,0);opacity:0}90%{opacity:1}96%{transform:translate(-260px,110px);opacity:0}100%{opacity:0}}.shoot{animation:shoot 9s linear infinite}`,
    body: `<rect width="${W}" height="${H}" fill="url(#night)"/>${stars(H, 60, 7, H * 0.6)}
<circle cx="${W * 0.5}" cy="76" r="90" fill="url(#moonglow)"/><circle cx="${W * 0.5}" cy="76" r="38" fill="#FFF3C9" mask="url(#crescent)"/>
<g class="shoot"><line x1="${W * 0.85}" y1="30" x2="${W * 0.85 + 60}" y2="5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".9"/></g>
<g opacity=".55">${skyline(H, ground + 6, 9, "#1A0B33", "#FFC46B")}</g>
<rect x="0" y="${ground}" width="${W}" height="${H - ground}" fill="#0C0518"/><rect x="0" y="${ground}" width="${W}" height="2" fill="#3A2160"/>
${fl}${pt.s}
<text x="${W * 0.5}" y="148" text-anchor="middle" fill="#F5E6FF" style="font-family:'Yu Gothic','Hiragino Sans','Noto Sans JP',sans-serif;font-size:24px;letter-spacing:4px;font-weight:400">またね</text>
<text x="${W * 0.5}" y="168" text-anchor="middle" fill="#C9B6E8" style="font-family:ui-monospace,Consolas,Menlo,monospace;font-size:11px;letter-spacing:3px;font-weight:400">see you · thanks for stopping by</text>`,
  });
}

// Divider 2: a train crosses a bridge at dusk, its windows lit, petals in the air.
export function train() {
  const H = 130, deck = 92;
  const pt = petals(H, 10, 5);
  let arches = "";
  for (let x = -20; x < W + 60; x += 70) arches += `<path d="M ${x} ${H} L ${x} ${deck + 8} Q ${x + 35} ${deck + 34} ${x + 70} ${deck + 8} L ${x + 70} ${H}" fill="none" stroke="#2A0F45" stroke-width="7"/>`;
  let cars = "";
  for (let c = 0; c < 6; c++) {
    const x = c * 112;
    cars += `<rect x="${x}" y="${deck - 30}" width="106" height="28" rx="${c === 0 ? 10 : 3}" fill="#1E0A36"/>`;
    for (let w = 0; w < 6; w++) cars += `<rect x="${x + 8 + w * 16}" y="${deck - 24}" width="10" height="9" fill="#FFD27A" opacity="${hash(c, w, 1) > 0.25 ? 0.95 : 0.3}"/>`;
  }
  return svgDoc({
    w: W, h: H, label: "A train with lit windows crossing a bridge at dusk",
    defs: `<linearGradient id="dusk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1A6E"/><stop offset=".6" stop-color="#D9468F"/><stop offset="1" stop-color="#FF9A5A"/></linearGradient>`,
    css: pt.css + STAR_CSS + `@keyframes ride{from{transform:translateX(${W + 40}px)}to{transform:translateX(-720px)}}.train{animation:ride 11s linear infinite}`,
    body: `<rect width="${W}" height="${H}" fill="url(#dusk2)"/>${stars(H, 14, 9, 40)}<g class="train">${cars}</g>
<rect x="0" y="${deck}" width="${W}" height="8" fill="#2A0F45"/><rect x="0" y="${deck - 2}" width="${W}" height="2" fill="#5B2A86"/>${arches}${pt.s}`,
  });
}
