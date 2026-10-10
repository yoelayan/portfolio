<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
  import { keyframes, story, layout, type SceneState } from '../lib/story';

  let { alt }: { alt: string } = $props();

  // Se cargan bajo demanda: three/threlte no entran en el bundle inicial.
  let Canvas = $state<typeof import('@threlte/core').Canvas>();
  let Scene = $state<typeof import('./Scene.svelte').default>();
  let ready = $state(false);
  let failed = $state(false);
  let paused = $state(false);
  let host: HTMLDivElement;

  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // "lite" = móvil y tablet (<1024px): menos geometría, DPR bajo y logo arriba en vez de al lado.
  // Es reactivo: al girar el dispositivo o redimensionar se reconstruye la escena.
  const mq = typeof matchMedia === 'function' ? matchMedia('(max-width: 1023px)') : undefined;
  let lite = $state(mq?.matches ?? false);

  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  }

  let ctx: gsap.Context | undefined;

  // La posición se calcula con offsetTop (layout) y no con getBoundingClientRect: las tarjetas
  // están alejadas/encogidas en Z, y eso desplazaría los disparadores y los puntos de imán.
  const absTop = (el: HTMLElement) => {
    let y = 0;
    for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
    return y;
  };

  /**
   * Pose del logo (cámara, posición, rotación, color…) como FUNCIÓN PURA de la posición de scroll.
   *
   * Antes había un gsap.to(story) por sección con scrub: cada tween captura su valor inicial la
   * primera vez que se dibuja, así que tras un salto (enlace, imán, recarga con #hash) partía de
   * una pose que no correspondía a la sección anterior, y al volver el logo quedaba mal colocado.
   * Ahora, para cada scroll, se busca la sección actual y se mezcla keyframe[i-1] → keyframe[i]
   * según el progreso: el mismo scroll da siempre la misma pose, vengas de donde vengas.
   * El suavizado visual lo da el amortiguado de Scene.svelte.
   */
  const KEYS = Object.keys(keyframes[0]) as (keyof SceneState)[];
  let sceneTops: number[] = [];

  function measureScenes() {
    sceneTops = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'))
      .sort((a, b) => Number(a.dataset.scene) - Number(b.dataset.scene))
      .map(absTop);

    // Hueco libre del hero (solo "lite"): desde el menú hasta el primer texto, con un margen
    const kicker = document.querySelector<HTMLElement>('section[data-scene="0"] p');
    if (lite && kicker) {
      layout.heroFreeTop = headerH();
      layout.heroFreeBottom = absTop(kicker) - 16;
    } else {
      layout.heroFreeTop = layout.heroFreeBottom = 0;
    }
  }

  function updateStory() {
    if (reduced || sceneTops.length < 2) return;
    const vh = window.innerHeight;
    const y = window.scrollY;
    // Sección más avanzada cuya transición ya empezó (su inicio: su parte superior entra por abajo)
    let i = 0;
    for (let k = 1; k < sceneTops.length; k++) if (y >= sceneTops[k] - vh) i = k;
    if (i === 0) {
      Object.assign(story, keyframes[0]);
      return;
    }
    // La transición termina cuando la sección llega al 20 % de la pantalla (como antes)
    const start = sceneTops[i] - vh;
    const end = sceneTops[i] - vh * 0.2;
    const p = Math.min(1, Math.max(0, (y - start) / (end - start)));
    const from = keyframes[i - 1];
    const to = keyframes[i];
    for (const key of KEYS) story[key] = from[key] + (to[key] - from[key]) * p;
  }

  /** Altura útil bajo el menú fijo. */
  const headerH = () => document.querySelector('header')?.offsetHeight ?? 64;

  /**
   * Punto de scroll "ideal" de una sección: centra su tarjeta en la pantalla si cabe; si es más
   * alta que la pantalla, alinea su parte superior justo bajo el menú. Sin tarjeta (hero), el inicio.
   */
  function snapPoint(section: HTMLElement): { y: number; tall: boolean } {
    const vh = window.innerHeight;
    const max = Math.max(0, document.documentElement.scrollHeight - vh);
    const card = section.querySelector<HTMLElement>('[data-card]');
    if (!card) return { y: Math.min(absTop(section), max), tall: false };
    const top = absTop(card);
    const h = card.offsetHeight;
    const tall = h > vh - headerH() - 24;
    const y = tall ? top - headerH() - 20 : top + h / 2 - vh / 2;
    return { y: Math.max(0, Math.min(y, max)), tall };
  }

  /**
   * Numeración de líneas: se genera con tantas líneas como altura tenga la página (antes eran 500
   * <li> fijos en cada HTML). Solo existe en pantallas anchas; en el resto el gutter está oculto.
   */
  function fitGutter() {
    const ol = document.querySelector<HTMLOListElement>('.code-gutter');
    if (!ol || getComputedStyle(ol).display === 'none') return;
    const lineHeight = parseFloat(getComputedStyle(ol).lineHeight) || 25.6;
    const n = Math.ceil(document.documentElement.scrollHeight / lineHeight) + 1;
    if (ol.childElementCount === n) return;
    ol.replaceChildren(
      ...Array.from({ length: n }, (_, i) => {
        const li = document.createElement('li');
        li.textContent = String(i + 1);
        return li;
      }),
    );
  }

  /** Quita el ocultado previo (CSS html.js:not([data-ready])): desde aquí manda GSAP. */
  const markReady = () => {
    document.documentElement.dataset.ready = '1';
  };

  // Se ejecuta al montar y tras cada cambio de idioma (el DOM del texto se reemplaza,
  // pero esta isla —y el canvas— persisten con transition:persist).
  function setupPage() {
    ctx?.revert();
    host?.setAttribute('aria-label', document.querySelector<HTMLElement>('main')?.dataset.sceneAlt ?? alt);
    fitGutter();
    if (reduced) {
      markReady();
      return;
    }

    ctx = gsap.context(() => {
      // 1) Revelado de contenido (funciona aunque el 3D falle)
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(el, { y: 36, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: () => absTop(el) - window.innerHeight * 0.88,
            end: 'max',
            toggleActions: 'play none none none',
          },
        });
      });

      // Tarjetas con profundidad: están "al fondo" (alejadas en Z, tenues) y se acercan a la
      // pantalla al acercarnos a su sección; al alejarnos de ella, vuelven al fondo.
      gsap.utils.toArray<HTMLElement>('[data-card]').forEach((card) => {
        const section = card.closest<HTMLElement>('section');
        if (!section) return;
        const far = { z: -520, opacity: 0.12 };
        gsap.set(card, { transformPerspective: 900, transformOrigin: '50% 50%' });
        gsap.fromTo(card, far, {
          z: 0, opacity: 1, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 30%', scrub: 0.6 },
        });
        gsap.fromTo(card, { z: 0, opacity: 1 }, {
          ...far, ease: 'power2.in', immediateRender: false,
          scrollTrigger: { trigger: section, start: 'bottom 75%', end: 'bottom top', scrub: 0.6 },
        });
      });
    });
    // El DOM nuevo aún no tiene layout final: recalcular para que los elementos
    // que ya están en pantalla se revelen en vez de quedarse ocultos.
    measureScenes();
    updateStory();
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      measureScenes();
      updateStory();
    });
    markReady();
  }

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    if (import.meta.env.DEV) (window as unknown as { __story: typeof story }).__story = story;
    // Con lag smoothing (por defecto) GSAP avanza solo 33 ms por fotograma cuando uno tarda más de
    // 500 ms: en un dispositivo lento (o con WebGL por software) el scroll de los enlaces casi se
    // detendría. Se desactiva para que las animaciones sigan el tiempo real.
    gsap.ticker.lagSmoothing(0);
    // GSAP controla el scroll de los enlaces internos: se desactiva el smooth nativo del CSS
    // (si no, cada paso de la animación se suavizaría otra vez y vibraría).
    document.documentElement.classList.add('gsap-scroll');
    setupPage();

    // Cambio de idioma sin recarga: conservar el scroll y re-crear las animaciones
    let savedY = 0;
    const onBeforeSwap = () => (savedY = window.scrollY);
    const onAfterSwap = () => {
      document.documentElement.classList.add('js');
      delete document.documentElement.dataset.ready;
      document.documentElement.classList.add('gsap-scroll');
      window.scrollTo({ top: savedY, behavior: 'instant' });
      setupPage();
    };

    // La numeración se ajusta si cambia la altura de la página (fuentes, redimensionado)
    window.addEventListener('scroll', updateStory, { passive: true });
    const onRefresh = () => {
      measureScenes();
      updateStory();
    };
    ScrollTrigger.addEventListener('refresh', onRefresh);
    const bodyRO = new ResizeObserver(() => {
      fitGutter();
      onRefresh();
    });
    bodyRO.observe(document.body);

    // Si se pierde el contexto WebGL, se vuelve al logo estático en vez de dejar un canvas en blanco
    const onContextLost = (e: Event) => {
      e.preventDefault();
      failed = true;
    };
    host.addEventListener('webglcontextlost', onContextLost, true);
    document.addEventListener('astro:before-preparation', onBeforeSwap);
    document.addEventListener('astro:after-swap', onAfterSwap);

    // Enlaces internos (#sección y logo a la propia página): scroll suave con duración
    // proporcional a la distancia. Se intercepta en captura para que el router de Astro no
    // haga su propio salto.
    const onAnchorClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname) return;
      const target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
      if (url.hash && !target) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      const y = target ? (target.matches('[data-scene]') ? snapPoint(target).y : absTop(target)) : 0;
      history.replaceState(history.state, '', url.pathname + url.hash);
      if (reduced) {
        window.scrollTo({ top: y, behavior: 'instant' });
        return;
      }
      const duration = Math.min(1.8, Math.max(0.8, Math.abs(y - window.scrollY) / 2200));
      gsap.to(window, { scrollTo: { y, autoKill: true }, duration, ease: 'power3.inOut', overwrite: true });
    };
    document.addEventListener('click', onAnchorClick, true);

    // Imán suave: al dejar de hacer scroll cerca de una sección, se centra sola. Para tarjetas
    // más altas que la pantalla solo atrae mientras nos acercamos desde arriba (nunca tira hacia
    // atrás mientras se está leyendo dentro de ellas). No se activa con movimiento reducido ni
    // mientras hay un dedo sobre la pantalla.
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    let touching = false;
    const trySnap = () => {
      if (reduced || touching || gsap.isTweening(window)) return;
      const y0 = window.scrollY;
      const reach = Math.min(window.innerHeight * 0.45, 360);
      let best: { y: number; d: number } | null = null;
      document.querySelectorAll<HTMLElement>('[data-scene]').forEach((sec) => {
        const { y, tall } = snapPoint(sec);
        const d = y - y0;
        if (tall && d < 0) return;
        if (Math.abs(d) <= reach && (!best || Math.abs(d) < Math.abs(best.d))) best = { y, d };
      });
      const target = best as { y: number; d: number } | null;
      if (target && Math.abs(target.d) > 3) {
        gsap.to(window, { scrollTo: { y: target.y, autoKill: true }, duration: 0.75, ease: 'power2.out', overwrite: true });
      }
    };
    const scheduleSnap = () => {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(trySnap, 170);
    };
    const onTouchStart = () => (touching = true);
    const onTouchEnd = () => {
      touching = false;
      scheduleSnap();
    };
    window.addEventListener('scroll', scheduleSnap, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    const onMq = (e: MediaQueryListEvent) => (lite = e.matches);
    mq?.addEventListener('change', onMq);

    // 3) Pausar el render cuando no se ve (pestaña oculta o canvas fuera de viewport)
    const onVis = () => (paused = document.hidden);
    document.addEventListener('visibilitychange', onVis);
    const io = new IntersectionObserver(([e]) => (paused = !e.isIntersecting || document.hidden), {
      threshold: 0,
    });
    io.observe(host);

    // 4) Cargar el 3D en idle
    let cancelled = false;
    const load = async () => {
      if (!hasWebGL()) return (failed = true);
      try {
        const [core, scene] = await Promise.all([import('@threlte/core'), import('./Scene.svelte')]);
        if (cancelled) return;
        Canvas = core.Canvas;
        Scene = scene.default;
        ready = true;
      } catch (e) {
        console.error('3D scene failed to load', e);
        failed = true;
      }
    };
    // En idle, pero como mucho a los 2 s (si el hilo principal está ocupado no se espera indefinidamente)
    if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 2000 });
    else setTimeout(load, 150);

    return () => {
      cancelled = true;
      io.disconnect();
      mq?.removeEventListener('change', onMq);
      document.removeEventListener('click', onAnchorClick, true);
      clearTimeout(snapTimer);
      window.removeEventListener('scroll', scheduleSnap);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      document.documentElement.classList.remove('gsap-scroll');
      bodyRO.disconnect();
      window.removeEventListener('scroll', updateStory);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      host.removeEventListener('webglcontextlost', onContextLost, true);
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('astro:before-preparation', onBeforeSwap);
      document.removeEventListener('astro:after-swap', onAfterSwap);
      ctx?.revert();
    };
  });
</script>

<div bind:this={host} class="pointer-events-none fixed inset-0 z-0" role="img" aria-label={alt}>
  {#if !ready || failed}
    <!-- Fallback estático mientras carga o si no hay WebGL -->
    <img
      src="/logo.svg"
      alt=""
      width="366"
      height="210"
      class="absolute left-1/2 top-1/2 w-[min(60vw,520px)] -translate-x-1/2 -translate-y-1/2 opacity-90"
    />
  {/if}
  {#if Canvas && Scene && !failed}
    {#key lite}
      <Canvas dpr={Math.min(window.devicePixelRatio, lite ? 1.25 : 1.5)} renderMode="manual">
        <Scene {lite} animate={!reduced} active={!paused} />
      </Canvas>
    {/key}
  {/if}
</div>
