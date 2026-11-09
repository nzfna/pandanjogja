'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Mic, Send, X } from 'lucide-react';
import { computeStatus, fmtDate } from '@/lib/avail';

const SUG = ['Rekomendasi kamar yang cocok dengan kriteriaku', 'Bagaimana cara aku bisa booking kamar?', 'Sampai kapan saya harus berada di waiting list?'];
const FEATS = [['mesin_cuci', 'Mesin cuci'], ['teras', 'Teras & pemandangan pandan'], ['meja_belajar', 'Meja belajar'], ['kamar_mandi_luas', 'Kamar mandi luas'], ['kasur_besar', 'Kasur besar'], ['none', 'Tidak ada']];
const featOf = (s) => /cuci/.test(s) ? 'mesin_cuci' : /teras|pandan|pemandangan/.test(s) ? 'teras' : /meja|belajar/.test(s) ? 'meja_belajar' : /mandi|luas/.test(s) ? 'kamar_mandi_luas' : /kasur|king|double|besar/.test(s) ? 'kasur_besar' : /tidak|nggak|gak|ga /.test(s) ? 'none' : null;
const peopleOf = (s) => (/sendiri|solo/.test(s) ? 1 : /berdua/.test(s) ? 2 : /bertiga/.test(s) ? 3 : +(s.match(/\d+/) || [0])[0] || null);

export default function Chatbot({ rooms, occ, today, wa }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ bot: 1, t: 'Hai! Aku Tera-Asisten Ai 🐰 Asisten AI Pandan Jogja. Tanya apa aja soal kamar, harga, fasilitas, atau cara booking — semuanya kujawab dari data terbaru di database. Mau dibantu apa?', chips: SUG }]);
  const [input, setInput] = useState('');
  const [rec, setRec] = useState(false);
  const [busy, setBusy] = useState(false);
  const flow = useRef({});
  const history = useRef(''); // token HMAC dari server, bukan riwayat mentah
  const end = useRef(null);
  const pathname = usePathname();
  // Kalau sedang di /kamar/A, pertanyaan "kamar ini" diarahkan ke kamar A.
  const roomNow = (pathname?.match(/^\/kamar\/([a-g])(?:\/|$)/i) || [])[1]?.toUpperCase() || null;
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, open, busy]);

  const say = (m) => setMsgs((p) => [...p.map((x) => ({ ...x, chips: null })), { bot: 1, ...m }]);
  const status = (r) => computeStatus(r.code, occ, today);
  const link = (r) => ({ href: `/kamar/${r.code}`, label: `Lihat ${r.name}` });

  function recommend(people, feat) {
    const fit = rooms.filter((r) => r.capacity >= people);
    if (!fit.length) return say({ t: 'Untuk rombongan sebesar itu, kamu bisa ambil beberapa kamar sekaligus. Hubungi pemilik lewat WhatsApp ya.', links: [{ href: `https://wa.me/${wa}`, label: 'Chat pemilik' }] });
    const match = fit.filter((r) => feat === 'none' || r.tags.includes(feat));
    const picks = (match.length ? match : fit).slice(0, 3);
    const free = picks.filter((r) => status(r).state === 'tersedia');
    const lines = picks.map((r) => { const s = status(r); return `• ${r.name}: ${s.state === 'tersedia' ? 'tersedia' : `sedang terisi (${s.type}${s.until ? ` sampai ${fmtDate(s.until)}` : ''})`}`; });
    const tail = free.length ? `Yang bisa kamu pilih sekarang: ${free.map((r) => r.code).join(', ')}.`
      : `Semua kamar yang cocok sedang terisi. Isi waiting list di ${picks[0].name} dan kami kabari begitu kosong.`;
    say({ t: `Kamar yang cocok untukmu:\n${lines.join('\n')}\n\n${tail}`, links: picks.map(link) });
  }

  function handle(text) {
    const s = text.trim().toLowerCase();
    if (!s || busy) return;
    setMsgs((p) => [...p.map((x) => ({ ...x, chips: null })), { t: text }]);
    setInput('');
    const f = flow.current;
    // Jangan bajak pertanyaan yang menyebut kamar/fasilitas/harga hanya karena
    // kebetulan mengandung kata "booking". Pertanyaan campuran seperti
    // "fasilitas kamar A kalau aku booking" harus dijawab AI dari data kamar.
    const aboutRoom = /\b[a-g]\b/.test(s) || /fasilitas|harga|biaya|tarif|kapasitas|kasur|dapur|teras|kamar mandi|mesin cuci/.test(s);
    const howTo = /cara|gimana|bagaimana|langkah|prosedur/.test(s) && /booking|pesan|sewa|survei|order/.test(s);
    const intent = /rekomendasi|cocok|kriteria/.test(s) ? 'rec'
      : /waiting|tunggu|antri/.test(s) ? 'wait'
      : howTo && !aboutRoom ? 'how'
      : null;
    if (!intent && f.step === 'people') {
      const n = peopleOf(s);
      if (!n) return say({ t: 'Berapa orang yang akan menginap? (contoh: 2)' });
      flow.current = { step: 'feat', people: n };
      return say({ t: 'Fasilitas apa yang paling kamu butuhkan?', chips: FEATS.map((x) => x[1]) });
    }
    if (!intent && f.step === 'feat') {
      const k = featOf(s);
      if (!k) return say({ t: 'Pilih salah satu fasilitas ya.', chips: FEATS.map((x) => x[1]) });
      flow.current = {}; return recommend(f.people, k);
    }
    if (!intent && f.step === 'wait') {
      const code = (s.match(/\b([a-g])\b/) || [])[1]?.toUpperCase();
      const r = rooms.find((x) => x.code === code);
      if (!r) return say({ t: 'Kamar mana yang kamu tunggu? (A–G)' });
      flow.current = {};
      const st = status(r);
      if (st.state === 'tersedia') return say({ t: `${r.name} sedang tersedia, tidak perlu menunggu. Kamu bisa langsung jadwalkan survei.`, links: [link(r)] });
      if (st.type === 'harian') return say({ t: `Kamar yang kamu tunggu disewa harian untuk tanggal ${fmtDate(st.from)} – ${fmtDate(st.until)}. Silakan isi di tanggal lainnya.`, links: [link(r)] });
      return say({ t: `${r.name} sedang disewa ${st.type}. Kelanjutan sewa diprioritaskan untuk penyewa saat ini. Jika penyewa tidak lanjut, kami langsung menginformasikan kamu.`, links: [link(r)] });
    }
    if (intent === 'rec') { flow.current = { step: 'people' }; return say({ t: 'Siap! Berapa orang yang akan menginap?', chips: ['1 orang', '2 orang', '3 orang', '4 orang'] }); }
    if (intent === 'how') return say({ t: 'Langkah memesan kamar:\n1. Pilih pintu kamar yang tersedia\n2. Lihat video preview kamar\n3. Pilih rentang sewa (150 rb harian, 600 rb mingguan, 1,5 jt bulanan)\n4. Pilih tanggal survei\n5. Klik "Kirim pesan ke WhatsApp" dan tunggu pemilik menjawab', chips: [SUG[0], SUG[2]] });
    if (intent === 'wait') {
      flow.current = { step: 'wait' };
      const penuh = rooms.filter((r) => status(r).state === 'terisi').map((r) => r.code);
      return say({ t: penuh.length ? 'Kamar mana yang kamu tunggu?' : 'Semua kamar sedang tersedia, tidak ada waiting list saat ini.', chips: penuh.length ? penuh : SUG });
    }
    askAI(text);
  }

  // Pertanyaan bebas -> AI dengan konteks database. Kalau AI gagal/offline,
  // tetap jawab dari data kamar & okupansi yang sudah dibawa props.
  async function askAI(text) {
    setBusy(true);
    try {
      const r = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, history: history.current, room: roomNow }),
      });
      const d = await r.json();
      if (d.history) history.current = d.history;
      say({ t: d.text || 'Maaf, aku gagal menjawab ini. Coba lagi ya 🐰', chips: SUG });
    } catch {
      const free = rooms.filter((x) => status(x).state === 'tersedia').map((x) => x.code);
      say({ t: `Koneksiku ke otak AI sedang putus 🐰 Tapi dari data database lokal:\n• Kamar tersedia: ${free.length ? free.join(', ') : 'belum ada saat ini'}\n• Harga: harian 150 rb, mingguan 600 rb, bulanan 1,5 jt\n\nCoba kirim ulang pertanyaanmu nanti, atau chat pemilik langsung: https://wa.me/${wa}`, chips: SUG });
    } finally { setBusy(false); }
  }
  function listen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return say({ t: 'Browser ini belum mendukung suara. Coba ketik ya.' });
    const r = new SR(); r.lang = 'id-ID';
    r.onresult = (e) => handle(e.results[0][0].transcript);
    r.onend = () => setRec(false);
    setRec(true); r.start();
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Buka chat Tera-Asisten Ai" className="fixed bottom-4 right-4 z-40 h-20 w-20 overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-pandan-300 transition hover:scale-105">
          <img src="/kelinci.png" alt="" className="h-full w-full object-cover" />
        </button>
      )}
      {open && (
        <section className="fixed inset-x-3 bottom-3 z-50 flex h-[min(78vh,560px)] flex-col overflow-hidden rounded-3xl border border-pandan-200 bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[380px]" aria-label="Chat Tera-Asisten Ai">
          <header className="flex items-center gap-3 bg-pandan-100 px-4 py-3">
            <img src="/kelinci.png" alt="" className="h-10 w-10 rounded-full object-cover" />
            <p className="flex-1 font-display font-bold">Tera-Asisten Ai</p>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat"><X size={20} /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.bot ? '' : 'text-right'}>
                <p className={`inline-block max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-left text-sm ${m.bot ? 'bg-pandan-50' : 'bg-pandan-700 text-white'}`}>{m.t}</p>
                {m.links && <div className="mt-2 flex flex-wrap gap-2">{m.links.map((l) => <a key={l.href} href={l.href} className="btn-soft !px-3 !py-1 text-xs">{l.label}</a>)}</div>}
                {m.chips && <div className="mt-2 flex flex-wrap gap-2">{m.chips.map((c) => <button key={c} onClick={() => handle(c)} className="rounded-full border border-kelinci-500 px-3 py-1 text-left text-xs text-kelinci-700 hover:bg-kelinci-100">{c}</button>)}</div>}
              </div>
            ))}
            {busy && <p className="inline-block rounded-2xl bg-pandan-50 px-3.5 py-2 text-sm text-pandan-700 animate-pulse">Tera sedang cek database… 🐰</p>}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handle(input); }} className="flex items-center gap-2 border-t border-pandan-200 p-3">
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={busy ? 'Tera sedang menjawab…' : 'Ketik pesan…'} disabled={busy} />
            <button type="button" onClick={listen} aria-label="Bicara" disabled={busy} className={`rounded-full p-2.5 ${rec ? 'bg-kelinci-500 text-white' : 'bg-pandan-100'}`}><Mic size={18} /></button>
            <button aria-label="Kirim" disabled={busy} className="rounded-full bg-pandan-700 p-2.5 text-white disabled:opacity-50"><Send size={18} /></button>
          </form>
        </section>
      )}
    </>
  );
}
