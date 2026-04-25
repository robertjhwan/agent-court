import { runBaselineAgent, runWunderGraphAgent } from "@/lib/agents/agent-runners";
import { conductTrial } from "@/lib/agents/court-orchestrator";
import {
  runBaselineAgentLive,
  runWunderGraphAgentLive,
  type LiveToolCall,
} from "@/lib/agents/agents-live";
import { conductTrialLive, computeBudget } from "@/lib/agents/court-live";
import { db } from "@/lib/db";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const url = new URL(request.url);
  // Live mode runs real OpenAI agents + real LLM court. Bypasses the
  // scripted narrative entirely.
  const liveMode = url.searchParams.get("live") === "true";
  // Demo mode (legacy scripted path) adds dramatic pacing for live presentations.
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

        // ============================================================
        // LIVE MODE: real OpenAI agents + real LLM court
        // ============================================================
        if (liveMode) {
          await runLiveTrial(caseData, sendEvent, close, () => closed);
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

// ===================================================================
// LIVE TRIAL: real OpenAI agents + real LLM court (no scripted text).
// ===================================================================
async function runLiveTrial(
  caseData: { id: string; task: string },
  sendEvent: (data: unknown) => void,
  close: () => void,
  isClosed: () => boolean
) {
  try {
    sendEvent({ type: "connected", caseId: caseData.id, liveMode: true });
    sendEvent({
      type: "phase",
      phase: "agents",
      text: "Dispatching live OpenAI agents (real LLM + real federation)...",
    });

    let baselineRunningCost = 0;
    let wgRunningCost = 0;
    let baselineCallIdx = 0;
    let wgCallIdx = 0;

    const onBaselineCall = (call: LiveToolCall) => {
      if (isClosed()) return;
      baselineRunningCost += call.cost;
      sendEvent({
        type: "tool_call",
        variant: "BASELINE",
        index: baselineCallIdx++,
        call: { tool: call.tool, cost: call.cost, latencyMs: call.latencyMs, input: call.input, output: call.output },
        runningCost: baselineRunningCost,
      });
    };
    const onWgCall = (call: LiveToolCall) => {
      if (isClosed()) return;
      wgRunningCost += call.cost;
      sendEvent({
        type: "tool_call",
        variant: "WUNDERGRAPH",
        index: wgCallIdx++,
        call: { tool: call.tool, cost: call.cost, latencyMs: call.latencyMs, input: call.input, output: call.output },
        runningCost: wgRunningCost,
      });
    };

    // Run both agents in parallel \u2014 real LLM tool-use loops.
    sendEvent({ type: "agent_start", variant: "BASELINE", totalCalls: 0 });
    sendEvent({ type: "agent_start", variant: "WUNDERGRAPH", totalCalls: 0 });

    const [baselineRun, wgRun] = await Promise.all([
      runBaselineAgentLive(caseData.task, onBaselineCall),
      runWunderGraphAgentLive(caseData.task, onWgCall),
    ]);

    if (isClosed()) return;

    // Compute the LLM portion of cost for the running totals
    sendEvent({ type: "tool_call_complete", variant: "BASELINE", llmCost: baselineRun.llmCost, totalCost: baselineRun.totalCost, totalCalls: baselineRun.toolCalls.length });
    sendEvent({ type: "tool_call_complete", variant: "WUNDERGRAPH", llmCost: wgRun.llmCost, totalCost: wgRun.totalCost, totalCalls: wgRun.toolCalls.length });

    // Final agent summaries with real numbers
    sendEvent({
      type: "agent_complete",
      variant: "BASELINE",
      run: {
        toolCalls: baselineRun.toolCalls,
        totalCost: baselineRun.totalCost,
        summary: baselineRun.summary,
        recommendation: baselineRun.recommendation,
      },
    });
    sendEvent({
      type: "agent_complete",
      variant: "WUNDERGRAPH",
      run: {
        toolCalls: wgRun.toolCalls,
        totalCost: wgRun.totalCost,
        summary: wgRun.summary,
        recommendation: wgRun.recommendation,
      },
    });

    // Adaptive budget = 1.5\u00d7 what WunderGraph proved possible.
    const budget = computeBudget(wgRun);
    sendEvent({ type: "budget", budget });

    await sleep(600);

    // ---- Court phase ----
    sendEvent({
      type: "phase",
      phase: "court",
      text: "Convening court \u2014 GPT-4o-mini will judge, prosecute, defend, and deliberate.",
    });
    await sleep(400);

    const trial = await conductTrialLive(caseData.task, baselineRun, wgRun, budget, (event) => {
      if (isClosed()) return;
      if (event.kind === "phase") {
        // Internal court phase markers \u2014 useful for "thinking" indicators.
        sendEvent({ type: "court_phase", phase: event.payload });
      }
      // Note: jury_vote is intentionally NOT forwarded here. We emit them
      // during the paced playback below so they animate in one-by-one.
    });

    if (isClosed()) return;

    // ---- Stream the LLM-generated court speeches ----
    sendEvent({ type: "speaker", role: "JUDGE", text: "Judge presiding..." });
    sendEvent({ type: "message", role: "JUDGE", text: trial.openingStatement });
    await sleep(800);

    for (const charge of trial.prosecutionCharges) {
      if (isClosed()) break;
      sendEvent({ type: "speaker", role: "PROSECUTOR", text: "Prosecutor presenting..." });
      await sleep(250);
      sendEvent({
        type: "message",
        role: "PROSECUTOR",
        text: charge.text,
        citedExhibitIds: charge.citedExhibitIds,
      });
      await sleep(900);
    }

    for (const rebuttal of trial.defenseRebuttals) {
      if (isClosed()) break;
      sendEvent({ type: "speaker", role: "DEFENSE", text: "Defense responding..." });
      await sleep(250);
      sendEvent({
        type: "message",
        role: "DEFENSE",
        text: rebuttal.text,
        citedExhibitIds: rebuttal.citedExhibitIds,
      });
      await sleep(900);
    }

    sendEvent({
      type: "phase",
      phase: "jury",
      text: `Jury deliberating (5 LLM jurors with distinct rubrics, votes already cast in parallel)...`,
    });
    await sleep(600);

    // Re-emit jury votes one-by-one so the UI animates them in
    for (const vote of trial.juryVotes) {
      if (isClosed()) break;
      sendEvent({ type: "jury_vote", vote });
      await sleep(280);
    }

    await sleep(700);

    sendEvent({
      type: "verdict",
      verdict: trial.finalVerdict,
      sentence: trial.sentence,
      rejectCount: trial.juryVotes.filter((v) => v.verdict === "REJECT").length,
      retryCount: trial.juryVotes.filter((v) => v.verdict === "RETRY").length,
      approveCount: trial.juryVotes.filter((v) => v.verdict === "APPROVE").length,
      stats: {
        baselineCost: baselineRun.totalCost,
        wgCost: wgRun.totalCost,
        baselineCalls: baselineRun.toolCalls.length,
        wgCalls: wgRun.toolCalls.length,
        baselineTokens: baselineRun.promptTokens + baselineRun.completionTokens,
        wgTokens: wgRun.promptTokens + wgRun.completionTokens,
        savingsPct: baselineRun.totalCost > 0 ? ((baselineRun.totalCost - wgRun.totalCost) / baselineRun.totalCost) * 100 : 0,
        budget,
        courtCost: trial.llmCostUsd,
      },
    });

    await db.cases.update({
      where: { id: caseData.id },
      data: {
        verdict: trial.finalVerdict,
        sentence: trial.sentence,
        status: "COMPLETED",
      },
    });

    sendEvent({ type: "done" });
    close();
  } catch (error) {
    console.error("[Live Stream] Error:", error);
    sendEvent({ type: "error", message: (error as Error).message ?? String(error) });
    close();
  }
}
