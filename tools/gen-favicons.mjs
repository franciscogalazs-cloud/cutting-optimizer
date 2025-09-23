import sharp from "sharp";
import { readFile } from "node:fs/promises";
const SRC = "public/brand/industrial-plate/stencil_square.svg";
const OUT = "public/brand/industrial-plate/icons";
const sizes = [512, 256, 128, 64, 32];

const svg = await readFile(SRC);
await Promise.all(
  sizes.map(s =>
    sharp(svg, { density: 384 })
      .png()
      .resize(s, s)
      .toFile(`${OUT}/favicon-${s}.png`)
  )
);
console.log("Favicons generados en", OUT);
