import { interpolateRoutePosition } from '../data/routes.js';

const TICK_MS = 5000;

class PositionTracker {
  constructor() {
    this.timer = null;
    this.routes = [];
    this.listeners = new Set();
  }

  setRoutes(routes) {
    this.routes = Array.isArray(routes) ? routes : [];
    this.emit(this.compute(this.routes));
  }

  start() {
    if (this.timer) return;
    this.timer = window.setInterval(() => {
      this.emit(this.compute(this.routes));
    }, TICK_MS);
  }

  stop() {
    if (!this.timer) return;
    window.clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.compute(this.routes));
    return () => {
      this.listeners.delete(listener);
    };
  }

  compute(routes) {
    const now = Date.now();
    return (routes || []).map((route) => {
      const point = interpolateRoutePosition(route, now);
      const currentRisk = route.currentRisk ?? route.baseRisk ?? 0;
      return {
        ...route,
        currentPosition: {
          ...route.currentPosition,
          ...point,
          lastUpdate: route.currentPosition?.lastUpdate || new Date(now).toISOString(),
        },
        status: point.status || route.status,
        currentRisk,
      };
    });
  }

  emit(nextRoutes) {
    this.listeners.forEach((listener) => listener(nextRoutes));
  }
}

export const positionTracker = new PositionTracker();
