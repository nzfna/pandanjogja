import Link from 'next/link';
import { Users } from 'lucide-react';
import { getWaitlist } from '@/lib/data';
import { WaitTable } from '@/components/TenantTable';
import SectionHead from '@/components/SectionHead';

export default async function Waiting() {
  const rows = await getWaitlist();
  return (
    <main className="card !p-6">
      <SectionHead icon={Users} title="Waiting List" sub="Semua pengunjung yang menunggu kamar."><Link href="/owner" className="btn-soft text-sm">← Dashboard</Link></SectionHead>
      <WaitTable rows={rows} />
    </main>
  );
}
