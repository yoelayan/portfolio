// Estado compartido entre GSAP (escribe) y la escena Threlte (lee en cada frame).
// Es un objeto plano a propósito: GSAP lo interpola sin pasar por la reactividad de Svelte.
export interface SceneState {
  camX: number;
  camY: number;
  camZ: number;
  rotX: number;
  rotY: number;
  logoX: number;
  logoY: number;
  scale: number;
  /** Color del logo en sRGB (0–1). Cada sección tiene el suyo, ver `COLORS`. */
  r: number;
  g: number;
  b: number;
  spin: number; // velocidad de rotación de partículas y líneas de código
  lift: number; // 0 = sin ajuste, 1 = sube el logo en pantallas estrechas (el texto ocupa el ancho)
  heroW: number; // 1 en el hero, 0 en el resto: en móvil el logo se coloca en el hueco libre del hero
}

import { PALETTE } from './brand.js';

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};

// Un color de marca por sección: el logo siempre es de un solo color y cambia de forma clara
// al pasar de sección (violeta → cian → rosa → amarillo → verde → violeta).
export const COLORS = {
  hero: rgb(PALETTE.violet),
  about: rgb(PALETTE.sky),
  services: rgb(PALETTE.pink),
  projects: rgb(PALETTE.sun),
  skills: rgb(PALETTE.mint),
  contact: rgb(PALETTE.violet),
};

// Un keyframe por sección [data-scene="n"]. En escritorio el texto se alterna
// izquierda/derecha y el logo va al lado contrario; en pantallas estrechas el
// logo se queda arriba (lift) y el texto entra desde abajo.
export const keyframes: SceneState[] = [
  { camX: 0, camY: 0, camZ: 15, rotX: 0.05, rotY: 0, logoX: 0, logoY: 1.6, scale: 1, ...COLORS.hero, spin: 0.02, lift: 0, heroW: 1 },
  { camX: 0, camY: 0.4, camZ: 10, rotX: 0.15, rotY: Math.PI * 0.5, logoX: 3.2, logoY: 0, scale: 0.85, ...COLORS.about, spin: 0.05, lift: 1, heroW: 0 },
  { camX: 0, camY: -0.3, camZ: 10, rotX: -0.1, rotY: Math.PI * 1.2, logoX: -3.2, logoY: 0.2, scale: 0.85, ...COLORS.services, spin: 0.08, lift: 1, heroW: 0 },
  { camX: 0, camY: 0.2, camZ: 12, rotX: 0.2, rotY: Math.PI * 1.9, logoX: 3.2, logoY: -0.2, scale: 0.8, ...COLORS.projects, spin: 0.12, lift: 1, heroW: 0 },
  { camX: 0, camY: -0.2, camZ: 11, rotX: -0.15, rotY: Math.PI * 2.7, logoX: -3.2, logoY: 0, scale: 0.85, ...COLORS.skills, spin: 0.1, lift: 1, heroW: 0 },
  { camX: 0, camY: 0, camZ: 12.5, rotX: 0, rotY: Math.PI * 4, logoX: 0, logoY: 0, scale: 1, ...COLORS.contact, spin: 0.03, lift: 0, heroW: 0 },
];

/**
 * Medidas de maquetación que necesita la escena (px, en coordenadas de página con scroll 0).
 * En móvil/tablet el texto del hero ocupa la parte baja de la pantalla; el logo debe quedar en el
 * hueco libre entre el menú y el primer texto. En escritorio, el texto del hero ocupa la
 * izquierda y el logo va en el hueco libre de la derecha (heroFreeLeft/Right, px de pantalla).
 * heroTextTop/Bottom: extensión vertical del bloque de texto, para alinear el logo con él.
 * Las rellena StoryScene.measureScenes().
 */
export const layout = { heroFreeTop: 0, heroFreeBottom: 0, heroFreeLeft: 0, heroFreeRight: 0, heroTextTop: 0, heroTextBottom: 0 };

export const story: SceneState = { ...keyframes[0] };
