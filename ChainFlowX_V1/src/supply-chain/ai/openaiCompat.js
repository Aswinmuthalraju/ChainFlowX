export function normalizeOpenAIBaseUrl(baseUrl) {
  const trimmed = String(baseUrl ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  if (/\/api\/generate$/i.test(trimmed)) {
    return trimmed.replace(/\/api\/generate$/i, '/v1');
  }

  if (/\/v1\/chat\/completions$/i.test(trimmed)) {
    return trimmed.replace(/\/v1\/chat\/completions$/i, '/v1');
  }

  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

export function buildChatCompletionsUrl(baseUrl) {
  const normalizedBaseUrl = normalizeOpenAIBaseUrl(baseUrl);
  if (!normalizedBaseUrl) return '';

  return `${normalizedBaseUrl}/chat/completions`;
}