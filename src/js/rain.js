/**
 * Hero "Make it rain": the client's real celebrations seen through rain on glass.
 * Procedural drops (original shader) refract a sharp copy of each photo over a softly fogged copy; slides
 * change with a rain-washed dissolve. Visible prev / pause / next controls; autoplay is
 * off for reduced motion, and the whole effect falls back to a CSS cross-fade.
 */
import { reduced } from './core.js';

const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const FS = `precision highp float;
varying vec2 v;
uniform sampler2D s0,b0,s1,b1;
uniform vec2 res,a0,a1;
uniform float time,prog,rain,zoom;
float hs(vec2 p){p=fract(p*vec2(233.34,851.73));p+=dot(p,p+23.45);return fract(p.x*p.y);}
float beads(vec2 q,float t){
  q*=22.; vec2 id=floor(q), f=fract(q)-.5;
  float r1=hs(id), r2=hs(id+7.3), life=fract(t*.12+r1*3.);
  vec2 c=(vec2(r1,r2)-.5)*.6; float sz=.12+.16*r2;
  return smoothstep(1.,.2,length(f-c)/sz)*smoothstep(0.,.06,life)*smoothstep(1.,.55,life)*step(.5,hs(id+1.7));
}
vec2 streams(vec2 q,float t,float cols,float seed){
  float cid=floor(q.x*cols); float r=hs(vec2(cid,seed));
  if(r<.35) return vec2(0.);
  float top=zoom; float yd=top*(1.15-fract(t*(.22+.3*r)+r*7.)*1.4);
  float xc=(cid+.5+.28*sin(q.y*5.+r*20.)*(r-.5))/cols;
  float dx=q.x-xc, up=q.y-yd;
  float body=smoothstep(.03,.0,length(vec2(dx,up*.75)));
  float above=step(0.,up)*smoothstep(.32,.0,up);
  float trail=smoothstep(.007,.0,abs(dx))*above;
  float bead=smoothstep(.011,.0,length(vec2(dx,(fract(up*13.)-.5)/13.)))*above*step(.5,hs(vec2(cid,floor(up*13.))));
  return vec2(body+bead*.8,trail);
}
vec2 Drops(vec2 q,float t){
  vec2 a=streams(q,t,9.,1.), b=streams(q+vec2(.031,0.),t*1.1,16.,2.);
  float h=beads(q,t)+a.x+b.x;
  return vec2(smoothstep(.2,1.,h),max(a.y,b.y));
}
vec2 cover(vec2 uv,vec2 ia){float ca=res.x/res.y,ra=ia.x/ia.y;vec2 sc=ca>ra?vec2(1.,ra/ca):vec2(ca/ra,1.);return (uv-.5)*sc+.5;}
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){
  vec2 UV=vec2(v.x,1.-v.y);
  vec2 uv=v*vec2(res.x/res.y,1.)*zoom;
  float t=time*.5;
  vec2 c=Drops(uv,t);
  vec2 e=vec2(.0015,0.);
  float cx=Drops(uv+e,t).x, cy=Drops(uv+e.yx,t).x;
  float wash=sin(prog*3.14159);
  vec2 n=vec2(cx-c.x,-(cy-c.x))*.5*(1.+wash*1.5);
  float sharp=clamp(max(smoothstep(.1,.2,c.x),c.y*.9),0.,1.);
  float fog=mix(.72,1.,sharp);
  vec2 u=UV+n;
  vec3 A=mix(texture2D(b0,cover(u,a0)).rgb,texture2D(s0,cover(u,a0)).rgb,fog);
  vec3 B=mix(texture2D(b1,cover(u,a1)).rgb,texture2D(s1,cover(u,a1)).rgb,fog);
  float th=prog*1.3-.15;
  float nz=ns(UV*5.+vec2(0.,time*.3))*.35+UV.y*.65;
  float k=1.-smoothstep(th-.12,th,nz);
  vec3 col=mix(A,B,k);
  col+=sharp*.06;
  gl_FragColor=vec4(col,1.);
}`;

export function initRainHero() {
  const hero = document.querySelector('[data-rain-hero]');
  if (!hero) return;
  const slides = [...hero.querySelectorAll('.hero__slide')];
  const nameEl = hero.querySelector('.hero__now-name');
  const pauseBtn = hero.querySelector('[data-hero-pause]');
  let idx = 0, paused = reduced, timer = 0, gl = null;

  const announce = (manual) => {
    nameEl.setAttribute('aria-live', manual ? 'polite' : 'off');
    nameEl.textContent = slides[idx].dataset.label || '';
  };
  const go = (n, manual = false) => {
    const prev = idx;
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    announce(manual);
    gl?.to(prev, idx);
    schedule();
  };
  const schedule = () => { clearTimeout(timer); if (!paused) timer = setTimeout(() => go(idx + 1), 6500); };
  hero.querySelector('[data-hero-next]')?.addEventListener('click', () => go(idx + 1, true));
  hero.querySelector('[data-hero-prev]')?.addEventListener('click', () => go(idx - 1, true));
  const setPaused = (v) => {
    paused = v;
    pauseBtn.setAttribute('aria-pressed', String(v));
    pauseBtn.setAttribute('aria-label', v ? 'Play slideshow' : 'Pause slideshow');
    gl?.setRunning(!v);
    schedule();
  };
  pauseBtn?.addEventListener('click', () => setPaused(!paused));
  if (reduced) setPaused(true);
  schedule();

  if (reduced) return;
  const start = () => { try { gl = createGL(hero, slides); } catch (e) { gl = null; } if (gl) { hero.classList.add('has-gl'); gl.setRunning(!paused); } };
  (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(start, { timeout: 1200 });
}

function createGL(hero, slides) {
  const canvas = hero.querySelector('.hero__gl');
  const g = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!g) return null;
  const sh = (t, s) => { const o = g.createShader(t); g.shaderSource(o, s); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
  const pr = g.createProgram();
  g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr);
  if (!g.getProgramParameter(pr, g.LINK_STATUS)) return null;
  g.useProgram(pr);
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
  const U = {}; ['s0', 'b0', 's1', 'b1', 'res', 'a0', 'a1', 'time', 'prog', 'rain', 'zoom'].forEach((k) => (U[k] = g.getUniformLocation(pr, k)));
  ['s0', 'b0', 's1', 'b1'].forEach((k, i) => g.uniform1i(U[k], i));

  const mk = (src) => {
    const t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, src);
    return t;
  };
  const cache = new Map();
  const texOf = (img) => {
    if (cache.has(img)) return cache.get(img);
    if (!img.complete || !img.naturalWidth) return null;
    const c = document.createElement('canvas');
    const w = 160, h = Math.round((160 * img.naturalHeight) / img.naturalWidth);
    c.width = w; c.height = h;
    const x = c.getContext('2d'); x.filter = 'blur(3px)'; x.drawImage(img, -4, -4, w + 8, h + 8);
    const o = { s: mk(img), b: mk(c), a: [img.naturalWidth, img.naturalHeight] };
    cache.set(img, o); return o;
  };
  const st = { from: 0, to: 0, prog: 1, t0: performance.now(), running: true, visible: true, raf: 0 };
  const bind = (unit, tex) => { g.activeTexture(g.TEXTURE0 + unit); g.bindTexture(g.TEXTURE_2D, tex); };
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 1);
    const w = Math.min(1700, Math.round(canvas.clientWidth * dpr)), h = Math.round((w * canvas.clientHeight) / canvas.clientWidth);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; g.viewport(0, 0, w, h); }
  };
  const draw = (now) => {
    st.raf = 0;
    resize();
    const A = texOf(slides[st.from]) || texOf(slides[0]);
    const B = texOf(slides[st.to]) || A;
    if (!A) { loop(); return; }
    if (st.prog < 1) st.prog = Math.min(1, st.prog + 1 / 110);
    bind(0, A.s); bind(1, A.b); bind(2, B.s); bind(3, B.b);
    g.uniform2f(U.res, canvas.width, canvas.height); g.uniform2fv(U.a0, A.a); g.uniform2fv(U.a1, B.a);
    g.uniform1f(U.time, (now - st.t0) / 1000); g.uniform1f(U.prog, st.prog); g.uniform1f(U.rain, 0.42); g.uniform1f(U.zoom, canvas.clientWidth < 760 ? 1.9 : 1.35);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    if (st.prog >= 1) st.from = st.to;
    loop();
  };
  const loop = () => { if (!st.raf && st.visible && (st.running || st.prog < 1) && !document.hidden) st.raf = requestAnimationFrame(draw); };
  new IntersectionObserver(([e]) => { st.visible = e.isIntersecting; loop(); }).observe(hero);
  document.addEventListener('visibilitychange', loop);
  addEventListener('resize', () => { if (!st.raf) requestAnimationFrame(draw); });
  // draw one frame even while paused so the canvas is never blank
  requestAnimationFrame(draw);
  return {
    to(from, to) { if (!texOf(slides[to])) slides[to].addEventListener('load', () => {}, { once: true }); st.from = st.prog < 1 ? st.to : from; st.to = to; st.prog = 0; loop(); },
    setRunning(v) { st.running = v; loop(); if (!v) requestAnimationFrame(draw); },
  };
}
