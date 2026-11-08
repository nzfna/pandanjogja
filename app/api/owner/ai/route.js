import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/api';
import { getRooms } from '@/lib/data';
import { rp } from '@/lib/avail';

const FALLBACK = {
  tagih: (t) => `Halo kak${t ? ` (${t})` : ''}, semoga sehat dan nyaman selama tinggal di Pandan Jogja ya 🌿\n\nKami mau mengingatkan dengan lembut bahwa pembayaran sewa kamar sudah memasuki jatuh tempo. Kalau kakak sedang ada kendala, kabari kami saja, kita cari jalan terbaik bersama. Jika sudah transfer, mohon kirim bukti bayarnya ya.\n\nTerima kasih banyak, kak 🙏`,
  promo: () => `Script video 30 detik:\n\n[0-5 dtk] Pagi di Pandan Jogja: teras dengan kursi, kebun pandan hijau segar.\n[5-15 dtk] Tur singkat: ruang tengah dengan kasur king, dapur lengkap, kamar mandi bersih.\n[15-25 dtk] Narasi: "Tinggal rasa rumah, harga ramah: harian 150 rb, mingguan 600 rb, bulanan 1,5 jt."\n[25-30 dtk] Ajakan: "Cek kamar yang tersedia dan pilih tanggal survei di website kami."\n\n(Simpan GROQ_API_KEY di .env.local agar script disesuaikan otomatis dengan info kamar.)`,
};

// Hanya info kamar publik yang dikirim ke AI: tanpa data penyewa dan tanpa profil pemilik.
async function buildPrompt(kind, text) {
  if (kind === 'promo') {
    const rooms = await getRooms();
    const info = rooms.map((r) => `Kamar ${r.code}: ${r.description} Fasilitas: ${r.facilities.join('; ')}. Harga: ${r.price_daily ? `${rp(r.price_daily)}/hari, ${rp(r.price_weekly)}/minggu, ${rp(r.price_monthly)}/bulan` : 'tanya pemilik'}. Video: ${r.video_url || '-'}`).join('\n');
    return `Buatkan script video promosi homestay Pandan Jogja (30-45 detik, adegan + narasi, bahasa Indonesia santai). Gunakan hanya informasi ini:\n${info}\n${text || ''}`;
  }
  return `Buatkan pesan WhatsApp penagihan sewa kamar yang halus, tidak menyakiti, hangat, tapi jelas dan mendorong penyewa segera membayar. Konteks dari pemilik: ${text || 'penyewa terlambat membayar'}. Beri 1 versi singkat.`;
}

// Urutan provider: Groq -> Cloudflare Workers AI -> template FALLBACK.
// Keduanya gratis; kalau satu kena limit/tidak diisi, otomatis lanjut ke berikutnya.
async function generate(prompt, maxTokens = 700) {
  // 1) Groq (utama) — API OpenAI-compatible.
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { authorization: `Bearer ${groqKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d.choices?.[0]?.message?.content?.trim();
        if (t) return { text: t, via: 'groq' };
      } else {
        console.error('Groq gagal:', r.status, (await r.text()).slice(0, 200));
      }
    } catch (e) { console.error('Groq error:', e.message); }
  }

  // 2) Cloudflare Workers AI (cadangan).
  const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  if (cfAccount && cfToken) {
    try {
      const model = process.env.CF_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${model}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${cfToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens }),
        signal: AbortSignal.timeout(20_000),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d.result?.response?.trim();
        if (t) return { text: t, via: 'cloudflare' };
      } else {
        console.error('Cloudflare gagal:', r.status, JSON.stringify(d && d.errors).slice(0, 200));
      }
    } catch (e) { console.error('Cloudflare error:', e.message); }
  }

  // 3) Tanpa key / kedua provider gagal -> template lokal (fitur tidak pernah mati).
  return null;
}

export async function POST(req) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const { kind, text } = await req.json();
  try {
    const prompt = await buildPrompt(kind, text);
    const out = await generate(prompt);
    if (out) return NextResponse.json({ text: out.text, via: out.via });
  } catch (e) { console.error(e); }
  return NextResponse.json({ text: FALLBACK[kind]?.(text) || 'Pilih salah satu saran percakapan ya.', via: 'template' });
}
