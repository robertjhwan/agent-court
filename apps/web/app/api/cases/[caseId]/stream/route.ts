import { runBaselineAgent, runWunderGraphAgent } from "@/lib/agents/agent-runners";
import { conductTrial } from "@/lib/agents/court-orchestrator";
import { db } from "@/lib/db";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const url = new URL(request.url);
  // Demo mode adds dramatic pacing for live presentations.
  const demoMode = url.searchParams.get("demo") !== "false";

  // Pacing presets (ms). Tightened so a full demo runs ~45-55 seconds.
  const pace = demoMode
    ? {
        beforeAgents: 600,
        baselineToolCall: 550,
        wgToolCall: 900,
        afterAgents: 800,
        beforeJudge: 700,
        afterJudge: 1400,
        betweenCharges: 1700,
        betweenRebuttals: 1700,
        beforeJury: 900,
        deliberation: 1400,
        betweenVotes: 450,
        beforeVerdict: 1100,
      }
    : {
        beforeAgents: 0,
        baselineToolCall: 0,
        wgToolCall: 0,
        afterAgents: 0,
        beforeJudge: 0,
        afterJudge: 100,
        betweenCharges: 100,
        betweenRebuttals: 100,
        beforeJury: 100,
        deliberation: 200,
        betweenVotes: 50,
        beforeVerdict: 200,
      };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const sendEvent = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Detect client disconnect
      request.signal.addEventListener("abort", () => {
        closed = true;
      });

      try {
        const caseData = await db.cases.findUnique({ where: { id: caseId } });
        if (!caseData) {
          sendEvent({ type: "error", message: "Case not found" });
          close();
          return;
        }

        sendEvent({ type: "connected", caseId, demoMode });
        sendEvent({
          type: "phase",
          phase: "agents",
          text: "Dispatching agents to execute task in parallel...",
        });

        await sleep(pace.beforeAgents);

        // Compute the runs up-front (cheap, deterministic) so we can
        // stream their tool calls with dramatic pacing.
        const [baselineRun, wunderGraphRun] = await Promise.all([
          runBaselineAgent(caseData.task),
          runWunderGraphAgent(caseData.task),
        ]);

        // Announce that both agents are starting their tool sequences.
        sendEvent({
          type: "agent_start",
          variant: "BASELINE",
          totalCalls: baselineRun.toolCalls.length,
        });
        sendEvent({
          type: "agent_start",
          variant: "WUNDERGRAPH",
          totalCalls: wunderGraphRun.toolCalls.length,
        });

        // Stream tool calls with interleaved pacing so both agents'
        // bars climb at the same time — but baseline keeps growing.
        const baselineCalls = baselineRun.toolCalls.map((c) => ({ ...c, variant: "BASELINE" as const }));
        const wgCalls = wunderGraphRun.toolCalls.map((c) => ({ ...c, variant: "WUNDERGRAPH" as const }));

        let baselineCost = 0;
        let wgCost = 0;
        const maxLen = Math.max(baselineCalls.length, wgCalls.length);

        for (let i = 0; i < maxLen; i++) {
          if (closed) break;

          // Emit baseline call (if exists)
          if (i < baselineCalls.length) {
            const call = baselineCalls[i];
            baselineCost += call.cost;
            sendEvent({
              type: "tool_call",
              variant: "BASELINE",
              index: i,
              call,
              runningCost: baselineCost,
            });
            await sleep(pace.baselineToolCall);
          }

          // Emit WG call (if exists) — much fewer
          if (i < wgCalls.length) {
            const call = wgCalls[i];
            wgCost += call.cost;
            sendEvent({
              type: "tool_call",
              variant: "WUNDERGRAPH",
              index: i,
              call,
              runningCost: wgCost,
            });
            await sleep(pace.wgToolCall);
          }
        }

        // Send final agent summaries
        sendEvent({ type: "agent_complete", variant: "BASELINE", run: baselineRun });
        sendEvent({ type: "agent_complete", variant: "WUNDERGRAPH", run: wunderGraphRun });

        await sleep(pace.afterAgents);

        // Court phase
        sendEvent({
          type: "phase",
          phase: "court",
          text: "Convening court — judge, prosecutor, defense, and jury are taking their seats.",
        });
        await sleep(pace.beforeJudge);

        const trialResult = await conductTrial(caseData.task, baselineRun, wunderGraphRun);

        sendEvent({
          type: "speaker",
          role: "JUDGE",
          text: "Judge is speaking...",
        });
        sendEvent({
          type: "message",
          role: "JUDGE",
          text: trialResult.openingStatement,
        });
        await sleep(pace.afterJudge);

        for (const charge of trialResult.prosecutionCharges) {
          if (closed) break;
          sendEvent({
            type: "speaker",
            role: "PROSECUTOR",
            text: "Prosecutor is presenting...",
          });
          await sleep(300);
          sendEvent({
            type: "message",
            role: "PROSECUTOR",
            text: charge.text,
            citedExhibitIds: charge.citedExhibitIds,
          });
          await sleep(pace.betweenCharges);
        }

        for (const rebuttal of trialResult.defenseRebuttals) {
          if (closed) break;
          sendEvent({
            type: "speaker",
            role: "DEFENSE",
            text: "Defense is responding...",
          });
          await sleep(300);
          sendEvent({
            type: "message",
            role: "DEFENSE",
            text: rebuttal.text,
            citedExhibitIds: rebuttal.citedExhibitIds,
          });
          await sleep(pace.betweenRebuttals);
        }

        await sleep(pace.beforeJury);
        sendEvent({
          type: "phase",
          phase: "jury",
          text: "Jury is deliberating...",
        });
        await sleep(pace.deliberation);

        for (const vote of trialResult.juryVotes) {
          if (closed) break;
          sendEvent({ type: "jury_vote", vote });
          await sleep(pace.betweenVotes);
        }

        await sleep(pace.beforeVerdict);

        sendEvent({
          type: "verdict",
          verdict: trialResult.finalVerdict,
          sentence: trialResult.sentence,
          rejectCount: trialResult.juryVotes.filter((v) => v.verdict === "REJECT").length,
          retryCount: trialResult.juryVotes.filter((v) => v.verdict === "RETRY").length,
          approveCount: trialResult.juryVotes.filter((v) => v.verdict === "APPROVE").length,
        });

        // Persist final state
        await db.cases.update({
          where: { id: caseId },
          data: {
            verdict: trialResult.finalVerdict,
            sentence: trialResult.sentence,
            status: "COMPLETED",
          },
        });

        sendEvent({ type: "done" });
        close();
      } catch (error) {
        console.error("[Stream] Error:", error);
        sendEvent({ type: "error", message: String(error) });
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
