import { useEffect, useMemo, useState } from 'react';
import RouteDetailPanel from './RouteDetailPanel.jsx';
import RouteRiskIndicator from './RouteRiskIndicator.jsx';
import { calcAltRoute } from '../engine/altRouteCalc.js';

export default function RoutesPage({ routes, selectedRouteId = null, onRouteSelect, liveVessels = [] }) {
  const [filterRisk, setFilterRisk] = useState('all');
  const [sortBy, setSortBy] = useState('risk');

  const resolvedSelectedRoute = useMemo(() => {
    if (!selectedRouteId) return null;
    return routes.find((r) => r.id === selectedRouteId) ?? null;
  }, [routes, selectedRouteId]);

  useEffect(() => {
    if (selectedRouteId && !routes.some((r) => r.id === selectedRouteId)) {
      console.warn('Selected route missing:', selectedRouteId);
    }
  }, [routes, selectedRouteId]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const risk = route.currentRisk ?? route.baseRisk ?? 0;
      if (filterRisk === 'all') return true;
      if (filterRisk === 'critical') return risk >= 61;
      if (filterRisk === 'warning') return risk >= 31 && risk <= 60;
      if (filterRisk === 'normal') return risk <= 30;
      return true;
    });
  }, [routes, filterRisk]);

  const sortedRoutes = useMemo(() => {
    const list = [...filteredRoutes];
    return list.sort((a, b) => {
      if (sortBy === 'risk') return (b.currentRisk ?? b.baseRisk ?? 0) - (a.currentRisk ?? a.baseRisk ?? 0);
      if (sortBy === 'volume') return (b.tradeVolumeM ?? 0) - (a.tradeVolumeM ?? 0);
      if (sortBy === 'transit') return (a.normalTransitHours ?? 0) - (b.normalTransitHours ?? 0);
      return 0;
    });
  }, [filteredRoutes, sortBy]);

  const totalVolume = useMemo(
    () => routes.reduce((sum, route) => sum + (Number(route.tradeVolumeM) || 0), 0),
    [routes],
  );

  const vesselCountByRouteId = useMemo(() => {
    const m = new Map();
    for (const v of liveVessels) {
      if (!v?.routeId) continue;
      m.set(v.routeId, (m.get(v.routeId) || 0) + 1);
    }
    return m;
  }, [liveVessels]);

  const handleRouteClick = (route) => {
    onRouteSelect?.(route);
  };

  return (
    <section className="routes-page">
      <header className="routes-page__header">
        <h1>Supply Chain Routes Inventory</h1>
        <p>{routes.length} active routes | {totalVolume.toFixed(1)}B tracked trade volume</p>
      </header>

      <div className="routes-page__controls">
        <div className="routes-page__risk-filter">
          {['all', 'critical', 'warning', 'normal'].map((level) => (
            <button
              key={level}
              type="button"
              className={`routes-page__chip ${filterRisk === level ? 'is-active' : ''}`}
              onClick={() => setFilterRisk(level)}
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>

        <label className="routes-page__sort">
          <span>Sort by</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="risk">Risk (high to low)</option>
            <option value="volume">Trade volume (high to low)</option>
            <option value="transit">Transit (short to long)</option>
          </select>
        </label>
      </div>

      <div className="routes-page__grid-wrap">
        <div className="routes-page__grid">
          {sortedRoutes.map((route) => {
            const isSelected = selectedRouteId === route.id;
            const risk = route.currentRisk ?? route.baseRisk ?? 0;
            const liveShips = route.type === 'maritime' ? vesselCountByRouteId.get(route.id) || 0 : 0;
            const hasLiveTraffic = route.type === 'maritime' && (liveShips > 0 || route.currentPosition);
            return (
              <article
                key={route.id}
                className={`route-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleRouteClick(route)}
              >
                <header className="route-card__header">
                  <h3>{route.name}</h3>
                  <RouteRiskIndicator risk={risk} />
                </header>

                <div className="route-card__meta">
                  <span>{route.type.toUpperCase()}</span>
                  <span>{route.normalTransitHours < 24 ? `${route.normalTransitHours}h` : `${Math.round(route.normalTransitHours / 24)}d`}</span>
                  <span>${route.tradeVolumeM}B/yr</span>
                  {hasLiveTraffic ? (
                    <span title={liveShips ? `${liveShips} simulated vessels on route` : 'Position from live tracker'} style={{ color: '#00d4ff' }}>
                      LIVE
                    </span>
                  ) : null}
                </div>

                <p className="route-card__path">{route.from.name} {'->'} {route.to.name}</p>

                {route.chokepoints?.length > 0 && (
                  <div className="route-card__chokepoints">
                    {route.chokepoints.map((cp) => (
                      <span key={`${route.id}-${cp}`}>{cp}</span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {resolvedSelectedRoute && (
          <aside className="routes-page__detail">
            <RouteDetailPanel
              route={resolvedSelectedRoute}
              altRoute={calcAltRoute(
                resolvedSelectedRoute.id,
                { severity: (resolvedSelectedRoute.currentRisk || resolvedSelectedRoute.baseRisk || 0) / 100 },
                (resolvedSelectedRoute.currentRisk || resolvedSelectedRoute.baseRisk || 0) / 12,
              )}
              onClose={() => onRouteSelect?.(null)}
            />
          </aside>
        )}
      </div>
    </section>
  );
}
