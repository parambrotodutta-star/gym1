import 'lenis/dist/lenis.css';
import './style.css';
import { createIcons, Menu, X, ArrowUpRight, MapPin, Mail, Phone, Clock, Instagram } from 'lucide';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initNav } from './nav.js';
import { initPricing } from './pricing.js';
import { initAnimations } from './animations.js';

gsap.registerPlugin(ScrollTrigger);

document.documentElement.classList.add('js');

createIcons({
  icons: { Menu, X, ArrowUpRight, MapPin, Mail, Phone, Clock, Instagram },
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initPricing();

if (!reducedMotion) {
  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  initNav(lenis);
  initAnimations();
} else {
  initNav(null);
}
