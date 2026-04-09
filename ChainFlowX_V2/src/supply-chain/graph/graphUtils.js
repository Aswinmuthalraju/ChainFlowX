export function buildGraph(ports, routes, chokepoints) {
  const nodes = {};
  const edges = {};

  // Initialize all nodes
  ports.forEach(p => { nodes[p.id] = { ...p, nodeType: 'port' }; edges[p.id] = new Set(); });
  chokepoints.forEach(cp => { nodes[cp.id] = { ...cp, nodeType: 'chokepoint' }; edges[cp.id] = new Set(); });

  const addEdge = (u, v) => {
    if (nodes[u] && nodes[v]) {
      edges[u].add(v);
      edges[v].add(u);
    }
  };

  routes.forEach(route => {
    // A route implies paths between sequential points.
    // Wait, the spec says: "chokepoints are inserted as intermediate nodes between port pairs that pass through them"
    // So let's build connections based on graphEdges from route.
    // If graphEdges is ['PORT-SIN', 'PORT-HKG', 'CHKPT-MALACCA'], we should connect them sequentially?
    // Actually, graphEdges might be unordered in the route object, or ordered?
    // Let's connect them sequentially as given in graphEdges if length > 1.
    // Also we connect route.from.portId to the first edge, and the last edge to route.to.portId.
    const path = [route.from.portId, ...(route.graphEdges || []), route.to.portId];
    for (let i = 0; i < path.length - 1; i++) {
        addEdge(path[i], path[i+1]);
    }
  });

  // Convert Set to Array
  const finalEdges = {};
  for (const [k, v] of Object.entries(edges)) {
    finalEdges[k] = Array.from(v);
  }

  return { nodes, edges: finalEdges };
}

export function validateGraph(graph) {
  const errors = [];
  if (!graph || !graph.nodes || !graph.edges) {
    return { valid: false, errors: ['Graph structure invalid (missing nodes/edges)'] };
  }

  const reqChokepoints = ['CHKPT-MALACCA', 'CHKPT-SUEZ', 'CHKPT-HORMUZ', 'CHKPT-PANAMA', 'CHKPT-BAB', 'CHKPT-CAPE'];
  reqChokepoints.forEach(cpId => {
    if (!graph.nodes[cpId]) {
      errors.push(`Missing critical chokepoint: ${cpId}`);
    } else {
      const e = graph.edges[cpId] || [];
      if (e.length < 2) {
        errors.push(`Chokepoint ${cpId} has fewer than 2 edges`);
      }
    }
  });

  // Check dangling edges
  for (const [u, neighbors] of Object.entries(graph.edges)) {
    neighbors.forEach(v => {
      if (!graph.nodes[v]) {
         errors.push(`Dangling edge from ${u} to undefined node ${v}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function getNodeDegree(graph, nodeId) {
  return graph?.edges?.[nodeId]?.length || 0;
}

export function getSerialDependencies(graph) {
  const serial = [];
  if (!graph || !graph.edges) return serial;
  for (const [nodeId, neighbors] of Object.entries(graph.edges)) {
    if (neighbors.length === 1) {
      serial.push(graph.nodes[nodeId]);
    }
  }
  return serial;
}
