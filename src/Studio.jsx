import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Layers, Image as ImageIcon, Upload, Eye, EyeOff, ChevronUp, ChevronDown, Smartphone, Tablet, Monitor, Undo2, Redo2,
  MousePointer2, Hand, LogOut, Trash2, Plus, Copy, RotateCcw, Braces, PanelLeft, PanelRight, X, Film, HardDrive, AlertTriangle, Check, Settings2, Smile, Loader2, CloudUpload, Cloud, Globe,
} from 'lucide-react';
import Portfolio, { ICONS } from './Portfolio.jsx';
import Spheres from './Spheres.jsx';
import Stickman, { Figure, BallFigure, EXPRESSIONS, GESTURES } from './Stickman.jsx';
import { compressFace } from './face.js';
import { uid, SCHEMA_NOTE, migrate } from './data.js';
import { isCloud, uploadMedia, dataUrlToBlob } from './supabase.js';

const VIEWPORTS = {
  mobile: { label: 'Mobile', icon: Smartphone, w: 390, h: 844 },
  ipad: { label: 'iPad', icon: Tablet, w: 820, h: 1180 },
  desktop: { label: 'Desktop', icon: Monitor, w: 1280, h: 800 },
};
const LISTS = { skill: 'skills', interest: 'interests', achievement: 'achievements', project: 'projects', social: 'socials' };
const SECTION_OF = { skill: 'skills', interest: 'skills', interests: 'skills', achievement: 'achievements', project: 'projects', social: 'contact' };
const CHILDREN = { skills: ['skill', 'title'], achievements: ['achievement', 'title'], projects: ['project', 'title'], contact: ['social', 'platform'] };

/* ---------- small form controls ---------- */
const inputCls = 'w-full min-h-[44px] rounded-lg border border-white/10 bg-[#0a1020] px-3 text-base text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30';
function Field({ label, children, hint }) {
  return (<label className="block"><span className="mb-1 block text-[13px] text-slate-400">{label}</span>{children}{hint && <span className="mt-1 block text-[12px] text-slate-500">{hint}</span>}</label>);
}
function Text({ label, value, onChange, hint, type = 'text', id }) {
  return <Field label={label} hint={hint}><input id={id} type={type} className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Field>;
}
function Area({ label, value, onChange, rows = 3, id }) {
  return <Field label={label}><textarea id={id} rows={rows} className={inputCls + ' py-2 leading-snug'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Field>;
}
function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-[44px] w-full items-center justify-between gap-3 text-sm text-slate-200">
      {label}
      <span className={'relative h-6 w-11 rounded-full transition ' + (checked ? 'bg-cyan-400' : 'bg-slate-700')}><span className={'absolute top-0.5 h-5 w-5 rounded-full bg-white transition ' + (checked ? 'left-[22px]' : 'left-0.5')} /></span>
    </button>
  );
}
function IconBtn({ icon: Icon, label, onClick, active, disabled, danger, size = 16 }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className={'grid h-11 w-11 shrink-0 place-items-center rounded-lg transition disabled:opacity-30 ' + (active ? 'bg-cyan-400 text-slate-950' : danger ? 'text-slate-400 hover:bg-pink-500/15 hover:text-pink-300' : 'text-slate-300 hover:bg-white/10')}>
      <Icon size={size} />
    </button>
  );
}
function Group({ title, children, right }) {
  return (<div className="border-b border-white/5 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-[13px] font-semibold text-slate-300">{title}</h3>{right}</div><div className="space-y-3">{children}</div></div>);
}
function Btn({ children, onClick, icon: Icon, tone = 'plain', disabled }) {
  const t = tone === 'primary' ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-semibold' : tone === 'danger' ? 'border border-pink-400/30 text-pink-200 hover:bg-pink-500/10' : 'border border-white/10 text-slate-200 hover:bg-white/10';
  return <button type="button" onClick={onClick} disabled={disabled} className={'inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm transition disabled:pointer-events-none disabled:opacity-35 ' + t}>{Icon && <Icon size={15} className={Icon === Loader2 ? 'animate-spin' : ''} />}{children}</button>;
}

/* ---------- companion face ---------- */
// Shared by the Media panel and the Inspector. Every source (a new upload or a Media
// library image, even a session-only blob) is cropped and compressed to a small JPEG.
// With Supabase on, that JPEG is uploaded to the portfolio-media bucket and the JSON keeps
// its public URL; in preview mode the data URL itself lives inside the site JSON.
function useFaceSetter(update, toast) {
  const [busy, setBusy] = useState(false);
  const setFace = async (src) => {
    setBusy(true);
    try {
      let url;
      try { url = await compressFace(src); } catch (e) { return toast("Couldn't read that image. Try a JPG, PNG or WebP."); }
      if (isCloud) {
        try { url = await uploadMedia(dataUrlToBlob(url), 'faces', 'face.jpg'); }
        catch (e) { return toast("Couldn't upload the face: " + (e?.message || 'network error')); }
      }
      update((d) => ({ ...d, companion: { ...d.companion, face: url } }), 'companion-face');
      toast(isCloud ? 'Companion face uploaded. Publish to make it live.' : `Companion face set (${Math.max(1, Math.round(url.length / 1024))} KB)`);
    } finally { setBusy(false); }
  };
  const resetFace = () => { update((d) => ({ ...d, companion: { ...d.companion, face: '' } }), 'companion-face'); toast('Companion face reset to default'); };
  return { busy, setFace, resetFace };
}

function FaceSetting({ data, update, toast, idp }) {
  const input = useRef(null);
  const { busy, setFace, resetFace } = useFaceSetter(update, toast);
  const face = data.companion?.face || '';
  const images = data.media.filter((m) => m.type === 'image' && m.url);
  const onFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast(`Skipped ${f.name}: choose an image`);
    setFace(f);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="grid h-[76px] w-[60px] shrink-0 place-items-center overflow-hidden rounded-xl bg-[#FBFBFD] ring-1 ring-white/10">
          {data.companion?.style === 'ball' ? <BallFigure face={face} size={44} /> : <Figure face={face} width={40} height={58} />}
        </div>
        <div className="min-w-0 flex-1 text-[13px] text-slate-400">
          {face ? (face.startsWith('data:') ? <>Custom face, {Math.max(1, Math.round(face.length / 1024))} KB, saved with your site.</> : <>Custom face, stored in Supabase Storage.</>) : (data.companion?.style === 'ball' ? 'Drawn expressions. Upload a square-ish photo to wrap it on the ball as its face.' : 'Default drawn face. Upload a square-ish photo; it is cropped to a circle under the hat.')}
        </div>
      </div>
      <input ref={input} id={idp + '-face-file'} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} />
      <div className="flex flex-wrap gap-2">
        <Btn tone="primary" icon={busy ? Loader2 : Upload} onClick={() => !busy && input.current.click()}>{busy ? (isCloud ? 'Uploading…' : 'Processing…') : face ? 'Replace face' : 'Upload face'}</Btn>
        <Btn icon={RotateCcw} onClick={resetFace} disabled={!face}>Reset to default</Btn>
      </div>
      {images.length > 0 && (
        <Field label="Or use an image from Media">
          <div className="flex flex-wrap gap-2">
            {images.slice(0, 8).map((m) => (
              <button key={m.id} type="button" disabled={busy} onClick={() => setFace(m.url)} title={'Use ' + m.name + ' as the face'}
                className="h-11 w-11 overflow-hidden rounded-full ring-1 ring-white/15 transition hover:ring-2 hover:ring-cyan-400 disabled:opacity-40">
                <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}

/* ---------- media library ---------- */
function MediaPanel({ data, update, sel, toast }) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const add = (files) => {
    [...files].forEach((f) => {
      if (!/^(image|video)\//.test(f.type)) return toast(`Skipped ${f.name}: only images and video`);
      const blob = URL.createObjectURL(f); // instant preview
      const item = { id: uid('m'), name: f.name, type: f.type.startsWith('image') ? 'image' : 'video', size: f.size, url: blob, saved: false };
      if (isCloud) item.uploading = true;
      update((d) => ({ ...d, media: [item, ...d.media] }), 'media-add-' + item.id);
      // Swap the temporary blob: URL for its permanent URL everywhere it was already used.
      const swap = (url, extra) => update((d) => {
        const swapped = JSON.parse(JSON.stringify(d).split(blob).join(url));
        swapped.media = swapped.media.map((m) => (m.id === item.id ? { ...m, ...extra } : m));
        return swapped;
      }, 'media-sync', true);
      if (isCloud) {
        // Supabase: upload to the public portfolio-media bucket and keep the public URL.
        uploadMedia(f, item.type === 'video' ? 'videos' : 'images')
          .then((url) => { swap(url, { saved: true, uploading: false }); URL.revokeObjectURL(blob); toast(`Uploaded ${f.name}`, 'ok'); })
          .catch((e) => { update((d) => ({ ...d, media: d.media.map((m) => (m.id === item.id ? { ...m, uploading: false } : m)) }), 'media-sync', true); toast(`Couldn't upload ${f.name}: ${e?.message || 'network error'}`); });
        return;
      }
      // Preview mode: small images are inlined as data URLs so they survive a reload.
      if (item.type === 'image' && f.size < 1.2e6) {
        const r = new FileReader();
        r.onload = () => swap(r.result, { saved: true });
        r.readAsDataURL(f);
      }
    });
  };
  const selProject = sel?.startsWith('project:') ? sel.slice(8) : null;
  const assign = (m, where) => {
    if (where === 'avatar') update((d) => ({ ...d, profile: { ...d.profile, avatar: m.url } }));
    else update((d) => ({ ...d, projects: d.projects.map((p) => (p.id === where ? { ...p, image: m.url } : p)) }));
    toast(where === 'avatar' ? 'Set as profile photo' : 'Set as project cover');
  };
  const { setFace } = useFaceSetter(update, toast);
  return (
    <div className="p-3">
      <section className="mb-4 rounded-xl border border-white/10 bg-white/[.03] p-3" aria-labelledby="media-face-h">
        <h3 id="media-face-h" className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-300"><Smile size={15} />Companion Face</h3>
        <FaceSetting data={data} update={update} toast={toast} idp="media" />
      </section>
      <input ref={input} id="media-file" type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      <button type="button" onClick={() => input.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        className={'flex w-full flex-col items-center gap-1 rounded-xl border border-dashed px-3 py-5 text-sm transition ' + (drag ? 'border-cyan-400 bg-cyan-400/10 text-cyan-100' : 'border-white/15 text-slate-300 hover:bg-white/5')}>
        <Upload size={18} />Add images or a demo video<span className="text-[12px] text-slate-500">Tap to browse, or drop files</span>
      </button>
      {data.media.length === 0 && <p className="mt-3 text-[13px] text-slate-500">{isCloud ? 'No media yet. Files upload to Supabase Storage; publish to show them on the live site.' : 'No media yet. Images under 1.2 MB are saved with your edits; larger files and videos stay for this session.'}</p>}
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {data.media.map((m) => (
          <li key={m.id} className="overflow-hidden rounded-lg border border-white/10 bg-[#0a1020]">
            <div className="relative aspect-video bg-black/40">
              {m.url ? (m.type === 'image' ? <img src={m.url} alt="" className="h-full w-full object-cover" /> : <video src={m.url} className="h-full w-full object-cover" muted playsInline controls />)
                : <div className="grid h-full place-items-center text-[12px] text-slate-500">Expired, re-add</div>}
              {m.type === 'video' && <Film size={14} className="absolute left-1.5 top-1.5 text-white/80" />}
            </div>
            <div className="truncate px-2 pt-1 text-[12px] text-slate-300" title={m.name}>{m.name}</div>
            <div className="px-2 text-[11px] text-slate-500">{(m.size / 1024).toFixed(0)} KB · {m.uploading ? 'uploading…' : m.saved ? (isCloud && /^https?:/.test(m.url) ? 'in cloud' : 'saved') : 'session only'}</div>
            <div className="flex flex-wrap gap-1 p-1">
              {m.type === 'image' && m.url && <button className="min-h-[36px] flex-1 rounded-md bg-white/5 px-1 text-[12px] hover:bg-white/10" onClick={() => assign(m, 'avatar')}>Avatar</button>}
              {m.type === 'image' && m.url && <button className="min-h-[36px] flex-1 rounded-md bg-white/5 px-1 text-[12px] hover:bg-white/10" onClick={() => setFace(m.url)}>Face</button>}
              {m.type === 'image' && m.url && selProject && <button className="min-h-[36px] flex-1 rounded-md bg-cyan-400/15 px-1 text-[12px] text-cyan-100 hover:bg-cyan-400/25" onClick={() => assign(m, selProject)}>Cover</button>}
              <button aria-label="Remove" className="grid min-h-[36px] w-9 place-items-center rounded-md text-slate-400 hover:bg-pink-500/15 hover:text-pink-300"
                onClick={() => { if (m.url.startsWith('blob:')) URL.revokeObjectURL(m.url); update((d) => ({ ...d, media: d.media.filter((x) => x.id !== m.id) })); }}><Trash2 size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
      {data.media.some((m) => m.type === 'image') && <p className="mt-2 text-[12px] text-slate-500">Select a project in Layers to show the Cover button.</p>}
    </div>
  );
}

/* ---------- layers ---------- */
function LayersPanel({ data, update, sel, setSel }) {
  const move = (i, dir) => update((d) => {
    const s = d.sections.slice(); const j = i + dir; if (j < 0 || j >= s.length) return d;
    [s[i], s[j]] = [s[j], s[i]]; return { ...d, sections: s };
  });
  return (
    <ul className="p-2">
      {data.sections.map((s, i) => {
        const kids = CHILDREN[s.id];
        const list = kids ? data[LISTS[kids[0]]] : [];
        const on = sel === s.id || SECTION_OF[sel?.split(':')[0]] === s.id;
        return (
          <li key={s.id} className="mb-1">
            <div className={'flex items-center rounded-lg ' + (sel === s.id ? 'bg-cyan-400/15 ring-1 ring-cyan-400/50' : on ? 'bg-white/[.04]' : 'hover:bg-white/5')}>
              <button type="button" onClick={() => setSel(s.id)} className={'flex min-h-[44px] flex-1 items-center gap-2 px-2 text-left text-sm ' + (s.visible ? 'text-slate-100' : 'text-slate-500 line-through')}>
                <Layers size={14} className="text-cyan-300/80" />{s.label}
              </button>
              <IconBtn icon={ChevronUp} label="Move up" disabled={i === 0} onClick={() => move(i, -1)} size={14} />
              <IconBtn icon={ChevronDown} label="Move down" disabled={i === data.sections.length - 1} onClick={() => move(i, 1)} size={14} />
              <IconBtn icon={s.visible ? Eye : EyeOff} label={s.visible ? 'Hide section' : 'Show section'} onClick={() => update((d) => ({ ...d, sections: d.sections.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)) }))} size={14} />
            </div>
            {kids && on && (
              <ul className="ml-5 mt-1 border-l border-white/10 pl-2">
                {list.map((it) => {
                  const key = kids[0] + ':' + it.id;
                  return (
                    <li key={it.id}><button type="button" onClick={() => setSel(key)} className={'block min-h-[40px] w-full truncate rounded-md px-2 text-left text-[13px] ' + (sel === key ? 'bg-cyan-400/15 text-cyan-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200')}>{it[kids[1]] || 'Untitled'}</button></li>
                  );
                })}
                {s.id === 'skills' && <li><button type="button" onClick={() => setSel('interests')} className={'block min-h-[40px] w-full rounded-md px-2 text-left text-[13px] ' + (sel?.startsWith('interest') ? 'bg-cyan-400/15 text-cyan-100' : 'text-slate-400 hover:bg-white/5')}>Interest tags</button></li>}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- companion settings ---------- */
const SPEECH = [['hero', 'Hero'], ['skills', 'Skills'], ['caseStudy', 'Case Study'], ['achievements', 'Achievements'], ['projects', 'Projects'], ['contact', 'Contact']];
function CompanionStyle({ value, onChange }) {
  const opts = [['stickman', 'Animated Stickman', 'Waves, points, thumbs up, tips his hat'], ['ball', 'Rolling Facial Ball', 'Rolls toward the cursor, changes expression']];
  return (
    <div role="radiogroup" aria-label="Companion style" className="grid grid-cols-2 gap-2">
      {opts.map(([k, l, d]) => {
        const on = (value || 'stickman') === k;
        return (
          <button key={k} type="button" role="radio" aria-checked={on} onClick={() => onChange(k)}
            className={'flex min-h-[44px] flex-col items-center gap-2 rounded-xl border p-3 text-center transition ' + (on ? 'border-cyan-400 bg-cyan-400/10 ring-2 ring-cyan-400/30' : 'border-white/10 hover:bg-white/5')}>
            <span className="grid h-[64px] w-full place-items-center rounded-lg bg-[#FBFBFD]">
              {k === 'ball' ? <span className="cball"><BallFigure size={44} expr="happy" /></span> : <span className="gent gent-hero"><Figure width={36} height={52} /></span>}
            </span>
            <span className={'text-[13px] font-semibold ' + (on ? 'text-cyan-200' : 'text-slate-200')}>{l}</span>
            <span className="text-[11px] leading-snug text-slate-500">{d}</span>
          </button>
        );
      })}
    </div>
  );
}
function SpeechGroup({ data, set }) {
  const ball = data.companion?.style === 'ball';
  return (
    <Group title="Speech bubbles">
      <p className="text-[13px] text-slate-500">What the companion says in each section. Updates the preview as you type; leave one empty to keep it quiet there.</p>
      {SPEECH.map(([k, l]) => (
        <Text key={k} id={'cp-' + k} label={l} value={data.companion?.[k]} onChange={(v) => set('companion.' + k, v)}
          hint={ball ? 'Expression: ' + EXPRESSIONS[k] : 'Gesture: ' + GESTURES[k]} />
      ))}
    </Group>
  );
}

/* ---------- inspector ---------- */
function ListHead({ title, onAdd }) {
  return <div className="flex items-center justify-between"><span className="text-[13px] text-slate-400">{title}</span><Btn icon={Plus} onClick={onAdd}>Add</Btn></div>;
}

function Inspector({ data, update, sel, setSel, storage, onReset, toast }) {
  const [kind, id] = (sel || '').split(':');
  const sectionId = id ? SECTION_OF[kind] : (SECTION_OF[kind] || kind);
  const section = data.sections.find((s) => s.id === sectionId);
  const set = (path, value) => update((d) => {
    const next = { ...d }; let o = next; const keys = path.split('.');
    keys.slice(0, -1).forEach((k) => { o[k] = Array.isArray(o[k]) ? o[k].slice() : { ...o[k] }; o = o[k]; });
    o[keys[keys.length - 1]] = value; return next;
  }, path);
  const listKey = LISTS[kind];
  const item = listKey && data[listKey].find((x) => x.id === id);
  const patch = (lk, iid, p, f) => update((d) => ({ ...d, [lk]: d[lk].map((x) => (x.id === iid ? { ...x, ...p } : x)) }), lk + iid + f);
  const remove = (lk, iid) => { update((d) => ({ ...d, [lk]: d[lk].filter((x) => x.id !== iid) })); setSel(SECTION_OF[kind] === 'skills' && kind === 'interest' ? 'interests' : sectionId); };
  const add = (lk, obj, k) => { update((d) => ({ ...d, [lk]: [...d[lk], obj] })); if (k) setSel(k + ':' + obj.id); };
  const moveItem = (lk, iid, dir) => update((d) => {
    const a = d[lk].slice(); const i = a.findIndex((x) => x.id === iid); const j = i + dir; if (j < 0 || j >= a.length) return d;
    [a[i], a[j]] = [a[j], a[i]]; return { ...d, [lk]: a };
  });
  const [json, setJson] = useState('');
  const copyJson = async () => {
    const txt = JSON.stringify(data, null, 2);
    try { await navigator.clipboard.writeText(txt); toast('Site JSON copied'); } catch (e) { setJson(txt); toast('Clipboard blocked, JSON shown below to copy'); }
  };
  const images = data.media.filter((m) => m.type === 'image' && m.url);
  const MediaPick = ({ value, onPick, label }) => (
    <Field label={label} hint={images.length ? null : 'Add images in Media first.'}>
      <div className="flex flex-wrap gap-2">
        {value && <img src={value} alt="" className="h-12 w-12 rounded-md object-cover ring-2 ring-cyan-400" />}
        {images.filter((m) => m.url !== value).slice(0, 6).map((m) => <button key={m.id} type="button" onClick={() => onPick(m.url)} className="h-12 w-12 overflow-hidden rounded-md ring-1 ring-white/10 hover:ring-cyan-400"><img src={m.url} alt={m.name} className="h-full w-full object-cover" /></button>)}
        {value && <Btn onClick={() => onPick('')}>Clear</Btn>}
      </div>
    </Field>
  );

  const sectionHeader = section && (
    <Group title="Section">
      <Text id="sec-label" label="Menu label" value={section.label} onChange={(v) => update((d) => ({ ...d, sections: d.sections.map((s) => (s.id === section.id ? { ...s, label: v } : s)) }), 'sec' + section.id)} />
      <Toggle label="Visible on site" checked={section.visible} onChange={(v) => update((d) => ({ ...d, sections: d.sections.map((s) => (s.id === section.id ? { ...s, visible: v } : s)) }))} />
      {SPEECH.some(([k]) => k === section.id) && (
        <Text id={'sec-say-' + section.id} label="Companion speech bubble" value={data.companion?.[section.id]} onChange={(v) => set('companion.' + section.id, v)}
          hint={(data.companion?.style === 'ball' ? 'Expression: ' + EXPRESSIONS[section.id] : 'Gesture: ' + GESTURES[section.id]) + '. Leave empty to stay quiet here.'} />
      )}
    </Group>
  );

  let body = null;
  if (!sel) {
    body = (
      <>
        <Group title="Saving">
          <div className={'flex items-start gap-2 rounded-lg p-3 text-[13px] ' + (storage === 'local' || storage === 'cloud' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200')}>
            {storage === 'cloud' ? <Cloud size={15} className="mt-0.5" /> : storage === 'local' ? <HardDrive size={15} className="mt-0.5" /> : <AlertTriangle size={15} className="mt-0.5" />}
            <span>{storage === 'cloud' ? 'Connected to Supabase. Edits stay in this tab until you press Save & Publish, then everyone sees them.' : storage === 'local' ? 'Edits save to this browser automatically.' : storage === 'quota' ? 'Browser storage is full. Remove large images; edits are kept in memory for now.' : 'This browser blocks local storage here, so edits live in memory until you close the tab. Copy the JSON to keep them.'}</span>
          </div>
          <Toggle label="Show sample-content note in footer" checked={data.meta.showSampleNotice} onChange={(v) => set('meta.showSampleNotice', v)} />
        </Group>
        <Group title="Site data (JSON)">
          <p className="text-[13px] text-slate-400">Everything on the site is one JSON object, stored in the portfolio_data table (row id 'main').</p>
          <div className="flex flex-wrap gap-2"><Btn icon={Copy} onClick={copyJson}>Copy JSON</Btn><Btn icon={Braces} onClick={() => setJson(json ? '' : JSON.stringify(data, null, 2))}>{json ? 'Hide' : 'View / import'}</Btn></div>
          {json && (<>
            <textarea id="json-io" rows={10} className={inputCls + ' py-2 font-mono text-[12px]'} value={json} onChange={(e) => setJson(e.target.value)} />
            <Btn tone="primary" icon={Check} onClick={() => { try { const p = JSON.parse(json); if (!p.profile || !p.sections) throw new Error('missing keys'); update(() => migrate(p)); toast('JSON imported'); setJson(''); } catch (e) { toast('That JSON could not be read: ' + e.message); } }}>Apply JSON</Btn>
          </>)}
          <pre className="overflow-x-auto rounded-lg bg-[#0a1020] p-3 font-mono text-[11px] leading-relaxed text-slate-400">{SCHEMA_NOTE}</pre>
        </Group>
        <Group title="Companion Settings">
          <Toggle label="Show the companion" checked={data.companion?.enabled !== false} onChange={(v) => set('companion.enabled', v)} />
          <CompanionStyle value={data.companion?.style} onChange={(v) => set('companion.style', v)} />
        </Group>
        <Group title="Companion Face">
          <FaceSetting data={data} update={update} toast={toast} idp="insp" />
        </Group>
        <SpeechGroup data={data} set={set} />
        <Group title="Reset"><Btn tone="danger" icon={RotateCcw} onClick={onReset}>Reset to sample content</Btn></Group>
      </>
    );
  } else if (kind === 'hero') {
    const p = data.profile; const sp = (k) => (v) => set('profile.' + k, v);
    body = (<>
      <Group title="Identity">
        <Text id="p-name" label="Name" value={p.name} onChange={sp('name')} />
        <Text id="p-initials" label="Initials (logo)" value={p.initials} onChange={(v) => sp('initials')(v.slice(0, 3))} />
        <Text id="p-avail" label="Availability badge" value={p.availability} onChange={sp('availability')} />
        <Text id="p-loc" label="Location" value={p.location} onChange={sp('location')} />
        <MediaPick label="Profile photo" value={p.avatar} onPick={sp('avatar')} />
      </Group>
      <Group title="Cycling roles" right={<Btn icon={Plus} onClick={() => set('profile.roles', [...p.roles, 'New role'])}>Add</Btn>}>
        {p.roles.map((r, i) => (
          <div key={i} className="flex gap-1"><input aria-label={'Role ' + (i + 1)} className={inputCls} value={r} onChange={(e) => set('profile.roles', p.roles.map((x, j) => (j === i ? e.target.value : x)))} />
            <IconBtn icon={Trash2} danger label="Remove role" onClick={() => set('profile.roles', p.roles.filter((_, j) => j !== i))} /></div>
        ))}
      </Group>
      <Group title="Pitch & buttons">
        <Area id="p-tag" label="Value proposition" value={p.tagline} onChange={sp('tagline')} rows={4} />
        <Text id="p-cta1" label="Primary button" value={p.ctaPrimary} onChange={sp('ctaPrimary')} />
        <Text id="p-cta2" label="Secondary button" value={p.ctaSecondary} onChange={sp('ctaSecondary')} />
        <Text id="p-cv" label="Résumé URL" type="url" value={p.resumeUrl} onChange={sp('resumeUrl')} hint="Leave empty to hide the link." />
      </Group>
    </>);
  } else if (kind === 'skills') {
    body = (<Group title="Content">
      <Text id="s-h" label="Skills heading" value={data.skillsHeading} onChange={(v) => set('skillsHeading', v)} />
      <ListHead title="Skill cards" onAdd={() => add('skills', { id: uid('sk'), title: 'New area', icon: 'Sparkles', summary: 'What you do here.', items: [] }, 'skill')} />
      {data.skills.map((s) => <Btn key={s.id} onClick={() => setSel('skill:' + s.id)}>{s.title}</Btn>)}
      <Btn onClick={() => setSel('interests')}>Edit interest tags</Btn>
    </Group>);
  } else if (kind === 'skill' && item) {
    const items = item.items;
    const setItems = (next, f) => patch('skills', item.id, { items: next }, f);
    body = (<>
      <Group title="Card" right={<div className="flex"><IconBtn icon={ChevronUp} label="Move left" onClick={() => moveItem('skills', item.id, -1)} /><IconBtn icon={ChevronDown} label="Move right" onClick={() => moveItem('skills', item.id, 1)} /><IconBtn icon={Trash2} danger label="Delete card" onClick={() => remove('skills', item.id)} /></div>}>
        <Text id="sk-title" label="Title" value={item.title} onChange={(v) => patch('skills', item.id, { title: v }, 'title')} />
        <Field label="Icon"><div className="flex flex-wrap gap-1">{Object.entries(ICONS).map(([k, I]) => <IconBtn key={k} icon={I} label={k} active={item.icon === k} onClick={() => patch('skills', item.id, { icon: k })} />)}</div></Field>
        <Area id="sk-sum" label="Summary" value={item.summary} onChange={(v) => patch('skills', item.id, { summary: v }, 'sum')} />
      </Group>
      <Group title="Skills" right={<Btn icon={Plus} onClick={() => setItems([...items, { id: uid('i'), name: 'New skill', level: 60 }])}>Add</Btn>}>
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border border-white/5 p-2">
            <div className="flex gap-1"><input aria-label="Skill name" className={inputCls} value={it.name} onChange={(e) => setItems(items.map((x) => (x.id === it.id ? { ...x, name: e.target.value } : x)), 'n' + it.id)} />
              <IconBtn icon={Trash2} danger label="Remove skill" onClick={() => setItems(items.filter((x) => x.id !== it.id))} /></div>
            <div className="mt-1 flex items-center gap-3"><input aria-label="Level" type="range" min="0" max="100" value={it.level} className="h-11 flex-1 accent-cyan-400" onChange={(e) => setItems(items.map((x) => (x.id === it.id ? { ...x, level: +e.target.value } : x)), 'l' + it.id)} /><span className="w-8 text-right font-mono text-sm text-slate-300">{it.level}</span></div>
          </div>
        ))}
      </Group>
    </>);
  } else if (kind === 'interests' || kind === 'interest') {
    body = (<Group title="Interest tags" right={<Btn icon={Plus} onClick={() => add('interests', { id: uid('in'), label: 'New interest', blurb: '' }, 'interest')}>Add</Btn>}>
      <Text id="in-h" label="Heading" value={data.interestsHeading} onChange={(v) => set('interestsHeading', v)} />
      {data.interests.map((t) => (
        <div key={t.id} className={'rounded-lg border p-2 ' + (t.id === id ? 'border-cyan-400/60' : 'border-white/5')}>
          <div className="flex gap-1"><input aria-label="Tag label" className={inputCls} value={t.label} onChange={(e) => patch('interests', t.id, { label: e.target.value }, 'l')} />
            <IconBtn icon={Trash2} danger label="Remove tag" onClick={() => remove('interests', t.id)} /></div>
          <textarea aria-label="Tag description" rows={2} className={inputCls + ' mt-1 py-2'} value={t.blurb} onChange={(e) => patch('interests', t.id, { blurb: e.target.value }, 'b')} />
        </div>
      ))}
    </Group>);
  } else if (kind === 'achievements') {
    body = (<Group title="Content">
      <Text id="a-h" label="Heading" value={data.achievementsHeading} onChange={(v) => set('achievementsHeading', v)} />
      <ListHead title="Timeline entries" onAdd={() => add('achievements', { id: uid('a'), date: String(new Date().getFullYear()), title: 'New achievement', org: 'Company', metric: '+0%', metricLabel: 'what improved', description: '' }, 'achievement')} />
      {data.achievements.map((a) => <Btn key={a.id} onClick={() => setSel('achievement:' + a.id)}>{a.date} · {a.title}</Btn>)}
    </Group>);
  } else if (kind === 'achievement' && item) {
    const f = (k) => (v) => patch('achievements', item.id, { [k]: v }, k);
    body = (<Group title="Timeline entry" right={<div className="flex"><IconBtn icon={ChevronUp} label="Move up" onClick={() => moveItem('achievements', item.id, -1)} /><IconBtn icon={ChevronDown} label="Move down" onClick={() => moveItem('achievements', item.id, 1)} /><IconBtn icon={Trash2} danger label="Delete entry" onClick={() => remove('achievements', item.id)} /></div>}>
      <div className="grid grid-cols-2 gap-2"><Text id="a-date" label="Date" value={item.date} onChange={f('date')} /><Text id="a-org" label="Organisation" value={item.org} onChange={f('org')} /></div>
      <Text id="a-title" label="Title" value={item.title} onChange={f('title')} />
      <div className="grid grid-cols-2 gap-2"><Text id="a-metric" label="Metric" value={item.metric} onChange={f('metric')} /><Text id="a-ml" label="Metric label" value={item.metricLabel} onChange={f('metricLabel')} /></div>
      <Area id="a-desc" label="Description" value={item.description} onChange={f('description')} rows={4} />
    </Group>);
  } else if (kind === 'caseStudy') {
    const c = data.caseStudy;
    body = (<><Group title="Case study">
      <Text id="c-title" label="Title" value={c.title} onChange={(v) => set('caseStudy.title', v)} />
      <Area id="c-sum" label="Summary" value={c.summary} onChange={(v) => set('caseStudy.summary', v)} rows={5} />
      <Text id="c-stack" label="Stack (comma separated)" value={c.stack.join(', ')} onChange={(v) => set('caseStudy.stack', v.split(',').map((s) => s.trim()).filter(Boolean))} />
    </Group>
    <Group title="Game buttons">
      <div className="grid grid-cols-2 gap-2"><Text id="c-left" label="Left choice" value={c.leftLabel} onChange={(v) => set('caseStudy.leftLabel', v)} /><Text id="c-right" label="Right choice" value={c.rightLabel} onChange={(v) => set('caseStudy.rightLabel', v)} /></div>
      <div className="grid grid-cols-2 gap-2"><Text id="c-up" label="Up choice (4-Arrow)" value={c.upLabel} onChange={(v) => set('caseStudy.upLabel', v)} /><Text id="c-down" label="Down choice (4-Arrow)" value={c.downLabel} onChange={(v) => set('caseStudy.downLabel', v)} /></div>
    </Group>
    <Group title="Data Analyst Insight (2 lines)">
      <Area id="c-i1" label="Line 1" value={c.insight1} onChange={(v) => set('caseStudy.insight1', v)} rows={3} />
      <Area id="c-i2" label="Line 2" value={c.insight2} onChange={(v) => set('caseStudy.insight2', v)} rows={3} />
      <p className="text-[13px] text-slate-500">Visitors pick 2-Arrow or 4-Arrow and Hard (2 to 3 move n-gram) or Brutal (self-weighting ensemble of 1 to 4 move patterns, frequency bias and anti-alternation). Switch the canvas to Interact (H) to play it here.</p>
    </Group></>);
  } else if (kind === 'projects') {
    body = (<Group title="Content">
      <Text id="pr-h" label="Heading" value={data.projectsHeading} onChange={(v) => set('projectsHeading', v)} />
      <ListHead title="Projects" onAdd={() => add('projects', { id: uid('p'), title: 'New project', description: '', tags: [], url: '', image: '' }, 'project')} />
      {data.projects.map((p) => <Btn key={p.id} onClick={() => setSel('project:' + p.id)}>{p.title}</Btn>)}
    </Group>);
  } else if (kind === 'project' && item) {
    const f = (k) => (v) => patch('projects', item.id, { [k]: v }, k);
    body = (<Group title="Project" right={<div className="flex"><IconBtn icon={ChevronUp} label="Move earlier" onClick={() => moveItem('projects', item.id, -1)} /><IconBtn icon={ChevronDown} label="Move later" onClick={() => moveItem('projects', item.id, 1)} /><IconBtn icon={Trash2} danger label="Delete project" onClick={() => remove('projects', item.id)} /></div>}>
      <Text id="pj-title" label="Title" value={item.title} onChange={f('title')} />
      <Area id="pj-desc" label="Description" value={item.description} onChange={f('description')} rows={4} />
      <Text id="pj-tags" label="Tags (comma separated)" value={item.tags.join(', ')} onChange={(v) => f('tags')(v.split(',').map((s) => s.trim()).filter(Boolean))} />
      <Text id="pj-url" label="Link" type="url" value={item.url} onChange={f('url')} hint="https:// links only; others are disabled." />
      <MediaPick label="Cover image" value={item.image} onPick={f('image')} />
    </Group>);
  } else if (kind === 'contact' || kind === 'social') {
    const c = data.contact;
    body = (<>
      <Group title="Contact">
        <Text id="ct-h" label="Heading" value={c.heading} onChange={(v) => set('contact.heading', v)} />
        <Area id="ct-t" label="Text" value={c.text} onChange={(v) => set('contact.text', v)} />
        <Text id="ct-e" label="Email" type="email" value={c.email} onChange={(v) => set('contact.email', v)} />
      </Group>
      <Group title="Social links" right={<Btn icon={Plus} onClick={() => add('socials', { id: uid('s'), platform: 'Other', label: 'New link', url: 'https://' }, 'social')}>Add</Btn>}>
        {data.socials.map((s) => (
          <div key={s.id} className={'space-y-1 rounded-lg border p-2 ' + (s.id === id ? 'border-cyan-400/60' : 'border-white/5')}>
            <div className="flex gap-1">
              <select aria-label="Platform" className={inputCls} value={s.platform} onChange={(e) => patch('socials', s.id, { platform: e.target.value })}>{['GitHub', 'LinkedIn', 'X', 'Website', 'Email', 'Other'].map((p) => <option key={p}>{p}</option>)}</select>
              <IconBtn icon={ChevronUp} label="Move up" onClick={() => moveItem('socials', s.id, -1)} />
              <IconBtn icon={Trash2} danger label="Remove link" onClick={() => remove('socials', s.id)} />
            </div>
            <input aria-label="Link text" className={inputCls} value={s.label} onChange={(e) => patch('socials', s.id, { label: e.target.value }, 'l')} />
            <input aria-label="URL" type="url" className={inputCls} value={s.url} onChange={(e) => patch('socials', s.id, { url: e.target.value }, 'u')} />
          </div>
        ))}
      </Group>
    </>);
  } else {
    body = <p className="p-4 text-sm text-slate-400">That item no longer exists.</p>;
  }

  const crumbs = sel ? [section?.label, item && (item.title || item.platform || item.label)].filter(Boolean) : ['Site settings'];
  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/5 bg-[#0b1222] px-4 py-2">
        <Settings2 size={15} className="text-violet-300" />
        <span className="flex-1 truncate text-sm font-semibold text-white">{crumbs.join(' › ')}</span>
        {sel && <IconBtn icon={X} label="Deselect" onClick={() => setSel(null)} />}
      </div>
      {sel && sectionHeader}
      {body}
    </div>
  );
}

/* ---------- studio shell ---------- */
export default function Studio({ data, update, undo, redo, canUndo, canRedo, storage, onExit, onReset, toast, onPublish, publishing, dirty, onSignOut, userEmail }) {
  const [sel, setSel] = useState('hero');
  const [vp, setVp] = useState('desktop');
  const [mode, setMode] = useState('select');
  const [tab, setTab] = useState('layers');
  const [drawer, setDrawer] = useState(null); // 'left' | 'right' on small screens
  const stage = useRef(null);
  const frameRef = useRef(null);
  const scroller = useRef(null);
  const [box, setBox] = useState({ w: 900, h: 700 });

  useEffect(() => {
    const el = stage.current; const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const k = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (e.key === 'v') setMode('select'); else if (e.key === 'h') setMode('interact');
      else if (e.key === 'Escape') setSel(null);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [undo, redo]);

  const V = VIEWPORTS[vp];
  const pad = 24;
  const scale = vp === 'desktop' ? Math.min(1, (box.w - pad) / V.w) : Math.min(1, (box.w - pad) / V.w, (box.h - pad) / V.h);
  const frameH = vp === 'desktop' ? (box.h - pad) / scale : V.h;

  const pick = (e) => {
    if (mode !== 'select') return;
    const el = e.target.closest('[data-sel]');
    e.preventDefault(); e.stopPropagation();
    setSel(el ? el.dataset.sel : null);
    if (el && window.innerWidth < 1024) setDrawer('right');
  };
  const choose = (s) => {
    setSel(s);
    const anchor = document.querySelector(`.studio-frame [data-sel="${s}"]`) || document.querySelector(`.studio-frame [data-sel="${SECTION_OF[s.split(':')[0]] || s}"]`);
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (window.innerWidth < 1024) setDrawer('right');
  };
  const selCss = useMemo(() => (sel && /^[\w:]+$/.test(sel) ? `.studio-frame [data-sel="${sel}"]{outline:2px solid #22d3ee!important;outline-offset:3px;border-radius:14px}` : ''), [sel]);

  const left = (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-white/5 p-2">
        {[['layers', 'Layers', Layers], ['media', 'Media', ImageIcon]].map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg text-sm ' + (tab === k ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5')}><I size={15} />{l}{k === 'media' && data.media.length > 0 && <span className="rounded bg-violet-400/30 px-1.5 text-[11px]">{data.media.length}</span>}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {tab === 'layers' ? <LayersPanel data={data} update={update} sel={sel} setSel={choose} /> : <MediaPanel data={data} update={update} sel={sel} toast={toast} />}
      </div>
      <button onClick={() => setSel(null)} className="flex min-h-[48px] items-center gap-2 border-t border-white/5 px-4 text-sm text-slate-400 hover:bg-white/5"><Braces size={15} />Site settings & JSON</button>
    </div>
  );
  const right = <Inspector data={data} update={update} sel={sel} setSel={setSel} storage={storage} onReset={onReset} toast={toast} />;

  return (
    <div className="studio-root fixed inset-0 flex flex-col bg-[#05080f] text-slate-200">
      <style>{selCss}</style>
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#0b1222] px-2 py-1">
        <IconBtn icon={PanelLeft} label="Layers and media" onClick={() => setDrawer(drawer === 'left' ? null : 'left')} active={drawer === 'left'} />
        <span className="mr-2 hidden items-center gap-2 font-display font-semibold text-white sm:flex"><span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />Studio</span>
        <IconBtn icon={Undo2} label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo} />
        <IconBtn icon={Redo2} label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo} />
        <div className="mx-1 flex rounded-lg bg-white/5 p-0.5">
          <IconBtn icon={MousePointer2} label="Select (V)" active={mode === 'select'} onClick={() => setMode('select')} />
          <IconBtn icon={Hand} label="Interact (H)" active={mode === 'interact'} onClick={() => setMode('interact')} />
        </div>
        <div className="mx-auto flex rounded-lg bg-white/5 p-0.5" role="group" aria-label="Viewport">
          {Object.entries(VIEWPORTS).map(([k, v]) => (
            <button key={k} onClick={() => setVp(k)} aria-pressed={vp === k} className={'flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm ' + (vp === k ? 'bg-violet-400 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-white/10')}>
              <v.icon size={16} /><span className="hidden md:inline">{v.label}</span>
            </button>
          ))}
        </div>
        <span className="hidden whitespace-nowrap font-mono text-[12px] text-slate-500 xl:inline">{V.w}×{vp === 'desktop' ? Math.round(frameH) : V.h} · {Math.round(scale * 100)}%</span>
        {isCloud ? (
          <span title={userEmail ? 'Signed in as ' + userEmail : ''} className={'hidden items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[12px] lg:flex ' + (dirty ? 'bg-amber-400/10 text-amber-300' : 'text-emerald-300')}>
            {dirty ? <AlertTriangle size={13} /> : <Check size={13} />}{dirty ? 'Unpublished changes' : 'Published'}
          </span>
        ) : (
          <span title={storage === 'local' ? 'Saved in this browser' : 'Not saved: in memory only'} className={'hidden items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[12px] lg:flex ' + (storage === 'local' ? 'text-emerald-300' : 'bg-amber-400/10 text-amber-300')}>
            {storage === 'local' ? <Check size={13} /> : <AlertTriangle size={13} />}{storage === 'local' ? 'Saved locally' : 'Memory only'}
          </span>
        )}
        <button onClick={onPublish} disabled={publishing} aria-busy={publishing} title={isCloud ? 'Save & Publish to Supabase' : 'Preview mode: saves in this browser'}
          className={'relative flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-semibold disabled:opacity-70 ' + (isCloud && dirty ? 'bg-violet-400 text-slate-950 hover:bg-violet-300' : 'bg-white/10 text-white hover:bg-white/15')}>
          {publishing ? <Loader2 size={15} className="animate-spin" /> : <CloudUpload size={15} />}
          <span className="hidden sm:inline">{publishing ? 'Publishing…' : 'Save & Publish'}</span>
          {isCloud && dirty && !publishing && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-[#0b1222] sm:hidden" />}
        </button>
        <button onClick={onExit} className="flex min-h-[44px] items-center gap-2 rounded-lg bg-cyan-400 px-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"><Globe size={15} /><span className="hidden sm:inline">Public view</span></button>
        <button onClick={onSignOut} title={userEmail ? 'Signed in as ' + userEmail : 'Lock the Studio'} aria-label="Sign out"
          className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm text-slate-300 hover:bg-pink-500/15 hover:text-pink-200"><LogOut size={15} /><span className="hidden md:inline">Sign out</span></button>
        <IconBtn icon={PanelRight} label="Inspector" onClick={() => setDrawer(drawer === 'right' ? null : 'right')} active={drawer === 'right'} />
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* left panel: docked on large screens, drawer on small */}
        <aside className={'z-30 w-[280px] shrink-0 border-r border-white/10 bg-[#0b1222] max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:shadow-2xl max-lg:transition-transform ' + (drawer === 'left' ? '' : 'max-lg:-translate-x-full')}>{left}</aside>

        {/* center canvas */}
        <section ref={stage} className="relative min-w-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#111a30,#05080f_70%)]" onClick={() => drawer && window.innerWidth < 1024 && setDrawer(null)}>
          <div className="absolute left-1/2 top-3 -translate-x-1/2" style={{ width: V.w * scale, height: frameH * scale }}>
            <div className={'studio-frame absolute left-0 top-0 origin-top-left overflow-hidden bg-[#FBFBFD] shadow-[0_0_0_1px_rgba(255,255,255,.08),0_20px_60px_rgba(0,0,0,.6)] ' + (vp === 'desktop' ? 'rounded-lg' : 'rounded-[28px]') + (mode === 'select' ? ' sel-mode' : '')}
              ref={frameRef} style={{ width: V.w, height: frameH, transform: `scale(${scale})` }}>
              <Spheres className="absolute inset-0 h-full w-full" />
              <div ref={scroller} className="absolute inset-0 overflow-y-auto overscroll-contain" onClickCapture={pick}>
                <Portfolio data={data} toast={toast} studio onAdmin={() => {}} />
              </div>
              {data.companion?.enabled !== false && <Stickman key={vp + (data.companion?.style || '')} variant={data.companion?.style} labels={data.companion} face={data.companion?.face} frame={frameRef} scroller={scroller} forceDock={vp !== 'desktop'} />}
            </div>
          </div>
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-[12px] text-slate-400">
            {mode === 'select' ? 'Tap anything to edit it · H to interact' : 'Interact mode: try the live site · V to select'}
          </p>
        </section>

        {/* right panel */}
        <aside className={'z-30 w-[340px] max-w-[92vw] shrink-0 overflow-y-auto overscroll-contain border-l border-white/10 bg-[#0b1222] max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:shadow-2xl max-lg:transition-transform ' + (drawer === 'right' ? '' : 'max-lg:translate-x-full')}>{right}</aside>
      </div>
    </div>
  );
}
