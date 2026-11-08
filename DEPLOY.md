# Panduan Deploy Vercel (Gratis) — untuk yang belum pernah pakai Vercel

Aplikasi ini bisa jalan gratis penuh di Vercel + Neon (database) + Groq (AI). Semua free tier.

## Gambaran 1 menit

```
Komputermu (kode) → GitHub (tempat menyimpan kode) → Vercel (hosting web) → Neon (database)
```

Yang perlu disiapkan cuma **2 akun**: GitHub dan Vercel. Neon kamu sudah jalan.

---

## Langkah 0: cek lokal dulu

```bash
npm run build    # harus lulus tanpa error
```

Database kamu sudah berisi kamar A–G dan akun pemilik — **tidak perlu setup ulang di Vercel**
(Vercel tidak menjalankan `db:setup`; dia hanya melayani website-nya).

---

## Langkah 1: simpan kode ke GitHub

1. Buat akun di [github.com](https://github.com) kalau belum ada.
2. Buat **repository baru**, pilih **Private** (repo ini berisi aplikasi bisnis kecil — jaga saja).
3. Jalankan di folder project:

```bash
# cek dulu: .env.local TIDAK boleh ikut (lihat file .gitignore sudah berisinya)
git init
git add .
git commit -m "pandan-jogja siap deploy"
git branch -M main
git remote add origin https://github.com/USERNAME/pandan-jogja.git
git push -u origin main
```

4. Buka repo di GitHub → pastikan **tidak ada file `.env` / `.env.local`** yang tampil.
   Kalau ternyata ke-push: hapus file itu, lalu **ganti `AUTH_SECRET` + password pemilik**.

---

## Langkah 2: daftar Vercel

1. Buka [vercel.com](https://vercel.com) → **Sign Up** → pilih **Continue with GitHub**.
2. Free tier, tanpa kartu kredit.

---

## Langkah 3: import project

1. Dashboard Vercel → tombol **Add New... → Project**.
2. Klik **Import** di repo `pandan-jogja`.
3. Framework Preset otomatis terdeteksi **Next.js** → biarkan standar, jangan ubah Build Command/Output.

---

## Langkah 4 (PENTING): isi Environment Variables SEBELUM deploy

Di halaman import, buka bagian **Environment Variables** dan isi:

| Nama | Isi | Catatan |
|---|---|---|
| `DATABASE_URL` | Salin **Pooled connection** dari Neon | Neon: Dashboard → Connect → centang "Pooled connection" |
| `AUTH_SECRET` | baru, buat dengan `openssl rand -base64 32` | Boleh beda dari yang lokal |
| `NEXT_PUBLIC_OWNER_WA` | 628xx... | Note: nilai ini dibakar ke JS saat build → harus di-set sebelum build |
| `NEXT_PUBLIC_DEV_WA` | 628xx... | idem |
| `NEXT_PUBLIC_ADDRESS` | teks alamat (opsional) | idem |
| `GROQ_API_KEY` | dari [console.groq.com](https://console.groq.com) | opsional, buat fitur AI pemilik |
| `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` | dari dashboard Cloudflare | opsional, cadangan AI |

> ⚠️ **Jangan** taruh `SEED_OWNER_PASSWORD` / `SEED_OWNER_USERNAME` di Vercel.
> Akun pemilik cukup dibuat/reset dari lokal dengan `npm run db:setup`.

Setelah semua diisi: centang **Production** dan **Preview** → tekan **Deploy** → tunggu ~1 menit.

---

## Langkah 5 (PENTING): geser Region server ke Singapore

Database-mu di Neon `ap-southeast-1` (Indo/malaysia region). Kalau Vercel default (iad1, Virginia) →
setiap query DB naik +200 ms lintas benua:

1. Vercel: tab **Settings** → **Functions** → **Function Region**.
2. Pilih **Singapore (sin1)** → Save.
3. Tab **Deployments** → ambil vercel deploy terbaru → **Redeploy** supaya region efektif.

---

## Langkah 6: cek hasil deploy

Buka URL yang dikasih Vercel (mis. `pandan-jogja.vercel.app`), cek cepat:

1. **Halaman utama + kamar A–G** tampil lengkap dengan harga & status okupansi.
2. **`/owner/login`** bisa login pakai username/password di database kamu.
3. Setelah login di browser: **DevTools → Application → Cookies** → cookie `pj_session`
   harus punya tanda **Secure + HttpOnly** (otomatis: `NODE_ENV=production` di Vercel).
4. **Buka `/owner` tanpa login** (misal browser incognito) → harus ditolak/dialihkan ke login.
5. Sosial share: Vercel → tab **Functions** di project metadata → region harus tercatat `sin1`.
6. Vercel → tab **Logs** → tidak ada error saat kamu membuka halaman-halaman.

---

## Langkah 7: rutinitas setelah live (opsional)

- **Custom domain**: Settings → Domains → Add (hanya biaya domain; hosting tetap gratis).
- **Update aplikasi**: cukup `git push` → Vercel otomatis deploy ulang.
- Matikan fitur AI tanpa edit kode: hapus `GROQ_API_KEY` di Vercel → Redeploy → auto kembali ke template.

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| 500 / "Database error" | `DATABASE_URL` salah / bukan pooled / Neon project ternyata belum aktif — cek di dashboard Neon |
| AI selalu versi template | `GROQ_API_KEY` belum di-set di Vercel, atau belum **Redeploy** setelah men set env |
| Halaman berat saat pertama dibuka | Cold start serverless 1–3 dtk — normal di free tier |
| `NEXT_PUBLIC_*` muncul default / kosong | Env diisi SETELAH deploy pertama → **Redeploy** (nilai NEXT_PUBLIC dibakar saat build) |
