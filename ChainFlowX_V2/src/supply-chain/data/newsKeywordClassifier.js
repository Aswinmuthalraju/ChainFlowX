/**
 * Stage 2 Step A — synchronous keyword classifier for supply-chain news.
 */

const TIER_ORDER = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };

export const SUPPLY_CHAIN_KEYWORDS = {
  critical: [
    'port closure',
    'strait blocked',
    'canal closed',
    'route blocked',
    'shipping halted',
    'trade embargo',
    'sanctions imposed',
    'blockade',
    'chokepoint closed',
  ],
  high: [
    'cyclone',
    'typhoon',
    'hurricane',
    'earthquake',
    'tsunami',
    'conflict escalation',
    'military strike',
    'cargo seized',
    'vessel detained',
    'piracy attack',
    'port congestion critical',
    'freight spike',
  ],
  medium: [
    'strike action',
    'labor dispute',
    'port slowdown',
    'weather warning',
    'flood risk',
    'sanctions warning',
    'trade dispute',
    'vessel rerouted',
    'container shortage',
    'rail disruption',
  ],
  low: [
    'port delay',
    'weather watch',
    'trade tension',
    'shipping advisory',
    'fuel price surge',
    'crew shortage',
  ],
  info: [
    'shipping news',
    'trade update',
    'port announcement',
    'freight market',
  ],
};

const CATEGORY_RULES = [
  {
    type: 'conflict',
    patterns: /\b(conflict|military|attack|missile|war|strikes on|naval|drone strike|airstrike)\b/i,
  },
  {
    type: 'cyclone',
    patterns: /\b(cyclone|typhoon|hurricane|tropical storm|storm surge)\b/i,
  },
  {
    type: 'earthquake',
    patterns: /\b(earthquake|seismic|tsunami|aftershock)\b/i,
  },
  {
    type: 'strike',
    patterns: /\b(strike|protest|walkout|labor|union|ilwu|dockworkers)\b/i,
  },
  {
    type: 'sanctions',
    patterns: /\b(sanctions|embargo|ban|restriction|export control|blacklist)\b/i,
  },
  {
    type: 'maritime',
    patterns: /\b(port|cargo|vessel|freight|container|shipping|canal|strait|maritime|tanker|bulk carrier|ulcv)\b/i,
  },
];

function mapTypeToCategory(type) {
  if (type === 'conflict') return 'conflict';
  if (type === 'cyclone' || type === 'earthquake') return 'disaster';
  if (type === 'strike') return 'strike';
  if (type === 'sanctions') return 'sanctions';
  if (type === 'maritime') return 'port';
  return 'trade';
}

function inferTypeFromText(text) {
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.test(text)) return rule.type;
  }
  return 'maritime';
}

function tierBaseConfidence(tier) {
  switch (tier) {
    case 'critical':
      return 0.88;
    case 'high':
      return 0.78;
    case 'medium':
      return 0.62;
    case 'low':
      return 0.48;
    case 'info':
      return 0.35;
    default:
      return 0.4;
  }
}

function relevanceFromTier(tier, matchCount) {
  const base = {
    critical: 0.92,
    high: 0.82,
    medium: 0.68,
    low: 0.52,
    info: 0.38,
  }[tier] ?? 0.45;
  const bump = Math.min(0.12, (matchCount - 1) * 0.04);
  return Math.min(0.98, base + bump);
}

/**
 * @param {string} headline
 * @param {string} [description]
 * @returns {{ tier: string, category: string, type: string, confidence: number, supplyChainRelevance: number, matchedKeywords: string[] }}
 */
export const keywordClassify = (headline, description = '') => {
  const text = `${headline || ''} ${description || ''}`.toLowerCase();
  const matchedKeywords = [];
  let bestTier = 'info';
  let bestOrder = 0;

  for (const tier of Object.keys(SUPPLY_CHAIN_KEYWORDS)) {
    for (const phrase of SUPPLY_CHAIN_KEYWORDS[tier]) {
      if (text.includes(phrase.toLowerCase())) {
        matchedKeywords.push(phrase);
        const ord = TIER_ORDER[tier] || 0;
        if (ord > bestOrder) {
          bestOrder = ord;
          bestTier = tier;
        }
      }
    }
  }

  const type = inferTypeFromText(text);
  const category = mapTypeToCategory(type);
  const confidence =
    matchedKeywords.length > 0
      ? tierBaseConfidence(bestTier)
      : Math.max(0.25, tierBaseConfidence('info') - 0.15);
  const supplyChainRelevance =
    matchedKeywords.length > 0
      ? relevanceFromTier(bestTier, matchedKeywords.length)
      : type === 'maritime'
        ? 0.42
        : 0.28;

  return {
    tier: bestTier,
    category,
    type,
    confidence,
    supplyChainRelevance,
    matchedKeywords,
  };
};

const TIER_SEVERITY = {
  critical: 0.92,
  high: 0.78,
  medium: 0.58,
  low: 0.4,
  info: 0.26,
};

const TYPE_TO_EVENT = {
  conflict: 'conflict',
  cyclone: 'cyclone',
  earthquake: 'earthquake',
  strike: 'strike',
  sanctions: 'sanctions',
  maritime: 'blockage',
};

/**
 * Shape consumed by validateAndNormalizeClassification (before validation).
 */
export function keywordToRawClassification(kw) {
  const eventType = TYPE_TO_EVENT[kw.type] || 'other';
  return {
    eventType,
    severity: TIER_SEVERITY[kw.tier] ?? 0.5,
    entities: { ports: [], countries: [], chokepoints: [] },
    nearestChokepoint: null,
    region: 'unknown',
    supplyChainRelevance: kw.supplyChainRelevance,
    estimatedDuration: 'days',
    confidence: kw.confidence,
  };
}
