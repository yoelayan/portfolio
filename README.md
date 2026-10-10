# yoelayan-portfolio

Portfolio personal con scrollytelling 3D. Astro (SSG) + Svelte 5 + Threlte/Three.js + GSAP ScrollTrigger + Tailwind 4.
Bilingüe (ES en `/`, EN en `/en/`), con el cambio de idioma sin recarga.

## Requisitos

- Node **≥ 22.12** (`.nvmrc` fija la 22; Railway y el CI la usan).
- No hay base de datos ni variables obligatorias, pero conviene definir `SITE_URL` (ver más abajo).

## Scripts

```bash
npm install
npm run dev        # http://localhost:4321 (ES)  ·  /en/ (EN)
npm run build      # genera dist/ + sitemap
npm run check      # tipos (astro check)
npm run smoke      # prueba de humo sobre dist/ (SEO, CTA, 404, contenido público)
npm run ci         # check + build + smoke (lo mismo que hace el CI)
npm run assets     # regenera logo.svg, favicon.svg, apple-touch-icon.png y og.png
npm start          # sirve dist/ con `serve` en $PORT (producción, Railway)
```

> `npm start` usa sintaxis de shell Unix (`${PORT:-3000}`); en Windows, para probar en local, usa
> `npx serve dist -l 4400`.

## Estructura

```
src/
  i18n/ui.ts              textos ES/EN, datos de contacto y helpers de ruta (pathFor, otherLocale)
  lib/brand.js            paleta y geometría del logo (única fuente para 3D, keyframes y activos)
  lib/story.ts            keyframes de la escena (uno por sección) y color del logo por sección
  components/
    Page.astro            HTML semántico de la página (indexable, sin JS)
    StoryScene.svelte     isla: GSAP/ScrollTrigger, scroll de enlaces, imán de sección, carga del 3D
    Scene.svelte          escena Threlte: logo 3D, luces, partículas y líneas de código
    SectionTitle.astro    título de sección (etiqueta verde + llave)
    TicketCard.astro      tarjeta "ticket" reutilizable (color, text, logo, align)
    ContactCard.astro     tarjeta de presentación de contacto
    Badge.astro           etiqueta de tecnología (úsala siempre que se nombre un stack)
  layouts/Base.astro      <head>: canonical, hreflang, Open Graph, JSON-LD, precarga de fuentes
  pages/index.astro       /      (ES)
  pages/en/index.astro    /en/   (EN)
  pages/404.astro         404 propio y bilingüe (noindex)
  pages/robots.txt.ts     robots.txt con enlace al sitemap
  styles/global.css       tema Tailwind (@theme), fuentes, paneles, scrollbar, anti-parpadeo
public/                   favicon, logo, og.png, apple-touch-icon.png, serve.json (cabeceras de caché)
scripts/
  brand-assets.mjs        genera los activos de marca desde src/lib/brand.js
  smoke.mjs               prueba de humo sobre dist/
.github/workflows/ci.yml  npm ci + check + build + smoke
```

### Paleta de marca: dónde vive

Los colores están en `src/lib/brand.js` (código) y en `@theme` de `src/styles/global.css` (CSS). El CSS no
puede importar JS, así que **si cambias un color, cámbialo en ambos sitios** y ejecuta `npm run assets`.

## Despliegue

### GitHub (repositorio público)

```bash
git init -b main
git add .
git commit -m "feat: portfolio inicial"
gh repo create yoelayan/portfolio --public --source=. --remote=origin --push
```

### Railway

1. Railway → **New Project** → **Deploy from GitHub repo** → `yoelayan/portfolio`.
2. Build: `npm run build` · Start: `npm start` (si no los detecta solos).
3. Variable **`SITE_URL`** = `https://tu-dominio` (canonical, hreflang, sitemap y Open Graph salen de ahí).
   Si falta, el build usa `RAILWAY_PUBLIC_DOMAIN` o, en último caso, un valor provisional **y avisa** en el log.
4. Networking → **Generate Domain** (o dominio propio). Cada push a `main` redespliega.

`public/serve.json` añade `Cache-Control` (`immutable` para `/_astro/*`, un día para imágenes y fuentes,
`must-revalidate` para el HTML) y `serve` entrega `404.html` para rutas inexistentes.

## Rendimiento y accesibilidad del 3D

- three/threlte se cargan con `import()` en idle (como mucho a los 2 s): no entran en el bundle inicial.
- Render pausado con la pestaña oculta o con `prefers-reduced-motion` (un solo frame estático).
- **Móvil y tablet (< 1024 px)**: modo "lite" (menos geometría, partículas y líneas de código, DPR limitado,
  sin `backdrop-filter`, logo arriba en vez de al lado). Se recalcula al girar o redimensionar.
- Sin WebGL o si se pierde el contexto: logo estático. El contenido es HTML, no depende del canvas.
- El logo está construido con primitivas (sin `.glb`), así que no hay modelos que comprimir con Draco; si
  más adelante añades uno, usa `gltf-transform optimize --compress draco` y `DRACOLoader`.
- Fuentes: solo el subset `latin` (cubre ñ, tildes, ¿ ¡), precargado en `<head>`.
- Anti-parpadeo: con JS, el contenido animado arranca oculto por CSS hasta `html[data-ready]`; si algo falla,
  a los 4 s se muestra todo. Sin JS o con movimiento reducido, nada se oculta.

## Activos de marca (`npm run assets`)

`scripts/brand-assets.mjs` genera `logo.svg`, `favicon.svg`, `apple-touch-icon.png` y `og.png` desde
`src/lib/brand.js`. El texto de `og.png` se convierte en trazados (opentype.js + `@fontsource/montserrat`), por
lo que el resultado es el mismo en cualquier máquina o CI, sin depender de fuentes instaladas.

## Contenido público: qué no debe aparecer

El repo es público. Los fragmentos de código decorativos de `Scene.svelte` son inventados y genéricos; no
añadas nombres de proveedores, rutas ni símbolos de ningún proyecto real o de un empleador. `npm run smoke`
falla si encuentra algunos de esos nombres en el resultado del build (lista en `scripts/smoke.mjs`).
