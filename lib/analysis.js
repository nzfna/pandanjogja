// Analisis performa kamar berbasis aturan (tanpa AI, tanpa token)
export function analyze(tenancies, waitCount, today) {
  const DAYS = 90, t0 = new Date(today + 'T00:00:00Z');
  const day = (i) => new Date(t0 - i * 864e5).toISOString().slice(0, 10);
  const rel = tenancies.filter((t) => ['aktif', 'booking', 'selesai'].includes(t.status) && t.check_in);
  let occ = 0;
  for (let i = 0; i < DAYS; i++) {
    const d = day(i);
    if (rel.some((t) => t.check_in <= d && (t.check_out ? t.check_out >= d : t.status !== 'selesai'))) occ++;
  }
  const pct = Math.round((occ / DAYS) * 100);
  const since = day(DAYS);
  const recent = tenancies.filter((t) => t.check_in && t.check_in >= since).length;
  const late = tenancies.filter((t) => t.payment_status === 'nunggak' && t.status !== 'selesai').length;
  const level = pct >= 80 ? 'Sangat baik' : pct >= 60 ? 'Baik' : pct >= 30 ? 'Cukup' : 'Kurang';
  const reasons = [`Kamar terisi ${occ} dari ${DAYS} hari terakhir (${pct}%).`];
  if (pct >= 80) reasons.push('Hampir selalu terisi: pertimbangkan menaikkan harga harian atau menerima sewa jangka panjang.');
  else if (pct < 30) reasons.push('Banyak hari kosong: coba promo, perbarui video preview, atau tawarkan paket mingguan.');
  reasons.push(recent ? `${recent} penyewa baru dalam ${DAYS} hari terakhir.` : `Belum ada penyewa baru dalam ${DAYS} hari terakhir.`);
  if (waitCount) reasons.push(`${waitCount} orang di waiting list: permintaan kamar ini tinggi.`);
  if (late) reasons.push(`${late} sewa menunggak, perlu ditagih agar arus kas aman.`);
  return { pct, level, reasons, occ, DAYS, recent };
}
