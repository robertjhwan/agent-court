# 🏛️ Agent Court - Project Index

**A courtroom for AI agents. The agent that used WunderGraph won the trial.**

---

## 🚀 Start Here

### Fastest Path to Demo (30 seconds)
1. Read: [`QUICK_START.md`](QUICK_START.md)
2. Run: `cd apps/web && npm run dev`
3. Open: http://localhost:3000
4. Click: "New Case"

### For Presentation Day (15 minutes)
1. Read: [`PRE_DEMO_CHECKLIST.md`](PRE_DEMO_CHECKLIST.md)
2. Practice: [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md)
3. Run: `scripts/preflight.sh`
4. You're ready!

---

## 📚 Documentation Map

### Essential Reading (Start Here)
| File | Purpose | Read Time |
|------|---------|-----------|
| [`QUICK_START.md`](QUICK_START.md) | Get demo running now | 1 min |
| [`README.md`](README.md) | Complete project overview | 5 min |
| [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) | 90-second pitch + track pitches | 10 min |

### Before You Present
| File | Purpose | Read Time |
|------|---------|-----------|
| [`PRE_DEMO_CHECKLIST.md`](PRE_DEMO_CHECKLIST.md) | 15-min preparation guide | 5 min |
| [`READY_TO_DEMO.md`](READY_TO_DEMO.md) | Quick reference card | 2 min |
| [`DEMO_TEST.md`](DEMO_TEST.md) | Proof it works (curl logs) | 2 min |

### Deep Dives (Optional)
| File | Purpose | Read Time |
|------|---------|-----------|
| [`STATUS.md`](STATUS.md) | What's done, what wins | 5 min |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System design & decisions | 10 min |
| [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md) | Complete project summary | 15 min |
| [`COMPLETION_REPORT.md`](COMPLETION_REPORT.md) | All tasks finished | 5 min |

### Sponsor-Specific
| File | Purpose | Read Time |
|------|---------|-----------|
| [`services/wg/README.md`](services/wg/README.md) | WunderGraph integration | 3 min |
| [`PROGRESS.md`](PROGRESS.md) | Build timeline | 2 min |

---

## 🎯 Quick Navigation by Goal

### "I want to run the demo RIGHT NOW"
→ [`QUICK_START.md`](QUICK_START.md)

### "I'm presenting in 15 minutes"
→ [`PRE_DEMO_CHECKLIST.md`](PRE_DEMO_CHECKLIST.md)

### "I need the 90-second pitch"
→ [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) (Section: 90-Second Demo Script)

### "I need the WunderGraph pitch"
→ [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) (Section: WunderGraph Track)

### "I need backup if demo breaks"
→ [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) (Section: Emergency Procedures)

### "I want to understand the code"
→ [`ARCHITECTURE.md`](ARCHITECTURE.md)

### "I need proof it works"
→ [`DEMO_TEST.md`](DEMO_TEST.md)

### "What's the one-liner?"
→ "A courtroom for AI agents. The agent that used WunderGraph won."

---

## 📁 Project Structure

```
aws-hackathon/
├── README.md                    ⭐ Start here
├── QUICK_START.md              🚀 Get running in 30s
├── DEMO_SCRIPT.md              🎤 Your presentation script
├── PRE_DEMO_CHECKLIST.md       ✅ 15-min prep guide
├── READY_TO_DEMO.md            📋 Quick reference
├── DEMO_TEST.md                🧪 Proof it works
├── STATUS.md                   📊 What's complete
├── ARCHITECTURE.md             🏗️  System design
├── FINAL_SUMMARY.md            📝 Complete summary
├── COMPLETION_REPORT.md        ✅ All tasks done
├── PROGRESS.md                 ⏱️  Build timeline
│
├── apps/web/                   💻 Main application
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── trial/[caseId]/page.tsx    # Trial view
│   │   └── api/                        # REST + SSE
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── agent-runners.ts       # Baseline vs WG
│   │   │   └── court-orchestrator.ts  # 8-agent court
│   │   └── db.ts                       # In-memory store
│   ├── components/
│   │   └── CourtUI.tsx                 # UI components
│   └── scripts/
│       ├── seed-cases.ts               # Demo data
│       └── preflight.sh                # Pre-demo check
│
├── packages/integrations/      🔌 Sponsor integrations
│   ├── tinyfish.ts                     # TinyFish wrapper
│   └── guild.ts                        # Guild.ai logger
│
└── services/wg/                🌐 WunderGraph
    ├── README.md                       # Setup guide
    └── subgraphs/
        └── mock-subgraphs.ts           # GraphQL schemas
```

---

## 🏆 What We Built

### The Product
A theatrical courtroom where AI agents are put on trial:
- Two agents attempt the same task
- One uses WunderGraph (efficient), one doesn't (wasteful)
- A multi-agent court evaluates both
- The verdict: **"RETRY_WITH_WUNDERGRAPH"**

### The Numbers
- **Baseline**: 5 calls, $0.26, 52% over budget → REJECTED
- **WunderGraph**: 2 calls, $0.115, 77% under budget → APPROVED

### The Innovation
- ✅ Working demo (not slides)
- ✅ Visual proof (budget bars)
- ✅ Memorable metaphor (courtroom > dashboard)
- ✅ Sponsor alignment (WunderGraph in the verdict)
- ✅ Production patterns (SSE, traces, exhibits)

---

## ⚡ Commands You'll Need

```bash
# Start the demo
cd apps/web && npm run dev

# Seed demo data
npm run db:seed

# Start with seeded data
npm run demo

# Run pre-flight check
./scripts/preflight.sh

# Test API
curl http://localhost:3000/api/cases

# Watch a trial
curl -N http://localhost:3000/api/cases/[ID]/stream
```

---

## 🎤 The Elevator Pitch

> "AI agents are shipping to production. Most shouldn't be. We built Agent Court—a system that puts agents on trial. Two agents attempt the same task. One uses scattered REST APIs and goes into debt. The other uses WunderGraph's unified supergraph and stays under budget. The courtroom convenes: judge, prosecutor, defense, five jurors. The verdict? RETRY_WITH_WUNDERGRAPH. The agent that used the right infrastructure literally won the trial."

**30 seconds. Everyone remembers it.**

---

## ✅ Pre-Demo Verification

Run this checklist 15 minutes before demo:
```bash
cd apps/web
./scripts/preflight.sh
```

Should see:
- ✓ In correct directory
- ✓ Dependencies installed
- ✓ .env file exists
- ✓ Server running
- ✓ API responding

If not, see [`PRE_DEMO_CHECKLIST.md`](PRE_DEMO_CHECKLIST.md)

---

## 🎯 Success Metrics

### Demo Success = All These Are True
- [ ] Server starts without errors
- [ ] Landing page loads at localhost:3000
- [ ] Can click "New Case"
- [ ] Trial page streams events
- [ ] Budget bars fill (red vs green)
- [ ] Jury votes appear
- [ ] Verdict displays: RETRY_WITH_WUNDERGRAPH

### Pitch Success = Can Answer
- [ ] "What is this?" → Courtroom for AI agents
- [ ] "Why WunderGraph?" → 2 calls vs 5, visual proof
- [ ] "Is it real?" → Yes, run this curl command
- [ ] "Production ready?" → Yes, swap mocks for APIs

---

## 🆘 Emergency Contacts

### If Demo Breaks
1. **Plan A**: Show [`DEMO_TEST.md`](DEMO_TEST.md) curl output
2. **Plan B**: Walk through code (`agent-runners.ts`)
3. **Plan C**: Show [`ARCHITECTURE.md`](ARCHITECTURE.md) diagram

### If You Forget the Pitch
→ [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) - Section: 90-Second Demo Script

### If Server Won't Start
```bash
cd apps/web
rm -rf .next
npm run dev
```

### If You Need Confidence
→ [`READY_TO_DEMO.md`](READY_TO_DEMO.md) - Read the confidence statement

---

## 🎨 Visual Assets

### What Judges Will See
1. **Landing Page**: Docket with case list
2. **Budget Bars**: Red (Baseline) vs Green (WunderGraph)
3. **Tool Call Stream**: 5 calls vs 2 calls
4. **Courtroom Messages**: Judge → Prosecutor → Defense → Jury
5. **Jury Grid**: 5 votes with color-coded verdicts
6. **Verdict Card**: Gavel + "RETRY_WITH_WUNDERGRAPH"

### Screenshots Not Needed
The demo runs live. Point at the screen. That's your visual.

---

## 🏁 Final Checklist

Before you close this file, verify:
- [ ] I know where to find the Quick Start guide
- [ ] I know where to find the Demo Script
- [ ] I know where to find the Emergency Procedures
- [ ] I can navigate to apps/web in terminal
- [ ] I can run: npm run dev
- [ ] I know the one-liner: "Courtroom for AI agents"

If all checked: **You're ready to win. 🏛️⚖️**

---

## 📞 What to Do Right Now

### If presenting in next 30 minutes:
1. Open [`PRE_DEMO_CHECKLIST.md`](PRE_DEMO_CHECKLIST.md)
2. Follow it exactly
3. Practice pitch out loud 3x
4. You're ready

### If presenting later today:
1. Run the demo once: [`QUICK_START.md`](QUICK_START.md)
2. Read the pitch: [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md)
3. Verify everything works
4. Come back 15min before with checklist

### If just exploring:
1. Read: [`README.md`](README.md)
2. Read: [`ARCHITECTURE.md`](ARCHITECTURE.md)
3. Run: `npm run dev`
4. Enjoy watching agents on trial

---

**Built for "Ship to Production" AI Hackathon**  
**Sponsors**: WunderGraph • TinyFish • Guild.ai  
**Date**: April 24, 2026  
**Status**: COMPLETE & READY  

**Go win this. 🚀**
