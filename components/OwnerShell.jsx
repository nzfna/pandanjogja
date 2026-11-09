'use client';
import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, CalendarDays, LogOut } from 'lucide-react';
import Logo from './Logo';
import OwnerChat from './OwnerChat';

const Ctx = createContext(() => {});
export const useTenantModal = () => useContext(Ctx);

export default function OwnerShell({ rooms, dateLabel, children }) {
  const [modal, setModal] = useState(null);
  const [chat, setChat] = useState(false);
  return (
    <Ctx.Provider value={(t) => setModal(t || {})}>
      <header className="border-b border-pandan-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
          <Link href="/owner" className="flex items-center gap-4"><Logo /><span className="hidden h-10 w-px bg-pandan-200 sm:block" /><span className="hidden text-3xl font-extrabold sm:block">Dashboard Owner</span></Link>
          <span className="ml-auto hidden items-center gap-2 rounded-full border border-pandan-100 bg-white px-4 py-2 text-sm font-semibold shadow-sm md:flex"><CalendarDays size={18} className="text-pandan-500" />{dateLabel}</span>
          <button className="btn ml-auto md:ml-0" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/owner/login'; }}><LogOut size={18} />Keluar</button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 pb-40 pt-6">{children}</div>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-center gap-3">
        <button onClick={() => setModal({})} aria-label="Tambah penyewa" className="flex h-14 w-14 items-center justify-center rounded-full bg-pandan-700 text-white shadow-lg hover:bg-pandan-900"><Plus /></button>
        <button onClick={() => setChat(!chat)} aria-label="Buka chat Tera-Asisten Ai" className="h-20 w-20 overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-pandan-700"><img src="/kelinci.png" alt="" className="h-full w-full object-cover" /></button>
      </div>
      {chat && <OwnerChat onClose={() => setChat(false)} />}
      {modal && <TenantModal key={modal.id || 'new'} rooms={rooms} init={modal} onClose={() => setModal(null)} />}
    </Ctx.Provider>
  );
}

function TenantModal({ rooms, init, onClose }) {
  const router = useRouter();
  const [f, setF] = useState({ room_code: rooms[0]?.code, tenant_name: '', tenant_wa: '', period_type: 'bulanan', payment_status: 'none', status: 'aktif', survey_date: '', check_in: '', check_out: '', ...init });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value || '' });
  async function save(e) {
    e.preventDefault();
    const r = await fetch(init.id ? `/api/owner/tenancies/${init.id}` : '/api/owner/tenancies', { method: init.id ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
    if (!r.ok) return setErr((await r.json()).error);
    onClose(); router.refresh();
  }
  async function del() {
    if (!confirm('Hapus data penyewa ini?')) return;
    await fetch(`/api/owner/tenancies/${init.id}`, { method: 'DELETE' }); onClose(); router.refresh();
  }
  const Sel = ({ k, opts }) => <select className="input" value={f[k]} onChange={set(k)}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-pandan-900/50 p-3 sm:items-center" role="dialog" aria-modal="true">
      <form onSubmit={save} className="card w-full max-w-lg space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{init.id ? 'Ubah informasi penyewa' : 'Tambah penyewa'}</h2><button type="button" onClick={onClose} aria-label="Tutup"><X /></button></div>
        <label className="block text-sm">Kamar<Sel k="room_code" opts={rooms.map((r) => [r.code, r.name])} /></label>
        <label className="block text-sm">Nama penyewa<input className="input" required value={f.tenant_name} onChange={set('tenant_name')} /></label>
        <label className="block text-sm">Nomor WA penyewa<input className="input" inputMode="tel" value={f.tenant_wa || ''} onChange={set('tenant_wa')} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Rentang sewa<Sel k="period_type" opts={[['harian', 'Harian'], ['mingguan', 'Mingguan'], ['bulanan', 'Bulanan']]} /></label>
          <label className="block text-sm">Status<Sel k="status" opts={[['survei', 'Survei'], ['booking', 'Booking'], ['aktif', 'Aktif'], ['selesai', 'Selesai']]} /></label>
          <label className="block text-sm">Status pembayaran<Sel k="payment_status" opts={[['none', 'Belum bayar'], ['dp', 'DP'], ['lunas', 'Lunas'], ['nunggak', 'Nunggak']]} /></label>
          <label className="block text-sm">Tanggal survei<input type="date" className="input" value={f.survey_date || ''} onChange={set('survey_date')} /></label>
          <label className="block text-sm">Tanggal masuk<input type="date" className="input" value={f.check_in || ''} onChange={set('check_in')} /></label>
          {f.period_type === 'harian' && <label className="block text-sm">Tanggal keluar<input type="date" className="input" value={f.check_out || ''} onChange={set('check_out')} /></label>}
        </div>
        {err && <p className="text-sm text-red-700">{err}</p>}
        <div className="flex gap-2"><button className="btn flex-1">Simpan</button>{init.id && <button type="button" onClick={del} className="btn-soft text-red-700">Hapus</button>}</div>
      </form>
    </div>
  );
}
