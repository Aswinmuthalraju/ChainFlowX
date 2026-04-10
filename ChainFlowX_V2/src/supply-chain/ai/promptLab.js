import { safeParseAIJSON } from './aiUtils.js';

const GEMMA_URL = import.meta.env?.VITE_GEMMA_URL || 'http://localhost:11434';

const TEST_SUITE = [
  {
    headline: 'Typhoon Mawar threatens Malacca Strait shipping lanes',
    description: 'Category 4 typhoon tracking directly over key Southeast Asian shipping corridor',
    expected: { eventType: 'cyclone', severity: [0.7, 1.0] },
  },
  {
    headline: 'Houthi forces attack container vessel in Red Sea',
    description: 'Armed drone strike on Maersk vessel near Bab el-Mandeb strait',
    expected: { eventType: 'conflict', severity: [0.7, 1.0] },
  },
  {
    headline: 'ILWU dockworkers authorize strike at Los Angeles port',
    description: 'Labor union vote authorizes work stoppage at West Coast ports',
    expected: { eventType: 'strike', severity: [0.5, 0.85] },
  },
  {
    headline: 'M7.2 earthquake strikes near Osaka affecting Toyota plants',
    description: 'Significant seismic event disrupts automotive supply chain in Japan',
    expected: { eventType: 'earthquake', severity: [0.6, 0.9] },
  },
  {
    headline: 'US imposes new export controls on semiconductor equipment to China',
    description: 'Commerce Department announces sweeping new chip technology restrictions',
    expected: { eventType: 'sanctions', severity: [0.6, 0.9] },
  },
  {
    headline: 'Ever Given-class vessel runs aground in Suez Canal',
    description: 'Container ship blocks transit in both directions, 200+ ships queuing',
    expected: { eventType: 'blockage', severity: [0.8, 1.0] },
  },
];

const scoreResult = (result, expected) => {
  let score = 0;
  if (result?.eventType === expected.eventType) score += 60;
  const sev = result?.severity ?? 0;
  if (sev >= expected.severity[0] && sev <= expected.severity[1]) score += 40;
  return score;
};

const runVariant = async (systemPrompt, variantName) => {
  console.log(`\n[promptLab] Running variant: ${variantName}`);
  let totalScore = 0;
  const results = [];

  for (const tc of TEST_SUITE) {
    try {
      const res = await fetch(`${GEMMA_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma4:e4b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Headline: ${tc.headline}\nDescription: ${tc.description}` },
          ],
          temperature: 0.1,
          max_tokens: 300,
        }),
      });

      if (res.status === 204 || !res.ok) {
        results.push({ tc: tc.headline.slice(0, 40), score: 0, reason: `HTTP ${res.status}` });
        continue;
      }

      const data = await res.json();
      const rawText = data?.choices?.[0]?.message?.content || '';
      const parsed = safeParseAIJSON(rawText, null);
      const score = parsed ? scoreResult(parsed, tc.expected) : 0;

      totalScore += score;
      results.push({
        tc: tc.headline.slice(0, 40),
        score,
        got: parsed?.eventType,
        expected: tc.expected.eventType,
        severity: parsed?.severity,
      });

      console.log(`  [${score}/100] ${tc.expected.eventType} → ${parsed?.eventType ?? 'null'}`);
    } catch (err) {
      results.push({ tc: tc.headline.slice(0, 40), score: 0, reason: err.message });
    }
  }

  const avgScore = totalScore / TEST_SUITE.length;
  console.log(`\n[promptLab] ${variantName}: avg score ${avgScore.toFixed(1)}/100`);
  return { variantName, avgScore, results };
};

const PROMPT_VARIANTS = {
  baseline: `Classify this supply chain event. Respond ONLY with valid JSON, no preamble, no markdown:
{
  "eventType": "cyclone|conflict|strike|earthquake|sanctions|blockage|other",
  "severity": 0.0-1.0,
  "entities": { "ports": [], "countries": [], "chokepoints": [] },
  "nearestChokepoint": "string or null",
  "region": "string",
  "supplyChainRelevance": 0.0-1.0,
  "estimatedDuration": "hours|days|weeks|months",
  "confidence": 0.0-1.0
}`,
  withExamples: `You are a supply chain risk classifier. Classify the event using ONLY these types:
- cyclone: tropical storms, typhoons, hurricanes affecting shipping
- conflict: military action, attacks, geopolitical tension on trade routes
- strike: labor disputes, port lockouts, worker stoppages
- earthquake: seismic events affecting ports or infrastructure
- sanctions: export controls, embargoes, trade restrictions
- blockage: physical obstruction of waterways or ports
- other: anything not clearly matching above

Severity: 0.0 (minor) to 1.0 (catastrophic). Be conservative — only use 0.9+ for truly catastrophic events.

Respond ONLY with this JSON structure, no preamble:
{
  "eventType": "cyclone|conflict|strike|earthquake|sanctions|blockage|other",
  "severity": 0.0-1.0,
  "entities": { "ports": [], "countries": [], "chokepoints": [] },
  "nearestChokepoint": "string or null",
  "region": "string",
  "supplyChainRelevance": 0.0-1.0,
  "estimatedDuration": "hours|days|weeks|months",
  "confidence": 0.0-1.0
}`,
  chainOfThought: `Classify this supply chain disruption event.

Think step by step internally, then output ONLY the JSON result — no reasoning text in your response.

Classification rules:
1. Event type: choose the PRIMARY physical mechanism (not the consequence)
2. Severity: 0.0-1.0 where 0.3=minor local, 0.6=significant regional, 0.85=major global, 1.0=catastrophic
3. Supply chain relevance: how directly does this affect shipping/logistics? 0=unrelated, 1=direct blockage
4. Confidence: how certain are you from the text alone?

Output ONLY valid JSON:
{
  "eventType": "cyclone|conflict|strike|earthquake|sanctions|blockage|other",
  "severity": 0.0-1.0,
  "entities": { "ports": [], "countries": [], "chokepoints": [] },
  "nearestChokepoint": "string or null",
  "region": "string",
  "supplyChainRelevance": 0.0-1.0,
  "estimatedDuration": "hours|days|weeks|months",
  "confidence": 0.0-1.0
}`,
};

export const runPromptLab = async () => {
  console.log('[promptLab] Starting autoresearch-style prompt optimization...');
  console.log(`[promptLab] ${TEST_SUITE.length} test cases, ${Object.keys(PROMPT_VARIANTS).length} variants\n`);

  const allResults = [];
  for (const [name, prompt] of Object.entries(PROMPT_VARIANTS)) {
    const result = await runVariant(prompt, name);
    allResults.push(result);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  allResults.sort((a, b) => b.avgScore - a.avgScore);
  const winner = allResults[0];

  console.log('\n══════════════════════════════════════════');
  console.log(`[promptLab] WINNER: ${winner.variantName} (${winner.avgScore.toFixed(1)}/100)`);
  console.log('══════════════════════════════════════════');
  allResults.forEach((r) => console.log(`  ${r.variantName}: ${r.avgScore.toFixed(1)}/100`));

  return {
    winner: winner.variantName,
    winningScore: winner.avgScore,
    winningPrompt: PROMPT_VARIANTS[winner.variantName],
    allResults,
  };
};