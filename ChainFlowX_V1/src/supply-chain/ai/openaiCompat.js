export function normalizeOpenAIBaseUrl(baseUrl) {
  const trimmed = String(baseUrl ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

export function buildChatCompletionsUrl(baseUrl) {
  const normalizedBaseUrl = normalizeOpenAIBaseUrl(baseUrl);
  if (!normalizedBaseUrl) return '';

  return `${normalizedBaseUrl}/chat/completions`;
}