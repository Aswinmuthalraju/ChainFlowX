import { classifyEvent } from '../ai/gemmaAI.js';
import { runPipeline as runGraphPipeline, propagateRipple } from '../graph/dependencyGraph.js';
import { calculateRouteRisk, updateRouteStatuses } from '../engine/riskScoring.js';
import { matchRoutesToEvent } from '../engine/disruptionMatcher.js';
import { calcAltRoute } from '../engine/altRouteCalc.js';
import { calculateRippleScore } from '../engine/rippleScore.js';
import { detectCascadeAlerts } from '../engine/correlationEngine.js';
import { matchDNA } from '../ai/dnaMatching.js';
import { getIndustryCascade } from '../ai/industryCascade.js';
import { ROUTES } from '../data/routes.js';
import { DNA_FINGERPRINTS } from '../data/dnaFingerprints.js';
import { CHOKEPOINTS } from '../data/chokepoints.js';

export const CHOKEPOINT_COORDS = [
  { id: 'CHKPT-MALACCA', lat: 1.2, lng: 103.8 },
  { id: 'CHKPT-SUEZ', lat: 30.0, lng: 32.5 },
  { id: 'CHKPT-HORMUZ', lat: 26.5, lng: 56.5 },
  { id: 'CHKPT-PANAMA', lat: 9.1, lng: -79.7 },
  { id: 'CHKPT-BAB', lat: 12.5, lng: 43.3 },
  { id: 'CHKPT-CAPE', lat: -34.4, lng: 18.5 }
];

export function haversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function inferNearestChokepoint(lat, lng) {
  if (lat == null || lng == null) return null;
  
  let nearest = null;
  let minDistance = Infinity;

  for (const cp of CHOKEPOINT_COORDS) {
    const dist = haversineKm(lat, lng, cp.lat, cp.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = cp.id;
    }
  }

  // return chokepoint id ONLY if within 2000km; else returns null
  if (minDistance <= 2000) {
    return nearest;
  }
  return null;
}

const VALID_EVENT_TYPES = ['cyclone', 'conflict', 'strike', 'earthquake', 'sanctions', 'blockage', 'other'];

export function validateAndNormalizeClassification(raw, eventLat, eventLng) {
  const result = {
    eventType: 'other',
    severity: 0.5,
    nearestChokepoint: null,
    region: 'unknown',
    supplyChainRelevance: 0.5,
    confidence: 0.5,
    entities: { ports: [], countries: [], chokepoints: [] },
    estimatedDuration: 'days'
  };

  if (!raw || typeof raw !== 'object') return result;

  if (raw.eventType && VALID_EVENT_TYPES.includes(raw.eventType.toLowerCase())) {
    result.eventType = raw.eventType.toLowerCase();
  }

  if (typeof raw.severity === 'number' && isFinite(raw.severity)) {
    result.severity = Math.max(0.0, Math.min(1.0, raw.severity));
  }

  result.nearestChokepoint = raw.nearestChokepoint || inferNearestChokepoint(eventLat, eventLng);

  if (typeof raw.region === 'string' && raw.region.trim().length > 0) {
    result.region = raw.region;
  }

  if (typeof raw.supplyChainRelevance === 'number' && isFinite(raw.supplyChainRelevance)) {
    result.supplyChainRelevance = Math.max(0.0, Math.min(1.0, raw.supplyChainRelevance));
  }
  
  if (typeof raw.confidence === 'number' && isFinite(raw.confidence)) {
    result.confidence = Math.max(0.0, Math.min(1.0, raw.confidence));
  }

  if (raw.entities && typeof raw.entities === 'object') {
    result.entities.ports = Array.isArray(raw.entities.ports) ? raw.entities.ports : [];
    result.entities.countries = Array.isArray(raw.entities.countries) ? raw.entities.countries : [];
    result.entities.chokepoints = Array.isArray(raw.entities.chokepoints) ? raw.entities.chokepoints : [];
  }

  if (typeof raw.estimatedDuration === 'string' && raw.estimatedDuration.trim().length > 0) {
    result.estimatedDuration = raw.estimatedDuration;
  }

  return result;
}

export function createEventState() {
  return {
    raw: null,
    classified: null,
    affectedRoutes: [],
    riskScores: {},
    altRoutes: {},
    rippleScore: null,
    cascadeAlerts: [],
    dnaMatch: null,
    industryCascade: [],
    strategicInsight: null
  };
}

export async function runPipeline(event, graph) {
  const state = createEventState();
  state.raw = event;

  // Step 1: classifyEvent (Layer 3)
  const rawClassified = await classifyEvent(event.headline, event.description);
  const classified = validateAndNormalizeClassification(rawClassified, event.lat, event.lng);
  state.classified = classified;

  // Gate: if supplyChainRelevance < 0.3, return early
  if (classified.supplyChainRelevance < 0.3) {
      return state;
  }

  // Find start node for ripple
  let startNodeId = classified.nearestChokepoint;
  if (!startNodeId) {
      // Find a port nearby if no nearest chokepoint
      let nearestPort = null;
      let minDst = Infinity;
      for (const [id, node] of Object.entries(graph.nodes)) {
          if (node.nodeType === 'port') {
              const d = haversineKm(event.lat, event.lng, node.lat, node.lng);
              if (d < minDst) { minDst = d; nearestPort = id; }
          }
      }
      if (minDst <= 400) startNodeId = nearestPort;
  }

  // Step 2: propagateRipple (Layer 0 BFS)
  let cascadeMaxDepth = 0;
  if (startNodeId) {
      const ripple = propagateRipple(graph, startNodeId, 3);
      cascadeMaxDepth = Math.max(0, ...ripple.map(r => r.depth));
  }

  // Geography match
  const affectedRoutes = matchRoutesToEvent(ROUTES, event);
  state.affectedRoutes = affectedRoutes;

  // Step 3: calculateRouteRisk + calcAltRoute for each route (Layer 1)
  const riskScores = calculateRouteRisk(affectedRoutes, classified, ROUTES);
  state.riskScores = riskScores;

  // Step 4: calculateRippleScore (Layer 2)
  let totalVolume = 0;
  let minAbsorption = 1.0;
  let maxTimeAlt = 0;
  let highestCritCommodity = 'bulk';
  const cMap = { 'bulk':0.3, 'consumer_goods':0.55, 'grain':0.6, 'chemicals':0.7, 'automotive':0.8, 'electronics':0.85, 'oil':0.9, 'semiconductors':1.0, 'pharmaceuticals':1.0 };
  
  affectedRoutes.forEach(r => {
      totalVolume += r.tradeVolumeM;
      if (r.portAbsorptionCapacity < minAbsorption) minAbsorption = r.portAbsorptionCapacity;
      if (cMap[r.commodity] > cMap[highestCritCommodity]) highestCritCommodity = r.commodity;
  });

  const rippleResult = calculateRippleScore(cascadeMaxDepth, totalVolume, minAbsorption, 0 /* will fix after altroutes */, highestCritCommodity);
  
  const altRoutes = {};
  affectedRoutes.forEach(r => {
      const alt = calcAltRoute(r.id, classified, rippleResult.raw);
      altRoutes[r.id] = alt;
      if (alt.delayDays > maxTimeAlt) maxTimeAlt = alt.delayDays;
  });
  state.altRoutes = altRoutes;

  // Recalculate ripple score with correct time
  const finalRippleResult = calculateRippleScore(cascadeMaxDepth, totalVolume, minAbsorption, maxTimeAlt, highestCritCommodity);
  state.rippleScore = finalRippleResult;

  // Step 5: detectCascadeAlerts (Layer 2)
  state.cascadeAlerts = detectCascadeAlerts(affectedRoutes, riskScores, CHOKEPOINTS, finalRippleResult.raw, ROUTES);

  // Step 6: matchDNA (Layer 4)
  state.dnaMatch = matchDNA(classified, DNA_FINGERPRINTS);

  // Step 7: getIndustryCascade (Layer 4)
  state.industryCascade = getIndustryCascade(classified.nearestChokepoint, finalRippleResult.raw, cascadeMaxDepth);

  // Step 8: Layer 5 (Qwen3) NOT called here — on demand from UI only

  return state;
}
