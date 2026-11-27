// Supabase client + the few calls the app needs.
// When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing (the Claude artifact
// preview, or a fresh clone without .env.local), `supabase` is null and the app
// falls back to localStorage and the local passcode.
import { createClient } from '@supabase/supabase-js';

const env = import.meta.env || {};
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

export const TABLE = 'portfolio_data';
export const ROW_ID = 'main';
export const BUCKET = 'portfolio-media';

export const supabase = URL_ && KEY ? createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
export const isCloud = !!supabase;

/* ---------- database ---------- */
// Returns the saved site JSON, or null when the 'main' row does not exist yet.
export async function fetchContent() {
  const { data, error } = await supabase.from(TABLE).select('content, updated_at').eq('id', ROW_ID).maybeSingle();
  if (error) throw error;
  return data ? { content: data.content, updatedAt: data.updated_at } : null;
}

export async function publishContent(content) {
  const updated_at = new Date().toISOString();
  const { error } = await supabase.from(TABLE).upsert({ id: ROW_ID, content, updated_at });
  if (error) throw error;
  return updated_at;
}

/* ---------- auth ---------- */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}
export const signOut = () => supabase.auth.signOut();

/* ---------- storage ---------- */
const safeName = (n = 'file') => n.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(-60) || 'file';

// Uploads in flight; App refuses to publish while this is above zero.
export const pendingUploads = { count: 0 };

// Uploads a File/Blob to the public bucket and returns its public URL.
export async function uploadMedia(file, folder = 'media', name) {
  pendingUploads.count++;
  try { return await doUpload(file, folder, name); } finally { pendingUploads.count--; }
}

async function doUpload(file, folder, name) {
  const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}-${safeName(name || file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000', upsert: false, contentType: file.type || undefined,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const type = /data:([^;]+)/.exec(head)?.[1] || 'application/octet-stream';
  const bin = atob(b64); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}
