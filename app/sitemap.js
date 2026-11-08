import { getRooms } from '@/lib/data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pandanjogja.vercel.app';

export default async function sitemap() {
  const rooms = await getRooms().catch(() => []);
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    ...rooms.map((r) => ({
      url: `${SITE_URL}/kamar/${r.code}`,
      changeFrequency: 'daily',
      priority: 0.8,
    })),
  ];
}
