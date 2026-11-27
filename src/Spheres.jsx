import React, { useEffect, useRef } from 'react';

// Zero-gravity pastel spheres. Each sphere is pre-rendered once to a small
// sprite (gradient + highlight + soft shadow), so a frame is just a few
// drawImage calls. Pauses when hidden, off-screen, or the tab is in the background.
const PALETTE = [
  ['#ffd6e7', '#f9a8d4'], ['#d9e8ff', '#93c5fd'], ['#dcfce7', '#86efac'], ['#ede9fe', '#c4b5fd'],
  ['#fff1d6', '#fcd34d'], ['#d5f5f6', '#67e8f9'], ['#ffe4d6', '#fdba74'],
];

function sprite(r, [light, deep], dpr) {
  const pad = Math.ceil(r * 0.7);
  const size = Math.ceil((r * 2 + pad * 2) * dpr);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const cx = r + pad, cy = r + pad;
  // soft drop shadow under the ball
  g.save(); g.shadowColor = 'rgba(30,41,59,.14)'; g.shadowBlur = r * 0.7; g.shadowOffsetY = r * 0.35;
  g.fillStyle = deep; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.fill(); g.restore();
  // body: light top-left falling to the deeper pastel
  const body = g.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.08, cx, cy, r * 1.05);
  body.addColorStop(0, '#ffffff'); body.addColorStop(0.28, light); body.addColorStop(1, deep);
  g.fillStyle = body; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.fill();
  // rim light at the bottom edge
  const rim = g.createRadialGradient(cx, cy + r * 0.2, r * 0.6, cx, cy, r);
  rim.addColorStop(0, 'rgba(255,255,255,0)'); rim.addColorStop(1, 'rgba(255,255,255,.45)');
  g.fillStyle = rim; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.fill();
  // specular highlight
  const hi = g.createRadialGradient(cx - r * 0.4, cy - r * 0.45, 0, cx - r * 0.4, cy - r * 0.45, r * 0.4);
  hi.addColorStop(0, 'rgba(255,255,255,.95)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hi; g.beginPath(); g.arc(cx - r * 0.4, cy - r * 0.45, r * 0.4, 0, 6.283); g.fill();
  return { c, off: r + pad };
}

export default function Spheres({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, balls = [], raf = 0, visible = true, last = 0, running = false;
    const ptr = { x: -9999, y: -9999, active: false, t: 0 };
    const REACH = 140;

    const seed = () => {
      const n = W < 500 ? 7 : W < 900 ? 9 : 12;
      const base = W < 500 ? 22 : W < 900 ? 28 : 32;
      balls = [];
      for (let i = 0; i < n; i++) {
        const r = base * (0.8 + Math.random() * 0.5);
        let x, y, tries = 0;
        do { x = r + Math.random() * (W - 2 * r); y = r + Math.random() * (H - 2 * r); tries++; }
        while (tries < 30 && balls.some((b) => Math.hypot(b.x - x, b.y - y) < b.r + r + 8));
        const a = Math.random() * 6.283, sp = 0.25 + Math.random() * 0.3;
        balls.push({ x, y, r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: sprite(r, PALETTE[i % PALETTE.length], dpr) });
      }
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = cv.offsetWidth, nh = cv.offsetHeight;
      if (!nw || !nh) return;
      const reseed = !balls.length || Math.abs(nw - W) > 80;
      W = nw; H = nh;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reseed) seed(); else balls.forEach((b) => { b.x = Math.min(b.x, W - b.r); b.y = Math.min(b.y, H - b.r); });
      draw();
    };
    const toLocal = (cx, cy) => {
      const b = cv.getBoundingClientRect();
      return { x: ((cx - b.left) / b.width) * W, y: ((cy - b.top) / b.height) * H };
    };
    const onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;
      const l = toLocal(p.clientX, p.clientY);
      ptr.x = l.x; ptr.y = l.y; ptr.active = l.x >= 0 && l.y >= 0 && l.x <= W && l.y <= H; ptr.t = performance.now();
    };
    const onLeave = () => { ptr.active = false; };

    function step(dt) {
      for (const b of balls) {
        if (ptr.active) {
          const dx = b.x - ptr.x, dy = b.y - ptr.y, d = Math.hypot(dx, dy) || 1;
          if (d < REACH + b.r) { const f = (1 - d / (REACH + b.r)) * 0.18 * dt; b.vx += (dx / d) * f; b.vy += (dy / d) * f; }
        }
        // drag back towards a calm drift speed
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 0.45) { const k = 1 - 0.02 * dt; b.vx *= k; b.vy *= k; }
        else if (sp < 0.15) { b.vx *= 1.01; b.vy *= 1.01; }
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } else if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); } else if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy); }
      }
      // elastic sphere-sphere bounces (n is small, so pairwise is cheap)
      for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], c = balls[j];
        const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = a.r + c.r;
        if (d > 0 && d < min) {
          const nx = dx / d, ny = dy / d, ov = (min - d) / 2;
          a.x -= nx * ov; a.y -= ny * ov; c.x += nx * ov; c.y += ny * ov;
          const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rel < 0) { a.vx += rel * nx; a.vy += rel * ny; c.vx -= rel * nx; c.vy -= rel * ny; }
        }
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const b of balls) ctx.drawImage(b.s.c, b.x - b.s.off, b.y - b.s.off, b.s.c.width / dpr, b.s.c.height / dpr);
    }
    const loop = (t) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(48, t - (last || t)) / 16.7; last = t;
      if (ptr.active && t - ptr.t > 2500 && ('ontouchstart' in window)) ptr.active = false;
      step(dt); draw();
    };
    const start = () => { if (running || reduce || !visible || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const onVis = () => (document.hidden ? stop() : start());

    const ro = new ResizeObserver(resize); ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }); io.observe(cv);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchstart', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVis);
    resize(); start();
    return () => {
      stop(); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('touchstart', onMove);
      window.removeEventListener('touchmove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={'pointer-events-none ' + className} />;
}
