import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { safe, requireOwner } from '@/lib/api';

const num = (v) => (v === '' || v == null ? null : Number(v));
export const PATCH = safe(async (req, { params }) => {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const b = await req.json();
  await q('update rooms set description=$1,facilities=$2,video_url=$3,photo_url=$4,price_daily=$5,price_weekly=$6,price_monthly=$7 where code=$8', [
    b.description || '', JSON.stringify(b.facilities || []), b.video_url || null, b.photo_url || null, num(b.price_daily), num(b.price_weekly), num(b.price_monthly), params.code,
  ]);
  return NextResponse.json({ ok: true });
});
