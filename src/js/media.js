/* Video modal, lightbox, portfolio filters, enquiry form. */
import { reduced, lenis } from './core.js';

/* ---------- YouTube modal + lightbox ---------- */
export function initMedia() {
  const vm = document.querySelector('[data-video-modal]');
  const frame = vm?.querySelector('.modal__frame');
  const openVideo = (id) => {
    if (!vm) return window.open(`https://www.youtube.com/watch?v=${id}`, '_blank', 'noopener');
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1" title="Rainmaker Weddings film" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    vm.showModal();
    lenis?.stop();
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-youtube], [data-youtube-modal]');
    if (b) { e.preventDefault(); openVideo(b.dataset.youtube || b.dataset.youtubeModal); }
  });

  initLightbox();

  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('close', () => { if (d === vm) frame.innerHTML = ''; lenis?.start(); });
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    d.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', () => d.close()));
  });
}

/* ---------- Enquiry form ---------- */
export function initForm() {
  const form = document.querySelector('[data-enquiry-form]');
  if (!form) return;
  const status = form.querySelector('.form__status');
  const email = form.dataset.mailto || 'info@rainmakerevents.co.in';

  if (new URLSearchParams(location.search).has('sent')) {
    status.textContent = 'Thank you — your enquiry is with us. We’ll be in touch soon.';
  }

  const validate = (input) => {
    const field = input.closest('.field');
    const err = field?.querySelector('.field__error');
    let msg = '';
    if (input.validity.valueMissing) msg = 'This one’s needed.';
    else if (input.validity.typeMismatch) msg = 'That email doesn’t look quite right.';
    else if (input.validity.patternMismatch) msg = 'Please enter a valid phone number.';
    field?.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return !msg;
  };
  form.querySelectorAll('[required]').forEach((i) => i.addEventListener('blur', () => validate(i)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const req = [...form.querySelectorAll('[required]')];
    const ok = req.map(validate).every(Boolean);
    if (!ok) { req.find((i) => i.getAttribute('aria-invalid') === 'true')?.focus(); return; }
    if (form.company?.value) return; // honeypot
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    status.className = 'form__status';
    status.textContent = 'Sending…';
    const data = new FormData(form);
    const endpoint = form.dataset.endpoint;
    try {
      let res;
      if (endpoint) {
        res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      } else {
        // Netlify Forms convention: url-encoded POST to the site root
        res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
      }
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.textContent = 'Thank you — your enquiry is with us. We’ll be in touch soon.';
      
    } catch (err) {
      status.className = 'form__status is-error';
      const body = encodeURIComponent([...data.entries()].filter(([k]) => !['form-name', 'company'].includes(k)).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n'));
      status.innerHTML = `We couldn’t send that just now. Please <a class="link-u" href="mailto:${email}?subject=Wedding%20enquiry&body=${body}">email us your enquiry</a> or call +91 9946 197 008.`;
    } finally {
      btn.disabled = false;
    }
  });
}


export function initFilters() {
  const btns = [...document.querySelectorAll('[data-filter]')];
  const works = [...document.querySelectorAll('.work')];
  if (!btns.length) return;
  btns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    btns.forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    works.forEach((w) => {
      const on = f === 'all' || w.dataset.category === f;
      w.classList.toggle('is-hidden', !on);
      if (on && !reduced) w.animate?.([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  }));
}

/* ---------- Swipeable lightbox: one gallery at a time (a theme card's photos, or the page's grid) ---------- */
function initLightbox() {
  const lb = document.querySelector('[data-lightbox-modal]');
  const items = [...document.querySelectorAll('[data-lightbox]')];
  if (!lb || !items.length) return;
  const stage = lb.querySelector('.lb__stage'), track = lb.querySelector('.lb__track');
  const cap = lb.querySelector('.lightbox__cap'), dots = lb.querySelector('.lb__dots');
  let group = [], idx = 0, slides = [];
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const load = (i) => { const im = slides[i]?.querySelector('img'); if (im && !im.getAttribute('src')) im.src = im.dataset.src; };
  const go = (i, wrap = true) => {
    const n = group.length;
    idx = wrap ? (i + n) % n : Math.max(0, Math.min(n - 1, i));
    track.style.transform = `translate3d(${-idx * 100}%, 0, 0)`;
    slides.forEach((s, k) => { s.classList.toggle('is-current', k === idx); s.setAttribute('aria-hidden', String(k !== idx)); });
    [idx, idx + 1, idx - 1].forEach((k) => load((k + n) % n));
    cap.textContent = group[idx].dataset.caption || '';
    [...dots.children].forEach((d, k) => d.classList.toggle('is-on', k === idx));
    lb.querySelectorAll('.lightbox__nav').forEach((b) => (b.hidden = n < 2));
  };
  const open = (it) => {
    const card = it.closest('.tcard');
    group = card ? [...card.querySelectorAll('[data-lightbox]')] : items.filter((x) => !x.closest('.tcard') && (x === it || x.offsetParent !== null));
    track.classList.add('is-drag');
    track.innerHTML = group.map((x) => `<figure class="lb__slide" role="group" aria-roledescription="slide"><img data-src="${esc(x.dataset.full)}" alt="${esc(x.querySelector('img')?.alt || x.dataset.caption || '')}" draggable="false" decoding="async"></figure>`).join('');
    slides = [...track.children];
    dots.innerHTML = group.length > 1 && group.length <= 14 ? group.map(() => '<i></i>').join('') : '';
    go(group.indexOf(it));
    lb.showModal(); lenis?.stop();
    requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('is-drag')));
  };
  items.forEach((it) => it.addEventListener('click', () => open(it)));
  document.querySelectorAll('.tcard__media').forEach((m) => m.addEventListener('click', () => m.closest('.tcard')?.querySelector('[data-lightbox]')?.click()));
  lb.querySelector('[data-lb-prev]').addEventListener('click', () => go(idx - 1));
  lb.querySelector('[data-lb-next]').addEventListener('click', () => go(idx + 1));
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); });
  // swipe / drag: follows the finger, rubber-bands at the ends, flicks by velocity
  let sx = 0, sy = 0, dx = 0, t0 = 0, drag = false, axis = '';
  stage.addEventListener('pointerdown', (e) => { if (e.button !== 0 || group.length < 2) return; drag = true; axis = ''; sx = e.clientX; sy = e.clientY; dx = 0; t0 = performance.now(); });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    dx = e.clientX - sx; const dy = e.clientY - sy;
    if (!axis && Math.hypot(dx, dy) > 8) { axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (axis === 'x') { stage.setPointerCapture(e.pointerId); track.classList.add('is-drag'); } }
    if (axis !== 'x') return;
    const edge = (idx === 0 && dx > 0) || (idx === group.length - 1 && dx < 0);
    track.style.transform = `translate3d(calc(${-idx * 100}% + ${edge ? dx * 0.35 : dx}px), 0, 0)`;
  });
  const end = () => {
    if (!drag) return; drag = false;
    track.classList.remove('is-drag');
    if (axis !== 'x') return;
    const v = Math.abs(dx) / Math.max(1, performance.now() - t0);
    const far = Math.abs(dx) > stage.clientWidth * 0.18 || (v > 0.45 && Math.abs(dx) > 30);
    go(far ? idx + (dx < 0 ? 1 : -1) : idx, false);
    axis = 'x-done';
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  stage.addEventListener('click', (e) => { if (axis === 'x-done') { axis = ''; return; } if (!e.target.closest('img')) lb.close(); });
}
