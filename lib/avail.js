const active = (t) => ['aktif', 'booking'].includes(t.status);

export const todayWIB = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
export const fmtDate = (s) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
export const rp = (n) => (n == null ? null : 'Rp ' + Number(n).toLocaleString('id-ID'));

// occ = daftar sewa aktif/booking (tanpa data pribadi untuk publik)
export function computeStatus(code, occ, today) {
  const mine = occ.filter((o) => o.room_code === code && active(o));
  const isDaily = (o) => o.period_type === 'harian';
  const cur = mine.find((o) => (isDaily(o) ? o.check_in && o.check_out && o.check_in <= today && o.check_out >= today : !o.check_out || o.check_out >= today));
  const upcoming = mine.filter((o) => isDaily(o) && o.check_in && o.check_out && o.check_out >= today)
    .sort((a, b) => a.check_in.localeCompare(b.check_in)).map((o) => ({ from: o.check_in, to: o.check_out }));
  return cur
    ? { state: 'terisi', type: cur.period_type, until: cur.check_out || null, from: cur.check_in || null, upcoming }
    : { state: 'tersedia', type: null, until: null, upcoming };
}
export const fmtShort = (s) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '–');
export const fmtLong = (s) => new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
