/* Colour-driven motion: scroll floods, the hero's photo-to-palette bloom, image colour
 * sampling for the reveal, and a pointer-following colour spot on hover. */
import { reduced } from './core.js';

const html = document.documentElement;

/** The page background floods to the colour world of the theme crossing the centre line. */
export function initFlood() {
  const zones = [...document.querySelectorAll('[data-flood]')];
  if (!zones.length) return;
  const active = new Set();
  const apply = () => {
    const z = [...active].pop();
    if (z) {
      html.style.setProperty('--bg', z.dataset.flood);
      html.style.setProperty('--fg', z.dataset.floodFg);
      html.style.setProperty('--gold', z.dataset.floodAcc);
    } else ['--bg', '--fg', '--gold'].forEach((p) => html.style.removeProperty(p));
    zones.forEach((x) => x.classList.toggle('is-flooded', x === z));
  };
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? active.add(e.target) : active.delete(e.target)));
    apply();
  }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 });
  zones.forEach((z) => io.observe(z));
}

/** Hero: each slide's dominant colours bloom out around the arched window. */
export function initHeroPalette() {
  const hero = document.querySelector('[data-rain-hero]');
  if (!hero) return;
  const slides = [...hero.querySelectorAll('.hero__slide')];
  const set = (s) => {
    if (!s) return;
    if (s.dataset.tint) hero.style.setProperty('--h-tint', s.dataset.tint);
    if (s.dataset.deep) hero.style.setProperty('--h-deep', s.dataset.deep);
    (s.dataset.p || '').split(',').filter(Boolean).forEach((c, i) => hero.style.setProperty(`--hp${i + 1}`, c));
    if (reduced) return;
    hero.classList.remove('is-bloom'); void hero.offsetWidth; hero.classList.add('is-bloom');
  };
  set(slides.find((s) => s.classList.contains('is-active')) || slides[0]);
  let last = null;
  const mo = new MutationObserver(() => { const a = slides.find((s) => s.classList.contains('is-active')); if (a && a !== last) { last = a; set(a); } });
  slides.forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ['class'] }));
}

/** Sample each revealed image's most vivid colour; the reveal blooms from it. */
export function initImageColour() {
  const c = document.createElement('canvas'); c.width = c.height = 12;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  const pick = (frame, img) => {
    try {
      ctx.drawImage(img, 0, 0, 12, 12);
      const d = ctx.getImageData(0, 0, 12, 12).data;
      let best = null, score = -1;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 510, s = mx === mn ? 0 : (mx - mn) / (255 - Math.abs(mx + mn - 255));
        const sc = s * (1 - Math.abs(l - 0.5) * 1.4);
        if (sc > score) { score = sc; best = [r, g, b, (i / 4) % 12, Math.floor(i / 48)]; }
      }
      if (best) {
        frame.style.setProperty('--pc', `rgb(${best[0]}, ${best[1]}, ${best[2]})`);
        frame.style.setProperty('--ox', `${(best[3] / 11) * 100}%`);
        frame.style.setProperty('--oy', `${(best[4] / 11) * 100}%`);
      }
    } catch {}
  };
  document.querySelectorAll('[data-img-reveal]').forEach((f) => {
    const img = f.querySelector('img');
    if (!img) return;
    if (img.complete && img.naturalWidth) pick(f, img); else img.addEventListener('load', () => pick(f, img), { once: true });
  });
}

/** Tactile hover: a spot of the theme colour follows the pointer; buttons flood from the touch point. */
export function initSpots() {
  document.querySelectorAll('[data-spot]').forEach((el) => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true }));
  document.querySelectorAll('.btn--gold').forEach((b) => b.addEventListener('pointerenter', (e) => {
    const r = b.getBoundingClientRect();
    b.style.setProperty('--bx', `${e.clientX - r.left}px`); b.style.setProperty('--by', `${e.clientY - r.top}px`);
  }));
}
