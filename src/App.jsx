import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lock, X, AlertTriangle, Loader2 } from 'lucide-react';
import Portfolio from './Portfolio.jsx';
import Studio from './Studio.jsx';
import Spheres from './Spheres.jsx';
import Stickman from './Stickman.jsx';
import { loadData, saveData, clearData, migrate, DEFAULT_DATA } from './data.js';
import { supabase, isCloud, fetchContent, publishContent, signIn, signOut, pendingUploads } from './supabase.js';

// Preview-only lock, used when Supabase is not configured (e.g. the Claude artifact).
// It is checked in the browser, so it is not real security; the deployed site uses Supabase Auth.
const PREVIEW_PASSCODE = 'admin123';

const fieldCls = 'mt-1 w-full min-h-[48px] rounded-xl border border-slate-900/10 bg-white px-3 text-base text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15';

function Gate({ onClose, onOk }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const fail = (m) => { setErr(m); setShake(true); setPw(''); };
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!isCloud) { if (pw === PREVIEW_PASSCODE) onOk(); else fail('That passcode is not right.'); return; }
    setBusy(true); setErr('');
    try { await signIn(email.trim(), pw); onOk(); }
    catch (ex) { fail(/invalid/i.test(ex?.message || '') ? 'Email or password is not right.' : ex?.message || 'Sign-in failed. Check your connection.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/20 p-4 backdrop-blur-md" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className={'glass glass-strong w-full max-w-sm rounded-[28px] p-6 ' + (shake ? 'shake' : '')} onAnimationEnd={() => setShake(false)}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1d1d1f] text-white"><Lock size={18} /></span>
          <h2 className="flex-1 font-display text-xl font-semibold tracking-tight text-[#1d1d1f]">{isCloud ? 'Sign in to Studio' : 'Open Studio'}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full text-slate-500 hover:bg-slate-900/5"><X size={18} /></button>
        </div>
        {isCloud && (<>
          <label htmlFor="admin-email" className="mt-5 block text-[13px] text-slate-500">Email</label>
          <input ref={ref} id="admin-email" type="email" autoComplete="username" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} />
        </>)}
        <label htmlFor="admin-pw" className={(isCloud ? 'mt-3' : 'mt-5') + ' block text-[13px] text-slate-500'}>{isCloud ? 'Password' : 'Passcode'}</label>
        <input ref={isCloud ? undefined : ref} id="admin-pw" type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} className={fieldCls} />
        <p className="mt-2 min-h-[1.4em] text-[13px] text-rose-600" role="alert">{err}</p>
        <button disabled={busy} className="mt-2 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#0071e3] font-medium text-white hover:bg-[#0077ed] disabled:opacity-60">
          {busy && <Loader2 size={16} className="animate-spin" />}{isCloud ? (busy ? 'Signing in…' : 'Sign in') : 'Unlock'}
        </button>
        <p className="mt-3 text-[12px] text-slate-500">
          {isCloud ? 'Only the site owner can sign in. Edits are published to Supabase.' : 'Preview mode: Supabase is not connected, so this passcode lock is checked in the browser and edits stay in this browser.'}
        </p>
      </form>
    </div>
  );
}

function Splash() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-[#FBFBFD]" aria-busy="true">
      <Loader2 size={22} className="animate-spin text-slate-400" aria-label="Loading" />
    </div>
  );
}

export default function App() {
  const init = useRef(null);
  if (!init.current) init.current = isCloud ? { data: DEFAULT_DATA, mode: 'cloud' } : loadData();
  const [data, setData] = useState(init.current.data);
  const [storage, setStorage] = useState(init.current.mode); // 'cloud' | 'local' | 'quota' | 'memory'
  const [loading, setLoading] = useState(isCloud);
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState('public');
  const [gate, setGate] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(null); // JSON string of the last published (or loaded) content
  const [toastMsg, setToastMsg] = useState(null);
  const hist = useRef({ past: [], future: [], key: null, t: 0 });
  const [, force] = useState(0);
  const toastTimer = useRef(0);

  // toast(message, tone): tone 'error' shows the warning icon; otherwise it is guessed from the text.
  const toast = useCallback((m, tone) => {
    setToastMsg({ m, error: tone ? tone === 'error' : /blocked|full|Couldn't|could not|failed|Wait/i.test(m) });
    clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  // update(fn, key, silent): typing in one field within 800 ms counts as one undo step.
  const update = useCallback((fn, key, silent) => {
    setData((prev) => {
      const next = fn(prev);
      if (next === prev) return prev;
      const h = hist.current; const now = Date.now();
      if (!silent) {
        if (!(key && key === h.key && now - h.t < 800)) { h.past.push(prev); if (h.past.length > 60) h.past.shift(); }
        h.future = []; h.key = key; h.t = now;
      }
      return { ...next, meta: { ...next.meta, updatedAt: new Date().toISOString() } };
    });
    force((x) => x + 1);
  }, []);
  const undo = useCallback(() => { const h = hist.current; if (!h.past.length) return; setData((cur) => { h.future.push(cur); return h.past.pop(); }); h.key = null; force((x) => x + 1); }, []);
  const redo = useCallback(() => { const h = hist.current; if (!h.future.length) return; setData((cur) => { h.past.push(cur); return h.future.pop(); }); h.key = null; force((x) => x + 1); }, []);

  /* ---------- cloud: load the 'main' row and track the auth session ---------- */
  useEffect(() => {
    if (!isCloud) return;
    let alive = true;
    fetchContent()
      .then((row) => {
        if (!alive) return;
        const d = row?.content ? migrate(row.content) : DEFAULT_DATA;
        setData(d); setPublished(row?.content ? JSON.stringify(d) : null);
      })
      .catch((e) => { if (alive) toast("Couldn't load the published site, showing sample content. " + (e?.message || ''), 'error'); })
      .finally(() => alive && setLoading(false));
    supabase.auth.getSession().then(({ data: s }) => alive && setSession(s.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
      if (!s) setMode('public'); // signed out (here or in another tab): leave the Studio
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const dirty = isCloud && !loading && JSON.stringify(data) !== published;

  // Warn before closing the tab with unpublished Studio edits.
  useEffect(() => {
    if (!dirty || mode !== 'studio') return;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
  }, [dirty, mode]);

  /* ---------- fallback: autosave to localStorage ---------- */
  useEffect(() => {
    if (isCloud) return;
    if (storage === 'memory' && init.current.mode === 'memory') return; // blocked: stay in memory quietly
    const t = setTimeout(() => setStorage(saveData(data)), 300);
    return () => clearTimeout(t);
  }, [data]);
  useEffect(() => { if (storage === 'quota') toast('Browser storage is full, so the latest edits are kept in memory. Remove large media to save again.'); }, [storage]);
  useEffect(() => { if (init.current.mode === 'memory') toast('Local storage is blocked here, so edits are kept in memory only'); }, []);

  /* ---------- actions ---------- */
  const publish = async () => {
    if (!isCloud) { setStorage(saveData(data)); toast('Saved in this browser. Connect Supabase to publish online.'); return; }
    if (publishing) return;
    if (pendingUploads.count > 0) return toast('Wait for uploads to finish, then publish.', 'error');
    // blob: URLs only live in this tab, so they are never published.
    const content = JSON.parse(JSON.stringify(data, (k, v) => (typeof v === 'string' && v.startsWith('blob:') ? '' : v)));
    setPublishing(true);
    try {
      await publishContent(content);
      setPublished(JSON.stringify(data));
      toast('Published. Your site is live.', 'ok');
    } catch (e) {
      toast("Couldn't publish: " + (e?.message || 'network error') + (/row-level|policy|permission/i.test(e?.message || '') ? ' (is this email in portfolio_admins?)' : ''), 'error');
    } finally { setPublishing(false); }
  };

  const doSignOut = async () => {
    if (dirty && !window.confirm('You have unpublished changes. Sign out anyway? They stay on this page until you reload.')) return;
    if (isCloud) { try { await signOut(); } catch (e) { /* session is cleared locally anyway */ } }
    setMode('public'); window.scrollTo(0, 0);
    toast('Signed out', 'ok');
  };

  const openAdmin = () => { if (isCloud && session) setMode('studio'); else setGate(true); };

  const reset = () => {
    update(() => DEFAULT_DATA);
    if (!isCloud) clearData();
    toast(isCloud ? 'Reset to sample content. Undo to restore, or publish to make it live.' : 'Reset to sample content. Undo to restore.');
  };

  if (loading) return <Splash />;

  return (
    <>
      {mode === 'public' ? (
        <div className="relative min-h-full bg-[#FBFBFD]">
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_50%_at_15%_0%,#eef4ff,transparent),radial-gradient(50%_40%_at_95%_20%,#fdf2f8,transparent)]" />
          <Spheres className="fixed inset-0 h-full w-full" />
          <Portfolio data={data} toast={toast} onAdmin={openAdmin} />
          {data.companion?.enabled !== false && <Stickman key={data.companion?.style || 'stickman'} variant={data.companion?.style} labels={data.companion} face={data.companion?.face} />}
        </div>
      ) : (
        <Studio data={data} update={update} undo={undo} redo={redo} canUndo={hist.current.past.length > 0} canRedo={hist.current.future.length > 0}
          storage={storage} onExit={() => { setMode('public'); window.scrollTo(0, 0); }} onReset={reset} toast={toast}
          onPublish={publish} publishing={publishing} dirty={dirty} onSignOut={doSignOut} userEmail={session?.user?.email} />
      )}
      {gate && <Gate onClose={() => setGate(false)} onOk={() => { setGate(false); setMode('studio'); }} />}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
        {toastMsg && (
          <div className="toast-in pointer-events-auto flex max-w-md items-center gap-2 rounded-full bg-[#1d1d1f]/90 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-xl">
            {toastMsg.error ? <AlertTriangle size={16} className="shrink-0 text-amber-300" /> : <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />}
            {toastMsg.m}
          </div>
        )}
      </div>
    </>
  );
}
