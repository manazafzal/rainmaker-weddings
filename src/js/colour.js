/* Colour floods: the page eases into the colour world of the theme in view. */

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
