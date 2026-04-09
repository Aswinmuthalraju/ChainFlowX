import { buildChatCompletionsUrl } from './openaiCompat.js';
import { safeParseAIJSON } from './aiUtils.js';

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
  };
}

export async function classifyEvent(headline, description) {
  const cacheKey = hashHeadlineKey(headline, description);
  if (CLASSIFY_CACHE.has(cacheKey)) {
    return CLASSIFY_CACHE.get(cacheKey);
  }

  const promptText = `
You are a supply chain intelligence classification engine.
Given the following event, extract structured fields.
Return ONLY valid JSON.
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
Description: ${description}
`;

  try {
    const url = import.meta.env.VITE_GEMMA_URL;
    if (!url) {
        throw new Error("VITE_GEMMA_URL not defined — set it in .env");
    }
    const model = import.meta.env.VITE_GEMMA_MODEL || 'gemma4:e4b';
    const response = await fetch(buildChatCompletionsUrl(url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.1,
        max_tokens: 400
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";
    
    const parsed = safeParseAIJSON(rawText, keywordClassifierFallback(headline, description));
    if (CLASSIFY_CACHE.size >= CLASSIFY_CACHE_MAX) {
      const first = CLASSIFY_CACHE.keys().next().value;
      CLASSIFY_CACHE.delete(first);
    }
    CLASSIFY_CACHE.set(cacheKey, parsed);
    return parsed;
  } catch (e) {
    console.warn('[ChainFlowX] gemmaAI offline or failed. Using fallback:', e);
    const fb = keywordClassifierFallback(headline, description);
    if (CLASSIFY_CACHE.size >= CLASSIFY_CACHE_MAX) {
      const first = CLASSIFY_CACHE.keys().next().value;
      CLASSIFY_CACHE.delete(first);
    }
    CLASSIFY_CACHE.set(cacheKey, fb);
    return fb;
  }
}
