// Regenera los activos de marca a partir de src/lib/brand.js (una sola fuente de verdad):
//   public/logo.svg · public/favicon.svg · public/apple-touch-icon.png · public/og.png
// Uso: npm run assets
//
// El texto de og.png se convierte en trazados con opentype.js usando las fuentes de devDependencies
// (@fontsource/*), así no depende de las fuentes instaladas en la máquina.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import opentype from 'opentype.js';
import { PALETTE as C, LOGO as L } from '../src/lib/brand.js';

const require = createRequire(import.meta.url);

const logoBody = ({ arm = C.violet, dot = C.violet, ring = C.violet, sw = L.strokeWidth, ringSw = L.ring.strokeWidth, dotR = L.dot.r } = {}) => `
  <path d="${L.armLeft}" fill="none" stroke="${arm}" stroke-width="${sw}" stroke-linecap="round"/>
  <path d="${L.armRight}" fill="none" stroke="${arm}" stroke-width="${sw}" stroke-linecap="round"/>
  <path d="${L.stem}" fill="none" stroke="${arm}" stroke-width="${sw}"/>
  <circle cx="${L.dot.cx}" cy="${L.dot.cy}" r="${dotR}" fill="${dot}"/>
  <circle cx="${L.ring.cx}" cy="${L.ring.cy}" r="${L.ring.r}" fill="none" stroke="${ring}" stroke-width="${ringSw}"/>`;

// logo.svg: todo violeta, sin fondo
fs.writeFileSync('public/logo.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${L.viewBox}" role="img" aria-label="Yoel Ayan">${logoBody()}\n</svg>\n`);

// favicon.svg: icono con fondo azul marino y anillo verde
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="${C.navy}"/>
  <g transform="translate(6 13) scale(.24)">${logoBody({ ring: C.mint, sw: 30, ringSw: 18, dotR: 24 })}</g>
</svg>
`;
fs.writeFileSync('public/favicon.svg', favicon);

// apple-touch-icon.png (180x180, sin esquinas redondeadas: iOS las aplica)
const touch = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${C.navy}"/>
  <g transform="translate(6 13) scale(.24)">${logoBody({ ring: C.mint, sw: 30, ringSw: 18, dotR: 24 })}</g>
</svg>`;
await sharp(Buffer.from(touch)).png().toFile('public/apple-touch-icon.png');

// og.png (1200x630). El texto se convierte en trazados con opentype.js a partir de las fuentes
// del repo (devDependencies), así el resultado es idéntico en cualquier máquina o CI.
const loadFont = (pkg, file) => {
  const buf = fs.readFileSync(require.resolve(`${pkg}/files/${file}`));
  // Buffer puede ser una vista de un ArrayBuffer mayor: copiar solo su rango
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
// Montserrat es la tipografía de marca para recursos gráficos (Source Code Pro es para el texto web).
const mont = (w) => loadFont('@fontsource/montserrat', `montserrat-latin-${w}-normal.woff`);
const montserrat800 = mont(800);
const montserrat700 = mont(700);
const montserrat500 = mont(500);

// path.toPathData() de opentype.js produce "NaN" en algunos casos (depende de la posición), lo que
// corta el dibujo en librsvg. Se serializa aquí y se aborta si queda algún valor no finito.
const round = (n) => Math.round(n * 100) / 100;
const pathData = (path) =>
  path.commands
    .map((c) => {
      if (c.type === 'Z') return 'Z';
      const nums = c.type === 'C' ? [c.x1, c.y1, c.x2, c.y2, c.x, c.y] : c.type === 'Q' ? [c.x1, c.y1, c.x, c.y] : [c.x, c.y];
      if (!nums.every(Number.isFinite)) throw new Error('Trazado de texto con valores no finitos');
      return c.type + nums.map(round).join(' ');
    })
    .join('');

/** Línea centrada en x=600 formada por tramos [{font, text, fill}] del mismo tamaño. */
const centeredLine = (runs, size, baseline) => {
  const widths = runs.map((r) => r.font.getAdvanceWidth(r.text, size));
  let x = 600 - widths.reduce((t, w) => t + w, 0) / 2;
  return runs
    .map((r, i) => {
      const d = pathData(r.font.getPath(r.text, x, baseline, size));
      x += widths[i];
      return `<path d="${d}" fill="${r.fill}"/>`;
    })
    .join('');
};

// Logo centrado en x=600; el tallo termina por encima del nombre
const s = 1.3;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="g" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#1a2470"/><stop offset="1" stop-color="${C.navy}"/></radialGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(${600 - 212 * s} ${215 - 147 * s}) scale(${s})">${logoBody({ ring: C.mint })}</g>
  ${centeredLine([{ font: montserrat800, text: 'Yoel Ayan', fill: '#fff' }], 76, 450)}
  ${centeredLine(
    [
      { font: montserrat500, text: 'Make decisions based on ', fill: '#fff' },
      { font: montserrat700, text: 'DATA', fill: C.sun },
      { font: montserrat500, text: ', not your intuition', fill: '#fff' },
    ],
    30,
    510,
  )}
  ${centeredLine([{ font: montserrat500, text: 'Senior Backend Developer · Python / Django', fill: C.mint }], 24, 560)}
</svg>`;
await sharp(Buffer.from(og)).png().toFile('public/og.png');

console.log('Activos generados: logo.svg, favicon.svg, apple-touch-icon.png, og.png');
