import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { clean, validate, safe, requireOwner } from '@/lib/api';
import { readJson } from '@/lib/guard';

export const POST = safe(async (req) => {
  const denied = await requireOwner(req);
  if (denied) return denied;

  const body = await readJson(req, 16 * 1024);
  if (!body.ok) return NextResponse.json({ error: 'bad request' }, { status: body.code });

  const b = body.data;
  const err = validate(b);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  await q('insert into tenancies (room_code,tenant_name,tenant_wa,period_type,payment_status,status,survey_date,check_in,check_out) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)', clean(b));
  return NextResponse.json({ ok: true });
});
