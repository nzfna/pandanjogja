import { createHmac, timingSafeEqual } from 'node:crypto';
import { cleanText, screenPublicText } from './sanitize';

// Riwayat percakapan TIDAK lagi dipercaya mentah dari browser.
// Server menandatangani giliran yang sudah ia ketahui (HMAC), lalu client hanya
// mengirim token. Token palsu/kedaluwarsa otomatis dianggap riwayat kosong.
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 jam
const MAX_TOKEN = 16 * 1024;

function secret() {
  return process.env.CHAT_HISTORY_SECRET || process.env.AUTH_SECRET || '';
}

function mac(body) {
  return createHmac('sha256', secret()).update(body).digest();
}

function normalize(messages, { max = 6, maxLen = 500, screen = true } = {}) {
  if (!Array.isArray(messages)) return [];
  const out = [];
  for (const m of messages.slice(-max)) {
    if (!m || typeof m !== 'object') continue;
    const t = cleanText(m.t ?? m.content, maxLen);
    if (!t) continue;
    if (screen && screenPublicText(t).blocked) continue;
    out.push({ bot: m.bot === true, t });
  }
  return out;
}

export function signHistory(messages, aud = 'ask') {
  if (!secret()) return '';
  const payload = {
    v: 1,
    aud,
    exp: Date.now() + MAX_AGE_MS,
    m: normalize(messages, { max: 6, maxLen: 500, screen: false }),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${mac(body).toString('base64url')}`;
}

export function loadHistory(token, { aud = 'ask', max = 6, maxLen = 500, screen = true } = {}) {
  try {
    if (!secret() || typeof token !== 'string' || token.length > MAX_TOKEN) return [];
    const dot = token.lastIndexOf('.');
    if (dot <= 0) return [];
    const body = token.slice(0, dot);
    const sig = Buffer.from(token.slice(dot + 1), 'base64url');
    const expected = mac(body);
    if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return [];

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.v !== 1 || payload.aud !== aud) return [];
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return [];
    return normalize(payload.m, { max, maxLen, screen });
  } catch {
    return [];
  }
}
