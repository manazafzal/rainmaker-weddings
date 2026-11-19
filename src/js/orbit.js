/* Every celebration, its own world: an orbit of arched portals you can drag, swipe or
 * step through with the arrows. Choosing one opens an immersive world: the screen washes
 * into that theme's colour, its photos drift in, with close and previous / next controls.
 * Reduced motion: a simple scrollable row; the world opens without movement. */
import { reduced } from './core.js';

export function initOrbit() {
  const root = document.querySelector('[data-orbit]');
  if (!root) return;
  const stage = root.querySelector('.orbit__stage');
  const items = [...root.querySelectorAll('.orbit__item')];
  const links = items.map((li) => li.querySelector('[data-portal]'));
  const nowName = root.querySelector('.orbit__now-name');
  const N = items.length, step = 360 / N;
  let angle = 0, target = 0, vel = 0, drag = null, moved = false, hover = false, inView = false, raf = 0, last = performance.now();
  const front = () => ((Math.round(-angle / step) % N) + N) % N;
  const flat = reduced;
  if (flat) root.classList.add('is-flat');

  const layout = () => {
    const w = stage.clientWidth, small = w < 700;
    const iw = small ? Math.min(150, w * 0.4) : 220;
    const R = (iw * (small ? 0.42 : 0.7)) / Math.tan(Math.PI / N), half = w / 2;
    stage.style.setProperty('--iw', iw + 'px');
    items.forEach((li, i) => {
      let th = ((i * step + angle) % 360 + 540) % 360 - 180; // -180..180
      const r = (th * Math.PI) / 180, c = Math.cos(r);
      const x = Math.sin(r) * R, z = (c - 1) * R * 0.6;
      li.style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${(th * 0.55).toFixed(2)}deg)`;
      li.style.zIndex = String(Math.round(c * 100) + 100);
      const k = 1400 / (1400 - z); const room = (half - 8 - (Math.abs(x) + iw * 0.5) * k) / (iw * 0.6);
      const vis = Math.max(0, Math.min(1, (c - 0.05) / 0.95, room * 2.5));
      li.style.opacity = vis.toFixed(3);
      li.classList.toggle('is-near', c > 0.93);
      li.classList.toggle('is-front', Math.abs(th) < step / 2);
      li.inert = vis < 0.35;
    });
    const f = front(); if (nowName.dataset.i !== String(f)) { nowName.dataset.i = f; nowName.textContent = links[f].dataset.name; }
  };
  const tick = (now) => {
    raf = 0;
    const dt = Math.min(50, now - last); last = now;
    if (!drag) {
      if (Math.abs(vel) > 0.01) { target += vel * dt; vel *= Math.pow(0.94, dt / 16); }
    }
    angle += (target - angle) * Math.min(1, dt / 420);
    layout();
    if (inView || Math.abs(target - angle) > 0.01) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && !flat) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const snap = () => { target = Math.round(target / step) * step; kick(); };
  const goTo = (i) => {
    const want = -i * step; let d = ((want - target) % 360 + 540) % 360 - 180; target += d; vel = 0; kick();
  };

  if (!flat) {
    layout();
    setInterval(() => { if (!drag && !hover && inView && !document.hidden && !document.querySelector('dialog[open]')) goTo((front() + 1) % N); }, 6500); // a calm glide to the next world
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; kick(); }).observe(root);
    stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, t: performance.now(), a: target }; moved = false; vel = 0; });
    addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) { moved = true; stage.setPointerCapture?.(e.pointerId); }
      if (moved) { const k = 0.18; const nt = drag.a + dx * k; const now = performance.now(); vel = (nt - target) / Math.max(8, now - (drag.lt || drag.t)) * 0.6; drag.lt = now; target = nt; kick(); }
    }, { passive: true });
    const end = () => { if (!drag) return; drag = null; if (moved) { setTimeout(snap, 380); } };
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    stage.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    stage.addEventListener('pointerenter', () => (hover = true)); stage.addEventListener('pointerleave', () => (hover = false));
    root.addEventListener('focusin', (e) => { const i = links.indexOf(e.target); hover = true; if (i >= 0) goTo(i); });
    root.addEventListener('focusout', () => (hover = false));
    root.querySelector('[data-orbit-prev]').addEventListener('click', () => goTo((front() - 1 + N) % N));
    root.querySelector('[data-orbit-next]').addEventListener('click', () => goTo((front() + 1) % N));
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const i = (front() + (e.key === 'ArrowRight' ? 1 : -1) + N) % N; goTo(i); links[i].focus({ preventScroll: true }); }
    });
    addEventListener('resize', () => layout());
  } else {
    root.querySelector('[data-orbit-prev]').addEventListener('click', () => stage.scrollBy({ left: -stage.clientWidth * 0.8 }));
    root.querySelector('[data-orbit-next]').addEventListener('click', () => stage.scrollBy({ left: stage.clientWidth * 0.8 }));
    nowName.textContent = '';
  }

  /* ---------- the world overlay ---------- */
  const dlg = document.querySelector('[data-world-dialog]');
  if (!dlg || !dlg.showModal) return;
  const $ = (s) => dlg.querySelector(s);
  let cur = 0;
  const fill = (i) => {
    cur = (i + N) % N; const d = links[cur].dataset;
    dlg.style.setProperty('--w-bg', d.bg); dlg.style.setProperty('--w-acc', d.acc);
    $('.world__for').textContent = d.for || d.kind; $('.world__name').textContent = d.name; $('.world__desc').textContent = d.desc;
    $('.world__go').href = links[cur].href;
    $('.world__photos').innerHTML = (d.slides || '').split(',').filter(Boolean).map((src, k) => `<li style="--d:${k}"><img src="${src}" alt="${d.name}, photo from this celebration" loading="${k < 2 ? 'eager' : 'lazy'}" decoding="async"></li>`).join('');
    const pn = links[(cur - 1 + N) % N].dataset.name, nn = links[(cur + 1) % N].dataset.name;
    $('[data-world-prev]').setAttribute('aria-label', `Previous world: ${pn}`); $('[data-world-next]').setAttribute('aria-label', `Next world: ${nn}`);
    dlg.classList.remove('is-in'); void dlg.offsetWidth; dlg.classList.add('is-in');
  };
  const open = (i) => { fill(i); document.documentElement.classList.add('world-open'); dlg.showModal(); $('.world__close').focus({ preventScroll: true }); };
  links.forEach((a, i) => a.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); if (!flat) goTo(i); open(i); }));
  $('[data-world-close]').addEventListener('click', () => dlg.close());
  $('[data-world-prev]').addEventListener('click', () => { fill(cur - 1); if (!flat) goTo(cur); });
  $('[data-world-next]').addEventListener('click', () => { fill(cur + 1); if (!flat) goTo(cur); });
  dlg.addEventListener('close', () => { document.documentElement.classList.remove('world-open'); links[cur].focus({ preventScroll: true }); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') $('[data-world-next]').click(); if (e.key === 'ArrowLeft') $('[data-world-prev]').click(); });
  let sx = null, sy = 0;
  dlg.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  dlg.addEventListener('touchend', (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? $('[data-world-next]') : $('[data-world-prev]')).click(); }, { passive: true });
}
