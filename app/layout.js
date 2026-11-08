import './globals.css';
import Leaves from '@/components/Leaves';

export const metadata = { title: 'Pandan Jogja — Homestay, Villa & Kos', description: 'Pilih pintu kamar, lihat video, dan jadwalkan survei di Pandan Jogja.' };

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
