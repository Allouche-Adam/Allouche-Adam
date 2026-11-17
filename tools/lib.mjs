// Shared tools for every scene: the ASCII name, colors, and small helpers.
//
// Why SVG: GitHub READMEs can't run JavaScript or page CSS, but an SVG image
// can carry its own CSS animations. So every scene is an animated SVG strip.
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Repeatable "random" number 0..1 from a few integers (same input = same output, so the art is stable).
export const hash = (a, b, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// Mix two #rrggbb colors; k = 0 gives a, 1 gives b.
export const mix = (a, b, k) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join("");
};

export const MONO = `font-family:ui-monospace,SFMono-Regular,Consolas,Menlo,monospace;white-space:pre;font-weight:700`;

// One line of characters, each with its own color -> <text> with a <tspan> per color run.
// textLength pins the line to an exact width so every monospace font lines up the same.
export function charLine(cells, x, y, cw, cls = "") {
  let out = "", run = "", color = null;
  const flush = () => { if (run) out += color ? `<tspan fill="${color}">${esc(run)}</tspan>` : esc(run); run = ""; };
  for (const c of cells) {
    const col = c && c.ch !== " " ? c.color : null;
    if (col !== color) { flush(); color = col; }
    run += c ? c.ch : " ";
  }
  flush();
  return `<text${cls ? ` class="${cls}"` : ""} x="${x.toFixed(1)}" y="${y.toFixed(1)}" textLength="${(cells.length * cw).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${out}</text>`;
}

// The whole svg wrapper: size, rounded corners, a <style> block and the content.
export function svgDoc({ w, h, label, css, defs = "", body, radius = 18 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<defs><clipPath id="frame"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath>${defs}</defs>
<style>${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<g clip-path="url(#frame)">${body}</g>
</svg>`;
}

export function save(name, svg) {
  const out = path.join(import.meta.dirname, "..", "assets", name);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg);
  console.log(`  assets/${name}  ${(svg.length / 1024).toFixed(0)} KB`);
}

// ---------------- the ASCII name ----------------
// The letters come from a font file (Instrument Serif Italic), get turned into
// polygons, and are laid on a grid of tiny cells. For each cell we test 16 points:
// the share inside the letter ("coverage") picks a character, dense in the middle
// (@%#) and light on the edges (:-.), which keeps the curves smooth.
const FONT_FILE = path.join(import.meta.dirname, "fonts", "InstrumentSerif-Italic.woff");
const buf = fs.readFileSync(FONT_FILE);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const RAMP = " .:-=+*#%@";

function polygons(cmds) {
  const polys = []; let cur = [], x = 0, y = 0;
  const N = 10;
  for (const c of cmds) {
    if (c.type === "M") { if (cur.length) polys.push(cur); cur = [[c.x, c.y]]; }
    else if (c.type === "L") cur.push([c.x, c.y]);
    else if (c.type === "Q") for (let i = 1; i <= N; i++) { const t = i / N, a = 1 - t; cur.push([a * a * x + 2 * a * t * c.x1 + t * t * c.x, a * a * y + 2 * a * t * c.y1 + t * t * c.y]); }
    else if (c.type === "C") for (let i = 1; i <= N; i++) { const t = i / N, a = 1 - t; cur.push([a ** 3 * x + 3 * a * a * t * c.x1 + 3 * a * t * t * c.x2 + t ** 3 * c.x, a ** 3 * y + 3 * a * a * t * c.y1 + 3 * a * t * t * c.y2 + t ** 3 * c.y]); }
    else if (c.type === "Z") { if (cur.length) polys.push(cur); cur = []; }
    if (c.x !== undefined) { x = c.x; y = c.y; }
  }
  if (cur.length) polys.push(cur);
  return polys;
}
// "Non-zero winding": count how the outline circles the point; 0 means outside.
function inside(polys, px, py) {
  let w = 0;
  for (const p of polys) for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length], side = (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1);
    if (y1 <= py) { if (y2 > py && side > 0) w++; } else if (y2 <= py && side < 0) w--;
  }
  return w !== 0;
}

// Returns the name as SVG: one <g class="lt"> per letter (so each letter can wave on
// its own), plus its bounding box. `color` is the letters' resting color; animate
// `fill` on .lt in the scene's CSS for a shimmer.
// ramp: characters from faint to dense. Dark letters on a light sky need a "heavier" ramp to read.
export function asciiName({ text, cx, baseline, size, maxW, cw = 4.6, lh = 7.6, color = "#F2F5FF", delayStep = 0.11, ramp = RAMP }) {
  let bb = font.getPath(text, 0, 0, size).getBoundingBox();
  if (bb.x2 - bb.x1 > maxW) { size *= maxW / (bb.x2 - bb.x1); bb = font.getPath(text, 0, 0, size).getBoundingBox(); }
  const x0 = cx - (bb.x2 - bb.x1) / 2 - bb.x1;
  const letters = font.getPaths(text, x0, baseline, size).map((gp, i) => {
    const b = gp.getBoundingBox(); if (!isFinite(b.x1)) return "";
    const polys = polygons(gp.commands);
    const c0 = Math.floor(b.x1 / cw), c1 = Math.ceil(b.x2 / cw), r0 = Math.floor(b.y1 / lh), r1 = Math.ceil(b.y2 / lh);
    let rows = "";
    for (let r = r0; r < r1; r++) {
      let line = "";
      for (let c = c0; c < c1; c++) {
        let hit = 0;
        for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) if (inside(polys, (c + (sx + 0.5) / 4) * cw, (r + (sy + 0.5) / 4) * lh)) hit++;
        const cov = hit / 16;
        line += cov < 0.07 ? " " : ramp[Math.max(1, Math.round(cov * (ramp.length - 1)))];
      }
      if (line.trim()) rows += `<text x="${(c0 * cw).toFixed(1)}" y="${((r + 0.8) * lh).toFixed(1)}" textLength="${((c1 - c0) * cw).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${esc(line)}</text>`;
    }
    return `<g class="lt" fill="${color}" style="animation-delay:${(i * delayStep).toFixed(2)}s">${rows}</g>`;
  }).join("");
  const box = { x1: x0 + bb.x1, x2: x0 + bb.x2, y1: baseline + bb.y1, y2: baseline + bb.y2 };
  return { svg: `<g style="font-size:${lh}px;${MONO}">${letters}</g>`, box, size };
}

// Wave CSS for the name: each letter rises and falls, shifting between two colors.
export const waveCss = (rest, peak, lift = 12, seconds = 3.2) =>
  `@keyframes wave{0%,100%{transform:translateY(0);fill:${rest}}25%{transform:translateY(-${lift}px);fill:${peak}}50%{transform:translateY(0);fill:${rest}}}.lt{animation:wave ${seconds}s ease-in-out infinite}`;

// Tagline under the name, with an outline in the background color so it stays readable.
export const tagline = (text, x, y, color, outline) =>
  `<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" stroke="${outline}" stroke-width="5" stroke-linejoin="round" style="paint-order:stroke;font-family:ui-monospace,Consolas,Menlo,monospace;font-size:13px;font-weight:500;letter-spacing:.4px">${esc(text)}</text>`;

export const NAME = "Adam Allouche";
export const TAGLINE = "dev · data · creative code · open to work-study 2027";

// ---------------- any drawing -> ASCII ----------------
// Draw with simple shapes (in px), get colored characters back. Used for the
// characters, jellyfish, flowers, trains... Later shapes in the list sit on top.
//   { kind: "circle", cx, cy, r }            { kind: "ellipse", cx, cy, rx, ry }
//   { kind: "poly", pts: [[x,y],...] }       { kind: "line", x1, y1, x2, y2, w }
// each also has `color` (and optional `ramp`, e.g. "|" strokes for a blade).
const segDist = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
};
function hit(s, x, y) {
  if (s.kind === "circle") return Math.hypot(x - s.cx, y - s.cy) <= s.r;
  if (s.kind === "ellipse") return ((x - s.cx) / s.rx) ** 2 + ((y - s.cy) / s.ry) ** 2 <= 1;
  if (s.kind === "line") return segDist(x, y, s.x1, s.y1, s.x2, s.y2) <= s.w / 2;
  return inside([s.pts], x, y);
}
export function shapesAscii(shapes, { x0, y0, w, h, cw, lh, ramp = RAMP, seed = 1, grain = 0.18 }) {
  const cols = Math.ceil(w / cw), rows = Math.ceil(h / lh);
  let out = "";
  for (let r = 0; r < rows; r++) {
    const cells = [];
    for (let c = 0; c < cols; c++) {
      let best = null, bestCov = 0;
      for (const s of shapes) {
        let n = 0;
        for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) if (hit(s, x0 + (c + (sx + 0.5) / 3) * cw, y0 + (r + (sy + 0.5) / 3) * lh)) n++;
        if (n && n / 9 >= bestCov * 0.6) { best = s; bestCov = Math.max(bestCov, n / 9); }
      }
      if (!best || bestCov < 0.12) { cells.push(null); continue; }
      const rp = best.ramp || ramp;
      const d = Math.min(1, Math.max(0.05, bestCov + (hash(c, r, seed) - 0.5) * grain * 2));
      cells.push({ ch: rp[Math.max(rp.length > 2 ? 1 : 0, Math.min(rp.length - 1, Math.round(d * (rp.length - 1))))], color: typeof best.color === "function" ? best.color(d, c, r) : best.color });
    }
    if (cells.some(Boolean)) out += charLine(cells, x0, y0 + (r + 0.8) * lh, cw);
  }
  return out;
}
