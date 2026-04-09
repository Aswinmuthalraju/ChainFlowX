/**
 * Live cargo movement buffers for ChainFlowX — reuses WorldMonitor-aligned feeds:
 * AISStream (transportMaritime) + OpenSky cargo boxes (transportAir), same as WM api/opensky + relay AIS.
 */

import { startVesselTracking, stopVesselTracking, getSimulatedVessels } from './transportMaritime.js';
import { startAircraftTracking, stopAircraftTracking } from './transportAir.js';

const REFRESH_MS = 60_000;
const CACHE_TTL_MS = 5 * 60_000;
const MAX_SHIPS = 150;
const MAX_AIR = 100;

const shipByMmsi = new Map();
const airByIcao = new Map();

let feedsStarted = false;
let vesselRef = null;
let aircraftRef = null;
let lastAirPollOkAt = 0;
let lastAirError = false;

/** @type {{ movements: any[], updatedAt: number, stale: boolean, feedFailed: boolean }} */
let shipSnapshot = { movements: [], updatedAt: 0, stale: false, feedFailed: false };
/** @type {{ movements: any[], updatedAt: number, stale: boolean, feedFailed: boolean }} */
let airSnapshot = { movements: [], updatedAt: 0, stale: false, feedFailed: false };

let lastShipRefresh = 0;

function normalizeShip(v) {
  const id = String(v.mmsi ?? v.id ?? '');
  return {
    id,
    type: 'ship',
    name: v.name || id,
    lat: Number(v.lat),
    lng: Number(v.lng),
    heading: v.heading != null ? Number(v.heading) : 0,
    speed: v.speed != null ? Number(v.speed) : null,
    cargoType: v.vesselType || v.cargoType || 'unknown',
    origin: v.origin ?? '—',
    destination: v.destination ?? '—',
    timestamp: Date.now(),
    simulated: !!v.simulated,
    mmsi: id,
    vesselType: v.vesselType || v.cargoType,
  };
}

function normalizeAir(a) {
  const id = String(a.icao24 ?? a.id ?? '');
  return {
    id,
    type: 'air',
    flightCode: (a.callsign || id).trim(),
    lat: Number(a.lat),
    lng: Number(a.lng),
    altitude: a.altitude != null ? Number(a.altitude) : null,
    heading: a.heading != null ? Number(a.heading) : 0,
    speed: a.speed != null ? Number(a.speed) : null,
    cargoType: 'air_freight',
    origin: a.origin ?? '—',
    destination: a.destination ?? '—',
    timestamp: Date.now(),
    simulated: !!a.simulated,
    icao24: id,
    callsign: a.callsign,
    country: a.country,
  };
}

function prioritizeShips(values) {
  const arr = [...values];
  arr.sort((a, b) => {
    const sa = Number(a.speed);
    const sb = Number(b.speed);
    const fa = Number.isFinite(sa) ? sa : -1;
    const fb = Number.isFinite(sb) ? sb : -1;
    return fb - fa;
  });
  return arr.slice(0, MAX_SHIPS);
}

function prioritizeAir(values) {
  const arr = [...values];
  arr.sort((a, b) => {
    const ba = a.simulated ? 0 : 1;
    const bb = b.simulated ? 0 : 1;
    if (ba !== bb) return bb - ba;
    return 0;
  });
  return arr.slice(0, MAX_AIR);
}

function seedSimulatedShipsIfEmpty(phase = 0) {
  if (shipByMmsi.size > 0) return;
  getSimulatedVessels(undefined, phase).forEach((v) => {
    shipByMmsi.set(v.mmsi, v);
  });
}

export function startLiveCargoFeeds() {
  if (feedsStarted) return { vesselRef, aircraftRef };
  feedsStarted = true;

  vesselRef = startVesselTracking((vessel) => {
    if (vessel?.mmsi) shipByMmsi.set(vessel.mmsi, vessel);
    lastShipRefresh = Date.now();
  }, () => {});

  aircraftRef = startAircraftTracking(
    (aircraft) => {
      if (aircraft?.icao24) airByIcao.set(aircraft.icao24, aircraft);
      lastAirPollOkAt = Date.now();
      lastAirError = false;
    },
    (domain, status) => {
      if (domain === 'aircraft' && status === 'error') {
        lastAirError = true;
      }
    },
  );

  return { vesselRef, aircraftRef };
}

export function stopLiveCargoFeeds() {
  feedsStarted = false;
  stopVesselTracking(vesselRef);
  stopAircraftTracking(aircraftRef);
  vesselRef = null;
  aircraftRef = null;
}

async function refreshShipSnapshot(force = false) {
  const now = Date.now();
  if (!force && now - shipSnapshot.updatedAt < 500 && shipSnapshot.movements.length) return shipSnapshot;

  startLiveCargoFeeds();
  seedSimulatedShipsIfEmpty(0);

  const raw = prioritizeShips(shipByMmsi.values());
  const movements = raw.map(normalizeShip);
  const dataAge = lastShipRefresh > 0 ? now - lastShipRefresh : 0;
  const stale = movements.length > 0 && lastShipRefresh > 0 && dataAge > REFRESH_MS;
  shipSnapshot = {
    movements,
    updatedAt: now,
    stale,
    feedFailed: movements.length === 0,
  };
  return shipSnapshot;
}

async function refreshAirSnapshot(force = false) {
  const now = Date.now();
  if (!force && now - airSnapshot.updatedAt < 500 && airSnapshot.movements.length) return airSnapshot;

  startLiveCargoFeeds();

  const raw = prioritizeAir(airByIcao.values());
  const movements = raw.map(normalizeAir);
  const airAge =
    lastAirPollOkAt > 0 ? now - lastAirPollOkAt : movements.length > 0 ? REFRESH_MS + 1 : 0;
  const stale = lastAirError || (movements.length > 0 && airAge > REFRESH_MS);
  airSnapshot = {
    movements,
    updatedAt: now,
    stale,
    feedFailed: movements.length === 0 && lastAirError,
  };
  return airSnapshot;
}

export async function getLiveShipCargoMovements() {
  const now = Date.now();
  try {
    return await refreshShipSnapshot(true);
  } catch {
    const stale = true;
    if (shipSnapshot.movements.length && now - shipSnapshot.updatedAt < CACHE_TTL_MS) {
      return { ...shipSnapshot, stale, feedFailed: true };
    }
    try {
      return await refreshShipSnapshot(true);
    } catch {
      return { ...shipSnapshot, stale: true, feedFailed: shipSnapshot.movements.length === 0 };
    }
  }
}

export async function getLiveAirCargoMovements() {
  const now = Date.now();
  try {
    return await refreshAirSnapshot(true);
  } catch {
    const stale = true;
    if (airSnapshot.movements.length && now - airSnapshot.updatedAt < CACHE_TTL_MS) {
      return { ...airSnapshot, stale, feedFailed: true };
    }
    try {
      return await refreshAirSnapshot(true);
    } catch {
      return { ...airSnapshot, stale: true, feedFailed: airSnapshot.movements.length === 0 };
    }
  }
}
