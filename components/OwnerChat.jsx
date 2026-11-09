'use client';
import { useState, useRef, useEffect } from 'react';
import { Mic, Send, X } from 'lucide-react';

// Saran awal. Pertanyaan bebas lain otomatis masuk mode "chat" yang paham
// alur website, database, dan data kamar — bukan lagi selalu mode tagih.
const SUG = [
  ['chat', 'Bagaimana cara mengubah harga homestay?'],
  ['chat', 'Bagaimana cara menambah penyewa baru?'],
  ['chat', 'Bagaimana cara mengelola waiting list?'],
  ['tagih', 'Buat pesan penagihan sewa yang halus tapi jelas.'],
  ['promo', 'Buatkan script video promosi 30 detik.'],
];

export default function OwnerChat({ onClose }) {
  const [msgs, setMsgs] = useState([{ bot: 1, t: 'Hai! Aku Tera-Asisten Ai 🌿 Asisten AI pemilik Pandan Jogja. Tanya apa saja soal cara pakai website, ubah harga, penyewa, waiting list, atau minta bantuan menagih & promosi.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const history = useRef(''); // token HMAC dari server, bukan riwayat mentah
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);

  async function send(text, kind = 'chat') {
    if (!text.trim() || busy) return;
    setInput(''); setBusy(true);
    setMsgs((p) => [...p.map((x) => ({ ...x, chips: null })), { t: text }]);
    try {
      const r = await fetch('/api/owner/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, text, history: history.current }),
      });
      const d = await r.json();
      if (d.history) history.current = d.history;
      setMsgs((p) => [...p, { bot: 1, t: d.text || 'Maaf, aku gagal menjawab. Coba lagi ya.' }]);
    } catch {
      setMsgs((p) => [...p, { bot: 1, t: 'Koneksi ke Tera sedang putus. Coba lagi sebentar, ya.' }]);
    } finally { setBusy(false); }
  }

  function listen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.lang = 'id-ID'; r.onresult = (e) => setInput(e.results[0][0].transcript); r.start();
  }

  return (
    <section className="fixed inset-x-3 bottom-3 z-50 flex h-[min(78vh,560px)] flex-col overflow-hidden rounded-3xl border border-pandan-200 bg-white shadow-2xl sm:inset-x-auto sm:right-24 sm:w-[400px]">
      <header className="flex items-center gap-3 bg-pandan-100 px-4 py-3"><p className="flex-1 font-display font-bold">Tera-Asisten Ai</p><button onClick={onClose} aria-label="Tutup"><X size={20} /></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.map((m, i) => <p key={i} className={`max-w-[92%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm ${m.bot ? 'bg-pandan-50' : 'ml-auto bg-pandan-700 text-white'}`}>{m.t}</p>)}
        {msgs.length === 1 && <div className="space-y-2">{SUG.map(([k, t]) => <button key={t} onClick={() => send(t, k)} className="block w-full rounded-xl border border-kelinci-500 px-3 py-2 text-left text-xs text-kelinci-700 hover:bg-kelinci-100">{t}</button>)}</div>}
        {busy && <p className="text-sm text-pandan-700">Sedang menulis…</p>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-pandan-200 p-3">
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya soal website atau data…" disabled={busy} />
        <button type="button" onClick={listen} aria-label="Bicara" className="rounded-full bg-pandan-100 p-2.5"><Mic size={18} /></button>
        <button aria-label="Kirim" disabled={busy} className="rounded-full bg-pandan-700 p-2.5 text-white disabled:opacity-50"><Send size={18} /></button>
      </form>
    </section>
  );
}
