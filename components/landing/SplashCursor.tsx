'use client';
import { useEffect, useRef } from 'react';

interface Props {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  PRESSURE_ITERATIONS?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  SHADING?: boolean;
  COLOR_UPDATE_SPEED?: number;
  RAINBOW_MODE?: boolean;
  COLOR?: string;
  BACK_COLOR?: { r: number; g: number; b: number };
  TRANSPARENT?: boolean;
}

export default function SplashCursor({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1440,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 2,
  PRESSURE = 0.1,
  PRESSURE_ITERATIONS = 20,
  CURL = 3,
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 0, g: 0, b: 0 },
  TRANSPARENT = true,
  RAINBOW_MODE = false,
  COLOR = '#153DFC',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let isActive = true;

    function pointerPrototype(this: any) {
      this.id = -1; this.texcoordX = 0; this.texcoordY = 0;
      this.prevTexcoordX = 0; this.prevTexcoordY = 0;
      this.deltaX = 0; this.deltaY = 0;
      this.down = false; this.moved = false; this.color = [0,0,0];
    }

    const config = {
      SIM_RESOLUTION, DYE_RESOLUTION, CAPTURE_RESOLUTION: 512,
      DENSITY_DISSIPATION, VELOCITY_DISSIPATION, PRESSURE, PRESSURE_ITERATIONS,
      CURL, SPLAT_RADIUS, SPLAT_FORCE, SHADING, COLOR_UPDATE_SPEED,
      PAUSED: false, BACK_COLOR, TRANSPARENT, RAINBOW_MODE, COLOR,
    };

    const pointers: any[] = [new (pointerPrototype as any)()];

    function getWebGLContext(c: HTMLCanvasElement) {
      const params = { alpha:true, depth:false, stencil:false, antialias:false, preserveDrawingBuffer:false };
      let gl: any = c.getContext('webgl2', params);
      const isWebGL2 = !!gl;
      if (!isWebGL2) gl = c.getContext('webgl', params) || c.getContext('experimental-webgl', params);
      let halfFloat: any, supportLinearFiltering: any;
      if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
      } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
      }
      gl.clearColor(0,0,0,1);
      const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat?.HALF_FLOAT_OES;
      function getSupportedFormat(gl: any, internalFormat: any, format: any, type: any): any {
        if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
          if (internalFormat === gl.R16F) return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
          if (internalFormat === gl.RG16F) return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
          return null;
        }
        return { internalFormat, format };
      }
      function supportRenderTextureFormat(gl: any, internalFormat: any, format: any, type: any) {
        const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
        const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      }
      const formatRGBA = isWebGL2 ? getSupportedFormat(gl,gl.RGBA16F,gl.RGBA,halfFloatTexType) : getSupportedFormat(gl,gl.RGBA,gl.RGBA,halfFloatTexType);
      const formatRG   = isWebGL2 ? getSupportedFormat(gl,gl.RG16F,gl.RG,halfFloatTexType)     : getSupportedFormat(gl,gl.RGBA,gl.RGBA,halfFloatTexType);
      const formatR    = isWebGL2 ? getSupportedFormat(gl,gl.R16F,gl.RED,halfFloatTexType)      : getSupportedFormat(gl,gl.RGBA,gl.RGBA,halfFloatTexType);
      return { gl, ext: { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering } };
    }

    const { gl, ext } = getWebGLContext(canvas);
    if (!ext.supportLinearFiltering) { config.DYE_RESOLUTION = 256; config.SHADING = false; }

    function compileShader(type: number, source: string, keywords?: string[]) {
      if (keywords) source = keywords.map(k=>`#define ${k}\n`).join('') + source;
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      return shader;
    }
    function createProgram(vs: any, fs: any) {
      const p = gl.createProgram();
      gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
      return p;
    }
    function getUniforms(program: any) {
      const u: any = {};
      const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i=0;i<n;i++) { const name = gl.getActiveUniform(program,i).name; u[name]=gl.getUniformLocation(program,name); }
      return u;
    }

    class Program { uniforms: any; program: any;
      constructor(vs: any, fs: any) { this.program = createProgram(vs,fs); this.uniforms = getUniforms(this.program); }
      bind() { gl.useProgram(this.program); }
    }
    class Material { vertexShader: any; fragmentShaderSource: string; programs: any[]; activeProgram: any; uniforms: any;
      constructor(vs: any, fss: string) { this.vertexShader=vs; this.fragmentShaderSource=fss; this.programs=[]; this.activeProgram=null; this.uniforms=[]; }
      setKeywords(kw: string[]) {
        let hash = 0; for (const k of kw) { for (let i=0;i<k.length;i++) { hash=(hash<<5)-hash+k.charCodeAt(i); hash|=0; } }
        let p = this.programs[hash];
        if (!p) { const fs=compileShader(gl.FRAGMENT_SHADER,this.fragmentShaderSource,kw); p=createProgram(this.vertexShader,fs); this.programs[hash]=p; }
        if (p===this.activeProgram) return;
        this.uniforms = getUniforms(p); this.activeProgram = p;
      }
      bind() { gl.useProgram(this.activeProgram); }
    }

    const baseVS = compileShader(gl.VERTEX_SHADER,`precision highp float;attribute vec2 aPosition;varying vec2 vUv,vL,vR,vT,vB;uniform vec2 texelSize;void main(){vUv=aPosition*0.5+0.5;vL=vUv-vec2(texelSize.x,0);vR=vUv+vec2(texelSize.x,0);vT=vUv+vec2(0,texelSize.y);vB=vUv-vec2(0,texelSize.y);gl_Position=vec4(aPosition,0,1);}`);
    const copyFS = compileShader(gl.FRAGMENT_SHADER,`precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;void main(){gl_FragColor=texture2D(uTexture,vUv);}`);
    const clearFS = compileShader(gl.FRAGMENT_SHADER,`precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}`);
    const displaySrc=`precision highp float;precision highp sampler2D;varying vec2 vUv,vL,vR,vT,vB;uniform sampler2D uTexture,uDithering;uniform vec2 ditherScale,texelSize;vec3 linearToGamma(vec3 c){c=max(c,vec3(0));return max(1.055*pow(c,vec3(0.4167))-0.055,vec3(0));}void main(){vec3 c=texture2D(uTexture,vUv).rgb;#ifdef SHADING vec3 lc=texture2D(uTexture,vL).rgb,rc=texture2D(uTexture,vR).rgb,tc=texture2D(uTexture,vT).rgb,bc=texture2D(uTexture,vB).rgb;float dx=length(rc)-length(lc),dy=length(tc)-length(bc);vec3 n=normalize(vec3(dx,dy,length(texelSize))),l=vec3(0,0,1);float diffuse=clamp(dot(n,l)+0.7,0.7,1.0);c*=diffuse;#endif float a=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c,a);}`;
    const splatFS = compileShader(gl.FRAGMENT_SHADER,`precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;void main(){vec2 p=vUv-point.xy;p.x*=aspectRatio;vec3 splat=exp(-dot(p,p)/radius)*color;vec3 base=texture2D(uTarget,vUv).xyz;gl_FragColor=vec4(base+splat,1);}`);
    const advFS = compileShader(gl.FRAGMENT_SHADER,`precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uVelocity,uSource;uniform vec2 texelSize,dyeTexelSize;uniform float dt,dissipation;vec4 bilerp(sampler2D s,vec2 uv,vec2 t){vec2 st=uv/t-0.5;vec2 i=floor(st),f=fract(st);vec4 a=texture2D(s,(i+vec2(0.5,0.5))*t),b=texture2D(s,(i+vec2(1.5,0.5))*t),c=texture2D(s,(i+vec2(0.5,1.5))*t),d=texture2D(s,(i+vec2(1.5,1.5))*t);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}void main(){#ifdef MANUAL_FILTERING vec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;vec4 result=bilerp(uSource,coord,dyeTexelSize);#else vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;vec4 result=texture2D(uSource,coord);#endif float decay=1.0+dissipation*dt;gl_FragColor=result/decay;}`, ext.supportLinearFiltering?undefined:['MANUAL_FILTERING']);
    const divFS = compileShader(gl.FRAGMENT_SHADER,`precision mediump float;precision mediump sampler2D;varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).x,R=texture2D(uVelocity,vR).x,T=texture2D(uVelocity,vT).y,B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;if(vL.x<0.0)L=-C.x;if(vR.x>1.0)R=-C.x;if(vT.y>1.0)T=-C.y;if(vB.y<0.0)B=-C.y;gl_FragColor=vec4(0.5*(R-L+T-B),0,0,1);}`);
    const curlFS = compileShader(gl.FRAGMENT_SHADER,`precision mediump float;precision mediump sampler2D;varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).y,R=texture2D(uVelocity,vR).y,T=texture2D(uVelocity,vT).x,B=texture2D(uVelocity,vB).x;gl_FragColor=vec4(0.5*(R-L-T+B),0,0,1);}`);
    const vortFS = compileShader(gl.FRAGMENT_SHADER,`precision highp float;precision highp sampler2D;varying vec2 vUv,vL,vR,vT,vB;uniform sampler2D uVelocity,uCurl;uniform float curl,dt;void main(){float L=texture2D(uCurl,vL).x,R=texture2D(uCurl,vR).x,T=texture2D(uCurl,vT).x,B=texture2D(uCurl,vB).x,C=texture2D(uCurl,vUv).x;vec2 force=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));force/=length(force)+0.0001;force*=curl*C;force.y*=-1.0;vec2 vel=texture2D(uVelocity,vUv).xy+force*dt;vel=min(max(vel,-1000.0),1000.0);gl_FragColor=vec4(vel,0,1);}`);
    const pressFS = compileShader(gl.FRAGMENT_SHADER,`precision mediump float;precision mediump sampler2D;varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uPressure,uDivergence;void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;float div=texture2D(uDivergence,vUv).x;gl_FragColor=vec4((L+R+B+T-div)*0.25,0,0,1);}`);
    const gradFS = compileShader(gl.FRAGMENT_SHADER,`precision mediump float;precision mediump sampler2D;varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uPressure,uVelocity;void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;vec2 vel=texture2D(uVelocity,vUv).xy;vel.xy-=vec2(R-L,T-B);gl_FragColor=vec4(vel,0,1);}`);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const blit = (target: any, clear=false) => {
      if (target==null) { gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER,null); }
      else { gl.viewport(0,0,target.width,target.height); gl.bindFramebuffer(gl.FRAMEBUFFER,target.fbo); }
      if (clear) { gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT); }
      gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
    };

    function getRes(r: number) {
      let ar = gl.drawingBufferWidth/gl.drawingBufferHeight;
      if (ar<1) ar=1/ar;
      const min=Math.round(r), max=Math.round(r*ar);
      return gl.drawingBufferWidth>gl.drawingBufferHeight ? {width:max,height:min} : {width:min,height:max};
    }
    function createFBO(w: number, h: number, iF: any, f: any, t: any, param: any) {
      gl.activeTexture(gl.TEXTURE0);
      const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,param); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,param);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,iF,w,h,0,f,t,null);
      const fbo=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
      gl.viewport(0,0,w,h); gl.clear(gl.COLOR_BUFFER_BIT);
      return { texture:tex, fbo, width:w, height:h, texelSizeX:1/w, texelSizeY:1/h, attach(id: number){ gl.activeTexture(gl.TEXTURE0+id); gl.bindTexture(gl.TEXTURE_2D,tex); return id; } };
    }
    function createDoubleFBO(w: number, h: number, iF: any, f: any, t: any, param: any) {
      let a=createFBO(w,h,iF,f,t,param), b=createFBO(w,h,iF,f,t,param);
      return { width:w, height:h, texelSizeX:a.texelSizeX, texelSizeY:a.texelSizeY, get read(){return a}, set read(v){a=v}, get write(){return b}, set write(v){b=v}, swap(){ const tmp=a;a=b;b=tmp; } };
    }
    function resizeFBO(target: any, w: number, h: number, iF: any, f: any, t: any, param: any) {
      const n=createFBO(w,h,iF,f,t,param); copyProgram.bind();
      gl.uniform1i(copyProgram.uniforms.uTexture,target.attach(0)); blit(n); return n;
    }
    function resizeDoubleFBO(target: any, w: number, h: number, iF: any, f: any, t: any, param: any) {
      if (target.width===w&&target.height===h) return target;
      target.read=resizeFBO(target.read,w,h,iF,f,t,param); target.write=createFBO(w,h,iF,f,t,param);
      target.width=w; target.height=h; target.texelSizeX=1/w; target.texelSizeY=1/h; return target;
    }

    const copyProgram    = new Program(baseVS, copyFS);
    const clearProgram   = new Program(baseVS, clearFS);
    const splatProgram   = new Program(baseVS, splatFS);
    const advProgram     = new Program(baseVS, advFS);
    const divProgram     = new Program(baseVS, divFS);
    const curlProgram    = new Program(baseVS, curlFS);
    const vortProgram    = new Program(baseVS, vortFS);
    const pressProgram   = new Program(baseVS, pressFS);
    const gradProgram    = new Program(baseVS, gradFS);
    const displayMat     = new Material(baseVS, displaySrc);

    let dye: any, velocity: any, divergence: any, curlFBO: any, pressure: any;
    function initFBOs() {
      const simRes=getRes(config.SIM_RESOLUTION), dyeRes=getRes(config.DYE_RESOLUTION);
      const tt=ext.halfFloatTexType, rgba=ext.formatRGBA, rg=ext.formatRG, r=ext.formatR;
      const filtering=ext.supportLinearFiltering?gl.LINEAR:gl.NEAREST;
      gl.disable(gl.BLEND);
      dye      = dye      ? resizeDoubleFBO(dye,      dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, tt, filtering) : createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, tt, filtering);
      velocity = velocity ? resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat,   rg.format,   tt, filtering) : createDoubleFBO(simRes.width, simRes.height, rg.internalFormat,   rg.format,   tt, filtering);
      divergence = createFBO(simRes.width,simRes.height,r.internalFormat,r.format,tt,gl.NEAREST);
      curlFBO    = createFBO(simRes.width,simRes.height,r.internalFormat,r.format,tt,gl.NEAREST);
      pressure   = createDoubleFBO(simRes.width,simRes.height,r.internalFormat,r.format,tt,gl.NEAREST);
    }

    function updateKeywords() { const kw: string[]=[]; if (config.SHADING) kw.push('SHADING'); displayMat.setKeywords(kw); }
    updateKeywords(); initFBOs();

    let lastTime=Date.now(), colorTimer=0;
    function scaleByPR(n: number){ return Math.floor(n*(window.devicePixelRatio||1)); }
    function resizeCanvas(){ const w=scaleByPR(canvas.clientWidth),h=scaleByPR(canvas.clientHeight); if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;return true;}return false; }
    function hexToRGB(hex: string){ const v=hex.replace('#',''); return { r:parseInt(v.slice(0,2),16)/255*0.15, g:parseInt(v.slice(2,4),16)/255*0.15, b:parseInt(v.slice(4,6),16)/255*0.15 }; }
    function HSVtoRGB(h: number,s: number,v: number){ let r=0,g=0,b=0; const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s); switch(i%6){case 0:r=v;g=t;b=p;break;case 1:r=q;g=v;b=p;break;case 2:r=p;g=v;b=t;break;case 3:r=p;g=q;b=v;break;case 4:r=t;g=p;b=v;break;case 5:r=v;g=p;b=q;break;} return {r,g,b}; }
    function generateColor(){ if(!config.RAINBOW_MODE) return hexToRGB(config.COLOR); const c=HSVtoRGB(Math.random(),1,1); return {r:c.r*0.15,g:c.g*0.15,b:c.b*0.15}; }
    function correctRadius(radius: number){ const ar=canvas.width/canvas.height; if(ar>1) radius*=ar; return radius; }
    function correctDeltaX(d: number){ const ar=canvas.width/canvas.height; if(ar<1) d*=ar; return d; }
    function correctDeltaY(d: number){ const ar=canvas.width/canvas.height; if(ar>1) d/=ar; return d; }

    function splat(x: number,y: number,dx: number,dy: number,color: any){
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget,velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio,canvas.width/canvas.height);
      gl.uniform2f(splatProgram.uniforms.point,x,y);
      gl.uniform3f(splatProgram.uniforms.color,dx,dy,0);
      gl.uniform1f(splatProgram.uniforms.radius,correctRadius(config.SPLAT_RADIUS/100));
      blit(velocity.write); velocity.swap();
      gl.uniform1i(splatProgram.uniforms.uTarget,dye.read.attach(0));
      gl.uniform3f(splatProgram.uniforms.color,color.r,color.g,color.b);
      blit(dye.write); dye.swap();
    }
    function splatPointer(p: any){ splat(p.texcoordX,p.texcoordY,p.deltaX*config.SPLAT_FORCE,p.deltaY*config.SPLAT_FORCE,p.color); }
    function clickSplat(p: any){ const c=generateColor(); c.r*=10;c.g*=10;c.b*=10; splat(p.texcoordX,p.texcoordY,10*(Math.random()-0.5),30*(Math.random()-0.5),c); }

    function step(dt: number){
      gl.disable(gl.BLEND);
      curlProgram.bind(); gl.uniform2f(curlProgram.uniforms.texelSize,velocity.texelSizeX,velocity.texelSizeY); gl.uniform1i(curlProgram.uniforms.uVelocity,velocity.read.attach(0)); blit(curlFBO);
      vortProgram.bind(); gl.uniform2f(vortProgram.uniforms.texelSize,velocity.texelSizeX,velocity.texelSizeY); gl.uniform1i(vortProgram.uniforms.uVelocity,velocity.read.attach(0)); gl.uniform1i(vortProgram.uniforms.uCurl,curlFBO.attach(1)); gl.uniform1f(vortProgram.uniforms.curl,config.CURL); gl.uniform1f(vortProgram.uniforms.dt,dt); blit(velocity.write); velocity.swap();
      divProgram.bind(); gl.uniform2f(divProgram.uniforms.texelSize,velocity.texelSizeX,velocity.texelSizeY); gl.uniform1i(divProgram.uniforms.uVelocity,velocity.read.attach(0)); blit(divergence);
      clearProgram.bind(); gl.uniform1i(clearProgram.uniforms.uTexture,pressure.read.attach(0)); gl.uniform1f(clearProgram.uniforms.value,config.PRESSURE); blit(pressure.write); pressure.swap();
      pressProgram.bind(); gl.uniform2f(pressProgram.uniforms.texelSize,velocity.texelSizeX,velocity.texelSizeY); gl.uniform1i(pressProgram.uniforms.uDivergence,divergence.attach(0));
      for(let i=0;i<config.PRESSURE_ITERATIONS;i++){ gl.uniform1i(pressProgram.uniforms.uPressure,pressure.read.attach(1)); blit(pressure.write); pressure.swap(); }
      gradProgram.bind(); gl.uniform2f(gradProgram.uniforms.texelSize,velocity.texelSizeX,velocity.texelSizeY); gl.uniform1i(gradProgram.uniforms.uPressure,pressure.read.attach(0)); gl.uniform1i(gradProgram.uniforms.uVelocity,velocity.read.attach(1)); blit(velocity.write); velocity.swap();
      advProgram.bind(); gl.uniform2f(advProgram.uniforms.texelSize,velocity.texelSizeX,velocity.texelSizeY);
      if(!ext.supportLinearFiltering) gl.uniform2f(advProgram.uniforms.dyeTexelSize,velocity.texelSizeX,velocity.texelSizeY);
      const vid=velocity.read.attach(0); gl.uniform1i(advProgram.uniforms.uVelocity,vid); gl.uniform1i(advProgram.uniforms.uSource,vid); gl.uniform1f(advProgram.uniforms.dt,dt); gl.uniform1f(advProgram.uniforms.dissipation,config.VELOCITY_DISSIPATION); blit(velocity.write); velocity.swap();
      if(!ext.supportLinearFiltering) gl.uniform2f(advProgram.uniforms.dyeTexelSize,dye.texelSizeX,dye.texelSizeY);
      gl.uniform1i(advProgram.uniforms.uVelocity,velocity.read.attach(0)); gl.uniform1i(advProgram.uniforms.uSource,dye.read.attach(1)); gl.uniform1f(advProgram.uniforms.dissipation,config.DENSITY_DISSIPATION); blit(dye.write); dye.swap();
    }
    function render(target: any){
      gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.BLEND);
      const w=target==null?gl.drawingBufferWidth:target.width, h=target==null?gl.drawingBufferHeight:target.height;
      displayMat.bind(); if(config.SHADING) gl.uniform2f(displayMat.uniforms.texelSize,1/w,1/h);
      gl.uniform1i(displayMat.uniforms.uTexture,dye.read.attach(0)); blit(target);
    }

    function updateFrame(){
      if(!isActive) return;
      const now=Date.now(); const dt=Math.min((now-lastTime)/1000,0.016666); lastTime=now;
      colorTimer+=dt*config.COLOR_UPDATE_SPEED;
      if(colorTimer>=1){ colorTimer=0; pointers.forEach(p=>{p.color=generateColor();}); }
      pointers.forEach(p=>{ if(p.moved){ p.moved=false; splatPointer(p); } });
      if(resizeCanvas()) initFBOs();
      step(dt); render(null);
      animRef.current=requestAnimationFrame(updateFrame);
    }

    function onMouseDown(e: MouseEvent){ const p=pointers[0]; const x=scaleByPR(e.clientX),y=scaleByPR(e.clientY); p.id=-1;p.down=true;p.moved=false;p.texcoordX=x/canvas.width;p.texcoordY=1-y/canvas.height;p.prevTexcoordX=p.texcoordX;p.prevTexcoordY=p.texcoordY;p.deltaX=0;p.deltaY=0;p.color=generateColor(); clickSplat(p); }
    let firstMove=false;
    function onMouseMove(e: MouseEvent){ const p=pointers[0]; const x=scaleByPR(e.clientX),y=scaleByPR(e.clientY); if(!firstMove){ p.color=generateColor(); firstMove=true; } p.prevTexcoordX=p.texcoordX;p.prevTexcoordY=p.texcoordY;p.texcoordX=x/canvas.width;p.texcoordY=1-y/canvas.height;p.deltaX=correctDeltaX(p.texcoordX-p.prevTexcoordX);p.deltaY=correctDeltaY(p.texcoordY-p.prevTexcoordY);p.moved=Math.abs(p.deltaX)>0||Math.abs(p.deltaY)>0; }
    function onTouchStart(e: TouchEvent){ const t=e.targetTouches[0]; const p=pointers[0]; p.id=t.identifier;p.down=true;p.moved=false;p.texcoordX=scaleByPR(t.clientX)/canvas.width;p.texcoordY=1-scaleByPR(t.clientY)/canvas.height;p.prevTexcoordX=p.texcoordX;p.prevTexcoordY=p.texcoordY;p.deltaX=0;p.deltaY=0;p.color=generateColor(); }
    function onTouchMove(e: TouchEvent){ const t=e.targetTouches[0]; const p=pointers[0]; p.prevTexcoordX=p.texcoordX;p.prevTexcoordY=p.texcoordY;p.texcoordX=scaleByPR(t.clientX)/canvas.width;p.texcoordY=1-scaleByPR(t.clientY)/canvas.height;p.deltaX=correctDeltaX(p.texcoordX-p.prevTexcoordX);p.deltaY=correctDeltaY(p.texcoordY-p.prevTexcoordY);p.moved=true; }
    function onTouchEnd(){ pointers[0].down=false; }

    window.addEventListener('mousedown',onMouseDown); window.addEventListener('mousemove',onMouseMove);
    window.addEventListener('touchstart',onTouchStart); window.addEventListener('touchmove',onTouchMove,{passive:false}); window.addEventListener('touchend',onTouchEnd);
    animRef.current = requestAnimationFrame(updateFrame);

    return () => {
      isActive=false;
      if(animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('mousedown',onMouseDown); window.removeEventListener('mousemove',onMouseMove);
      window.removeEventListener('touchstart',onTouchStart); window.removeEventListener('touchmove',onTouchMove); window.removeEventListener('touchend',onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position:'fixed', top:0, left:0, zIndex:9, pointerEvents:'none', width:'100%', height:'100%' }}>
      <canvas ref={canvasRef} style={{ width:'100vw', height:'100vh', display:'block' }} />
    </div>
  );
}
