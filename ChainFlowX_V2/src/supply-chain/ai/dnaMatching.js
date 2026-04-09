export function matchDNA(classified, fingerprints) {
  if (!classified) return [];

  const results = fingerprints.map(fp => {
    const typeMatch = classified.eventType === fp.type ? 1.0 : 0.0;
    const sevDelta = 1 - Math.abs((classified.severity || 0.5) - fp.severity);
    const cpMatch = (classified.nearestChokepoint === fp.chokepointId || classified.nearestChokepoint === fp.chokepoint) ? 1.0 : 0.3;
    const regionMatch = classified.region === fp.region ? 1.0 : 0.5;

    let rawSim = (typeMatch * 0.40) + (sevDelta * 0.30) + (cpMatch * 0.20) + (regionMatch * 0.10);

    // CRITICAL FIX #4: TYPE MISMATCH PENALTY
    if (typeMatch === 0) {
      rawSim *= 0.5;
    }

    const similarity = Math.round(rawSim * 100);

    let confidenceStr = 'Low Confidence — signal detected, pattern weak';
    if (similarity >= 80) confidenceStr = 'High Confidence — historical precedent is strong';
    else if (similarity >= 60) confidenceStr = 'Medium Confidence — treat as leading indicator';

    return {
      ...fp,
      similarity,
      confidence: confidenceStr
    };
  });

  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}
