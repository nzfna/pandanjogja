// Utilitas sanitasi input bersama.
// Tidak mengimpor database, jadi aman dipakai di server maupun client.

// Karakter kontrol yang tidak pernah kita butuhkan (newline/tab dibiarkan).
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
// Zero-width & karakter arah teks yang sering dipakai untuk menyamarkan serangan.
const ZERO_WIDTH = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;

export function cleanText(v, max = 500, { multiline = false } = {}) {
  if (v == null) return '';
  let s = String(v).replace(ZERO_WIDTH, '').replace(CONTROL, '');
  s = multiline ? s.replace(/\r\n?/g, '\n') : s.replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}

export const cleanLine = (v, max = 200) => cleanText(v, max);

export function isRoomCode(v) {
  return typeof v === 'string' && /^[A-G]$/i.test(v.trim());
}

export const roomCode = (v) => (isRoomCode(v) ? v.trim().toUpperCase() : null);

export function isDateStr(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return false;
  const y = Number(v.slice(0, 4));
  return y >= 2000 && y <= 2100;
}

export const dateOrNull = (v) => (isDateStr(v) ? v : null);

// Nomor WA: hanya angka (plus di depan boleh), dibatasi panjangnya.
export function normalizeWa(v, max = 20) {
  const raw = String(v ?? '');
  const plus = raw.trim().startsWith('+') ? '+' : '';
  return plus + raw.replace(/\D/g, '').slice(0, max);
}

// URL yang diizinkan: http(s) absolut atau path internal "/..." (bukan "//").
// Skema berbahaya seperti javascript:, data:, vbscript: otomatis ditolak.
const SAFE_URL = /^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i;
export function safeUrl(v, max = 2048) {
  const s = cleanLine(v, max);
  if (!s) return '';
  if (SAFE_URL.test(s) && !/[\u0000-\u001F]/.test(s)) return s;
  return '';
}

// Untuk src gambar/video di komponen client.
export function safeSrc(v) {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  if (!s) return '';
  return SAFE_URL.test(s) ? s : '';
}

export function parsePrice(v) {
  if (v === '' || v == null) return { ok: true, value: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100_000_000) return { ok: false, value: null };
  return { ok: true, value: Math.round(n) };
}

// JSON-LD dimasukkan ke <script> mentah. Escape karakter yang bisa menutup tag
// supaya deskripsi/fasilitas dari database tidak bisa jadi celah XSS.
export function jsonLdHtml(value) {
  return JSON.stringify(value ?? null)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const INJECTION = [
  /ignore\s+(all\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|directions?)/i,
  /disregard\s+(all\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i,
  /(abaikan|lupakan|langgar|lewati)\s+(semua\s+|seluruh\s+)?(instruksi|aturan|perintah|prompt|panduan|pesan)\b/i,
  /(system|developer|hidden|rahasia)\s*(prompt|instruction)/i,
  /(bocorkan|tampilkan|tunjukkan|kasih\s*lihat|reveal|show|print|repeat|ulangi)\s+(prompt|instruksi|system|aturan|pesan\s+awal)/i,
  /(jailbreak|jail\s*break|developer\s*mode|dan\s*mode|do\s*anything\s*now|tanpa\s*batas|without\s*restrictions)/i,
  /\b(kamu|anda|you)\s+(sekarang|now)\s+(adalah|are|jadi|menjadi|berperan|act(ing)?\s+as)\b/i,
  /\b(berpura-pura|pura-pura|pretend|act\s+as|role\s*play|roleplay)\b/i,
  /\b(instruksi|perintah|aturan)\s+(baru|tersembunyi|sistem|dari\s+developer)\b/i,
  /<\|?\s*(system|im_start|im_end|assistant|user)\s*\|?>/i,
];

const DANGEROUS = /\b(bom|bomb|peledak|explosive|senjata|weapon|firearm|racun|poison|malware|ransomware|phishing|carding|ddos|hack|meretas|narkoba|narkotika|meth|sabu)\b/i;
const SELF_HARM = /\b(bunuh\s*diri|suicide|kill\s*my\s*self|self[\s-]*harm|menyakiti\s*diri)\b/i;

const REPLY_INJECTION = 'Aku tetap Tera-Asisten Ai Pandan Jogja 🐰 Aku nggak bisa mengubah aturan mainku, tapi aku siap bantu soal kamar, harga, fasilitas, atau cara booking.';
const REPLY_DANGEROUS = 'Aku asisten Pandan Jogja, jadi aku nggak bisa bantu hal itu. Aku bisa bantu soal kamar, harga, fasilitas, atau cara booking ya 😊';
const REPLY_SELF_HARM = 'Aku nggak bisa bantu soal itu. Kalau kamu sedang dalam masa berat, tolong hubungi orang terdekat atau tenaga profesional yang bisa mendampingimu.';

// Deteksi upaya prompt injection / permintaan berbahaya pada input publik.
// Bukan pengganti guardrail LLM, tapi lapisan pertama yang murah dan cepat.
export function screenPublicText(raw) {
  const s = String(raw ?? '').replace(ZERO_WIDTH, '');
  if (SELF_HARM.test(s)) return { blocked: true, reply: REPLY_SELF_HARM };
  if (INJECTION.some((r) => r.test(s))) return { blocked: true, reply: REPLY_INJECTION };
  if (DANGEROUS.test(s)) return { blocked: true, reply: REPLY_DANGEROUS };
  return { blocked: false, reply: '' };
}
