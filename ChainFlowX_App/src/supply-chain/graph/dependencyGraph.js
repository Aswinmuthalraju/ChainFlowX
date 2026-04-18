export function propagateRipple(graph, startNodeId, maxDepthLimit = 3) {
  if (!graph || !startNodeId || !graph.nodes[startNodeId]) return [];

  const maxDepth = Math.max(1, Math.min(maxDepthLimit, 5));
  const visited = new Set();
  const queue = [{ id: startNodeId, depth: 0 }];
  const result = [];

  visited.add(startNodeId);

  while (queue.length > 0) {
    const current = queue.shift();
    const { id, depth } = current;

    // CRITICAL FIX #2: impactFactor = depth > 0 ? (1/depth) : 1.0
    const impactFactor = depth > 0 ? (1 / depth) : 1.0;
    
    result.push({
      node: graph.nodes[id],
      depth,
      impactFactor,
    });

    if (depth < maxDepth) {
      const neighbors = graph.edges[id] || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, depth: depth + 1 });
        }
      }
    }
  }

  return result;
}
