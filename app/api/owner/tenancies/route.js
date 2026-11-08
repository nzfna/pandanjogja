import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { clean, validate, safe, requireOwner } from '@/lib/api';

export const POST = safe(async (req) => {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const b = await req.json();
  const err = validate(b);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  await q('insert into tenancies (room_code,tenant_name,tenant_wa,period_type,payment_status,status,survey_date,check_in,check_out) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)', clean(b));
  return NextResponse.json({ ok: true });
});
