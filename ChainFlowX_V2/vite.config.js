import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const RSS_ALLOWED = new Set([
  'splash247.com', 'www.splash247.com',
  'hellenicshippingnews.com', 'www.hellenicshippingnews.com',
  'lloydslist.com', 'www.lloydslist.com',
  'gcaptain.com', 'www.gcaptain.com',
  'tradewindsnews.com', 'www.tradewindsnews.com',
  'supplychaindive.com', 'www.supplychaindive.com',
  'logisticsmgmt.com', 'www.logisticsmgmt.com',
  'freightwaves.com', 'www.freightwaves.com',
  'feeds.reuters.com', 'www.reuters.com', 'reuters.com',
  'ft.com', 'www.ft.com',
  'porttechnology.org', 'www.porttechnology.org',
  'maritimecyprus.com', 'www.maritimecyprus.com',
  'joc.com', 'www.joc.com',
  'manifoldtimes.com', 'www.manifoldtimes.com',
  'marinelink.com', 'www.marinelink.com',
  'ajot.com', 'www.ajot.com',
  'ttnews.com', 'www.ttnews.com',
  'internationaltransportjournal.com', 'www.internationaltransportjournal.com',
  'seatrade-maritime.com', 'www.seatrade-maritime.com',
  'worldcargonews.com', 'www.worldcargonews.com',
  'offshore-energy.biz', 'www.offshore-energy.biz',
  'rivieramm.com', 'www.rivieramm.com',
]);

function chainflowxDevApiProxy() {
  return {
    name: 'chainflowx-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const raw = req.url || '';
        if (!raw.startsWith('/api/rss-proxy') && !raw.startsWith('/api/gdelt-doc')) {
          return next();
        }

        const u = new URL(raw, 'http://localhost');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        try {
          if (raw.startsWith('/api/rss-proxy')) {
            const feedUrl = u.searchParams.get('url');
            if (!feedUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing url' }));
              return;
            }
            let hostname;
            try {
              hostname = new URL(feedUrl).hostname;
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Bad url' }));
              return;
            }
            if (!RSS_ALLOWED.has(hostname)) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Domain not allowed' }));
              return;
            }
            const r = await fetch(feedUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ChainFlowX-Dev/1.0)',
                Accept: 'application/rss+xml, application/xml, text/xml, */*',
              },
              signal: AbortSignal.timeout(20000),
            });
            const body = await r.text();
            res.statusCode = r.ok ? 200 : 502;
            res.setHeader('Content-Type', r.headers.get('content-type') || 'application/xml');
            res.end(body);
            return;
          }

          const q = u.searchParams.get('q');
          if (!q || q.length > 400) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing q' }));
            return;
          }
          const max = Math.min(50, Math.max(1, Number(u.searchParams.get('maxrecords')) || 25));
          const timespan = u.searchParams.get('timespan') || '2h';
          const target = `https://api.gdeltproject.org/api/v2/doc/doc?${new URLSearchParams({
            query: q,
            mode: 'artlist',
            maxrecords: String(max),
            format: 'json',
            timespan,
          })}`;
          const r = await fetch(target, {
            headers: { 'User-Agent': 'ChainFlowX-Dev/1.0' },
            signal: AbortSignal.timeout(25000),
          });
          const text = await r.text();
          res.statusCode = r.ok ? 200 : 502;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(text);
        } catch (e) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e?.message || 'proxy error' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), chainflowxDevApiProxy()],
  server: {
    port: 3000,
    proxy: {
      '/api/opensky': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opensky/, '/api/states/all'),
      },
    },
  },
  resolve: {
    alias: {
      // three-globe v2.45 imports three/webgpu + three/tsl which don't exist
      // in three v0.160. Redirect to no-op stubs so the bundle won't break.
      'three/webgpu': path.resolve('./src/stubs/three-webgpu.js'),
      'three/tsl':    path.resolve('./src/stubs/three-tsl.js'),
    },
  },
});
