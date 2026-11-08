import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { safe, requireOwner } from '@/lib/api';
export const DELETE = safe(async (req, { params }) => {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  await q('delete from waitlist where id=$1', [id]);
  return NextResponse.json({ ok: true });
});
