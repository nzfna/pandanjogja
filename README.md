# Pandan Jogja

Next.js 14 + Tailwind + Neon (Postgres serverless). Tanpa daftar akun: hanya pemilik yang login.

## Mulai (pertama kali pakai Neon)
1. Daftar di neon.tech, buat project baru. Di Dashboard > Connect, salin connection string (pilih "Pooled connection").
2. `cp .env.example .env.local`, isi `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), `SEED_OWNER_PASSWORD`, `NEXT_PUBLIC_OWNER_WA`, `NEXT_PUBLIC_DEV_WA`.
3. `npm install`
4. `npm run db:setup` (membuat tabel, mengisi kamar A–G, membuat akun pemilik)
5. `npm run dev`, lalu buka http://localhost:3000 dan http://localhost:3000/owner/login

## Ganti password pemilik
Pemilik tidak bisa daftar/reset sendiri. Developer mengubah `SEED_OWNER_PASSWORD`, lalu menjalankan `npm run db:setup` lagi.

## Deploy
Push ke GitHub, import ke Vercel, isi env yang sama di Settings > Environment Variables.
