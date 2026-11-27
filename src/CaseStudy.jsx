import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Lock, RotateCcw, Check, X, Brain } from 'lucide-react';

// ---------- the models ----------
// Moves are numbers: 0 = left, 1 = right, 2 = up, 3 = down. m is how many arrows are in play.
const PREF = [1, 0, 2, 3]; // tie-break order (people lean right, then left)
const same = (h, at, key) => { for (let j = 0; j < key.length; j++) if (h[at + j] !== key[j]) return false; return true; };
const argmax = (a, m) => {
  let best = null, bv = -Infinity, tie = false;
  for (const j of PREF) { if (j >= m) continue; if (a[j] > bv + 1e-9) { bv = a[j]; best = j; tie = false; } else if (Math.abs(a[j] - bv) <= 1e-9) tie = true; }
  return { best, tie };
};
// No evidence: assume people avoid repeating themselves, and pick their favourite other move.
function fallback(h, m) {
  const n = h.length;
  if (!n) return { p: 1, k: 0, why: 'first' };
  const f = Array(m).fill(0); h.forEach((x) => f[x]++);
  f[h[n - 1]] = -1;
  return { p: argmax(f, m).best, k: 0, why: 'alternate' };
}

// HARD: a 2-to-3 move n-gram. For the last 3, then the last 2 moves, count what the player
// picked next every time that exact sequence happened before. The longest context with a
// clear winner makes the call.
export function predictHard(h, m = 2) {
  const n = h.length;
  for (const k of [3, 2]) {
    if (n < k + 1) continue;
    const key = h.slice(n - k);
    const c = Array(m).fill(0);
    for (let i = k; i < n; i++) if (same(h, i - k, key)) c[h[i]]++;
    const { best, tie } = argmax(c, m);
    if (!tie && c[best] > 0) return { p: best, k, key, seen: c.reduce((a, b) => a + b, 0), hits: c[best], why: 'ngram' };
  }
  return fallback(h, m);
}

// BRUTAL: an online ensemble that re-weights itself every round. Seven experts each give
// odds for the next move: n-gram tables for the last 1, 2, 3 and 4 moves (recent rounds
// count more), a frequency-bias expert, an anti-alternation expert (people who avoid
// repeating, or who ping-pong A B A B) and a streak expert. Every expert is scored on how
// well it would have predicted each past move (decayed log score), and the blend follows
// whichever experts are reading this player best right now.
const NAMES = ['d1', 'd2', 'd3', 'd4', 'bias', 'alt', 'streak'];
export function predictBrutal(h, m = 2) {
  const n = h.length;
  if (n === 0) return fallback(h, m);
  const G = 1 / 0.9;                         // newer moves weigh more (decay 0.9 per round)
  const tables = [null, new Map(), new Map(), new Map(), new Map()];
  const freq = Array(m).fill(0);
  const perf = Array(NAMES.length).fill(0);
  const PRIOR = [0, 0.15, 0.35, 0.25, 0.15, -1, 0.3, 0]; // log prior per expert (deeper context trusted a bit more)
  const uni = () => Array(m).fill(1 / m);
  const experts = (t) => {
    const S = Math.pow(G, t), out = [];
    for (let d = 1; d <= 4; d++) {
      const c = t >= d && tables[d].get(h.slice(t - d, t).join(''));
      if (!c) { out.push(uni()); continue; }
      const tot = c.reduce((x, y) => x + y, 0);
      out.push(c.map((v) => (v + 0.35 * S) / (tot + 0.35 * m * S)));
    }
    const ft = freq.reduce((x, y) => x + y, 0);
    out.push(freq.map((v) => (v + S) / (ft + m * S)));
    // switch rate over the last 6 moves
    let alt = uni(), st = uni();
    if (t >= 3) {
      const tail = h.slice(Math.max(0, t - 6), t); let sw = 0;
      for (let i = 1; i < tail.length; i++) if (tail[i] !== tail[i - 1]) sw++;
      const r = sw / (tail.length - 1), last = h[t - 1];
      if (r >= 0.6) {
        alt = Array(m).fill(0.92 / (m - 1)); alt[last] = 0.08;
        if (m > 2 && t >= 4 && h[t - 1] === h[t - 3] && h[t - 2] === h[t - 4]) { alt = Array(m).fill(0.1 / (m - 1)); alt[last] = 0.02; alt[h[t - 2]] = 0.88; }
      }
      if (r <= 0.34) { st = Array(m).fill(0.4 / (m - 1)); st[last] = 0.6; }
    }
    out.push(alt, st);
    return out;
  };
  const blend = (ex) => {
    const w = perf.map((p, e) => Math.exp(1.6 * p + PRIOR[e + 1]));
    const P = Array(m).fill(0); let W = 0;
    ex.forEach((d, e) => { W += w[e]; d.forEach((v, j) => { P[j] += w[e] * v; }); });
    return { P: P.map((v) => v / W), w };
  };
  for (let t = 0; t < n; t++) {
    const x = h[t];
    if (t > 0) { const ex = experts(t); ex.forEach((d, e) => { perf[e] = perf[e] * 0.93 + Math.log(d[x] * m); }); }
    const S = Math.pow(G, t);
    for (let d = 1; d <= 4; d++) if (t >= d) {
      const k = h.slice(t - d, t).join(''); let c = tables[d].get(k);
      if (!c) { c = Array(m).fill(0); tables[d].set(k, c); }
      c[x] += S;
    }
    freq[x] += S;
  }
  const ex = experts(n);
  const { P, w } = blend(ex);
  const sorted = P.slice().sort((a, b) => b - a);
  if (sorted[0] - sorted[1] < 0.015) { const f = fallback(h, m); return { ...f, why: 'brutal', flag: null, k: 0, conf: Math.round(sorted[0] * 100) }; }
  const { best } = argmax(P, m);
  // which expert is driving this call
  let lead = 0, lv = -Infinity;
  ex.forEach((d, e) => { const v = w[e] * (d[best] - 1 / m); if (v > lv) { lv = v; lead = e; } });
  const name = lv > 0 ? NAMES[lead] : null;
  const k = name && name[0] === 'd' ? +name[1] : 0;
  return { p: best, k, key: k ? h.slice(n - k) : null, why: 'brutal', flag: name && !k ? name : null, conf: Math.round(P[best] * 100) };
}

export const predict = (h, m, diff) => (diff === 'brutal' ? predictBrutal(h, m) : predictHard(h, m));

const GLYPH = ['←', '→', '↑', '↓'];
const seqLabel = (key) => key.map((x) => GLYPH[x]).join(' ');

function Seg({ label, value, options, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-slate-900/[.06] p-1">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => value !== v && onChange(v)}
          className={'min-h-[36px] rounded-full px-3.5 text-[13px] font-semibold tracking-tight transition ' + (value === v ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,.15)]' : 'text-slate-500 hover:text-slate-800')}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Tile({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-900/5">
      <div className="text-[12px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={'mt-1 font-mono text-[28px] font-medium leading-none tracking-tight ' + (accent ? 'text-[#0071e3]' : 'text-slate-900')}>{value}</div>
      {sub && <div className="mt-1.5 text-[12px] text-slate-500">{sub}</div>}
    </div>
  );
}

// Rolling accuracy line against the 50% coin-flip baseline. One series, so no legend.
function Trend({ rounds, base = 0.5 }) {
  const [hov, setHov] = useState(null);
  const box = useRef(null);
  const wrap = useRef(null);
  const [W, setW] = useState(320);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(200, el.clientWidth))); ro.observe(el); return () => ro.disconnect();
  }, []);
  const H = 96, m = { l: 30, r: 8, t: 8, b: 16 };
  const pts = useMemo(() => {
    let hits = 0;
    return rounds.map((r, i) => { hits += r.hit ? 1 : 0; return { i, v: hits / (i + 1) }; });
  }, [rounds]);
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const x = (i) => m.l + (pts.length < 2 ? iw : (i / (pts.length - 1)) * iw);
  const y = (v) => m.t + ih - v * ih;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const onMove = (e) => {
    if (pts.length < 2) return;
    const r = box.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHov(Math.max(0, Math.min(pts.length - 1, Math.round(((px - m.l) / iw) * (pts.length - 1)))));
  };
  const hp = hov != null && pts[hov];
  return (
    <div ref={wrap} className="relative">
      <svg ref={box} viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block touch-none" role="img" aria-label={`Prediction accuracy over ${pts.length} rounds`}
        onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHov(null)}>
        {[0, base, 1].map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke={t === base ? '#94a3b8' : '#e2e8f0'} strokeDasharray={t === base ? '3 3' : ''} strokeWidth="1" />
            <text x={m.l - 6} y={y(t) + 3.5} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">{t * 100}%</text>
          </g>
        ))}
        <text x={W - m.r} y={y(base) - 4} textAnchor="end" className="fill-slate-400 text-[9px]">{base === 0.5 ? 'coin flip' : 'pure chance'}</text>
        {pts.length > 1 && <path d={d} fill="none" stroke="#0071e3" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {pts.length > 0 && <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1].v)} r="4" fill="#0071e3" stroke="#fff" strokeWidth="2" />}
        {hp && <>
          <line x1={x(hov)} x2={x(hov)} y1={m.t} y2={m.t + ih} stroke="#cbd5e1" />
          <circle cx={x(hov)} cy={y(hp.v)} r="4" fill="#0071e3" stroke="#fff" strokeWidth="2" />
        </>}
      </svg>
      {hp && (
        <div className="pointer-events-none absolute top-0 rounded-lg bg-white px-2 py-1 text-[12px] text-slate-700 shadow-md ring-1 ring-slate-900/5"
          style={{ left: `clamp(0px, calc(${(x(hov) / W) * 100}% - 50px), calc(100% - 100px))` }}>
          Round {hov + 1}: <b className="font-mono">{Math.round(hp.v * 100)}%</b>
        </div>
      )}
      {pts.length === 0 && <div className="absolute inset-0 grid place-items-center"><p className="rounded-full bg-white/90 px-3 py-1 text-[12px] text-slate-500 ring-1 ring-slate-900/5">The line starts after your first pick</p></div>}
    </div>
  );
}

const KEYS = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
const ICON = [ArrowLeft, ArrowRight, ArrowUp, ArrowDown];

export default function CaseStudy({ data }) {
  const LBL = [data.leftLabel || 'Left', data.rightLabel || 'Right', data.upLabel || 'Up', data.downLabel || 'Down'];
  const [arrows, setArrows] = useState(2);       // 2 or 4
  const [diff, setDiff] = useState('hard');      // 'hard' | 'brutal'
  const [hist, setHist] = useState([]);          // moves, see GLYPH
  const [rounds, setRounds] = useState([]);      // { pick, pred, hit }
  const [flash, setFlash] = useState(0);
  const [armed, setArmed] = useState(false);     // keyboard captured by the game
  const [pressed, setPressed] = useState(null);
  const wrap = useRef(null);
  const m = arrows;
  const guess = useMemo(() => predict(hist, m, diff), [hist, m, diff]); // locked in before the pick

  const play = (pick) => {
    const hit = guess.p === pick;
    setRounds((r) => [...r, { pick, pred: guess.p, hit }]);
    setHist((h) => [...h, pick]);
    setFlash((f) => f + 1);
  };
  const playRef = useRef(play); playRef.current = play;
  const reset = () => { setHist([]); setRounds([]); setFlash(0); };
  const switchTo = (fn) => { fn(); reset(); };

  // While the game is active, arrow keys play and never scroll the page.
  useEffect(() => {
    if (!armed) return;
    let t = 0;
    const onKey = (e) => {
      if (e.key === 'Escape') { setArmed(false); return; }
      const d = KEYS[e.key];
      if (d == null || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable)) return;
      e.preventDefault();
      if (e.repeat || d >= m) return;
      playRef.current(d);
      setPressed(d); clearTimeout(t); t = setTimeout(() => setPressed(null), 140);
    };
    const onDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setArmed(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown, true); clearTimeout(t); };
  }, [armed, m]);

  const n = rounds.length;
  const base = 1 / m;
  const hits = rounds.filter((r) => r.hit).length;
  const acc = n ? Math.round((hits / n) * 100) : 0;
  const last = rounds[n - 1];
  let streak = 0; for (let i = n - 1; i >= 0 && rounds[i].hit; i--) streak++;
  const edge = acc - base * 100;
  const verdict = n < 5 ? 'Warming up' : edge >= 15 ? 'Reading you clearly' : edge >= 5 ? 'Spotting habits' : edge >= -5 ? 'Close to pure chance' : 'You are out-thinking it';
  const share = Array.from({ length: m }, (_, j) => (n ? Math.round((hist.filter((x) => x === j).length / n) * 100) : Math.round(100 / m)));

  // most common short patterns so far (3 moves with 2 arrows, 2 moves with 4)
  const depth = m === 2 ? 3 : 2;
  const patterns = useMemo(() => {
    const c = {};
    for (let i = depth; i < hist.length; i++) {
      const k = hist.slice(i - depth, i).join(''); c[k] = c[k] || Array(m).fill(0); c[k][hist[i]]++;
    }
    return Object.entries(c).map(([k, v]) => ({ k: k.split('').map(Number), v, t: v.reduce((a, b) => a + b, 0) })).sort((a, b) => b.t - a.t).slice(0, 3);
  }, [hist, depth, m]);

  let basis;
  if (guess.why === 'first') basis = 'No data yet: opening guess';
  else if (guess.why === 'alternate') basis = diff === 'hard' ? 'No 2 or 3 move pattern yet: betting you will not repeat' : 'Betting you will not repeat';
  else if (guess.why === 'ngram') basis = `Your last ${guess.k} moves (${seqLabel(guess.key)}) seen ${guess.seen}×`;
  else basis = (guess.k ? `Ensemble led by your last ${guess.k} move${guess.k > 1 ? 's' : ''} (${seqLabel(guess.key)})` : 'Ensemble of 7 pattern experts')
    + (guess.flag === 'alt' ? ' · you avoid repeats' : guess.flag === 'streak' ? ' · you are on a streak' : guess.flag === 'bias' ? ' · you favour one move' : '');

  const pad = (v, className = '') => {
    const I = ICON[v];
    return (
      <button key={v} type="button" onClick={() => play(v)} aria-label={LBL[v]} aria-keyshortcuts={Object.keys(KEYS)[v]}
        className={'group flex flex-col items-center justify-center gap-1.5 rounded-3xl bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,.06),0_10px_30px_-10px_rgba(15,23,42,.25)] ring-1 ring-slate-900/5 transition active:scale-[.97] hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(15,23,42,.06),0_18px_40px_-12px_rgba(15,23,42,.3)] '
          + (pressed === v ? 'scale-[.97] ring-2 ring-[#0071e3]/50 ' : '') + className}>
        <span className={'grid h-11 w-11 place-items-center rounded-full transition group-hover:bg-[#0071e3] group-hover:text-white ' + (pressed === v ? 'bg-[#0071e3] text-white' : 'bg-slate-100')}><I size={21} /></span>
        <span className="text-[15px] font-semibold tracking-tight @3xl:text-lg">{LBL[v]}</span>
      </button>
    );
  };

  return (
    <div className="glass rounded-[28px] p-4 @3xl:p-6">
      <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* play area */}
        <div ref={wrap} onFocus={() => setArmed(true)} onPointerDown={() => setArmed(true)}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Seg label="Arrow mode" value={arrows} onChange={(v) => switchTo(() => setArrows(v))} options={[[2, '2-Arrow'], [4, '4-Arrow']]} />
            <Seg label="Difficulty" value={diff} onChange={(v) => switchTo(() => setDiff(v))} options={[['hard', 'Hard'], ['brutal', 'Brutal']]} />
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><Lock size={16} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">Prediction {n + 1} is locked in</div>
              <div className="truncate text-[12px] text-white/60" title={basis}>{basis}</div>
            </div>
            <span className={'shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] ' + (diff === 'brutal' ? 'bg-rose-500/25 text-rose-100' : 'bg-white/10 text-white/70')}>{diff === 'brutal' ? 'brutal' : 'hard'}</span>
          </div>

          {m === 2 ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {pad(0, 'min-h-[120px] @3xl:min-h-[150px]')}
              {pad(1, 'min-h-[120px] @3xl:min-h-[150px]')}
            </div>
          ) : (
            <div className="mx-auto mt-4 grid max-w-[420px] grid-cols-3 gap-2.5">
              <span key="a" />
              {pad(2, 'min-h-[92px] @3xl:min-h-[104px]')}
              <span />
              {pad(0, 'min-h-[92px] @3xl:min-h-[104px]')}
              <div aria-hidden="true" className="grid place-items-center rounded-3xl bg-slate-900/[.04] text-center font-mono text-[11px] leading-tight text-slate-400">?<br />sealed</div>
              {pad(1, 'min-h-[92px] @3xl:min-h-[104px]')}
              <span />
              {pad(3, 'min-h-[92px] @3xl:min-h-[104px]')}
              <span />
            </div>
          )}
          <p className="mt-2 hidden text-center text-[12px] text-slate-500 [@media(hover:hover)]:block">
            {armed ? <span className="font-medium text-[#0071e3]">Keyboard on: use {m === 2 ? '← →' : '← → ↑ ↓'} · Esc to release</span> : `Tip: tap the game once, then use the ${m === 2 ? '← →' : 'arrow'} keys.`}
          </p>

          <div aria-live="polite" className="mt-3 min-h-[52px]">
            {last ? (
              <div key={flash} className={'pop flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] ring-1 ' + (last.hit ? 'bg-blue-50 text-slate-800 ring-blue-200' : 'bg-white/70 text-slate-800 ring-slate-900/5')}>
                <span className={'grid h-7 w-7 shrink-0 place-items-center rounded-full ' + (last.hit ? 'bg-[#0071e3] text-white' : 'bg-slate-200 text-slate-600')}>{last.hit ? <Check size={15} /> : <X size={15} />}</span>
                <span>I predicted <b>{LBL[last.pred]}</b>, you picked <b>{LBL[last.pick]}</b>. {last.hit ? 'Read you.' : 'You got me that time.'}</span>
              </div>
            ) : (
              <p className="px-1 text-[14px] text-slate-500">Try to be unpredictable. Play at least 20 rounds and watch the model learn your habits.{diff === 'brutal' ? ' Brutal adapts faster.' : ''}</p>
            )}
          </div>

          {/* move history */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[12px] text-slate-500">Last moves</span>
            <div className="flex flex-1 flex-wrap gap-1" aria-label="Recent rounds">
              {rounds.slice(-24).map((r, i) => (
                <span key={n - 24 + i} title={`${LBL[r.pick]} · ${r.hit ? 'predicted' : 'missed'}`}
                  className={'grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold ' + (r.hit ? 'bg-[#0071e3] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-300')}>
                  {GLYPH[r.pick]}
                </span>
              ))}
              {!n && <span className="text-[12px] text-slate-400">none yet</span>}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Filled dot: the model called it. Outline: you beat it.</p>
        </div>

        {/* live metrics */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Tile label="Accuracy" value={n ? acc + '%' : '–'} sub={verdict} accent />
            <Tile label="Rounds" value={n} sub={`${hits} predicted`} />
            <Tile label="Streak" value={streak} sub="in a row" />
          </div>
          <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-900/5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 text-[12px]">
              <span className="font-medium uppercase tracking-wide text-slate-500">Accuracy over time</span>
              <span className="font-mono text-slate-500">{share.map((s, j) => `${GLYPH[j]} ${s}%`).join(' · ')}</span>
            </div>
            <Trend key={m} rounds={rounds} base={base} />
          </div>
          {patterns.length > 0 && (
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-900/5">
              <div className="text-[12px] font-medium uppercase tracking-wide text-slate-500">Your habits so far</div>
              <ul className="mt-2 space-y-1.5 text-[13px] text-slate-700">
                {patterns.map((p) => {
                  const nx = argmax(p.v, m).best;
                  return <li key={p.k.join('')} className="flex justify-between gap-2"><span className="font-mono">{seqLabel(p.k)} →</span><span>then <b>{LBL[nx]}</b> {p.v[nx]} of {p.t}</span></li>;
                })}
              </ul>
            </div>
          )}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 p-4 ring-1 ring-indigo-100">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-indigo-700"><Brain size={14} />Data Analyst Insight</div>
            <p className="mt-2 text-[14px] leading-snug text-slate-700">{data.insight1}</p>
            <p className="mt-1 text-[14px] leading-snug text-slate-700">{data.insight2}</p>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={reset} disabled={!n} className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-900/5 disabled:opacity-40"><RotateCcw size={15} />Start over</button>
          </div>
        </div>
      </div>
    </div>
  );
}
