import { safeParseAIJSON } from './aiUtils.js';
import { buildChatCompletionsUrl } from './openaiCompat.js';

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
  
  return {
    eventType,
    severity,
    entities: { ports: [], countries: [], chokepoints: [] },
    nearestChokepoint: null,
    region: 'unknown',
    supplyChainRelevance: 0.8,
    estimatedDuration: 'days',
    confidence: 0.3
  };
}

export async function classifyEvent(headline, description) {
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
    const model = import.meta.env.VITE_GEMMA_MODEL || 'gemma4:e4b';
    if (!url) {
        throw new Error("VITE_GEMMA_URL no defined");
    }
    const apiUrl = buildChatCompletionsUrl(url);
    const response = await fetch(apiUrl, {
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
    
    return safeParseAIJSON(rawText, keywordClassifierFallback(headline, description));
  } catch (e) {
    console.warn('[ChainFlowX] gemmaAI offline or failed. Using fallback:', e);
    return keywordClassifierFallback(headline, description);
  }
}
