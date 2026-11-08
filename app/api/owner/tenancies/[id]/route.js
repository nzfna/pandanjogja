import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { clean, validate, safe, requireOwner } from '@/lib/api';

export const PATCH = safe(async (req, { params }) => {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const b = await req.json();
  const err = validate(b);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  await q('update tenancies set room_code=$1,tenant_name=$2,tenant_wa=$3,period_type=$4,payment_status=$5,status=$6,survey_date=$7,check_in=$8,check_out=$9 where id=$10', [...clean(b), Number(params.id)]);
  return NextResponse.json({ ok: true });
});
export const DELETE = safe(async (req, { params }) => {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  await q('delete from tenancies where id=$1', [id]);
  return NextResponse.json({ ok: true });
});
