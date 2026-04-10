const MAX_TURNS = 8;

class LLMMemory {
  constructor() {
    this._turns = [];
    this._sessionId = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this._eventCount = 0;
  }

  push(role, content, layer = 'system') {
    this._turns.push({ role, content: String(content ?? ''), layer, timestamp: Date.now() });
    if (this._turns.length > MAX_TURNS * 2) {
      this._turns = this._turns.slice(-MAX_TURNS * 2);
    }
    this._eventCount++;
  }

  getContext(maxTurns = MAX_TURNS) {
    return this._turns
      .slice(-maxTurns * 2)
      .map(({ role, content }) => ({ role, content }));
  }

  getSummary() {
    if (this._eventCount === 0) return '';
    const recent = this._turns.slice(-4);
    const lines = recent.map((turn) =>
      `[${turn.layer}/${turn.role}]: ${turn.content.slice(0, 120)}${turn.content.length > 120 ? '...' : ''}`,
    );
    return `\n\nSession context (${this._eventCount} events analyzed this session):\n${lines.join('\n')}`;
  }

  clear() {
    this._turns = [];
    this._eventCount = 0;
    console.info('[ChainFlowX] LLM memory cleared');
  }

  get eventCount() {
    return this._eventCount;
  }

  get sessionId() {
    return this._sessionId;
  }
}

export const llmMemory = new LLMMemory();