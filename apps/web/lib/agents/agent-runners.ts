export type ToolCall = {
  tool: string;
  input: any;
  output: any;
  cost: number;
  latencyMs: number;
};

export type AgentRunResult = {
  variant: 'BASELINE' | 'WUNDERGRAPH';
  summary: string;
  toolCalls: ToolCall[];
  totalCost: number;
  recommendation: string;
};

export async function runBaselineAgent(_task: string): Promise<AgentRunResult> {
  // Simulate a baseline agent that makes inefficient, scattered API calls.
  // Pacing is handled by the SSE route; this function returns instantly.
  
  const toolCalls: ToolCall[] = [
    {
      tool: 'fetch_flights_api',
      input: { from: 'SFO', to: 'JFK', date: 'next Friday' },
      output: { flights: ['UA123', 'DL456', 'AA789'] },
      cost: 0.08,
      latencyMs: 234,
    },
    {
      tool: 'fetch_flights_api', // Duplicate call
      input: { from: 'SFO', to: 'JFK', date: 'next Friday', refundable: true },
      output: { flights: ['UA123', 'AA789'] },
      cost: 0.08,
      latencyMs: 198,
    },
    {
      tool: 'check_policy_api',
      input: { user: 'default' },
      output: { maxPrice: 400, refundableRequired: true },
      cost: 0.08,
      latencyMs: 156,
    },
    {
      tool: 'fetch_flights_api', // Another duplicate
      input: { from: 'SFO', to: 'JFK', date: 'next Friday', maxPrice: 400 },
      output: { flights: ['UA123'] },
      cost: 0.08,
      latencyMs: 203,
    },
    {
      tool: 'fetch_price_details', // Additional wasteful call
      input: { flightId: 'UA123' },
      output: { price: 450, fees: 30 },
      cost: 0.08,
      latencyMs: 187,
    },
    {
      tool: 'tinyfish_browse',
      input: { url: 'https://united.com/flight/UA123' },
      output: { price: 450, refundable: true },
      cost: 0.15,
      latencyMs: 892,
    },
  ];

  const totalCost = toolCalls.reduce((sum, call) => sum + call.cost, 0);

  return {
    variant: 'BASELINE',
    summary: 'Baseline agent made 6 tool calls with 4 duplicate/wasteful fetches. Exceeded budget by 10%.',
    toolCalls,
    totalCost, // 0.55 - OVER budget!
    recommendation: 'Book UA123 for $450 (refundable)',
  };
}

export async function runWunderGraphAgent(_task: string): Promise<AgentRunResult> {
  // Simulate a WunderGraph-enabled agent that makes efficient, federated calls.
  // Pacing is handled by the SSE route.
  
  const toolCalls: ToolCall[] = [
    {
      tool: 'wundergraph_mcp_search_refundable_flights',
      input: { from: 'SFO', to: 'JFK', date: 'next Friday' },
      output: {
        flights: [
          { id: 'UA123', price: 380, refundable: true, policyCompliant: true },
          { id: 'AA789', price: 395, refundable: true, policyCompliant: true },
        ],
        policy: { maxPrice: 400, refundableRequired: true },
      },
      cost: 0.015, // Federated query, cheaper
      latencyMs: 167,
    },
    {
      tool: 'tinyfish_browse',
      input: { url: 'https://united.com/flight/UA123' },
      output: { price: 380, refundable: true, available: true },
      cost: 0.10,
      latencyMs: 834,
    },
  ];

  const totalCost = toolCalls.reduce((sum, call) => sum + call.cost, 0);

  return {
    variant: 'WUNDERGRAPH',
    summary: 'WunderGraph agent made 2 tool calls via MCP supergraph. No duplicates. Under budget.',
    toolCalls,
    totalCost, // 0.115 - well under budget!
    recommendation: 'Book UA123 for $380 (refundable, policy-compliant)',
  };
}
