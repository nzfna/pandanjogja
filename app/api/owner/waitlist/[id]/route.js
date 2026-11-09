import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { safe, requireOwner } from '@/lib/api';
export const DELETE = safe(async (req, { params }) => {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
  await q('delete from waitlist where id=$1', [id]);
  return NextResponse.json({ ok: true });
});
