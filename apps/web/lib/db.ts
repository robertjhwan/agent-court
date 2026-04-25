type Case = {
  id: string;
  task: string;
  status: string;
  verdict: string | null;
  sentence: string | null;
  createdAt: Date;
  agentRuns: AgentRun[];
  exhibits: Exhibit[];
  arguments: Argument[];
  juryVotes: JuryVote[];
};

type AgentRun = {
  id: string;
  caseId: string;
  variant: string;
  cost: number;
  budget: number;
  summary: string | null;
  guildTraceId: string | null;
  toolCalls: ToolCall[];
};

type ToolCall = {
  id: string;
  agentRunId: string;
  tool: string;
  input: string;
  output: string | null;
  cost: number;
  latencyMs: number;
  guildSpanId: string | null;
};

type Exhibit = {
  id: string;
  caseId: string;
  kind: string;
  sourceUrl: string | null;
  hash: string | null;
  payloadRef: string;
};

type Argument = {
  id: string;
  caseId: string;
  role: string;
  text: string;
  citedExhibitIds: string;
};

type JuryVote = {
  id: string;
  caseId: string;
  jurorId: number;
  rubric: string;
  scores: string;
  verdict: string;
  rationale: string;
};

// Use globalThis to persist across hot reloads
const globalForDb = globalThis as unknown as {
  cases: Map<string, Case> | undefined;
};

const cases: Map<string, Case> = globalForDb.cases ?? new Map();
if (!globalForDb.cases) {
  globalForDb.cases = cases;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export const db = {
  cases: {
    findMany: async () => {
      console.log('[DB] findMany - total cases:', cases.size);
      return Array.from(cases.values()).map(c => ({
        id: c.id,
        task: c.task,
        status: c.status,
        verdict: c.verdict,
        sentence: c.sentence,
        createdAt: c.createdAt.toISOString(),
      }));
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      console.log('[DB] findUnique - looking for:', where.id, '- exists:', cases.has(where.id));
      return cases.get(where.id) || null;
    },
    create: async ({ data }: { data: Omit<Case, 'id' | 'createdAt' | 'agentRuns' | 'exhibits' | 'arguments' | 'juryVotes'> }) => {
      const id = generateId();
      const newCase: Case = {
        ...data,
        id,
        createdAt: new Date(),
        agentRuns: [],
        exhibits: [],
        arguments: [],
        juryVotes: [],
      };
      cases.set(id, newCase);
      console.log('[DB] create - new case:', id, '- total cases:', cases.size);
      return newCase;
    },
    update: async ({ where, data }: { where: { id: string }, data: Partial<Case> }) => {
      const existing = cases.get(where.id);
      if (!existing) {
        throw new Error(`Case ${where.id} not found`);
      }
      const updated = { ...existing, ...data };
      cases.set(where.id, updated);
      console.log('[DB] update - case:', where.id);
      return updated;
    },
  },
};
