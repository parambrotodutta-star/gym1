import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/';
const SHOT = 'C:\\Users\\User\\AppData\\Local\\Temp\\opencode\\';

const results = [];
const ok = (name, cond) => results.push({ name, pass: !!cond });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const launch = () =>
  puppeteer.launch({
    executablePath: EXE,
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1440, height: 1000 },
  });

const visible = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, display: cs.display, visibility: cs.visibility };
  }, sel);

const op = (v) => (v && v.opacity === '1' && v.display !== 'none' && v.visibility !== 'hidden' ? 1 : 0);

const collectErrors = (page, errors) => {
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (t.includes('Failed to load resource')) return;
    errors.push('console: ' + t);
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('response', (r) => {
    if (r.status() >= 400 && !/fonts\.(gstatic|googleapis)\.com|favicon/i.test(r.url())) {
      errors.push('http ' + r.status() + ' ' + r.url());
    }
  });
};

async function stepScroll(page, steps = [0.25, 0.5, 0.75, 1]) {
  for (const f of steps) {
    await page.evaluate((frac) => window.scrollTo(0, document.documentElement.scrollHeight * frac), f);
    await sleep(650);
  }
  await sleep(1400);
}

// ————— Test 1: desktop structure + pricing menu + background cycle —————
(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  const errors = [];
  collectErrors(page, errors);
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2800);

  ok('desktop: no console/page errors', errors.length === 0);
  if (errors.length) console.log('  errors:', errors);
  ok('desktop: html has .js', await page.evaluate(() => document.documentElement.classList.contains('js')));

  const sections = await page.evaluate(() =>
    [...document.querySelectorAll('main > section')].map((s) => ({ id: s.id, cls: s.className })),
  );
  ok('desktop: 7 sections in order', JSON.stringify(sections.map((s) => s.id)) === JSON.stringify(['hero', 'club', 'training', 'gallery', 'services', 'membership', 'join']));
  ok('desktop: no programs section', !(await page.$('#programs')) && (await page.$$('.program-row')).length === 0);

  const nav = await page.evaluate(() =>
    [...document.querySelectorAll('.nav-link')].map((a) => a.textContent.trim()).join('|'),
  );
  ok('desktop: nav links updated', nav === 'Training|Gallery|Services|Membership|Contact');

  ok(
    'desktop: theme toggle fully removed',
    !(await page.$('#theme-toggle')) &&
      !(await page.$('.dumbbell')) &&
      !(await page.$('.db-stage')) &&
      (await page.evaluate(() => !document.documentElement.hasAttribute('data-theme') && typeof window.__aegisDb === 'undefined')),
  );
  ok('desktop: nav keeps Join CTA', (await page.$$('.nav-actions .btn-nav')).length === 1);

  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      black: s.getPropertyValue('--black').trim(),
      charcoal: s.getPropertyValue('--deep-charcoal').trim(),
      silver: s.getPropertyValue('--titanium-silver').trim(),
      lime: s.getPropertyValue('--electric-lime').trim(),
      primary: s.getPropertyValue('--text-primary').trim(),
      muted: s.getPropertyValue('--text-muted').trim(),
      fontSerif: s.getPropertyValue('--font-serif').trim(),
      fontDisplay: s.getPropertyValue('--font-display').trim(),
      fontSans: s.getPropertyValue('--font-sans').trim(),
      fontMono: s.getPropertyValue('--font-mono').trim(),
    };
  });
  ok(
    'desktop: exact brand tokens defined',
    tokens.black === '#050505' &&
      tokens.charcoal === '#111315' &&
      tokens.silver === '#a7adb2' &&
      tokens.lime === '#c6ff00' &&
      tokens.primary === '#f4f1e8' &&
      tokens.muted === '#a7adb2',
  );
  ok(
    'desktop: editorial type system, no serif',
    tokens.fontSerif === '' &&
      tokens.fontDisplay.includes('Druk Condensed') &&
      tokens.fontDisplay.includes('Anton') &&
      tokens.fontSans.includes('Suisse Intl') &&
      tokens.fontSans.includes('DM Sans') &&
      tokens.fontMono.includes('Space Mono') &&
      (await page.evaluate(() => document.querySelectorAll('.serif').length)) === 0,
  );
  ok(
    'desktop: loads three families with swap',
    await page.evaluate(() => {
      const href = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href).join(' ');
      return (
        href.includes('Anton') &&
        href.includes('DM+Sans') &&
        href.includes('Space+Mono') &&
        href.includes('display=swap') &&
        !href.includes('Bebas+Neue') &&
        !href.includes('Manrope')
      );
    }),
  );

  const palette = await page.evaluate(() => ({
    pageBg: getComputedStyle(document.documentElement).backgroundColor,
    pricingBg: getComputedStyle(document.querySelector('.pricing')).backgroundColor,
    sectionNo: getComputedStyle(document.querySelector('.section-no')).color,
    kicker: getComputedStyle(document.querySelector('.section-kicker')).color,
    btnBg: getComputedStyle(document.querySelector('.btn-primary')).backgroundColor,
    btnColor: getComputedStyle(document.querySelector('.btn-primary')).color,
    btnTransform: getComputedStyle(document.querySelector('.btn-primary')).textTransform,
    amount: getComputedStyle(document.querySelector('.pc-amount')).color,
    featuredAmount: getComputedStyle(document.querySelector('.is-featured .pc-amount')).color,
    heroTitleFont: getComputedStyle(document.querySelector('.hero-title')).fontFamily,
    heroTitleLh: (() => {
      const cs = getComputedStyle(document.querySelector('.hero-title'));
      return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
    })(),
    heroTitleLs: (() => {
      const cs = getComputedStyle(document.querySelector('.hero-title'));
      return parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize);
    })(),
    heroTitleSize: parseFloat(getComputedStyle(document.querySelector('.hero-title')).fontSize),
    coordFont: getComputedStyle(document.querySelector('.hero-coord')).fontFamily,
    navFont: getComputedStyle(document.querySelector('.nav-link')).fontFamily,
    featuredBorder: getComputedStyle(document.querySelector('.pricing-card.is-featured')).borderLeftColor,
    pcTagAbsent: !document.querySelector('.pc-tag'),
    heroDot: (() => {
      const el = document.querySelector('.hero-title .accent-word');
      return el ? getComputedStyle(el).color : null;
    })(),
    heroScrollAbsent: !document.querySelector('.hero-scroll'),
    railIdx: getComputedStyle(document.querySelector('.rail-idx')).color,
    gCapNo: getComputedStyle(document.querySelector('.g-cap-no')).color,
    silverText: getComputedStyle(document.querySelector('.hero-coord')).color,
    footerIcon: getComputedStyle(document.querySelector('.footer-col .lucide')).color,
    philosophyMeta: (() => {
      const el = document.querySelector('.philosophy-meta');
      return el ? getComputedStyle(el, '::before').backgroundColor : null;
    })(),
    ambient: getComputedStyle(document.documentElement).getPropertyValue('--ambient'),
    heroGlow: (() => {
      const el = document.querySelector('.hero-glow');
      return el ? { opacity: getComputedStyle(el).opacity, bg: getComputedStyle(el).backgroundImage } : null;
    })(),
  }));
  ok('desktop: black primary background', palette.pageBg === 'rgb(5, 5, 5)');
  ok('desktop: pricing sits on deep charcoal', palette.pricingBg === 'rgb(17, 19, 21)');
  ok('desktop: electric lime section numbers', palette.sectionNo === 'rgb(198, 255, 0)');
  ok('desktop: titanium silver section labels', palette.kicker === 'rgb(167, 173, 178)');
  ok('desktop: primary CTA is lime with black text', palette.btnBg === 'rgb(198, 255, 0)' && palette.btnColor === 'rgb(5, 5, 5)');
  ok('desktop: buttons sentence case', palette.btnTransform === 'none');
  ok('desktop: prices are warm white', palette.amount === 'rgb(244, 241, 232)');
  ok('desktop: featured price electric lime', palette.featuredAmount === 'rgb(198, 255, 0)');
  ok('desktop: hero title in Druk/Anton display', palette.heroTitleFont.includes('Druk Condensed') && palette.heroTitleFont.includes('Anton'));
  ok('desktop: hero title breathable leading ~0.92', Math.abs(palette.heroTitleLh - 0.92) < 0.02);
  ok('desktop: hero title comfortable tracking ~-0.015em', Math.abs(palette.heroTitleLs + 0.015) < 0.005);
  ok('desktop: hero title 150-210px', palette.heroTitleSize >= 150 && palette.heroTitleSize <= 210);
  ok('desktop: metadata in Space Mono', palette.coordFont.includes('Space Mono'));
  ok('desktop: navigation in Suisse/DM Sans', palette.navFont.includes('DM Sans'));
  ok('desktop: no Most chosen badge', palette.pcTagAbsent);
  ok('desktop: featured card lime divider', palette.featuredBorder === 'rgb(198, 255, 0)');
  ok('desktop: hero accent word lime', palette.heroDot === 'rgb(198, 255, 0)');
  ok('desktop: no hero scroll indicator', palette.heroScrollAbsent);
  ok('desktop: hero rail index lime', palette.railIdx === 'rgb(198, 255, 0)');
  ok('desktop: gallery image numbers lime', palette.gCapNo === 'rgb(198, 255, 0)');
  ok('desktop: titanium silver metadata', palette.silverText === 'rgb(167, 173, 178)');
  ok('desktop: footer icons titanium silver', palette.footerIcon === 'rgb(167, 173, 178)');
  ok('desktop: philosophy divider lime', palette.philosophyMeta === 'rgb(198, 255, 0)');
  ok('desktop: ambient carries electric lime', palette.ambient.includes('198, 255, 0'));
  ok('desktop: ambient carries titanium silver', palette.ambient.includes('167, 173, 178'));
  ok('desktop: hero lighting lit', palette.heroGlow && palette.heroGlow.opacity === '1');
  ok('desktop: hero glow carries electric lime', palette.heroGlow && palette.heroGlow.bg.includes('198, 255, 0'));

  ok('desktop: hero visible', op(await visible(page, '.hero-title')));
  const heroText = await page.evaluate(() =>
    document.querySelector('.hero-title').textContent.replace(/\s+/g, ' ').trim(),
  );
  ok('desktop: hero reads TRAIN HARDER MOVE BETTER', heroText.includes('Train') && heroText.includes('harder.') && heroText.includes('Move') && heroText.includes('better.'));
  const philText = await page.evaluate(() =>
    document.querySelector('.philosophy-statement').textContent.replace(/\s+/g, ' ').trim(),
  );
  ok('desktop: philosophy reads DISCIPLINE IS NOT A MOOD', philText.includes('Discipline') && philText.includes('mood.'));
  const ctaText = await page.evaluate(() => document.querySelector('.cta-title').textContent.replace(/\s+/g, ' ').trim());
  ok('desktop: final CTA reads NO EXCUSES JUST PROGRESS', ctaText.includes('No excuses') && ctaText.includes('progress.'));

  const gallery = await page.evaluate(() => ({
    items: document.querySelectorAll('.gallery-item').length,
    heading: document.querySelector('.gallery-heading').textContent.replace(/\s+/g, ' ').trim(),
    captions: [...document.querySelectorAll('.gallery-caption')].map((c) => c.textContent.replace(/\s+/g, ' ').trim()),
  }));
  ok('desktop: 6 gallery items', gallery.items === 6);
  ok('desktop: gallery heading reads INSIDE THE CLUB', gallery.heading.toLowerCase().includes('inside the club'));
  ok('desktop: no THE WORK SHOWS statement', !(await page.evaluate(() => !!document.querySelector('.gallery-title'))));
  ok('desktop: gallery keeps selective captions (3 of 6)', gallery.captions.length === 3);
  ok('desktop: gallery captions numbered', gallery.captions[0].includes('01/') && gallery.captions[2].includes('05/'));
  ok('desktop: some gallery images left silent', !(await page.$('.g-2 .gallery-caption')));

  const displaySpacing = await page.evaluate(() => {
    const g = (s) => {
      const cs = getComputedStyle(document.querySelector(s));
      return { lh: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize), ls: parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize) };
    };
    return { phil: g('.philosophy-statement'), cta: g('.cta-title'), gHead: g('.gallery-heading') };
  });
  ok('desktop: philosophy statement breathable spacing', Math.abs(displaySpacing.phil.lh - 0.92) < 0.02 && Math.abs(displaySpacing.phil.ls + 0.015) < 0.005);
  ok('desktop: final CTA breathable spacing', Math.abs(displaySpacing.cta.lh - 0.92) < 0.02 && Math.abs(displaySpacing.cta.ls + 0.015) < 0.005);
  ok('desktop: gallery heading controlled size', Math.abs(displaySpacing.gHead.lh - 0.92) < 0.02 && displaySpacing.gHead.ls <= 0);

  const services = await page.evaluate(() => ({
    rows: document.querySelectorAll('.service-row').length,
    nos: [...document.querySelectorAll('.service-no')].map((n) => n.textContent.replace(/\s+/g, ' ').trim()).join('|'),
    titles: [...document.querySelectorAll('.service-title')].map((t) => t.textContent.replace(/\s+/g, ' ').trim().toLowerCase()).join('|'),
    descs: [...document.querySelectorAll('.service-desc')].map((d) => d.textContent.trim().length),
    dividers: [...document.querySelectorAll('.service-row')].map((r) => getComputedStyle(r, '::before').content !== 'none').filter(Boolean).length,
    noFont: getComputedStyle(document.querySelector('.service-no')).fontFamily,
    titleFont: getComputedStyle(document.querySelector('.service-title')).fontFamily,
    descFont: getComputedStyle(document.querySelector('.service-desc')).fontFamily,
    noColor: getComputedStyle(document.querySelector('.service-no')).color,
    titleColor: getComputedStyle(document.querySelector('.service-title')).color,
    descColor: getComputedStyle(document.querySelector('.service-desc')).color,
    titleTransform: getComputedStyle(document.querySelector('.service-title')).textTransform,
  }));
  ok('desktop: 4 service rows', services.rows === 4);
  ok('desktop: service numbers 01-04', services.nos === '01|02|03|04');
  ok('desktop: service titles correct', services.titles === 'personal training|strength & conditioning|group training|recovery & mobility');
  ok('desktop: all services have descriptions', services.descs.every((l) => l > 30));
  ok('desktop: every service row has a divider', services.dividers === 4);
  ok('desktop: service numbers in Space Mono', services.noFont.includes('Space Mono'));
  ok('desktop: service titles in display font', services.titleFont.includes('Anton') && services.titleFont.includes('Druk Condensed'));
  ok('desktop: service descriptions in DM Sans', services.descFont.includes('DM Sans'));
  ok('desktop: service numbers titanium silver', services.noColor === 'rgb(167, 173, 178)');
  ok('desktop: service titles warm white', services.titleColor === 'rgb(244, 241, 232)');
  ok('desktop: service descriptions titanium silver', services.descColor === 'rgb(167, 173, 178)');
  ok('desktop: service titles set in display caps', services.titleTransform === 'uppercase');

  const typeLayers = await page.evaluate(() => ({
    discipline: [...document.querySelectorAll('.discipline-no')].map((n) => n.textContent.replace(/\s+/g, ' ').trim()).join('|'),
    pc: [...document.querySelectorAll('.pc-no')].map((n) => n.textContent.replace(/\s+/g, ' ').trim()).join('|'),
  }));
  ok('desktop: mono discipline markers', typeLayers.discipline === '01 / Strength|02 / Conditioning|03 / Mobility|04 / Recovery');
  ok('desktop: mono membership markers', typeLayers.pc === '01 / Membership|02 / Membership|03 / Membership');

  await page.evaluate(() => {
    const api = document.getElementById('membership')._aegisPricing;
    if (api) {
      api.stop();
      api.go('essential');
    }
  });
  await sleep(400);

  const pricing = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.pricing-card')];
    return {
      slides: document.querySelectorAll('.pricing-slide').length,
      cards: cards.length,
      tiers: cards.map((c) => c.dataset.tier).join('|'),
      names: cards.map((c) => c.querySelector('.pc-name').textContent.trim()).join('|'),
      amounts: cards.map((c) => c.querySelector('.pc-amount').textContent.trim()).join('|'),
      featured: document.querySelector('.pricing-card.is-featured').dataset.tier,
      active: document.querySelector('.pricing-slide.is-active').dataset.tier,
      titleLines: document.querySelectorAll('.pricing-title .mask-line').length,
      features: cards.map((c) => c.querySelectorAll('.pc-features li').length).join('|'),
    };
  });
  ok('desktop: 3 pricing slides + 3 cards', pricing.slides === 3 && pricing.cards === 3);
  ok('desktop: card order essential|performance|private', pricing.tiers === 'essential|performance|private');
  ok('desktop: card names correct', pricing.names === 'Essential|Performance|Private');
  ok('desktop: card amounts correct', pricing.amounts === '₹2,999|₹5,999|₹9,999');
  ok('desktop: performance card featured', pricing.featured === 'performance');
  ok('desktop: active slide = essential', pricing.active === 'essential');
  ok('desktop: pricing title has 2 masked lines', pricing.titleLines === 2);
  ok('desktop: feature counts 3|4|4', pricing.features === '3|4|4');

  await stepScroll(page);
  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('img')].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src').split('/').pop()),
  );
  ok('desktop: all images load after scroll', broken.length === 0);
  if (broken.length) console.log('  broken:', broken);

  await page.evaluate(() => {
    const api = document.getElementById('membership')._aegisPricing;
    api.stop();
    api.go('essential');
  });
  await sleep(1700);
  const galleryAnim = await page.evaluate(() => ({
    mask: getComputedStyle(document.querySelector('.g-1')).clipPath,
    headingOpacity: getComputedStyle(document.querySelector('.gallery-heading')).opacity,
    activeSlideOpacity: getComputedStyle(document.querySelector('.pricing-slide.is-active')).opacity,
    cardOpacity: getComputedStyle(document.querySelector('.pricing-card')).opacity,
  }));
  ok('desktop: gallery mask opens', galleryAnim.mask === 'inset(0%)' || galleryAnim.mask === 'inset(0% 0% 0% 0%)');
  ok('desktop: gallery heading revealed', galleryAnim.headingOpacity === '1');
  ok('desktop: pricing active slide visible', galleryAnim.activeSlideOpacity === '1');
  ok('desktop: pricing cards revealed', galleryAnim.cardOpacity === '1');

  const capOp = await page.evaluate(() => getComputedStyle(document.querySelector('.g-1 .gallery-caption')).opacity);
  ok('desktop: gallery captions always visible', capOp === '1');
  const g1 = await page.$('.g-1');
  await g1.hover();
  await sleep(700);
  const zoom = await page.evaluate(() => {
    const m = getComputedStyle(document.querySelector('.g-1 img')).transform.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    return Math.abs(parseFloat(m[1].split(',')[0]));
  });
  ok('desktop: gallery hover zooms image', zoom > 1.02);

  await page.evaluate(() => document.querySelector('#services').scrollIntoView({ block: 'center' }));
  await sleep(900);
  const svcRow = await page.$('.service-row');
  await svcRow.hover();
  await sleep(650);
  const svcHover = await page.evaluate(() => {
    const row = document.querySelector('.service-row');
    return {
      bg: getComputedStyle(row).backgroundColor,
      no: getComputedStyle(row.querySelector('.service-no')).color,
      arrowColor: getComputedStyle(row.querySelector('.service-arrow')).color,
      title: getComputedStyle(row.querySelector('.service-title')).transform,
      arrow: getComputedStyle(row.querySelector('.service-arrow .lucide')).transform,
      line: getComputedStyle(row.querySelector('.service-title'), '::after').transform,
    };
  });
  ok('desktop: service hover background shifts to charcoal', svcHover.bg === 'rgb(17, 19, 21)');
  ok('desktop: service number turns lime on hover', svcHover.no === 'rgb(198, 255, 0)');
  ok('desktop: service arrow turns lime on hover', svcHover.arrowColor === 'rgb(198, 255, 0)');
  ok('desktop: service title shifts on hover', svcHover.title !== 'none');
  ok('desktop: service arrow translates on hover', svcHover.arrow !== 'none');
  ok('desktop: service lime line expands on hover', svcHover.line === 'matrix(1, 0, 0, 1, 0, 0)');

  await page.evaluate(() => document.querySelector('.pricing').scrollIntoView({ block: 'center' }));
  await sleep(900);
  const menu = await page.evaluate(() => {
    const m = getComputedStyle(document.querySelector('.pricing-menu')).gridTemplateColumns.split(' ').length;
    const cols = getComputedStyle(document.querySelector('.pricing-cards')).gridTemplateColumns.split(' ').length;
    return { menuCols: m, cardCols: cols };
  });
  ok('desktop: pricing menu is a 12-col grid', menu.menuCols === 12);
  ok('desktop: pricing cards side-by-side (3 cols)', menu.cardCols === 3);

  await page.evaluate(() => {
    const api = document.getElementById('membership')._aegisPricing;
    api.stop();
    api.go('essential');
  });
  await page.evaluate(() => document.getElementById('membership')._aegisPricing.next());
  await sleep(1600);
  const cycled = await page.evaluate(() => ({
    active: document.querySelector('.pricing-slide.is-active').dataset.tier,
    opacity: getComputedStyle(document.querySelector('.pricing-slide.is-active')).opacity,
  }));
  ok('pricing: background cycles to performance', cycled.active === 'performance');
  ok('pricing: cycled slide crossfades in', parseFloat(cycled.opacity) >= 0.99);

  const imgDistinct = await page.evaluate(() => {
    const slides = [...document.querySelectorAll('.pricing-slide img')].map((i) => i.src.split('/').pop());
    const gallery = [...document.querySelectorAll('.gallery-item img')].map((i) => i.src.split('/').pop());
    return { unique: new Set(slides).size === slides.length, overlap: slides.filter((s) => gallery.includes(s)).length };
  });
  ok('pricing: slides use distinct background images', imgDistinct.unique);
  ok('pricing: backgrounds distinct from gallery images', imgDistinct.overlap === 0);

  ok('desktop: no horizontal overflow after scroll', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));

  ok('desktop: no errors after interactions', errors.length === 0);

  await page.screenshot({ path: SHOT + 'refine-full.png', fullPage: true });
  await browser.close();
  console.log('Test 1 done');
})();

// ————— Test 2: no JS —————
(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  await sleep(1500);

  ok('no-js: html lacks .js', !(await page.evaluate(() => document.documentElement.classList.contains('js'))));
  ok('no-js: no theme toggle', !(await page.$('#theme-toggle')) && !(await page.$('.dumbbell')));
  ok('no-js: gallery present', (await page.$$('.gallery-item')).length === 6);
  ok('no-js: gallery heading visible', op(await visible(page, '.gallery-heading')));
  ok('no-js: no programs section', !(await page.$('#programs')));
  ok('no-js: 4 service rows present', (await page.$$('.service-row')).length === 4);
  ok('no-js: service titles visible', op(await visible(page, '.service-title')));
  ok('no-js: 3 pricing cards visible', (await page.$$('.pricing-card')).length === 3 && op(await visible(page, '.pricing-card')));
  ok('no-js: pricing title visible', op(await visible(page, '.pricing-title')));
  const activeSlide = await page.evaluate(() => document.querySelector('.pricing-slide.is-active').dataset.tier);
  ok('no-js: default slide is essential', activeSlide === 'essential');
  const noJsSections = await page.evaluate(() => document.querySelectorAll('main > section').length);
  ok('no-js: 7 sections', noJsSections === 7);

  await browser.close();
  console.log('Test 2 done');
})();

// ————— Test 3: reduced motion + static pricing —————
(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  const errors = [];
  collectErrors(page, errors);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1500);

  ok('reduced: no errors', errors.length === 0);
  ok('reduced: gallery visible without scroll', op(await visible(page, '.g-1')));
  ok('reduced: gallery heading visible', op(await visible(page, '.gallery-heading')));
  ok('reduced: pricing cards visible', op(await visible(page, '.pricing-card')));
  ok('reduced: pricing title visible', op(await visible(page, '.pricing-title')));
  const state = await page.evaluate(() => ({
    amount: document.querySelector('.pc-amount').textContent.trim(),
    active: document.querySelector('.pricing-slide.is-active').dataset.tier,
  }));
  ok('reduced: essential visible statically', state.amount === '₹2,999' && state.active === 'essential');
  const lit = await page.evaluate(() => ({
    media: getComputedStyle(document.querySelector('.discipline-media'), '::before').opacity,
    glow: getComputedStyle(document.querySelector('.hero-glow')).opacity,
  }));
  ok('reduced: media lighting static', lit.media === '1');
  ok('reduced: hero glow visible', lit.glow === '1');

  await browser.close();
  console.log('Test 3 done');
})();

// ————— Test 4: mobile —————
(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const errors = [];
  collectErrors(page, errors);
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2600);

  ok('mobile: no errors', errors.length === 0);
  ok('mobile: no theme toggle', !(await page.$('#theme-toggle')) && !(await page.$('.dumbbell')));
  ok('mobile: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));

  const mHero = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.hero-title')).fontSize));
  ok('mobile: hero headline scales with viewport', mHero >= 56 && mHero <= 130);

  await page.click('#nav-burger');
  await sleep(900);
  const menu = await page.evaluate(() => ({
    open: document.querySelector('#mobile-menu').classList.contains('is-open'),
    focused: document.activeElement && document.activeElement.tagName === 'A',
    galleryLink: [...document.querySelectorAll('.mobile-links a')].some((a) => a.textContent.includes('Gallery')),
  }));
  ok('mobile: menu opens with focus', menu.open && menu.focused);
  ok('mobile: menu has Gallery link', menu.galleryLink);
  await page.keyboard.press('Escape');
  await sleep(700);
  ok('mobile: menu closes', !(await page.evaluate(() => document.querySelector('#mobile-menu').classList.contains('is-open'))));

  const galleryCols = await page.evaluate(() => {
    const scene = document.querySelector('.gallery-scene');
    return getComputedStyle(scene).gridTemplateColumns.split(' ').length;
  });
  ok('mobile: gallery single column', galleryCols === 1);

  const servicesMobile = await page.evaluate(() => {
    const rows = document.querySelectorAll('.service-row').length;
    const overflow = document.documentElement.scrollWidth <= window.innerWidth;
    return { rows, overflow };
  });
  ok('mobile: services rows present', servicesMobile.rows === 4);
  ok('mobile: services no overflow', servicesMobile.overflow);

  await page.evaluate(() => document.querySelector('.pricing').scrollIntoView({ block: 'center' }));
  await sleep(900);
  const mPricing = await page.evaluate(() => {
    const cards = document.querySelectorAll('.pricing-card').length;
    const cols = getComputedStyle(document.querySelector('.pricing-cards')).gridTemplateColumns.split(' ').length;
    const overflow = document.documentElement.scrollWidth <= window.innerWidth;
    return { cards, cols, overflow };
  });
  ok('mobile: 3 pricing cards stacked', mPricing.cards === 3 && mPricing.cols === 1);
  ok('mobile: pricing layout keeps no overflow', mPricing.overflow);

  const hOverflow2 = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  ok('mobile: no horizontal overflow after scroll', hOverflow2);

  await page.screenshot({ path: SHOT + 'refine-mobile.png', fullPage: true });
  await browser.close();
  console.log('Test 4 done');
})();

setTimeout(() => {
  const fail = results.filter((r) => !r.pass);
  console.log(`\n==== ${results.length - fail.length}/${results.length} PASSED ====`);
  fail.forEach((r) => console.log('  FAIL:', r.name));
  process.exit(fail.length ? 1 : 0);
}, 45000);
