import { neon } from '@neondatabase/serverless';
let client;
export function q(text, params = []) {
  // no-store: cegah cache fetch bawaan Next.js menahan hasil query lama (data tidak langsung ter-update)
  client ??= neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });
  return client.query(text, params);
}
