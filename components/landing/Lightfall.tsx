'use client';
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const MAX_COLORS = 8;
const hexToRGB = (hex: string) => {
  const c = hex.replace('#','').padEnd(6,'0');
  return [parseInt(c.slice(0,2),16)/255, parseInt(c.slice(2,4),16)/255, parseInt(c.slice(4,6),16)/255];
};
const prepColors = (input: string[]) => {
  const base = (input?.length ? input : ['#153DFC','#8381FB']).slice(0,MAX_COLORS);
  const arr: number[][] = [];
  for (let i=0;i<MAX_COLORS;i++) arr.push(hexToRGB(base[Math.min(i,base.length-1)]));
  const avg = [0,0,0]; for (let i=0;i<base.length;i++){avg[0]+=arr[i][0];avg[1]+=arr[i][1];avg[2]+=arr[i][2];} avg[0]/=base.length;avg[1]/=base.length;avg[2]/=base.length;
  return { arr, count: base.length, avg };
};

const vertex = `attribute vec2 position;void main(){gl_Position=vec4(position,0,1);}`;
const fragment = `precision highp float;
uniform vec3 iResolution;uniform vec2 iMouse;uniform float iTime;
uniform vec3 uColor0,uColor1,uColor2,uColor3,uColor4,uColor5,uColor6,uColor7;uniform int uColorCount;
uniform vec3 uBgColor,uMouseColor;uniform float uSpeed;uniform int uStreakCount;
uniform float uStreakWidth,uStreakLength,uGlow,uDensity,uTwinkle,uZoom,uBgGlow,uOpacity,uMouseEnabled,uMouseStrength,uMouseRadius;
vec3 palette(float h){int n=max(uColorCount,1);int i=int(floor(clamp(h,0.0,0.9999)*float(n)));if(i<=0)return uColor0;if(i==1)return uColor1;if(i==2)return uColor2;if(i==3)return uColor3;if(i==4)return uColor4;if(i==5)return uColor5;if(i==6)return uColor6;return uColor7;}
vec3 tanhv(vec3 x){vec3 e=exp(-2.0*x);return(1.0-e)/(1.0+e);}
vec2 sceneC(vec2 frag,vec2 r){vec2 P=(frag+frag-r)/r.x;float z=0.0,d=1e3;vec4 O=vec4(0);for(int k=0;k<39;k++){if(d<=1e-4)break;O=z*normalize(vec4(P,uZoom,0))-vec4(0,4,1,0)/4.5;d=1.0-sqrt(length(O*O));z+=d;}return vec2(O.x,atan(O.z,O.y));}
void mainImage(out vec4 o,vec2 C){vec2 r=iResolution.xy;vec2 uv0=(C+C-r)/r.x;float T=0.1*iTime*uSpeed+9.0;float angRings=max(1.0,floor(6.28318*max(uDensity,0.05)+0.5));vec2 Y=vec2(5e-3,6.28318/angRings);vec2 c0=sceneC(C,r),cdx=sceneC(C+vec2(1,0),r),cdy=sceneC(C+vec2(0,1),r);vec2 dCx=cdx-c0,dCy=cdy-c0;dCx.y-=6.28318*floor(dCx.y/6.28318+0.5);dCy.y-=6.28318*floor(dCy.y/6.28318+0.5);vec2 fw=abs(dCx)+abs(dCy);C=c0;vec2 P=vec2(2,1)*uv0-(r/r.x)*vec2(0,1);vec4 O=vec4(uBgColor*90.0*uBgGlow/(1e3*dot(P,P)+6.0),0);float mGlow=0.0;if(uMouseEnabled>0.5){vec2 mN=(iMouse+iMouse-r)/r.x;float md=length(uv0-mN);mGlow=exp(-md*md/max(uMouseRadius*uMouseRadius,1e-4))*uMouseStrength;O.rgb+=uMouseColor*mGlow*0.25;}float zr=5e-4*uStreakWidth;vec2 rr=vec2(max(length(fw),1e-5));float tail=19.0/max(uStreakLength,0.05);for(int m=0;m<16;m++){if(m>=uStreakCount)break;float jf=float(m)+1.0;float ic=fract(sin(dot(vec2(jf,floor(C.x/Y.x+0.5)),vec2(7,11))*73.0));vec2 Pp=C-(T+T*ic)*vec2(0,1);Pp-=floor(Pp/Y+0.5)*Y;float h=fract(8663.0*ic);vec3 col=palette(h);float weight=mix(1.5,1.0+sin(T+7.0*h+4.0),uTwinkle)*(1.0+mGlow*2.0);vec2 inner=vec2(length(max(Pp,vec2(-1,0))),length(Pp)-zr)-zr;vec2 sm=vec2(1)-smoothstep(-rr,rr,inner);O.rgb+=dot(sm,vec2(exp(tail*Pp.y),3.0))*col*weight;C.x+=Y.x/8.0;}vec3 colr=sqrt(tanhv(max(O.rgb*uGlow,vec3(0))));o=vec4(colr,uOpacity);}
void main(){vec4 c;mainImage(c,gl_FragCoord.xy);gl_FragColor=c;}`;

interface LightfallProps {
  colors?: string[];
  backgroundColor?: string;
  speed?: number;
  streakCount?: number;
  streakWidth?: number;
  streakLength?: number;
  glow?: number;
  density?: number;
  twinkle?: number;
  zoom?: number;
  backgroundGlow?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  mouseDampening?: number;
  mixBlendMode?: string;
  className?: string;
}

export default function Lightfall({
  colors = ['#153DFC','#8381FB','#02053D'],
  backgroundColor = '#02053D',
  speed = 0.6,
  streakCount = 3,
  streakWidth = 1,
  streakLength = 1.2,
  glow = 0.8,
  density = 0.5,
  twinkle = 0.8,
  zoom = 3,
  backgroundGlow = 0.4,
  opacity = 1,
  mouseInteraction = true,
  mouseStrength = 0.4,
  mouseRadius = 0.8,
  mouseDampening = 0.15,
  mixBlendMode,
  className = '',
}: LightfallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const mouseTargetRef = useRef([0,0]);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ dpr: window.devicePixelRatio||1, alpha:true, antialias:true });
    const gl = (renderer as any).gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.appendChild(canvas);

    const { arr, count, avg } = prepColors(colors);
    const uniforms: any = {
      iResolution:{ value:[gl.drawingBufferWidth,gl.drawingBufferHeight,1] },
      iMouse:{ value:[0,0] }, iTime:{ value:0 },
      uColor0:{value:arr[0]},uColor1:{value:arr[1]},uColor2:{value:arr[2]},uColor3:{value:arr[3]},
      uColor4:{value:arr[4]},uColor5:{value:arr[5]},uColor6:{value:arr[6]},uColor7:{value:arr[7]},
      uColorCount:{value:count},uBgColor:{value:hexToRGB(backgroundColor)},uMouseColor:{value:avg},
      uSpeed:{value:speed},uStreakCount:{value:Math.max(1,Math.min(16,Math.round(streakCount)))},
      uStreakWidth:{value:streakWidth},uStreakLength:{value:streakLength},uGlow:{value:glow},
      uDensity:{value:density},uTwinkle:{value:twinkle},uZoom:{value:zoom},uBgGlow:{value:backgroundGlow},
      uOpacity:{value:opacity},uMouseEnabled:{value:mouseInteraction?1:0},
      uMouseStrength:{value:mouseStrength},uMouseRadius:{value:mouseRadius},
    };

    const program = new Program(gl, { vertex, fragment, uniforms });
    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      (renderer as any).setSize(rect.width, rect.height);
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = (renderer as any).dpr || 1;
      mouseTargetRef.current = [(e.clientX-rect.left)*dpr, (rect.height-(e.clientY-rect.top))*dpr];
      if (mouseDampening <= 0) uniforms.iMouse.value = [...mouseTargetRef.current];
    };
    if (mouseInteraction) canvas.addEventListener('pointermove', onPointerMove);

    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      uniforms.iTime.value = t * 0.001;
      if (mouseDampening > 0) {
        if (!lastTimeRef.current) lastTimeRef.current = t;
        const dt = (t - lastTimeRef.current) / 1000; lastTimeRef.current = t;
        const f = Math.min(1, 1 - Math.exp(-dt / Math.max(1e-4, mouseDampening)));
        const cur = uniforms.iMouse.value; const tgt = mouseTargetRef.current;
        cur[0] += (tgt[0]-cur[0])*f; cur[1] += (tgt[1]-cur[1])*f;
      } else { lastTimeRef.current = t; }
      try { (renderer as any).render({ scene: mesh }); } catch {}
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (mouseInteraction) canvas.removeEventListener('pointermove', onPointerMove);
      ro.disconnect();
      if (canvas.parentElement === container) container.removeChild(canvas);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
      style={{ ...(mixBlendMode ? { mixBlendMode: mixBlendMode as any } : {}) }} />
  );
}
