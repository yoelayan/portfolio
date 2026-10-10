import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Dominio público del sitio (canonical, hreflang, sitemap y Open Graph salen de aquí).
// Orden: SITE_URL → dominio que Railway expone → valor provisional (con aviso en el build).
const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
const explicit = process.env.SITE_URL ?? (railwayDomain ? `https://${railwayDomain}` : undefined);
if (!explicit && process.argv.includes('build')) {
  console.warn(
    '\n⚠  SITE_URL no está definida: canonical, hreflang, sitemap y Open Graph apuntarán a ' +
      'https://yoelayan.dev (provisional).\n   Defínela en Railway (Variables) con el dominio real antes de publicar.\n',
  );
}
const site = explicit ?? 'https://yoelayan.dev';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    svelte(),
    // Mismos códigos de idioma que los <link rel="alternate" hreflang> del HTML (layouts/Base.astro)
    sitemap({ i18n: { defaultLocale: 'es', locales: { es: 'es', en: 'en' } }, filter: (page) => !page.includes('/404') }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: { chunkSizeWarningLimit: 800 },
  },
});
