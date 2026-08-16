export function initNav(lenis) {
  const header = document.getElementById('site-nav');
  const burger = document.getElementById('nav-burger');
  const menu = document.getElementById('mobile-menu');

  if (!header || !burger || !menu) return;

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 32);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const isOpen = () => menu.classList.contains('is-open');

  const backgroundNodes = [
    document.querySelector('main'),
    document.querySelector('.footer'),
    document.querySelector('.grain'),
    document.querySelector('.skip-link'),
  ].filter(Boolean);

  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('no-scroll', open);
    menu.inert = !open;
    backgroundNodes.forEach((node) => {
      node.inert = open;
    });
    if (open) {
      const firstLink = menu.querySelector('a');
      if (firstLink) {
        const moveFocus = () => firstLink.focus({ preventScroll: true });
        requestAnimationFrame(() => {
          requestAnimationFrame(moveFocus);
        });
        window.setTimeout(() => {
          if (isOpen() && document.activeElement === burger) moveFocus();
        }, 160);
      }
    } else {
      burger.focus();
    }
    if (lenis) {
      if (open) lenis.stop();
      else lenis.start();
    }
  };

  burger.addEventListener('click', () => setMenu(!isOpen()));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setMenu(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && isOpen()) setMenu(false);
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      if (isOpen()) setMenu(false);
      const target = document.querySelector(href);
      if (!target) return;
      if (lenis) {
        lenis.scrollTo(target, { offset: -64, duration: 1.4 });
      } else {
        target.scrollIntoView({ block: 'start' });
      }
    });
  });
}
