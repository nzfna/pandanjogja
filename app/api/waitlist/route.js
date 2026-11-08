import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

export async function POST(req) {
  const { room_code, name, origin, wa, website } = await req.json();
  if (website) return NextResponse.json({ ok: true }); // honeypot
  const n = String(name || '').trim().slice(0, 80), w = String(wa || '').replace(/[^\d+]/g, '').slice(0, 20);
  if (!room_code || !n || w.length < 8) return NextResponse.json({ error: 'Nama dan nomor WA wajib diisi.' }, { status: 400 });
  await q('insert into waitlist (room_code,name,origin,wa) values ($1,$2,$3,$4)', [room_code, n, String(origin || '').slice(0, 80), w]);
  return NextResponse.json({ ok: true });
}
