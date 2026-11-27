// Used only by scripts/build-artifact.sh: the Claude artifact preview has no Supabase
// keys, so the real client is swapped for this stub to keep the single-file bundle small.
export function createClient() { throw new Error('Supabase is not bundled in the preview build'); }
