export function safeParseAIJSON(rawText, fallback) {
  if (!rawText) return fallback;
  
  // Strategy 1: Attempt to strip markdown fences
  let cleanText = rawText.replace(/```json\n/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleanText);
  } catch (e1) {
    // Strategy 2: Extract first {...}
    try {
      const match = rawText.match(/\{[\s\S]*?\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e2) {
      // Strategy 3: Heuristics - single quotes to double quotes, trailing commas
      try {
        const strictText = cleanText
          .replace(/'/g, '"')
          .replace(/,\s*([\}\]])/g, '$1');
        return JSON.parse(strictText);
      } catch (e3) {
        console.warn('[ChainFlowX] AI JSON Parse Failed. All strategies exhausted. Using fallback.', {rawText, e: e3});
        return fallback;
      }
    }
  }
  return fallback;
}
