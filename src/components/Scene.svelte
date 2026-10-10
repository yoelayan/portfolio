<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount, onDestroy } from 'svelte';
  import { story, layout } from '../lib/story';
  import { LOGO, PALETTE } from '../lib/brand.js';

  let { lite = false, animate = true, active = true }: { lite?: boolean; animate?: boolean; active?: boolean } = $props();

  // Bucle de render propio, limitado a 60 FPS. Con renderMode "always" Threlte dibuja en cada
  // rAF, es decir, a 120–165 FPS en pantallas de alta frecuencia (≈6.700 draw calls/s medidas):
  // coste de GPU y de hilo principal que se nota sobre todo cuando el scroll lo mueve JavaScript
  // (enlaces e imán). Con "manual" solo se dibuja cuando llamamos a advance().
  const { advance } = useThrelte();
  const FRAME_MS = 1000 / 60;
  onMount(() => {
    let raf = 0;
    let last = 0;
    let staticFrames = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!active || document.hidden) return;
      // Con movimiento reducido solo se pintan unos fotogramas (tras montar o redimensionar)
      if (!animate && staticFrames >= 10) return;
      // 0,75 de tolerancia: con rAF a 120/144 Hz el siguiente tick cae justo por debajo de 16,7 ms
      if (now - last < FRAME_MS * 0.75) return;
      last = now;
      staticFrames++;
      advance();
    };
    raf = requestAnimationFrame(loop);
    const onResize = () => (staticFrames = 0);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  });


  // El logo se reconstruye con primitivas (no hay .glb): tubos, esfera y toro.
  // Coordenadas tomadas del logo (px) y escaladas a unidades de escena.
  const S = 40;
  const pt = (x: number, y: number) => new THREE.Vector3((x - LOGO.center.x) / S, -(y - LOGO.center.y) / S, 0);
  const R = 0.32;
  const armL = new THREE.CatmullRomCurve3(LOGO.armLeftPoints.map(([x, y]) => pt(x, y)));
  const armR = new THREE.CatmullRomCurve3(LOGO.armRightPoints.map(([x, y]) => pt(x, y)));
  const radial = lite ? 10 : 20;
  const geoArmL = new THREE.TubeGeometry(armL, lite ? 32 : 64, R, radial, false);
  const geoArmR = new THREE.TubeGeometry(armR, lite ? 32 : 64, R, radial, false);
  const geoStem = new THREE.CylinderGeometry(R, R, (LOGO.stemEnd.y - LOGO.center.y) / S, radial);
  const geoCap = new THREE.SphereGeometry(R, radial, 12);
  const geoDot = new THREE.SphereGeometry(0.55, lite ? 16 : 32, lite ? 12 : 24);
  const geoRing = new THREE.TorusGeometry(0.86, 0.2, lite ? 10 : 16, lite ? 32 : 64);

  // Partículas ambientales
  const COUNT = lite ? 350 : 1200;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 6 + Math.random() * 14;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
    pos[i * 3 + 2] = Math.sin(a) * r - 4;
  }
  const geoPoints = new THREE.BufferGeometry();
  geoPoints.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  // Líneas de código flotando entre los puntos. Están dentro del mismo grupo (`field`),
  // así que giran con ellos. Cada línea es un sprite (siempre mira a cámara) con una textura
  // de canvas; las repetidas comparten textura y material.
  // Código inventado y genérico: no incluir nombres de proveedores, rutas, módulos ni símbolos
  // de ningún proyecto real o de un empleador (el repo es público; scripts/smoke.mjs lo vigila).
  const SNIPPETS = [
    'def apply_discount(order, rate): return order.total * (1 - rate)',
    'SELECT customer_id, SUM(amount) FROM payments GROUP BY 1;',
    'class OrderState(Enum): DRAFT, PAID, SHIPPED',
    'adapter = PaymentGatewayAdapter(region="EU")',
    'path("orders/<int:pk>/", views.order_detail)',
    'for event in queue.pending(): handler.dispatch(event)',
    'tenant = Tenant.objects.get(slug=request.tenant)',
    'class Invoice(models.Model): total = DecimalField()',
    'with transaction.atomic(): ledger.record(entry)',
    '@receiver(post_save, sender=Order)',
    'docker build -t api:1.0.0 . && docker push api:1.0.0',
    'pytest --cov=billing --cov=orders -q',
    'celery -A core worker -l info -Q default',
    'class Gateway(Protocol): def charge(self, order) -> Receipt: ...',
    'agent = Agent(tools=[search_docs, send_message])',
    'GET /api/v1/orders/?status=open&page=2',
    'if risk_score > threshold: raise ValidationError("rejected")',
    'def transition(state, event): return RULES[state][event]',
    'queryset = Report.objects.using("replica").all()',
    'git rebase --onto main feature/billing',
    'export const load = async ({ params }) => fetchOrder(params.id)',
    'gsap.to(camera.position, { z: 8, ease: "none" })',
  ];
  const LINE_COUNT = lite ? 16 : 46;
  type CodeLine = { p: [number, number, number]; w: number; h: number; mat: THREE.SpriteMaterial };
  let lines = $state<CodeLine[]>([]);
  const lineMats: THREE.SpriteMaterial[] = [];
  const lineTex: THREE.CanvasTexture[] = [];
  // Posición local de cada línea y su material (uno por sprite, para poder desvanecerlas por distancia)
  const lineData: { p: [number, number, number]; mat: THREE.SpriteMaterial }[] = [];
  const LINE_OPACITY = 0.2;

  onMount(() => {
    let cancelled = false;
    (async () => {
      const font = '500 26px "Source Code Pro Variable", ui-monospace, monospace';
      try {
        await document.fonts.load(font);
      } catch {
        /* sin la fuente se dibuja con monospace del sistema */
      }
      if (cancelled) return;
      const H = 0.3; // alto de cada línea en unidades de escena
      const made = new Map<string, { tex: THREE.CanvasTexture; w: number }>();
      const out: CodeLine[] = [];
      for (let i = 0; i < LINE_COUNT; i++) {
        const text = SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];
        let entry = made.get(text);
        if (!entry) {
          const cv = document.createElement('canvas');
          const ctx = cv.getContext('2d')!;
          ctx.font = font;
          const px = Math.ceil(ctx.measureText(text).width) + 16;
          cv.width = px;
          cv.height = 40;
          ctx.font = font;
          ctx.fillStyle = '#fff';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 8, 21);
          const tex = new THREE.CanvasTexture(cv);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          lineTex.push(tex);
          entry = { tex, w: (px / 40) * H };
          made.set(text, entry);
        }
        const r = 5 + Math.random() * 14;
        const a = Math.random() * Math.PI * 2;
        const p: [number, number, number] = [Math.cos(a) * r, (Math.random() - 0.5) * 18, Math.sin(a) * r - 4];
        const mat = new THREE.SpriteMaterial({ map: entry.tex, transparent: true, opacity: LINE_OPACITY, depthWrite: false });
        lineMats.push(mat);
        lineData.push({ p, mat });
        out.push({ p, w: entry.w, h: H, mat });
      }
      lines = out;
    })();
    return () => {
      cancelled = true;
    };
  });

  let camera = $state<THREE.PerspectiveCamera>();
  let logo = $state<THREE.Group>();
  let field = $state<THREE.Group>();
  let bodyMat = $state<THREE.MeshStandardMaterial>();
  let accentMat = $state<THREE.MeshStandardMaterial>();
  let lightA = $state<THREE.PointLight>();

  const tint = new THREE.Color();
  const white = new THREE.Color(PALETTE.white);
  let t = 0;
  const LITE_CAM = 1.55; // la cámara se aleja en pantallas estrechas
  const LOGO_UNITS_H = 4.7; // alto del logo en unidades de escena
  const sideFactor = lite ? 0.15 : 1; // en móvil el logo no se desplaza al lado

  useTask((dt) => {
    if (!camera || !logo) return;
    const k = animate ? 1 - Math.exp(-6 * dt) : 1;
    t += animate ? dt : 0;

    camera.position.x += (story.camX - camera.position.x) * k;
    camera.position.y += (story.camY - camera.position.y) * k;
    camera.position.z += (story.camZ * (lite ? LITE_CAM : 1) - camera.position.z) * k;
    camera.lookAt(0, 0, 0);

    logo.rotation.y += (story.rotY - logo.rotation.y) * k;
    logo.rotation.x += (story.rotX - logo.rotation.x) * k;
    logo.position.x += (story.logoX * sideFactor - logo.position.x) * k;
    const lift = lite ? story.lift * 3.2 : 0;
    let baseY = story.logoY + lift;
    let fit = 1;
    // Móvil, hero: centrar el logo en el hueco libre sobre el texto y reducirlo si el hueco es pequeño.
    // Se mezcla con heroW para que la transición hero → Perfil sea continua.
    if (lite && story.heroW > 0 && layout.heroFreeBottom > layout.heroFreeTop) {
      const vh = window.innerHeight;
      const unitsPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(20)) * story.camZ * LITE_CAM) / vh; // fov 40°
      const freeH = layout.heroFreeBottom - layout.heroFreeTop;
      const logoPx = (LOGO_UNITS_H * 0.8) / unitsPerPx;
      const centerUpPx = vh / 2 - (layout.heroFreeTop + layout.heroFreeBottom) / 2;
      baseY += story.heroW * (centerUpPx * unitsPerPx - baseY);
      fit = 1 + story.heroW * (Math.min(1, Math.max(0.45, (freeH * 0.94) / logoPx)) - 1);
    }
    logo.position.y += (baseY + Math.sin(t * 0.8) * 0.12 - logo.position.y) * k;
    const s = story.scale * (lite ? 0.8 : 1) * fit;
    logo.scale.setScalar(logo.scale.x + (s - logo.scale.x) * k);

    // Color de la sección: el logo entero (cuerpo, punto y anillo), la luz y las líneas de código
    // usan el mismo color. Se interpola en sRGB (story.r/g/b) para que el cambio sea limpio.
    tint.setRGB(story.r, story.g, story.b, THREE.SRGBColorSpace);
    if (bodyMat) {
      bodyMat.color.copy(tint);
      bodyMat.emissive.copy(tint).multiplyScalar(0.22);
    }
    if (accentMat) {
      accentMat.color.copy(tint);
      accentMat.emissive.copy(tint).multiplyScalar(0.22);
    }
    if (lightA) lightA.color.copy(tint);
    if (lineMats.length) {
      tint.lerp(white, 0.45);
      for (const m of lineMats) m.color.copy(tint);
    }

    // Puntos y líneas de código orbitan juntos
    if (field) {
      field.rotation.y += story.spin * dt;
      // Las líneas que pasan cerca de la cámara se ven enormes y borrosas: se desvanecen
      // con la distancia (0 a menos de 5 unidades, opacidad completa a partir de 13).
      const c = Math.cos(field.rotation.y);
      const sn = Math.sin(field.rotation.y);
      const cam = camera.position;
      for (const l of lineData) {
        const wx = l.p[0] * c + l.p[2] * sn;
        const wz = -l.p[0] * sn + l.p[2] * c;
        const d = Math.hypot(wx - cam.x, l.p[1] - cam.y, wz - cam.z);
        const f = THREE.MathUtils.smoothstep(d, 5, 13);
        l.mat.opacity = LINE_OPACITY * f;
      }
    }
  });

  onDestroy(() => {
    [geoArmL, geoArmR, geoStem, geoCap, geoDot, geoRing, geoPoints].forEach((g) => g.dispose());
    lineTex.forEach((x) => x.dispose());
    lineMats.forEach((x) => x.dispose());
  });
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 15]} fov={40} bind:ref={camera} />

<T.AmbientLight intensity={0.5} color="#b9a8ff" />
<T.DirectionalLight position={[4, 6, 6]} intensity={2.2} color="#ffffff" />
<T.PointLight position={[-6, 2, 4]} intensity={90} color={PALETTE.violet} bind:ref={lightA} />
<T.PointLight position={[6, -3, -3]} intensity={60} color={PALETTE.pink} />

<T.Group bind:ref={logo}>
  <T.Mesh geometry={geoArmL}>
    <T.MeshStandardMaterial color={PALETTE.violet} metalness={0.3} roughness={0.35} emissive="#2a0a52" bind:ref={bodyMat} />
  </T.Mesh>
  <T.Mesh geometry={geoArmR} material={bodyMat} />
  <T.Mesh geometry={geoStem} position={[0, -((LOGO.center.y + LOGO.stemEnd.y) / 2 - LOGO.center.y) / S, 0]} material={bodyMat} />
  <T.Mesh geometry={geoCap} position={armL.getPoint(0).toArray()} material={bodyMat} />
  <T.Mesh geometry={geoCap} position={armR.getPoint(0).toArray()} material={bodyMat} />
  <T.Mesh geometry={geoCap} position={pt(LOGO.stemEnd.x, LOGO.stemEnd.y).toArray()} material={bodyMat} />
  <T.Mesh geometry={geoDot} position={pt(LOGO.dot.cx, LOGO.dot.cy).toArray()}>
    <T.MeshStandardMaterial color={PALETTE.violet} metalness={0.3} roughness={0.35} emissive="#2a0a52" bind:ref={accentMat} />
  </T.Mesh>
  <T.Mesh geometry={geoRing} position={pt(LOGO.ring.cx, LOGO.ring.cy).toArray()} material={accentMat} />
</T.Group>

<T.Group bind:ref={field}>
  <T.Points geometry={geoPoints}>
    <T.PointsMaterial color={PALETTE.mint} size={lite ? 0.06 : 0.045} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
  </T.Points>
  {#each lines as l}
    <T.Sprite position={l.p} scale={[l.w, l.h, 1]} material={l.mat} />
  {/each}
</T.Group>
