/* Shared motion: Lenis smooth scroll, word splitting, reveals, parallax. */
import Lenis from 'lenis';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export let lenis = null;

export function initSmoothScroll() {
  if (reduced || !finePointer) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  window.__lenis = lenis;
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || url.hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -90, duration: 1.4 });
    history.replaceState(null, '', url.hash);
  });
}

/**
 * Wrap each word in <span class="w"> (no masks, no overflow clipping, so nothing can be
 * cropped). Words inside a .gilt element get their own gold fill, because
 * background-clip:text on a parent does not paint transformed children.
 */
export function splitWords(el) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  let i = 0;
  const walk = (node, gilt) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const s = document.createElement('span');
          s.className = gilt ? 'w gilt' : 'w';
          s.style.setProperty('--wi', i++);
          s.textContent = p;
          frag.appendChild(s);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && !child.classList.contains('visually-hidden') && child.tagName !== 'BR') {
        const isGilt = child.classList.contains('gilt');
        if (isGilt) { child.classList.remove('gilt'); child.classList.add('gilt-host'); }
        walk(child, gilt || isGilt);
      }
    });
  };
  walk(el, el.classList.contains('gilt'));
  if (el.classList.contains('gilt')) { el.classList.remove('gilt'); el.classList.add('gilt-host'); }
}

export function initReveals() {
  const splits = document.querySelectorAll('[data-split]');
  splits.forEach(splitWords);
  document.querySelectorAll('.tcard, .pcard, .craft, .film, .work, .post, .moment, .step').forEach((el) => { if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', ''); });
  const els = document.querySelectorAll('[data-split], [data-reveal], [data-img-reveal], [data-draw], .vision__art');
  if (reduced || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  // stagger siblings that reveal together
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const sib = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    const k = sib.indexOf(el);
    if (k > 0) el.style.setProperty('--rd', `${(k % 6) * 0.09}s`);
  });
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
  );
  els.forEach((e) => io.observe(e));
  // Safety net: anything still hidden after load + 4s (e.g. printing, odd viewports) is shown.
  addEventListener('load', () => setTimeout(() => els.forEach((e) => e.classList.add('is-in')), 4000));
}

/** Parallax: data-speed="0.1" moves an element relative to scroll (transform only). */
export function initParallax() {
  if (reduced) return;
  const items = [...document.querySelectorAll('[data-speed]')].map((el) => ({ el, s: parseFloat(el.dataset.speed) || 0 }));
  if (!items.length) return;
  const mobile = matchMedia('(max-width: 900px)');
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    if (mobile.matches) { items.forEach(({ el }) => (el.style.transform = '')); return; }
    const k = 1;
    items.forEach(({ el, s }) => {
      const r = (el.parentElement || el).getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const c = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-c * s * k).toFixed(1)}px, 0)`;
    });
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
}

/** Scroll-drawn line (process page thread). */
export function initDrawScroll() {
  const p = document.querySelector('[data-draw-scroll]');
  if (!p) return;
  const host = p.closest('section');
  const set = () => {
    const r = host.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    p.style.setProperty('--draw', reduced ? 0 : 1 - t);
    p.style.strokeDashoffset = reduced ? 0 : 1 - t;
  };
  addEventListener('scroll', set, { passive: true });
  set();
}

/** Image parallax: photos drift slowly inside their frames (desktop only; uses the
 * independent `translate` property so reveal transforms are untouched). */
export function initImageParallax() {
  if (reduced) return;
  const desk = matchMedia('(min-width: 901px)');
  const imgs = [...document.querySelectorAll('.ed__frame img, .about__fig .frame img, .vision__art .frame img, .step__media .frame img, .phero__media img, .reel__media img')];
  imgs.forEach((im) => { if (!im.closest('.phero__media, .reel__media')) im.classList.add('pimg'); });
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    imgs.forEach((im) => {
      if (!desk.matches) { im.style.translate = ''; return; }
      const r = im.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      im.style.translate = `0 ${(p * r.height * 0.05).toFixed(1)}px`;
    });
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); update();
}

/** Pinned scroll scenes: --p goes 0 → 1 while the scene's sticky stage is pinned. */
export function initScenes() {
  const scenes = [...document.querySelectorAll('[data-scene]')];
  if (!scenes.length) return;
  if (reduced) { scenes.forEach((s) => s.style.setProperty('--p', 1)); return; }
  let ticking = false;
  const update = () => {
    ticking = false;
    scenes.forEach((s) => {
      const r = s.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      s.style.setProperty('--p', (p < 0.85 ? p / 0.85 : 1).toFixed(4));
    });
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); update();
}
