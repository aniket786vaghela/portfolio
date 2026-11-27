import React, { useEffect, useRef, useState } from 'react';

// The cursor companion, in one of two styles chosen in Studio (data.companion.style):
//  - 'stickman': a small gentleman in a top hat who gestures per section
//    (wave, thumbs up, hat tip, point, admire, wave goodbye).
//  - 'ball': a glossy shaded sphere that rolls in its direction of travel and
//    changes expression per section (happy, impressed, curious, celebrating, farewell).
// Desktop (fine pointer): follows the cursor with an eased lag and reacts to the
// section under the pointer. Touch, Studio's phone/iPad previews, or reduced motion:
// docks bottom-right, reacts to the section in view while scrolling, hops on taps.
// It never takes pointer events, so it cannot block a tap or click.
const POSES = ['hero', 'skills', 'achievements', 'caseStudy', 'projects', 'contact'];
export const EXPRESSIONS = { hero: 'happy', skills: 'impressed', achievements: 'celebrating', caseStudy: 'curious', projects: 'impressed', contact: 'farewell' };
export const GESTURES = { hero: 'wave', skills: 'thumbs up', achievements: 'hat tip', caseStudy: 'point', projects: 'admire', contact: 'wave goodbye' };
const SIZES = { stickman: { w: 52, h: 76 }, ball: { w: 60, h: 64 } };
const BALL = 54; // sphere diameter in px

// `face` is an optional data URL shown in a circular clip under the hat;
// `flip` un-mirrors the photo when he faces left.
export function Figure({ face, flip = 1, width = 52, height = 76 }) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 48 70" width={width} height={height} className="gent-svg" aria-hidden="true">
      <defs><clipPath id={uid + 'face'}><circle cx="24" cy="23.4" r="6.9" /></clipPath></defs>
      <g className="gent-idle">
        <g className="gent-body">
          <g className="gent-leg gent-leg-l"><line x1="24" y1="50" x2="24" y2="66" /></g>
          <g className="gent-leg gent-leg-r"><line x1="24" y1="50" x2="24" y2="66" /></g>
          <line x1="24" y1="29" x2="24" y2="50" />
          <path d="M20.5 31.2 L24 32.6 L27.5 31.2 L27.5 34.4 L24 33 L20.5 34.4 Z" className="gent-tie" />
          <g className="gent-arm gent-arm-l"><line x1="24" y1="34" x2="24" y2="49" /></g>
          <g className="gent-arm gent-arm-r">
            <line x1="24" y1="34" x2="24" y2="49" />
            <g className="gent-thumb"><circle cx="24" cy="49.6" r="1.9" /><line x1="24.6" y1="49.4" x2="28.2" y2="51.3" /></g>
          </g>
          {face ? (
            <>
              <circle cx="24" cy="23.4" r="6.9" fill="#fff" />
              <g transform={flip < 0 ? 'matrix(-1 0 0 1 48 0)' : undefined}>
                <image href={face} x="17.1" y="16.5" width="13.8" height="13.8" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${uid}face)`} />
              </g>
              <circle cx="24" cy="23.4" r="6.9" className="gent-face-ring" />
            </>
          ) : (
            <>
              <circle cx="24" cy="23" r="6" className="gent-head" />
              <circle cx="22" cy="22.6" r=".95" className="gent-eye" />
              <circle cx="26.4" cy="22.6" r=".95" className="gent-eye" />
              <path d="M21.6 25.4 Q24.2 27.4 26.8 25.4" className="gent-smile" />
            </>
          )}
          <g className="gent-hat">
            <rect x="17" y="3.5" width="14" height="13.5" rx="1.6" className="gent-crown" />
            <rect x="17" y="12.6" width="14" height="2.6" className="gent-band" />
            <line x1="12.5" y1="17" x2="35.5" y2="17" className="gent-brim" />
          </g>
        </g>
      </g>
    </svg>
  );
}

// Drawn expressions on a 100×100 face plate.
function Expression({ expr }) {
  switch (expr) {
    case 'impressed':
      return (<>
        <ellipse cx="36" cy="42" rx="7" ry="8.5" className="ball-ink" /><ellipse cx="64" cy="42" rx="7" ry="8.5" className="ball-ink" />
        <circle cx="38.5" cy="39" r="2.4" fill="#fff" /><circle cx="66.5" cy="39" r="2.4" fill="#fff" />
        <path d="M27 29 Q36 23 44 28 M56 28 Q64 23 73 29" className="ball-line" />
        <ellipse cx="50" cy="66" rx="6" ry="7" className="ball-ink" />
      </>);
    case 'curious':
      return (<>
        <circle cx="36" cy="44" r="5" className="ball-ink" /><circle cx="64" cy="42" r="7" className="ball-ink" />
        <circle cx="66" cy="40" r="2" fill="#fff" />
        <path d="M28 35 L44 37 M55 28 Q64 22 73 30" className="ball-line" />
        <path d="M40 66 Q50 62 60 66" className="ball-line" />
      </>);
    case 'celebrating':
      return (<>
        <path d="M28 46 Q36 34 44 46 M56 46 Q64 34 72 46" className="ball-line" />
        <path d="M33 58 H67 Q66 76 50 76 Q34 76 33 58 Z" className="ball-ink" />
        <path d="M40 70 Q50 64 60 70 Q56 76 50 76 Q44 76 40 70 Z" fill="#fb7185" />
        <ellipse cx="25" cy="58" rx="6" ry="3.5" className="ball-blush" /><ellipse cx="75" cy="58" rx="6" ry="3.5" className="ball-blush" />
      </>);
    case 'farewell':
      return (<>
        <path d="M29 44 Q36 50 43 44 M57 44 Q64 50 71 44" className="ball-line" />
        <path d="M38 61 Q50 70 62 61" className="ball-line" />
        <ellipse cx="26" cy="56" rx="5.5" ry="3" className="ball-blush" /><ellipse cx="74" cy="56" rx="5.5" ry="3" className="ball-blush" />
      </>);
    default: // happy
      return (<>
        <ellipse cx="37" cy="43" rx="5" ry="6.5" className="ball-ink" /><ellipse cx="63" cy="43" rx="5" ry="6.5" className="ball-ink" />
        <circle cx="38.6" cy="40.6" r="1.8" fill="#fff" /><circle cx="64.6" cy="40.6" r="1.8" fill="#fff" />
        <path d="M34 60 Q50 74 66 60" className="ball-line" />
        <ellipse cx="25" cy="55" rx="5.5" ry="3" className="ball-blush" /><ellipse cx="75" cy="55" rx="5.5" ry="3" className="ball-blush" />
      </>);
  }
}

const BADGE = { curious: '?', impressed: '!', celebrating: '✦', farewell: '👋' };

// Glossy rolling sphere. Lighting (shade + gloss) stays fixed while the skin
// (seams, face) rotates by --roll and leans toward travel by --fx/--fy.
export function BallFigure({ face, expr = 'happy', size = BALL }) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={'ball ball-' + expr} style={{ width: size, height: size }} aria-hidden="true">
      <div className="ball-base" />
      <div className="ball-skin">
        <svg viewBox="0 0 100 100" className="ball-svg">
          <defs><clipPath id={uid + 'bf'}><circle cx="50" cy="50" r="37" /></clipPath></defs>
          <path d="M2 56 Q50 74 98 56" className="ball-seam" />
          <path d="M8 26 Q50 12 92 26" className="ball-seam ball-seam-2" />
          <g className="ball-face">
            {face ? (
              <>
                <image href={face} x="13" y="13" width="74" height="74" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${uid}bf)`} />
                <circle cx="50" cy="50" r="37" className="ball-face-ring" />
              </>
            ) : <Expression expr={expr} />}
          </g>
        </svg>
      </div>
      <div className="ball-shade" />
      <div className="ball-gloss" />
      {BADGE[expr] && <span key={expr} className="ball-badge">{BADGE[expr]}</span>}
      {expr === 'celebrating' && <span className="ball-confetti"><i /><i /><i /><i /><i /></span>}
    </div>
  );
}

export default function Stickman({ labels, face, frame, scroller, forceDock = false, variant = 'stickman' }) {
  const isBall = variant === 'ball';
  const { w: W, h: H } = SIZES[isBall ? 'ball' : 'stickman'];
  const root = useRef(null);
  const [pose, setPose] = useState('hero');
  const [say, setSay] = useState(null); // { text, k }
  const [walk, setWalk] = useState(false);
  const [hop, setHop] = useState(0);
  const [dir, setDir] = useState(1);
  const [docked, setDocked] = useState(true);
  const lab = useRef(labels); lab.current = labels;
  const poseRef = useRef('hero');

  const speak = (p) => {
    const text = lab.current?.[p];
    if (!text) { setSay(null); return; }
    setSay({ text, k: Date.now() });
  };
  const changePose = (p) => {
    if (!POSES.includes(p) || p === poseRef.current) return;
    poseRef.current = p; setPose(p); speak(p);
  };

  // auto-hide the bubble a while after it appears
  useEffect(() => {
    if (!say) return;
    const t = setTimeout(() => setSay(null), docked ? 2600 : 3200);
    return () => clearTimeout(t);
  }, [say, docked]);

  // decide follow vs docked
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const calc = () => setDocked(forceDock || mq.matches || rm.matches);
    calc();
    mq.addEventListener?.('change', calc); rm.addEventListener?.('change', calc);
    return () => { mq.removeEventListener?.('change', calc); rm.removeEventListener?.('change', calc); };
  }, [forceDock]);

  // greet once on mount
  useEffect(() => { const t = setTimeout(() => speak(poseRef.current), 700); return () => clearTimeout(t); }, []);

  // follow mode: eased chase of the cursor, transform and roll written straight to the DOM
  useEffect(() => {
    if (docked) return;
    const el = root.current; if (!el) return;
    const host = frame?.current || window;
    let tx = -200, ty = -200, x = -200, y = -200, raf = 0, running = false, last = 0, walking = false, facing = 1, seen = false, tilt = 0;
    let roll = 0, fx = 0, fy = 0;
    const R = BALL / 2;

    const bounds = () => {
      if (frame?.current) {
        const r = frame.current.getBoundingClientRect();
        const s = r.width / frame.current.offsetWidth || 1;
        return { left: r.left, top: r.top, s, w: frame.current.offsetWidth, h: frame.current.offsetHeight };
      }
      return { left: 0, top: 0, s: 1, w: window.innerWidth, h: window.innerHeight };
    };
    const place = () => { el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; };
    const loop = (t) => {
      const dt = Math.min(48, t - (last || t)) / 16.7; last = t;
      const k = 1 - Math.pow(1 - 0.09, dt);
      const dx = tx - x, dy = ty - y;
      const sx = dx * k, sy = dy * k;
      x += sx; y += sy; place();
      const sp = Math.hypot(sx, sy);
      const w = sp > 0.6;
      if (w !== walking) { walking = w; setWalk(w); }
      let settled;
      if (isBall) {
        // roll like a wheel: arc length / radius, signed by horizontal travel; vertical travel adds a little spin too
        const along = Math.abs(sx) > 0.01 ? sx : sy * 0.6;
        roll += (along / R) * (180 / Math.PI);
        // when slow, ease back upright to the nearest full turn so the face reads again
        if (sp < 0.8) { const up = Math.round(roll / 360) * 360; roll += (up - roll) * (1 - Math.pow(1 - 0.12, dt)); }
        const ease = 1 - Math.pow(1 - 0.18, dt);
        fx += (Math.max(-7, Math.min(7, sx * 1.4)) - fx) * ease;
        fy += (Math.max(-7, Math.min(7, sy * 1.4)) - fy) * ease;
        el.style.setProperty('--roll', roll.toFixed(1) + 'deg');
        el.style.setProperty('--fx', fx.toFixed(2) + 'px');
        el.style.setProperty('--fy', fy.toFixed(2) + 'px');
        settled = Math.abs(Math.round(roll / 360) * 360 - roll) < 0.4 && Math.abs(fx) + Math.abs(fy) < 0.1;
        if (settled && Math.hypot(dx, dy) < 0.3) { roll = Math.round(roll / 360) * 360; fx = fy = 0; el.style.setProperty('--roll', roll + 'deg'); el.style.setProperty('--fx', '0px'); el.style.setProperty('--fy', '0px'); }
      } else {
        // lean into the direction of travel, eased so it settles smoothly
        const want = Math.max(-16, Math.min(16, sx * 1.5));
        tilt += (want - tilt) * (1 - Math.pow(1 - 0.16, dt));
        el.style.setProperty('--tilt', tilt.toFixed(2) + 'deg');
        if (Math.abs(dx) > 6) { const f = dx > 0 ? 1 : -1; if (f !== facing) { facing = f; setDir(f); } }
        settled = Math.abs(tilt) < 0.08;
        if (settled && Math.hypot(dx, dy) < 0.3) { tilt = 0; el.style.setProperty('--tilt', '0deg'); }
      }
      if ((Math.hypot(dx, dy) < 0.3 && settled) || document.hidden) { running = false; if (walking) { walking = false; setWalk(false); } return; }
      raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!running) { running = true; last = 0; raf = requestAnimationFrame(loop); } };
    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      const b = bounds();
      const cx = (e.clientX - b.left) / b.s, cy = (e.clientY - b.top) / b.s;
      if (cx < 0 || cy < 0 || cx > b.w || cy > b.h) return;
      // sit just below-right of the cursor; swap sides near the edges
      let nx = cx + 18, ny = cy + 16;
      if (nx + W > b.w - 6) nx = cx - 18 - W;
      if (ny + H > b.h - 6) ny = cy - 16 - H;
      tx = Math.max(4, Math.min(b.w - W - 4, nx)); ty = Math.max(4, Math.min(b.h - H - 4, ny));
      if (!seen) { seen = true; x = tx; y = ty; el.style.opacity = '1'; }
      const sec = e.target?.closest?.('section[id]');
      if (sec && (!frame?.current || frame.current.contains(sec))) changePose(sec.id);
      kick();
    };
    el.style.opacity = '0';
    host.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf); host.removeEventListener('pointermove', onMove);
      el.style.transform = ''; el.style.opacity = '';
      ['--tilt', '--roll', '--fx', '--fy'].forEach((p) => el.style.removeProperty(p));
    };
  }, [docked, frame, isBall, W, H]);

  // docked mode: pose follows the section in view; scrolling rolls the ball; taps make it hop
  useEffect(() => {
    if (!docked) return;
    const el = root.current;
    const sc = scroller?.current || window;
    const host = frame?.current || window;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let tick = 0, stopT = 0, roll = 0;
    const scrollTop = () => (scroller?.current ? scroller.current.scrollTop : window.scrollY);
    let lastY = scrollTop();
    const check = () => {
      tick = 0;
      const box = scroller?.current ? scroller.current.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      const line = box.top + box.height * 0.45;
      const scope = scroller?.current || document;
      for (const s of scope.querySelectorAll('section[id]')) {
        const r = s.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) { changePose(s.id); break; }
      }
    };
    const onScroll = () => {
      if (!tick) tick = requestAnimationFrame(check);
      const yy = scrollTop();
      if (isBall && !rm && el) { roll += ((yy - lastY) / (BALL / 2)) * (180 / Math.PI) * 0.35; el.style.setProperty('--roll', roll.toFixed(1) + 'deg'); }
      lastY = yy;
      setWalk(true); clearTimeout(stopT);
      stopT = setTimeout(() => {
        setWalk(false);
        if (isBall && el) { roll = Math.round(roll / 360) * 360; el.style.setProperty('--roll', roll + 'deg'); }
      }, 220);
    };
    const onTap = (e) => {
      if (e.pointerType === 'mouse' && !forceDock) return;
      setHop((h) => h + 1); speak(poseRef.current);
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    host.addEventListener('pointerdown', onTap, { passive: true });
    check();
    return () => { sc.removeEventListener('scroll', onScroll); host.removeEventListener('pointerdown', onTap); cancelAnimationFrame(tick); clearTimeout(stopT); setWalk(false); el?.style.removeProperty('--roll'); };
  }, [docked, frame, scroller, forceDock, isBall]);

  const pos = frame ? 'absolute' : 'fixed';
  const dockStyle = docked ? { right: 'max(12px, env(safe-area-inset-right))', bottom: 'max(14px, env(safe-area-inset-bottom))' } : { left: 0, top: 0 };
  const cls = isBall ? `cball cball-${EXPRESSIONS[pose]}` : `gent gent-${pose}`;
  return (
    <div ref={root} aria-hidden="true" style={{ position: pos, width: W, height: H, ...dockStyle }}
      className={`${cls} companion pointer-events-none z-30 select-none ${docked ? 'comp-docked' : 'comp-follow'}${walk ? ' comp-walk' : ''}`}>
      {say && (
        <span key={say.k} className={'comp-say absolute ' + (isBall ? 'bottom-[calc(100%+12px)]' : 'bottom-[calc(100%+2px)]') + ' whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-semibold tracking-tight text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,.12)] ring-1 ring-slate-900/5 backdrop-blur ' + (docked ? 'right-0' : 'left-1/2 -translate-x-1/2')}>
          {say.text}
        </span>
      )}
      {isBall && <span className="ball-ground" />}
      <div key={hop} className={'comp-hopper ' + (hop ? 'comp-hop' : '')}>
        {isBall ? (
          <BallFigure face={face} expr={EXPRESSIONS[pose]} />
        ) : (
          <div className="gent-tilt">
            <div className="transition-transform duration-200" style={{ transform: `scaleX(${dir})` }}><Figure face={face} flip={dir} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
