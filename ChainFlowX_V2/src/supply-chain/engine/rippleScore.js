// CRITICAL FIX #3: ALL inputs must go through safe() helper
const safe = (v, def = 0) => (typeof v === 'number' && isFinite(v)) ? v : def;

export const COMMODITY_CRITICALITY = {
  semiconductors: 1.0,
  pharmaceuticals: 1.0,
  oil: 0.90,
  electronics: 0.85,
  automotive: 0.80,
  chemicals: 0.70,
  grain: 0.60,
  consumer_goods: 0.55,
  bulk: 0.30
};

export function calculateRippleScore(cascadeDepth, tradeVolumeM, portAbsorption, timeToAlternativeDays, commodity) {
  const sCascade = safe(cascadeDepth, 0);
  const sTrade = safe(tradeVolumeM, 0);
  const sAbsorb = safe(portAbsorption, 1.0); // defaults to 1.0 (no restriction)
  const sTime = safe(timeToAlternativeDays, 0);
  
  const cCrit = COMMODITY_CRITICALITY[commodity] ?? 0.5; // fallback 0.5

  /* Formula:
     RippleScore = (cascadeDepth × 2.0)
                 + (tradeVolumeM / 100 × 1.5)
                 + ((1 − portAbsorption) × 2.5)
                 + (timeToAlternativeDays / 7 × 1.5)
                 + (commodityCriticality × 2.5)
  */
  const cascadeComp = sCascade * 2.0;
  const tradeComp = (sTrade / 100) * 1.5;
  const absorbComp = (1 - sAbsorb) * 2.5;
  const timeComp = (sTime / 7) * 1.5;
  const commComp = cCrit * 2.5;

  const raw = cascadeComp + tradeComp + absorbComp + timeComp + commComp;
  
  if (isNaN(raw)) return { score: "0.0", raw: 0, label: "MODERATE", derivation: {} };

  const scoreNum = Math.min(10, Math.max(0, raw));
  const scoreStr = scoreNum.toFixed(1);

  let label = 'MODERATE';
  if (scoreNum >= 8) label = 'CRITICAL';
  else if (scoreNum >= 6) label = 'SEVERE';
  else if (scoreNum >= 4) label = 'ELEVATED';

  return {
    score: scoreStr,
    raw: scoreNum,
    label,
    derivation: {
      cascade: { formula: 'depth × 2.0', value: cascadeComp.toFixed(2) },
      trade: { formula: '(vol/100) × 1.5', value: tradeComp.toFixed(2) },
      absorption: { formula: '(1-cap) × 2.5', value: absorbComp.toFixed(2) },
      time: { formula: '(days/7) × 1.5', value: timeComp.toFixed(2) },
      commodity: { formula: 'crit × 2.5', value: commComp.toFixed(2) }
    }
  };
}
