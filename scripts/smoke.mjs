// Prueba de humo sobre dist/ (ejecutar tras `astro build`): npm run smoke
// Comprueba SEO, coherencia de contenido y que no se cuele código/nombres que no deben ser públicos.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };
const read = (f) => fs.readFileSync(path.join(DIST, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(DIST, f));

const pages = [
  { file: 'index.html', lang: 'es', path: '/', navLabel: 'Principal' },
  { file: 'en/index.html', lang: 'en', path: '/en/', navLabel: 'Main' },
];

// --- Archivos imprescindibles
for (const f of ['404.html', 'robots.txt', 'sitemap-index.xml', 'sitemap-0.xml', 'og.png', 'apple-touch-icon.png', 'favicon.svg', 'serve.json']) {
  ok(exists(f), `Falta dist/${f}`);
}
if (failures.length) report();

const sitemap = read('sitemap-0.xml');
const attr = (html, re) => (html.match(re) || [])[1];

for (const pg of pages) {
  const html = read(pg.file);
  const where = `[${pg.lang}]`;

  // Canonical y og:image absolutos
  const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
  ok(canonical && /^https?:\/\//.test(canonical), `${where} canonical ausente o no absoluto`);
  ok(canonical && new URL(canonical).pathname === pg.path, `${where} canonical no apunta a ${pg.path}`);
  const og = attr(html, /<meta property="og:image" content="([^"]+)"/);
  ok(og && /^https?:\/\//.test(og), `${where} og:image ausente o no absoluta`);

  // Descripción ≤ 155 caracteres
  const desc = attr(html, /<meta name="description" content="([^"]+)"/) ?? '';
  ok(desc.length > 0 && desc.length <= 155, `${where} meta description de ${desc.length} caracteres (máx. 155)`);

  // hreflang del HTML = hreflang del sitemap
  const htmlLangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]).sort();
  ok(htmlLangs.join() === 'en,es,x-default', `${where} hreflang del HTML inesperado: ${htmlLangs}`);
  const block = sitemap.split('<url>').find((b) => b.includes(`<loc>${canonical}</loc>`)) ?? '';
  const siteLangs = [...block.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]).filter((l) => l !== 'x-default').sort();
  const htmlSans = htmlLangs.filter((l) => l !== 'x-default');
  ok(siteLangs.join() === htmlSans.join(), `${where} hreflang del sitemap (${siteLangs}) ≠ HTML (${htmlSans})`);

  // Un solo h1, con el rol dentro
  const h1s = [...html.matchAll(/<h1[\s>][\s\S]*?<\/h1>/g)];
  ok(h1s.length === 1, `${where} debe haber un único <h1> (hay ${h1s.length})`);
  ok(h1s[0] && /Python/.test(h1s[0][0]), `${where} el <h1> debería incluir el rol (Python/Django)`);

  // aria-label del nav localizado
  ok(html.includes(`<nav aria-label="${pg.navLabel}"`), `${where} el <nav> debería tener aria-label="${pg.navLabel}"`);

  // CTA coherente: el enlace a wa.me debe decir WhatsApp
  for (const m of html.matchAll(/<a[^>]*href="https:\/\/wa\.me\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g)) {
    ok(/whatsapp/i.test(m[1]), `${where} enlace a wa.me con etiqueta "${m[1].trim()}" (debe mencionar WhatsApp)`);
  }

  // JSON-LD válido con @id estable
  const ld = attr(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  try {
    const data = JSON.parse(ld);
    ok(data['@graph']?.some((n) => n['@type'] === 'Person' && n['@id']), `${where} JSON-LD sin Person con @id`);
  } catch {
    failures.push(`${where} JSON-LD inválido o ausente`);
  }
}

// 404 sin indexar
ok(/<meta name="robots" content="noindex"/.test(read('404.html')), '404.html debería llevar noindex');
// robots.txt con sitemap absoluto
ok(/Sitemap: https?:\/\//.test(read('robots.txt')), 'robots.txt sin Sitemap absoluto');

// --- Nada de nombres/símbolos internos de terceros en el código público (repo público)
const FORBIDDEN = /palenca|AppError|statuscar|schema_name|select_for_update/i;
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
for (const f of walk(DIST).filter((f) => /\.(html|js|css|xml|txt|json|svg)$/.test(f))) {
  const m = fs.readFileSync(f, 'utf8').match(FORBIDDEN);
  ok(!m, `${f} contiene "${m?.[0]}" (nombre/símbolo interno que no debe publicarse)`);
}

report();

function report() {
  if (failures.length) {
    console.error(`\n✗ Smoke: ${failures.length} problema(s)\n` + failures.map((f) => '  - ' + f).join('\n') + '\n');
    process.exit(1);
  }
  console.log('✓ Smoke OK: SEO (canonical, hreflang, description, h1, JSON-LD), CTA, 404, robots y contenido público.');
}
