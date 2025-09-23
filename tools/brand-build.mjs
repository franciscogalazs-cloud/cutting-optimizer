import { readFile, writeFile } from "node:fs/promises";

const NAME = (process.env.BRAND_NAME || "MELAMINA OPTIMIZER").toUpperCase();
const SHOW_BADGE = process.env.BRAND_BADGE !== "false"; // true por defecto

const files = [
  "public/brand/industrial-plate/stencil_main.svg",
  "public/brand/industrial-plate/stencil_compact.svg",
  "public/brand/industrial-plate/stencil_stack.svg"
];

for (const f of files) {
  let s = await readFile(f, "utf8");
  s = s.replace(/MELAMINA OPTIMIZER/gi, NAME);
  if (!SHOW_BADGE) s = s.replace(/>PRO</g, "><");
  await writeFile(f, s, "utf8");
  console.log("Actualizado:", f);
}
