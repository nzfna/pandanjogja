import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { todayWIB } from '@/lib/avail';
import { isDateStr, roomCode } from '@/lib/sanitize';

// Cek bentrok tanggal survei dengan sewa harian. Tidak mengirim data pribadi.
export async function GET(req, { params }) {
  const { code: rawCode } = await params;
  const code = roomCode(rawCode);
  if (!code) return NextResponse.json({ error: 'Kamar tidak ditemukan.' }, { status: 404 });

  const date = new URL(req.url).searchParams.get('date') || '';
  if (date && !isDateStr(date)) {
    return NextResponse.json({ error: 'Format tanggal tidak valid.' }, { status: 400 });
  }

  const rows = await q(
    "select check_in::text f, check_out::text t from tenancies where room_code=$1 and period_type='harian' and status in ('aktif','booking') and check_out >= $2 order by check_in",
    [code, todayWIB()]
  );
  const conflict = !!date && rows.some((r) => r.f <= date && r.t >= date);
  return NextResponse.json({ conflict, ranges: conflict ? rows : [] });
}
