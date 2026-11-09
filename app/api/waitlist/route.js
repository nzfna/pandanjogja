import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { cleanLine, cleanText, normalizeWa, roomCode } from '@/lib/sanitize';
import { clientIp, hitLimit, readJson } from '@/lib/guard';
import { verifyChallenge } from '@/lib/captcha';
import { auditBlocked } from '@/lib/audit';

export async function POST(req) {
  const ip = clientIp(req);
  const rl = await hitLimit('waitlist-ip', ip, 10, 60 * 60); // 10 pendaftaran / jam / IP
  if (!rl.ok) {
    await auditBlocked({ kind: 'rate_limit', ip, path: '/api/waitlist', detail: 'waitlist ip limit' });
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi nanti ya.' }, { status: 429 });
  }

  const body = await readJson(req, 8 * 1024);
  if (!body.ok) return NextResponse.json({ error: 'bad request' }, { status: body.code });

  const { website } = body.data;
  if (cleanText(website, 10)) return NextResponse.json({ ok: true }); // honeypot

  const code = roomCode(body.data.room_code);
  const n = cleanLine(body.data.name, 80);
  const origin = cleanLine(body.data.origin, 80);
  const w = normalizeWa(body.data.wa, 20);
  const digits = w.replace(/\D/g, '');
  if (!code || !n || digits.length < 8 || digits.length > 15) {
    return NextResponse.json({ error: 'Nama, nomor WA, dan kamar wajib diisi dengan benar.' }, { status: 400 });
  }

  // Verifikasi WA/CAPTCHA: token ditandatangani server, sekali pakai, 10 menit.
  const challenge = await verifyChallenge(body.data.challenge, body.data.answer);
  if (!challenge.ok) {
    await auditBlocked({ kind: 'captcha_failed', ip, path: '/api/waitlist', detail: challenge.reason });
    return NextResponse.json(
      { error: 'Verifikasi gagal atau kedaluwarsa. Muat ulang halaman lalu coba lagi ya.' },
      { status: 400 }
    );
  }

  await q('insert into waitlist (room_code,name,origin,wa) values ($1,$2,$3,$4)', [code, n, origin, w]);
  return NextResponse.json({ ok: true });
}
