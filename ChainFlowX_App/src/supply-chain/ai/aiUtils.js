export function safeParseAIJSON(rawText, fallback) {
  if (!rawText) return fallback;

  // Strategy 1: Strip markdown fences
  let cleanText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(cleanText);
  } catch (_) {}

  // Strategy 2: Extract outermost {...} — GREEDY match required for nested objects
  try {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (_) {}

  // Strategy 3: Fix trailing commas + single quotes
  try {
    const fixed = cleanText
      .replace(/,\s*([\}\]])/g, '$1')
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":');
    return JSON.parse(fixed);
  } catch (e) {
    console.warn('[ChainFlowX] AI JSON parse failed — all 3 strategies exhausted.', rawText.slice(0, 200));
    return fallback;
  }
}
