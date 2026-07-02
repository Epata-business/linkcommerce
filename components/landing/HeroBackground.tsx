'use client';
import { useEffect, useRef } from 'react';

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;

// ── Simplex 2D noise ──────────────────────────────────────────────────────────
vec3 permute3(vec3 x){ return mod((x*34.0+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute3(permute3(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)), 0.0);
  m = m*m*m*m;
  vec3 x2 = 2.0*fract(p*C.www)-1.0;
  vec3 h = abs(x2)-0.5;
  vec3 ox = floor(x2+0.5);
  vec3 a0 = x2-ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x  = a0.x*x0.x + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float fbm(vec2 p, int oct){
  float v=0.0, a=0.5;
  for(int i=0;i<6;i++){
    if(i>=oct) break;
    v += a*snoise(p); p*=2.1; a*=0.5;
  }
  return v;
}

// ── Brand palette ─────────────────────────────────────────────────────────────
#define BG      vec3(0.031,0.039,0.071)   // #080A12
#define BLUE    vec3(0.082,0.239,0.988)   // #153DFC
#define VIOLET  vec3(0.514,0.506,0.980)   // #8381FB
#define NIGHT   vec3(0.008,0.020,0.239)   // #02053D

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  // aspect-correct centered coords
  vec2 st = (gl_FragCoord.xy - u_res*0.5) / u_res.y;

  float T = u_time * 0.18;

  // ── Background gradient ────────────────────────────────────────────────────
  vec3 col = mix(BG, NIGHT, smoothstep(0.0, 1.0, uv.y * 0.7));

  // ── Aurora ribbon 1 — blue ─────────────────────────────────────────────────
  float n1  = fbm(vec2(uv.x * 1.8 + T * 0.4, T * 0.25), 4);
  float y1  = 0.62 + n1 * 0.12;
  float rng1 = 0.08 + 0.04 * snoise(vec2(uv.x * 2.5, T));
  float a1  = exp(-pow((uv.y - y1) / rng1, 2.0));
  col += BLUE * a1 * (0.55 + 0.25 * n1);

  // ── Aurora ribbon 2 — violet ───────────────────────────────────────────────
  float n2  = fbm(vec2(uv.x * 2.3 - T * 0.3, T * 0.18 + 1.7), 4);
  float y2  = 0.50 + n2 * 0.10;
  float rng2 = 0.06 + 0.03 * snoise(vec2(uv.x * 3.1, T + 5.0));
  float a2  = exp(-pow((uv.y - y2) / rng2, 2.0));
  col += VIOLET * a2 * (0.40 + 0.20 * n2);

  // ── Faint third ribbon — deep blue ────────────────────────────────────────
  float n3  = fbm(vec2(uv.x * 1.4 + T * 0.2, T * 0.12 + 3.3), 3);
  float y3  = 0.72 + n3 * 0.08;
  float a3  = exp(-pow((uv.y - y3) / 0.12, 2.0));
  col += mix(BLUE, NIGHT, 0.5) * a3 * 0.28;

  // ── Radial core glow ──────────────────────────────────────────────────────
  float glow = exp(-length(st - vec2(0.0, -0.12)) * 3.5);
  col += NIGHT * glow * 0.7;
  float glowB = exp(-length(st - vec2(0.0, 0.0)) * 5.0);
  col += BLUE * glowB * 0.12;

  // ── Stars ─────────────────────────────────────────────────────────────────
  vec2 grid = floor(uv * 120.0);
  float h = fract(sin(dot(grid, vec2(127.1, 311.7))) * 43758.5453);
  float twinkle = sin(u_time * (1.5 + h * 3.0) + h * 6.28) * 0.5 + 0.5;
  float starAlpha = smoothstep(0.88, 1.0, h) * twinkle * (0.3 + 0.5 * (1.0 - uv.y));
  vec2 cellUv = fract(uv * 120.0) - 0.5;
  float starDot = smoothstep(0.06, 0.0, length(cellUv));
  col += vec3(0.65, 0.72, 1.0) * starDot * starAlpha;

  // ── Vignette ──────────────────────────────────────────────────────────────
  float vig = smoothstep(0.85, 0.2, length(st * vec2(0.8, 1.0)));
  col *= 0.55 + 0.45 * vig;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false })!;
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes  = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    let raf = 0;
    const resize = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}
