import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { clean, validate, safe, requireOwner } from '@/lib/api';
import { readJson } from '@/lib/guard';

function idOf(params) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const PATCH = safe(async (req, { params }) => {
  const denied = await requireOwner(req);
  if (denied) return denied;

  const id = idOf(await params);
  if (!id) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = await readJson(req, 16 * 1024);
  if (!body.ok) return NextResponse.json({ error: 'bad request' }, { status: body.code });

  const b = body.data;
  const err = validate(b);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  await q('update tenancies set room_code=$1,tenant_name=$2,tenant_wa=$3,period_type=$4,payment_status=$5,status=$6,survey_date=$7,check_in=$8,check_out=$9 where id=$10', [...clean(b), id]);
  return NextResponse.json({ ok: true });
});

export const DELETE = safe(async (req, { params }) => {
  const denied = await requireOwner(req);
  if (denied) return denied;

  const id = idOf(await params);
  if (!id) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await q('delete from tenancies where id=$1', [id]);
  return NextResponse.json({ ok: true });
});
