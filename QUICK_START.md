# Quick Start Guide

## Get the Demo Running in 30 Seconds

```bash
# 1. Navigate to project
cd /Users/robertwan/Desktop/LLM\ Projects/aws-hackathon/apps/web

# 2. Start the server
npm run dev

# 3. Open browser
# Go to: http://localhost:3000

# 4. Click "New Case"
# Watch the trial happen live
```

## That's It!

The demo is:
- ✅ Working
- ✅ Self-explanatory
- ✅ Ready to present

## What You'll See

1. **Landing Page**: Docket of cases
2. **Click "New Case"**: Creates a new trial
3. **Trial Page**: 
   - Left side: Courtroom messages streaming
   - Right side: Budget bars + tool calls
4. **Budget Bars**: 
   - Red (Baseline): $0.26 / $0.50 - OVER BUDGET
   - Green (WunderGraph): $0.115 / $0.50 - UNDER BUDGET
5. **Verdict**: RETRY_WITH_WUNDERGRAPH

## For Presentation

Just narrate what you see:
- "Watch the baseline agent go red..."
- "See the WunderGraph agent stay green..."
- "Here comes the prosecutor..."
- "And the verdict..."

The demo tells its own story.

## Backup Demo (If Browser Won't Work)

```bash
# Create a case
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{"task":"Find cheapest refundable SFO→JFK flight"}'

# Note the caseId from response

# Watch the trial
curl -N http://localhost:3000/api/cases/[CASE_ID]/stream
```

Read the streaming JSON - it shows the whole trial.

## Files to Keep Open

1. This file (Quick Start)
2. `DEMO_SCRIPT.md` (for the 90-second pitch)
3. Your browser at localhost:3000
4. A terminal window (for backup curl)

## Remember

**The verdict will say "RETRY_WITH_WUNDERGRAPH"**

That's your mic drop moment. Point to it and say:
> "The system literally sentenced the agent to use WunderGraph."

Everything else is setup for that moment.

---

**You're ready. Go win. 🏛️**
