# Module: Graph
_Last updated: 2026-04-19 | Verified against code: 2026-04-19_

## Purpose
Port/chokepoint dependency graph — built once at startup, used for BFS ripple propagation.

## Location
`src/supply-chain/graph/`

## Key files
- `graphUtils.js` — `buildGraph(ports, routes, chokepoints)`, `validateGraph(g)` — constructs adjacency structure; validation logs warnings on init
- `dependencyGraph.js` — `propagateRipple(graph, startNodeId, maxDepth)` → array of `{nodeId, depth}` — BFS from a chokepoint/port node

## Exports / public API
- `buildGraph(ports, routes, chokepoints)` → graph object with `nodes` map
- `validateGraph(graph)` → `{valid, errors}`
- `propagateRipple(graph, startNodeId, maxDepth)` → ripple nodes with depth

## Known gotchas
- Graph built once in `App.jsx` `useEffect([], [])` — never rebuilt during session
- `cascadeMaxDepth` from BFS is used directly in the ripple score formula
- If no chokepoint within 2000km of event, falls back to nearest port within 400km
