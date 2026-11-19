/* "You bring the idea. We elevate it." — one real celebration photo begins as soft,
 * drifting fragments floating in the wine-coloured dark. As you scroll they turn, glide and
 * settle into place, edges glinting gold, until the finished photograph is whole.
 * One WebGL draw call, paused off-screen; reduced motion or no WebGL keeps the still photo. */
import { reduced } from './core.js';

const VS = `
attribute vec2 c;      // corner within tile (0..1)
attribute vec2 o;      // tile origin in grid (0..1)
attribute vec4 s;      // random seed
uniform vec2 tile, res; uniform float pr, time;
varying vec2 vUv; varying vec2 vC; varying float vE;
void main(){
  float d=length(o+tile*.5-vec2(.5,.5));
  float st=s.x*.42+d*.28;
  float lp=clamp((pr-st)/.38,0.,1.);
  float e=lp*lp*(3.-2.*lp); e=1.-pow(1.-e,2.);
  vE=e;
  vec2 ctr=o+tile*.5;
  float sh=mix(.62,1.,e);
  vec2 loc=(c-.5)*tile*sh;
  float a=(s.w-.5)*2.2*(1.-e);
  float asp=res.x/res.y;
  loc.x*=asp; loc=mat2(cos(a),-sin(a),sin(a),cos(a))*loc; loc.x/=asp;
  vec2 drift=vec2(sin(time*.25+s.y*30.),cos(time*.21+s.z*30.))*.012*(1.-e);
  vec2 off=(s.yz*2.-1.)*vec2(.55,.45)*(1.-e)+ (ctr-.5)*.35*(1.-e);
  vec2 p=ctr+loc+off+drift;
  vUv=o+c*tile; vC=c;
  gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);
}`;
const FS = `precision highp float;
uniform sampler2D tex; uniform vec2 res, ir; uniform vec3 bg;
varying vec2 vUv; varying vec2 vC; varying float vE;
vec2 cover(vec2 u){ float ra=res.x/res.y, ia=ir.x/ir.y; vec2 k=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.); return (u-.5)*k+.5; }
void main(){
  vec3 raw=texture2D(tex,cover(vUv)).rgb;
  vec3 dk=mix(raw,bg,.38)*.56; dk*=1.-.42*smoothstep(.42,0.,abs(vUv.y-.48));
  vec3 ph=mix(raw*1.02,dk,smoothstep(.55,1.,vE));
  float edge=min(min(vC.x,1.-vC.x),min(vC.y,1.-vC.y));
  float rim=smoothstep(.035,0.,edge)*(1.-vE);
  vec3 col=mix(ph, vec3(.97,.86,.62), rim*.8);
  float a=mix(.0,1.,smoothstep(0.,.25,vE+.18));
  gl_FragColor=vec4(col*a,a);
}`;

const hexRGB = (h) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16) / 255);

export function initShards() {
  const scene = document.querySelector('[data-scene]');
  if (!scene || reduced) return;
  const fig = scene.querySelector('.scene__media'); const img = fig?.querySelector('img');
  if (!img) return;
  const cv = document.createElement('canvas'); cv.className = 'scene__shards';
  const g = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!g) return;
  const sh = (t, src) => { const x = g.createShader(t); g.shaderSource(x, src); g.compileShader(x); if (!g.getShaderParameter(x, g.COMPILE_STATUS)) console.warn('shards', g.getShaderInfoLog(x)); return x; };
  const pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr);
  if (!g.getProgramParameter(pr, g.LINK_STATUS)) { console.warn('shards', g.getProgramInfoLog(pr)); return; }
  g.useProgram(pr);
  const small = matchMedia('(max-width: 760px)').matches;
  const dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
  let cols = 0, rows = 0, count = 0;
  const build = () => {
    const asp = fig.clientWidth / Math.max(1, fig.clientHeight);
    const n = small ? 9 : 14; cols = asp >= 1 ? n : Math.max(5, Math.round(n * asp)); rows = Math.max(5, Math.round(cols / asp));
    const tw = 1 / cols, th = 1 / rows, v = [];
    const C = [[0, 0], [1, 0], [0, 1], [0, 1], [1, 0], [1, 1]];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const sd = [Math.random(), Math.random(), Math.random(), Math.random()];
      C.forEach(([cx, cy]) => v.push(cx, cy, x * tw, y * th, ...sd));
    }
    count = v.length / 8;
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array(v), g.STATIC_DRAW);
    [['c', 2, 0], ['o', 2, 8], ['s', 4, 16]].forEach(([n2, sz, off]) => { const l = g.getAttribLocation(pr, n2); g.enableVertexAttribArray(l); g.vertexAttribPointer(l, sz, g.FLOAT, false, 32, off); });
    g.uniform2f(U.tile, tw, th);
  };
  const U = {}; ['tex', 'res', 'ir', 'pr', 'time', 'bg', 'tile'].forEach((k) => (U[k] = g.getUniformLocation(pr, k)));
  g.uniform3fv(U.bg, hexRGB(scene.dataset.flood || '#67223c'));
  g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
  const size = () => { cv.width = Math.round(fig.clientWidth * dpr); cv.height = Math.round(fig.clientHeight * dpr); g.viewport(0, 0, cv.width, cv.height); g.uniform2f(U.res, cv.width, cv.height); build(); };
  const src = new Image(); src.decoding = 'async'; src.src = img.currentSrc || img.src;
  let ready = false, vis = false, raf = 0, last = 0; const t0 = performance.now();
  const draw = (now) => {
    raf = 0; if (!vis || !ready) return;
    raf = requestAnimationFrame(draw);
    if (small && now - last < 32) return; last = now;
    const p = parseFloat(getComputedStyle(scene).getPropertyValue('--p')) || 0;
    g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
    g.uniform1f(U.pr, p * 1.08); g.uniform1f(U.time, (now - t0) / 1000);
    g.drawArrays(g.TRIANGLES, 0, count);
  };
  src.onload = () => {
    const t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t);
    [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T].forEach((k) => g.texParameteri(g.TEXTURE_2D, k, g.CLAMP_TO_EDGE));
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, src);
    g.uniform1i(U.tex, 0); g.uniform2f(U.ir, src.naturalWidth, src.naturalHeight);
    fig.appendChild(cv); size(); ready = true; fig.classList.add('has-shards');
    if (vis && !raf) raf = requestAnimationFrame(draw);
  };
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => ready && size(), 200); });
  new IntersectionObserver(([en]) => { vis = en.isIntersecting; if (vis && ready && !raf) raf = requestAnimationFrame(draw); }, { rootMargin: '200px 0px' }).observe(scene);
}
