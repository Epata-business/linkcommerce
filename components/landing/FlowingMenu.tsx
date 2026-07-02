'use client';
import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

interface MenuItem { link: string; text: string; image: string; }
interface Props {
  items?: MenuItem[];
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
}

function MenuItemComp({ link, text, image, speed, textColor, marqueeBgColor, marqueeTextColor, borderColor }: MenuItem & Omit<Props,'items'>) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(4);

  const findClosestEdge = (mx: number, my: number, w: number, h: number) => {
    const top = (mx-w/2)**2 + my**2;
    const bot = (mx-w/2)**2 + (my-h)**2;
    return top < bot ? 'top' : 'bottom';
  };

  useEffect(() => {
    const calc = () => {
      if (!marqueeInnerRef.current) return;
      const part = marqueeInnerRef.current.querySelector('.fm__part') as HTMLElement;
      if (!part) return;
      const n = Math.max(4, Math.ceil(window.innerWidth / (part.offsetWidth||1)) + 2);
      setRepetitions(n);
    };
    calc(); window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [text, image]);

  useEffect(() => {
    const setup = () => {
      if (!marqueeInnerRef.current) return;
      const part = marqueeInnerRef.current.querySelector('.fm__part') as HTMLElement;
      if (!part || part.offsetWidth === 0) return;
      if (animRef.current) animRef.current.kill();
      animRef.current = gsap.to(marqueeInnerRef.current, { x: -part.offsetWidth, duration: speed ?? 15, ease: 'none', repeat: -1 });
    };
    const t = setTimeout(setup, 50);
    return () => { clearTimeout(t); animRef.current?.kill(); };
  }, [text, image, repetitions, speed]);

  const onEnter = (e: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const r = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(e.clientX-r.left, e.clientY-r.top, r.width, r.height);
    gsap.timeline({ defaults:{ duration:0.6, ease:'expo' } })
      .set(marqueeRef.current, { y: edge==='top'?'-101%':'101%' })
      .set(marqueeInnerRef.current, { y: edge==='top'?'101%':'-101%' })
      .to([marqueeRef.current, marqueeInnerRef.current], { y:'0%' });
  };
  const onLeave = (e: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const r = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(e.clientX-r.left, e.clientY-r.top, r.width, r.height);
    gsap.timeline({ defaults:{ duration:0.6, ease:'expo' } })
      .to(marqueeRef.current, { y: edge==='top'?'-101%':'101%' })
      .to(marqueeInnerRef.current, { y: edge==='top'?'101%':'-101%' });
  };

  return (
    <div ref={itemRef} className="fm__item" style={{ borderColor: borderColor ?? 'rgba(21,61,236,0.2)' }}>
      <a href={link} className="fm__link" onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ color: textColor ?? '#ffffff' }}>
        {text}
      </a>
      <div ref={marqueeRef} className="fm__marquee" style={{ backgroundColor: marqueeBgColor ?? '#153DFC' }}>
        <div className="fm__marquee-wrap">
          <div ref={marqueeInnerRef} className="fm__marquee-inner" aria-hidden>
            {[...Array(repetitions)].map((_,i) => (
              <div key={i} className="fm__part" style={{ color: marqueeTextColor ?? '#ffffff' }}>
                <span>{text}</span>
                <div className="fm__img" style={{ backgroundImage:`url(${image})` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlowingMenu({ items=[], speed=15, textColor='#ffffff', bgColor='#080A12', marqueeBgColor='#153DFC', marqueeTextColor='#ffffff', borderColor='rgba(21,61,236,0.2)' }: Props) {
  return (
    <div className="fm__wrap" style={{ backgroundColor: bgColor }}>
      <nav className="fm__nav">
        {items.map((item,i) => (
          <MenuItemComp key={i} {...item} speed={speed} textColor={textColor} marqueeBgColor={marqueeBgColor} marqueeTextColor={marqueeTextColor} borderColor={borderColor} />
        ))}
      </nav>
      <style>{`
        .fm__wrap{width:100%;height:100%;overflow:hidden;}
        .fm__nav{display:flex;flex-direction:column;height:100%;margin:0;padding:0;}
        .fm__item{flex:1;position:relative;overflow:hidden;text-align:center;border-top:1px solid;}
        .fm__item:first-child{border-top:none;}
        .fm__link{display:flex;align-items:center;justify-content:center;height:100%;position:relative;cursor:pointer;text-transform:uppercase;text-decoration:none;white-space:nowrap;font-weight:700;font-size:4vh;letter-spacing:0.05em;}
        .fm__marquee{position:absolute;top:0;left:0;overflow:hidden;width:100%;height:100%;pointer-events:none;transform:translate3d(0,101%,0);}
        .fm__marquee-wrap{height:100%;width:100%;overflow:hidden;}
        .fm__marquee-inner{display:flex;align-items:center;position:relative;height:100%;width:fit-content;will-change:transform;}
        .fm__part{display:flex;align-items:center;flex-shrink:0;}
        .fm__part span{white-space:nowrap;text-transform:uppercase;font-weight:700;font-size:4vh;padding:0 1vw;letter-spacing:0.05em;}
        .fm__img{width:180px;height:7vh;margin:1.5em 2vw;border-radius:50px;background-size:cover;background-position:center;}
      `}</style>
    </div>
  );
}
