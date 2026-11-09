import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { ROOMS } from '../lib/rooms-data.mjs';

const sql = neon(process.env.DATABASE_URL);
const run = (t, p = []) => sql.query(t, p);

await run(`create table if not exists owners (id serial primary key, username text unique not null, password_hash text not null)`);
await run(`create table if not exists rooms (
  code text primary key, name text not null, building text, location int default 1, description text,
  facilities jsonb default '[]', video_url text, price_daily int, price_weekly int, price_monthly int,
  tags jsonb default '[]', capacity int default 1)`);
await run('alter table rooms add column if not exists photo_url text');
await run(`create table if not exists tenancies (
  id serial primary key, room_code text references rooms(code) on update cascade,
  tenant_name text not null, tenant_wa text, period_type text not null default 'bulanan',
  payment_status text not null default 'none', status text not null default 'aktif',
  survey_date date, check_in date, check_out date, created_at timestamptz default now())`);
await run(`create table if not exists waitlist (
  id serial primary key, room_code text references rooms(code) on update cascade,
  name text not null, origin text, wa text not null, created_at timestamptz default now())`);
await run(`create table if not exists login_gagal (
  ip text not null, at timestamptz not null default now())`);
await run('create index if not exists login_gagal_ip_at on login_gagal (ip, at)');
// Rate limit endpoint publik (chat, waiting list, dsb).
await run(`create table if not exists rate_hits (
  bucket text not null, key text not null, at timestamptz not null default now())`);
await run('create index if not exists rate_hits_lookup on rate_hits (bucket, key, at)');
// Audit request yang diblokir (guard/rate limit/CAPTCHA) + penanda alert 429.
await run(`create table if not exists security_events (
  id bigserial primary key, kind text not null, ip text, path text, detail text,
  created_at timestamptz not null default now())`);
await run('create index if not exists security_events_lookup on security_events (kind, created_at)');
// CAPTCHA waiting list: jawaban disimpan di server, token HMAC sekali pakai.
await run(`create table if not exists waitlist_challenges (
  nonce text primary key, answer int not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null, used_at timestamptz)`);
await run('create index if not exists waitlist_challenges_expiry on waitlist_challenges (expires_at)');

for (const r of ROOMS) {
  await run(
    `insert into rooms (code,name,building,description,facilities,price_daily,price_weekly,price_monthly,tags,capacity)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (code) do nothing`,
    [r.code, r.name, r.building, r.description, JSON.stringify(r.facilities), r.price_daily, r.price_weekly, r.price_monthly, JSON.stringify(r.tags), r.capacity]
  );
}

const user = (process.env.SEED_OWNER_USERNAME || 'pemilik').toLowerCase();
const pass = process.env.SEED_OWNER_PASSWORD;
if (pass) {
  const hash = bcrypt.hashSync(pass, 10);
  await run(
    `insert into owners (username,password_hash) values ($1,$2)
     on conflict (username) do update set password_hash = excluded.password_hash`,
    [user, hash]
  );
  console.log(`Akun pemilik siap: ${user}`);
} else console.log('SEED_OWNER_PASSWORD kosong, akun pemilik tidak dibuat/di-reset.');
console.log('Database siap.');
