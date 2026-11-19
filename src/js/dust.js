/* Gold dust: slow WebGL motes drifting over the page. They rise unhurriedly, sway on a
 * soft noise field, lean gently with scroll and part softly around the pointer.
 * Few particles on phones, DPR capped, paused when hidden; off for reduced motion. */
import { reduced } from './core.js';

const VS = `
attribute vec4 a; // x, y, size, seed
uniform float t, sc, asp; uniform vec2 m; uniform float mo;
varying float vA;
void main(){
  float s=a.w;
  float y=fract(a.y + t*(0.006+0.01*s) + sc*0.00008*(0.5+s));
  float x=a.x + sin(t*0.18*(0.6+s)+s*40.)*0.03 + sin(t*0.07+s*9.)*0.02;
  vec2 p=vec2(x, y)*2.-1.;
  vec2 d=p-m; d.x*=asp; float r=length(d);
  p+=normalize(d+1e-4)*mo*0.06*smoothstep(0.35,0.,r)/vec2(asp,1.);
  gl_Position=vec4(p.x,-p.y,0.,1.);
  gl_PointSize=a.z;
  vA=(0.35+0.65*fract(s*7.3))*(0.55+0.45*sin(t*(0.4+s)+s*20.))*smoothstep(0.,0.15,y)*smoothstep(1.,0.85,y);
}`;
const FS = `
precision mediump float; varying float vA; uniform vec3 c;
void main(){ vec2 q=gl_PointCoord-.5; float d=length(q); float g=smoothstep(.5,0.,d); g*=g; gl_FragColor=vec4(c*g*vA, g*vA); }`;

export function initDust() {
  if (reduced) return;
  const cv = document.createElement('canvas');
  cv.className = 'dust'; cv.setAttribute('aria-hidden', 'true');
  const g = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!g) return;
  document.body.appendChild(cv);
  const sh = (type, src) => { const s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); return s; };
  const pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr);
  if (!g.getProgramParameter(pr, g.LINK_STATUS)) { cv.remove(); return; }
  g.useProgram(pr);
  const small = matchMedia('(max-width: 760px)').matches;
  const N = small ? 70 : 150, dpr = Math.min(devicePixelRatio || 1, 1.5);
  const data = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { const s = Math.random(); data.set([Math.random(), Math.random(), (2 + Math.pow(Math.random(), 3) * 7) * dpr, s], i * 4); }
  const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, data, g.STATIC_DRAW);
  const loc = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 4, g.FLOAT, false, 0, 0);
  const U = {}; ['t', 'sc', 'asp', 'm', 'mo', 'c'].forEach((k) => (U[k] = g.getUniformLocation(pr, k)));
  g.uniform3f(U.c, 1.0, 0.88, 0.62);
  g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
  const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; g.viewport(0, 0, cv.width, cv.height); g.uniform1f(U.asp, innerWidth / innerHeight); };
  size(); addEventListener('resize', size);
  let mx = 0, my = 0, tx = 0, ty = 0, mo = 0, moT = 0, sc = scrollY, scS = scrollY;
  addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; moT = 1; }, { passive: true });
  const t0 = performance.now(); let raf = 0, last = t0;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (small && now - last < 32) return; // ~30fps on phones is plenty for slow dust
    last = now;
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04; mo += (moT - mo) * 0.03; moT *= 0.985;
    sc = scrollY; scS += (sc - scS) * 0.05;
    g.clear(g.COLOR_BUFFER_BIT);
    g.uniform1f(U.t, (now - t0) / 1000); g.uniform1f(U.sc, scS); g.uniform2f(U.m, mx, my); g.uniform1f(U.mo, mo);
    g.drawArrays(g.POINTS, 0, N);
  };
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(frame); });
}
