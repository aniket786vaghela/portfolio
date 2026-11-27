// Turn any image (File, blob: or data: URL) into a small square JPEG data URL for the
// stickman's head: centre-cropped, downscaled, and squeezed until it is under ~36 KB so it
// fits comfortably in localStorage alongside the rest of the site JSON. With Supabase on,
// the result is then uploaded to Storage and only its public URL is kept.
const MAX_BYTES = 36000;

function load(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    if (/^https?:/.test(src)) img.crossOrigin = 'anonymous'; // Supabase Storage URLs: keep the canvas exportable
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('unreadable image'));
    img.src = src;
  });
}

export async function compressFace(input) {
  const isFile = typeof input !== 'string';
  const src = isFile ? URL.createObjectURL(input) : input;
  try {
    const img = await load(src);
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) throw new Error('empty image');
    const side = Math.min(w, h);
    const sx = (w - side) / 2, sy = Math.max(0, (h - side) * 0.35); // faces sit a little above centre in portraits
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    let out = '';
    for (const size of [176, 144, 112, 88]) {
      c.width = c.height = size;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size); // transparent PNGs get a white backdrop
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      for (const q of [0.86, 0.74, 0.6]) {
        out = c.toDataURL('image/jpeg', q);
        if (out.length <= MAX_BYTES) return out;
      }
    }
    return out;
  } finally {
    if (isFile) URL.revokeObjectURL(src);
  }
}
