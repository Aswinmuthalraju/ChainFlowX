import { useEffect, useMemo, useState } from 'react';
import { fetchSupplyChainNews } from '../ai/newsFeed.js';
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

function estimateArticleImpact(article) {
  const text = `${article.headline || ''} ${article.description || ''}`.toLowerCase();
  if (/critical|severe|major|blockade|attack/.test(text)) return 'CRITICAL';
  if (/significant|large|disruption|sanction|closure/.test(text)) return 'HIGH';
  if (/alert|watch|concern|delay/.test(text)) return 'MEDIUM';
  return 'LOW';
}

export default function IntelligenceFeed({ onRouteSelect, onOpenRoutes }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadNews = async () => {
    setLoading(true);
    setError('');
    try {
      const relevantNews = await fetchSupplyChainNews();
      const enriched = relevantNews.map((article) => {
        const affectedRoutes = findAffectedRoutes(article, ROUTES);
        return {
          ...article,
          affectedRoutes,
          estimatedImpact: estimateArticleImpact(article),
        };
      });
      setNews(enriched);
      setUpdatedAt(new Date());
    } catch (err) {
      setError('Failed to load intelligence feed.');
      console.error('[ChainFlowX] intelligence feed failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNews();
    const interval = window.setInterval(loadNews, 10 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const critical = news.filter((article) => article.estimatedImpact === 'CRITICAL').length;
    const avg = news.length
      ? (news.reduce((sum, article) => sum + (article.relevanceScore || 0), 0) / news.length).toFixed(2)
      : '0.00';
    return { critical, avg };
  }, [news]);

  return (
    <section className="intelligence-feed-page">
      <header className="intelligence-feed-page__header">
        <div>
          <h1>Supply Chain Intelligence Feed</h1>
          <p>Top 50 route-relevant updates from shipping and trade sources.</p>
        </div>
        <button type="button" onClick={loadNews} disabled={loading} className="intelligence-feed-page__refresh">
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      <div className="intelligence-feed-page__meta">
        <span>{news.length} articles</span>
        <span>{stats.critical} critical-impact</span>
        <span>Avg relevance {stats.avg}</span>
        <span>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : 'Not updated yet'}</span>
      </div>

      {error && <div className="intelligence-feed-page__error">{error}</div>}

      <div className="intelligence-feed-page__list">
        {news.map((article, idx) => (
          <article key={`${article.url}-${idx}`} className="intelligence-article">
            <div className="intelligence-article__topline">
              <span>{article.source}</span>
              <span>{new Date(article.publishedAt).toLocaleString()}</span>
            </div>

            <h3>
              <a href={article.url} target="_blank" rel="noreferrer">
                {article.headline}
              </a>
            </h3>
            <p>{article.description}</p>

            <div className="intelligence-article__signals">
              <span>Impact: {article.estimatedImpact}</span>
              <span>Relevance: {(article.relevanceScore || 0).toFixed(2)}</span>
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
        ))}
      </div>
    </section>
  );
}
