import { safeParseAIJSON } from './aiUtils.js';
import { buildChatCompletionsUrl } from './openaiCompat.js';

export function templateSynthesisFallback(eventState) {
  const { classified, rippleScore, dnaMatch, altRoutes } = eventState;
  
  const score = rippleScore?.raw || 0;
  let urgency = 'MODERATE';
  if (score >= 8) urgency = 'IMMEDIATE';
  else if (score >= 6) urgency = 'HIGH';

  let costImpact = '$500-$800/container';
  let reroute = 'Consider standard alternative routings listed in available models.';
  const topAlt = altRoutes && Object.values(altRoutes)[0];
  if (topAlt) {
    costImpact = `$${topAlt.costDelta}/container estimate (+/- 10%)`;
    reroute = topAlt.summary;
  }

  const d1 = dnaMatch?.[0]?.outcomes?.[0]?.event || 'Initial impact wave propagates';
  const d3 = dnaMatch?.[0]?.outcomes?.[1]?.event || 'Secondary disruptions emerge in network';
  const d7 = dnaMatch?.[0]?.outcomes?.[2]?.event || 'Extended cascade effects realized globally';

  return {
    strategicAnalysis: `Event classification ${classified?.eventType.toUpperCase() || 'UNKNOWN'} triggered. The current situational profile maps closely to the ${dnaMatch?.[0]?.name || 'historical baseline'} pattern. Network resilience parameters indicate structural strain.`,
    forecast: { day1: d1, day3: d3, day7: d7 },
    reroutingAdvice: reroute,
    costImpact,
    urgency
  };
}

export async function synthesizeStrategicInsight(eventState) {
  const promptText = `
You are the Qwen3 Strategic Synthesizer for a Supply Chain Intelligence Platform.
Synthesize a concise executive readout based on the following event state.
Return ONLY valid JSON.
Schema:
{
  "strategicAnalysis": "2-3 sentences",
  "forecast": { "day1": "string", "day3": "string", "day7": "string" },
  "reroutingAdvice": "specific route recommendation",
  "costImpact": "$/container estimate with confidence interval",
  "urgency": "IMMEDIATE|HIGH|MODERATE"
}

Event State Context:
Classification: ${JSON.stringify(eventState?.classified)}
Top DNA Match: ${JSON.stringify(eventState?.dnaMatch?.[0])}
Ripple Score: ${eventState?.rippleScore?.score} (${eventState?.rippleScore?.label})
Affected Routes: ${eventState?.affectedRoutes?.length || 0}
Top Alert: ${eventState?.cascadeAlerts?.[0]?.message || 'None'}
`;

  try {
    const url = import.meta.env.VITE_QWEN_URL;
    const model = import.meta.env.VITE_QWEN_MODEL || 'qwen3:8b';
    if (!url) {
        throw new Error("VITE_QWEN_URL no defined");
    }
    const apiUrl = buildChatCompletionsUrl(url);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.3,
        max_tokens: 600
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const rawText = (data.choices?.[0]?.message?.content || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .trim();

    const result = safeParseAIJSON(rawText, null);
    if (!result) {
        return templateSynthesisFallback(eventState);
    }
    return result;
  } catch (e) {
    console.warn('[ChainFlowX] qwenAI offline or failed. Using fallback:', e);
    return templateSynthesisFallback(eventState);
  }
}
