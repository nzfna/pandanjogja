/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async headers() {
    if (process.env.NODE_ENV !== 'production') return []; // dev: biarkan HMR jalan bebas

    // CSP dibuat pas dengan kebutuhan situs: embed YouTube/Instagram + video langsung.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",           // inline hydration Next.js
      "style-src 'self' 'unsafe-inline'",            // inline style Next.js/Tailwind
      "img-src 'self' data: https:",                 // foto kamar boleh ber-URL eksternal
      "media-src 'self' https: blob:",               // <video> URL bebas
      "frame-src https://www.youtube.com https://www.instagram.com", // VideoPreview embed
      "connect-src 'self'",
      "frame-ancestors 'none'",                      // setara X-Frame-Options: DENY
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};
