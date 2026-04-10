import { useEffect, useMemo, useState } from 'react';
import { fetchLatestEvents } from '../data/liveEventFeed.js';
import { ROUTES } from '../data/routes.js';

function findAffectedRoutes(article, allRoutes) {
  const text = `${article.headline || ''} ${article.description || ''}`.toLowerCase();
  return allRoutes.filter((route) => {
    const routeTerms = [
      route.from?.name,
      route.to?.name,
      route.chokepoint,
      ...(route.chokepoints || []),
    ]
      .filter(Boolean)
      .map((term) => String(term).toLowerCase());

    return routeTerms.some((term) => text.includes(term));
  });
}

function tierToSeverity(tier) {
  const t = String(tier || 'info').toLowerCase();
  if (t === 'critical') return 'CRITICAL';
  if (t === 'high') return 'HIGH';
  if (t === 'medium') return 'MEDIUM';
  if (t === 'low') return 'LOW';
  return 'INFO';
}

export default function IntelligenceFeed({ liveEvents = [], feedUpdatedAt = 0, onRouteSelect, onOpenRoutes }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFeed = async () => {
    setLoading(true);
    setError('');
    try {
      await fetchLatestEvents();
    } catch (err) {
      setError('Failed to refresh intelligence feed.');
      console.error('[ChainFlowX] intelligence feed refresh failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchLatestEvents().catch((err) => console.warn('[ChainFlowX] intelligence auto-refresh', err));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const enriched = useMemo(() => {
    return liveEvents.map((article) => ({
      ...article,
      affectedRoutes: findAffectedRoutes(article, ROUTES),
      severityLabel: tierToSeverity(article.keyword?.tier),
    }));
  }, [liveEvents]);

  const stats = useMemo(() => {
    const critical = enriched.filter((article) => article.severityLabel === 'CRITICAL').length;
    const avg = enriched.length
      ? (
          enriched.reduce(
            (sum, article) =>
              sum + (article.displayRelevance ?? article.keyword?.supplyChainRelevance ?? 0),
            0,
          ) / enriched.length
        ).toFixed(2)
      : '0.00';
    return { critical, avg };
  }, [enriched]);

  const updatedAtLabel = feedUpdatedAt
    ? new Date(feedUpdatedAt).toLocaleTimeString()
    : 'Not updated yet';

  const showEmptyPlaceholder = !loading && !error && enriched.length === 0;

  return (
    <section className="intelligence-feed-page">
      <header className="intelligence-feed-page__header">
        <div>
          <h1>Supply Chain Intelligence Feed</h1>
          <p>Live WorldMonitor stream: RSS, GDELT, and supply-chain classified events.</p>
        </div>
        <button type="button" onClick={() => void loadFeed()} disabled={loading} className="intelligence-feed-page__refresh">
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      <div className="intelligence-feed-page__meta">
        <span>{enriched.length} events</span>
        <span>{stats.critical} critical severity</span>
        <span>Avg relevance {stats.avg}</span>
        <span>Updated {updatedAtLabel}</span>
      </div>

      {error && <div className="intelligence-feed-page__error">{error}</div>}

      <div className="intelligence-feed-page__list">
        {showEmptyPlaceholder ? (
          <div style={{ padding: '24px 12px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
            Monitoring live global supply chain feeds...
          </div>
        ) : (
          enriched.map((article, idx) => {
            const rel = article.displayRelevance ?? article.keyword?.supplyChainRelevance ?? 0;
            const ts = article.publishedAt != null ? Number(article.publishedAt) : NaN;
            const timeLabel = Number.isFinite(ts) ? new Date(ts).toLocaleString() : '—';
            const sourceLabel = article.source || article.sourceId || 'Source';

            return (
              <article key={`${article.url || article.id}-${idx}`} className="intelligence-article">
                <div className="intelligence-article__topline">
                  <span>{sourceLabel}</span>
                  <span>{timeLabel}</span>
                </div>

                <h3>
                  <a href={article.url} target="_blank" rel="noreferrer">
                    {article.headline}
                  </a>
                </h3>
                {article.description ? <p>{article.description}</p> : null}

                <div className="intelligence-article__signals">
                  <span>Severity: {article.severityLabel}</span>
                  <span>Relevance: {rel.toFixed(2)}</span>
                </div>

                <div className="intelligence-article__routes">
                  {article.affectedRoutes.length ? (
                    article.affectedRoutes.slice(0, 4).map((route) => (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => {
                          onRouteSelect?.(route);
                          onOpenRoutes?.();
                        }}
                      >
                        {route.name}
                      </button>
                    ))
                  ) : (
                    <span className="intelligence-article__no-route">No direct route match</span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
