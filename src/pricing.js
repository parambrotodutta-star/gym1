export function initPricing() {
  const section = document.getElementById('membership');
  if (!section) return;

  const slides = [...section.querySelectorAll('.pricing-slide')];
  if (!slides.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const interval = parseInt(section.dataset.cycle || '7000', 10);
  let idx = slides.findIndex((s) => s.classList.contains('is-active'));
  if (idx === -1) idx = 0;
  let timer = null;

  const activate = (i) => {
    slides[idx].classList.remove('is-active');
    slides[i].classList.add('is-active');
    idx = i;
  };

  const cycle = () => {
    activate((idx + 1) % slides.length);
  };

  const go = (tier) => {
    const n = slides.findIndex((s) => s.dataset.tier === tier);
    if (n !== -1) activate(n);
  };

  section._aegisPricing = {
    next: () => cycle(),
    current: () => idx,
    go,
    stop: () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    },
  };
  if (reduced) return;
  timer = window.setInterval(cycle, Math.max(interval, 2500));
}
