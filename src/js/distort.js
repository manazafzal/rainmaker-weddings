/**
 * WebGL hover distortion + reveal.
 * One shared canvas is moved into whichever [data-distort] container the pointer enters.
 * It renders the container's image(s) with a liquid displacement that follows pointer
 * velocity, a soft RGB split, and — when a second image exists — a noise dissolve into it.
 * Desktop pointer only; skipped under prefers-reduced-motion or without WebGL.
 */
const VS = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const FS = `precision mediump float;
varying vec2 v;
uniform sampler2D t0,t1;
uniform vec2 res,a0,a1,m,vel;
uniform float s,r,time;
vec2 cover(vec2 uv, vec2 ia){ float ca=res.x/res.y; vec2 sc=ca>ia.x/ia.y? vec2(1., (ia.x/ia.y)/ca) : vec2(ca/(ia.x/ia.y),1.); return (uv-.5)*sc+.5; }
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){
  vec2 uv=vec2(v.x,1.-v.y);
  vec2 d=uv-m; d.x*=res.x/res.y;
  float fall=smoothstep(.55,0.,length(d));
  vec2 off=vel*fall*.10*s + d*fall*.035*s*sin(time*2.+length(d)*18.);
  float split=.006*s*(.4+length(vel)*4.);
  vec2 u0=cover(uv-off,a0), u1=cover(uv-off*1.4,a1);
  vec3 c0=vec3(texture2D(t0,u0+vec2(split,0)).r,texture2D(t0,u0).g,texture2D(t0,u0-vec2(split,0)).b);
  vec3 c1=texture2D(t1,u1).rgb;
  float nz=n(uv*6.+time*.15)*.6+n(uv*18.)*.4;
  float edge=r*1.25-(1.-fall)*.25;
  float k=smoothstep(edge-.12,edge,nz)*-1.+1.;
  vec3 col=mix(c0,c1,clamp(k*step(.001,r),0.,1.));
  gl_FragColor=vec4(col,1.);
}`;

export function initDistort({ reduced, gsap }) {
  if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const targets = document.querySelectorAll('[data-distort]');
  if (!targets.length) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'distort';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return;
  const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['t0', 't1', 'res', 'a0', 'a1', 'm', 'vel', 's', 'r', 'time'].forEach((k) => (U[k] = gl.getUniformLocation(pr, k)));
  gl.uniform1i(U.t0, 0); gl.uniform1i(U.t1, 1);
  const texCache = new Map();
  const tex = (img) => {
    if (texCache.has(img.currentSrc || img.src)) return texCache.get(img.currentSrc || img.src);
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    const o = { t, a: [img.naturalWidth, img.naturalHeight] }; texCache.set(img.currentSrc || img.src, o); return o;
  };
  const st = { s: 0, r: 0, m: [0.5, 0.5], tm: [0.5, 0.5], vel: [0, 0], el: null, raf: 0, t0: null, t1: null };
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const frame = (now) => {
    if (!st.el) { st.raf = 0; return; }
    const w = st.el.clientWidth, h = st.el.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); gl.viewport(0, 0, canvas.width, canvas.height); }
    const px = st.m[0], py = st.m[1];
    st.m[0] += (st.tm[0] - st.m[0]) * 0.12; st.m[1] += (st.tm[1] - st.m[1]) * 0.12;
    st.vel[0] += ((st.m[0] - px) * 6 - st.vel[0]) * 0.2; st.vel[1] += ((st.m[1] - py) * 6 - st.vel[1]) * 0.2;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, st.t0.t);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, st.t1.t);
    gl.uniform2f(U.res, w, h); gl.uniform2fv(U.a0, st.t0.a); gl.uniform2fv(U.a1, st.t1.a);
    gl.uniform2fv(U.m, st.m); gl.uniform2fv(U.vel, st.vel);
    gl.uniform1f(U.s, st.s); gl.uniform1f(U.r, st.hasAlt ? st.r : 0); gl.uniform1f(U.time, now / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    st.raf = requestAnimationFrame(frame);
  };
  targets.forEach((el) => {
    const imgs = el.querySelectorAll('img');
    if (!imgs.length) return;
    el.addEventListener('pointerenter', (e) => {
      const a = imgs[0], b = imgs[1] || imgs[0];
      if (!a.complete || !a.naturalWidth) return;
      if (b !== a && (!b.complete || !b.naturalWidth)) b.loading = 'eager';
      try { st.t0 = tex(a); st.t1 = b.complete && b.naturalWidth ? tex(b) : st.t0; } catch { return; }
      st.hasAlt = st.t1 !== st.t0;
      st.el = el; el.appendChild(canvas); el.classList.add('is-distorting');
      const r = el.getBoundingClientRect();
      st.tm = st.m = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
      st.vel = [0, 0];
      gsap.killTweensOf(st);
      gsap.to(st, { s: 1, r: 1, duration: 1.1, ease: 'expo.out' });
      gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      if (!st.raf) st.raf = requestAnimationFrame(frame);
    });
    el.addEventListener('pointermove', (e) => {
      if (st.el !== el) return;
      const r = el.getBoundingClientRect();
      st.tm = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    });
    el.addEventListener('pointerleave', () => {
      if (st.el !== el) return;
      gsap.killTweensOf(st);
      gsap.to(st, { s: 0, r: 0, duration: 0.7, ease: 'expo.out' });
      gsap.to(canvas, { opacity: 0, duration: 0.45, delay: 0.25, onComplete: () => { if (st.el === el) { el.classList.remove('is-distorting'); st.el = null; canvas.remove(); } } });
    });
  });
}
