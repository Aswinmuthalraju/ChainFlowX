/**
 * Cargo aircraft via OpenSky Network (proxied: /api/opensky in dev + Vercel).
 */

import { ROUTES as APP_ROUTES } from './routes.js';

export const AIR_BOUNDING_BOXES = [
  { name: 'Shanghai Hub', lamin: 29.0, lomin: 120.0, lamax: 33.0, lomax: 124.0 },
  { name: 'Siberia Polar', lamin: 50.0, lomin: 80.0, lamax: 65.0, lomax: 120.0 },
  { name: 'Frankfurt Hub', lamin: 49.0, lomin: 7.0, lamax: 51.5, lomax: 10.0 },
  { name: 'Hong Kong Hub', lamin: 22.0, lomin: 113.0, lamax: 23.5, lomax: 115.0 },
  { name: 'Alaska', lamin: 58.0, lomin: -162.0, lamax: 65.0, lomax: -142.0 },
  { name: 'New York Hub', lamin: 40.0, lomin: -75.0, lamax: 42.0, lomax: -72.0 },
  { name: 'Dubai Hub', lamin: 24.5, lomin: 54.5, lamax: 26.0, lomax: 56.0 },
];

export const CARGO_CALLSIGN_PREFIXES = [
  'FDX',
  'UPS',
  'GTI',
  'ABX',
  'CLX',
  'KAL',
  'CCA',
  'CSN',
  'UAE',
  'QTR',
  'MPH',
  'MSR',
  'ETH',
  'THA',
];

export const isCargoFlight = (callsign) => {
  if (!callsign) return false;
  const cs = callsign.trim().toUpperCase();
  return CARGO_CALLSIGN_PREFIXES.some((prefix) => cs.startsWith(prefix));
};

export const parseOpenSkyState = (state) => ({
  icao24: state[0],
  callsign: state[1]?.trim() || '',
  country: state[2],
  lng: state[5],
  lat: state[6],
  altitude: state[7],
  onGround: state[8],
  speed: state[9],
  heading: state[10],
  type: 'aircraft',
});

function toAircraftRecord(p) {
  const sim = !!p.simulated;
  const knots = sim
    ? p.speed != null && Number.isFinite(Number(p.speed))
      ? Number(p.speed)
      : null
    : p.speed != null && Number.isFinite(Number(p.speed))
      ? Number(p.speed) * 1.944
      : null;
  return {
    type: 'aircraft',
    icao24: p.icao24,
    callsign: p.callsign || p.icao24,
    country: p.country || '',
    lat: Number(p.lat),
    lng: Number(p.lng),
    altitude: p.altitude != null ? Number(p.altitude) : null,
    speed: knots,
    heading: p.heading != null ? Number(p.heading) : 0,
    simulated: sim,
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function wrapLng(a, b, t) {
  const d = b - a;
  if (Math.abs(d) > 180) {
    const bb = b + (b < a ? 360 : -360);
    let x = lerp(a, bb, t);
    while (x > 180) x -= 360;
    while (x < -180) x += 360;
    return x;
  }
  return lerp(a, b, t);
}

export const getSimulatedAircraft = (routes, phase = 0) => {
  const src = routes?.length ? routes : APP_ROUTES;
  const list = src.filter((r) => r?.from && r?.to);
  if (!list.length) {
    return [
      toAircraftRecord({
        icao24: 'simac0',
        callsign: 'FDX000',
        country: 'US',
        lat: 40,
        lng: -74,
        altitude: 10000,
        speed: 450,
        heading: 90,
        simulated: true,
      }),
    ];
  }
  const out = [];
  let i = 0;
  for (const r of list.slice(0, 12)) {
    const u = (((phase * 0.11 + i * 0.17) % 1) + 1) % 1;
    const alt = 8000 + (i % 5) * 1200;
    out.push(
      toAircraftRecord({
        type: 'aircraft',
        icao24: `simac-${r.id}`,
        callsign: `${['FDX', 'UPS', 'CLX'][i % 3]}${100 + i}`,
        country: 'SIM',
        lat: lerp(r.from.lat, r.to.lat, u),
        lng: wrapLng(r.from.lng, r.to.lng, u),
        altitude: alt,
        speed: 220 + (i % 40),
        heading: (i * 41 + phase * 7) % 360,
        simulated: true,
      }),
    );
    i += 1;
  }
  return out;
};

async function fetchOpenSkyBox(box) {
  const q = new URLSearchParams({
    lamin: String(box.lamin),
    lomin: String(box.lomin),
    lamax: String(box.lamax),
    lomax: String(box.lomax),
  });
  const url = `/api/opensky?${q.toString()}`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`OpenSky ${r.status}`);
  return r.json();
}

function startSimulatedAircraftLoop(onAircraftUpdate, onStatusChange) {
  let phase = 0;
  getSimulatedAircraft(undefined, phase).forEach((x) => onAircraftUpdate?.(x));
  const timerId = window.setInterval(() => {
    phase += 1;
    getSimulatedAircraft(undefined, phase).forEach((x) => onAircraftUpdate?.(x));
  }, 5000);
  onStatusChange?.('aircraft', 'simulated');
  return { kind: 'sim', timerId, cancel: () => {} };
}

export const startAircraftTracking = (onAircraftUpdate, onStatusChange) => {
  let cancelled = false;
  const ref = {
    kind: 'interval',
    intervalId: null,
    timerId: null,
    cancel: () => {
      cancelled = true;
    },
  };

  async function pollOnce() {
    const seen = new Set();
    for (const box of AIR_BOUNDING_BOXES) {
      if (cancelled) return;
      const data = await fetchOpenSkyBox(box);
      const states = data?.states;
      if (!Array.isArray(states)) continue;
      for (const st of states) {
        const p = parseOpenSkyState(st);
        if (p.onGround === true || p.onGround === 1) continue;
        if (!isCargoFlight(p.callsign)) continue;
        if (p.lat == null || p.lng == null || !Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng))) continue;
        if (seen.has(p.icao24)) continue;
        seen.add(p.icao24);
        onAircraftUpdate?.(toAircraftRecord({ ...p, simulated: false }));
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    onStatusChange?.('aircraft', seen.size ? 'ok' : 'ok_empty');
  }

  function switchToSim() {
    if (ref.timerId != null) return;
    if (ref.intervalId != null) {
      window.clearInterval(ref.intervalId);
      ref.intervalId = null;
    }
    const sim = startSimulatedAircraftLoop(onAircraftUpdate, onStatusChange);
    ref.kind = sim.kind;
    ref.timerId = sim.timerId;
  }

  (async () => {
    if (cancelled) return;
    try {
      await pollOnce();
    } catch {
      onStatusChange?.('aircraft', 'error');
      switchToSim();
      return;
    }
    ref.intervalId = window.setInterval(async () => {
      if (cancelled || ref.timerId != null) return;
      try {
        await pollOnce();
      } catch {
        onStatusChange?.('aircraft', 'error');
        switchToSim();
      }
    }, 60000);
  })();

  return ref;
};

export const stopAircraftTracking = (intervalRef) => {
  if (!intervalRef) return;
  intervalRef.cancel?.();
  if (intervalRef.intervalId != null) window.clearInterval(intervalRef.intervalId);
  if (intervalRef.timerId != null) window.clearInterval(intervalRef.timerId);
};
