import { NextResponse } from 'next/server';
import { safe, requireOwner } from '@/lib/api';
import { revokeChallenges } from '@/lib/captcha';

// Revoke semua CAPTCHA waiting list yang belum terpakai. Berguna saat ada
// lonjakan spam, atau setelah rotasi CAPTCHA_SECRET.
export const POST = safe(async (req) => {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const count = await revokeChallenges();
  return NextResponse.json({ ok: true, revoked: count });
});
