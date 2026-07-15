/**
 * generate-icons.mjs
 *
 * Turns a source app-icon PNG into the build assets electron-builder needs:
 *   build/icon.png  (1024x1024, Linux)
 *   build/icon.ico  (multi-size, Windows)
 *
 * The source art is a rounded-square badge on a solid white background. We make
 * the outer white transparent via a flood fill seeded from the four corners, so
 * white *inside* the badge (glass highlights, "SHOT!" text, sparkles) is kept —
 * the dark badge border encloses the interior and stops the fill.
 *
 * One-off tool. Deps are not in package.json; install ad hoc to regenerate:
 *   npm install --no-save sharp pngjs png-to-ico
 *   node scripts/generate-icons.mjs <source.png>
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const buildDir = resolve(projectRoot, 'build');

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/generate-icons.mjs <source.png>');
  process.exit(1);
}

// A pixel counts as background while flood filling if it is light on all
// channels. Pure-white corners are ~255; the threshold also catches the
// anti-aliased halo between the white and the dark badge border.
const LIGHT = 205;

function floodFillTransparent(png) {
  const { width, height, data } = png;
  const idx = (x, y) => (y * width + x) << 2;
  const isLight = (x, y) => {
    const i = idx(x, y);
    return data[i] > LIGHT && data[i + 1] > LIGHT && data[i + 2] > LIGHT;
  };

  const visited = new Uint8Array(width * height);
  const stack = [];
  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    if (visited[y * width + x]) return;
    if (!isLight(x, y)) return;
    visited[y * width + x] = 1;
    stack.push(x, y);
  };

  // Seed every edge pixel so the fill hugs the whole outer border.
  for (let x = 0; x < width; x++) { seed(x, 0); seed(x, height - 1); }
  for (let y = 0; y < height; y++) { seed(0, y); seed(width - 1, y); }

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    data[idx(x, y) + 3] = 0; // transparent
    seed(x + 1, y);
    seed(x - 1, y);
    seed(x, y + 1);
    seed(x, y - 1);
  }
  return png;
}

async function main() {
  const png = floodFillTransparent(PNG.sync.read(readFileSync(resolve(source))));
  const transparent = PNG.sync.write(png);

  mkdirSync(buildDir, { recursive: true });

  // Linux: single high-res PNG.
  await sharp(transparent)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(buildDir, 'icon.png'));

  // Windows: multi-size ICO.
  const sizes = [256, 128, 64, 48, 32, 16];
  const buffers = await Promise.all(
    sizes.map((s) =>
      sharp(transparent)
        .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );
  writeFileSync(resolve(buildDir, 'icon.ico'), await pngToIco(buffers));

  console.log('Wrote build/icon.png (1024) and build/icon.ico (' + sizes.join(',') + ')');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
