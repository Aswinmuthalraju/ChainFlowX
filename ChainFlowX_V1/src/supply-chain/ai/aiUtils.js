export const safeParseAIJSON = (rawText, fallback = null) => {
  if (!rawText || typeof rawText !== 'string') return fallback;
  try {
    const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(clean);
  } catch (_) {}
  try {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (_) {}
  try {
    const fixed = rawText
      .replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/'/g, '"');
    return JSON.parse(fixed);
  } catch (_) {}
  console.warn('[ChainFlowX] AI JSON parse failed:', rawText.slice(0, 200));
  return fallback;
};
