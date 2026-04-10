import { safeParseAIJSON } from './aiUtils.js';
import { llmMemory } from './llmMemory.js';

function normalizeUrl(base) {
  const t = String(base ?? '').trim().replace(/\/+$/, '');
  return t.endsWith('/v1') ? t : `${t}/v1`;
}

export function templateSynthesisFallback(eventState) {
  const { classified, rippleScore, dnaMatch, altRoutes } = eventState;
  const score = parseFloat(rippleScore?.score) || 0;
  let urgency = 'MODERATE';
  if (score >= 8) urgency = 'IMMEDIATE';
  else if (score >= 6) urgency = 'HIGH';

  const topAlt = altRoutes && Object.values(altRoutes)[0];
  const costImpact = topAlt
    ? `+$${topAlt.costDelta}/container (+/- 15% confidence interval)`
    : '$500–$800/container (estimated)';
  const reroute = topAlt
    ? topAlt.summary
    : 'Evaluate alternative routing based on real-time vessel positions.';

  const d1 = dnaMatch?.[0]?.outcomes?.[0]?.event || 'Initial disruption impact propagates across primary routes';
  const d3 = dnaMatch?.[0]?.outcomes?.[1]?.event || 'Secondary congestion emerges at alternative hub ports';
  const d7 = dnaMatch?.[0]?.outcomes?.[2]?.event || 'Extended cascade effects reach downstream manufacturers';

  return {
    strategicAnalysis: `${classified?.eventType?.toUpperCase() || 'DISRUPTION'} event detected with severity ${(classified?.severity ?? 0).toFixed(2)}. Ripple Score ${rippleScore?.score}/10 (${rippleScore?.label}) indicates cascade across ${rippleScore?.derivation?.inputs?.cascadeDepth || 0} network hops. Pattern matches ${dnaMatch?.[0]?.name || 'historical baseline'} at ${dnaMatch?.[0]?.similarity || 0}% similarity.`,
    forecast: { day1: d1, day3: d3, day7: d7 },
    reroutingAdvice: reroute,
    costImpact,
    urgency,
    alternativeRoutes: topAlt ? [{
      route: topAlt.recommended,
      delayDays: topAlt.delayDays,
      costDelta: topAlt.costDelta,
      congestionNote: topAlt.congestionNote || null,
    }] : [],
    _source: 'template_fallback',
  };
}

export async function synthesizeStrategicInsight(eventState) {
  const qwenUrl = import.meta.env.VITE_QWEN_URL;
  if (!qwenUrl) {
    console.warn('[ChainFlowX Qwen] VITE_QWEN_URL not set — using template fallback. Set it in .env to enable AI synthesis.');
    llmMemory.push('user', `strategic (fallback): ${eventState?.classified?.eventType || 'unknown'} ripple:${eventState?.rippleScore?.score ?? 0}`, 'qwen');
    llmMemory.push('assistant', 'template fallback returned because VITE_QWEN_URL is missing', 'qwen');
    return templateSynthesisFallback(eventState);
  }

  const apiUrl = `${normalizeUrl(qwenUrl)}/chat/completions`;
  const model = import.meta.env.VITE_QWEN_MODEL || 'qwen3:8b';

  const { classified, rippleScore, dnaMatch, altRoutes, industryCascade, cascadeAlerts, affectedRoutes } = eventState || {};
  const allAlts = Object.values(altRoutes || {});
  const memoryContext = llmMemory.getContext(4);

  const promptText = `You are a supply chain strategic intelligence analyst. Your job is to deliver ACTIONABLE decisions — not summaries.
The operator is looking at a live disruption RIGHT NOW. They need to know: what to do, which routes to switch to, how much it costs, and what happens if they wait.

Return ONLY valid JSON, no preamble, no markdown fences, no <think> blocks.

Schema:
{
  "strategicAnalysis": "3 sentences: what happened, why it matters, what the window for action is",
  "forecast": {
    "day1": "specific operational impact in first 24 hours",
    "day3": "freight/port impact at 72 hours with estimated numbers",
    "day7": "downstream manufacturing/inventory impact at 7 days"
  },
  "reroutingAdvice": "specific route name, estimated extra days, estimated cost per container — be exact",
  "alternativeRoutes": [
    { "route": "route name", "delayDays": number, "costDelta": number, "viability": "HIGH|MEDIUM|LOW", "note": "why this is recommended or not" }
  ],
  "costImpact": "$/container with confidence interval and what drives the range",
  "urgency": "IMMEDIATE|HIGH|MODERATE",
  "actionItems": [
    "Specific action 1 — who does it, by when",
    "Specific action 2",
    "Specific action 3"
  ]
}

LIVE DISRUPTION INTELLIGENCE BRIEFING:

Event: ${classified?.eventType?.toUpperCase()} | Severity: ${(classified?.severity ?? 0).toFixed(2)}/1.0 | Region: ${classified?.region}
Chokepoint affected: ${classified?.nearestChokepoint || 'unknown'}
AI confidence: ${(classified?.confidence ?? 0).toFixed(2)}

Ripple Score: ${rippleScore?.score}/10 (${rippleScore?.label})
Cascade depth: ${rippleScore?.derivation?.inputs?.cascadeDepth ?? 0} network hops
Trade volume at risk: $${rippleScore?.derivation?.inputs?.tradeVolumeM ?? 0}M/day
Port absorption remaining: ${(((rippleScore?.derivation?.inputs?.portAbsorption ?? 0.7)) * 100).toFixed(0)}%
Time to alternative routing: ${rippleScore?.derivation?.inputs?.timeToAlternativeDays ?? 0} days

Historical DNA match: ${dnaMatch?.[0]?.similarity ?? 0}% similarity to "${dnaMatch?.[0]?.name || 'none'}"
Historical freight impact: ${dnaMatch?.[0]?.freightRateImpact || 'N/A'}
Historical trade volume impact: ${dnaMatch?.[0]?.tradeVolumeImpact || 'N/A'}
What happened historically at D+1: ${dnaMatch?.[0]?.outcomes?.[0]?.event || 'N/A'}
What happened historically at D+3: ${dnaMatch?.[0]?.outcomes?.[1]?.event || 'N/A'}
What happened historically at D+7: ${dnaMatch?.[0]?.outcomes?.[2]?.event || 'N/A'}

Available alternative routes (ranked by computed cost):
${allAlts.length > 0
  ? allAlts.map((a, i) => `  ${i + 1}. ${a.recommended} — +${a.delayDays} days, +$${a.costDelta}/container${a.congestionNote ? ' ⚠ ' + a.congestionNote : ''}`).join('\n')
  : '  No alternatives pre-computed — recommend emergency assessment'}

Industries now at risk:
${(industryCascade || []).length > 0
  ? (industryCascade || []).map(i => `  - ${i.sector}: ${i.companies?.join(', ')} — exposure in ${i.daysToRisk} days`).join('\n')
  : '  None flagged at current cascade depth'}

Active cascade alerts: ${cascadeAlerts?.[0]?.message || 'none'}
Total affected routes: ${affectedRoutes?.length || 0}

Based on this data, provide the strategic decision briefing. Be specific. Use the numbers above.`;

  try {
    console.log(`[ChainFlowX Qwen] Calling ${model} at ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [...memoryContext, { role: 'user', content: promptText }],
        temperature: 0.3,
        max_tokens: 900,
        options: { think: true },
      }),
    });

    if (response.status === 204) {
      console.debug('[ChainFlowX] Qwen 204 No Content — using template fallback');
      llmMemory.push('user', `strategic (fallback): ${classified?.eventType || 'unknown'} ripple:${rippleScore?.score ?? 0}`, 'qwen');
      llmMemory.push('assistant', 'template fallback returned after HTTP 204', 'qwen');
      return templateSynthesisFallback(eventState);
    }
    if (!response.ok) {
      console.warn(`[ChainFlowX] Qwen HTTP ${response.status} — using template fallback`);
      llmMemory.push('user', `strategic (fallback): ${classified?.eventType || 'unknown'} ripple:${rippleScore?.score ?? 0}`, 'qwen');
      llmMemory.push('assistant', `template fallback returned after HTTP ${response.status}`, 'qwen');
      return templateSynthesisFallback(eventState);
    }

    const data = await response.json();
    const rawText = (data.choices?.[0]?.message?.content || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .trim();

    const result = safeParseAIJSON(rawText, templateSynthesisFallback(eventState));

    if (!result) {
      console.warn('[ChainFlowX Qwen] JSON parse failed — using template fallback');
      llmMemory.push('user', `strategic (fallback): ${classified?.eventType || 'unknown'} ripple:${rippleScore?.score ?? 0}`, 'qwen');
      llmMemory.push('assistant', 'template fallback returned after parse failure', 'qwen');
      return templateSynthesisFallback(eventState);
    }

    result._source = 'qwen_llm';
    console.log(`[ChainFlowX Qwen] ✅ Strategic insight generated (urgency: ${result.urgency})`);
    llmMemory.push('user', `strategic: ${classified?.eventType || 'unknown'} ripple:${rippleScore?.score ?? 0}`, 'qwen');
    llmMemory.push('assistant', result?.strategicAnalysis?.slice(0, 200) || 'synthesis complete', 'qwen');
    return result;

  } catch (e) {
    console.warn('[ChainFlowX Qwen] ❌ LLM call failed:', e.message, '— using template fallback. Check ngrok tunnel B.');
    llmMemory.push('user', `strategic (fallback): ${classified?.eventType || 'unknown'} ripple:${rippleScore?.score ?? 0}`, 'qwen');
    llmMemory.push('assistant', 'template fallback returned after exception', 'qwen');
    return templateSynthesisFallback(eventState);
  }
}
