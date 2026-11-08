'use client';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useTenantModal } from './OwnerShell';
import { PAY, STATUS } from '@/lib/ui';
import { fmtShort, fmtDate } from '@/lib/avail';

const wa = (n) => `https://wa.me/${n.replace(/\D/g, '').replace(/^0/, '62')}`;
const Head = ({ cols }) => <thead className="bg-pandan-50"><tr>{cols.map((h) => <th key={h} className="px-3 py-2.5 font-bold">{h}</th>)}</tr></thead>;

export function AddTenantButton() {
  const open = useTenantModal();
  return <button className="btn" onClick={() => open({})}><Plus size={18} />Tambah Penyewa</button>;
}

export function TenantTable({ rows }) {
  const open = useTenantModal();
  if (!rows.length) return <p className="text-sm text-pandan-700">Belum ada data. Tekan tombol + untuk menambah penyewa.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-pandan-100">
      <table className="w-full min-w-[820px] text-left text-sm">
        <Head cols={['Kamar', 'Nama Penyewa', 'No. WA', 'Status', 'Tgl Survei', 'Tgl Masuk', 'Tgl Keluar', 'Pembayaran', '']} />
        <tbody>
          {rows.map((t) => { const [pl, pc] = PAY[t.payment_status] || PAY.none; const [sl, sc] = STATUS[t.status] || STATUS.aktif; return (
            <tr key={t.id} className="border-t border-pandan-100">
              <td className="px-3 py-3 font-extrabold">{t.room_code}</td><td className="px-3 py-3">{t.tenant_name}</td>
              <td className="px-3 py-3">{t.tenant_wa ? <a className="underline" href={wa(t.tenant_wa)}>{t.tenant_wa}</a> : '–'}</td>
              <td className="px-3 py-3"><span className={`badge ${sc}`}>{sl}</span></td>
              <td className="px-3 py-3">{fmtShort(t.survey_date)}</td><td className="px-3 py-3">{fmtShort(t.check_in)}</td><td className="px-3 py-3">{fmtShort(t.check_out)}</td>
              <td className="px-3 py-3"><span className={`badge ${pc}`}>{pl}</span></td>
              <td className="px-3 py-3"><button onClick={() => open(t)} aria-label="Ubah" className="rounded-full p-1.5 hover:bg-pandan-100"><Pencil size={16} /></button></td>
            </tr>); })}
        </tbody>
      </table>
    </div>
  );
}

export function WaitTable({ rows }) {
  const router = useRouter();
  if (!rows.length) return <p className="text-sm text-pandan-700">Waiting list kosong.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-pandan-100">
      <table className="w-full min-w-[520px] text-left text-sm">
        <Head cols={['No', 'Nama', 'No. WA', 'Kamar', 'Tanggal Daftar', '']} />
        <tbody>{rows.map((w, i) => (
          <tr key={w.id} className="border-t border-pandan-100">
            <td className="px-3 py-3 font-bold">{i + 1}</td><td className="px-3 py-3">{w.name}{w.origin && <span className="block text-xs text-pandan-700">{w.origin}</span>}</td>
            <td className="px-3 py-3"><a className="underline" href={wa(w.wa)}>{w.wa}</a></td><td className="px-3 py-3 font-extrabold">{w.room_code}</td>
            <td className="px-3 py-3">{fmtDate(w.created_at.slice(0, 10))}</td>
            <td className="px-3 py-3"><button aria-label="Hapus" className="rounded-full p-1.5 hover:bg-red-50" onClick={async () => { await fetch(`/api/owner/waitlist/${w.id}`, { method: 'DELETE' }); router.refresh(); }}><Trash2 size={16} /></button></td>
          </tr>))}</tbody>
      </table>
    </div>
  );
}
