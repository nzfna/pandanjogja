import { NextResponse } from 'next/server';
import { verify, COOKIE } from './auth';

// Guard kedua di dalam route (defense-in-depth): middleware tetap gerbang utama,
// tapi API owner harus 401 juga walau middleware nyasar/lompat.
export async function requireOwner(req) {
  const payload = await verify(req.cookies.get(COOKIE)?.value);
  if (!payload) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return null;
}

export const clean = (b) => [
  b.room_code, String(b.tenant_name || '').trim(), String(b.tenant_wa || '').trim(), b.period_type || 'bulanan',
  b.payment_status || 'none', b.status || 'aktif', b.survey_date || null, b.check_in || null,
  b.period_type === 'harian' ? b.check_out || null : null,
];

// Validasi logika data penyewa. Mengembalikan pesan error atau null.
export function validate(b) {
  if (!b.room_code) return 'Pilih kamar.';
  if (!String(b.tenant_name || '').trim()) return 'Nama penyewa wajib diisi.';
  if (['aktif', 'booking'].includes(b.status) && !b.check_in) return 'Tanggal masuk wajib diisi untuk status Aktif atau Booking.';
  if (b.status === 'survei' && !b.survey_date) return 'Tanggal survei wajib diisi untuk status Survei.';
  if (b.period_type === 'harian' && ['aktif', 'booking'].includes(b.status) && !b.check_out) return 'Tanggal keluar wajib diisi untuk sewa harian.';
  if (b.period_type === 'harian' && b.check_in && b.check_out && b.check_out < b.check_in) return 'Tanggal keluar tidak boleh sebelum tanggal masuk.';
  return null;
}

// Bungkus handler supaya error server selalu kembali sebagai JSON yang terbaca.
export const safe = (fn) => async (req, ctx) => {
  try { return await fn(req, ctx); }
  catch (e) { console.error(e); return NextResponse.json({ error: `Server error: ${e.message}` }, { status: 500 }); }
};
