/* "You bring the idea. We elevate it." — the client's idea appears first as a gold line
 * sketch of the real celebration; as you scroll, ink-in-water swirls dissolve the sketch
 * into the finished photograph. WebGL, scroll-driven, paused off-screen; reduced motion
 * or no WebGL keeps the still photo. */
import { reduced } from './core.js';

const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const FS = `precision mediump float;
varying vec2 v; uniform sampler2D tex; uniform vec2 res, ir; uniform float pr, time; uniform vec3 bg;
vec2 cover(vec2 u){ float ra=res.x/res.y, ia=ir.x/ir.y; vec2 s=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.); return (u-.5)*s+.5; }
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*ns(p);p*=2.03;a*=.5;}return s;}
float L(vec2 u){vec3 c=texture2D(tex,u).rgb;return dot(c,vec3(.299,.587,.114));}
void main(){
  vec2 U=vec2(v.x,1.-v.y);
  float z=1.08-.08*pr;
  vec2 u=cover((U-.5)*z+.5);
  vec2 px=1.2/res;
  float gx=L(u+vec2(px.x,0.))-L(u-vec2(px.x,0.)), gy=L(u+vec2(0.,px.y))-L(u-vec2(0.,px.y));
  float gx2=L(u+vec2(px.x,px.y)*2.)-L(u-vec2(px.x,px.y)*2.);
  float e=smoothstep(.10,.30,length(vec2(gx,gy))+abs(gx2)*.35);
  float grain=(fbm(U*6.)-.5)*.05;
  vec3 ink=vec3(.94,.84,.62);
  vec3 sketch=mix(bg*1.1+grain, ink, e*.7);
  vec3 photo=texture2D(tex,u).rgb;
  photo=mix(photo, bg, .38)*.56; photo*=1.-.42*smoothstep(.42,0.,abs(U.y-.48));
  vec2 w=U*vec2(res.x/res.y,1.)*1.6;
  w+=vec2(fbm(w+time*.04),fbm(w+5.2-time*.03))*1.4;
  float n=fbm(w*1.3)*.75+(1.-length(U-vec2(.5,.55)))*.35;
  float th=mix(-.1,1.25,smoothstep(.12,.82,pr));
  float k=smoothstep(n-.05,n+.05,th);
  float edge=smoothstep(.09,0.,abs(th-n))*(1.-step(.999,k))*step(.001,th);
  vec3 col=mix(sketch,photo,k)+ink*edge*.35;
  gl_FragColor=vec4(col,1.);
}`;

function hexRGB(h) { const m = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255); }

export function initSceneInk() {
  const scene = document.querySelector('[data-scene]');
  if (!scene || reduced) return;
  const fig = scene.querySelector('.scene__media'); const img = fig?.querySelector('img');
  if (!img) return;
  const cv = document.createElement('canvas'); cv.className = 'scene__ink';
  const g = cv.getContext('webgl', { antialias: false, powerPreference: 'low-power' });
  if (!g) return;
  const sh = (t, s) => { const o = g.createShader(t); g.shaderSource(o, s); g.compileShader(o); return o; };
  const pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr);
  if (!g.getProgramParameter(pr, g.LINK_STATUS)) return;
  g.useProgram(pr);
  const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
  const U = {}; ['tex', 'res', 'ir', 'pr', 'time', 'bg'].forEach((k) => (U[k] = g.getUniformLocation(pr, k)));
  g.uniform3fv(U.bg, hexRGB(scene.dataset.flood || '#67223c'));
  const small = matchMedia('(max-width: 760px)').matches, dpr = Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5);
  const src = new Image(); src.decoding = 'async'; src.src = img.currentSrc || img.src;
  let ready = false, vis = false, raf = 0, last = 0; const t0 = performance.now();
  const size = () => { cv.width = Math.round(fig.clientWidth * dpr); cv.height = Math.round(fig.clientHeight * dpr); g.viewport(0, 0, cv.width, cv.height); g.uniform2f(U.res, cv.width, cv.height); };
  const draw = (now) => {
    raf = 0; if (!vis || !ready) return;
    raf = requestAnimationFrame(draw);
    if (small && now - last < 32) return; last = now;
    const p = parseFloat(getComputedStyle(scene).getPropertyValue('--p')) || 0;
    g.uniform1f(U.pr, p); g.uniform1f(U.time, (now - t0) / 1000);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  };
  src.onload = () => {
    const t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, src);
    g.uniform1i(U.tex, 0); g.uniform2f(U.ir, src.naturalWidth, src.naturalHeight);
    fig.appendChild(cv); size(); ready = true; fig.classList.add('has-ink');
    if (vis && !raf) raf = requestAnimationFrame(draw);
  };
  addEventListener('resize', () => { if (ready) size(); });
  new IntersectionObserver(([en]) => { vis = en.isIntersecting; if (vis && ready && !raf) raf = requestAnimationFrame(draw); }, { rootMargin: '200px 0px' }).observe(scene);
}
