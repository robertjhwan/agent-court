# WunderGraph Cosmo Setup for Agent Court

## Quick Start (Simplified for Hackathon)

For the hackathon demo, we're using a **mock federated approach** without running the full Cosmo router. This lets us demonstrate the WunderGraph value proposition (unified API, fewer calls, policy enforcement) without Docker complexity during the 1-day build.

### Mock Implementation

The WunderGraph agent in `lib/agents/agent-runners.ts` simulates calling a federated MCP endpoint:

```typescript
{
  tool: 'wundergraph_mcp_search_refundable_flights',
  input: { from: 'SFO', to: 'JFK', date: 'next Friday' },
  output: {
    flights: [...],  // Combines flights + policy in one call
    policy: {...}
  },
  cost: 0.015  // Lower than scattered REST calls
}
```

This demonstrates:
- **Federation**: One query fans out to flights + policy subgraphs
- **MCP integration**: Tool is auto-discovered via MCP Gateway
- **Cost efficiency**: 0.015 vs 3x 0.04 for baseline
- **Policy enforcement**: Policy data is co-located with results

### For Production Demo

If time permits, run the real Cosmo Router:

```bash
cd services/wg
docker-compose up
```

Then update `agent-runners.ts` to call `http://localhost:4000/graphql` instead of mock data.

### Subgraph Schemas

See `subgraphs/mock-subgraphs.ts` for the TypeScript schema definitions used in the mock.

### Pitch Points for WunderGraph Track

1. **"The agent that used WunderGraph stayed under budget"**
2. **"One federated query replaced three scattered API calls"**
3. **"MCP Gateway made WunderGraph auto-discoverable to the agent"**
4. **"Policy enforcement was baked into the graph, not bolted on"**
5. **"The courtroom metaphor makes GraphQL federation visible to non-engineers"**

The demo proves that agents need unified API layers to avoid "going into debt."
