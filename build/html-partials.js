/**
 * Tiny, dependency-free HTML templating for Vite.
 *
 *   <!-- @include partials/header.html -->
 *   <!-- @include partials/head.html title="Portfolio" description="…" -->
 *   <!-- @render portfolioGrid -->
 *
 * - @include inlines a file from /partials. Attributes become {{variables}} inside it,
 *   plus every key of src/content/site.json (e.g. {{phone}}, {{email}}).
 * - @render calls a function exported from build/render.js, which turns the JSON in
 *   /src/content into HTML at build time (so content is crawlable without JS).
 */
import { readFileSync, writeFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as renderers from './render.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'));

const attrRe = /(\w[\w-]*)="([^"]*)"/g;
const parseAttrs = (s = '') => Object.fromEntries([...s.matchAll(attrRe)].map((m) => [m[1], m[2]]));

function fill(html, vars) {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
    const v = k.split('.').reduce((o, key) => (o == null ? o : o[key]), vars);
    return v == null ? '' : String(v);
  });
}

function processHtml(html, depth = 0) {
  if (depth > 8) throw new Error('html-partials: include depth exceeded');
  const site = readJSON('src/content/site.json');
  if (depth === 0) html = fill(html, site);
  html = html.replace(/<!--\s*@include\s+([^\s]+)\s*([^>]*?)-->/g, (_, file, attrs) => {
    const vars = { ...site, ...parseAttrs(attrs) };
    const partial = readFileSync(resolve(root, file), 'utf8');
    return processHtml(fill(partial, vars), depth + 1);
  });
  html = html.replace(/<!--\s*@render\s+(\w+)\s*([^>]*?)-->/g, (_, name, attrs) => {
    const fn = renderers[name];
    if (!fn) throw new Error(`html-partials: unknown renderer "${name}"`);
    return fn(parseAttrs(attrs), { readJSON, site });
  });
  return html;
}

/** Width of a WebP file, read from its header (VP8, VP8L or VP8X). */
function webpWidth(file) {
  const fd = openSync(file, 'r');
  const b = Buffer.alloc(30);
  readSync(fd, b, 0, 30, 0);
  closeSync(fd);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return b.readUInt16LE(26) & 0x3fff;
  if (kind === 'VP8L') return 1 + (((b[22] & 0x3f) << 8) | b[21]);
  if (kind === 'VP8X') return 1 + b.readUIntLE(24, 3);
  return 0;
}

/**
 * Responsive images: if public/<path>-800.webp exists next to an image, add a
 * srcset so phones download the 800 px version. (Create variants with any
 * image tool; see README › Images.)
 */
function addSrcset(html) {
  return html.replace(/<img\b([^>]*?)\ssrc="(\/assets\/img\/[^"]+?)\.webp"([^>]*)>/g, (m, pre, path, post) => {
    if (/srcset=/.test(m) || path.endsWith('-800')) return m;
    const variant = resolve(root, 'public', `.${path}-800.webp`);
    if (!existsSync(variant)) return m;
    const w = webpWidth(resolve(root, 'public', `.${path}.webp`));
    if (!w) return m;
    const sizes = /sizes="/.test(m) ? '' : ' sizes="(max-width: 800px) 100vw, 60vw"';
    return `<img${pre} src="${path}.webp" srcset="${path}-800.webp 800w, ${path}.webp ${w}w"${sizes}${post}>`;
  });
}

/**
 * When the site is served from a sub-path (e.g. GitHub Pages: /rainmaker-weddings/),
 * prefix the root-absolute URLs written in our HTML (links, images, data-* lists).
 */
function applyBase(html, base) {
  if (!base || base === '/') return html;
  const b = base.replace(/\/$/, '');
  const fix = (u) => (u.startsWith('/') && !u.startsWith('//') && !u.startsWith(b + '/') ? b + u : u);
  return html
    .replace(/\b(href|src|data-menu-img|data-full|poster|data-img|data-hover-img|data-world-img|data-hover-src)="([^"]*)"/g, (_, a, u) => `${a}="${fix(u)}"`)
    .replace(/\b(data-slides|srcset)="([^"]*)"/g, (_, a, list) => `${a}="${list.split(',').map((x) => { const t = x.trim(); const [u, ...rest] = t.split(/\s+/); return [fix(u), ...rest].join(' '); }).join(',')}"`);
}

export function htmlPartials() {
  let base = '/';
  return {
    name: 'html-partials',
    enforce: 'pre',
    configResolved(c) { base = c.base; },
    handleHotUpdate({ file, server }) {
      if (/[\\/](partials|src[\\/]content|build)[\\/]/.test(file)) server.ws.send({ type: 'full-reload' });
    },
    transformIndexHtml: { order: 'pre', handler: (html) => addSrcset(processHtml(html)) },
  };
}

export function htmlBase() {
  let base = '/';
  let outDir = 'dist';
  // PREVIEW_NOINDEX=1 is set only by the GitHub Pages workflow: the preview copy is
  // kept out of search engines so it never competes with rainmakerweddings.com.
  const noindex = /^(1|true|yes)$/i.test(process.env.PREVIEW_NOINDEX || '');
  return {
    name: 'html-base',
    apply: 'build',
    configResolved(c) { base = c.base; outDir = resolve(c.root, c.build.outDir); },
    transformIndexHtml: {
      order: 'post',
      handler: (html) => {
        html = applyBase(html, base);
        if (noindex) html = html.replace(/<meta name="robots"[^>]*>\s*/g, '').replace('<head>', '<head>\n<meta name="robots" content="noindex, nofollow">');
        return html;
      },
    },
    closeBundle() {
      if (noindex) writeFileSync(resolve(outDir, 'robots.txt'), '# Preview build: not for indexing. Production robots.txt is public/robots.txt.\nUser-agent: *\nDisallow: /\n');
    },
  };
}
