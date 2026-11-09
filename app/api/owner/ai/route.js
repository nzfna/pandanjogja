import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/api';
import { getRooms, getTenancies, getWaitlist } from '@/lib/data';
import { computeStatus, fmtDate, todayWIB, rp } from '@/lib/avail';
import { generate } from '@/lib/ai';
import { cleanText } from '@/lib/sanitize';
import { readJson } from '@/lib/guard';
import { loadHistory, signHistory } from '@/lib/history';

// Tera-Asisten Ai (mode pemilik) = customer service internal yang paham:
// - alur & menu website (publik + dashboard owner)
// - struktur database
// - data kamar, sewa, dan waiting list saat ini
// Mode khusus: "tagih" (pesan penagihan) dan "promo" (script video).
// Semua pertanyaan bebas lain masuk mode "chat" dan dijawab sesuai konteks situs.

const FALLBACK = {
  tagih: (t) => `Halo kak${t ? ` (${t})` : ''}, semoga sehat dan nyaman selama tinggal di Pandan Jogja ya 🌿\n\nKami mau mengingatkan dengan lembut bahwa pembayaran sewa kamar sudah memasuki jatuh tempo. Kalau kakak sedang ada kendala, kabari kami saja, kita cari jalan terbaik bersama. Jika sudah transfer, mohon kirim bukti bayarnya ya.\n\nTerima kasih banyak, kak 🙏`,
  promo: () => `Script video 30 detik:\n\n[0-5 dtk] Pagi di Pandan Jogja: teras dengan kursi, kebun pandan hijau segar.\n[5-15 dtk] Tur singkat: ruang tengah dengan kasur king, dapur lengkap, kamar mandi bersih.\n[15-25 dtk] Narasi: "Tinggal rasa rumah, harga ramah: harian 150 rb, mingguan 600 rb, bulanan 1,5 jt."\n[25-30 dtk] Ajakan: "Cek kamar yang tersedia dan pilih tanggal survei di website kami."`,
};

// Ringkasan situs & database. Ini yang bikin Tera bisa menjawab
// "gimana cara ubah harga", "di mana tambah penyewa", dst. tanpa mengarang.
const SITE_GUIDE = `PANDUAN WEBSITE (jawab persis mengikuti ini):
• Login pemilik: /owner/login. Dashboard utama: /owner.
• Dashboard /owner berisi: "Aktivitas Kamar" (kartu tiap kamar A–G), "Sewa Mingguan & Bulanan", "Sewa Harian (Terbaru)", dan "Waiting List".
• Mengubah harga: /owner → klik kartu kamar (mis. kamar A) → tab "Informasi" → ubah kolom "Harga harian", "Harga mingguan", "Harga bulanan" → klik "Simpan informasi". Setelah disimpan, harga baru langsung tampil di website publik saat halaman di-refresh (tidak perlu menunggu). Di tab yang sama bisa ubah deskripsi, fasilitas (satu baris satu item), link foto, dan link video preview.
• Menambah penyewa: tombol bulat "+" di kanan bawah (muncul di semua halaman owner) atau tombol "Tambah penyewa" di halaman kamar → isi form: kamar, nama penyewa, nomor WA, rentang sewa (harian/mingguan/bulanan), status (survei/booking/aktif/selesai), status pembayaran (belum bayar/DP/lunas/nunggak), tanggal survei, tanggal masuk, dan tanggal keluar (khusus harian) → "Simpan".
• Mengubah/menghapus penyewa: tabel penyewa → ikon pensil → ubah data → "Simpan", atau tombol "Hapus".
• Waiting list: halaman /owner/waiting (atau tab "Waiting list" di halaman kamar). Data berisi nama, asal, nomor WA, kamar, tanggal daftar. Tombol tempat sampah untuk menghapus.
• Performa kamar: buka kamar → tab "Performa". Skor dihitung dari tingkat okupansi 90 hari, jumlah penyewa baru, waiting list, dan tunggakan; tab "Riwayat" untuk semua sewa kamar itu.
• Halaman publik: beranda menampilkan pintu kamar A–G → /kamar/[kode] berisi foto, video preview, fasilitas, pilihan rentang sewa, cek tanggal survei, lalu tombol "Kirim pesan ke WhatsApp pemilik". Jika kamar disewa jangka panjang, pengunjung mengisi waiting list.
• Harga A–C standar: Rp 150.000/hari, Rp 600.000/minggu, Rp 1.500.000/bulan. Kamar E–G harganya null (tampil "diskusi via WhatsApp").

STRUKTUR DATABASE:
• rooms(code, name, building, location, description, facilities jsonb, video_url, photo_url, price_daily, price_weekly, price_monthly, tags jsonb, capacity)
• tenancies(id, room_code, tenant_name, tenant_wa, period_type, payment_status, status, survey_date, check_in, check_out, created_at)
• waitlist(id, room_code, name, origin, wa, created_at)
• owners(id, username, password_hash)
Status sewa: survei, booking, aktif, selesai. Status pembayaran: none, dp, lunas, nunggak.
Status kamar dihitung otomatis dari sewa berstatus aktif/booking: tersedia, terisi harian/mingguan/bulanan.

BATASAN:
• Kamu TIDAK bisa mengubah database, menghapus data, atau mengirim WhatsApp dari chat ini. Jelaskan langkahnya di UI; jangan pernah bilang "sudah saya ubah".
• Jangan mengarang menu atau fitur yang tidak ada di panduan.
• Jangan menampilkan nomor WA penyewa.`;

async function buildData() {
  const [rooms, tenancies, waitlist] = await Promise.all([getRooms(), getTenancies(), getWaitlist()]);
  const today = todayWIB();
  const occ = tenancies.filter((t) => ['aktif', 'booking'].includes(t.status));

  const roomLines = rooms.map((r) => {
    const s = computeStatus(r.code, occ, today);
    const st = s.state === 'tersedia'
      ? 'TERSEDIA'
      : `terisi ${s.type}${s.until ? ` sampai ${fmtDate(s.until)}` : ''}`;
    const harga = r.price_daily
      ? `${rp(r.price_daily)}/hari, ${rp(r.price_weekly)}/minggu, ${rp(r.price_monthly)}/bulan`
      : 'harga belum dipasang (diskusi via WhatsApp)';
    return `- Kamar ${r.code} (${r.name}, ${r.building || '-'}, kapasitas ${r.capacity}): ${st}. Harga: ${harga}. Fasilitas: ${(r.facilities || []).join('; ') || '-'}. Video: ${r.video_url ? 'ada' : 'belum ada'}.`;
  });

  const tenLines = tenancies
    .filter((t) => t.status !== 'selesai')
    .slice(0, 40)
    .map((t) => `- Kamar ${t.room_code}: ${t.tenant_name} | sewa ${t.period_type} | status ${t.status} | bayar ${t.payment_status} | survei ${t.survey_date || '-'} | masuk ${t.check_in || '-'} | keluar ${t.check_out || '-'}`);

  const waitLines = waitlist
    .slice(0, 30)
    .map((w) => `- ${w.name}${w.origin ? ` (${w.origin})` : ''} menunggu kamar ${w.room_code} sejak ${w.created_at?.slice(0, 10) || '-'}`);

  return {
    rooms, tenancies, waitlist, today,
    text: [
      `TANGGAL HARI INI: ${today}`,
      '',
      'DATA KAMAR SAAT INI:',
      roomLines.join('\n'),
      '',
      'SEWA BERJALAN (belum selesai):',
      tenLines.length ? tenLines.join('\n') : '- belum ada',
      '',
      'WAITING LIST:',
      waitLines.length ? waitLines.join('\n') : '- kosong',
    ].join('\n'),
  };
}

async function buildPrompt(kind, text, data) {
  if (kind === 'promo') {
    const info = data.rooms.map((r) => `Kamar ${r.code}: ${r.description} Fasilitas: ${r.facilities.join('; ')}. Harga: ${r.price_daily ? `${rp(r.price_daily)}/hari, ${rp(r.price_weekly)}/minggu, ${rp(r.price_monthly)}/bulan` : 'tanya pemilik'}. Video: ${r.video_url || '-'}`).join('\n');
    return `Buatkan script video promosi homestay Pandan Jogja (30-45 detik, adegan + narasi, bahasa Indonesia santai). Gunakan hanya informasi ini:\n${info}\n${text || ''}\nJangan menyebut harga untuk kamar yang harganya belum dipasang; tulis "harga diskusi via WhatsApp". Jangan mengarang fasilitas atau jumlah kamar.`;
  }

  if (kind === 'tagih') {
    const nunggak = data.tenancies
      .filter((t) => t.status !== 'selesai' && ['nunggak', 'none'].includes(t.payment_status))
      .slice(0, 10)
      .map((t) => `Kamar ${t.room_code} — ${t.tenant_name} (${t.period_type}, bayar: ${t.payment_status})`)
      .join('\n');
    return `Buatkan pesan WhatsApp penagihan sewa kamar yang halus, tidak menyakiti, hangat, tapi jelas dan mendorong penyewa segera membayar. Konteks dari pemilik: ${text || 'penyewa terlambat membayar'}.\n${nunggak ? `Data penyewa yang belum lunas:\n${nunggak}\n` : ''}Beri 1 versi singkat. Jangan mengarang nominal yang tidak disebutkan.`;
  }

  // Mode chat bebas: asisten operasional website.
  return [
    'Kamu "Tera-Asisten Ai", customer service internal untuk pemilik homestay Pandan Jogja. Kamu boleh menyebut dirimu Tera.',
    'Kamu paham alur website publik, dashboard owner, struktur database, dan data terkini di bawah.',
    'Jawab dalam bahasa Indonesia santai, ringkas (maks ~180 kata), langsung ke inti. Pakai langkah bernomor kalau menjelaskan cara.',
    'Sebutkan nama menu/tombol/path yang persis, sesuai PANDUAN WEBSITE.',
    'Kalau pemilik bertanya cara mengubah harga, jelaskan langkah di dashboard — jangan menulis pesan penagihan atau script promosi.',
    'Mode tagih/promo hanya dipakai kalau pemilik menekan tombol khusus atau memintanya secara eksplisit.',
    'Kalau pertanyaan di luar data/fitur yang ada, bilang belum ada dan jangan mengarang.',
    'Jangan pernah menampilkan nomor WA penyewa.',
    '',
    SITE_GUIDE,
    '',
    data.text,
  ].join('\n');
}

// Jawaban lokal kalau LLM gagal / key kosong. Tetap berguna dan sesuai situs.
function fallbackChat(text, data) {
  const s = String(text || '').toLowerCase();
  const wa = !data.waitlist.length ? 'Waiting list saat ini kosong.' : `Ada ${data.waitlist.length} orang di waiting list. Buka /owner/waiting untuk melihat dan menghapus data.`;

  if (/harga|tarif|price|mahal|murah/.test(s)) {
    const daftar = data.rooms.map((r) => `• Kamar ${r.code}: ${r.price_daily ? `${rp(r.price_daily)}/hari, ${rp(r.price_weekly)}/minggu, ${rp(r.price_monthly)}/bulan` : 'belum dipasang'}`).join('\n');
    return `Cara mengubah harga:\n1. Buka /owner\n2. Klik kartu kamar yang mau diubah\n3. Pilih tab "Informasi"\n4. Ubah kolom Harga harian / mingguan / bulanan\n5. Klik "Simpan informasi"\n\nHarga saat ini:\n${daftar}`;
  }
  if (/tambah|baru|penyewa|tenant/.test(s)) {
    return 'Cara menambah penyewa:\n1. Klik tombol bulat "+" di kanan bawah (atau "Tambah penyewa" di halaman kamar)\n2. Pilih kamar, isi nama & nomor WA penyewa\n3. Pilih rentang sewa dan status\n4. Isi tanggal survei/masuk (dan tanggal keluar untuk harian)\n5. Klik "Simpan"\n\nUntuk mengubah atau menghapus, klik ikon pensil di tabel penyewa.';
  }
  if (/waiting|antri|tunggu/.test(s)) {
    return `Waiting list ada di /owner/waiting atau tab "Waiting list" di halaman kamar. ${wa}`;
  }
  if (/video|foto|fasilitas|deskripsi|info/.test(s)) {
    return 'Cara mengubah info kamar:\n1. Buka /owner → klik kartu kamar\n2. Pilih tab "Informasi"\n3. Ubah deskripsi, fasilitas (satu baris satu item), link foto, link video, atau harga\n4. Klik "Simpan informasi"';
  }
  if (/tagih|bayar|nunggak|tunggak/.test(s)) {
    return 'Untuk menagih, tekan saran "Buat pesan penagihan" di chat ini, atau cek tabel penyewa di dashboard: status pembayaran "nunggak" berarti belum lunas. Kamu juga bisa ubah status pembayaran lewat ikon pensil di tabel penyewa.';
  }
  return 'Aku bisa bantu soal: mengubah harga/fasilitas kamar, menambah atau mengubah penyewa, waiting list, status pembayaran, performa kamar, dan alur website. Coba tanya lebih spesifik, ya. (Otak AI sedang offline, jadi ini jawaban dari panduan lokal.)';
}

export async function POST(req) {
  const denied = await requireOwner(req);
  if (denied) return denied;

  const body = await readJson(req, 32 * 1024);
  if (!body.ok) return NextResponse.json({ error: 'bad request' }, { status: body.code });

  const kind = ['tagih', 'promo', 'chat'].includes(body.data.kind) ? body.data.kind : 'chat';
  const text = cleanText(body.data.text, 1000);
  // Riwayat hanya diterima lewat token HMAC yang diterbitkan server.
  const history = loadHistory(body.data.history, { aud: 'owner', max: 6, maxLen: 500, screen: false });

  const respond = (replyText, via) => {
    const turns = [...history];
    if (text) turns.push({ bot: false, t: text });
    turns.push({ bot: true, t: replyText });
    return NextResponse.json({ text: replyText, via, history: signHistory(turns, 'owner') });
  };

  try {
    const data = await buildData();
    const prompt = await buildPrompt(kind, text, data);

    if (kind === 'chat') {
      const messages = [
        { role: 'system', content: prompt },
        ...history.map((m) => ({ role: m.bot ? 'assistant' : 'user', content: m.t })),
        { role: 'user', content: text || 'Halo, apa yang bisa kamu bantu?' },
      ];
      const out = await generate(messages, 700);
      if (out) return respond(cleanText(out.text, 5000, { multiline: true }), out.via);
      return respond(fallbackChat(text, data), 'template');
    }

    const out = await generate([{ role: 'user', content: prompt }], 700);
    if (out) return respond(cleanText(out.text, 5000, { multiline: true }), out.via);
  } catch (e) {
    console.error('Owner AI error:', e);
  }

  if (kind === 'chat') {
    // Data mungkin gagal dimuat; tetap beri arahan umum.
    try { return respond(fallbackChat(text, await buildData()), 'template'); }
    catch { return respond('Maaf, aku sedang tidak bisa membaca data. Coba lagi sebentar, ya.', 'error'); }
  }
  return respond(FALLBACK[kind]?.(text) || 'Pilih salah satu saran percakapan ya.', 'template');
}
