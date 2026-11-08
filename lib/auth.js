import { SignJWT, jwtVerify } from 'jose';
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);
export const COOKIE = 'pj_session';
export const MAX_AGE = 60 * 60 * 24 * 60; // sesi login 2 bulan
export const sign = (uid) => new SignJWT({ uid }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('60d').sign(key());
export async function verify(token) {
  if (!token) return null;
  try { return (await jwtVerify(token, key())).payload; } catch { return null; }
}
