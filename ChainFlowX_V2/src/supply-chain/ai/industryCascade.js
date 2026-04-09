const INDUSTRY_MAP = {
  'CHKPT-MALACCA': [
    { sector: 'Semiconductors', companies: ['TSMC', 'Samsung', 'Micron'], daysToRisk: 3, riskLevel: 'CRITICAL', minCascadeDepth: 2, minRippleScore: 5 },
    { sector: 'Automotive', companies: ['Toyota', 'Hyundai', 'Honda'], daysToRisk: 4, riskLevel: 'HIGH', minCascadeDepth: 1, minRippleScore: 4 },
    { sector: 'Electronics', companies: ['Apple', 'Sony', 'LG'], daysToRisk: 3, riskLevel: 'CRITICAL', minCascadeDepth: 2, minRippleScore: 5 },
  ],
  'CHKPT-SUEZ': [
    { sector: 'Consumer Goods', companies: ['Unilever', 'Nestlé', 'IKEA'], daysToRisk: 4, riskLevel: 'HIGH', minCascadeDepth: 1, minRippleScore: 4 },
    { sector: 'Chemicals', companies: ['Bayer', 'BASF', 'Dow'], daysToRisk: 5, riskLevel: 'HIGH', minCascadeDepth: 2, minRippleScore: 5 },
    { sector: 'Agriculture', companies: ['Cargill', 'ADM', 'Bunge'], daysToRisk: 6, riskLevel: 'MODERATE', minCascadeDepth: 2, minRippleScore: 5 },
  ],
  'CHKPT-BAB': [
    { sector: 'European Imports', companies: ['H&M', 'Zara', 'Primark'], daysToRisk: 3, riskLevel: 'HIGH', minCascadeDepth: 1, minRippleScore: 4 },
    { sector: 'Pharmaceuticals', companies: ['Roche', 'Novartis', 'AZ'], daysToRisk: 4, riskLevel: 'CRITICAL', minCascadeDepth: 2, minRippleScore: 6 },
    { sector: 'Luxury Goods', companies: ["L'Oréal", 'LVMH', 'Kering'], daysToRisk: 3, riskLevel: 'MODERATE', minCascadeDepth: 1, minRippleScore: 4 },
  ],
  'CHKPT-HORMUZ': [
    { sector: 'Oil & Gas', companies: ['Shell', 'BP', 'ExxonMobil'], daysToRisk: 2, riskLevel: 'CRITICAL', minCascadeDepth: 1, minRippleScore: 3 },
    { sector: 'Petrochemicals', companies: ['BASF', 'SABIC', 'Dow'], daysToRisk: 3, riskLevel: 'HIGH', minCascadeDepth: 1, minRippleScore: 4 },
    { sector: 'Aviation', companies: ['Boeing', 'Airbus', 'GE'], daysToRisk: 5, riskLevel: 'HIGH', minCascadeDepth: 2, minRippleScore: 6 },
  ],
  'CHKPT-PANAMA': [
    { sector: 'US East Coast Imports', companies: ['Amazon', 'Walmart', 'Target'], daysToRisk: 5, riskLevel: 'HIGH', minCascadeDepth: 1, minRippleScore: 4 },
    { sector: 'LNG', companies: ['Chevron', 'ConocoPhillips'], daysToRisk: 4, riskLevel: 'HIGH', minCascadeDepth: 2, minRippleScore: 5 },
    { sector: 'Grain', companies: ['Cargill', 'ADM', 'Archer-Daniels'], daysToRisk: 6, riskLevel: 'MODERATE', minCascadeDepth: 2, minRippleScore: 5 },
  ],
  'CHKPT-CAPE': [
    { sector: 'All Suez-Dependent', companies: ['European Importers'], daysToRisk: 7, riskLevel: 'CRITICAL', minCascadeDepth: 3, minRippleScore: 7 },
  ]
};

export function getIndustryCascade(chokepointId, rippleScoreResult, maxCascadeDepthObserved) {
  if (!chokepointId) return [];
  
  const industries = INDUSTRY_MAP[chokepointId] || [];
  
  // CRITICAL FIX #7
  return industries.filter(ind => {
    const hitsDepth = maxCascadeDepthObserved >= ind.minCascadeDepth;
    const hitsScore = (rippleScoreResult || 0) >= ind.minRippleScore;
    return hitsDepth && hitsScore;
  }).map(ind => ({
    sector: ind.sector,
    companies: ind.companies,
    daysToRisk: ind.daysToRisk,
    riskLevel: ind.riskLevel
  }));
}
