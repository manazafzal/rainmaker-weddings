/* Header, mobile menu, intro, page-transition curtain, cursor, magnetic buttons. */
import { reduced, finePointer, lenis } from './core.js';

const html = document.documentElement;
const LABELS = { '': 'Rainmaker', 'index.html': 'Rainmaker', 'experiences.html': 'Experiences', 'portfolio.html': 'Portfolio', 'story.html': 'Our Story', 'process.html': 'The Process', 'journal.html': 'Journal', 'enquire.html': 'Enquire' };
const fileOf = (path) => path.split('/').pop();

export function initHeader() {
  const hdr = document.querySelector('[data-header]');
  const set = () => hdr.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', set, { passive: true });
  set();
  const here = fileOf(location.pathname) || 'index.html';
  document.querySelectorAll('.hdr__link, .mnav__link').forEach((a) => {
    const f = fileOf(new URL(a.href).pathname) || 'index.html';
    if (f === here) a.setAttribute('aria-current', 'page');
  });
  document.querySelector('[data-scroll-top]')?.addEventListener('click', () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })));
}

export function initMenu() {
  const btn = document.querySelector('.hdr__menu');
  const menu = document.getElementById('site-menu');
  if (!btn || !menu) return;
  const label = btn.querySelector('.hdr__menu-label');
  const open = (v) => {
    btn.setAttribute('aria-expanded', String(v));
    if (label) label.textContent = v ? 'Close' : 'Menu';
    if (v) { menu.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open'))); lenis?.stop(); document.body.style.overflow = 'hidden'; menu.querySelector('a')?.focus(); }
    else { menu.classList.remove('is-open'); lenis?.start(); document.body.style.overflow = ''; setTimeout(() => { if (btn.getAttribute('aria-expanded') === 'false') menu.hidden = true; }, 800); }
  };
  btn.addEventListener('click', () => open(btn.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { open(false); btn.focus(); } });
  matchMedia('(min-width: 1081px)').addEventListener('change', (m) => m.matches && open(false));
}

export function runIntro() {
  const intro = document.querySelector('.intro');
  if (!intro || html.classList.contains('no-intro')) return Promise.resolve();
  try { sessionStorage.setItem('rm-intro', '1'); } catch {}
  return new Promise((res) => setTimeout(() => { intro.classList.add('is-done'); res(); }, 1300));
}

const setLabel = (el, text) => { if (el) el.innerHTML = `<span class="cl-w">${[...text].map((ch, i) => `<span class="cl" style="--ci:${i}">${ch === '<' ? '&lt;' : ch === '&' ? '&amp;' : ch}</span>`).join('')}</span>`; };

export function initTransitions() {
  const label = document.querySelector('.curtain__label');
  if (html.classList.contains('is-arriving')) {
    setLabel(label, html.dataset.arriving || '');
    requestAnimationFrame(() => requestAnimationFrame(() => { html.classList.add('is-arrived'); html.classList.remove('is-arriving'); }));
    setTimeout(() => html.classList.remove('is-arrived'), 1600);
  }
  if (reduced) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === location.pathname) return; // same page / anchors
    e.preventDefault();
    const name = LABELS[fileOf(url.pathname)] || 'Rainmaker';
    setLabel(label, name);
    try { sessionStorage.setItem('rm-to', name); } catch {}
    html.classList.remove('is-arrived');
    html.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 860);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) html.classList.remove('is-leaving', 'is-arriving'); });
}

export function initCursor() {
  if (!finePointer || reduced) return;
  const c = document.querySelector('.cursor');
  if (!c) return;
  html.classList.add('has-cursor');
  const lab = c.querySelector('.cursor__label');
  const dot = document.createElement('i'); dot.className = 'cursor-dot'; dot.setAttribute('aria-hidden', 'true'); document.body.appendChild(dot);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; dot.style.transform = `translate3d(${x}px, ${y}px, 0)`; c.classList.remove('is-out'); dot.classList.remove('is-out'); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { c.classList.add('is-out'); dot.classList.add('is-out'); });
  addEventListener('pointerdown', () => c.classList.add('is-down'));
  addEventListener('pointerup', () => c.classList.remove('is-down'));
  const loop = () => { cx += (x - cx) * 0.16; cy += (y - cy) * 0.16; c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; requestAnimationFrame(loop); };
  loop();
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, [data-cursor], summary, label');
    const l = t?.closest('[data-cursor]')?.dataset.cursor;
    c.classList.toggle('is-hover', !!t);
    c.classList.toggle('has-label', !!l);
    lab.textContent = l || '';
    dot.classList.toggle('is-hidden', !!l);
  });
}

export function initMagnetic() {
  if (!finePointer || reduced) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}
