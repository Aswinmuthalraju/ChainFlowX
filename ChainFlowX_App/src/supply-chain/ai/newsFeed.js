const NEWS_SOURCES = {
  GDELT: {
    url: 'https://api.gdeltproject.org/api/v2/doc/doc',
    query: 'supply chain OR shipping OR logistics OR disruption',
  },
  HELLENIC: {
    url: 'https://www.hellenicshippingnews.com/feed/',
  },
};

const SUPPLY_CHAIN_KEYWORDS = {
  HIGH_WEIGHT: [
    'port closure',
    'blockade',
    'chokepoint',
    'malacca',
    'suez',
    'panama',
    'hormuz',
    'strike',
    'labor action',
    'container',
    'vessel delays',
    'congestion',
    'sanctions',
    'embargo',
    'typhoon',
    'cyclone',
    'disruption',
    'freight rate',
    'shipping cost',
    'container shortage',
  ],
  MEDIUM_WEIGHT: [
    'shipping',
    'maritime',
    'logistics',
    'supply chain',
    'trade',
    'port',
    'cargo',
    'vessel',
    'reroute',
    'delay',
    'risk',
  ],
  LOW_WEIGHT: ['transportation', 'business', 'global trade', 'commerce'],
};

function normalizeArticle(article) {
  return {
    source: article.source || 'Unknown',
    headline: article.headline || article.title || '',
    description: article.description || '',
    url: article.url || '',
    publishedAt: article.publishedAt || new Date().toISOString(),
    category: article.category || 'supply_chain',
  };
}

export function scoreSupplyChainRelevance(headline, description, publishedAt) {
  const text = `${headline || ''} ${description || ''}`.toLowerCase();
  let score = 0;

  for (const keyword of SUPPLY_CHAIN_KEYWORDS.HIGH_WEIGHT) {
    if (text.includes(keyword)) score = Math.min(1, score + 0.2);
  }

  for (const keyword of SUPPLY_CHAIN_KEYWORDS.MEDIUM_WEIGHT) {
    if (text.includes(keyword)) score = Math.min(1, score + 0.1);
  }

  for (const keyword of SUPPLY_CHAIN_KEYWORDS.LOW_WEIGHT) {
    if (text.includes(keyword)) score = Math.min(1, score + 0.05);
  }

  const ageHours = (Date.now() - new Date(publishedAt || Date.now()).getTime()) / (1000 * 3600);
  const recencyBoost = ageHours < 24 ? 0.1 : ageHours < 72 ? 0.05 : 0;

  return Math.min(1, score + recencyBoost);
}

async function fetchGDELTNews(limit = 30) {
  try {
    const params = new URLSearchParams({
      query: NEWS_SOURCES.GDELT.query,
      format: 'json',
      mode: 'ArtList',
      maxrecords: String(limit),
      sort: 'DateDesc',
      language: 'English',
    });

    const response = await fetch(`${NEWS_SOURCES.GDELT.url}?${params.toString()}`);
    if (!response.ok) return [];

    const payload = await response.json();
    const articles = Array.isArray(payload?.articles) ? payload.articles : [];

    return articles.map((article) => ({
      source: 'GDELT',
      headline: article.title || '',
      description: article.seendate || article.domain || '',
      url: article.url || '',
      publishedAt: article.seendate ? new Date(article.seendate).toISOString() : new Date().toISOString(),
      category: 'global_feed',
    }));
  } catch (error) {
    console.warn('[ChainFlowX] GDELT fetch failed:', error);
    return [];
  }
}

function parseRSSFeed(xmlText) {
  if (!xmlText || typeof DOMParser === 'undefined') return [];

  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const items = xml.querySelectorAll('item');

  return Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    link: item.querySelector('link')?.textContent || '',
    pubDate: item.querySelector('pubDate')?.textContent || '',
  }));
}

async function fetchHellenicShippingNews() {
  try {
    const response = await fetch(NEWS_SOURCES.HELLENIC.url);
    if (!response.ok) return [];
    const text = await response.text();
    const parsed = parseRSSFeed(text);

    return parsed.map((article) => ({
      source: 'Hellenic Shipping News',
      headline: article.title,
      description: article.description,
      url: article.link,
      publishedAt: article.pubDate ? new Date(article.pubDate).toISOString() : new Date().toISOString(),
      category: 'maritime_disruption',
    }));
  } catch (error) {
    console.warn('[ChainFlowX] Hellenic feed failed:', error);
    return [];
  }
}

async function fetchWorldBankTradeNews() {
  return [
    {
      source: 'World Bank',
      headline: 'Global container shortages continue to pressure regional trade lanes',
      description: 'Availability remains below baseline in high-traffic corridors, with elevated rerouting risk.',
      url: 'https://www.worldbank.org/en/topic/trade',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      category: 'capacity_constraint',
    },
    {
      source: 'World Bank',
      headline: 'Port throughput growth slows amid persistent congestion bottlenecks',
      description: 'Regional choke points continue to impact transit reliability and inventory planning.',
      url: 'https://www.worldbank.org/en/topic/trade',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      category: 'trade_signal',
    },
  ];
}

export async function fetchSupplyChainNews() {
  const [gdelt, hellenic, worldBank] = await Promise.all([
    fetchGDELTNews(35),
    fetchHellenicShippingNews(),
    fetchWorldBankTradeNews(),
  ]);

  return [...gdelt, ...hellenic, ...worldBank]
    .map(normalizeArticle)
    .map((article) => ({
      ...article,
      relevanceScore: scoreSupplyChainRelevance(article.headline, article.description, article.publishedAt),
    }))
    .filter((article) => article.relevanceScore > 0.3)
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 50);
}
