/**
 * Vercel serverless: proxy RSS feeds (bypass browser CORS).
 * Query: ?url=<encoded feed URL>
 */

const ALLOWED_HOSTS = new Set([
  'splash247.com',
  'www.splash247.com',
  'hellenicshippingnews.com',
  'www.hellenicshippingnews.com',
  'lloydslist.com',
  'www.lloydslist.com',
  'gcaptain.com',
  'www.gcaptain.com',
  'tradewindsnews.com',
  'www.tradewindsnews.com',
  'supplychaindive.com',
  'www.supplychaindive.com',
  'logisticsmgmt.com',
  'www.logisticsmgmt.com',
  'freightwaves.com',
  'www.freightwaves.com',
  'feeds.reuters.com',
  'www.reuters.com',
  'reuters.com',
  'ft.com',
  'www.ft.com',
  'porttechnology.org',
  'www.porttechnology.org',
  'maritimecyprus.com',
  'www.maritimecyprus.com',
  'joc.com',
  'www.joc.com',
  'manifoldtimes.com',
  'www.manifoldtimes.com',
  'marinelink.com',
  'www.marinelink.com',
  'ajot.com',
  'www.ajot.com',
  'ttnews.com',
  'www.ttnews.com',
  'internationaltransportjournal.com',
  'www.internationaltransportjournal.com',
  'seatrade-maritime.com',
  'www.seatrade-maritime.com',
  'worldcargonews.com',
  'www.worldcargonews.com',
  'offshore-energy.biz',
  'www.offshore-energy.biz',
  'rivieramm.com',
  'www.rivieramm.com',
]);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function isAllowedFeedUrl(feedUrl) {
  try {
    const { hostname } = new URL(feedUrl);
    return ALLOWED_HOSTS.has(hostname);
  } catch {
    return false;
  }
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

  const feedUrl = req.query?.url;
  if (!feedUrl || typeof feedUrl !== 'string') {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  if (!isAllowedFeedUrl(feedUrl)) {
    res.status(403).json({ error: 'Feed domain not allowed' });
    return;
  }

  try {
    const r = await fetch(feedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ChainFlowX-RSS-Proxy/1.0; +https://chainflowx)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!r.ok) {
      res.status(502).json({ error: `Upstream ${r.status}` });
      return;
    }

    const body = await r.text();
    const ct = r.headers.get('content-type') || 'application/xml';
    res.status(200).setHeader('Content-Type', ct).send(body);
  } catch (e) {
    res.status(502).json({ error: e?.message || 'Fetch failed' });
  }
}
