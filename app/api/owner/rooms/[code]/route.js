import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { safe, requireOwner } from '@/lib/api';
import { cleanLine, cleanText, parsePrice, roomCode, safeUrl } from '@/lib/sanitize';
import { readJson } from '@/lib/guard';

export const PATCH = safe(async (req, { params }) => {
  const denied = await requireOwner(req);
  if (denied) return denied;

  const { code: rawCode } = await params;
  const code = roomCode(rawCode);
  if (!code) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = await readJson(req, 32 * 1024);
  if (!body.ok) return NextResponse.json({ error: 'bad request' }, { status: body.code });

  const b = body.data;
  const description = cleanText(b.description, 1000, { multiline: true });

  if (b.facilities != null && !Array.isArray(b.facilities)) {
    return NextResponse.json({ error: 'Fasilitas tidak valid.' }, { status: 400 });
  }
  const facilities = (b.facilities || []).slice(0, 40)
    .map((f) => cleanLine(f, 120))
    .filter(Boolean);

  const video = b.video_url ? safeUrl(b.video_url) : '';
  const photo = b.photo_url ? safeUrl(b.photo_url) : '';
  if ((b.video_url && !video) || (b.photo_url && !photo)) {
    return NextResponse.json({ error: 'Link harus diawali http(s):// atau / untuk file di folder public.' }, { status: 400 });
  }

  const prices = ['price_daily', 'price_weekly', 'price_monthly'].map((k) => parsePrice(b[k]));
  if (prices.some((p) => !p.ok)) {
    return NextResponse.json({ error: 'Harga tidak valid (isi angka 0 atau lebih).' }, { status: 400 });
  }
  const [priceDaily, priceWeekly, priceMonthly] = prices.map((p) => p.value);

  await q('update rooms set description=$1,facilities=$2,video_url=$3,photo_url=$4,price_daily=$5,price_weekly=$6,price_monthly=$7 where code=$8', [
    description, JSON.stringify(facilities), video || null, photo || null, priceDaily, priceWeekly, priceMonthly, code,
  ]);
  return NextResponse.json({ ok: true });
});
