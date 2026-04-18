/**
 * Vercel serverless: forward GDELT v2 doc API (browser CORS workaround).
 * Passes through query string after validation.
 */

const GDELT_HOST = 'api.gdeltproject.org';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default async function handler(req, res) {
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const q = req.query?.q;
  if (!q || typeof q !== 'string' || q.length > 400) {
    res.status(400).json({ error: 'Missing or invalid q' });
    return;
  }

  const params = new URLSearchParams({
    query: q,
    mode: 'artlist',
    maxrecords: String(Math.min(50, Math.max(1, Number(req.query?.maxrecords) || 25))),
    format: 'json',
    timespan: typeof req.query?.timespan === 'string' ? req.query.timespan : '2h',
  });

  const target = `https://${GDELT_HOST}/api/v2/doc/doc?${params.toString()}`;

  try {
    const r = await fetch(target, {
      headers: { 'User-Agent': 'ChainFlowX-GDELT-Proxy/1.0' },
      signal: AbortSignal.timeout(25000),
    });
    const text = await r.text();
    res.status(r.ok ? 200 : 502).setHeader('Content-Type', 'application/json; charset=utf-8').send(text);
  } catch (e) {
    res.status(502).json({ error: e?.message || 'GDELT fetch failed' });
  }
}
