import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';
import { sign, COOKIE, MAX_AGE } from '@/lib/auth';
import { cekRateLimit, catatGagal, bersihkanAtasIp } from '@/lib/ratelimit';

export async function POST(req) {
  // Gerbang brute-force: hanya percobaan gagal yang dihitung.
  const rl = await cekRateLimit(req);
  if (rl.gagal) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${rl.tunggu} menit.` },
      { status: 429 }
    );
  }

  const { username, password } = await req.json();
  const r = await q('select id,password_hash from owners where username=$1', [String(username || '').toLowerCase()]);
  if (!r[0] || !(await bcrypt.compare(String(password || ''), r[0].password_hash))) {
    await catatGagal(rl.ip);
    return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
  }
  await bersihkanAtasIp(rl.ip); // sukses -> hitungan gagal di-reset
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await sign(r[0].id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE });
  return res;
}
