export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const contact = {
  email: 'yoeldategeek@gmail.com',
  phone: '+34614238351',
  handle: '@yoelayan',
  instagram: 'https://instagram.com/yoelayan',
  // wa.me exige el número en formato internacional, solo dígitos
  whatsapp: 'https://wa.me/34614238351',
  github: 'https://github.com/yoelayan',
  linkedin: 'https://linkedin.com/in/yoel-ayan',
} as const;

/** Ruta de la página en cada idioma (español en la raíz, inglés bajo /en/). */
export const pathFor = (lang: Locale) => (lang === 'es' ? '/' : '/en/');

/** Idioma contrario, para el selector. */
export const otherLocale = (lang: Locale): Locale => (lang === 'es' ? 'en' : 'es');

interface Card {
  title: string;
  lead?: string; // subtítulo en negrita antes del texto
  text: string;
  tags?: string[];
}

export interface Dict {
  meta: { title: string; description: string; jobTitle: string; ogAlt: string; locale: string };
  skip: string;
  slogan: { pre: string; highlight: string; post: string };
  nav: { label: string; about: string; services: string; projects: string; skills: string; contact: string };
  lang: { switchTo: string; short: string };
  hero: { kicker: string; title: string; role: string; lead: string; ctaPrimary: string; ctaSecondary: string; scroll: string };
  about: { title: string; paragraphs: string[]; ready: string; stackTitle: string; stack: string[] };
  services: { title: string; lead: string; items: Card[]; processTitle: string; steps: { title: string; text: string }[]; note: string };
  projects: { title: string; lead: string; items: Card[] };
  skills: {
    title: string;
    groups: { title: string; items: string[] }[];
    educationTitle: string;
    education: string;
    certsTitle: string;
    certs: { name: string; issuer: string; year: string }[];
  };
  contact: { cardTitle: string; lead: string; cta: string; availability: string; linkedin: string; github: string };
  footer: string;
  a11y: { sceneAlt: string };
}

export const ui: Record<Locale, Dict> = {
  es: {
    meta: {
      title: 'Yoel Ayan — Senior Backend Developer y consultor de software',
      // ≤155 caracteres: Google trunca a partir de ahí (scripts/smoke.mjs lo comprueba)
      description: 'Líder técnico backend especializado en Fintech y ERP: Python, Django y arquitectura. Más de 6 años de experiencia. Tenerife, España · remoto.',
      jobTitle: 'Desarrollador Backend Senior',
      ogAlt: 'Logo de Yoel Ayan sobre fondo azul marino',
      locale: 'es_ES',
    },
    skip: 'Saltar al contenido',
    // El eslogan de marca se mantiene en inglés en ambos idiomas.
    slogan: { pre: 'Make decisions based on', highlight: 'DATA', post: ', not your intuition' },
    nav: { label: 'Principal', about: 'Perfil', services: 'Servicios', projects: 'Proyectos', skills: 'Habilidades', contact: 'Contacto' },
    lang: { switchTo: 'Cambiar a inglés', short: 'EN' },
    hero: {
      kicker: 'Senior Backend Developer · Python / Django',
      title: 'Yoel Ayan',
      role: 'Líder técnico y consultor de software',
      lead: 'Construyo productos Fintech y ERP que escalan: arquitectura limpia, sistemas transaccionales y equipos que entregan.',
      ctaPrimary: 'Hablemos',
      ctaSecondary: 'Ver servicios',
      scroll: 'Desliza para explorar',
    },
    about: {
      title: 'Perfil',
      paragraphs: [
        'Soy Yoel, desarrollador backend con más de 6 años construyendo software para Fintech y ERP con Python y Django. Empecé en 2020 en una agencia, pasé por una fintech de factoring y hoy soy líder técnico de un equipo de 8 desarrolladores en Leasy, donde la plataforma opera en 5 países y atiende a más de 10.000 clientes.',
        'Me gusta aplicar patrones de diseño para que los sistemas resuelvan problemas complejos con el mínimo esfuerzo, y crear agentes de IA basados en LLMs que automatizan procesos reales.',
        'Soy autodidacta y aprendo trabajando en producción, revisando código y tomando decisiones de arquitectura junto a mi equipo. Además fundé INMOBAPP, un SaaS PropTech multi-tenant que hoy dirijo como Product & Tech Lead.',
      ],
      ready: 'Estoy listo para nuevos retos.',
      stackTitle: 'Stack',
      stack: ['Python', 'Django', 'DRF', 'PostgreSQL', 'Redis', 'Celery', 'Docker', 'GitHub Actions', 'AWS', 'React', 'TypeScript', 'Svelte'],
    },
    services: {
      title: 'Consultoría de software',
      lead: 'Analizo la salud técnica de tu proyecto, optimizo la calidad del software y extraigo valor de tus datos para que el producto perdure.',
      items: [
        {
          title: 'Auditoría de software',
          lead: 'Diagnóstico técnico y refactorización',
          text: 'Revisión exhaustiva de la arquitectura de software, la calidad del código fuente y la deuda técnica. Identificación de cuellos de botella y entrega de un plan de escalabilidad con hoja de ruta concreta.',
        },
        {
          title: 'QA & DevOps',
          lead: 'Automatización y entrega continua',
          text: 'Estrategia de pruebas automatizadas (unitarias, integración y E2E), diseño de pipelines de CI/CD para despliegues seguros a producción y checklists de lanzamiento.',
        },
        {
          title: 'Análisis de datos',
          lead: 'Autoservicio y métricas de negocio',
          text: 'Diseño de sistemas de consulta segura (Dataclips/SQL), integración de reportes y dashboards para analistas, y estructuración de datos para tomar decisiones sin depender del equipo técnico.',
        },
        {
          title: 'Integraciones & IA',
          lead: 'Automatización y servicios de terceros',
          text: 'Integración con proveedores externos de riesgo e identidad mediante patrones escalables, y desarrollo de agentes de IA y automatizaciones para optimizar procesos operativos.',
        },
      ],
      processTitle: 'Cómo trabajamos',
      steps: [
        { title: 'Requerimientos', text: 'Presentación de la oferta, alineación de expectativas y levantamiento inicial de necesidades.' },
        { title: 'Auditoría y evaluación', text: 'Inspección profunda del código fuente, la base de datos, la arquitectura y los pipelines junto al equipo.' },
        { title: 'Plan de ruta y reporte', text: 'Entrega del informe de auditoría con hallazgos prioritarios, propuesta técnica y plan de acción de datos.' },
        { title: 'Acompañamiento e implementación', text: 'Sesiones periódicas con el equipo y los líderes técnicos para ejecutar las mejoras del plan de ruta.' },
      ],
      note: 'Los costos dependen de los requerimientos del proyecto.',
    },
    projects: {
      title: 'Proyectos',
      lead: 'Producto en producción, a escala real.',
      items: [
        {
          title: 'Leasy',
          text: 'Fintech de financiación vehicular en 5 países. Separé la lógica en dominios (DDD y hexagonal), integré 9 proveedores de riesgo e identidad con el patrón Adapter y co-desarrollé un agente de IA que redujo la aprobación de 3 días a pocas horas.',
          tags: ['Django', 'DDD', 'AWS', 'LLMs'],
        },
        {
          title: 'INMOBAPP',
          text: 'SaaS PropTech B2B multi-tenant con MLS centralizado: esquemas aislados por inmobiliaria, core financiero multimoneda con ledger de doble entrada y SSR con SEO.',
          tags: ['django-tenants', 'React', 'PostgreSQL', 'Railway'],
        },
        {
          title: 'Digital Factoring',
          text: 'Cliente fintech con más de 1.000.000 USD en deuda activa: participé en la separación en 3 microservicios y programé el scoring antiblanqueo (LAFT) para más de 6.000 clientes.',
          tags: ['Django', 'Angular', 'Microservicios'],
        },
      ],
    },
    skills: {
      title: 'Estudios y habilidades',
      groups: [
        { title: 'Backend', items: ['Python', 'Django', 'Django REST Framework', 'Django Ninja', 'PHP/Symfony'] },
        { title: 'Datos y colas', items: ['PostgreSQL', 'Redis', 'Celery', 'Dramatiq'] },
        { title: 'Arquitectura', items: ['Microservicios', 'DDD', 'Arquitectura hexagonal', 'Multi-tenant', 'APIs REST', 'Patrones de diseño', 'Máquinas de estados', 'Ledger de doble entrada'] },
        { title: 'Cloud y DevOps', items: ['Docker', 'GitHub Actions', 'CI/CD', 'AWS (S3, SES)', 'Railway'] },
        { title: 'IA', items: ['Integración de LLMs', 'Agentes de IA', 'Webhooks'] },
        { title: 'Testing', items: ['Pytest', 'Cypress', 'Code review'] },
        { title: 'Frontend', items: ['React', 'TypeScript', 'Svelte', 'Angular', 'Inertia.js', 'Vue (básico)'] },
        { title: 'Metodologías', items: ['Scrum', 'Kanban', 'Liderazgo técnico'] },
      ],
      educationTitle: 'Formación',
      education: 'Autodidacta, con formación continua en backend, arquitectura de software y cloud, aplicada en producción desde 2020.',
      certsTitle: 'Certificaciones',
      certs: [
        { name: 'Master en Python: Python 3, Django y Flask', issuer: 'Udemy', year: '2022' },
        { name: 'Fundamentos de Scrum', issuer: 'CertiProf', year: '2023' },
        { name: 'SQL: desarrollo y gestión de bases de datos', issuer: 'Crehana', year: '2021' },
        { name: 'React: patrones de render y composición', issuer: 'Platzi', year: '2022' },
        { name: 'Buenas prácticas de escritura de código', issuer: 'Platzi', year: '2022' },
      ],
    },
    contact: {
      cardTitle: 'Información de contacto',
      lead: 'Cuéntame tu proyecto. Trabajo en remoto o híbrido.',
      cta: 'Escríbeme por WhatsApp',
      availability: 'Tenerife, España · NIE/TIE con permiso de trabajo',
      linkedin: 'LinkedIn',
      github: 'GitHub',
    },
    footer: 'Hecho con Astro, Svelte, Three.js y GSAP.',
    a11y: { sceneAlt: 'Logotipo de Yoel Ayan en 3D que rota mientras se desplaza la página' },
  },
  en: {
    meta: {
      title: 'Yoel Ayan — Senior Backend Developer & software consultant',
      description: 'Backend tech lead specialised in Fintech and ERP: Python, Django and architecture. 6+ years of experience. Tenerife, Spain · remote.',
      jobTitle: 'Senior Backend Developer',
      ogAlt: 'Yoel Ayan logo on a navy background',
      locale: 'en_US',
    },
    skip: 'Skip to content',
    slogan: { pre: 'Make decisions based on', highlight: 'DATA', post: ', not your intuition' },
    nav: { label: 'Main', about: 'About', services: 'Services', projects: 'Projects', skills: 'Skills', contact: 'Contact' },
    lang: { switchTo: 'Switch to Spanish', short: 'ES' },
    hero: {
      kicker: 'Senior Backend Developer · Python / Django',
      title: 'Yoel Ayan',
      role: 'Tech lead & software consultant',
      lead: 'I build Fintech and ERP products that scale: clean architecture, transactional systems and teams that ship.',
      ctaPrimary: "Let's talk",
      ctaSecondary: 'See services',
      scroll: 'Scroll to explore',
    },
    about: {
      title: 'About',
      paragraphs: [
        "I'm Yoel, a backend developer with 6+ years building software for Fintech and ERP with Python and Django. I started in 2020 at an agency, moved through a factoring fintech, and today I'm tech lead of an 8-developer team at Leasy, where the platform runs in 5 countries and serves over 10,000 customers.",
        'I like applying design patterns so systems solve complex problems with minimum effort, and building LLM-based AI agents that automate real processes.',
        'I am self-taught and learn by working in production, reviewing code and making architecture decisions alongside my team. I also founded INMOBAPP, a multi-tenant PropTech SaaS that I now run as Product & Tech Lead.',
      ],
      ready: "I'm ready for new challenges.",
      stackTitle: 'Stack',
      stack: ['Python', 'Django', 'DRF', 'PostgreSQL', 'Redis', 'Celery', 'Docker', 'GitHub Actions', 'AWS', 'React', 'TypeScript', 'Svelte'],
    },
    services: {
      title: 'Software consulting',
      lead: "I analyse your project's technical health, optimise software quality and extract value from your data so the product lasts.",
      items: [
        {
          title: 'Software audit',
          lead: 'Technical diagnosis and refactoring',
          text: 'In-depth review of the software architecture, source-code quality and technical debt. Bottleneck identification and delivery of a scalability plan with a concrete roadmap.',
        },
        {
          title: 'QA & DevOps',
          lead: 'Automation and continuous delivery',
          text: 'Automated testing strategy (unit, integration and E2E), CI/CD pipeline design for safe production deployments, and launch checklists.',
        },
        {
          title: 'Data analysis',
          lead: 'Self-service and business metrics',
          text: 'Design of secure query systems (Dataclips/SQL), integration of reports and dashboards for analysts, and data structuring so decisions do not depend on the tech team.',
        },
        {
          title: 'Integrations & AI',
          lead: 'Automation and third-party services',
          text: 'Integration with external risk and identity providers through scalable patterns, and development of AI agents and automations to optimise operational processes.',
        },
      ],
      processTitle: 'How we work',
      steps: [
        { title: 'Requirements', text: 'Service presentation, expectation alignment and initial needs gathering.' },
        { title: 'Audit & assessment', text: 'In-depth inspection of the source code, database, architecture and pipelines together with the team.' },
        { title: 'Roadmap & report', text: 'Delivery of the audit report with prioritised findings, a technical proposal and a data action plan.' },
        { title: 'Support & implementation', text: 'Regular sessions with the team and technical leads to carry out the roadmap improvements.' },
      ],
      note: 'Costs depend on the project requirements.',
    },
    projects: {
      title: 'Projects',
      lead: 'Production software at real scale.',
      items: [
        {
          title: 'Leasy',
          text: 'Vehicle-financing fintech in 5 countries. I split the business logic into domains (DDD and hexagonal), integrated 9 risk and identity providers with the Adapter pattern and co-built an AI agent that cut approval time from 3 days to a few hours.',
          tags: ['Django', 'DDD', 'AWS', 'LLMs'],
        },
        {
          title: 'INMOBAPP',
          text: 'B2B multi-tenant PropTech SaaS with a centralised MLS: isolated schemas per agency, a multi-currency financial core with a double-entry ledger, and SSR with SEO.',
          tags: ['django-tenants', 'React', 'PostgreSQL', 'Railway'],
        },
        {
          title: 'Digital Factoring',
          text: 'Fintech client with over USD 1,000,000 in active debt: I helped split the platform into 3 microservices and built the anti-money-laundering (LAFT) scoring for 6,000+ customers.',
          tags: ['Django', 'Angular', 'Microservices'],
        },
      ],
    },
    skills: {
      title: 'Education & skills',
      groups: [
        { title: 'Backend', items: ['Python', 'Django', 'Django REST Framework', 'Django Ninja', 'PHP/Symfony'] },
        { title: 'Data & queues', items: ['PostgreSQL', 'Redis', 'Celery', 'Dramatiq'] },
        { title: 'Architecture', items: ['Microservices', 'DDD', 'Hexagonal architecture', 'Multi-tenant', 'REST APIs', 'Design patterns', 'State machines', 'Double-entry ledger'] },
        { title: 'Cloud & DevOps', items: ['Docker', 'GitHub Actions', 'CI/CD', 'AWS (S3, SES)', 'Railway'] },
        { title: 'AI', items: ['LLM integration', 'AI agents', 'Webhooks'] },
        { title: 'Testing', items: ['Pytest', 'Cypress', 'Code review'] },
        { title: 'Frontend', items: ['React', 'TypeScript', 'Svelte', 'Angular', 'Inertia.js', 'Vue (basic)'] },
        { title: 'Methodologies', items: ['Scrum', 'Kanban', 'Technical leadership'] },
      ],
      educationTitle: 'Education',
      education: 'Self-taught, with continuous training in backend, software architecture and cloud, applied in production since 2020.',
      certsTitle: 'Certifications',
      certs: [
        { name: 'Python Master: Python 3, Django and Flask', issuer: 'Udemy', year: '2022' },
        { name: 'Scrum Fundamentals', issuer: 'CertiProf', year: '2023' },
        { name: 'SQL: database development and management', issuer: 'Crehana', year: '2021' },
        { name: 'React: render and composition patterns', issuer: 'Platzi', year: '2022' },
        { name: 'Code-writing best practices', issuer: 'Platzi', year: '2022' },
      ],
    },
    contact: {
      cardTitle: 'Contact information',
      lead: 'Tell me about your project. I work remotely or hybrid.',
      cta: 'Message me on WhatsApp',
      availability: 'Tenerife, Spain · Work permit (NIE/TIE)',
      linkedin: 'LinkedIn',
      github: 'GitHub',
    },
    footer: 'Built with Astro, Svelte, Three.js and GSAP.',
    a11y: { sceneAlt: 'Yoel Ayan logo in 3D that rotates as the page scrolls' },
  },
};
