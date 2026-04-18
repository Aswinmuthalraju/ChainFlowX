const SUPPLY_CHAIN_RSS_FEEDS = [
  { url: 'https://splash247.com/feed/', category: 'shipping', name: 'Splash247', tier: 2 },
  {
    url: 'https://www.hellenicshippingnews.com/feed/',
    category: 'shipping',
    name: 'Hellenic Shipping News',
    tier: 3,
  },
  { url: 'https://www.lloydslist.com/rss', category: 'shipping', name: "Lloyd's List", tier: 1 },
  { url: 'https://gcaptain.com/feed/', category: 'shipping', name: 'gCaptain', tier: 2 },
  { url: 'https://www.tradewindsnews.com/rss', category: 'shipping', name: 'TradeWinds', tier: 2 },
  { url: 'https://www.supplychaindive.com/feeds/news/', category: 'supply_chain', name: 'Supply Chain Dive', tier: 3 },
  { url: 'https://www.logisticsmgmt.com/rss/news', category: 'logistics', name: 'Logistics Management', tier: 3 },
  { url: 'https://www.freightwaves.com/news/feed', category: 'freight', name: 'FreightWaves', tier: 2 },
  { url: 'https://feeds.reuters.com/reuters/businessNews', category: 'wire', name: 'Reuters Business', tier: 1 },
  { url: 'https://www.ft.com/world?format=rss', category: 'world', name: 'Financial Times World', tier: 2 },
  { url: 'https://www.porttechnology.org/feed/', category: 'port', name: 'Port Technology', tier: 3 },
  { url: 'https://maritimecyprus.com/feed/', category: 'maritime', name: 'Maritime Cyprus', tier: 3 },
  { url: 'https://www.joc.com/rss/news', category: 'logistics', name: 'JOC', tier: 3 },
  { url: 'https://www.manifoldtimes.com/feed', category: 'shipping', name: 'Manifold Times', tier: 3 },
  { url: 'https://www.marinelink.com/rss', category: 'maritime', name: 'MarineLink', tier: 3 },
  { url: 'https://www.ajot.com/rss/news', category: 'logistics', name: 'AJOT', tier: 3 },
  { url: 'https://www.ttnews.com/rss.xml', category: 'freight', name: 'Transport Topics', tier: 3 },
  {
    url: 'https://www.internationaltransportjournal.com/rss',
    category: 'logistics',
    name: 'International Transport Journal',
    tier: 3,
  },
  { url: 'https://www.seatrade-maritime.com/rss', category: 'shipping', name: 'Seatrade Maritime', tier: 2 },
  { url: 'https://www.worldcargonews.com/feed/', category: 'shipping', name: 'WorldCargo News', tier: 3 },
  { url: 'https://www.offshore-energy.biz/feed/', category: 'maritime', name: 'Offshore Energy', tier: 3 },
  { url: 'https://www.rivieramm.com/feed/', category: 'maritime', name: 'Riviera Maritime', tier: 3 },
];

export const RSS_FEEDS = SUPPLY_CHAIN_RSS_FEEDS;

export const getFeedsByCategory = (category) =>
  SUPPLY_CHAIN_RSS_FEEDS.filter((f) => f.category === category);
