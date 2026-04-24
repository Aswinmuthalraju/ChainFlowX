import { llmMemory } from './llmMemory.js';
import { buildPromptHash, getLLMConfig, requestLLMJSON } from './llmClient.js';

const CLASSIFY_CACHE = new Map();
const CLASSIFY_CACHE_MAX = 200;

function hashHeadlineKey(headline, description) {
  const s = `${headline || ''}|${description || ''}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function keywordClassifierFallback(headline, description) {
  const text = (headline + ' ' + description).toLowerCase();
  let eventType = 'other';
  if (text.match(/storm|cyclone|typhoon|hurricane/)) eventType = 'cyclone';
  else if (text.match(/conflict|attack|war|military/)) eventType = 'conflict';
  else if (text.match(/strike|labor|workers|union|lockout/)) eventType = 'strike';
  else if (text.match(/earthquake|seismic|tsunami/)) eventType = 'earthquake';
  else if (text.match(/sanctions|embargo|ban|restriction/)) eventType = 'sanctions';
  else if (text.match(/blocked|grounded|stuck|vessel|canal/)) eventType = 'blockage';
  let severity = 0.45;
  if (text.match(/critical|severe|major/)) severity = 0.85;
  else if (text.match(/significant|serious/)) severity = 0.65;
  const relevance = severity > 0.7 ? 0.72 : severity > 0.5 ? 0.50 : 0.32;
  return {
    eventType,
    severity,
    entities: { ports: [], countries: [], chokepoints: [] },
    nearestChokepoint: null,
    region: 'unknown',
    supplyChainRelevance: relevance,
    estimatedDuration: 'days',
    confidence: 0.15,
    _source: 'keyword_fallback',
  };
}

export async function classifyEvent(headline, description) {
  const cacheKey = hashHeadlineKey(headline, description);
  const cached = CLASSIFY_CACHE.get(cacheKey);
  if (cached && cached._source !== 'keyword_fallback') return cached;

  const fallback = keywordClassifierFallback(headline, description);
  const cfg = getLLMConfig();
  if (!cfg.baseUrl || !cfg.classifyModel) {
    llmMemory.push('user', `classify (fallback): ${headline}`, 'classify');
    llmMemory.push('assistant', 'keyword fallback returned because LLM config is missing', 'classify');
    return fallback;
  }

  const sessionCtx = llmMemory.getSummary();
  const promptText = `You are a supply chain intelligence classification engine.
Given the following event, extract structured fields.
Return ONLY valid JSON, no preamble, no markdown fences.
Fields:
- "eventType": string (cyclone|conflict|strike|earthquake|sanctions|blockage|other)
- "severity": float 0.0-1.0
- "entities": object { "ports": string[], "countries": string[], "chokepoints": string[] }
- "nearestChokepoint": string or null
- "region": string
- "supplyChainRelevance": float 0.0-1.0
- "estimatedDuration": string (hours|days|weeks|months)
- "confidence": float 0.0-1.0

Event:
Headline: ${headline}
Description: ${description}`;

  const messages = [{ role: 'user', content: `${promptText}${sessionCtx}` }];
  const response = await requestLLMJSON({
    baseUrl: cfg.baseUrl,
    apiKey: cfg.apiKey,
    model: cfg.classifyModel,
    messages,
    temperature: 0.1,
    maxTokens: 400,
    timeoutMs: 10000,
    retries: 2,
    cacheKey: buildPromptHash(`${cacheKey}|${cfg.classifyModel}`),
    fallback,
  });

  if (!response.ok || !response.data) {
    llmMemory.push('user', `classify (fallback): ${headline}`, 'classify');
    llmMemory.push('assistant', `keyword fallback returned: ${response.reason || 'unknown'}`, 'classify');
    return fallback;
  }

  const parsed = { ...response.data, _source: 'llm_classify' };
  llmMemory.push('user', `classify: ${headline}`, 'classify');
  llmMemory.push('assistant', `type:${parsed.eventType} sev:${parsed.severity}`, 'classify');

  if (CLASSIFY_CACHE.size >= CLASSIFY_CACHE_MAX) {
    CLASSIFY_CACHE.delete(CLASSIFY_CACHE.keys().next().value);
  }
  CLASSIFY_CACHE.set(cacheKey, parsed);
  return parsed;
}