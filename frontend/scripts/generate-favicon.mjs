import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const logoSvg = readFileSync(resolve(__dirname, '../public/logo.svg'), 'utf8');

// Extrai apenas o conteúdo interno (remove <?xml?> e a tag <svg> wrapper)
const inner = logoSvg
  .replace(/<\?xml[^?]*\?>\s*/g, '')
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

// logo.svg = 764×764; área útil = 56×56 (4px de padding em cada lado num canvas 64×64)
const scale = (56 / 764).toFixed(6);

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d8e9df"/>
      <stop offset="100%" stop-color="#b7dfc7"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <g transform="translate(4,4) scale(${scale})">${inner}</g>
</svg>`;

writeFileSync(resolve(__dirname, '../public/favicon.svg'), favicon);
console.log(`favicon.svg gerado (${(favicon.length / 1024).toFixed(1)} KB)`);
