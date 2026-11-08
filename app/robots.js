const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pandanjogja.vercel.app';

export default function robots() {
  return {
    rules: [
      // Semua crawler boleh; area owner & API tidak perlu muncul di hasil pencarian.
      { userAgent: '*', allow: '/', disallow: ['/owner', '/api/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
