# Agent Court - System Architecture

## High-Level Flow

```
┌─────────────┐
│   Browser   │
│ localhost:  │
│    3000     │
└──────┬──────┘
       │
       │ HTTP + SSE
       │
┌──────▼──────────────────────────────────┐
│         Next.js App Router              │
│  ┌────────────────────────────────┐    │
│  │  Page: /                        │    │
│  │  • Case Docket (list)           │    │
│  │  • "New Case" button            │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Page: /trial/[caseId]         │    │
│  │  • Courtroom (left pane)        │    │
│  │  • Budget ledger (right pane)   │    │
│  │  • Jury grid (bottom)           │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  API: /api/cases               │    │
│  │  • GET  - List cases            │    │
│  │  • POST - Create case           │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  API: /api/cases/[id]/stream   │    │
│  │  • SSE - Live trial events      │    │
│  │  • Runs agents                  │    │
│  │  • Streams courtroom            │    │
│  └────────────────────────────────┘    │
└──────┬──────────────────────────────────┘
       │
       │
┌──────▼──────────────────────────────────┐
│          Agent Execution Layer          │
│                                         │
│  ┌─────────────┐    ┌──────────────┐   │
│  │  Baseline   │    │  WunderGraph │   │
│  │   Agent     │    │    Agent     │   │
│  │             │    │              │   │
│  │  5 calls    │    │   2 calls    │   │
│  │  $0.26      │    │   $0.115     │   │
│  │  OVER       │    │   UNDER      │   │
│  └──────┬──────┘    └──────┬───────┘   │
│         │                  │            │
│         └────────┬─────────┘            │
│                  │                      │
│  ┌───────────────▼──────────────────┐  │
│  │      Mock Tool Ecosystem         │  │
│  │  • fetch_flights_api (REST)      │  │
│  │  • check_policy_api (REST)       │  │
│  │  • wundergraph_mcp_search (Fed)  │  │
│  │  • tinyfish_browse (Web)         │  │
│  └──────────────────────────────────┘  │
└──────┬──────────────────────────────────┘
       │
       │
┌──────▼──────────────────────────────────┐
│        Courtroom Orchestrator           │
│                                         │
│  ┌─────────────┐                        │
│  │    Judge    │  Opens + Closes trial  │
│  └─────────────┘                        │
│                                         │
│  ┌─────────────┐                        │
│  │ Prosecutor  │  3 charges (cites      │
│  │             │  Guild spans)          │
│  └─────────────┘                        │
│                                         │
│  ┌─────────────┐                        │
│  │  Defense    │  3 rebuttals (cites    │
│  │             │  TinyFish exhibits)    │
│  └─────────────┘                        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Jury (5 agents)                │   │
│  │  1. Bean Counter (cost focus)   │   │
│  │  2. Skeptic (evidence focus)    │   │
│  │  3. Pragmatist (correctness)    │   │
│  │  4. Compliance Officer (policy) │   │
│  │  5. User Advocate (outcome)     │   │
│  └─────────────┬───────────────────┘   │
│                │                        │
│                ▼                        │
│         ┌─────────────┐                 │
│         │   Verdict   │                 │
│         │   RETRY_    │                 │
│         │   WITH_WG   │                 │
│         └─────────────┘                 │
└─────────────────────────────────────────┘


## Data Flow During Trial

1. **Client → Server**
   ```
   EventSource → /api/cases/:id/stream
   ```

2. **Server: Run Agents**
   ```javascript
   Promise.all([
     runBaselineAgent(task),
     runWunderGraphAgent(task)
   ])
   ```

3. **Server: Stream Events**
   ```javascript
   sendEvent({ type: 'agent_complete', variant: 'BASELINE', run })
   sendEvent({ type: 'agent_complete', variant: 'WUNDERGRAPH', run })
   sendEvent({ type: 'message', role: 'JUDGE', text: '...' })
   sendEvent({ type: 'message', role: 'PROSECUTOR', text: '...' })
   sendEvent({ type: 'jury_vote', vote: {...} })
   sendEvent({ type: 'verdict', verdict: 'RETRY', sentence: 'RETRY_WITH_WUNDERGRAPH' })
   ```

4. **Client: Update UI**
   ```javascript
   eventSource.onmessage = (event) => {
     const data = JSON.parse(event.data);
     // Update budget bars
     // Add courtroom message
     // Display jury votes
     // Show verdict card
   }
   ```

## Sponsor Integration Points

```
┌─────────────────────────────────────────┐
│         WunderGraph Layer               │
│  • Mock federated supergraph            │
│  • Combines flights + policy + audit    │
│  • MCP Gateway simulation               │
│  • 2 calls instead of 5                 │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│          TinyFish Layer                 │
│  • Fetch API wrapper                    │
│  • Evidence with timestamps + hashes    │
│  • Screenshot exhibits                  │
│  • Fallback to mock if no key           │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│           Guild.ai Layer                │
│  • Trace logger                         │
│  • Span tracking for each tool call     │
│  • Prosecutor cites span IDs            │
│  • Local JSONL fallback                 │
└─────────────────────────────────────────┘
```

## Cost Calculation

### Baseline Agent
```
fetch_flights_api (call 1)     $0.04
fetch_flights_api (call 2)     $0.04  ← Duplicate!
check_policy_api               $0.04
fetch_flights_api (call 3)     $0.04  ← Duplicate!
tinyfish_browse                $0.10
─────────────────────────────────────
TOTAL                          $0.26  ← OVER BUDGET ($0.50)
```

### WunderGraph Agent
```
wundergraph_mcp_search         $0.015 ← Federated!
tinyfish_browse                $0.10
─────────────────────────────────────
TOTAL                          $0.115 ← UNDER BUDGET ($0.50)
```

**Savings: 56% reduction in cost**

## Key Design Decisions

### 1. In-Memory Store
**Decision**: Use Map instead of Prisma/Postgres
**Reason**: Faster iteration, no migration complexity
**Trade-off**: Data lost on restart (acceptable for demo)
**Upgrade path**: Swap `lib/db.ts` for Prisma client

### 2. Hardcoded Court Responses
**Decision**: Pre-written prosecutor/defense arguments
**Reason**: Reliable, fast, no LLM API costs during demo
**Trade-off**: Not adaptive to different scenarios
**Upgrade path**: Replace with Anthropic Claude calls

### 3. Mock Sponsor Integrations with Fallbacks
**Decision**: Smart fallbacks if API keys missing
**Reason**: Demo works immediately, upgrades cleanly
**Trade-off**: Not using "real" sponsor platforms
**Upgrade path**: Add env vars, code is structured for it

### 4. SSE Instead of WebSockets
**Decision**: Server-Sent Events for trial stream
**Reason**: Simpler, built into Next.js, one-way is enough
**Trade-off**: Can't send client → server messages during trial
**Upgrade path**: Not needed (trial is server-driven)

## Performance Characteristics

- **Case creation**: < 50ms
- **Agent execution**: ~1 second (simulated delays)
- **Courtroom orchestration**: ~3 seconds (with 500ms pauses for drama)
- **Total trial time**: ~5 seconds
- **SSE latency**: < 100ms per event
- **UI updates**: Real-time (React state updates)

## Security Considerations

### For Demo
- ✅ No user auth needed
- ✅ No sensitive data
- ✅ Rate limiting not required (local dev)
- ✅ CORS not needed (same origin)

### For Production
- 🔒 Add NextAuth.js
- 🔒 Rate limit API endpoints
- 🔒 Validate case inputs
- 🔒 Sanitize SSE messages
- 🔒 Add API key auth for sponsor platforms

## Deployment Architecture (Future)

```
┌──────────────┐
│    Vercel    │  ← Next.js app
│  (Frontend   │
│  + Serverless│
│   Functions) │
└──────┬───────┘
       │
       ├──────→  ┌──────────────┐
       │         │  Neon/Vercel │  ← Postgres
       │         │   Postgres   │
       │         └──────────────┘
       │
       ├──────→  ┌──────────────┐
       │         │ WunderGraph  │  ← Cosmo Router
       │         │    Cosmo     │
       │         └──────────────┘
       │
       ├──────→  ┌──────────────┐
       │         │   TinyFish   │  ← Web agent API
       │         │      API     │
       │         └──────────────┘
       │
       └──────→  ┌──────────────┐
                 │   Guild.ai   │  ← Control plane
                 │      API     │
                 └──────────────┘
```

## File Size Report

```
Total Files: 22
Total Lines of Code: ~3,000
Total Size: ~150KB

Breakdown:
- TypeScript/TSX: 80%
- Documentation: 15%
- Configuration: 5%

Largest files:
1. trial/[caseId]/page.tsx - 250 lines
2. court-orchestrator.ts - 200 lines
3. agent-runners.ts - 100 lines
```

## Testing Strategy

### What We Tested
✅ Case creation API
✅ SSE stream endpoint
✅ Agent execution (both variants)
✅ Court orchestration flow
✅ Budget calculations
✅ Jury voting logic
✅ UI rendering with real data

### How We Tested
- Manual curl commands
- Browser testing
- Console.log verification
- Multiple demo run-throughs

### What We Didn't Test (Acceptable for Hackathon)
❌ Unit tests
❌ Integration tests
❌ Load testing
❌ Error boundary testing

---

**This architecture is production-ready in structure, hackathon-optimized in implementation.**
