'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, History, Hourglass, Info, Plus } from 'lucide-react';
import { TenantTable, WaitTable } from './TenantTable';
import { useTenantModal } from './OwnerShell';

const TABS = [['analisis', 'Performa', Activity], ['riwayat', 'Riwayat', History], ['waiting', 'Waiting list', Hourglass], ['info', 'Informasi', Info]];

export default function RoomOwner({ room, tenancies, waitlist, analysis: a }) {
  const [tab, setTab] = useState('analisis');
  const open = useTenantModal();
  return (
    <main>
      <Link href="/owner" className="text-sm text-pandan-700 hover:underline">← Dashboard</Link>
      <h1 className="mt-1 text-4xl font-extrabold">{room.name}</h1>
      <nav className="mt-5 flex gap-2 overflow-x-auto">
        {TABS.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium ${tab === k ? 'border-pandan-700 bg-pandan-100' : 'border-pandan-200'}`}><Icon size={16} />{l}</button>
        ))}
      </nav>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn" onClick={() => open({ room_code: room.code })}><Plus size={16} />Tambah penyewa</button>
      </div>

      <div className="mt-6">
        {tab === 'analisis' && (
          <div className="card max-w-2xl">
            <h2 className="text-xl font-bold">Performa kamar: {a.level}</h2>
            <div className="relative mt-5 h-3 rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-pandan-500">
              <span style={{ left: `${a.pct}%` }} className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-pandan-900 shadow" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-pandan-700"><span>Kurang</span><span>Sangat baik</span></div>
            <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm">{a.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        )}
        {tab === 'riwayat' && <TenantTable rows={tenancies} />}
        {tab === 'waiting' && <WaitTable rows={waitlist} />}
        {tab === 'info' && <InfoForm room={room} />}
      </div>
    </main>
  );
}

function InfoForm({ room }) {
  const router = useRouter();
  const [f, setF] = useState({ description: room.description || '', facilities: room.facilities.join('\n'), video_url: room.video_url || '', photo_url: room.photo_url || '', price_daily: room.price_daily ?? '', price_weekly: room.price_weekly ?? '', price_monthly: room.price_monthly ?? '' });
  const [ok, setOk] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    await fetch(`/api/owner/rooms/${room.code}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, facilities: f.facilities.split('\n').map((x) => x.trim()).filter(Boolean) }) });
    setOk(true); router.refresh();
  }
  return (
    <form onSubmit={save} className="card max-w-2xl space-y-3">
      <label className="block text-sm">Deskripsi<textarea className="input" rows={3} value={f.description} onChange={set('description')} /></label>
      <label className="block text-sm">Fasilitas (satu baris satu item)<textarea className="input" rows={7} value={f.facilities} onChange={set('facilities')} /></label>
      <label className="block text-sm">Link foto kamar (contoh: /rooms/A.jpg untuk file di folder public/rooms)<input className="input" value={f.photo_url} onChange={set('photo_url')} /></label>
      <label className="block text-sm">Link video preview (YouTube, Instagram Reels, atau file video langsung)<input className="input" value={f.video_url} onChange={set('video_url')} placeholder="https://youtube.com/… atau https://instagram.com/reel/…" /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        {[['price_daily', 'Harga harian'], ['price_weekly', 'Harga mingguan'], ['price_monthly', 'Harga bulanan']].map(([k, l]) => <label key={k} className="block text-sm">{l}<input type="number" className="input" value={f[k]} onChange={set(k)} /></label>)}
      </div>
      <button className="btn">Simpan informasi</button>{ok && <span className="ml-3 text-sm text-pandan-700">Tersimpan.</span>}
    </form>
  );
}
