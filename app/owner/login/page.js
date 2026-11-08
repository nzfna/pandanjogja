'use client';
import { useState } from 'react';

export default function Login() {
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr('');
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
    if (r.ok) location.href = '/owner'; else setErr((await r.json()).error);
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <img src="/kelinci.png" alt="" className="mx-auto h-28 w-28 rounded-full object-cover" />
      <h1 className="mt-4 text-center text-3xl font-extrabold">Masuk pemilik</h1>
      <form onSubmit={submit} className="card mt-6 space-y-3">
        <input className="input" placeholder="Username" autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <input className="input" type="password" placeholder="Password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        {err && <p className="text-sm text-red-700" role="alert">{err}</p>}
        <button className="btn w-full">Masuk</button>
      </form>
      <p className="mt-4 text-center text-sm text-pandan-700">Lupa atau ingin ganti password? <a className="underline" href={`https://wa.me/${process.env.NEXT_PUBLIC_DEV_WA || ''}`}>Hubungi developer</a>.</p>
    </main>
  );
}
