'use client';
import { useState } from 'react';
import { Mic, Send, X } from 'lucide-react';

const SUG = [
  ['tagih', 'Bagaimana cara menagih sewa kamar dengan bahasa halus tapi penyewa langsung membayar?'],
  ['promo', 'Bantu aku mempromosikan homestay (script video)'],
];

export default function OwnerChat({ onClose }) {
  const [msgs, setMsgs] = useState([{ bot: 1, t: 'Hai! Mau dibantu apa hari ini?' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('tagih');

  async function send(text, k = kind) {
    if (!text.trim() || busy) return;
    setKind(k); setInput(''); setBusy(true);
    setMsgs((p) => [...p, { t: text }]);
    const r = await fetch('/api/owner/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: k, text }) });
    const d = await r.json();
    setMsgs((p) => [...p, { bot: 1, t: d.text }]); setBusy(false);
  }
  function listen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.lang = 'id-ID'; r.onresult = (e) => setInput(e.results[0][0].transcript); r.start();
  }
  return (
    <section className="fixed inset-x-3 bottom-3 z-50 flex h-[min(78vh,560px)] flex-col overflow-hidden rounded-3xl border border-pandan-200 bg-white shadow-2xl sm:inset-x-auto sm:right-24 sm:w-[400px]">
      <header className="flex items-center gap-3 bg-pandan-100 px-4 py-3"><p className="flex-1 font-display font-bold">Asisten pemilik</p><button onClick={onClose} aria-label="Tutup"><X size={20} /></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.map((m, i) => <p key={i} className={`max-w-[92%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm ${m.bot ? 'bg-pandan-50' : 'ml-auto bg-pandan-700 text-white'}`}>{m.t}</p>)}
        {msgs.length === 1 && SUG.map(([k, t]) => <button key={k} onClick={() => send(k === 'tagih' ? 'Penyewa terlambat bayar sewa, tagih dengan sopan.' : 'Buatkan script video promosi.', k)} className="block w-full rounded-xl border border-kelinci-500 px-3 py-2 text-left text-xs text-kelinci-700 hover:bg-kelinci-100">{t}</button>)}
        {busy && <p className="text-sm text-pandan-700">Sedang menulis…</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-pandan-200 p-3">
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ketik pesan…" />
        <button type="button" onClick={listen} aria-label="Bicara" className="rounded-full bg-pandan-100 p-2.5"><Mic size={18} /></button>
        <button aria-label="Kirim" className="rounded-full bg-pandan-700 p-2.5 text-white"><Send size={18} /></button>
      </form>
    </section>
  );
}
