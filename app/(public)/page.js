import Link from 'next/link';
import { Home as HomeIcon, ChevronRight, CalendarDays, MapPin } from 'lucide-react';
import { getRooms, getPublicOcc } from '@/lib/data';
import { computeStatus, todayWIB, rp, fmtShort } from '@/lib/avail';
import { TYPE_PILL } from '@/lib/ui';
import RoomPhoto from '@/components/RoomPhoto';
import SectionHead from '@/components/SectionHead';
import Building from '@/components/Building';

const SUB = {
  'Bangunan A–C': 'Satu unit bangunan estetik dengan 3 ruangan, teras, dan fasilitas lengkap.',
  'Bangunan D': 'Dua kamar tidur, lorong santai, dapur, dan kamar mandi.',
  'Bangunan E–G': 'Tiga kamar (E, F, G) dalam satu gedung, dengan akses ke teras halaman.',
};

function RoomCard({ r, st, wide }) {
  return (
    <Link href={`/kamar/${r.code}`} className="flex overflow-hidden rounded-3xl border border-pandan-100 bg-white shadow-card transition hover:border-pandan-500">
      <RoomPhoto url={r.photo_url} className={`shrink-0 ${wide ? 'w-36 sm:w-64' : 'w-24 sm:w-28'}`} />
      <div className="flex flex-1 items-center gap-2 p-3.5 sm:p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pandan-100 text-lg font-extrabold">{r.code}</span>
            <span className={`badge ${st.state === 'tersedia' ? 'bg-pandan-100 text-pandan-900' : TYPE_PILL[st.type]}`}>{st.state === 'tersedia' ? 'Tersedia' : `Terisi (${st.type})`}</span>
          </div>
          <p className="text-sm font-bold">{r.price_daily ? `${rp(r.price_daily)} / hari` : 'Harga: diskusi via WhatsApp'}</p>
          {st.state === 'tersedia' && st.upcoming?.[0] && <p className="flex items-center gap-1.5 text-xs text-pandan-700"><CalendarDays size={13} />Dibooking {fmtShort(st.upcoming[0].from)} – {fmtShort(st.upcoming[0].to)}</p>}
          {st.state === 'terisi' && st.until && <p className="flex items-center gap-1.5 text-xs text-pandan-700"><CalendarDays size={13} />Sampai {fmtShort(st.until)}</p>}
        </div>
        <ChevronRight className="shrink-0 text-pandan-700" />
      </div>
    </Link>
  );
}

export default async function Home() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://pandanjogja.vercel.app';
  const wa = process.env.NEXT_PUBLIC_OWNER_WA || '';
  const [rooms, occ] = await Promise.all([getRooms(), getPublicOcc()]);
  const t = todayWIB();
  const items = rooms.map((r) => ({ r, st: computeStatus(r.code, occ, t) }));
  const groups = [...new Set(rooms.map((r) => r.building))];
  const address = process.env.NEXT_PUBLIC_ADDRESS;
  // Data terstruktur bisnis untuk Google & AI: siapa, di mana, apa yang disewakan.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: 'Pandan Jogja',
    description: 'Homestay, villa, dan kos di Yogyakarta: 7 kamar berperabot lengkap, sewa harian, mingguan, dan bulanan.',
    url: site,
    image: `${site}/og.jpg`,
    priceRange: 'IDR 150000 - 1500000',
    ...(address ? { address: { '@type': 'PostalAddress', streetAddress: address, addressLocality: 'Yogyakarta', addressRegion: 'DI Yogyakarta', addressCountry: 'ID' } } : {}),
    ...(wa ? { telephone: `+${String(wa).replace(/\D/g, '')}` } : {}),
    makesOffer: rooms.map((r) => ({
      '@type': 'Offer',
      url: `${site}/kamar/${r.code}`,
      itemOffered: { '@type': 'Accommodation', name: `${r.name} Pandan Jogja` },
      ...(r.price_monthly ? { price: r.price_monthly, priceCurrency: 'IDR' } : {}),
    })),
  };

  return (
    <main className="mx-auto max-w-5xl px-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="pt-6 sm:pt-8">
        <h1 className="flex items-start gap-2 text-2xl font-extrabold leading-tight sm:text-4xl">
          <span>Pilih pintu kamarmu,<br />lalu lihat detailnya.</span>
          <svg aria-hidden viewBox="0 0 30 30" className="mt-1 h-6 w-6 shrink-0 sm:h-8 sm:w-8" fill="none" stroke="#6FA35A" strokeWidth="3" strokeLinecap="round"><path d="M6 6l6 5M16 3l2 7M4 16l7 1" /></svg>
        </h1>
        <p className="mt-2 text-sm text-pandan-900 sm:text-base">Klik salah satu pintu untuk melihat detail kamar, foto, dan jadwalkan survei.</p>
        <div id="pintu"><Building items={items} /></div>
      </section>

      <section className="mt-12 space-y-8">
        {groups.map((g) => {
          const list = items.filter((x) => x.r.building === g);
          return (
            <div key={g}>
              <SectionHead compact icon={HomeIcon} title={g} sub={SUB[g]} />
              <div className={`grid gap-4 ${list.length >= 3 ? 'md:grid-cols-3' : list.length === 2 ? 'md:grid-cols-2' : ''}`}>
                {list.map(({ r, st }) => <RoomCard key={r.code} r={r} st={st} wide={list.length === 1} />)}
              </div>
            </div>
          );
        })}

        {address && (
          <div className="card flex flex-wrap items-center gap-4 !p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pandan-500 text-white"><MapPin size={22} /></span>
            <div className="min-w-0 flex-1"><h2 className="font-extrabold">Pandan Jogja 1</h2><p className="text-sm text-pandan-700">{address}</p></div>
            <a className="btn-soft text-sm" target="_blank" rel="noreferrer" href={process.env.NEXT_PUBLIC_MAPS_URL || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}>Buka di Maps</a>
          </div>
        )}

        <div className="relative overflow-hidden rounded-3xl border border-pandan-100 bg-pandan-50 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <svg aria-hidden viewBox="0 0 48 48" className="h-14 w-14 shrink-0"><path d="M6 24 24 8l18 16v18H6Z" fill="#B2CD94" /><rect x="14" y="26" width="6" height="6" rx="1" fill="#F5F8EF" /><rect x="26" y="26" width="6" height="6" rx="1" fill="#F5F8EF" /><path d="M38 6l1.5 3.5L43 11l-3.5 1.5L38 16l-1.5-3.5L33 11l3.5-1.5Z" fill="#EBBB83" /></svg>
            <div>
              <h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">Pandan Jogja 2 <span className="badge bg-amber-100 text-amber-800">Coming Soon</span></h2>
              <p className="mt-1 text-sm text-pandan-700">Lokasi kedua Pandan Jogja sedang dalam tahap persiapan. Nantikan info selanjutnya, ya!</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
