/**
 * Permanent 18-route fallback must mirror canonical route codes/chokepoints.
 * Derived from ROUTES to avoid drift between demo fallback and live route state.
 */

import { ROUTES } from './routes.js';

export const DEFAULT_18_ROUTES = ROUTES.map((route) => ({
  ...route,
  currentRisk: route.baseRisk,
  status: 'normal',
  rippleScore: null,
  dnaMatch: null,
}));
