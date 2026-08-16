import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const svgPath = join(rootDir, 'assets', 'favicon.svg');
const pngPath = join(rootDir, 'assets', 'favicon.png');

const svg = readFileSync(svgPath, 'utf-8');
const resvg = new Resvg(svg, {
  fitTo: {
    mode: 'width',
    value: 64,
  },
});

const pngData = resvg.render();
const pngBuffer = pngData.asPng();

writeFileSync(pngPath, pngBuffer);
console.log(`Converted ${svgPath} to ${pngPath}`);
