// Smoke test - run with: npx vitest run
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('LLM 204 guard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.assign(import.meta.env, {
      VITE_LLM_BASE_URL: 'http://localhost:11434',
      VITE_LLM_CLASSIFY_MODEL: 'llama3.1:8b',
    });
  });

  it('llmClassify returns fallback on 204, does not throw', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      json: () => { throw new Error('no body'); },
    });
    const { classifyEvent } = await import('../llmClassify.js');
    const result = await classifyEvent('Test headline', 'Test description');
    expect(result).toBeDefined();
    expect(result.eventType).toBeDefined();
    expect(result.confidence).toBeLessThan(1);
  });

  it('llmClassify returns fallback on 502 gateway error, does not throw', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 502, ok: false, json: vi.fn() });
    const { classifyEvent } = await import('../llmClassify.js');
    const result = await classifyEvent('ollama unreachable', '');
    expect(result).toBeDefined();
  });
});