// npm run readmes  ->  previews/*.md (one README per world, plus "phases": all four in one page)
// The text lives here once; each version only changes which pictures go around it.
import fs from "node:fs";
import path from "node:path";

const img = (file, alt, base) => `<img src="${base}assets/${file}" alt="${alt}" width="100%">`;

// The page content, split in parts so pictures can go between them.
const INTRO = `### hey, I'm Adam 👋

Second-year computer science student (BUT Informatique, data track) at IUT Toulouse.
I build apps with data at their core, ship small tools that people actually use, and I'm slowly
getting into **creative code**, where engineering meets art. Every banner on this page is made of code.

🎯 **Open to a work-study position (alternance)** in development, data or databases from **February 2027**,
in or around Toulouse.

<a href="https://chromewebstore.google.com/detail/musicmax/ofhnlejlgcdpbbcbchlgeoeiljaageij"><img src="https://img.shields.io/chrome-web-store/users/ofhnlejlgcdpbbcbchlgeoeiljaageij?style=flat-square&label=MusicMax%20users&color=1DB954" alt="MusicMax users"></a>&nbsp;<a href="https://buymeacoffee.com/thock"><img src="https://img.shields.io/badge/Buy%20me%20a%20coffee-thock-FFC93C?style=flat-square&logo=buymeacoffee&logoColor=black" alt="Buy me a coffee"></a>`;

const PROJECTS = (base) => `### what I've built

<table>
<tr>
<td width="50%" valign="top">

<img src="https://raw.githubusercontent.com/Allouche-Adam/MusicMax/main/icons/icon128.png" width="40" align="left" alt="">

**[MusicMax](https://github.com/Allouche-Adam/MusicMax)**<br>
Lyrics for the songs Spotify Web is missing: synced, karaoke, translations. Chrome & Firefox.

</td>
<td width="50%" valign="top">

<img src="https://raw.githubusercontent.com/Allouche-Adam/EffortCam/main/docs/logo.png" width="40" align="left" alt="">

**[Effortcam](https://github.com/Allouche-Adam/EffortCam)**<br>
Proof of effort: a timelapse screen recorder + focus timer for Windows. Ends every session with a video of how long you really worked.

</td>
</tr>
<tr>
<td width="50%" valign="top">

**MeetTogether** · *coming to the Chrome Web Store*<br>
Video chat with strangers on ome.tv & umingle, together with up to 5 friends on one shared camera. Friends join from a link.

<img src="${base}assets/meettogether.png" alt="Six friends on one shared camera in MeetTogether" width="100%">

</td>
<td width="50%" valign="top">

**[Pair Narrator](https://github.com/Allouche-Adam/pair-narrator)** 🎙️<br>
A Claude Code plugin that talks you through what the AI is building, and why. Out loud, if you want. Made for learners.

**[Épure](https://github.com/Allouche-Adam/Epure)** · [live](https://epure-cleaner.vercel.app)<br>
Cleans your browser's password export (duplicates, weak and reused passwords) without sending it anywhere.

**[Buildune](https://github.com/Allouche-Adam/Buildune)**<br>
A personal brand kit generator: LinkedIn and GitHub banners, palette, fonts and resume copy.

</td>
</tr>
</table>`;

const STACK = `### what I use

**data:** \`SQL\` \`PL/SQL\` \`PostgreSQL\` \`Oracle APEX\` \`Python\`<br>
**dev:** \`Java\` \`JavaScript\` \`TypeScript\` \`Next.js\` \`Node.js\` \`Supabase\` \`WebRTC\` \`Playwright\`<br>
**tools:** \`Git\` \`Vercel\` \`Claude Code\`

### right now

- 🧪 building **SkillSwiper**: helps anyone (not just developers) find and install AI tools through short videos and plain-language search
- 🎨 next: creative coding, the art side of computer science
- 📚 writing down every decision, so I understand my own code`;

const CREDIT = (base) => `<div align="center"><sub>every picture on this page is code: text characters and shapes, animated. <a href="${base}tools/">here's how</a>.</sub></div>`;

const page = (base, parts) => parts.join("\n\n") + "\n";

const WORLDS = {
  ocean: { emoji: "🌊", alt: "the ocean", d1: "rolling waves with a fish", d2: "glowing jellyfish" },
  spirit: { emoji: "🔮", alt: "flowing colors", d1: "flowing colors", d2: "a constellation drawing itself" },
  meadow: { emoji: "🌳", alt: "a sunny meadow", d1: "butterflies over flowers", d2: "sunflowers by a fence" },
  anime: { emoji: "🌸", alt: "an anime sunset", d1: "a city at sunset", d2: "a train crossing a bridge at dusk" },
};
const nameAlt = "Adam Allouche, in animated ASCII art: dev, data, creative code, open to work-study 2027";
const scene = (k, part, alt, base) => img(`${k}-${part}.svg`, alt, base);

// GitHub has no buttons or tabs, but <details> opens in place when clicked:
// each world can be previewed without leaving the page.
const PICK = (base) => `### pick a world

${Object.entries(WORLDS).map(([k, w]) => `<details><summary><b>${w.emoji} ${k}</b></summary>

${scene(k, "header", `${nameAlt}, over ${w.alt}`, base)}
${scene(k, "div1", w.d1, base)}
${scene(k, "div2", w.d2, base)}
${scene(k, "footer", `${w.alt}, footer`, base)}

</details>`).join("\n")}`;

export function build(base = "../") {
  const out = {};
  for (const [k, w] of Object.entries(WORLDS)) {
    out[k] = page(base, [scene(k, "header", `${nameAlt}, over ${w.alt}`, base), INTRO, scene(k, "div1", w.d1, base), PROJECTS(base),
      scene(k, "div2", w.d2, base), STACK, scene(k, "footer", `${w.alt}, animated`, base), CREDIT(base)]);
  }
  // all four worlds in one scroll: sea -> colors -> city sunset -> meadow, then pick a world
  out.phases = page(base, [
    scene("ocean", "header", `${nameAlt}, over the ocean`, base), INTRO,
    scene("spirit", "div1", "flowing colors", base), PROJECTS(base),
    scene("anime", "div1", "an anime sunset over the city", base), STACK,
    scene("meadow", "footer", "a meadow with a tree whose apple falls", base), PICK(base), CREDIT(base),
  ]);
  return out;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const dir = path.join(import.meta.dirname, "..", "previews");
  fs.mkdirSync(dir, { recursive: true });
  for (const [k, md] of Object.entries(build("../"))) {
    fs.writeFileSync(path.join(dir, `${k}.md`), md);
    console.log(`  previews/${k}.md`);
  }
  // The real profile page: the version picked (change MAIN to switch worlds).
  const MAIN = "phases";
  fs.writeFileSync(path.join(import.meta.dirname, "..", "README.md"), build("")[MAIN]);
  console.log(`  README.md = ${MAIN}`);
}
