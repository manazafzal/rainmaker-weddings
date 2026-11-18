/* Hover reveals: the worlds index (floods the section with each theme's colours and
   floats its photo by the cursor) and the crafts list (floating photo). Desktop only;
   on touch the links simply navigate. */
import { reduced, finePointer } from './core.js';

function follow(float) {
  let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (x - cx) * 0.14; cy += (y - cy) * 0.14;
    const w = float.offsetWidth, h = float.offsetHeight;
    float.style.transform = `translate3d(${cx - w / 2}px, ${cy - h / 2}px, 0) rotate(${(x - cx) * 0.02}deg)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  return (e) => { x = e.clientX; y = e.clientY; if (!cx && !cy) { cx = x; cy = y; } if (!raf) raf = requestAnimationFrame(loop); };
}

export function initWorlds() {
  const sec = document.querySelector('[data-worlds]');
  if (!sec) return;
  const links = [...sec.querySelectorAll('[data-world]')];
  const imgs = [...sec.querySelectorAll('.worlds__float img')];
  const float = sec.querySelector('.worlds__float');
  const fine = finePointer && !reduced;
  if (fine) sec.addEventListener('pointermove', follow(float));
  const on = (i) => {
    links.forEach((l, k) => l.classList.toggle('is-active', k === i));
    imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
    const cs = getComputedStyle(links[i]);
    sec.style.setProperty('--wb', cs.getPropertyValue('--t-bg'));
    sec.style.setProperty('--wi', cs.getPropertyValue('--t-ink'));
    sec.classList.add('is-hovering');
  };
  const off = () => { sec.classList.remove('is-hovering'); sec.style.removeProperty('--wb'); sec.style.removeProperty('--wi'); links.forEach((l) => l.classList.remove('is-active')); };
  links.forEach((l, i) => {
    if (fine) { l.addEventListener('pointerenter', () => { imgs[i].loading = 'eager'; on(i); }); }
    l.addEventListener('focus', () => on(i));
    l.addEventListener('blur', off);
  });
  if (fine) sec.querySelector('.worlds__list').addEventListener('pointerleave', off);
  // warm the preview images once the section is near
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { imgs.forEach((im) => (im.loading = 'eager')); o.disconnect(); } }, { rootMargin: '400px' }).observe(sec);
}

export function initCrafts() {
  const sec = document.querySelector('[data-hover-reveal]');
  if (!sec || !finePointer || reduced) return;
  const links = [...sec.querySelectorAll('.craft__link')];
  const imgs = [...sec.querySelectorAll('.crafts__float img')];
  const float = sec.querySelector('.crafts__float');
  sec.addEventListener('pointermove', follow(float));
  links.forEach((l, i) => l.addEventListener('pointerenter', () => { imgs.forEach((im, k) => { im.loading = 'eager'; im.classList.toggle('is-active', k === i); }); sec.classList.add('is-hovering'); }));
  sec.querySelector('.crafts__list').addEventListener('pointerleave', () => sec.classList.remove('is-hovering'));
}
