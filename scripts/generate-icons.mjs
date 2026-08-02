import sharp from "sharp";
import { readFile, mkdir, writeFile } from "node:fs/promises";

const outDir = new URL("../public/icons/", import.meta.url);
await mkdir(outDir, { recursive: true });

const svg = await readFile(new URL("./icon.svg", import.meta.url));

async function renderToPng(size, name, scale = 1) {
  const scaled = size * scale;
  const padded = await sharp(svg, { density: 96 })
    .resize(Math.round(scaled), Math.round(scaled))
    .png()
    .toBuffer();
  await writeFile(new URL(name, outDir), padded);
  console.log(`wrote ${name}`);
}

// Maskable icons need the content to fit within the safe zone (center 80%).
// Render the icon larger and pad with the background color.
async function renderMaskable(size, name) {
  const canvas = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 183, b: 201, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(svg, { density: 96 })
          .resize(Math.round(size * 0.7), Math.round(size * 0.7))
          .png()
          .toBuffer(),
        left: Math.round(size * 0.15),
        top: Math.round(size * 0.15),
      },
    ])
    .png()
    .toBuffer();
  await writeFile(new URL(name, outDir), canvas);
  console.log(`wrote ${name}`);
}

await renderToPng(192, "icon-192.png");
await renderToPng(512, "icon-512.png");
await renderMaskable(192, "icon-maskable-192.png");
await renderMaskable(512, "icon-maskable-512.png");
