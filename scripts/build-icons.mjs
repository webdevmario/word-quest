// Renders the home screen icons in public/icons from public/favicon.svg.
// Run with: npm run icons:build
//
// - icon-192 / icon-512: the parchment "W" tile on a clear background.
// - maskable-512: the tile inside a safe zone on the felt green, so Android
//   can crop it to any shape.
// - apple-touch-icon (180): full-bleed felt green, since iOS fills clear
//   pixels with black.
import { readFile } from 'node:fs/promises';

import { chromium } from '@playwright/test';

const FELT = '#10291f';
const svg = await readFile(
  new URL('../public/favicon.svg', import.meta.url),
  'utf8'
);
const out = (name) =>
  new URL(`../public/icons/${name}`, import.meta.url).pathname;

const ICONS = [
  { file: 'icon-192.png', size: 192, tile: 1, background: null },
  { file: 'icon-512.png', size: 512, tile: 1, background: null },
  { file: 'maskable-512.png', size: 512, tile: 0.62, background: FELT },
  { file: 'apple-touch-icon.png', size: 180, tile: 0.86, background: FELT },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, tile, background } of ICONS) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`
    <style>
      html, body { margin: 0; width: ${size}px; height: ${size}px; }
      body { display: grid; place-items: center; background: ${background ?? 'transparent'}; }
      svg { width: ${size * tile}px; height: ${size * tile}px; display: block; }
    </style>
    ${svg}`);
  await page.screenshot({ path: out(file), omitBackground: !background });
  console.log(`Wrote public/icons/${file}`);
}
await browser.close();
