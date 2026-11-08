import { notFound } from 'next/navigation';
import { getRooms, getPublicOcc } from '@/lib/data';
import { computeStatus, rp, todayWIB } from '@/lib/avail';
import RoomBooking from '@/components/RoomBooking';

export async function generateMetadata({ params }) {
  const code = String(params.code || '').toUpperCase();
  const rooms = await getRooms().catch(() => []);
  const room = rooms.find((r) => r.code === code);
  if (!room) return { title: 'Kamar tidak ditemukan' };
  const harga = room.price_daily ? `${rp(room.price_daily)} harian, ${rp(room.price_weekly)} mingguan, ${rp(room.price_monthly)} bulanan.` : 'Harga tanya pemilik langsung.';
  return {
    title: `${room.name} — Kos & Homestay Pandan Jogja Yogyakarta`,
    description: `${room.description} ${harga} Cek ketersediaan dan jadwalkan survei di website resmi Pandan Jogja.`,
    openGraph: {
      title: `${room.name} · Pandan Jogja`,
      description: `${room.description} ${harga}`,
      url: `/kamar/${room.code}`,
      images: room.photo_url ? [{ url: room.photo_url }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: `${room.name} · Pandan Jogja`, description: `${room.description} ${harga}` },
  };
}

export default async function KamarPage({ params }) {
  const code = params.code.toUpperCase();
  const [rooms, occ] = await Promise.all([getRooms(), getPublicOcc()]);
  const room = rooms.find((r) => r.code === code);
  if (!room) notFound();
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://pandanjogja.vercel.app';
  // Data terstruktur schema.org supaya Google & AI asisten "membaca" kamar ini sebagai data objek, bukan teks bebas.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: `${room.name} Pandan Jogja`,
    description: room.description,
    image: room.photo_url ? [room.photo_url].flat() : [`${site}/og.jpg`],
    maximumAttainableGuests: room.capacity || undefined,
    amenityFeature: (room.facilities || []).map((f) => ({ '@type': 'LocationFeatureSpecification', name: f, value: true })),
    address: { '@type': 'PostalAddress', addressLocality: 'Yogyakarta', addressRegion: 'DI Yogyakarta', addressCountry: 'ID' },
    offers: {
      '@type': 'Offer',
      url: `${site}/kamar/${room.code}`,
      priceCurrency: 'IDR',
      price: room.price_monthly || room.price_weekly || room.price_daily || undefined,
      availability: computeStatus(code, occ, todayWIB()).state === 'tersedia' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    },
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <RoomBooking room={room} status={computeStatus(code, occ, todayWIB())} wa={process.env.NEXT_PUBLIC_OWNER_WA || ''} />
  </>;
}
