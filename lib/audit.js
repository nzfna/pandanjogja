import { q } from './db';

// Audit ringan untuk request yang diblokir (guard, rate limit, CAPTCHA) dan
// alarm sederhana saat 429 melonjak. Kegagalan audit tidak boleh mematikan
// permintaan utama, jadi semua error di sini ditelan + dicatat ke console.
let schemaReady = null;

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await q(`create table if not exists security_events (
        id bigserial primary key,
        kind text not null,
        ip text,
        path text,
        detail text,
        created_at timestamptz not null default now()
      )`);
      await q(`create index if not exists security_events_lookup on security_events (kind, created_at)`);
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

const ALERT_WINDOW_MIN = Number(process.env.SECURITY_ALERT_WINDOW_MIN) || 5;
const ALERT_THRESHOLD = Number(process.env.SECURITY_ALERT_429_THRESHOLD) || 25;
const ALERT_COOLDOWN_MIN = Number(process.env.SECURITY_ALERT_COOLDOWN_MIN) || 10;
const ALERT_WEBHOOK = process.env.SECURITY_ALERT_WEBHOOK || '';

let lastSpikeCheck = 0;

async function maybeAlertSpike() {
  const now = Date.now();
  // Jangan query hitung tiap request; cukup sekali per 30 detik per instance.
  if (now - lastSpikeCheck < 30_000) return;
  lastSpikeCheck = now;

  try {
    const countRows = await q(
      `select count(*)::int c from security_events
       where kind='rate_limit' and created_at > now() - ($1::int * interval '1 minute')`,
      [ALERT_WINDOW_MIN]
    );
    const count = countRows[0]?.c || 0;
    if (count < ALERT_THRESHOLD) return;

    const recentAlert = await q(
      `select 1 from security_events
       where kind='alert_429' and created_at > now() - ($1::int * interval '1 minute')
       limit 1`,
      [ALERT_COOLDOWN_MIN]
    );
    if (recentAlert.length) return;

    const detail = `${count} request diblokir (429) dalam ${ALERT_WINDOW_MIN} menit`;
    await q(`insert into security_events (kind, detail) values ('alert_429', $1)`, [detail]);
    console.error(`[security] ALERT lonjakan 429: ${detail}`);

    if (ALERT_WEBHOOK) {
      await fetch(ALERT_WEBHOOK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'rate_limit_spike', count, windowMinutes: ALERT_WINDOW_MIN, at: new Date().toISOString() }),
        signal: AbortSignal.timeout(5000),
      }).catch((e) => console.error('webhook alert gagal:', e.message));
    }
  } catch (e) {
    console.error('cek lonjakan 429 gagal:', e.message);
  }
}

export async function auditBlocked({ kind, ip = '', path = '', detail = '' }) {
  try {
    await ensureSchema();
    await q(
      `insert into security_events (kind, ip, path, detail) values ($1,$2,$3,$4)`,
      [kind, String(ip).slice(0, 64) || null, String(path).slice(0, 200) || null, String(detail).slice(0, 500) || null]
    );
  } catch (e) {
    console.error('audit blocked gagal:', e.message);
  }

  if (kind === 'rate_limit') await maybeAlertSpike();
}
