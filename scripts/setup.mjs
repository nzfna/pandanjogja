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
