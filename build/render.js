/**
 * Build-time renderers. Each export receives (attrs, { readJSON, site }) and returns HTML.
 * Content lives in /src/content/*.json — edit the JSON, not this file, to change copy.
 * Design rule: text always sits in normal document flow (never inside fixed-height or
 * clipped boxes), so it can never be cropped at any screen width.
 */
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const img = ({ src, alt = '', w, h, cls = '', eager = false, sizes = '' }) =>
  `<img${cls ? ` class="${cls}"` : ''} src="${src}" alt="${esc(alt)}"${w ? ` width="${w}" height="${h}"` : ''} ${
    eager ? 'fetchpriority="high"' : 'loading="lazy"'
  } decoding="async"${sizes ? ` sizes="${sizes}"` : ''}>`;

const ext = 'target="_blank" rel="noopener"';
const themeVars = (t) => `--t-bg:${t.bg};--t-accent:${t.accent};--t-ink:${t.ink}`;
const themes = (readJSON) => readJSON('src/content/themes.json').themes;
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function schema({ path = '/' }, { site }) {
  const u = site.siteUrl;
  const org = {
    '@type': 'Organization',
    '@id': `${u}/#org`,
    name: site.brand,
    alternateName: site.legalName,
    url: u,
    logo: `${u}/assets/img/brand/logo-cream.png`,
    email: site.email,
    telephone: site.phoneHref,
    foundingDate: site.founded,
    sameAs: [site.instagram, site.youtube, site.facebook],
  };
  const business = {
    '@type': 'LocalBusiness',
    '@id': `${u}/#business`,
    name: site.brand,
    alternateName: site.legalName,
    description: `${site.brand}: ${site.tagline}. Curating experiential weddings and social events since ${site.founded}.`,
    url: u,
    telephone: site.phoneHref,
    email: site.email,
    foundingDate: site.founded,
    image: `${u}/assets/img/og-image.jpg`,
    logo: `${u}/assets/img/brand/logo-cream.png`,
    parentOrganization: { '@id': `${u}/#org` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.street}`,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postcode,
      addressCountry: site.address.country,
    },
    areaServed: ['Kerala', 'India', 'Thailand', 'United Arab Emirates', 'Bali, Indonesia'],
    sameAs: [site.instagram, site.youtube, site.facebook],
    award: ['Destination Wedding Planner of the Year (India) 2023', 'Economic Times Panache Wedding A Lister 2021'],
  };
  const website = { '@type': 'WebSite', '@id': `${u}/#website`, url: u, name: site.brand, publisher: { '@id': `${u}/#org` }, inLanguage: 'en-IN' };
  const crumbs = [{ name: 'Home', url: `${u}/` }];
  const ch = site.chapters.find((c) => c.href === path);
  if (path !== '/' && ch) crumbs.push({ name: ch.title, url: `${u}${path}` });
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${u}${path}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };
  const graph = { '@context': 'https://schema.org', '@graph': [org, business, website, breadcrumb] };
  return `<script type="application/ld+json">${JSON.stringify(graph)}</script>`;
}

/* ---------- Home: hero slides for the rain-on-glass stage ---------- */
const HERO = [
  { src: '/assets/img/gallery/mathew-pooja-3.webp', w: 1800, h: 1200, label: 'Mathew + Pooja', alt: 'A crystal aisle beneath an emerald floral arch at the Mathew + Pooja wedding, designed by Rainmaker' },
  { src: '/assets/img/themes/crazy-rich-asians-1.webp', w: 1440, h: 960, label: 'Crazy Rich Asians', alt: 'A red and gold arched walkway at the Crazy Rich Asians themed celebration by Rainmaker' },
  { src: '/assets/img/decor/04-2.webp', w: 1024, h: 683, label: 'A signature mandap', alt: 'A lit mandap framed by draped fabric and florals, designed by Rainmaker' },
  { src: '/assets/img/themes/atlantis-3.webp', w: 1440, h: 970, label: 'Atlantis', alt: 'An underwater Atlantis world created by Rainmaker' },
  { src: '/assets/img/themes/bali-ahoy-1.webp', w: 1440, h: 959, label: 'Bali Ahoy', alt: 'A tall ship moored for the Bali Ahoy celebration by Rainmaker' },
  { src: '/assets/img/themes/cyberpunk-2.webp', w: 818, h: 546, label: 'Cyberpunk', alt: 'Neon Cyberpunk Sangeet stage designed by Rainmaker' },
];
export function heroSlides() {
  return HERO.map(
    (s, i) =>
      `<img class="hero__slide${i === 0 ? ' is-active' : ''}" src="${s.src}" alt="${i === 0 ? esc(s.alt) : ''}" width="${s.w}" height="${s.h}" data-label="${esc(s.label)}" ${
        i === 0 ? 'fetchpriority="high"' : 'loading="eager" fetchpriority="low"'
      } decoding="async" sizes="100vw">`
  ).join('');
}

/* ---------- Featured worlds (Thrissur Pooram, Starry Night) ---------- */
const FEATURE = {
  'thrissur-pooram': {
    eyebrow: 'A Kerala wedding · Hyatt Regency Thrissur',
    title: 'Thrissur <em>Pooram</em>',
    imgs: [
      { src: '/assets/img/themes/thrissur-pooram-1.webp', w: 1080, h: 1440, alt: 'Chenda drummers and Kathakali at the Thrissur Pooram themed wedding by Rainmaker' },
      { src: '/assets/img/themes/thrissur-pooram-2.webp', w: 1080, h: 1440, alt: 'Muthukuda parasols raised during the Pooram procession at the wedding' },
      { src: '/assets/img/themes/thrissur-pooram-3.webp', w: 1080, h: 1440, alt: 'A festival of colour at the Thrissur Pooram wedding, Hyatt Regency Thrissur' },
    ],
  },
  'starry-night': {
    eyebrow: 'A corporate gala · The Leela Kovalam',
    title: 'Starry <em>Night</em>',
    imgs: [
      { src: '/assets/img/portfolio/bcg.webp', w: 933, h: 1400, alt: 'A Van Gogh Starry Night backdrop at the BCG South Gala, The Leela Kovalam, by Rainmaker' },
      { src: '/assets/img/themes/starry-night-3.webp', w: 1440, h: 960, alt: 'A sunflower and starry-sky welcome arch at the Starry Night gala' },
      { src: '/assets/img/themes/starry-night-1.webp', w: 1440, h: 960, alt: 'A sunflower installation at the Starry Night gala by Rainmaker' },
    ],
  },
};
export function featureWorld({ id, cta = 'experiences' }, { readJSON }) {
  const t = themes(readJSON).find((x) => x.id === id);
  const f = FEATURE[id];
  const [a, b, c] = f.imgs;
  const href = cta === 'enquire' ? '/enquire.html' : `/experiences.html#theme-${id}`;
  const label = cta === 'enquire' ? 'Plan a world like this' : `Step into ${t.name}`;
  return `
  <section class="feature feature--${id}" id="feature-${id}" aria-labelledby="feature-${id}-title" style="${themeVars(t)}" data-cursor-tone="light">
    ${id === 'starry-night' ? '<div class="sky" aria-hidden="true"><i class="sky__stars"></i><i class="sky__stars sky__stars--b"></i><i class="sky__swirl"></i><i class="sky__swirl sky__swirl--b"></i><i class="sky__moon"></i></div>' : '<div class="feature__glow" aria-hidden="true"></div>'}
    <div class="feature__copy">
      <p class="eyebrow" data-reveal>${esc(f.eyebrow)}</p>
      <h2 class="feature__title" id="feature-${id}-title" data-split>${f.title}</h2>
      <p class="feature__desc" data-reveal>${esc(t.desc)}</p>
      <p class="feature__cta" data-reveal><a class="btn btn--line" href="${href}" data-cursor="Enter"><span>${label}</span><i class="btn__arrow" aria-hidden="true"></i></a></p>
    </div>
    <div class="feature__gallery">
      <figure class="feature__fig feature__fig--a" data-speed="-0.06"><div class="frame" data-img-reveal data-distort>${img({ ...a })}</div></figure>
      <figure class="feature__fig feature__fig--b" data-speed="0.08"><div class="frame" data-img-reveal data-distort>${img({ ...b })}</div></figure>
      <figure class="feature__fig feature__fig--c" data-speed="-0.12"><div class="frame" data-img-reveal data-distort>${img({ ...c })}</div></figure>
    </div>
  </section>`;
}

/* ---------- Home: every theme as a typographic index; hover floods its colours ---------- */
export function worldsIndex(_, { readJSON }) {
  return themes(readJSON)
    .map(
      (t) => `<li class="worlds__item"><a class="worlds__link" href="/experiences.html#theme-${t.id}" style="${themeVars(t)}" data-world data-img="${t.images[0].src}" data-cursor="Enter"><span class="worlds__name">${esc(t.name)}</span><span class="worlds__kind">${esc(t.kind)}</span></a></li>`
    )
    .join('<li class="worlds__sep" aria-hidden="true">✦</li>');
}
export function worldsPreload(_, { readJSON }) {
  return themes(readJSON).map((t) => `<img src="${t.images[0].src}" alt="" loading="lazy" decoding="async" data-world-img="${t.images[0].src}">`).join('');
}

/* ---------- Home: portfolio in three drifting columns ---------- */
export function portfolioColumns(_, { readJSON }) {
  const p = readJSON('src/content/portfolio.json');
  const picks = [0, 14, 6, 21, 3, 9, 16, 25, 12, 30, 19, 27].map((i) => p[i]).filter(Boolean);
  const cols = [[], [], []];
  picks.forEach((x, i) => cols[i % 3].push(x));
  const speeds = ['-0.05', '0.1', '-0.02'];
  return cols
    .map(
      (col, ci) => `<ul class="pcols__col" data-speed="${speeds[ci]}">${col
        .map(
          (x) => `<li class="pcard"><a class="pcard__link" href="/portfolio.html" data-cursor="View"><div class="frame pcard__frame" data-img-reveal data-distort>${img({ src: x.image, alt: x.alt, w: x.width, h: x.height })}</div><p class="pcard__title">${esc(x.title)}</p><p class="pcard__tag">${esc(x.hashtag)}</p></a></li>`
        )
        .join('')}</ul>`
    )
    .join('');
}

/* ---------- Home + Experiences: the crafts, as hover rows ---------- */
export function craftRows(_, { readJSON }) {
  const { acts } = readJSON('src/content/services.json');
  return acts
    .map(
      (a) => `<li class="craft"><a class="craft__link" href="/experiences.html#${slug(a.title)}" data-hover-img="${a.image}" data-cursor="Enter"><span class="craft__title">${esc(a.title)}</span><span class="craft__intro">${esc(a.intro)}</span><i class="craft__arrow" aria-hidden="true"></i></a></li>`
    )
    .join('');
}
export function craftImages(_, { readJSON }) {
  const { acts } = readJSON('src/content/services.json');
  return acts.map((a) => `<img src="${a.image}" alt="" loading="lazy" decoding="async" data-hover-src="${a.image}">`).join('');
}

/* ---------- Experiences: every theme as a card in its own colours ---------- */
export function themeCards(_, { readJSON }) {
  return themes(readJSON)
    .map(
      (t) => `
    <li class="tcard" id="theme-${t.id}" style="${themeVars(t)}">
      <article class="tcard__in">
        <div class="tcard__media" data-distort>
          ${img({ src: t.images[0].src, alt: `${t.name} themed ${t.kind.toLowerCase()} designed by Rainmaker Weddings`, w: t.images[0].w, h: t.images[0].h })}
          ${t.images[1] ? img({ src: t.images[1].src, alt: '', w: t.images[1].w, h: t.images[1].h, cls: 'tcard__alt' }) : ''}
        </div>
        <div class="tcard__body">
          <p class="tcard__kind">${esc(t.kind)}${t.for ? ` · ${esc(t.for.replace(/^An? [^·]*·\s*/, ''))}` : ''}</p>
          <h3 class="tcard__name">${esc(t.name)}</h3>
          <p class="tcard__desc">${esc(t.desc)}</p>
          <div class="tcard__thumbs">${t.images.map((im) => `<button type="button" class="tcard__thumb" data-lightbox data-full="${im.src}" data-caption="${esc(t.name)}" aria-label="View a ${esc(t.name)} photo">${img({ src: im.src, alt: '', w: im.w, h: im.h })}</button>`).join('')}</div>
        </div>
      </article>
    </li>`
    )
    .join('');
}

/* ---------- Experiences: the crafts in full ---------- */
export function serviceActs(_, { readJSON }) {
  const { acts } = readJSON('src/content/services.json');
  return acts
    .map(
      (a, i) => `
    <section class="act${i % 2 ? ' act--flip' : ''}" id="${slug(a.title)}" aria-labelledby="${slug(a.title)}-h">
      <div class="act__media"><div class="frame" data-img-reveal data-speed="-0.04">${img({ src: a.image, alt: `${a.title} — wedding planning by Rainmaker Weddings, Kerala` })}</div></div>
      <div class="act__body">
        <h3 class="act__title" id="${slug(a.title)}-h" data-split>${esc(a.title)}</h3>
        <p class="act__intro" data-reveal>${esc(a.intro)}</p>
        <div class="act__list">
          ${a.services
            .map(
              (s) => `<details class="svc"><summary class="svc__sum"><span class="svc__name">${esc(s.name)}</span><span class="svc__icon" aria-hidden="true"></span></summary><div class="svc__body">${
                s.items.length ? `<ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>` : '<p>Curated end-to-end by the Rainmaker team.</p>'
              }</div></details>`
            )
            .join('')}
        </div>
      </div>
    </section>`
    )
    .join('');
}

/* ---------- Portfolio ---------- */
export function portfolioGrid(_, { readJSON }) {
  return readJSON('src/content/portfolio.json')
    .map(
      (p) => `
      <li class="work" data-category="${p.category.toLowerCase()}">
        <button class="work__btn" type="button" data-lightbox data-full="${p.image}" data-caption="${esc(p.title)} · ${esc(p.hashtag)}" data-cursor="View">
          <span class="frame work__frame" data-distort>${img({ src: p.image, alt: p.alt, w: p.width, h: p.height })}</span>
          <span class="work__title">${esc(p.title)}</span>
          <span class="work__tag">${esc(p.hashtag)} · ${esc(p.category)}</span>
        </button>
      </li>`
    )
    .join('');
}
export function portfolioCount(_, { readJSON }) {
  return String(readJSON('src/content/portfolio.json').length);
}
export function gallery(_, { readJSON }) {
  return readJSON('src/content/gallery.json')
    .map(
      (x) => `<li class="moment"><button class="moment__btn" type="button" data-lightbox data-full="${x.image}" data-caption="${esc(x.project)}" data-cursor="Zoom" aria-label="Open image: ${esc(x.alt)}">${img({ src: x.image, alt: x.alt, w: x.width, h: x.height })}</button></li>`
    )
    .join('');
}
export function films({ limit, from = '0' }, { readJSON }) {
  let { films } = readJSON('src/content/films.json');
  films = films.slice(+from, limit ? +from + +limit : undefined);
  return films
    .map(({ id, title }) => {
      const t = title.split('|')[0].trim();
      return `<li class="film"><button class="film__btn" type="button" data-youtube="${id}" data-cursor="Play"><span class="frame film__frame"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="Still from the Rainmaker Weddings film: ${esc(t)}" loading="lazy" width="480" height="360"><span class="film__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span></span><span class="film__title"><span class="visually-hidden">Play film: </span>${esc(t)}</span></button></li>`;
    })
    .join('');
}
export function instagramFeed({ limit }, { readJSON, site }) {
  let { posts } = readJSON('src/content/instagram.json');
  if (limit) posts = posts.slice(0, +limit);
  return posts
    .map(
      (p) => `<li class="ig__tile"><a href="${p.link}" ${ext} data-cursor="Open"><span class="frame">${img({ src: p.src, alt: p.caption, w: p.w, h: p.h })}</span><span class="ig__cap">${esc(p.caption.split(/[|—]/)[0].trim())}</span><span class="visually-hidden"> — on Instagram ${esc(site.instagramHandle)} (opens in a new tab)</span></a></li>`
    )
    .join('');
}

/* ---------- Journal (excerpts kept on this site; no links out to the old site) ---------- */
export function journalGrid({ limit }, { readJSON }) {
  let { posts } = readJSON('src/content/journal.json');
  if (limit) posts = posts.slice(0, +limit);
  return posts
    .map(
      (p, i) => `
      <li class="post${i === 0 ? ' post--lead' : ''}">
        <article class="post__in">
          <div class="frame post__frame" data-img-reveal data-distort>${img({ src: p.image, alt: `${p.title} — Rainmaker Weddings journal` })}</div>
          <div class="post__body">
            ${p.tag ? `<p class="post__tag">${esc(p.tag)}</p>` : ''}
            <h3 class="post__title">${esc(p.title)}</h3>
            <p class="post__excerpt">${esc(p.excerpt)}</p>
          </div>
        </article>
      </li>`
    )
    .join('');
}

/* ---------- Closing call to action on every page ---------- */
const CTA = {
  home: { h: 'Bring us your idea. <em>We’ll make it rain.</em>', p: 'Two names, a date and a dream. Tell us where your story begins and we’ll elevate it into a signature experience.', img: '/assets/img/themes/baroque-ball-2.webp' },
  experiences: { h: 'Pick one craft, <em>or all of them.</em>', p: 'From the first site visit to the last sparkler, under one roof.', img: '/assets/img/decor/04-2.webp' },
  portfolio: { h: 'The next world <em>could be yours.</em>', p: 'Every celebration on this page began as a client’s idea. Bring us yours.', img: '/assets/img/themes/crazy-rich-asians-2.webp' },
  story: { h: 'One idea at a time. <em>Yours could be next.</em>', p: 'Kerala, India, Thailand, the UAE and Bali. Where would you like to celebrate?', img: '/assets/img/decor/01.webp' },
  process: { h: 'Ready for your <em>Curtain Raiser?</em>', p: 'It starts with a conversation about you: your style, your colours, your “wow” moment.', img: '/assets/img/gallery/aagamanam-5.webp' },
  journal: { h: 'Enough reading. <em>Let’s plan yours.</em>', p: 'Tell us what inspired you, and we’ll take it from there.', img: '/assets/img/journal/micro-luxury.webp' },
};
export function cta({ page = 'home' }, { site }) {
  const c = CTA[page] || CTA.home;
  return `
  <section class="cta" aria-labelledby="cta-${page}">
    <div class="cta__bg" aria-hidden="true"><img src="${c.img}" alt="" loading="lazy" decoding="async" data-speed="0.12"></div>
    <div class="cta__in">
      <h2 class="cta__title" id="cta-${page}" data-split>${c.h}</h2>
      <p class="cta__text" data-reveal>${esc(c.p)}</p>
      <p class="cta__actions" data-reveal>
        <a class="btn btn--gold" href="/enquire.html" data-magnetic><span>Start your enquiry</span></a>
        <a class="btn btn--ghost" href="tel:${site.phoneHref}" data-magnetic><span>Call ${esc(site.phone)}</span></a>
      </p>
    </div>
  </section>`;
}

/* ---------- "Continue to" link at the foot of each page ---------- */
const NEXT = {
  home: { href: '/experiences.html', title: 'Signature Experiences', img: '/assets/img/decor/04-2.webp' },
  experiences: { href: '/portfolio.html', title: 'Portfolio', img: '/assets/img/portfolio/aishwarya-and-vikram.webp' },
  portfolio: { href: '/story.html', title: 'Our Story', img: '/assets/img/decor/01.webp' },
  story: { href: '/process.html', title: 'The Process', img: '/assets/img/gallery/aagamanam-5.webp' },
  process: { href: '/journal.html', title: 'Journal', img: '/assets/img/journal/arabian-nights.webp' },
  journal: { href: '/enquire.html', title: 'Enquire', img: '/assets/img/portfolio/mathew-and-pooja.webp' },
  enquire: { href: '/', title: 'Home', img: '/assets/img/gallery/mathew-pooja-3.webp' },
};
export function nextPage({ current }) {
  const n = NEXT[current] || NEXT.home;
  return `
  <nav class="next" aria-label="Next page">
    <a class="next__link" href="${n.href}" data-cursor="Enter">
      <span class="next__media" aria-hidden="true"><img src="${n.img}" alt="" loading="lazy" decoding="async"></span>
      <span class="next__kicker">Continue to</span>
      <span class="next__title">${esc(n.title)}</span>
    </a>
  </nav>`;
}
