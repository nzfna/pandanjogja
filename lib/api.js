import { NextResponse } from 'next/server';
import { verify, COOKIE } from './auth';
import { cleanLine, dateOrNull, normalizeWa, roomCode } from './sanitize';

// Guard kedua di dalam route (defense-in-depth): middleware tetap gerbang utama,
// tapi API owner harus 401 juga walau middleware nyasar/lompat.
export async function requireOwner(req) {
  const payload = await verify(req.cookies.get(COOKIE)?.value);
  if (!payload) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return null;
}

const PERIODS = ['harian', 'mingguan', 'bulanan'];
const PAYMENTS = ['none', 'dp', 'lunas', 'nunggak'];
const STATUSES = ['survei', 'booking', 'aktif', 'selesai'];

// Nilai yang benar-benar disimpan: dibersihkan dan dibatasi panjangnya.
export function clean(b) {
  const period = PERIODS.includes(b.period_type) ? b.period_type : 'bulanan';
  return [
    roomCode(b.room_code) || '',
    cleanLine(b.tenant_name, 80),
    normalizeWa(b.tenant_wa, 20),
    period,
    PAYMENTS.includes(b.payment_status) ? b.payment_status : 'none',
    STATUSES.includes(b.status) ? b.status : 'aktif',
    dateOrNull(b.survey_date),
    dateOrNull(b.check_in),
    period === 'harian' ? dateOrNull(b.check_out) : null,
  ];
}

// Validasi logika data penyewa. Mengembalikan pesan error atau null.
export function validate(b) {
  const code = roomCode(b?.room_code);
  const name = cleanLine(b?.tenant_name, 80);
  const period = PERIODS.includes(b?.period_type) ? b.period_type : 'bulanan';
  const payment = PAYMENTS.includes(b?.payment_status) ? b.payment_status : 'none';
  const status = STATUSES.includes(b?.status) ? b.status : 'aktif';
  const survey = dateOrNull(b?.survey_date);
  const checkIn = dateOrNull(b?.check_in);
  const checkOut = dateOrNull(b?.check_out);

  if (!code) return 'Pilih kamar yang valid (A–G).';
  if (!name) return 'Nama penyewa wajib diisi.';
  if (b?.period_type && !PERIODS.includes(b.period_type)) return 'Rentang sewa tidak valid.';
  if (b?.payment_status && !PAYMENTS.includes(b.payment_status)) return 'Status pembayaran tidak valid.';
  if (b?.status && !STATUSES.includes(b.status)) return 'Status sewa tidak valid.';
  if (b?.survey_date && !survey) return 'Tanggal survei tidak valid.';
  if (b?.check_in && !checkIn) return 'Tanggal masuk tidak valid.';
  if (b?.check_out && !checkOut) return 'Tanggal keluar tidak valid.';
  if (['aktif', 'booking'].includes(status) && !checkIn) return 'Tanggal masuk wajib diisi untuk status Aktif atau Booking.';
  if (status === 'survei' && !survey) return 'Tanggal survei wajib diisi untuk status Survei.';
  if (period === 'harian' && ['aktif', 'booking'].includes(status) && !checkOut) return 'Tanggal keluar wajib diisi untuk sewa harian.';
  if (period === 'harian' && checkIn && checkOut && checkOut < checkIn) return 'Tanggal keluar tidak boleh sebelum tanggal masuk.';
  return null;
}

// Bungkus handler supaya error server selalu kembali sebagai JSON yang terbaca.
// Detail error hanya masuk log server, tidak dikirim ke browser.
export const safe = (fn) => async (req, ctx) => {
  try {
    return await fn(req, ctx);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
};
