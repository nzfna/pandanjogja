import { NextResponse } from 'next/server';
import { clientIp, hitLimit } from '@/lib/guard';
import { issueChallenge } from '@/lib/captcha';
import { auditBlocked } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Terbitkan tantangan verifikasi untuk form waiting list.
export async function GET(req) {
  const ip = clientIp(req);
  const rl = await hitLimit('captcha-ip', ip, 30, 60 * 60);
  if (!rl.ok) {
    await auditBlocked({ kind: 'rate_limit', ip, path: '/api/waitlist/challenge', detail: 'captcha issue limit' });
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan verifikasi. Coba lagi nanti ya.' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const c = await issueChallenge();
    return NextResponse.json(c, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('issue captcha gagal:', e);
    return NextResponse.json({ error: 'Verifikasi sedang tidak tersedia. Coba beberapa saat lagi.' }, { status: 503 });
  }
}
