// Pemanggil API di sisi browser: selalu memunculkan pesan error yang jelas.
export async function call(url, method, body) {
  let r;
  try {
    r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Tidak bisa terhubung ke server.');
  }
  let d = {};
  try { d = await r.json(); } catch {}
  if (r.status === 401) { location.href = '/owner/login'; throw new Error('Sesi habis, silakan login ulang.'); }
  if (!r.ok) throw new Error(d.error || `Gagal (kode ${r.status}).`);
  return d;
}
