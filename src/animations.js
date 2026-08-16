import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const easeOut = 'power3.out';
const easeCinematic = 'power4.inOut';

export function initAnimations() {
  heroTimeline();
  philosophyReveal();
  reveals();
  revealHead();
  mediaMasks();
  mediaLighting();
  trainingScrub();
  trainingHover();
  galleryEditorial();
  galleryHover();
  servicesReveal();
  pricingAtmosphere();
  rules();
  kickerFade();
  navActive();
  ctaCinematic();
}

const maskReveal = (el, { duration = 1.15, stagger = 0.09, start = 'top 82%' } = {}) => {
  const inners = el.querySelectorAll('.mask-line-inner');
  if (!inners.length) return;
  gsap.fromTo(
    inners,
    { yPercent: 118, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration,
      stagger,
      ease: 'power4.out',
      scrollTrigger: { trigger: el, start },
    },
  );
};

/* ————— Hero — cinematic entrance, staggered to a single beat ————— */

function heroTimeline() {
  const media = document.querySelector('.hero-media');
  const glow = document.querySelector('.hero-glow');
  const mark = document.querySelector('.hero-mark');
  const lines = gsap.utils.toArray('.hero-title .mask-line-inner');
  const eyebrow = document.querySelector('.hero-eyebrow');
  const rail = document.querySelector('.hero-rail');
  const ctas = document.querySelector('.hero-cta');
  const coord = document.querySelector('.hero-coord');
  const nav = document.getElementById('site-nav');

  const tl = gsap.timeline({ defaults: { ease: easeOut } });

  tl.fromTo(
    lines,
    { yPercent: 118, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: 'power4.out' },
    0.85,
  );

  if (media) {
    tl.fromTo(media, { autoAlpha: 0, scale: 1.16 }, { autoAlpha: 1, scale: 1, duration: 2.1, ease: 'power2.out' }, 0);
  }

  if (glow) {
    tl.to(glow, { opacity: 1, duration: 2.2, ease: 'power2.out' }, 0.4);
  }

  if (mark) {
    tl.fromTo(mark, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.1);
  }

  if (nav) {
    tl.fromTo(nav, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.55);
  }

  if (eyebrow) {
    tl.fromTo(eyebrow, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.65);
  }

  if (rail) {
    tl.fromTo(rail, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1 }, 1.6);
  }

  if (ctas) {
    tl.fromTo(ctas, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.6);
  }

  if (coord) {
    tl.fromTo(coord, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.9);
  }
}

/* ————— Philosophy — statement lines, accent word settles last ————— */

function philosophyReveal() {
  const statement = document.querySelector('.philosophy-statement');
  if (!statement) return;
  const inners = statement.querySelectorAll('.mask-line-inner');
  if (!inners.length) return;
  const accent = statement.querySelector('.accent-word');

  gsap.fromTo(
    inners,
    { yPercent: 118, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: 1.1,
      stagger: 0.1,
      ease: 'power4.out',
      scrollTrigger: { trigger: statement, start: 'top 78%' },
    },
  );

  if (accent) {
    gsap.fromTo(
      accent,
      { scale: 0.96 },
      {
        scale: 1,
        duration: 1.2,
        delay: 0.45,
        ease: 'power3.out',
        scrollTrigger: { trigger: statement, start: 'top 78%' },
      },
    );
  }
}

/* ————— Generic reveals ————— */

function reveals() {
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: easeOut,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
}

function revealHead() {
  gsap.utils.toArray('[data-reveal-head]').forEach((el) => {
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 1.1,
      ease: easeOut,
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });
}

function mediaMasks() {
  gsap.utils.toArray('.media-mask').forEach((wrap) => {
    const img = wrap.querySelector('img');
    if (!img) return;
    const tl = gsap
      .timeline({ scrollTrigger: { trigger: wrap, start: 'top 82%' }, defaults: { ease: easeCinematic } })
      .fromTo(wrap, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05 });
    if (!wrap.classList.contains('gallery-item')) {
      tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.25 }, 0);
    }
  });
}

/* ————— Neutral media lighting — faint top-light fades in as media enters ————— */

function mediaLighting() {
  gsap.utils.toArray('.discipline-media, .gallery-item').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => el.classList.add('is-lit'),
    });
  });
}

/* ————— Training — images scrub through on scroll ————— */

function trainingScrub() {
  document.querySelectorAll('.discipline-media img').forEach((img) => {
    const wrap = img.closest('.discipline-media');
    if (!wrap) return;
    gsap.fromTo(
      img,
      { yPercent: -7 },
      {
        yPercent: 7,
        ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

/* ————— Training hover — image lifts 3%, typography shifts 8px ————— */

function trainingHover() {
  document.querySelectorAll('.discipline-media').forEach((wrap) => {
    const img = wrap.querySelector('img');
    if (!img) return;
    wrap.addEventListener('mouseenter', () => gsap.to(img, { scale: 1.03, duration: 0.9, ease: easeOut }));
    wrap.addEventListener('mouseleave', () => gsap.to(img, { scale: 1, duration: 0.9, ease: easeOut }));
  });
}

/* ————— Gallery — editorial: mask reveal, varied parallax, caption reveal ————— */

function galleryEditorial() {
  gsap.utils.toArray('.gallery-item').forEach((item) => {
    const img = item.querySelector('img');
    if (!img) return;
    const speed = parseInt(item.dataset.speed, 10) || 6;
    gsap.fromTo(
      img,
      { yPercent: -speed },
      {
        yPercent: speed,
        ease: 'none',
        scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
    const caption = item.querySelector('.gallery-caption');
    if (caption) {
      gsap.fromTo(
        caption,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: easeOut,
          scrollTrigger: { trigger: item, start: 'top 80%' },
        },
      );
    }
  });
}

function galleryHover() {
  gsap.utils.toArray('.gallery-item').forEach((item) => {
    const img = item.querySelector('img');
    if (!img) return;
    item.addEventListener('mouseenter', () => gsap.to(img, { scale: 1.05, duration: 1.1, ease: easeCinematic }));
    item.addEventListener('mouseleave', () => gsap.to(img, { scale: 1, duration: 1.1, ease: easeCinematic }));
  });
}

/* ————— Services — rows rise, dividers draw, titles clip in ————— */

function servicesReveal() {
  const list = document.querySelector('.services-list');
  if (!list) return;
  const rows = gsap.utils.toArray('.service-row');
  if (!rows.length) return;
  const titles = gsap.utils.toArray('.service-row .service-title .mask-line-inner');
  const tl = gsap.timeline({
    scrollTrigger: { trigger: list, start: 'top 84%' },
  });
  tl.fromTo(rows, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.14, ease: easeOut })
    .fromTo(rows, { '--draw': 0 }, { '--draw': 1, duration: 1, stagger: 0.14, ease: easeCinematic }, '<0.1')
    .fromTo(titles, { yPercent: 118 }, { yPercent: 0, duration: 0.8, stagger: 0.14, ease: 'power4.out' }, '<0.15');
}

/* ————— Pricing — atmosphere: title mask, card stagger, slow bg drift ————— */

function pricingAtmosphere() {
  const section = document.querySelector('.pricing');
  if (!section) return;

  const title = section.querySelector('.pricing-title');
  if (title) maskReveal(title, { start: 'top 80%', stagger: 0.16 });

  const cards = [...section.querySelectorAll('.pricing-card')];
  if (cards.length) {
    gsap.fromTo(
      cards,
      { y: 44, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.12,
        ease: easeOut,
        scrollTrigger: { trigger: section.querySelector('.pricing-cards'), start: 'top 84%' },
      },
    );
  }

  const amounts = section.querySelectorAll('.pc-amount');
  if (amounts.length) {
    gsap.fromTo(
      amounts,
      { autoAlpha: 0, y: 14 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        delay: 0.4,
        ease: easeOut,
        scrollTrigger: { trigger: section.querySelector('.pricing-cards'), start: 'top 84%' },
      },
    );
  }

  const bg = section.querySelector('.pricing-bg');
  if (bg) {
    gsap.fromTo(
      bg,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  }
}

/* ————— Section rules ————— */

function rules() {
  gsap.utils.toArray('[data-rule]').forEach((rule) => {
    gsap.fromTo(
      rule,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.2,
        ease: easeCinematic,
        transformOrigin: 'left center',
        scrollTrigger: { trigger: rule, start: 'top 92%' },
      },
    );
  });
}

/* ————— Section labels — titanium-silver kicker fades into visibility ————— */

function kickerFade() {
  gsap.utils.toArray('.section-kicker').forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, x: -10 },
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.9,
        ease: easeOut,
        scrollTrigger: { trigger: el, start: 'top 92%' },
      },
    );
  });
}

/* ————— Navigation — electric-lime active state follows the scroll ————— */

function navActive() {
  const links = [...document.querySelectorAll('.nav-link')];
  if (!links.length) return;
  const byId = new Map();
  links.forEach((link) => {
    const id = (link.getAttribute('href') || '').slice(1);
    if (id) byId.set(id, link);
  });
  byId.forEach((link, id) => {
    const section = document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (!self.isActive) return;
        links.forEach((l) => l.classList.remove('is-active'));
        link.classList.add('is-active');
      },
    });
  });
}

/* ————— Final CTA — cinematic slow zoom + masked lines ————— */

function ctaCinematic() {
  const media = document.querySelector('.cta-media');
  if (media) {
    gsap.fromTo(
      media,
      { scale: 1 },
      {
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  }
  const title = document.querySelector('.cta-title');
  if (title) maskReveal(title, { start: 'top 80%' });
}
