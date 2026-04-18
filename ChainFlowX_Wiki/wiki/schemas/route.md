# Schema: Route
_Last updated: 2026-04-19 | Verified against code: 2026-04-19_

## Source
`src/supply-chain/data/routes.js` (ROUTES array), `src/supply-chain/data/default18Routes.js`

## Fields
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | e.g. `SH-ROT-001`, `SH-FRA-AIR` |
| `type` | string | `maritime` or `air` |
| `from` | `{name, portId, lat, lng}` | origin port |
| `to` | `{name, portId, lat, lng}` | destination port |
| `chokepointId` | string | single chokepoint (legacy) |
| `chokepointIds` | string[] | multiple chokepoints (preferred) |
| `commodity` | string | e.g. `semiconductors`, `oil`, `grain` |
| `tradeVolumeM` | number | daily trade volume in $M |
| `portAbsorptionCapacity` | number | 0–1, how much port can absorb disruption |
| `baseRisk` | number | 0–100, baseline risk score |
| `currentRisk` | number | live risk score (set by pipeline) |
| `status` | string | `normal`, `warning`, `severe`, `critical` |
| `currentPosition` | `{lat, lng}` | simulated vessel position |
| `waypoints` | `{lat, lng}[]` | maritime waypoints keeping ships in water |

## Current routes (18 total)
Maritime: SH-ROT-001, SH-CHN-001, SIN-ROT-001, DUB-LB-001, HKG-HAM-001, TOK-NYC-001, SIN-LA-001, SH-SIN-001, BUS-SH-001, HOR-ROT-OIL, HOR-SIN-LNG, PAN-NYC-001, LB-SH-EMPTY, BAB-ROT-001, CAPE-ALT-001
Air: SH-FRA-AIR, HKG-LAX-AIR, SIN-LHR-AIR
