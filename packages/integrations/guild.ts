const GUILD_API_KEY = process.env.GUILD_API_KEY || '';

export type GuildSpan = {
  id: string;
  traceId: string;
  name: string;
  startTime: string;
  endTime?: string;
  attributes: Record<string, any>;
  events: GuildEvent[];
};

export type GuildEvent = {
  name: string;
  timestamp: string;
  attributes: Record<string, any>;
};

export type GuildTrace = {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  spans: GuildSpan[];
  cost: number;
  metadata: Record<string, any>;
};

class GuildClient {
  private traces: Map<string, GuildTrace> = new Map();
  private useRealAPI: boolean;

  constructor() {
    this.useRealAPI = !!GUILD_API_KEY;
    if (!this.useRealAPI) {
      console.warn('Guild.ai: No API key found, using local JSONL fallback');
    }
  }

  async startTrace(name: string, metadata?: Record<string, any>): Promise<string> {
    const traceId = `guild-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const trace: GuildTrace = {
      id: traceId,
      name,
      startTime: new Date().toISOString(),
      spans: [],
      cost: 0,
      metadata: metadata || {},
    };

    this.traces.set(traceId, trace);

    if (this.useRealAPI) {
      // TODO: Send to real Guild.ai API
    }

    return traceId;
  }

  async logSpan(
    traceId: string,
    name: string,
    attributes: Record<string, any>,
    cost: number
  ): Promise<string> {
    const trace = this.traces.get(traceId);
    if (!trace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    const spanId = `span-${trace.spans.length + 1}`;
    
    const span: GuildSpan = {
      id: spanId,
      traceId,
      name,
      startTime: new Date().toISOString(),
      attributes,
      events: [],
    };

    trace.spans.push(span);
    trace.cost += cost;

    if (this.useRealAPI) {
      // TODO: Send to real Guild.ai API
    }

    return spanId;
  }

  async endTrace(traceId: string): Promise<void> {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return;
    }

    trace.endTime = new Date().toISOString();

    if (this.useRealAPI) {
      // TODO: Send to real Guild.ai API
    }

    // Write to local JSONL for persistence
    const jsonl = JSON.stringify(trace) + '\n';
    // TODO: Append to file
  }

  getTrace(traceId: string): GuildTrace | undefined {
    return this.traces.get(traceId);
  }

  getTraceSummary(traceId: string): string {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return 'Trace not found';
    }

    return `Trace ${traceId}: ${trace.spans.length} spans, $${trace.cost.toFixed(3)} total cost. 
Spans: ${trace.spans.map(s => `${s.name} (${s.id})`).join(', ')}`;
  }

  // Helper to generate exhibit references for prosecutor
  getSpanExhibitId(spanId: string): string {
    return `G-${spanId.split('-')[1]}`;
  }
}

export const guildClient = new GuildClient();
