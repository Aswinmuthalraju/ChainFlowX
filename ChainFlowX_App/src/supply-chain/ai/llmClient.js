import { safeParseAIJSON } from './aiUtils.js';

const RESPONSE_CACHE = new Map();
const RESPONSE_CACHE_MAX = 300;

function toFNV1a(input) {
  const s = String(input ?? '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function normalizeBaseUrl(base) {
  const t = String(base ?? '').trim().replace(/\/+$/, '');
  if (!t) return '';
  return t.endsWith('/v1') ? t : `${t}/v1`;
}

function stripThinkBlocks(text) {
  return String(text ?? '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function shouldRetry(status) {
  return [408, 425, 429, 500, 502, 503, 504].includes(status);
}

function pushCache(cacheKey, value) {
  if (!cacheKey) return;
  if (RESPONSE_CACHE.size >= RESPONSE_CACHE_MAX) {
    RESPONSE_CACHE.delete(RESPONSE_CACHE.keys().next().value);
  }
  RESPONSE_CACHE.set(cacheKey, value);
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export function getLLMConfig() {
  return {
    baseUrl: normalizeBaseUrl(import.meta.env.VITE_LLM_BASE_URL),
    apiKey: String(import.meta.env.VITE_LLM_API_KEY || '').trim(),
    classifyModel: String(import.meta.env.VITE_LLM_CLASSIFY_MODEL || '').trim(),
    synthesizeModel: String(import.meta.env.VITE_LLM_SYNTHESIZE_MODEL || '').trim(),
  };
}

export function buildPromptHash(input) {
  return toFNV1a(input);
}

export async function requestLLMJSON({
  baseUrl,
  apiKey,
  model,
  messages,
  temperature = 0.2,
  maxTokens = 800,
  timeoutMs = 12000,
  retries = 2,
  cacheKey = null,
  fallback = null,
  extraBody = {},
}) {
  if (!baseUrl || !model) {
    return { ok: false, reason: 'missing_config', data: fallback };
  }

  const effectiveKey = cacheKey || buildPromptHash(`${model}|${JSON.stringify(messages)}`);
  if (RESPONSE_CACHE.has(effectiveKey)) {
    return { ok: true, data: RESPONSE_CACHE.get(effectiveKey), fromCache: true };
  }

  const url = `${baseUrl}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };

  let lastStatus = null;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' },
            ...extraBody,
          }),
        },
        timeoutMs,
      );

      lastStatus = res.status;
      if (res.status === 204) {
        return { ok: false, status: 204, reason: 'empty_response', data: fallback };
      }

      if (!res.ok) {
        if (attempt < retries && shouldRetry(res.status)) {
          await wait(250 * (2 ** attempt));
          continue;
        }
        return { ok: false, status: res.status, reason: 'http_error', data: fallback };
      }

      const json = await res.json();
      const raw = stripThinkBlocks(json?.choices?.[0]?.message?.content || '');
      const parsed = safeParseAIJSON(raw, null);
      if (!parsed) {
        return { ok: false, status: res.status, reason: 'parse_error', data: fallback };
      }

      pushCache(effectiveKey, parsed);
      return { ok: true, status: res.status, data: parsed };
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await wait(250 * (2 ** attempt));
        continue;
      }
    }
  }

  return {
    ok: false,
    status: lastStatus,
    reason: 'network_error',
    error: lastError,
    data: fallback,
  };
}