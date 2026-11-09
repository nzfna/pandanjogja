// Provider LLM bersama (dipakai AI owner dan chatbot publik).
// Urutan: Groq -> Cloudflare Workers AI. Keduanya gratis; kalau satu kena
// limit/tidak diisi key-nya, otomatis lanjut ke berikutnya. Kalau keduanya
// gagal, pemanggil memakai jawaban lokal sendiri (fitur tidak pernah mati).
export async function generate(messages, maxTokens = 700) {
  // 1) Groq (utama) — API OpenAI-compatible.
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { authorization: `Bearer ${groqKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          max_tokens: maxTokens,
          messages,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d.choices?.[0]?.message?.content?.trim();
        if (t) return { text: t, via: 'groq' };
      } else {
        console.error('Groq gagal:', r.status, (await r.text()).slice(0, 200));
      }
    } catch (e) { console.error('Groq error:', e.message); }
  }

  // 2) Cloudflare Workers AI (cadangan).
  const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  if (cfAccount && cfToken) {
    try {
      const model = process.env.CF_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${model}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${cfToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ messages, max_tokens: maxTokens }),
        signal: AbortSignal.timeout(20_000),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d.result?.response?.trim();
        if (t) return { text: t, via: 'cloudflare' };
      } else {
        console.error('Cloudflare gagal:', r.status, JSON.stringify(d && d.errors).slice(0, 200));
      }
    } catch (e) { console.error('Cloudflare error:', e.message); }
  }

  // 3) Tanpa key / kedua provider gagal.
  return null;
}
