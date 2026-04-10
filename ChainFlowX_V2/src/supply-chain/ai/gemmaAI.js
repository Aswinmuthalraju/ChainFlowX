import { safeParseAIJSON } from './aiUtils.js';
import { llmMemory } from './llmMemory.js';

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

function normalizeUrl(base) {
  const t = String(base ?? '').trim().replace(/\/+$/, '');
  return t.endsWith('/v1') ? t : `${t}/v1`;
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
    eventType, severity,
    entities: { ports: [], countries: [], chokepoints: [] },
    nearestChokepoint: null, region: 'unknown',
    supplyChainRelevance: relevance, estimatedDuration: 'days', confidence: 0.15,
    _source: 'keyword_fallback',
  };
}

export async function classifyEvent(headline, description) {
  const cacheKey = hashHeadlineKey(headline, description);
  const cached = CLASSIFY_CACHE.get(cacheKey);
  if (cached && cached._source !== 'keyword_fallback') return cached;

  const gemmaUrl = import.meta.env.VITE_GEMMA_URL;
  if (!gemmaUrl) {
    console.warn('[ChainFlowX Gemma] VITE_GEMMA_URL not set — using keyword fallback. Set it in .env to enable AI classification.');
    llmMemory.push('user', `classify (fallback): ${headline}`, 'gemma');
    llmMemory.push('assistant', 'keyword fallback returned because VITE_GEMMA_URL is missing', 'gemma');
    return keywordClassifierFallback(headline, description);
  }

  const apiUrl = `${normalizeUrl(gemmaUrl)}/chat/completions`;
  const model = import.meta.env.VITE_GEMMA_MODEL || 'gemma4:e4b';
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

  try {
    console.log(`[ChainFlowX Gemma] Calling ${model} at ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: `${promptText}${sessionCtx}` }],
        temperature: 0.1,
        max_tokens: 400,
      }),
    });

    if (response.status === 204) {
      console.debug('[ChainFlowX] Gemma 204 No Content — using keyword fallback');
      llmMemory.push('user', `classify (fallback): ${headline}`, 'gemma');
      llmMemory.push('assistant', 'keyword fallback returned after HTTP 204', 'gemma');
      return keywordClassifierFallback(headline, description);
    }
    if (!response.ok) {
      console.warn(`[ChainFlowX] Gemma HTTP ${response.status} — using keyword fallback`);
      llmMemory.push('user', `classify (fallback): ${headline}`, 'gemma');
      llmMemory.push('assistant', `keyword fallback returned after HTTP ${response.status}`, 'gemma');
      return keywordClassifierFallback(headline, description);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const parsed = safeParseAIJSON(rawText, keywordClassifierFallback(headline, description));

    if (!parsed) {
      console.warn('[ChainFlowX Gemma] JSON parse failed — using keyword fallback');
      llmMemory.push('user', `classify (fallback): ${headline}`, 'gemma');
      llmMemory.push('assistant', 'keyword fallback returned after parse failure', 'gemma');
      return keywordClassifierFallback(headline, description);
    }

    parsed._source = 'gemma_llm';
    console.log(`[ChainFlowX Gemma] ✅ classified as "${parsed.eventType}" (confidence ${parsed.confidence})`);
    llmMemory.push('user', `classify: ${headline}`, 'gemma');
    llmMemory.push('assistant', `type:${parsed.eventType} sev:${parsed.severity}`, 'gemma');

    if (CLASSIFY_CACHE.size >= CLASSIFY_CACHE_MAX) {
      CLASSIFY_CACHE.delete(CLASSIFY_CACHE.keys().next().value);
    }
    CLASSIFY_CACHE.set(cacheKey, parsed);
    return parsed;

  } catch (e) {
    console.warn('[ChainFlowX Gemma] ❌ LLM call failed:', e.message, '— using keyword fallback. Check ngrok tunnel A.');
    llmMemory.push('user', `classify (fallback): ${headline}`, 'gemma');
    llmMemory.push('assistant', 'keyword fallback returned after exception', 'gemma');
    return keywordClassifierFallback(headline, description);
  }
}
