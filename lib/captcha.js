import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { q } from './db';

// CAPTCHA ringan untuk waiting list:
// - pertanyaan acak + jawaban disimpan di database (tidak bocor ke client),
// - token HMAC hanya membawa nonce + waktu kedaluwarsa,
// - sekali pakai, kedaluwarsa 10 menit,
// - ganti CAPTCHA_SECRET = rotasi massal; endpoint owner bisa revoke semua.
const TTL_MS = 10 * 60 * 1000;

function secret() {
  return process.env.CAPTCHA_SECRET || process.env.AUTH_SECRET || 'dev-captcha-secret';
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function unsign(token) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = Buffer.from(token.slice(dot + 1), 'base64url');
  const expected = Buffer.from(createHmac('sha256', secret()).update(body).digest(), 'base64url');
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!p || typeof p.n !== 'string' || typeof p.e !== 'number') return null;
    return p;
  } catch {
    return null;
  }
}

let schemaReady = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await q(`create table if not exists waitlist_challenges (
        nonce text primary key,
        answer int not null,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null,
        used_at timestamptz
      )`);
      await q(`create index if not exists waitlist_challenges_expiry on waitlist_challenges (expires_at)`);
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

export async function issueChallenge() {
  await ensureSchema();

  if (Math.random() < 0.05) {
    q(`delete from waitlist_challenges where expires_at < now() - interval '1 day'`).catch(() => {});
  }

  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  const nonce = randomUUID();
  const expiresAt = Date.now() + TTL_MS;

  await q(
    `insert into waitlist_challenges (nonce, answer, expires_at)
     values ($1, $2, to_timestamp($3 / 1000.0))`,
    [nonce, a + b, expiresAt]
  );

  return {
    token: sign({ n: nonce, e: expiresAt }),
    question: `Berapa ${a} + ${b}?`,
    expiresAt,
  };
}

export async function verifyChallenge(token, answer) {
  const p = unsign(token);
  if (!p) return { ok: false, reason: 'invalid' };
  if (p.e < Date.now()) return { ok: false, reason: 'expired' };

  try {
    await ensureSchema();
    // Atomik + sekali pakai. Jawaban salah juga menghabiskan challenge supaya
    // tidak bisa ditebak berulang kali.
    const rows = await q(
      `update waitlist_challenges set used_at = now()
       where nonce=$1 and used_at is null and expires_at > now()
       returning answer`,
      [p.n]
    );
    if (!rows[0]) return { ok: false, reason: 'used' };
    const n = Number(String(answer ?? '').replace(/\D/g, ''));
    if (Number.isFinite(n) && n === rows[0].answer) return { ok: true, reason: '' };
    return { ok: false, reason: 'wrong' };
  } catch (e) {
    console.error('verifikasi captcha gagal:', e.message);
    return { ok: false, reason: 'error' };
  }
}

export async function revokeChallenges() {
  await ensureSchema();
  const rows = await q(`delete from waitlist_challenges where used_at is null returning nonce`);
  return rows.length;
}
