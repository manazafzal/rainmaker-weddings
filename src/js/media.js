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

  const lb = document.querySelector('[data-lightbox-modal]');
  const items = [...document.querySelectorAll('[data-lightbox]')];
  let idx = 0;
  const show = (i) => {
    idx = (i + items.length) % items.length;
    const it = items[idx];
    const img = lb.querySelector('.lightbox__img');
    img.src = it.dataset.full;
    img.alt = it.querySelector('img')?.alt || '';
    lb.querySelector('.lightbox__cap').textContent = it.dataset.caption || '';
    img.animate?.([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: reduced ? 1 : 600, easing: 'cubic-bezier(.16,1,.3,1)' });
  };
  items.forEach((it, i) => it.addEventListener('click', () => { show(i); lb.showModal(); lenis?.stop(); }));
  lb?.querySelector('[data-lb-prev]')?.addEventListener('click', () => show(idx - 1));
  lb?.querySelector('[data-lb-next]')?.addEventListener('click', () => show(idx + 1));
  lb?.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });

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
