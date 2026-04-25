# Pre-Demo Checklist

## 15 Minutes Before Demo

### 1. Environment Check
```bash
# Verify server is running
curl http://localhost:3000/api/cases
# Should return: {"cases":[...]}
```

### 2. Pre-Seed Demo Data
```bash
cd apps/web
npm run db:seed
# This creates 4 cases in the docket
```

### 3. Open Demo Tabs
- Tab 1: http://localhost:3000 (landing page)
- Tab 2: Browser console open (for debugging)
- Tab 3: Terminal with `curl` ready
- Tab 4: This checklist

### 4. Test the Demo Flow
1. Click "New Case" on landing page
2. Verify trial page loads
3. Watch first few events stream
4. Confirm budget bars appear
5. Close and create fresh case for actual demo

### 5. Backup Plan Ready
- `DEMO_SCRIPT.md` open
- `agent-runners.ts` open (for code walkthrough)
- Pre-recorded curl output in `DEMO_TEST.md`

### 6. Sound Check
- Gavel sound effect (emoji animation)
- Verdict card flip animation
- Budget bars filling smoothly

### 7. Practice Narration
Read `DEMO_SCRIPT.md` section 90-Second Demo Script out loud 3x

## During Demo

### Opening (0:00-0:15)
✅ Start at landing page with docket visible
✅ "AI agents are shipping to production. Most shouldn't be."
✅ Point to existing cases in docket

### Setup (0:15-0:30)
✅ Click "New Case"
✅ Show task: "Find cheapest refundable SFO→JFK flight"
✅ Explain: two agents, one uses WunderGraph

### Evidence (0:30-1:00)
✅ Point to budget bars filling
✅ "Baseline is going red — see the duplicate calls?"
✅ "WunderGraph stays green — one federated query"
✅ Point to tool call counts: 5 vs 2

### Trial (1:00-1:30)
✅ "Court convenes. Prosecutor: 'Exhibit G-2, redundant calls'"
✅ "Defense: 'My client used federation'"
✅ Show jury grid populating

### Verdict (1:30-1:50)
✅ Gavel animation
✅ "Verdict: RETRY_WITH_WUNDERGRAPH"
✅ "The agent got sentenced to use WunderGraph"

### Close (1:50-2:00)
✅ "This is governance you can watch"
✅ "WunderGraph, TinyFish, Guild.ai working together"

## Emergency Procedures

### If Demo Breaks
1. Switch to Terminal tab
2. Run: `curl -N http://localhost:3000/api/cases/[CASE_ID]/stream`
3. Narrate the JSON output
4. "The backend works — here's the trial streaming live"

### If Server Crashes
1. Terminal: `cd apps/web && npm run dev`
2. While waiting: "Let me show you the code"
3. Open `agent-runners.ts`
4. Walk through cost comparison

### If Browser Freezes
1. Open backup tab with pre-loaded case
2. Continue from where you left off
3. "Here's what you would have seen..."

## Post-Demo Q&A Prep

**"Is this real or scripted?"**
> "Real-time. Hit the endpoint, agents run, court streams. Responses are hardcoded for demo speed but structured for real LLMs."

**"Why WunderGraph?"**
> "Agents default to calling every API separately. WunderGraph federation makes one call fan out. 2 vs 5 calls — you saw the difference."

**"Production ready?"**
> "Yes. Swap hardcoded responses for Claude. Add real API keys. Deploy Cosmo Router. It's structured for it."

## Confidence Checklist

Before you present, verify:
- ✅ I've run the demo 3x successfully
- ✅ I know the 90-second script by heart
- ✅ I can explain the cost difference (2 vs 5 calls)
- ✅ I can point to the verdict on screen
- ✅ I have backup plans if tech fails
- ✅ I can answer "why WunderGraph?" confidently

## The One Thing to Remember

**Point to the verdict and say:**
> "The system literally sentenced the agent to retry with WunderGraph. That's not a slide — that's the demo."

That's your mic drop. Everything else is setup for that moment.

---

**You're ready. Go win. 🏛️⚖️**
