import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';
import { sign, COOKIE, MAX_AGE } from '@/lib/auth';
import { cleanLine } from '@/lib/sanitize';
import { readJson } from '@/lib/guard';
import { cekRateLimit, catatGagal, bersihkanAtasIp } from '@/lib/ratelimit';
import { auditBlocked } from '@/lib/audit';

// Hash valid dengan cost yang sama seperti seed. Dipakai saat username tidak
// ditemukan supaya bcrypt.compare tetap berjalan dan waktu respons tidak
// membocorkan apakah username ada atau tidak.
const DUMMY_HASH = '$2a$10$1cSXL6pwCHZMQc5xZZoaA.T1A.aAUkPOrWra9jFI3cS9QJ8LS1VKS';

export async function POST(req) {
  // Gerbang brute-force: hanya percobaan gagal yang dihitung.
  const rl = await cekRateLimit(req);
  if (rl.gagal) {
    await auditBlocked({ kind: 'rate_limit', ip: rl.ip, path: '/api/auth/login', detail: 'login brute-force limit' });
    return NextResponse.json(
      { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${rl.tunggu} menit.` },
      { status: 429 }
    );
  }

  const body = await readJson(req, 4 * 1024);
  const username = body.ok ? cleanLine(body.data.username, 64).toLowerCase() : '';
  const password = body.ok && typeof body.data.password === 'string' ? body.data.password.slice(0, 200) : '';

  const r = username ? await q('select id,password_hash from owners where username=$1', [username]) : [];
  const owner = r[0];

  // Selalu jalankan bcrypt.compare — termasuk untuk username kosong/tidak ada.
  const matched = await bcrypt.compare(password, owner?.password_hash || DUMMY_HASH);

  if (!owner || !matched) {
    await catatGagal(rl.ip);
    return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
  }

  await bersihkanAtasIp(rl.ip); // sukses -> hitungan gagal di-reset
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await sign(owner.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE });
  return res;
}
