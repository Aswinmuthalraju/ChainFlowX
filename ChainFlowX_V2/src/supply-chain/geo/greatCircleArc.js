/** Great-circle helpers for globe paths (handles Pacific / dateline correctly). */

const DEG = Math.PI / 180;
const R_EARTH_KM = 6371;

export function normalizeLng180(lng) {
  let l = lng;
  while (l > 180) l -= 360;
  while (l < -180) l += 360;
  return l;
}

export function greatCircleDistanceKm(lat1, lng1, lat2, lng2) {
  if (![lat1, lng1, lat2, lng2].every((v) => typeof v === 'number' && Number.isFinite(v))) return 0;
  const dLat = (lat2 - lat1) * DEG;
  const dLng = (lng2 - lng1) * DEG;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH_KM * c;
}

export function routeArcAltitude(distKm) {
  if (!Number.isFinite(distKm) || distKm <= 0) return 0.015;
  const v = Math.min(distKm / 12000, 0.12);
  return Math.max(0.015, v);
}

export function latLngToVec3(lat, lng) {
  const latR = lat * DEG;
  const lngR = lng * DEG;
  const cosLat = Math.cos(latR);
  return { x: cosLat * Math.cos(lngR), y: cosLat * Math.sin(lngR), z: Math.sin(latR) };
}

function vec3Len(v) {
  return Math.hypot(v.x, v.y, v.z);
}

function vec3Norm(v) {
  const L = vec3Len(v) || 1;
  return { x: v.x / L, y: v.y / L, z: v.z / L };
}

export function vec3ToLatLng(v) {
  const n = vec3Norm(v);
  const hyp = Math.hypot(n.x, n.y);
  const lat = Math.atan2(n.z, hyp) / DEG;
  const lng = Math.atan2(n.y, n.x) / DEG;
  return { lat, lng: normalizeLng180(lng) };
}

/**
 * Point at fraction t ∈ [0,1] along the great circle from (lat1,lng1) to (lat2,lng2).
 */
export function interpolateAlongGreatCircle(lat1, lng1, lat2, lng2, t) {
  if (!Number.isFinite(t)) return { lat: lat1, lng: lng1 };
  const tcl = Math.max(0, Math.min(1, t));
  if (tcl <= 0) return { lat: lat1, lng: normalizeLng180(lng1) };
  if (tcl >= 1) return { lat: lat2, lng: normalizeLng180(lng2) };

  const p0 = latLngToVec3(lat1, lng1);
  const p1 = latLngToVec3(lat2, lng2);
  let dot = p0.x * p1.x + p0.y * p1.y + p0.z * p1.z;
  dot = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(dot);
  if (omega < 1e-8) return { lat: lat1, lng: normalizeLng180(lng1) };

  const s0 = Math.sin((1 - tcl) * omega) / Math.sin(omega);
  const s1 = Math.sin(tcl * omega) / Math.sin(omega);
  return vec3ToLatLng({
    x: p0.x * s0 + p1.x * s1,
    y: p0.y * s0 + p1.y * s1,
    z: p0.z * s0 + p1.z * s1,
  });
}

/**
 * Sampled great circle polyline (lat,lng), minimum `minPoints`, up to `maxPoints`.
 */
export function generateGreatCircleArc(startLat, startLng, endLat, endLng, minPoints = 64, maxPoints = 128) {
  const d = greatCircleDistanceKm(startLat, startLng, endLat, endLng);
  let n = d > 8000 ? maxPoints : minPoints;
  n = Math.max(minPoints, Math.min(maxPoints, Math.floor(n)));
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    pts.push(interpolateAlongGreatCircle(startLat, startLng, endLat, endLng, t));
  }
  return pts;
}

/**
 * Interpolate a position along a multi-segment waypoint path.
 * Progress t ∈ [0,1] is distributed across segments proportional to angular distance.
 *
 * @param {Array<{lat, lng}>} waypoints - ordered array including start and end
 * @param {number} t - overall progress 0.0 → 1.0
 * @returns {{ lat: number, lng: number }}
 */
export function interpolateAlongWaypoints(waypoints, t) {
  if (!waypoints || waypoints.length === 0) return null;
  if (waypoints.length === 1) return waypoints[0];
  if (t <= 0) return waypoints[0];
  if (t >= 1) return waypoints[waypoints.length - 1];

  const toRad = (d) => d * Math.PI / 180;
  const segAngularDist = (a, b) => {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const segments = [];
  let totalDist = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dist = segAngularDist(waypoints[i], waypoints[i + 1]);
    segments.push({ from: waypoints[i], to: waypoints[i + 1], dist });
    totalDist += dist;
  }
  if (totalDist === 0) return waypoints[0];

  const target = t * totalDist;
  let accumulated = 0;
  for (const seg of segments) {
    if (accumulated + seg.dist >= target) {
      const segT = seg.dist === 0 ? 0 : (target - accumulated) / seg.dist;
      return interpolateAlongGreatCircle(seg.from.lat, seg.from.lng, seg.to.lat, seg.to.lng, segT);
    }
    accumulated += seg.dist;
  }
  return waypoints[waypoints.length - 1];
}

/**
 * Generate an array of {lat,lng} points along a waypoint path.
 * Use instead of generateGreatCircleArc for maritime routes.
 *
 * @param {Array<{lat, lng}>} waypoints
 * @param {number} numPoints
 * @returns {Array<{lat, lng}>}
 */
export function generateWaypointArc(waypoints, numPoints = 100) {
  if (!waypoints || waypoints.length < 2) return waypoints || [];
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const pt = interpolateAlongWaypoints(waypoints, i / numPoints);
    if (pt) points.push(pt);
  }
  return points;
}

/**
 * Coordinates for three-globe paths: [lat, lng, altitude] with lifted mid-curve.
 */
export function buildGlobePathCoords3d(startLat, startLng, endLat, endLng, minPoints = 64, maxPoints = 128) {
  const dist = greatCircleDistanceKm(startLat, startLng, endLat, endLng);
  const baseAlt = routeArcAltitude(dist);
  const arcPts = generateGreatCircleArc(startLat, startLng, endLat, endLng, minPoints, maxPoints);
  return arcPts.map((p, i) => {
    const t = arcPts.length < 2 ? 0 : i / (arcPts.length - 1);
    const alt = baseAlt * Math.sin(Math.PI * t);
    return [p.lat, p.lng, alt];
  });
}
