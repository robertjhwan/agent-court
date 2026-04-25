# Agent Court — Devpost Submission

## Inspiration

We kept watching teammates ship LLM agents that "worked" in a notebook and then quietly burned through API budgets in production: duplicate fetches, redundant policy lookups, scraping the same page three times because the planner forgot it already did. Reviewing those traces felt less like debugging and more like reading a deposition.

So we leaned into the metaphor. What if every agent had to stand trial for the work it did? What if the prosecutor's exhibits were Guild.ai trace spans, the judge's sentence was an executable governance policy, and the jury was a panel of LLMs each scoring against a different rubric (cost, correctness, evidence, policy)?

The hook crystallized when we talked to the WunderGraph team: *the same agent that goes into debt with scattered REST calls finishes the same task in two federated calls through their MCP supergraph.* That's not just an integration — that's a defendant the court can acquit.

## What it does

Agent Court puts two AI agents on trial for the same task and lets the courtroom decide which one deserves to ship.

1. **Two defendants race the same task in parallel** — a Baseline agent (scattered REST/scraping) and a WunderGraph-enabled agent (federated GraphQL via the MCP supergraph).
2. **A live ledger** streams every tool call as it happens, with cost, latency, and a duplicate-call detector. The Baseline agent's bar turns red and flashes the moment it crosses budget — the "automatic conviction trigger."
3. **The court convenes**: a Judge opens the case, the Prosecutor files three charges (each citing exhibit IDs from the trace logs), the Defense rebuts, and a panel of five jurors with distinct rubrics (Bean Counter, Skeptic, Pragmatist, Compliance Officer, User Advocate) deliver verdicts.
4. **A Verdict card** flips in with the sentence — `RETRY_WITH_WUNDERGRAPH`, `REJECTED`, or `APPROVED` — that downstream systems can act on programmatically.

Press one big gold "Run Live Demo" button and the entire ~50-second courtroom drama plays out in front of you, sponsor stack and all.

## How we built it

- **Frontend & API:** Next.js 15 (App Router) + React 19 + TypeScript. The trial page subscribes to a Server-Sent Events stream and renders live `BudgetBar`, `ToolCallTicker` (with duplicate detection), `JuryGrid`, `LiveSpeaker`, and a flippy `VerdictCard`. All animations are hand-rolled CSS keyframes — no animation libraries.
- **Streaming court orchestrator:** A single SSE route (`/api/cases/[id]/stream`) walks the trial through phases (`agents → court → jury → verdict`) emitting per-tool-call, per-charge, per-rebuttal, and per-vote events with carefully tuned dramatic pacing so the audience can read each moment.
- **WunderGraph track:** Two mock subgraphs (`flights`, `policy`) compose into a supergraph; the WG defendant calls a single `wundergraph_mcp_search_refundable_flights` operation that returns flights joined with policy compliance — that's the "two federated calls vs six scattered ones" punchline.
- **TinyFish track:** Both defendants use a `tinyfish_browse` tool to capture ground-truth evidence from the live web. Captured screenshots become courtroom exhibits referenced by ID in the prosecutor's charges.
- **Guild.ai track:** A `GuildClient` wraps every tool call in a trace span with cost, latency, and inputs/outputs. The prosecutor literally cites those span IDs ("Exhibit G-1, G-2, G-4 show three duplicate fetches"). A local JSONL fallback lets the demo run with no API key.
- **State:** A `globalThis`-pinned in-memory case store. We started on Prisma + SQLite, hit Prisma 7 + enum + Next 15 churn at the worst possible time, and pivoted to in-memory in 20 minutes — the right call for a one-day build.
- **Demo mode:** The SSE route accepts `?demo=true|false`. Demo mode adds dramatic delays between events; quick mode runs the same trial in under a second for testing.

## Challenges we ran into

- **Dependency dragons.** Tailwind v4 vs v3, Prisma 7 schema syntax, Next 15 + React 19 peer-dep conflicts — we burned an hour just to a clean `npm install`. Eventually pinned Tailwind to 3.4 and went framework-light on styling.
- **In-memory DB lost cases between requests.** Cause: Next.js's route-handler module isolation in dev meant the `Map` lived in one route's bundle but not another's. Fix: pin the `Map` to `globalThis` so all routes share one instance.
- **React Strict Mode double-streamed the trial.** The `useEffect` ran twice in dev, opening two `EventSource` connections, so the trial visibly restarted half-way through. We disabled `reactStrictMode` and added a `useRef`-based guard so even if it re-mounted we'd never open a second stream.
- **Selling the punchline.** With both bars green, the demo was visually flat. We tuned the Baseline agent to reliably overspend by exactly 10 percent so the bar pops red right as the prosecutor reads Charge 2 — that beat lands every single rehearsal.
- **Pacing is its own engineering problem.** Too fast and the audience can't read; too slow and they tune out. The final pacing constants (550ms between baseline calls, 900ms for WG, 1.7s between charges) came from rehearsing the demo a dozen times.

## Accomplishments that we're proud of

- **The metaphor isn't a gimmick — it shapes the whole architecture.** Tool calls are exhibits. Trace spans are evidence. Jury rubrics are evaluator policies. Sentences are executable directives (`RETRY_WITH_WUNDERGRAPH` is something a control plane could actually do).
- **All three sponsor integrations are organically load-bearing**, not bolted on. Strip out WunderGraph and the defense wins. Strip out TinyFish and there's no ground-truth evidence to cite. Strip out Guild and the prosecutor has nothing to enter into the record.
- **One-button live demo.** No setup, no script to run, no questions about what to click. Press the gold button on the home page and a 50-second courtroom drama unfolds with red-vs-green budget bars, duplicate-call detection, exhibit-citing arguments, color-coded jury votes, and a flipping verdict card.
- **The system always demos.** Every external dependency has a smart fallback — no Anthropic key, no TinyFish key, no Guild key, no Cosmo Router required. The judges see the same story whether the WiFi behaves or not.
- **Sub-1s "quick mode" doubles as our integration test.** We can run the entire trial through the SSE pipeline in under a second to verify nothing is broken before going on stage.

## What we learned

- **A good metaphor is a debugging tool.** Once we framed agent runs as trials, decisions about what to log, what to score, and what to do with the output answered themselves.
- **Demo state machines deserve as much engineering as production state machines.** Pacing, fallbacks, and idempotent re-runs are features, not polish.
- **Federated GraphQL through MCP isn't just cleaner code — it's measurably cheaper agent behavior.** The same task that took six tool calls on REST took two on the supergraph, and the difference shows up directly in the budget ledger.
- **Building for "always-demoable" forces better architecture.** Every mock fallback we wrote made the seams in our code clearer and the integration boundaries cleaner.

## What's next for Agent Court

- **Real LLMs in the courtroom.** Swap our scripted judge/prosecutor/defense/jury for Anthropic Claude calls so the arguments are generated from the actual trace evidence each run.
- **Execute-Sentence.** When the verdict is `RETRY_WITH_WUNDERGRAPH`, automatically re-run the original task through the WG defendant and replace the result. The court isn't just an evaluator — it's a control plane.
- **Replay scrubber.** Use Guild.ai's trace timeline to scrub backward and forward through any past trial, watching the bars climb and the arguments form in any direction.
- **Pluggable jury rubrics.** Let teams define their own juror personas (Latency Hawk, Privacy Officer, Brand Voice Police) so Agent Court fits their governance needs, not ours.
- **Shareable verdict URLs.** A permanent permalink for every trial so engineers can drop a courtroom replay into a PR comment as a regression check.
- **CI integration.** Fail a deploy if the agent under test loses its trial against the previous champion.

## Source code (for Devpost)

**Public GitHub (replace with yours after you push):** `https://github.com/YOUR_USERNAME/YOUR_REPO`

Step-by-step: [`GITHUB_SETUP.md`](GITHUB_SETUP.md)

## Built with

`TypeScript` `JavaScript` `Node.js` `npm` `Next.js` `React` `App Router` `Tailwind CSS` `Lucide React` `Server-Sent Events` `REST` `EventSource` `WunderGraph` `GraphQL Federation` `MCP` `Cosmo Router` `TinyFish` `Guild.ai` `Anthropic` `Claude` `Zod` `Prisma` `Docker` `tsx` `Cursor`

*Comma‑separated (paste into “Built with” UIs that expect one string):*  
TypeScript, JavaScript, Node.js, npm, Next.js, React, App Router, Tailwind CSS, Lucide React, Server-Sent Events, REST, EventSource, WunderGraph, GraphQL Federation, MCP, Cosmo Router, TinyFish, Guild.ai, Anthropic, Claude, Zod, Prisma, Docker, tsx, Cursor
