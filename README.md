# Rainmaker Weddings — website redesign

A multi-page marketing site for **Rainmaker Weddings** (Rainmaker Signature Experiences, Kochi, Kerala), built as plain HTML, CSS and JavaScript with [Vite](https://vitejs.dev). There's no framework and no CMS lock-in. Any front-end developer can pick it up in an afternoon.

> **Positioning: Signature Experiences.** Every celebration is a *signature experience*: the client brings a concept, and Rainmaker elevates it into a world of its own (a Thrissur Pooram wedding, a Baroque Ball, a Cyberpunk Sangeet, a Starry Night gala and more). This is shown through the photography (an idea becoming a world) rather than told in slogans.
>
> **Design: "Monsoon Couture".** Ink-black stage, ivory paper sections and animated champagne gold, with Bodoni Moda display type at very large sizes and Inter Tight for UI. Every signature theme brings its own colours (`bg`/`accent`/`ink` in `themes.json`). Signature effects: rain on glass over the hero photography (WebGL), a typographic index of every theme that floods with that theme's colours on hover, a CSS Starry Night sky, word reveals, image wipes, gentle parallax and a gold page-transition curtain. Navigation is always visible, nothing pins or hijacks the scroll, there are no marquees/tickers and no numbering. Text always sits in normal flow (never in clipped or fixed-height boxes), so it cannot be cropped.

---

## Quick start

```bash
npm install
npm run dev       # local dev server with hot reload → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build → http://localhost:4173
```

You need Node 18 or newer (tested on Node 24).

## Pages

| File | Page | What's on it |
|---|---|---|
| `index.html` | Home | Rain-on-glass hero over real celebrations (prev / pause / next controls), "Your vision, then elevated" (the idea → the world), Thrissur Pooram and Starry Night features, an index of every theme, portfolio in drifting columns, showreel and films, the crafts, recognition, enquiry CTA |
| `experiences.html` | Signature Experiences | Every theme as a card in its own colours (photos open in the lightbox), the Starry Night feature, then every service in five groups with accordions |
| `portfolio.html` | Portfolio | Filterable archive of all projects (opens in the lightbox), the Thrissur Pooram feature, "Moments" masonry, films, Instagram posts |
| `story.html` | Our Story | About copy, "Your vision, then elevated", milestones, founders, accolades and memberships |
| `process.html` | The Process | Six planning stages (unnumbered) with a gold thread that draws as you scroll |
| `journal.html` | Journal | Blog posts as excerpt cards (kept on this site), plus Instagram posts |
| `enquire.html` | Enquire | Contact details and the enquiry form over a full-bleed photo |
| `404.html` | — | "Lost in the rain" |

## Project structure

```
├── *.html                 ← one file per page (Vite entry points)
├── partials/              ← shared HTML: head (SEO), chrome (header/menu/loader), footer, modals
├── build/
│   ├── html-partials.js   ← tiny Vite plugin: <!-- @include --> and <!-- @render --> at build time
│   └── render.js          ← turns the JSON content into HTML (cards, lists, schema.org)
├── src/
│   ├── content/           ← ✏️  EDIT CONTENT HERE (JSON)
│   │   ├── site.json        business details, socials, chapter teasers
│   │   ├── services.json    the 25 services in 5 acts
│   │   ├── portfolio.json   34 projects (title, hashtag, category, link, image)
│   │   ├── gallery.json     "Moments" images
│   │   ├── films.json       YouTube IDs + titles (from the public channel)
│   │   ├── themes.json      26 signature themes: name, event, couple/venue, colours (bg/accent/ink), 3 images, link or film
│   │   ├── instagram.json   real Instagram posts (images + captions)
│   │   └── journal.json     blog posts
│   ├── styles/            ← fonts, base (tokens, type, buttons, reveals), chrome (header, menu, curtain, footer, modals), home, pages
│   ├── js/
│   │   ├── core.js          Lenis, word splitting, reveals, parallax, scroll-drawn thread
│   │   ├── chrome.js        intro, page transitions, cursor, magnetic buttons, header, menu
│   │   ├── rain.js          WebGL rain-on-glass hero with slide controls (no three.js)
│   │   ├── hover.js         theme index colour flood + floating previews, crafts previews
│   │   ├── media.js         video modal, lightbox, portfolio filters, enquiry form
│   │   └── distort.js       WebGL hover distortion on images
│   └── main.js            ← entry: boots everything in order
└── public/                ← copied as-is: images, robots.txt, sitemap.xml
    └── assets/img/{brand,portfolio,gallery,decor,services,journal,themes,instagram}
```

## Editing content

All content is rendered to static HTML **at build time**, so search engines and no-JS visitors see everything.

* **Phone, email, address, socials:** edit `src/content/site.json`. It's used everywhere, including the footer, menu, enquiry page and schema.org data. In any HTML file you can write `{{phone}}`, `{{email}}`, `{{instagram}}` and so on.
* **Chapter teasers on the home page and menu** (title, teaser line, image): `site.json › chapters`. The order of the chapters also sets the order of the "Next chapter" links.
* **Services:** `services.json`. Add or remove a service, change its image, or move it to another act.
* **Portfolio:** `portfolio.json`. `category` is either `Weddings` or `Socials` (these drive the filter buttons). `link` currently points to the project page on the existing WordPress site.
* **Journal:** `journal.json`. `limit` can be passed to the renderer.
* **Films:** `films.json`. Each film is `{ "id", "title" }` from youtube.com/@Rainmakerweddingplanners. (The IDs on the current site's Video Gallery page no longer play, they are private or removed, so the public channel was used instead.)
* **Signature themes:** `themes.json`. Each theme has `bg`, `accent` and `ink` colours that drive its mood on the home showcase and the theme index, so a new theme needs no CSS. Set `video` to a YouTube ID to make its card open the film; otherwise the card opens its photo in the lightbox. (`link` is kept for reference only and is not rendered.) The order of the array is the order of the rotation; no theme is "the" hero.
* **Instagram:** `instagram.json`. These posts were captured from Instagram's public embed pages, because the profile itself is behind a login wall.
* **Page copy** (hero headlines, story text, process steps): edit the HTML page directly.
* **Colours and fonts:** `src/styles/tokens.css`.

> After editing a file in `build/` or `src/content/`, the dev server reloads. If a change in `build/render.js` doesn't show up, restart `npm run dev`.

### Adding a page
1. Copy an existing page, e.g. `story.html` → `awards.html`.
2. Add `'awards'` to the `pages` array in `vite.config.js`.
3. Optionally add it to `site.json › chapters` so it shows up in the menu, the home teasers and the next-chapter links.

## Effects (and how to switch them off)

| Effect | Where | Code |
|---|---|---|
| Short rain-curtain intro (first visit per session, home only) | home | `chrome.js › runIntro` |
| Page transitions: gold-edged curtain naming the destination page | all internal links | `chrome.js › initTransitions` |
| **Rain on glass**: procedural drops refract a sharp copy of each photo over a soft fog; slides change with a rain-washed dissolve; visible prev / pause / next | home hero | `rain.js` |
| Theme index: hovering a theme floods the section with its colours and floats its photo by the cursor | home | `hover.js › initWorlds` |
| Starry Night sky: swirls, drifting stars and a glowing moon in CSS | Starry Night feature | `home.css › .sky` |
| Word reveals (`data-split`), fade-ups (`data-reveal`), image wipes (`data-img-reveal`) — no masks, so text is never clipped | all | `core.js`, `base.css` |
| Gentle parallax (`data-speed`), desktop only | all | `core.js` |
| WebGL hover distortion (`data-distort`) | image cards | `distort.js` |
| Gold shimmer (`.gilt`, `.btn--gold`), custom cursor, magnetic buttons | all | `base.css`, `chrome.js` |
| Self-drawing gold thread | process | `core.js › initDrawScroll` |

**Accessibility and performance safeguards**
* `prefers-reduced-motion: reduce` turns off Lenis, the intro, transitions, the rain WebGL, slideshow autoplay, parallax and reveals.
* Without JavaScript, all content is still visible. Every animation's starting state is scoped to `.js`.
* Semantic landmarks, a skip link, real `<button>`s and `<details>`, a focus trap and Esc to close the menu, visible `:focus-visible` rings, `aria-pressed` on filters, labelled form fields with inline errors, and alt text on every content image (decorative images use `alt=""`).
* Reduced motion also disables the hover distortion.
* The WebGL layers are capped at 1.5× DPR, pauses when off-screen, and falls back to the `<img>` underneath if WebGL isn't available.
* Images are WebP, lazy-loaded, with width and height set. YouTube loads only on click, from `youtube-nocookie.com`.

## Enquiry form

The form is in `enquire.html`. Its fields match the current site's form: couple names, wedding date, destination, type of wedding, contact number and email, plus an optional message. A honeypot field catches spam.

Pick **one** of these:

1. **Netlify Forms (zero config).** Deploy to Netlify. The form already has `data-netlify="true"`, and submissions appear in *Netlify › Forms*. Turn on email notifications there.
2. **Formspree, Getform or Basin (any host).** Create a form endpoint and paste its URL into `data-endpoint=""` on the `<form>`. The JS posts `FormData` with `Accept: application/json`.
3. **Your own API.** Same as option 2, but point `data-endpoint` at your server. It should respond `2xx` on success.

If sending fails, the visitor sees a pre-filled `mailto:` link to `info@rainmakerevents.co.in` and the phone number, so no enquiry is lost.

## Deploying

The build output is a static `dist/` folder, so any static host works.

* **Netlify:** connect the repo. `netlify.toml` already sets the build command (`npm run build`) and the publish folder (`dist`).
* **Vercel:** import the repo. `vercel.json` sets the same and enables clean URLs (`/portfolio`).
* **Cloudflare Pages:** build command `npm run build`, output directory `dist`.
* **GitHub Pages (sub-path):** `.github/workflows/deploy.yml` builds with `BASE_PATH=/<repo>/` and publishes `dist` to the `gh-pages` branch on every push to `main`. In *Settings › Pages*, set the source to **Deploy from a branch → gh-pages / (root)**. For any other sub-path, run `BASE_PATH=/sub/path/ npm run build`. The build prefixes every root-absolute link and image (`build/html-partials.js › htmlBase`).
* **cPanel, Apache or Nginx:** run `npm run build` and upload what's in `dist/` to the web root. Set `404.html` as the error document.

Before going live:
- [ ] Replace `https://rainmakerweddings.com` in `site.json › siteUrl` if the domain changes. It's used for canonical URLs, Open Graph and schema.
- [ ] Set up 301 redirects from the old WordPress URLs (e.g. `/services/` → `/experiences.html`, `/blogs/` → `/journal.html`, `/contact/` → `/enquire.html`, `/portfolio/` → `/portfolio.html`).
- [ ] Decide where the blog, the portfolio case studies and the policy pages will live (see TODOs). Right now they link to the existing WordPress pages.

## Before launch (moving from the preview to rainmakerweddings.com)

The GitHub Pages preview is built with `SITE_URL=https://manazafzal.github.io/rainmaker-weddings` and `PREVIEW_NOINDEX=1` (see `.github/workflows/deploy.yml`), so canonical, og:url, og:image, the schema URLs, the sitemap and robots.txt all point at the preview link, and the preview is kept out of search engines. For the real launch:

1. **Set `SITE_URL=https://rainmakerweddings.com`** for the production build (or leave `SITE_URL` unset: the default is `siteUrl` in `src/content/site.json`, which is already `https://rainmakerweddings.com`).
2. **Remove the noindex:** do not set `PREVIEW_NOINDEX` (drop it from the workflow's build line), so pages get no `noindex, nofollow` meta.
3. **Remove the robots Disallow:** without `PREVIEW_NOINDEX` the build ships the normal `public/robots.txt` (`Allow: /` plus the sitemap) instead of the preview's `Disallow: /`.
4. Build at the domain root (no `BASE_PATH`), deploy, then check view-source for the canonical and `/robots.txt` on the live domain.

## SEO
* Every page has its own `<title>`, meta description, canonical URL, Open Graph and Twitter tags (`partials/head.html`). The share image is `public/assets/img/og-image.jpg`.
* `schema.org/LocalBusiness` JSON-LD is generated from `site.json` (`build/render.js › schema`). It contains only facts published on the current site: name, address, phone, email, founding year, socials, and the two awards named there.
* `robots.txt` and `sitemap.xml` are in `public/`.

## SEO migration (WordPress → this site)

1. **Keep every old URL working.** Either keep the same paths or add permanent **301 redirects** from each old WordPress URL to its new page, for example `/services/` → `/experiences.html`, `/portfolio/` → `/portfolio.html`, `/about-us/` → `/story.html`, `/blogs/` → `/journal.html`, `/contact/` → `/enquire.html`, and each case-study slug (e.g. `/mathew-pooja/`) → `/portfolio.html` or its future case-study page. Use `netlify.toml` / `vercel.json` redirects or your server config. Never leave old URLs returning 404.
2. **Canonical URLs** already point to `https://rainmakerweddings.com/…` (`site.json › siteUrl`). Change that only if the domain changes.
3. **Sitemap:** update `public/sitemap.xml` if you add pages, then resubmit `https://rainmakerweddings.com/sitemap.xml` in **Google Search Console** (and Bing Webmaster Tools), and use *URL Inspection → Request indexing* for the home page and key pages.
4. **Preview vs production:** the GitHub Pages preview is built with `PREVIEW_NOINDEX=1`, which adds `<meta name="robots" content="noindex, nofollow">` to every page and a `Disallow: /` robots.txt, so it never competes with the real domain. **Do not set `PREVIEW_NOINDEX` for the production build.** Plain `npm run build` stays indexable, with the normal `public/robots.txt`.
5. After launch, watch Search Console *Pages* and *Core Web Vitals* reports for a few weeks and fix any 404s it reports.

**Structured data** on every page: `Organization` (with Instagram, YouTube and Facebook `sameAs`), `LocalBusiness`, `WebSite` and a per-page `BreadcrumbList` (`build/render.js › schema`).

**Images:** if a `<name>-800.webp` exists next to an image in `public/`, the build adds a `srcset` automatically so phones download the smaller file. Create 800 px wide variants for any new large image.

## Placeholders and TODOs for the client

Search the code for `TODO` to find them all.

* **Founder portraits and bios** (`story.html`). The names and roles, *Joel John, Co-founder & CEO* and *Jubin P Markx, Co-founder & Creative Director*, come from public LinkedIn and press sources, not the current site. **Please confirm.**
* **Theme descriptions** (`themes.json`). They are condensed from the project pages, Instagram captions or YouTube titles. The eight themes taken from YouTube (MayaLokah, Animeverse, Interstellar, Encanto, Enchanted Forest, Jazz Age, The Red Room, Ashtalakshmi) use video frames as images. **Please supply photos and confirm the wording.** The Thrissur Pooram images are the illustrated Instagram posts. Swap in event photography if you have it.
* **Process steps** (`process.html`). These are built from Rainmaker's own service list and its "Curtain Raiser" and "Destination Wedding Queries" questionnaires. Please confirm the order and wording. No packages or prices are published on the current site, so none are shown here. Add them if you want them public.
* **Trousseau Planning** has no published inclusions on the current site, so it shows a generic line.
* **Response time** on the enquiry page. Add a promise only if you want to commit to one.
* **Instagram feed** (`instagram.json`, shown on Portfolio and Journal). This is a static snapshot of recent posts (Thrissur Pooram, Cyberpunk, #TheNAshtyWedding), linking to the profile. For a live feed, use the Instagram API with Instagram Login (via Meta for Developers) or a widget service such as Behold or SnapWidget, and replace the output of `instagramFeed` in `build/render.js`.
* **Portfolio case studies, full blog articles and policy pages (Refund, Terms, Privacy)** are not linked anywhere yet (no links to the old WordPress site). Portfolio cards open in the lightbox and journal cards show excerpts; add local pages when the content is migrated (see `TODO` in `footer.html`, `render.js › journalGrid`, `portfolio.html`).
* **Higher-resolution images.** Some images came from the current site at 1024 px. Swapping in the originals will sharpen the large hero areas.

## Content and image rights

* **Code:** MIT (see `LICENSE`).
* **Images, logos, award badges and copy** were taken from rainmakerweddings.com, the public @rainmakerweddings Instagram embeds and the public YouTube channel for this redesign. They **belong to Rainmaker Weddings / Rainmaker Signature Experiences** and the respective photographers and award bodies (GIWA, WOW Asia, EEMA, DWP Congress, EMAK, Tourism Authority of Thailand). They are **not** covered by the MIT licence. Use them only with the client's permission.

## Third-party licences

| Package | Licence |
|---|---|
| [Vite](https://github.com/vitejs/vite) | MIT |
| [Lenis](https://github.com/darkroomengineering/lenis) | MIT |
| [GSAP](https://gsap.com) (incl. ScrollTrigger) | GSAP Standard "No Charge" License: free for commercial use, but **not** an OSI open-source licence. See <https://gsap.com/standard-license>. To stay strictly OSI, the reveals could be ported to [Motion](https://motion.dev) (MIT). |
| Bodoni Moda, Inter Tight (Google Fonts) | SIL Open Font License 1.1 |

The WebGL shaders in `src/js/rain.js` (original rain-drop shader) and `src/js/distort.js` are original code, released under MIT with the rest of the project.
