# Agent Court - Demo Script & Pitch Deck

## 90-Second Demo Script

### Setup (Pre-Demo)
- Browser open to http://localhost:3000
- Terminal ready with curl commands as backup
- Have case ID ready if showing existing trial

### The Script

**0:00-0:15 | Hook**
> "AI agents are shipping to production everywhere. Most of them shouldn't be. We built Agent Court—a system that puts AI agents on trial before they ship."

*[Show landing page with docket]*

**0:15-0:30 | The Setup**
> "Here's the task: find the cheapest refundable flight from San Francisco to New York next Friday under $400. Two agents will attempt this. One uses scattered REST APIs. The other uses WunderGraph's unified supergraph."

*[Click "New Case", show task]*

**0:30-1:00 | The Evidence**
> "Watch the budget ledgers. Baseline agent is making duplicate calls—look, it just called the flights API THREE times. It's going over budget. WunderGraph agent makes ONE federated query that fans out. It stays green."

*[Point to red vs green bars filling]*
*[Point to tool call counts: 5 vs 2]*

**1:00-1:30 | The Trial**
> "Now the courtroom convenes. The prosecutor argues: 'Exhibit G-2 shows redundant API calls.' The defense for the WunderGraph agent responds: 'My client used a federated supergraph—no duplicates.' Five jurors vote based on different rubrics: cost, efficiency, evidence quality, policy compliance."

*[Show prosecutor and defense messages streaming]*
*[Show jury grid populating]*

**1:30-1:50 | The Verdict**
> "And the verdict is in: RETRY WITH WUNDERGRAPH. The baseline agent literally got sentenced to retry using WunderGraph's infrastructure. The agent that used the right architecture won."

*[Show verdict card with gavel and sentence]*

**1:50-2:00 | The Close**
> "Agent Court proves that agents need governed infrastructure. WunderGraph keeps them under budget. TinyFish gives them admissible evidence. Guild.ai gives them an audit trail. This isn't just observability—it's accountability."

---

## Track-Specific Pitches (30 seconds each)

### WunderGraph Track: Best Use of WunderGraph

**Opening**: 
> "We didn't sprinkle WunderGraph in—we put it on the witness stand."

**Core Argument**:
> "Our demo proves WunderGraph's value proposition with math that anyone can understand:
> - Baseline agent: 5 API calls, $0.26, OVER BUDGET
> - WunderGraph agent: 2 calls, $0.115, UNDER BUDGET
> 
> The difference? Federation. The MCP Gateway lets the agent discover one endpoint instead of five. Policy and data come together in a single query. The agent literally avoids conviction because WunderGraph keeps it from going into debt."

**Technical Depth**:
> "We're simulating a supergraph composed of `flights`, `policy`, and `audit` subgraphs. The WunderGraph agent's query fans out through federation, but it looks like one call. The baseline agent has no idea these services are related—so it calls them separately and pays the price."

**Why We Win**:
> "Most hackathon demos say 'we used WunderGraph' in a slide. Our verdict literally says 'RETRY_WITH_WUNDERGRAPH' on screen. The architecture is the protagonist."

---

### WunderGraph Track: Most Innovative AI Architecture

**Opening**:
> "What if agent governance wasn't a dashboard—it was a courtroom?"

**Core Argument**:
> "We architected a multi-agent system where agents don't just run—they're tried by their peers:
> - One agent (the defendant) executes a task
> - Eight agents (judge, prosecutor, defense, 5 jurors) evaluate its decisions
> - The verdict is a production decision: approve, reject, or retry
>
> The innovation? We made WunderGraph's federated supergraph the deciding factor. The jury *literally votes based on API efficiency*. Judges will remember 'the agent got convicted for bad API design.'"

**Technical Innovation**:
> "We built an SSE-streamed courtroom where:
> - Guild.ai traces become court exhibits
> - TinyFish screenshots become evidence
> - WunderGraph federation becomes the architectural defense
>
> Every argument cites exhibit IDs. This isn't logging—it's litigation."

**Why We Win**:
> "We turned infrastructure choices into a story. That's innovation."

---

### TinyFish Track: Best Use of TinyFish

**Opening**:
> "In court, every claim needs evidence. TinyFish is our forensics lab."

**Core Argument**:
> "We use TinyFish's Fetch and Browser APIs to create *admissible evidence*:
> - Every web page the agent visits becomes Exhibit T-001, T-002, etc.
> - Each exhibit has a URL, timestamp, hash, and screenshot
> - The prosecutor and defense cite these exhibits in arguments
>
> Without TinyFish, an agent just says 'I found a flight for $380.' With TinyFish, it says 'Exhibit T-003 shows the price at united.com at 14:32:11 UTC, hash a7f3b92c.'"

**Technical Use**:
> "We wrapped TinyFish's Fetch API in an `Exhibit` type:
> ```typescript
> {
>   id: 'T-003',
>   kind: 'TINYFISH_FETCH',
>   sourceUrl: 'https://united.com/...',
>   hash: 'a7f3b92c',
>   payloadRef: '/exhibits/T-003.json'
> }
> ```
> The courtroom UI displays these as evidence cards. The jury sees proof."

**Why We Win**:
> "We turned TinyFish into chain-of-custody. Agents don't hallucinate when every claim has a hash."

---

### Guild.ai Track: Most Innovative Use of Guild.ai

**Opening**:
> "A trial is impossible without an honest record. Guild is the court reporter."

**Core Argument**:
> "We made Guild.ai's control plane *visible*:
> - Every tool call is a Guild span
> - The prosecutor queries Guild for inefficiencies: 'Exhibit G-2 shows a redundant call at span-2'
> - The defense uses Guild traces to prove correctness
> - The jury votes based on Guild's cost and latency data
>
> Guild isn't in the background—it's projected on the courtroom wall."

**Technical Integration**:
> "We built a `GuildClient` that:
> 1. Logs every agent action as a span with cost and attributes
> 2. Generates `getTraceSummary()` for the prosecutor
> 3. Maps span IDs to exhibit references (e.g., `span-2` → `Exhibit G-2`)
> 4. Falls back to local JSONL if the Guild API isn't configured
>
> The courtroom doesn't read logs—it *cites* them."

**Why We Win**:
> "We made governance something humans can watch. That's Guild's vision made literal."

---

### WunderGraph Track: Best AI Application/UX

**Opening**:
> "Agent governance is normally a dashboard with red dots. We made it a trial."

**UX Innovation**:
> "The courtroom metaphor is *instantly understandable*:
> - Engineers see API efficiency
> - PMs see budget control
> - Executives see risk management
> - Everyone understands 'the agent got convicted'
>
> We didn't invent a new paradigm—we used one everyone already knows."

**Visual Design**:
> "We designed for the projector:
> - Budget bars fill in real-time (green vs red)
> - Jury votes appear as a 5-cell grid with color-coded verdicts
> - The sentence card flips like a verdict announcement
> - Every message is role-tagged (JUDGE, PROSECUTOR, DEFENSE)
>
> It's courtroom drama meets Linear's design language."

**Why We Win**:
> "Most governance UIs explain why an agent failed. Ours explains it like a closing argument. People remember stories."

---

## Backup: If Tech Demo Fails

If the live demo doesn't work, have this ready:

### Show Pre-Recorded Trial
Use the curl output from `DEMO_TEST.md` and walk through it:
> "Here's a real trial. Baseline agent: 5 calls. WunderGraph agent: 2 calls. Verdict: RETRY_WITH_WUNDERGRAPH. The code is on GitHub."

### Show Code Instead
Open `agent-runners.ts` and `court-orchestrator.ts`:
> "Here's the agent that goes into debt. Here's the jury that votes. The architecture is the demo."

### Fallback Pitch
> "We built a system where agents are accountable. WunderGraph keeps them efficient. TinyFish gives them evidence. Guild gives them memory. Even if the demo doesn't run, the idea wins."

---

## Q&A Prep

**Q: "Is this real-time or pre-scripted?"**  
A: "Real-time. Hit the endpoint, agents run, court streams live via SSE. The responses are hardcoded for demo speed, but the structure supports real LLM-powered court agents."

**Q: "Why is WunderGraph necessary here?"**  
A: "Because agents default to calling every API separately. They have no concept of federation unless we give them one. WunderGraph makes 'scattered calls' architecturally impossible."

**Q: "Could you use this in production?"**  
A: "Yes. Swap the hardcoded court responses for real LLM calls (Anthropic Claude). Add real Guild.ai and TinyFish API keys. Deploy the Cosmo Router. Everything's structured for it."

**Q: "What's the hardest part you solved?"**  
A: "Making governance visual. Most systems log. We litigate. The courtroom metaphor isn't decoration—it's the architecture."

---

## Confidence Boosters for Presentation

✅ The demo works—we tested it  
✅ The story is tight—90 seconds, no filler  
✅ Every sponsor is meaningful—not bolted on  
✅ The verdict names WunderGraph—that's the mic drop  
✅ The UX is memorable—people will talk about "the agent trial"  

**You've got this. Go win.**
