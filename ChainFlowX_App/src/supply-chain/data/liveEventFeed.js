import { keywordClassify } from './newsKeywordClassifier.js';
import { RSS_FEEDS } from './rssFeedConfig.js';
import { classifyEvent } from '../ai/llmClassify.js';

export const GDELT_QUERY_ROTATION = [
  'shipping disruption port',
  'Suez Canal blockage',
  'Strait of Malacca',
  'Red Sea shipping attack',
  'Panama Canal drought',
  'Strait of Hormuz',
  'trade sanctions shipping',
  'cargo ship seized',
  'port strike workers',
  'supply chain earthquake typhoon',
];

export const SIGNAL_TTL = {
  critical: 6 * 60 * 60 * 1000,
  high: 2 * 60 * 60 * 1000,
  medium: 30 * 60 * 1000,
  low: 15 * 60 * 1000,
  info: 5 * 60 * 1000,
};

const FRESH_MS = 15 * 60 * 1000;
const VERY_STALE_MS = 60 * 60 * 1000;
const DEFAULT_POLL_MS = 120000;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 10 * 60 * 1000;
const LLM_HEADLINE_TTL_MS = 24 * 60 * 60 * 1000;

const TIER_RANK = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };

/** @type {object[]} */
let _lastArticlesSnapshot = [];
/** @type {Record<string, object>} */
let _lastStatusMap = {};
/** @type {Record<string, object>} */
let _lastCacheRef = {};
let _lastMergeAt = 0;
/** @type {null | (() => Promise<void>)} */
let _activeFeedTick = null;

const LLM_RESULT_CACHE = new Map();
const LLM_CACHE_MAX = 300;

function hashHeadlineDesc(headline, description) {
  const s = `${headline || ''}|${description || ''}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function tierRank(t) {
  return TIER_RANK[t] ?? 0;
}

function getApiBase() {
  const b = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE;
  return (typeof b === 'string' ? b : '').replace(/\/$/, '');
}

const apiPrefix = () => (getApiBase() ? `${getApiBase()}` : '');

function dayStamp(ms) {
  if (!ms || !Number.isFinite(ms)) return 'x';
  return new Date(ms).toISOString().slice(0, 10);
}

function dayOfYear(ms) {
  const d = new Date(ms);
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return `${d.getFullYear()}-${Math.floor(diff / 86400000)}`;
}

/** Prefer lowest tier number (1 = best) when merging */
function sourceTierRank(t) {
  const n = Number(t);
  return Number.isFinite(n) ? n : 9;
}

export function parseRSSXml(xmlString, sourceName, sourceTier) {
  if (typeof xmlString !== 'string' || !xmlString.trim()) return [];
  if (typeof DOMParser === 'undefined') return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) return [];

  const items = doc.querySelectorAll('item');
  return Array.from(items)
    .map((item) => {
      const title = item.querySelector('title')?.textContent?.trim() || '';
      let description = item.querySelector('description')?.textContent || '';
      description = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

      let url = item.querySelector('link')?.textContent?.trim() || '';
      const linkEl = item.querySelector('link');
      if (!url && linkEl?.getAttribute) {
        url = linkEl.getAttribute('href')?.trim() || '';
      }
      if (!url) {
        url = item.querySelector('guid')?.textContent?.trim() || '';
      }

      let publishedRaw =
        item.querySelector('pubDate')?.textContent ||
        item.querySelector('dc\\:date')?.textContent ||
        item.getElementsByTagNameNS?.('http://purl.org/dc/elements/1.1/', 'date')?.[0]?.textContent ||
        '';

      const parsed = publishedRaw ? Date.parse(publishedRaw) : NaN;
      const publishedAt = Number.isFinite(parsed) ? parsed : Date.now();

      return {
        title,
        description,
        url,
        publishedAt,
        source: sourceName,
        sourceTier,
        category: 'supply_chain',
      };
    })
    .filter((it) => it.url && it.title);
}

const TEXT_HOTSPOTS = [
  { keys: ['red sea', 'bab el', 'houthi', 'aden'], lat: 20, lng: 38 },
  { keys: ['suez'], lat: 30.2, lng: 32.4 },
  { keys: ['malacca'], lat: 2.5, lng: 101.5 },
  { keys: ['hormuz'], lat: 26.5, lng: 56.5 },
  { keys: ['panama canal', 'panama'], lat: 9.1, lng: -79.7 },
  { keys: ['taiwan', 'kaohsiung'], lat: 23.5, lng: 121 },
  { keys: ['bengal', 'chennai', 'colombo'], lat: 13, lng: 85 },
  { keys: ['black sea', 'odessa'], lat: 43.5, lng: 34 },
  { keys: ['baltic'], lat: 55, lng: 18 },
  { keys: ['south china sea'], lat: 12, lng: 115 },
];

export function inferLatLngFromText(headline, description) {
  const t = `${headline || ''} ${description || ''}`.toLowerCase();
  for (const h of TEXT_HOTSPOTS) {
    if (h.keys.some((k) => t.includes(k))) return { lat: h.lat, lng: h.lng };
  }
  return { lat: null, lng: null };
}

function keywordTypeToEventType(kw) {
  const map = {
    conflict: 'conflict',
    cyclone: 'cyclone',
    earthquake: 'earthquake',
    strike: 'strike',
    sanctions: 'sanctions',
    maritime: 'blockage',
  };
  return map[kw?.type] || 'other';
}

const LLM_EVENT_TYPES = new Set(['cyclone', 'conflict', 'strike', 'earthquake', 'sanctions', 'blockage', 'other']);

function getEffectiveEventType(article) {
  const llm = article.llmClassification;
  const kc = article.keyword?.confidence ?? 0;
  if (llm && typeof llm.confidence === 'number' && llm.confidence > kc) {
    const t = String(llm.eventType || 'other').toLowerCase();
    if (LLM_EVENT_TYPES.has(t)) return t;
  }
  return keywordTypeToEventType(article.keyword);
}

const COUNTRY_CENTROIDS = {
  china: { lat: 35.86, lng: 104.2 },
  'united states': { lat: 37.1, lng: -95.7 },
  usa: { lat: 37.1, lng: -95.7 },
  us: { lat: 37.1, lng: -95.7 },
  india: { lat: 20.6, lng: 79.0 },
  japan: { lat: 36.2, lng: 138.3 },
  'south korea': { lat: 35.9, lng: 127.8 },
  korea: { lat: 35.9, lng: 127.8 },
  germany: { lat: 51.2, lng: 10.5 },
  netherlands: { lat: 52.1, lng: 5.3 },
  singapore: { lat: 1.35, lng: 103.82 },
  'united kingdom': { lat: 55.4, lng: -3.4 },
  uk: { lat: 55.4, lng: -3.4 },
  brazil: { lat: -14.2, lng: -51.9 },
  uae: { lat: 23.4, lng: 53.8 },
  'saudi arabia': { lat: 23.9, lng: 45.1 },
  egypt: { lat: 26.8, lng: 30.8 },
  taiwan: { lat: 23.7, lng: 121 },
  vietnam: { lat: 14.1, lng: 108.3 },
  malaysia: { lat: 4.2, lng: 101.8 },
  indonesia: { lat: -0.8, lng: 113.9 },
  italy: { lat: 41.9, lng: 12.6 },
  france: { lat: 46.2, lng: 2.2 },
};

function collectEntityStrings(article) {
  const out = [];
  const e = article?.llmClassification?.entities;
  if (e && typeof e === 'object') {
    ['ports', 'countries', 'chokepoints'].forEach((k) => {
      if (Array.isArray(e[k])) out.push(...e[k].map((x) => String(x).toLowerCase()));
    });
  }
  const t = `${article.headline || ''} ${article.description || ''}`.toLowerCase();
  if (t) out.push(t);
  return out;
}

function firstChokepointTableMatch(article) {
  const CHOKEPOINT_COORDS = {
    'suez canal': { lat: 30.42, lng: 32.35, radius: 300 },
    suez: { lat: 30.42, lng: 32.35, radius: 300 },
    'strait of malacca': { lat: 1.26, lng: 103.82, radius: 400 },
    malacca: { lat: 1.26, lng: 103.82, radius: 400 },
    'strait of hormuz': { lat: 26.56, lng: 56.26, radius: 300 },
    hormuz: { lat: 26.56, lng: 56.26, radius: 300 },
    'bab el-mandeb': { lat: 12.58, lng: 43.42, radius: 250 },
    'bab el mandeb': { lat: 12.58, lng: 43.42, radius: 250 },
    'red sea': { lat: 20.0, lng: 38.0, radius: 500 },
    'panama canal': { lat: 9.08, lng: -79.68, radius: 200 },
    panama: { lat: 9.08, lng: -79.68, radius: 200 },
    'cape of good hope': { lat: -34.35, lng: 18.47, radius: 400 },
    'cape route': { lat: -34.35, lng: 18.47, radius: 400 },
    'south china sea': { lat: 12.0, lng: 113.0, radius: 600 },
    'bay of bengal': { lat: 15.0, lng: 85.0, radius: 500 },
    'taiwan strait': { lat: 24.5, lng: 120.0, radius: 300 },
    'black sea': { lat: 43.0, lng: 34.0, radius: 400 },
    'persian gulf': { lat: 26.0, lng: 51.0, radius: 400 },
    shanghai: { lat: 31.23, lng: 121.47, radius: 100 },
    singapore: { lat: 1.35, lng: 103.82, radius: 80 },
    rotterdam: { lat: 51.92, lng: 4.48, radius: 80 },
    'los angeles': { lat: 33.73, lng: -118.26, radius: 80 },
    dubai: { lat: 25.27, lng: 55.33, radius: 80 },
    'hong kong': { lat: 22.31, lng: 114.17, radius: 80 },
    busan: { lat: 35.18, lng: 129.08, radius: 80 },
    hamburg: { lat: 53.55, lng: 9.99, radius: 80 },
    antwerp: { lat: 51.22, lng: 4.4, radius: 80 },
    chennai: { lat: 13.08, lng: 80.27, radius: 80 },
    colombo: { lat: 6.93, lng: 79.85, radius: 80 },
    'port klang': { lat: 3.0, lng: 101.4, radius: 80 },
  };

  const keys = Object.keys(CHOKEPOINT_COORDS).sort((a, b) => b.length - a.length);
  const blobs = collectEntityStrings(article);
  for (const blob of blobs) {
    for (const k of keys) {
      if (blob.includes(k)) return { name: k, ...CHOKEPOINT_COORDS[k] };
    }
  }
  for (const [country, c] of Object.entries(COUNTRY_CENTROIDS)) {
    for (const blob of blobs) {
      if (blob.includes(country)) return { name: country, lat: c.lat, lng: c.lng, radius: 200 };
    }
  }
  return null;
}

export function liveArticleToPipelineEvent(article) {
  const kw = article.keyword || keywordClassify(article.headline, article.description || '');
  const eventType = getEffectiveEventType({ ...article, keyword: kw });
  let lat = article.lat;
  let lng = article.lng;
  let radius = 200;

  const geo = firstChokepointTableMatch(article);
  if (geo) {
    lat = geo.lat;
    lng = geo.lng;
    radius = geo.radius;
  } else if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    const hint = inferLatLngFromText(article.headline, article.description);
    if (hint.lat != null && hint.lng != null) {
      lat = hint.lat;
      lng = hint.lng;
    } else {
      const t = `${article.headline || ''} ${article.description || ''}`.toLowerCase();
      let centroid = null;
      for (const [country, c] of Object.entries(COUNTRY_CENTROIDS)) {
        if (t.includes(country)) {
          centroid = c;
          break;
        }
      }
      if (centroid) {
        lat = centroid.lat;
        lng = centroid.lng;
        radius = 200;
      } else {
        lat = 0;
        lng = 0;
        radius = 200;
      }
    }
  }

  if (!Number.isFinite(lat)) lat = 0;
  if (!Number.isFinite(lng)) lng = 0;
  if (!Number.isFinite(radius) || radius <= 0) radius = 200;

  const tierSev = { critical: 0.92, high: 0.78, medium: 0.58, low: 0.42, info: 0.28 };
  const severity = tierSev[kw.tier] ?? 0.5;
  const supplyChainRelevance =
    typeof article.displayRelevance === 'number'
      ? article.displayRelevance
      : typeof kw.supplyChainRelevance === 'number'
        ? kw.supplyChainRelevance
        : 0.5;

  return {
    id: article.id,
    headline: article.headline,
    description: article.description || '',
    lat,
    lng,
    radius,
    type: eventType,
    url: article.url,
    source: article.source,
    severity,
    supplyChainRelevance,
  };
}

export function signalDedupKey(article, eventType = getEffectiveEventType(article)) {
  const geo = firstChokepointTableMatch(article);
  const chokeSlug = geo?.name?.replace(/\s+/g, '_') || 'unknown';
  return `${eventType}:${chokeSlug}:${dayOfYear(article.publishedAt || Date.now())}`;
}

function geoGridDayKey(lat, lng, publishedAt) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const day = dayStamp(publishedAt);
  const glat = Math.round(lat * 10) / 10;
  const glng = Math.round(lng * 10) / 10;
  return `${glat},${glng}|${day}`;
}

export function dedupeArticles(items) {
  const byUrl = new Map();
  for (const a of items) {
    const u = (a.url || '').trim();
    if (!u) continue;
    const prev = byUrl.get(u);
    if (!prev || sourceTierRank(a.sourceTier) < sourceTierRank(prev.sourceTier)) {
      byUrl.set(u, a);
    }
  }
  const list = [...byUrl.values()];
  const buckets = new Map();
  for (const a of list) {
    const gk = geoGridDayKey(a.lat, a.lng, a.publishedAt);
    const key = gk || `__nou:${a.url}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(a);
  }
  const out = [];
  for (const group of buckets.values()) {
    group.sort((a, b) => {
      const tr = tierRank(b.keyword?.tier) - tierRank(a.keyword?.tier);
      if (tr !== 0) return tr;
      const st = sourceTierRank(a.sourceTier) - sourceTierRank(b.sourceTier);
      if (st !== 0) return st;
      return (b.publishedAt || 0) - (a.publishedAt || 0);
    });
    out.push(group[0]);
  }
  return out.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
}

function parseGdeltJson(text) {
  try {
    const j = JSON.parse(text);
    const arts = j.articles || j.article || j.data || [];
    return Array.isArray(arts) ? arts : [];
  } catch {
    return [];
  }
}

function enrichArticle(raw) {
  const hint = inferLatLngFromText(raw.headline, raw.description || '');
  const kw = keywordClassify(raw.headline, raw.description || '');
  return {
    ...raw,
    id: raw.url,
    lat: raw.lat != null ? raw.lat : hint.lat,
    lng: raw.lng != null ? raw.lng : hint.lng,
    keyword: kw,
    ingestAt: Date.now(),
    displayRelevance: kw.supplyChainRelevance,
    displayConfidence: kw.confidence,
  };
}

function normalizeGdeltArticle(a, idx) {
  const title = a.title || a.Title || a.snippet || '';
  const url = a.url || a.URL || a.documentidentifier || `gdelt:${idx}:${title.slice(0, 40)}`;
  const seendate = a.seendate || a.datetime || '';
  let publishedAt = Date.now();
  if (seendate && String(seendate).length >= 12) {
    const y = +String(seendate).slice(0, 4);
    const mo = +String(seendate).slice(4, 6) - 1;
    const d = +String(seendate).slice(6, 8);
    const h = +String(seendate).slice(8, 10) || 0;
    const mi = +String(seendate).slice(10, 12) || 0;
    const dt = new Date(y, mo, d, h, mi);
    if (!Number.isNaN(dt.getTime())) publishedAt = dt.getTime();
  }
  return enrichArticle({
    url,
    headline: title,
    description: a.domain ? `Source: ${a.domain}` : '',
    source: 'GDELT',
    sourceId: 'gdelt',
    sourceTier: 1,
    publishedAt,
  });
}

function feedMetaFromRow(row, feed) {
  return enrichArticle({
    url: row.url,
    headline: row.title,
    description: row.description,
    source: row.source,
    sourceId: `rss:${row.source}`,
    sourceTier: row.sourceTier ?? feed.tier ?? 3,
    publishedAt: row.publishedAt,
  });
}

function feedStatusSuccess(detail = '') {
  const t = Date.now();
  return { ok: true, lastAttemptAt: t, lastSuccessAt: t, detail };
}

function feedStatusError(prev, detail = '') {
  const t = Date.now();
  return {
    ok: false,
    lastAttemptAt: t,
    lastSuccessAt: prev?.lastSuccessAt ?? 0,
    detail,
  };
}

export function resolveFeedHealth(meta) {
  if (!meta) return 'unknown';
  if (meta.disabledPolling) return 'disabled';
  if (!meta.ok) return 'error';
  const age = Date.now() - meta.lastSuccessAt;
  if (age < FRESH_MS) return 'fresh';
  if (age < VERY_STALE_MS) return 'stale';
  return 'very_stale';
}

const feedBreakers = new Map();
const signalLastFire = new Map();
/** chokepointName -> { types: Set, windowStart } */
const convergenceMap = new Map();

function getBreakerState(key) {
  if (!feedBreakers.has(key)) {
    feedBreakers.set(key, { failures: 0, disabledUntil: 0 });
  }
  return feedBreakers.get(key);
}

function recordBreakerFailure(key) {
  const b = getBreakerState(key);
  b.failures += 1;
  if (b.failures >= BREAKER_THRESHOLD) {
    b.disabledUntil = Date.now() + BREAKER_COOLDOWN_MS;
    b.failures = 0;
  }
}

function recordBreakerSuccess(key) {
  const b = getBreakerState(key);
  b.failures = 0;
}

function isFeedDisabled(key) {
  const b = getBreakerState(key);
  return Date.now() < b.disabledUntil;
}

function nextRetryMs(key) {
  const b = getBreakerState(key);
  return Math.max(0, b.disabledUntil - Date.now());
}

export function shouldAllowSignalFire(article, eventType) {
  const tier = article.keyword?.tier || 'info';
  const ttl = SIGNAL_TTL[tier] ?? SIGNAL_TTL.info;
  const key = signalDedupKey(article, eventType);
  const last = signalLastFire.get(key) ?? 0;
  if (Date.now() - last < ttl) return false;
  return true;
}

export function recordSignalFire(article, eventType) {
  const key = signalDedupKey(article, eventType);
  signalLastFire.set(key, Date.now());
}

function updateConvergence(article, eventType) {
  const geo = firstChokepointTableMatch(article);
  if (!geo?.name) return;
  const ck = geo.name;
  const now = Date.now();
  let slot = convergenceMap.get(ck);
  if (!slot || now - slot.windowStart > 6 * 60 * 60 * 1000) {
    slot = { types: new Set(), windowStart: now };
    convergenceMap.set(ck, slot);
  }
  slot.types.add(eventType);
  article.chokepointConvergence = slot.types.size >= 2;
}

function buildFeedStatusRows(statusMap, cacheRef) {
  const rows = [];
  const add = (sourceId, name, meta, count) => {
    const m = meta || { ok: false, lastSuccessAt: 0, lastAttemptAt: 0 };
    const st = m.disabledPolling ? 'disabled' : resolveFeedHealth(m);
    const retry = m.disabledPolling || isFeedDisabled(sourceId) ? nextRetryMs(sourceId) : 0;
    rows.push({
      sourceId,
      name,
      status: st,
      lastUpdated: m.lastSuccessAt || m.lastAttemptAt || 0,
      articleCount: count,
      nextRetry: retry,
    });
  };

  add('gdelt', 'GDELT', statusMap.gdelt, (cacheRef.gdelt || []).length);
  for (const f of RSS_FEEDS) {
    const key = `rss:${f.name}`;
    add(key, f.name, statusMap[key], (cacheRef[key] || []).length);
  }
  return rows;
}

export function getFeedStatus() {
  return buildFeedStatusRows(_lastStatusMap, _lastCacheRef);
}

export async function fetchLatestEvents() {
  if (typeof _activeFeedTick === 'function') {
    await _activeFeedTick();
  }
  return _lastArticlesSnapshot.slice();
}

async function maybeUpgradeLlm(article) {
  const key = hashHeadlineDesc(article.headline, article.description);
  const cached = LLM_RESULT_CACHE.get(key);
  if (cached && Date.now() - cached.at < LLM_HEADLINE_TTL_MS) {
    article.llmClassification = cached.result;
    applyLlmDisplay(article, cached.result);
    return;
  }
  try {
    const result = await classifyEvent(article.headline, article.description || '');
    article.llmClassification = result;
    applyLlmDisplay(article, result);
    if (LLM_RESULT_CACHE.size >= LLM_CACHE_MAX) {
      const first = LLM_RESULT_CACHE.keys().next().value;
      LLM_RESULT_CACHE.delete(first);
    }
    LLM_RESULT_CACHE.set(key, { at: Date.now(), result });
  } catch {
    /* keyword-only */
  }
}

function applyLlmDisplay(article, raw) {
  if (!raw || typeof raw !== 'object') return;
  const kConf = article.keyword?.confidence ?? 0;
  const lConf = typeof raw.confidence === 'number' ? raw.confidence : 0;
  if (lConf > kConf) {
    article.displayConfidence = lConf;
    if (typeof raw.supplyChainRelevance === 'number') {
      article.displayRelevance = Math.max(article.displayRelevance ?? 0, raw.supplyChainRelevance);
    }
  }
}

async function backgroundClassifyTop(articles, onUpdate) {
  const top = articles.filter((a) => a.headline).slice(0, 35);
  for (const a of top) {
    await maybeUpgradeLlm(a);
  }
  if (!stopped && typeof onUpdate === 'function') onUpdate([...articles]);
}

let gdeltQueryIndex = 0;
let rssRoundIndex = 0;
let timerId = null;
let stopped = false;

function nextGdeltQuery() {
  const q = GDELT_QUERY_ROTATION[gdeltQueryIndex % GDELT_QUERY_ROTATION.length];
  gdeltQueryIndex += 1;
  return q;
}

function sortedRssIndices() {
  return RSS_FEEDS.map((_, i) => i).sort(
    (i, j) => sourceTierRank(RSS_FEEDS[i].tier) - sourceTierRank(RSS_FEEDS[j].tier),
  );
}

const rssOrder = sortedRssIndices();
function nextRssFeeds(batchSize) {
  const out = [];
  for (let i = 0; i < batchSize; i++) {
    const idx = rssOrder[rssRoundIndex % rssOrder.length];
    rssRoundIndex += 1;
    out.push(RSS_FEEDS[idx]);
  }
  return out;
}

async function fetchGdelt(statusMap, cacheRef) {
  const q = nextGdeltQuery();
  const base = apiPrefix();
  const url = `${base}/api/gdelt-doc?q=${encodeURIComponent(q)}&maxrecords=25&timespan=2h`;
  const prev = statusMap.gdelt;
  const key = 'gdelt';

  if (isFeedDisabled(key)) {
    statusMap.gdelt = {
      ...prev,
      ok: prev?.ok ?? false,
      disabledPolling: true,
      lastAttemptAt: Date.now(),
      query: q,
    };
    return cacheRef.gdelt || [];
  }

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    const raw = parseGdeltJson(text);
    const items = raw.map((a, i) => normalizeGdeltArticle(a, i));
    cacheRef.gdelt = items;
    statusMap.gdelt = { ...feedStatusSuccess(q), query: q, disabledPolling: false };
    recordBreakerSuccess(key);
    return items;
  } catch (e) {
    recordBreakerFailure(key);
    const dis = isFeedDisabled(key);
    statusMap.gdelt = {
      ...feedStatusError(prev, e?.message || 'fail'),
      query: q,
      disabledPolling: dis,
    };
    return cacheRef.gdelt || [];
  }
}

async function fetchRssFeed(feed, statusMap, cacheRef) {
  const key = `rss:${feed.name}`;
  const base = apiPrefix();
  const url = `${base}/api/rss-proxy?url=${encodeURIComponent(feed.url)}`;
  const prev = statusMap[key];

  if (isFeedDisabled(key)) {
    statusMap[key] = {
      ...prev,
      ok: prev?.ok ?? false,
      disabledPolling: true,
      feedName: feed.name,
      lastAttemptAt: Date.now(),
    };
    return cacheRef[key] || [];
  }

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const xml = await r.text();
    const rows = parseRSSXml(xml, feed.name, feed.tier ?? 3);
    const items = rows.map((row) => feedMetaFromRow(row, feed));
    cacheRef[key] = items;
    statusMap[key] = { ...feedStatusSuccess(feed.name), feedName: feed.name, disabledPolling: false };
    recordBreakerSuccess(key);
    return items;
  } catch (e) {
    recordBreakerFailure(key);
    const dis = isFeedDisabled(key);
    statusMap[key] = {
      ...feedStatusError(prev, e?.message || 'fail'),
      feedName: feed.name,
      disabledPolling: dis,
    };
    return cacheRef[key] || [];
  }
}

export function startLiveEventFeed(options) {
  const {
    onArticlesUpdate,
    onFeedStatusUpdate,
    onPipelineEvent,
    pollIntervalMs = DEFAULT_POLL_MS,
    triggeredUrls = new Set(),
  } = options || {};

  stopped = false;
  const statusMap = {};
  const cacheRef = { gdelt: null };

  const tick = async () => {
    if (stopped) return;

    const gdeltItems = await fetchGdelt(statusMap, cacheRef);
    const feedsThisTick = nextRssFeeds(3);
    const rssChunks = await Promise.all(feedsThisTick.map((f) => fetchRssFeed(f, statusMap, cacheRef)));
    const rssItems = rssChunks.flat();

    let merged = dedupeArticles([...gdeltItems, ...rssItems]);
    merged = merged.slice(0, 120);
    _lastMergeAt = Date.now();

    void backgroundClassifyTop(merged, (copy) => {
      if (!stopped && typeof onArticlesUpdate === 'function') onArticlesUpdate(copy);
    });

    _lastArticlesSnapshot = merged;
    _lastStatusMap = { ...statusMap };
    _lastCacheRef = { ...cacheRef };

    if (typeof onFeedStatusUpdate === 'function') {
      onFeedStatusUpdate({ ...statusMap });
    }
    if (typeof onArticlesUpdate === 'function') {
      onArticlesUpdate(merged);
    }

    // High-relevance articles: dispatch normalized event to App — UI runs runPipeline()
    // (full chain: disruption geography → risk → correlation/ripple → DNA → cascade).
    if (typeof onPipelineEvent === 'function') {
      for (const a of merged) {
        const rel = a.displayRelevance ?? a.keyword?.supplyChainRelevance ?? 0;
        if (rel <= 0.6) continue;
        const u = (a.url || '').trim();
        if (!u || triggeredUrls.has(u)) continue;
        const evtType = getEffectiveEventType(a);
        if (!shouldAllowSignalFire(a, evtType)) continue;
        triggeredUrls.add(u);
        recordSignalFire(a, evtType);
        updateConvergence(a, evtType);
        onPipelineEvent(liveArticleToPipelineEvent(a));
        break;
      }
    }
  };

  _activeFeedTick = tick;
  tick();
  timerId = setInterval(tick, pollIntervalMs);

  return {
    stop: stopLiveEventFeed,
    refreshNow: tick,
  };
}

export const startLiveFeed = startLiveEventFeed;

export function stopLiveEventFeed() {
  stopped = true;
  _activeFeedTick = null;
  if (timerId != null) {
    clearInterval(timerId);
    timerId = null;
  }
}

export const LIVE_FEED_CONSTANTS = {
  FRESH_MS,
  VERY_STALE_MS,
};
