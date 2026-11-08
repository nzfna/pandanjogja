import { q } from './db';

// Rate-limit berbasis database (Neon): sama kuat di semua instance serverless,
// tanpa akun/layanan tambahan. Hitungan hanya untuk percobaan LOGIN GAGAL.
const SISA_WAKTU_JAM = '-5 minutes';          // jendela hitung: 5 menit
const MAX_GAGAL = 5;                          // maksimal gagal per jendela

const ipOf = (req) => {
  // Di Vercel x-forwarded-for diatur platform (aman); lokal pakai fallback 'local'.
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
};

export async function cekRateLimit(req) {
  const ip = ipOf(req);
  try {
    await q('delete from login_gagal where at < now() - $1::interval', ['20 minutes']);
    const rows = await q('select count(*)::int c from login_gagal where ip=$1 and at > now() - $2::interval', [ip, '5 minutes']);
    if (rows[0]?.c >= MAX_GAGAL) {
      const sisa = await q('select max(at)::text terakhir from login_gagal where ip=$1', [ip]);
      const tunggu = sisa[0]?.terakhir ? 5 - Math.floor((Date.now() - new Date(sisa[0].terakhir)) / 60000) : 5;
      return { gagal: true, ip, tunggu: Math.max(1, tunggu) };
    }
  } catch (e) {
    console.error('ratelimit error (diabaikan agar login tetap jalan):', e.message);
  }
  return { gagal: false, ip };
}

export async function catatGagal(ip) {
  await q('insert into login_gagal (ip) values ($1)', [ip]).catch((e) => console.error('catat gagal:', e.message));
}

export async function bersihkanAtasIp(ip) {
  await q('delete from login_gagal where ip=$1', [ip]).catch(() => {});
}
