import './globals.css';
import Leaves from '@/components/Leaves';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pandanjogja.vercel.app';
const TITLE = 'Pandan Jogja — Homestay, Villa & Kos di Yogyakarta';
const DESC = 'Sewa harian, mingguan, dan bulanan di Yogyakarta. 7 kamar berperabot lengkap dengan dapur, teras, dan kebun pandan. Lihat kamar, cek ketersediaan, dan jadwalkan survei langsung di website.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s · Pandan Jogja' },
  description: DESC,
  applicationName: 'Pandan Jogja',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Pandan Jogja',
    url: SITE_URL,
    title: TITLE,
    description: DESC,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Pandan Jogja — Homestay & Villa, Yogyakarta' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/og.jpg'] },
  icons: { icon: '/kelinci.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body><Leaves />{children}</body>
    </html>
  );
}
