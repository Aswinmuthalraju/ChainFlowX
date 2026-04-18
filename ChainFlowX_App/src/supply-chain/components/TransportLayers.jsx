import { useEffect, useRef } from 'react';

const CARGO_PREFIXES = ['FDX', 'UPS', 'ABX', 'GTI', 'NCR', 'KZR', 'TGX', 'CLX', 'BOX', 'ATC'];
const MAX_VESSELS = 500;
const MAX_AIRCRAFT = 300;
const OPENSKY_POLL_MS = 90000;

/**
 * Renderless component — owns AIS WebSocket + OpenSky polling lifecycles.
 * Calls onVesselsChange / onAircraftChange with full arrays on each update.
 */
export default function TransportLayers({ layerVisibility, onVesselsChange, onAircraftChange }) {
  const vesselsRef = useRef(new Map()); // keyed by mmsi
  const aircraftRef = useRef(new Map()); // keyed by icao24
  const openSkyBackoffRef = useRef(null);

  // ── AIS WebSocket ──────────────────────────────────────────────────────────
  useEffect(() => {
    const key = import.meta.env.VITE_AISSTREAM_KEY;
    if (!key) {
      console.warn('[ChainFlowX] AIS stream unavailable — ship layer offline (no VITE_AISSTREAM_KEY)');
      return;
    }

    let ws;
    try {
      ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    } catch {
      console.warn('[ChainFlowX] AIS WebSocket failed to open');
      return;
    }

    ws.onopen = () => {
      try {
        ws.send(JSON.stringify({
          APIKey: key,
          BoundingBoxes: [[[-90, -180], [90, 180]]],
          FilterMessageTypes: ['PositionReport'],
          FiltersShipMMSI: [],
          FilterShipTypes: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
        }));
      } catch {
        /* ignore */
      }
    };

    ws.onmessage = (ev) => {
      try {
        const message = JSON.parse(ev.data);
        const pr =
          message?.Message?.PositionReport ||
          message?.Message?.StandardClassBPositionReport ||
          message?.Message?.ExtendedClassBPositionReport;
        if (!pr) return;
        const meta = message.Metadata || {};
        const lat = meta.Latitude ?? pr.Latitude ?? pr.lat;
        const lng = meta.Longitude ?? pr.Longitude ?? pr.lon ?? pr.lng;
        if (lat == null || lng == null) return;
        const mmsi = String(pr.UserID ?? pr.Mmsi ?? meta.MMSI ?? meta.ShipMMSI ?? '');
        if (!mmsi) return;
        const sogRaw = pr.Sog != null ? Number(pr.Sog) : pr.SpeedOverGround != null ? Number(pr.SpeedOverGround) : null;
        const cog = pr.Cog != null ? Number(pr.Cog) : pr.CourseOverGround != null ? Number(pr.CourseOverGround) : null;
        const hdg = pr.TrueHeading != null && pr.TrueHeading !== 511 ? Number(pr.TrueHeading) : cog ?? 0;
        const name = (meta.ShipName || pr.Name || `MMSI ${mmsi}`).trim();
        vesselsRef.current.set(mmsi, {
          type: 'vessel',
          mmsi,
          name,
          lat: Number(lat),
          lng: Number(lng),
          heading: Number.isFinite(hdg) ? hdg : 0,
          sog: sogRaw != null ? sogRaw / 10 : null,
          updatedAt: Date.now(),
        });
        // Trim to MAX_VESSELS keeping most recently updated
        if (vesselsRef.current.size > MAX_VESSELS) {
          const sorted = [...vesselsRef.current.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
          sorted.slice(0, sorted.length - MAX_VESSELS).forEach(([k]) => vesselsRef.current.delete(k));
        }
        const shipPoints = [...vesselsRef.current.values()];
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onerror = () => {
      console.warn('[ChainFlowX] AIS WebSocket error — ship layer offline');
    };

    return () => {
      try { ws.close(); } catch { /* ignore */ }
    };
  }, []);

  // ── Globe flush — push vessel array every 5 s ──────────────────────────────
  useEffect(() => {
    const flush = () => {
      if (layerVisibility?.vessels !== false) {
        onVesselsChange?.([...vesselsRef.current.values()]);
      }
    };
    const id = window.setInterval(flush, 5000);
    return () => window.clearInterval(id);
  }, [layerVisibility?.vessels, onVesselsChange]);

  // ── OpenSky polling ────────────────────────────────────────────────────────
  useEffect(() => {
    async function poll() {
      if (openSkyBackoffRef.current) return;
      try {
        const url = '/api/opensky';
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.status === 429) {
          console.warn('[ChainFlowX] OpenSky 429 — pausing aircraft polling for 10 minutes');
          openSkyBackoffRef.current = window.setTimeout(() => {
            openSkyBackoffRef.current = null;
          }, 600000);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const states = data?.states;
        if (!Array.isArray(states)) return;
        const next = new Map();
        for (const st of states) {
          if (next.size >= MAX_AIRCRAFT) break;
          const icao24 = st[0];
          const callsign = st[1]?.trim() || '';
          const lng = st[5];
          const lat = st[6];
          const altitude = st[7];
          const onGround = st[8];
          const velocity = st[9];
          const heading = st[10];
          const category = st[17];
          if (onGround) continue;
          if (lat == null || lng == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) continue;
          const isCargoPrefix = CARGO_PREFIXES.some((p) => callsign.toUpperCase().startsWith(p));
          const isHeavy = category === 7 || category === 8;
          if (!isCargoPrefix && !isHeavy) continue;
          next.set(icao24, {
            type: 'aircraft',
            icao24,
            callsign: callsign || icao24,
            lat: Number(lat),
            lng: Number(lng),
            altitude: altitude != null ? Number(altitude) : null,
            velocity: velocity != null ? Number(velocity) : null,
            heading: heading != null ? Number(heading) : 0,
          });
        }
        const filteredAircraft = [...next.values()];
        aircraftRef.current = next;
        if (layerVisibility?.aircraft !== false) {
          onAircraftChange?.(filteredAircraft);
        }
      } catch {
        /* network errors — silent */
      }
    }

    poll();
    const id = window.setInterval(poll, OPENSKY_POLL_MS);
    return () => {
      window.clearInterval(id);
      if (openSkyBackoffRef.current) {
        window.clearTimeout(openSkyBackoffRef.current);
        openSkyBackoffRef.current = null;
      }
    };
  }, [layerVisibility?.aircraft, onAircraftChange]);

  return null;
}
