// npm run build  ->  every scene in assets/ (each world: header, 2 dividers, footer)
import { save } from "./lib.mjs";
import * as ocean from "./worlds/ocean.mjs";
import * as spirit from "./worlds/spirit.mjs";
import * as meadow from "./worlds/meadow.mjs";
import * as anime from "./worlds/anime.mjs";

const scenes = {
  ocean: { header: ocean.header(), div1: ocean.wave(), div2: ocean.jellies(), footer: ocean.footer() },
  spirit: { header: spirit.header(), div1: spirit.header({ withName: false }), div2: spirit.constellation(), footer: spirit.footer() },
  meadow: { header: meadow.header(), div1: meadow.butterflies(), div2: meadow.sunflowers(), footer: meadow.footer() },
  anime: { header: anime.header(), div1: anime.header({ withName: false }), div2: anime.train(), footer: anime.footer() },
};
for (const [world, parts] of Object.entries(scenes)) {
  console.log(world);
  for (const [part, svg] of Object.entries(parts)) save(`${world}-${part}.svg`, svg);
}
