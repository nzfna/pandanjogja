import { q } from './db';
import { cleanText, screenPublicText } from './sanitize';

// ---------------------------------------------------------------------------
// Helper server: parsing body yang aman + rate limit.
// ---------------------------------------------------------------------------

export function clientIp(req) {
  // Di Vercel header ini diatur platform. Kalau self-host di belakang proxy,
  // pastikan proxy menimpa (bukan meneruskan) header ini.
  const xff = req.headers.get('x-forwarded-for') || '';
  return (xff.split(',')[0] || '').trim().slice(0, 64) || 'lokal';
}

// Baca JSON dengan batas ukuran, supaya body raksasa tidak memakan memori.
export async function readJson(req, maxBytes = 16 * 1024) {
  try {
    const len = Number(req.headers.get('content-length') || 0);
    if (len > maxBytes) return { ok: false, code: 413 };
    const raw = await req.text();
    if (raw.length > maxBytes) return { ok: false, code: 413 };
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, code: 400 };
    return { ok: true, data };
  } catch {
    return { ok: false, code: 400 };
  }
}

// Riwayat chat datang dari browser (tidak tepercaya): bersihkan, batasi, dan
// buang giliran yang berisi upaya prompt injection.
export function sanitizeHistory(history, { max = 6, maxLen = 500, screen = true } = {}) {
  if (!Array.isArray(history)) return [];
  const out = [];
  for (const m of history.slice(-max)) {
    if (!m || typeof m !== 'object') continue;
    const t = cleanText(m.t ?? m.content, maxLen);
    if (!t) continue;
    if (screen && screenPublicText(t).blocked) continue;
    out.push({ bot: m.bot === true, t });
  }
  return out;
}

const MEM = new Map();

function memHit(key, limit, windowMs) {
  const now = Date.now();
  const arr = (MEM.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    MEM.set(key, arr);
    return { ok: false };
  }
  arr.push(now);
  MEM.set(key, arr);
  // Cegah map tumbuh tanpa batas di instance yang hidup lama.
  if (MEM.size > 5000) {
    for (const [k, v] of MEM) if (!v.some((t) => now - t < windowMs)) MEM.delete(k);
  }
  return { ok: true };
}

let schemaReady = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await q(`create table if not exists rate_hits (
        bucket text not null,
        key text not null,
        at timestamptz not null default now()
      )`);
      await q(`create index if not exists rate_hits_lookup on rate_hits (bucket, key, at)`);
    })().catch((e) => {
      schemaReady = null; // coba lagi di request berikutnya
      throw e;
    });
  }
  return schemaReady;
}

// Rate limit berbasis database (konsisten antar instance serverless).
// Kalau DB bermasalah, otomatis turun ke limiter in-memory agar fitur tetap jalan.
export async function hitLimit(bucket, key, limit, windowSec) {
  try {
    await ensureSchema();
    const rows = await q(
      `with recent as (
         select count(*)::int c from rate_hits
         where bucket=$1 and key=$2 and at > now() - ($3::int * interval '1 second')
       )
       insert into rate_hits (bucket, key)
       select $1, $2 from recent where c < $4
       returning (select c from recent) as c`,
      [bucket, key, windowSec, limit]
    );
    // Bersihkan data lama sesekali (tidak perlu tiap request).
    if (Math.random() < 0.02) {
      q(`delete from rate_hits where at < now() - interval '1 day'`).catch(() => {});
    }
    return { ok: rows.length > 0 };
  } catch (e) {
    console.error('rate limit db gagal, pakai memory:', e.message);
    return memHit(`${bucket}:${key}`, limit, windowSec * 1000);
  }
}
