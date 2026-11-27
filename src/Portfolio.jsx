import React, { useEffect, useState } from 'react';
import { Database, Server, Code2, Lock, Mail, Copy, ArrowRight, MapPin, FileText, Globe, Briefcase, AtSign, ExternalLink, Sparkles, Check, ChevronDown } from 'lucide-react';
import CaseStudy from './CaseStudy.jsx';

export const ICONS = { Database, Server, Code2, Sparkles, Globe };
const SOCIAL_ICONS = { GitHub: Code2, LinkedIn: Briefcase, X: AtSign, Website: Globe, Email: Mail, Other: ExternalLink };

const safeUrl = (u) => (/^(https?:|mailto:)/i.test(u || '') ? u : '#');

function Roles({ roles }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (roles.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % roles.length), 2600);
    return () => clearInterval(t);
  }, [roles.length]);
  const r = roles[i % Math.max(1, roles.length)] || '';
  return (
    <span className="relative inline-block min-h-[1.2em]" aria-live="polite">
      <span key={r + i} className="role-in inline-block bg-gradient-to-r from-[#0071e3] via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">{r}</span>
    </span>
  );
}

function H2({ children, sub }) {
  return (
    <div className="mb-6 @3xl:mb-8">
      <h2 className="font-display text-[clamp(30px,4.4cqi,48px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#1d1d1f]">{children}</h2>
      {sub && <p className="mt-3 max-w-[62ch] text-[17px] leading-relaxed text-slate-500">{sub}</p>}
    </div>
  );
}

function Hero({ p, ach, go }) {
  return (
    <section id="hero" data-sel="hero" className="px-4 pb-12 pt-10 @3xl:px-10 @3xl:pb-20 @3xl:pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 @4xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div>
          <p className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-[13px] font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.18)]" />{p.availability}
          </p>
          <h1 className="mt-5 font-display text-[clamp(44px,7.4cqi,80px)] font-semibold leading-[1.02] tracking-[-0.035em] text-[#1d1d1f]">{p.name}</h1>
          <p className="mt-3 font-display text-[clamp(24px,3.6cqi,36px)] font-semibold leading-tight tracking-tight text-slate-800"><Roles roles={p.roles} /></p>
          <p className="mt-5 max-w-[54ch] text-[19px] leading-relaxed text-slate-600">{p.tagline}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => go('caseStudy')} className="flex min-h-[48px] items-center gap-2 rounded-full bg-[#0071e3] px-6 font-medium text-white shadow-[0_8px_20px_-8px_rgba(0,113,227,.7)] transition hover:bg-[#0077ed] active:scale-[.98]">
              {p.ctaPrimary}<ArrowRight size={18} />
            </button>
            <button onClick={() => go('contact')} className="glass flex min-h-[48px] items-center gap-2 rounded-full px-6 font-medium text-[#1d1d1f] transition hover:bg-white/90 active:scale-[.98]">
              {p.ctaSecondary}
            </button>
            {p.resumeUrl && (
              <a href={safeUrl(p.resumeUrl)} target="_blank" rel="noreferrer" className="flex min-h-[48px] items-center gap-2 rounded-full px-3 font-medium text-[#0071e3] hover:underline">
                <FileText size={18} />Résumé
              </a>
            )}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 @3xl:-inset-8 rounded-[40px] bg-gradient-to-br from-sky-200/50 via-fuchsia-100/40 to-amber-100/50 blur-2xl" />
          <div className="glass relative rounded-[28px] p-5 @3xl:p-6">
            <div className="flex items-center gap-4">
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} className="h-20 w-20 rounded-2xl object-cover shadow-md ring-4 ring-white" />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 via-indigo-300 to-pink-300 font-display text-2xl font-semibold text-white shadow-md ring-4 ring-white">{p.initials}</div>
              )}
              <div>
                <div className="font-display text-lg font-semibold tracking-tight text-[#1d1d1f]">{p.name}</div>
                <div className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />{p.location}</div>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              {ach.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-baseline justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-slate-900/5">
                  <span className="text-sm text-slate-600">{a.metricLabel}</span>
                  <span className="font-mono text-xl font-medium tracking-tight text-[#1d1d1f] whitespace-nowrap">{a.metric}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Skills({ d }) {
  const [open, setOpen] = useState(d.skills[0]?.id);
  const [tag, setTag] = useState(null);
  const active = d.interests.find((t) => t.id === tag);
  return (
    <section id="skills" data-sel="skills" className="px-4 py-12 @3xl:px-10 @3xl:py-16">
      <div className="mx-auto max-w-6xl">
        <H2 sub="Three disciplines, one workflow: find the signal, automate it, ship it.">{d.skillsHeading}</H2>
        <div className="grid gap-4 @3xl:grid-cols-3">
          {d.skills.map((s) => {
            const Icon = ICONS[s.icon] || Sparkles; const isOpen = open === s.id;
            return (
              <article key={s.id} data-sel={'skill:' + s.id}
                className={'glass lift group rounded-[24px] p-5 ' + (isOpen ? 'glass-strong ring-2 ring-[#0071e3]/25' : '')}>
                <button onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen} className="flex w-full min-h-[44px] items-center gap-3 text-left">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 text-[#0071e3] ring-1 ring-white"><Icon size={20} /></span>
                  <span className="flex-1 font-display text-xl font-semibold tracking-tight text-[#1d1d1f]">{s.title}</span>
                  <ChevronDown size={18} className={'text-slate-400 transition ' + (isOpen ? 'rotate-180' : '')} />
                </button>
                <p className="mt-3 text-[15px] text-slate-500">{s.summary}</p>
                {isOpen ? (
                  <ul className="mt-4 space-y-3">
                    {s.items.map((it) => (
                      <li key={it.id}>
                        <div className="flex justify-between gap-2 text-sm"><span className="text-slate-700">{it.name}</span><span className="font-mono text-slate-400">{it.level}</span></div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-900/[.06]"><div className="bar h-1.5 rounded-full bg-gradient-to-r from-[#0071e3] to-indigo-400" style={{ width: it.level + '%' }} /></div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-1.5">{s.items.map((it) => <span key={it.id} className="rounded-full bg-white/80 px-2.5 py-1 text-[13px] text-slate-600 ring-1 ring-slate-900/5">{it.name}</span>)}</div>
                )}
              </article>
            );
          })}
        </div>
        <div data-sel="interests" className="mt-10">
          <h3 className="font-display text-xl font-semibold tracking-tight text-[#1d1d1f]">{d.interestsHeading}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {d.interests.map((t) => (
              <button key={t.id} data-sel={'interest:' + t.id} onClick={() => setTag(tag === t.id ? null : t.id)} aria-pressed={tag === t.id}
                className={'min-h-[44px] rounded-full px-4 text-sm transition ' + (tag === t.id ? 'bg-[#1d1d1f] text-white font-medium shadow-md' : 'glass text-slate-700 hover:bg-white/90')}>
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-4 min-h-[1.6em] text-slate-700">{active ? active.blurb : <span className="text-slate-400">Tap a tag to see why it matters to me.</span>}</p>
        </div>
      </div>
    </section>
  );
}

function Achievements({ d }) {
  return (
    <section id="achievements" data-sel="achievements" className="px-4 py-12 @3xl:px-10 @3xl:py-16">
      <div className="mx-auto max-w-6xl">
        <H2>{d.achievementsHeading}</H2>
        <ol className="relative ml-2 border-l border-slate-900/10 @3xl:ml-4">
          {d.achievements.map((a) => (
            <li key={a.id} data-sel={'achievement:' + a.id} className="relative pb-8 pl-6 last:pb-0 @3xl:pl-10">
              <span className="absolute -left-[7px] top-6 h-3.5 w-3.5 rounded-full border-2 border-[#0071e3] bg-white shadow-[0_0_0_4px_rgba(0,113,227,.12)]" />
              <div className="glass lift grid gap-3 rounded-[24px] p-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:items-start">
                <div>
                  <div className="font-mono text-[13px] text-slate-400">{a.date} · {a.org}</div>
                  <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-[#1d1d1f]">{a.title}</h3>
                  <p className="mt-1 max-w-[62ch] text-slate-500">{a.description}</p>
                </div>
                <div className="w-fit rounded-2xl bg-white/80 px-4 py-2 ring-1 ring-slate-900/5 @3xl:text-right">
                  <div className="font-mono text-2xl font-medium tracking-tight text-[#0071e3] whitespace-nowrap">{a.metric}</div>
                  <div className="text-[13px] text-slate-500">{a.metricLabel}</div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Case({ d }) {
  return (
    <section id="caseStudy" data-sel="caseStudy" className="px-4 py-12 @3xl:px-10 @3xl:py-16">
      <div className="mx-auto max-w-6xl">
        <H2 sub={d.caseStudy.summary}>{d.caseStudy.title}</H2>
        <div className="-mt-3 mb-5 flex flex-wrap gap-1.5">{d.caseStudy.stack.map((s) => <span key={s} className="rounded-full bg-white/80 px-2.5 py-1 font-mono text-[12px] text-slate-600 ring-1 ring-slate-900/5">{s}</span>)}</div>
        <CaseStudy data={d.caseStudy} />
      </div>
    </section>
  );
}

function Projects({ d }) {
  return (
    <section id="projects" data-sel="projects" className="px-4 py-12 @3xl:px-10 @3xl:py-16">
      <div className="mx-auto max-w-6xl">
        <H2>{d.projectsHeading}</H2>
        <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {d.projects.map((p, i) => (
            <article key={p.id} data-sel={'project:' + p.id} className="glass lift flex flex-col overflow-hidden rounded-[24px]">
              <div className="relative m-2 mb-0 aspect-[16/9] overflow-hidden rounded-[18px] bg-slate-100">
                {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : <Placeholder seed={i} />}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-semibold tracking-tight text-[#1d1d1f]">{p.title}</h3>
                <p className="mt-1 flex-1 text-[15px] text-slate-500">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="rounded-full bg-slate-900/[.05] px-2.5 py-0.5 text-[12px] text-slate-600">{t}</span>)}</div>
                {p.url && <a href={safeUrl(p.url)} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[#0071e3] hover:underline">View project<ExternalLink size={14} /></a>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Generated cover art so projects never show an empty box: pastel spheres on soft light.
const PCOL = [['#fbcfe8', '#f9a8d4'], ['#bfdbfe', '#93c5fd'], ['#bbf7d0', '#86efac'], ['#ddd6fe', '#c4b5fd'], ['#fde68a', '#fcd34d'], ['#a5f3fc', '#67e8f9']];
function Placeholder({ seed }) {
  let s = seed * 9301 + 49297; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const balls = Array.from({ length: 5 }, (_, i) => ({ x: 30 + r() * 260, y: 30 + r() * 120, rad: 16 + r() * 26, c: PCOL[(seed + i) % PCOL.length] }));
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        <linearGradient id={'pg' + seed} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f8fafc" /><stop offset="1" stopColor="#eef2ff" /></linearGradient>
        {balls.map((b, i) => <radialGradient key={i} id={`pb${seed}-${i}`} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#fff" /><stop offset=".3" stopColor={b.c[0]} /><stop offset="1" stopColor={b.c[1]} /></radialGradient>)}
      </defs>
      <rect width="320" height="180" fill={`url(#pg${seed})`} />
      {balls.map((b, i) => <ellipse key={'s' + i} cx={b.x} cy={b.y + b.rad * 0.95} rx={b.rad * 0.8} ry={b.rad * 0.18} fill="#0f172a" opacity=".06" />)}
      {balls.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.rad} fill={`url(#pb${seed}-${i})`} />)}
    </svg>
  );
}

function Contact({ d, toast }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const email = d.contact.email;
    let ok = false;
    try { await navigator.clipboard.writeText(email); ok = true; } catch (e) {
      try { const t = document.createElement('textarea'); t.value = email; document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove(); } catch (e2) { ok = false; }
    }
    toast(ok ? `Copied ${email}` : `Couldn't reach the clipboard. The address is ${email}`);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); }
  };
  return (
    <section id="contact" data-sel="contact" className="px-4 py-12 @3xl:px-10 @3xl:py-20">
      <div className="glass mx-auto max-w-6xl rounded-[32px] p-6 @3xl:p-10">
        <div className="grid gap-8 @4xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] @4xl:items-center">
          <div>
            <h2 className="font-display text-[clamp(30px,4.4cqi,48px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#1d1d1f]">{d.contact.heading}</h2>
            <p className="mt-3 max-w-[52ch] text-[17px] text-slate-500">{d.contact.text}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={copy} className="flex min-h-[52px] items-center gap-2 rounded-full bg-[#1d1d1f] px-6 font-medium text-white shadow-[0_10px_24px_-10px_rgba(15,23,42,.6)] transition hover:bg-black active:scale-[.98]">
                {copied ? <Check size={18} /> : <Copy size={18} />}{copied ? 'Copied' : 'Copy email'}
              </button>
              <span className="select-all font-mono text-slate-700 [overflow-wrap:anywhere]">{d.contact.email}</span>
            </div>
          </div>
          <ul className="grid gap-2">
            {d.socials.map((s) => {
              const Icon = SOCIAL_ICONS[s.platform] || ExternalLink;
              return (
                <li key={s.id} data-sel={'social:' + s.id}>
                  <a href={safeUrl(s.url)} target="_blank" rel="noreferrer" className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-white/75 px-4 ring-1 ring-slate-900/5 transition hover:bg-white hover:shadow-md">
                    <Icon size={18} className="text-slate-700" />
                    <span className="text-sm text-slate-400 w-20">{s.platform}</span>
                    <span className="flex-1 truncate font-medium text-slate-800">{s.label}</span>
                    <ExternalLink size={14} className="text-slate-400" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

const RENDER = {
  hero: (d, x) => <Hero p={d.profile} ach={d.achievements} go={x.go} />,
  skills: (d) => <Skills d={d} />,
  achievements: (d) => <Achievements d={d} />,
  caseStudy: (d) => <Case d={d} />,
  projects: (d) => <Projects d={d} />,
  contact: (d, x) => <Contact d={d} toast={x.toast} />,
};

export default function Portfolio({ data, onAdmin, toast, studio = false }) {
  const shown = data.sections.filter((s) => s.visible && RENDER[s.id]);
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <div className="@container relative text-slate-700">
      <header className="sticky top-0 z-20 border-b border-slate-900/[.06] bg-[#FBFBFD]/70 backdrop-blur-xl backdrop-saturate-150">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 @3xl:px-10">
          <button onClick={() => go('hero')} className="flex min-h-[44px] items-center gap-2 font-display font-semibold tracking-tight text-[#1d1d1f]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1d1d1f] text-[12px] text-white">{data.profile.initials}</span>
            <span className="hidden @md:inline">{data.profile.name}</span>
          </button>
          <div className="ml-auto flex gap-1 overflow-x-auto">
            {shown.filter((s) => s.id !== 'hero').map((s) => (
              <button key={s.id} onClick={() => go(s.id)} className={'min-h-[44px] whitespace-nowrap rounded-full px-3 text-[13px] text-slate-600 transition hover:bg-slate-900/5 hover:text-[#1d1d1f] ' + (s.id === 'contact' ? '' : 'hidden @3xl:block')}>{s.label}</button>
            ))}
          </div>
        </nav>
      </header>
      <main>{shown.map((s) => <React.Fragment key={s.id}>{RENDER[s.id](data, { go, toast })}</React.Fragment>)}</main>
      <footer className="border-t border-slate-900/[.06] bg-[#FBFBFD]/60 px-4 py-6 backdrop-blur @3xl:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 text-[12px] text-slate-500">
          <span>© {new Date().getFullYear()} {data.profile.name}</span>
          {data.meta.showSampleNotice && <span>· Sample content shown. Replace it in Studio.</span>}
          <span className="hidden @3xl:inline">· Mind Predictor runs in your browser; no moves leave this page.</span>
          <button onClick={onAdmin} disabled={studio} aria-label="Admin" title="Admin"
            className="ml-auto grid h-11 w-11 place-items-center rounded-full text-slate-400 transition hover:bg-slate-900/5 hover:text-slate-700 disabled:opacity-40">
            <Lock size={15} />
          </button>
        </div>
      </footer>
    </div>
  );
}
