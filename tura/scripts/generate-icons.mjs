/**
 * Rasterises public/icons/icon.svg into the PNG sizes the manifest, iOS and
 * the browser tab need. Run with `npm run icons` after editing the SVG.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const iconsDir = path.join(root, "public", "icons");
const source = await readFile(path.join(iconsDir, "icon.svg"));

await mkdir(iconsDir, { recursive: true });

/** Square PNGs used by the manifest and the browser. */
const SIZES = [96, 180, 192, 256, 384, 512];

for (const size of SIZES) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  await sharp(source, { density: 384 })
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, name));
  console.log(`  ${name}`);
}

/**
 * Maskable icon: Android crops to a circle, so the artwork is inset into a
 * safe zone with the brand background filling the rest.
 */
const MASKABLE = 512;
const inset = Math.round(MASKABLE * 0.1);
const artwork = await sharp(source, { density: 384 })
  .resize(MASKABLE - inset * 2, MASKABLE - inset * 2, { fit: "cover" })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: MASKABLE,
    height: MASKABLE,
    channels: 4,
    background: "#0c130f",
  },
})
  .composite([{ input: artwork, top: inset, left: inset }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(iconsDir, "icon-maskable-512.png"));
console.log("  icon-maskable-512.png");

// Favicon: a 32px ICO is still the most reliable across desktop browsers.
const favicon = await sharp(source, { density: 384 })
  .resize(48, 48, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toBuffer();
await writeFile(path.join(root, "src", "app", "icon.png"), favicon);
console.log("  src/app/icon.png");

console.log("icons generated");
