# Agent Court 🏛️⚖️

**A courtroom UI for AI agent governance**

Put your AI agents on trial. The agent that uses the right infrastructure wins.

## The Concept

Agent Court is a theatrical demonstration of AI agent governance. Every agent run is logged, evidence is captured, and a multi-agent courtroom panel (judge, prosecutor, defense, 5 jurors) decides whether the agent's actions should be approved, rejected, or retried.

**The Thesis**: An agent using WunderGraph's unified supergraph stays under budget and passes trial. An agent making scattered REST calls goes into "debt" and gets convicted with sentence: `RETRY_WITH_WUNDERGRAPH`.

**Source code:** after you publish, paste your public GitHub URL here — see [`GITHUB_SETUP.md`](GITHUB_SETUP.md) for one-time steps.

## Quick Start

```bash
# Install dependencies
cd apps/web
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

## Demo Flow (2-3 minutes)

1. **Create a Case**: Click "New Case" on the landing page
2. **Watch the Trial**: Agents run → Court convenes → Jury votes → Verdict
3. **See the Difference**:
   - Baseline agent: 5 tool calls, $0.26 (over budget)
   - WunderGraph agent: 2 tool calls, $0.115 (under budget)
4. **Verdict**: `RETRY_WITH_WUNDERGRAPH`

The story writes itself on screen in real-time via SSE.

## Sponsor Integrations

### WunderGraph
- **Value Prop**: Unified API layer reduces redundant calls
- **Integration**: Mock federated supergraph + MCP Gateway simulation
- **Evidence**: Side-by-side cost comparison in budget ledger
- **Pitch**: "The agent that used WunderGraph stayed under budget and passed trial"

### TinyFish
- **Value Prop**: Web evidence becomes admissible court exhibits
- **Integration**: Fetch API with fallback to mock data (add `TINYFISH_API_KEY` to use real API)
- **Evidence**: Hashed screenshots with timestamps
- **Pitch**: "Without TinyFish, an agent's claim is unfalsifiable. With TinyFish, it's a court exhibit."

### Guild.ai
- **Value Prop**: Immutable trace = court record
- **Integration**: Local JSONL logger with span tracking (add `GUILD_API_KEY` for real Guild platform)
- **Evidence**: Prosecutor cites Guild span IDs as exhibits
- **Pitch**: "We made Guild's traces the literal source of truth for every argument in court"

## Architecture

```
apps/web/
  app/                      # Next.js App Router
    page.tsx                # Case docket landing
    trial/[caseId]/         # Live trial view
    api/
      cases/                # REST + SSE endpoints
  lib/
    agents/
      agent-runners.ts      # Baseline + WunderGraph agents
      court-orchestrator.ts # Judge, Prosecutor, Defense, Jury
    db.ts                   # In-memory store (hackathon speed)

packages/integrations/
  tinyfish.ts               # TinyFish Fetch API wrapper
  guild.ts                  # Guild.ai trace logger

services/wg/
  subgraphs/                # Mock GraphQL schemas
  README.md                 # WunderGraph setup docs
```

## Key Features

- ✅ Real-time SSE trial stream
- ✅ Budget ledger with red/green bars
- ✅ 5-juror voting system with different rubrics
- ✅ Exhibit citations in arguments
- ✅ WunderGraph cost advantage demonstration
- ✅ Courtroom metaphor makes governance visual

## Environment Variables

```bash
# Optional: Use real sponsor APIs
ANTHROPIC_API_KEY=sk-...     # For future LLM-powered court agents
TINYFISH_API_KEY=...         # For real web evidence
GUILD_API_KEY=...            # For real trace logging
```

Without these, the demo runs on intelligent mocks that tell the same story.

## Why This Wins

### WunderGraph Track
"Our courtroom metaphor makes GraphQL federation visible to non-engineers. The jury literally votes based on API efficiency."

### TinyFish Track
"We turned browser automation into chain-of-custody. Every TinyFish result is an exhibit with a hash and timestamp."

### Guild.ai Track
"The courtroom is an *interface* for governance. Guild's control plane became something humans can watch."

### Best AI Application/UX
"Agent governance is normally a dashboard with red dots. We made it a trial. It's instantly understandable."

## Technical Highlights for Judges

1. **Working end-to-end in one day**: Create case → Run agents → Stream trial → Display verdict
2. **Sponsor-native design**: Not logos on slides—WunderGraph's advantage is the plot
3. **Viral potential**: Shareable verdict URLs, tweet-friendly sentence cards
4. **Production-ready patterns**: SSE streaming, exhibit hashing, immutable traces

## Demo Script for Pitch

```
0:00 - "AI agents are shipping to production. Most shouldn't be."
0:20 - Show docket, click New Case, task appears
0:50 - Both agents run in parallel, budget bars fill (one red, one green)
1:30 - Prosecutor: "Exhibit G-2 shows THREE redundant calls"
       Defense: "My client used WunderGraph — one federated query"
2:10 - 5 jurors vote → Verdict flips → RETRY_WITH_WUNDERGRAPH
2:40 - "The right infrastructure literally kept the agent out of jail"
```

## Team Notes

- **Pragmatic choices**: In-memory DB, mock integrations with real API fallbacks
- **Focus**: Story > polish. The demo tells itself.
- **Hackathon speed**: 1 repo, 1 server, 0 Docker complexity (unless you want Cosmo)

## Next Steps (If Time)

- [ ] Real Anthropic-powered court agents (currently hardcoded responses)
- [ ] Guild.ai replay scrubber UI
- [ ] TinyFish screenshot gallery in evidence locker
- [ ] "Execute Sentence" button that re-runs through WunderGraph
- [ ] Public verdict URLs for social sharing

---

**Built for Ship to Production Hackathon**  
Sponsors: WunderGraph • TinyFish • Guild.ai

*The agent that uses the right infrastructure wins.*
