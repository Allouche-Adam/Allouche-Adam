// World 2: spirit. Glowing color clouds flowing into each other, sparkles, and a rotating ASCII mandala.
import { hash, mix, svgDoc, asciiName, waveCss, tagline, MONO, NAME, TAGLINE, esc } from "../lib.mjs";

const W = 900, BG = "#0B0614";
const COLORS = ["#FF5FA2", "#8B5CF6", "#22D3EE", "#FBBF24", "#F472B6", "#34D399"];

// Big soft circles that drift on looping paths; blurred and blended with "screen"
// so where two overlap they mix into a brighter new color, like paint in water.
function clouds(H, n, seed) {
  let css = "", svg = "";
  for (let i = 0; i < n; i++) {
    const r = 110 + hash(i, 1, seed) * 110, x = hash(i, 2, seed) * W, y = hash(i, 3, seed) * H;
    const dx = (hash(i, 4, seed) - 0.5) * 260, dy = (hash(i, 5, seed) - 0.5) * 120, dur = 14 + hash(i, 6, seed) * 12;
    css += `@keyframes c${seed}${i}{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(${dx.toFixed(0)}px,${dy.toFixed(0)}px) scale(1.15)}66%{transform:translate(${(-dx * 0.6).toFixed(0)}px,${(dy * 0.8).toFixed(0)}px) scale(.9)}}`;
    svg += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="${COLORS[(i + seed) % COLORS.length]}" opacity=".75" style="mix-blend-mode:screen;transform-box:fill-box;transform-origin:center;animation:c${seed}${i} ${dur.toFixed(1)}s ease-in-out infinite;animation-delay:-${(i * 2.3).toFixed(1)}s"/>`;
  }
  return { css, svg: `<g filter="url(#blur)">${svg}</g>` };
}
const BLUR = (H) => `<filter id="blur" filterUnits="userSpaceOnUse" x="-200" y="-200" width="${W + 400}" height="${H + 400}"><feGaussianBlur stdDeviation="48"/></filter>`;

function sparkles(H, n, seed) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = (hash(i, 7, seed) * W).toFixed(0), y = (hash(i, 8, seed) * H).toFixed(0), d = (2 + hash(i, 9, seed) * 3).toFixed(1);
    s += `<text class="spk" x="${x}" y="${y}" style="font-size:${(9 + hash(i, 10, seed) * 9).toFixed(0)}px;animation-duration:${d}s;animation-delay:-${(hash(i, 11, seed) * d).toFixed(1)}s">${["✦", "·", "*", "✧"][i % 4]}</text>`;
  }
  return s;
}
const SPK_CSS = `@keyframes tw{0%,100%{opacity:.1}50%{opacity:.95}}.spk{fill:#FFF3FB;animation:tw ease-in-out infinite;font-family:Arial,sans-serif}`;

export function header({ withName = true } = {}) {
  const H = withName ? 330 : 120;
  const cl = clouds(H, withName ? 7 : 6, withName ? 1 : 2);
  const nm = withName && asciiName({ text: NAME, cx: W / 2, baseline: 176, size: 140, maxW: 800, color: "#FFFFFF" });
  const calm = nm ? `<ellipse cx="${W / 2}" cy="${176 - nm.size * 0.3}" rx="${(nm.box.x2 - nm.box.x1) / 2 + 80}" ry="${nm.size * 0.7}" fill="url(#calm)"/>` : "";
  return svgDoc({
    w: W, h: H, label: withName ? `${NAME}: ${TAGLINE}. Glowing colors flow behind the name.` : "Flowing glowing colors",
    defs: `${BLUR(H)}<radialGradient id="calm"><stop offset="0" stop-color="${BG}" stop-opacity=".55"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    css: cl.css + SPK_CSS + waveCss("#FFFFFF", "#FFD1F0", 12, 3.6) + `text{${MONO}}`,
    body: `<rect width="${W}" height="${H}" fill="${BG}"/>${cl.svg}${sparkles(H, withName ? 30 : 16, 1)}${calm}${nm ? `<g filter="url(#glow)">${nm.svg}</g>${tagline(TAGLINE, W / 2, 216, "#FFE4F5", "#2A1236")}` : ""}`,
  });
}

// Footer: an ASCII mandala. Each ring is a circle of characters that turns,
// every other ring the other way, colored from pink to gold.
export function footer() {
  const H = 300, cx = W / 2, cy = 150;
  const ringChars = ["*", "o", "+", "◇", ":", "✦", "·", "=", "o"];
  let rings = "", css = "";
  for (let k = 0; k < 9; k++) {
    const r = 16 + k * 14, n = Math.max(6, Math.round((2 * Math.PI * r) / (k % 2 ? 11 : 9)));
    const col = mix(COLORS[k % 3 === 0 ? 0 : k % 3 === 1 ? 1 : 2], COLORS[3], k / 12);
    let t = "";
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      const ch = (k === 4 || k === 7) && j % 2 ? "·" : ringChars[k];
      t += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" transform="rotate(${((a * 180) / Math.PI + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${esc(ch)}</text>`;
    }
    const dur = 24 + k * 6, dir = k % 2 ? "reverse" : "normal";
    rings += `<g fill="${col}" style="transform-origin:${cx}px ${cy}px;animation:spin ${dur}s linear infinite ${dir}">${t}</g>`;
  }
  css += `@keyframes spin{to{transform:rotate(360deg)}}@keyframes breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.25);opacity:1}}`;
  const cl = clouds(H, 5, 3);
  return svgDoc({
    w: W, h: H, label: "A rotating mandala made of text characters, over flowing colors",
    defs: BLUR(H),
    css: cl.css + css + SPK_CSS + `text{${MONO};font-size:13px}`,
    body: `<rect width="${W}" height="${H}" fill="${BG}"/><g opacity=".55">${cl.svg}</g>${sparkles(H, 20, 4)}${rings}
<text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#FFF3FB" style="font-size:20px;transform-origin:${cx}px ${cy}px;animation:breathe 6s ease-in-out infinite">@</text>
<text x="${cx}" y="${H - 16}" text-anchor="middle" fill="#E9D5FF" style="font-size:12px;font-weight:500;letter-spacing:2px">breathe in · build things · breathe out</text>`,
  });
}

// Divider 2: a constellation that draws itself, line by line, then fades and starts over.
export function constellation() {
  const H = 140;
  const pts = [[60, 90], [140, 50], [230, 78], [300, 40], [390, 70], [470, 30], [560, 64], [640, 44], [720, 92], [810, 56], [870, 86]];
  let lines = "", dots = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], len = Math.hypot(x2 - x1, y2 - y1).toFixed(0);
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORS[i % COLORS.length]}" stroke-width="1.4" stroke-dasharray="${len}" style="--l:${len};stroke-dashoffset:${len};animation:draw 9s ease-in-out infinite;animation-delay:${(i * 0.35).toFixed(2)}s"/>`;
  }
  pts.forEach(([x, y], i) => { dots += `<text x="${x}" y="${y + 5}" text-anchor="middle" class="st" style="animation-delay:-${(i * 0.4).toFixed(1)}s">✦</text>`; });
  const cl = clouds(H, 4, 6);
  return svgDoc({
    w: W, h: H, label: "A constellation drawing itself between twinkling stars",
    defs: BLUR(H),
    css: cl.css + SPK_CSS + `@keyframes draw{0%{stroke-dashoffset:var(--l);opacity:.9}45%,75%{stroke-dashoffset:0;opacity:.9}95%,100%{stroke-dashoffset:0;opacity:0}}
@keyframes twk{0%,100%{opacity:.5}50%{opacity:1}}.st{fill:#FFF3FB;font-size:15px;font-family:Arial,sans-serif;animation:twk 2.6s ease-in-out infinite}`,
    body: `<rect width="${W}" height="${H}" fill="${BG}"/><g opacity=".35">${cl.svg}</g>${sparkles(H, 18, 9)}${lines}${dots}`,
  });
}
