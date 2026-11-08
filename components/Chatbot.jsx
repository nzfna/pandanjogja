'use client';
import { useState, useRef, useEffect } from 'react';
import { Mic, Send, X } from 'lucide-react';
import { computeStatus, fmtDate } from '@/lib/avail';

const SUG = ['Rekomendasi kamar yang cocok dengan kriteriaku', 'Bagaimana cara aku bisa booking kamar?', 'Sampai kapan saya harus berada di waiting list?'];
const FEATS = [['mesin_cuci', 'Mesin cuci'], ['teras', 'Teras & pemandangan pandan'], ['meja_belajar', 'Meja belajar'], ['kamar_mandi_luas', 'Kamar mandi luas'], ['kasur_besar', 'Kasur besar'], ['none', 'Tidak ada']];
const featOf = (s) => /cuci/.test(s) ? 'mesin_cuci' : /teras|pandan|pemandangan/.test(s) ? 'teras' : /meja|belajar/.test(s) ? 'meja_belajar' : /mandi|luas/.test(s) ? 'kamar_mandi_luas' : /kasur|king|double|besar/.test(s) ? 'kasur_besar' : /tidak|nggak|gak|ga /.test(s) ? 'none' : null;
const peopleOf = (s) => (/sendiri|solo/.test(s) ? 1 : /berdua/.test(s) ? 2 : /bertiga/.test(s) ? 3 : +(s.match(/\d+/) || [0])[0] || null);

export default function Chatbot({ rooms, occ, today, wa }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ bot: 1, t: 'Hai! Aku kelinci penjaga Pandan Jogja. Mau dibantu apa?', chips: SUG }]);
  const [input, setInput] = useState('');
  const [rec, setRec] = useState(false);
  const flow = useRef({});
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, open]);

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
    if (!s) return;
    setMsgs((p) => [...p.map((x) => ({ ...x, chips: null })), { t: text }]);
    setInput('');
    const f = flow.current;
    const intent = /rekomendasi|cocok|kriteria/.test(s) ? 'rec' : /cara|booking|pesan|order/.test(s) ? 'how' : /waiting|tunggu|antri/.test(s) ? 'wait' : null;
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
      const busy = rooms.filter((r) => status(r).state === 'terisi').map((r) => r.code);
      return say({ t: busy.length ? 'Kamar mana yang kamu tunggu?' : 'Semua kamar sedang tersedia, tidak ada waiting list saat ini.', chips: busy.length ? busy : SUG });
    }
    say({ t: 'Aku bisa bantu hal berikut:', chips: SUG });
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
        <button onClick={() => setOpen(true)} aria-label="Buka chat" className="fixed bottom-4 right-4 z-40 h-20 w-20 overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-pandan-300 transition hover:scale-105">
          <img src="/kelinci.png" alt="" className="h-full w-full object-cover" />
        </button>
      )}
      {open && (
        <section className="fixed inset-x-3 bottom-3 z-50 flex h-[min(78vh,560px)] flex-col overflow-hidden rounded-3xl border border-pandan-200 bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[380px]" aria-label="Chat Pandan Jogja">
          <header className="flex items-center gap-3 bg-pandan-100 px-4 py-3">
            <img src="/kelinci.png" alt="" className="h-10 w-10 rounded-full object-cover" />
            <p className="flex-1 font-display font-bold">Kelinci Pandan</p>
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
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handle(input); }} className="flex items-center gap-2 border-t border-pandan-200 p-3">
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ketik pesan…" />
            <button type="button" onClick={listen} aria-label="Bicara" className={`rounded-full p-2.5 ${rec ? 'bg-kelinci-500 text-white' : 'bg-pandan-100'}`}><Mic size={18} /></button>
            <button aria-label="Kirim" className="rounded-full bg-pandan-700 p-2.5 text-white"><Send size={18} /></button>
          </form>
        </section>
      )}
    </>
  );
}
