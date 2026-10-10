// Única fuente de verdad de la marca para código (escena 3D, keyframes y script de activos).
// El CSS toma los mismos colores de @theme en src/styles/global.css: si cambias un color,
// cámbialo allí también (el CSS no puede importar este archivo).
// Es .js (y no .ts) para poder importarlo también desde scripts/brand-assets.mjs con Node.

/** Colores de marca. */
export const PALETTE = {
  navy: '#0c123a',
  violet: '#8225d4',
  mint: '#72e686',
  pink: '#ec0056',
  sun: '#faca54',
  sky: '#48c8e2',
  white: '#ffffff',
};

/**
 * Geometría del logo en el sistema de coordenadas original (px, viewBox "30 40 366 210").
 * La usan logo.svg, favicon.svg, apple-touch-icon.png y og.png (scripts/brand-assets.mjs) y,
 * como puntos de curva, la escena 3D (Scene.svelte).
 */
export const LOGO = {
  viewBox: '30 40 366 210',
  strokeWidth: 26,
  armLeft: 'M50 62Q52 86 90 86Q150 86 180 112Q205 135 212 165',
  armRight: 'M374 62Q372 86 334 86Q274 86 244 112Q219 135 212 165',
  stem: 'M212 150V232',
  dot: { cx: 131, cy: 192, r: 22 },
  ring: { cx: 297, cy: 190, r: 34, strokeWidth: 15 },
  /** Puntos de las curvas del 3D (equivalentes a armLeft/armRight). */
  armLeftPoints: [[50, 62], [52, 80], [90, 86], [150, 90], [185, 118], [212, 165]],
  armRightPoints: [[374, 62], [372, 80], [334, 86], [274, 90], [239, 118], [212, 165]],
  /** Origen del 3D (centro del tallo) y extremos del tallo. */
  center: { x: 212, y: 150 },
  stemEnd: { x: 212, y: 232 },
};
