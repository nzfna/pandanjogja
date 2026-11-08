'use client';
import { useState } from 'react';
import Link from 'next/link';
import VideoPreview from './VideoPreview';
import RoomPhoto from './RoomPhoto';
import { fmtDate, rp } from '@/lib/avail';

const PERIODS = [['harian', 'price_daily', 'hari'], ['mingguan', 'price_weekly', 'minggu'], ['bulanan', 'price_monthly', 'bulan']];

export default function RoomBooking({ room, status, wa }) {
  const [period, setPeriod] = useState('harian');
  const [date, setDate] = useState('');
  const [check, setCheck] = useState(null);
  const [wait, setWait] = useState(false);
  const longTerm = status.state === 'terisi' && status.type !== 'harian';

  async function pickDate(v) {
    setDate(v); setCheck(null);
    if (v) setCheck(await (await fetch(`/api/rooms/${room.code}/survey?date=${v}`)).json());
  }
  const msg = `Halo, saya mau survei ${room.name} (sewa ${period}) pada ${fmtDate(date)}.`;

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 pt-6 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <Link href="/#pintu" className="text-sm text-pandan-700 hover:underline">← Semua kamar</Link>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{room.name}</h1>
        <p className="mt-2 text-pandan-700">{room.building}. {room.description}</p>
        {room.photo_url && <RoomPhoto url={room.photo_url} className="mt-5 aspect-video w-full rounded-3xl" />}
        <div className="mt-5"><VideoPreview url={room.video_url} /></div>
        <h2 className="mt-8 text-xl font-bold">Fasilitas</h2>
        <ul className="mt-3 space-y-2">
          {room.facilities.map((f) => <li key={f} className="rounded-2xl border border-pandan-100 bg-white px-4 py-2.5 text-sm shadow-card">{f}</li>)}
        </ul>
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-6">
        <div className="card">
          <h2 className="text-xl font-bold">Rentang sewa</h2>
          {room.price_daily ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PERIODS.map(([k, f, u]) => (
                <button key={k} onClick={() => setPeriod(k)} aria-pressed={period === k} className={`rounded-xl border-2 p-3 text-left text-sm transition ${period === k ? 'border-pandan-700 bg-pandan-100' : 'border-pandan-200'}`}>
                  <span className="block font-semibold capitalize">{k}</span>
                  <span className="block text-xs">{rp(room[f])}/{u}</span>
                </button>
              ))}
            </div>
          ) : <p className="mt-2 text-sm text-pandan-700">Harga dan ketersediaan dibicarakan langsung dengan pemilik lewat WhatsApp.</p>}
        </div>

        {longTerm ? (
          <div className="card border-kelinci-300 bg-kelinci-100">
            <p className="font-semibold">Kamar ini sedang disewa {status.type}.</p>
            <p className="mt-1 text-sm">Jika berminat, silakan isi waiting list. Kelanjutan sewa diprioritaskan untuk penyewa saat ini; jika tidak lanjut, kami langsung menghubungi Anda.</p>
            <button className="btn mt-3" onClick={() => setWait(true)}>Isi waiting list</button>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-bold">Jadwalkan survei</h2>
            <label className="mt-3 block text-sm font-medium" htmlFor="tgl">Tanggal survei</label>
            <input id="tgl" type="date" className="input mt-1" value={date} onChange={(e) => pickDate(e.target.value)} />
            {check?.conflict && (
              <div className="mt-3 rounded-xl bg-kelinci-100 p-3 text-sm" role="alert">
                Kamar yang Anda inginkan telah disewa harian untuk {check.ranges.map((r) => `${fmtDate(r.f)} – ${fmtDate(r.t)}`).join(', ')}. Silakan pilih tanggal survei lainnya.
              </div>
            )}
            <a aria-disabled={!date || !check || check.conflict} href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`}
               className={`btn mt-4 w-full ${!date || !check || check.conflict ? 'pointer-events-none opacity-50' : ''}`}>Kirim pesan ke WhatsApp pemilik</a>
            <p className="mt-2 text-xs text-pandan-700">Pemilik akan membalas lewat WhatsApp.</p>
          </div>
        )}
      </aside>
      {wait && <WaitForm code={room.code} onClose={() => setWait(false)} />}
    </main>
  );
}

function WaitForm({ code, onClose }) {
  const [f, setF] = useState({ name: '', origin: '', wa: '', website: '' });
  const [state, setState] = useState('');
  async function submit(e) {
    e.preventDefault(); setState('...');
    const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, room_code: code }) });
    setState(r.ok ? 'ok' : (await r.json()).error);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pandan-900/50 p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="card w-full max-w-md space-y-3">
        <h2 className="text-xl font-bold">Waiting list kamar {code}</h2>
        {state === 'ok' ? <p>Terima kasih! Kami akan menghubungi Anda lewat WhatsApp jika kamar tersedia.</p> : (<>
          <input className="input" placeholder="Nama" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="input" placeholder="Asal (kota/instansi)" value={f.origin} onChange={(e) => setF({ ...f, origin: e.target.value })} />
          <input className="input" placeholder="Nomor WA yang bisa dihubungi" inputMode="tel" required value={f.wa} onChange={(e) => setF({ ...f, wa: e.target.value })} />
          <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
          {state && state !== '...' && <p className="text-sm text-red-700">{state}</p>}
          <button className="btn w-full" disabled={state === '...'}>Kirim</button>
        </>)}
        <button type="button" className="btn-soft w-full" onClick={onClose}>Tutup</button>
      </form>
    </div>
  );
}
