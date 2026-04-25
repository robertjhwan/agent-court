"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  BudgetBar,
  CourtMessage,
  JuryGrid,
  LiveSpeaker,
  PhaseChip,
  StatusLine,
  ToolCallTicker,
  VerdictCard,
  type JuryVoteData,
  type StreamedToolCall,
} from "@/components/CourtUI";

const DEFAULT_BUDGET = 0.5;

function formatBudget(n: number) {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

function LiveStatsCard({ stats }: { stats: Record<string, unknown> }) {
  const baselineCost = Number(stats.baselineCost ?? 0);
  const wgCost = Number(stats.wgCost ?? 0);
  const baselineLlmCost = Number(stats.baselineLlmCost ?? baselineCost);
  const wgLlmCost = Number(stats.wgLlmCost ?? wgCost);
  const baselineToolCost = Number(stats.baselineToolCost ?? 0);
  const wgToolCost = Number(stats.wgToolCost ?? 0);
  const baselineCalls = Number(stats.baselineCalls ?? 0);
  const wgCalls = Number(stats.wgCalls ?? 0);
  const baselineTokens = Number(stats.baselineTokens ?? 0);
  const wgTokens = Number(stats.wgTokens ?? 0);
  const savingsPct = Number(stats.savingsPct ?? 0);
  const courtCost = Number(stats.courtCost ?? 0);
  const callRatio = wgCalls > 0 ? baselineCalls / wgCalls : 0;
  const tokenRatio = wgTokens > 0 ? baselineTokens / wgTokens : 0;
  const llmCostRatio = wgLlmCost > 0 ? baselineLlmCost / wgLlmCost : 0;

  const Row = ({ label, baseline, wg, ratio }: { label: string; baseline: string; wg: string; ratio?: string }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.7fr", gap: "0.6rem", alignItems: "center", fontSize: "0.82rem", padding: "0.5rem 0", borderBottom: "1px solid #1e293b" }}>
      <div style={{ color: "#94a3b8" }}>{label}</div>
      <div style={{ color: "#f59e0b", fontFamily: "ui-monospace, monospace" }}>{baseline}</div>
      <div style={{ color: "#10b981", fontFamily: "ui-monospace, monospace" }}>{wg}</div>
      <div style={{ color: "#fca5a5", fontFamily: "ui-monospace, monospace", textAlign: "right", fontSize: "0.78rem" }}>{ratio ?? ""}</div>
    </div>
  );

  return (
    <div
      style={{
        marginTop: "1rem",
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.6))",
        border: "1px solid rgba(16, 185, 129, 0.4)",
        borderRadius: "0.6rem",
        padding: "1rem 1.1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
        <h3 style={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "Georgia, serif", color: "#e5e7eb" }}>
          Live Run \u2014 Real Numbers
        </h3>
        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
          OpenAI gpt-4o-mini \u00b7 Apollo Federation 2
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.7fr", gap: "0.6rem", paddingBottom: "0.4rem", borderBottom: "1px solid #334155", fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        <div></div>
        <div>Baseline</div>
        <div>WunderGraph</div>
        <div style={{ textAlign: "right" }}>Multiple</div>
      </div>
      <Row label="LLM cost" baseline={formatBudget(baselineLlmCost)} wg={formatBudget(wgLlmCost)} ratio={llmCostRatio > 0 ? `${llmCostRatio.toFixed(1)}x` : ""} />
      <Row label="Tool calls" baseline={String(baselineCalls)} wg={String(wgCalls)} ratio={callRatio > 0 ? `${callRatio.toFixed(1)}x` : ""} />
      <Row label="Tokens" baseline={baselineTokens.toLocaleString()} wg={wgTokens.toLocaleString()} ratio={tokenRatio > 0 ? `${tokenRatio.toFixed(1)}x` : ""} />
      <Row
        label="Tool/infra cost"
        baseline={formatBudget(baselineToolCost)}
        wg={formatBudget(wgToolCost)}
        ratio={baselineToolCost === wgToolCost ? "tied" : ""}
      />
      <div style={{ marginTop: "0.7rem", padding: "0.6rem 0.8rem", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.35)", borderRadius: "0.4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem" }}>WunderGraph LLM savings</span>
        <span style={{ color: "#10b981", fontWeight: 800, fontSize: "1.1rem", fontFamily: "ui-monospace, monospace" }}>
          {savingsPct.toFixed(1)}%
        </span>
      </div>
      <div style={{ marginTop: "0.5rem", fontSize: "0.68rem", color: "#64748b", textAlign: "right" }}>
        Total \u00b7 Baseline {formatBudget(baselineCost)} \u00b7 WunderGraph {formatBudget(wgCost)} \u00b7 Court {formatBudget(courtCost)}
      </div>
    </div>
  );
}

type CourtEvent =
  | { kind: "message"; role: string; text: string; citedExhibitIds?: string[] }
  | { kind: "status"; text: string }
  | { kind: "phase"; phase: string; text: string };

export default function TrialPage() {
  const params = useParams();
  const search = useSearchParams();
  const caseId = params.caseId as string;
  const isDemo = search.get("demo") === "true";
  const isLive = search.get("live") === "true";

  const [caseTask, setCaseTask] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [phaseText, setPhaseText] = useState<string | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [courtEvents, setCourtEvents] = useState<CourtEvent[]>([]);

  const [baselineCalls, setBaselineCalls] = useState<StreamedToolCall[]>([]);
  const [wgCalls, setWgCalls] = useState<StreamedToolCall[]>([]);
  const [baselineCost, setBaselineCost] = useState(0);
  const [wgCost, setWgCost] = useState(0);

  const [juryVotes, setJuryVotes] = useState<JuryVoteData[]>([]);
  const [verdict, setVerdict] = useState<{ verdict: string; sentence: string; tally?: { reject: number; retry: number; approve: number }; stats?: Record<string, unknown> } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET);

  const courtScrollRef = useRef<HTMLDivElement>(null);
  const streamStartedFor = useRef<string | null>(null);

  useEffect(() => {
    // Guard: only open one EventSource per caseId, even if React re-mounts.
    if (streamStartedFor.current === caseId) return;
    streamStartedFor.current = caseId;

    let cancelled = false;
    let eventSource: EventSource | null = null;

    // Verify the case exists before opening the stream so we can show a
    // friendly UI instead of a generic stream error if the in-process store
    // was wiped (e.g. dev server restarted).
    (async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}`);
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setCaseTask(data?.task ?? null);
      } catch {
        // Network blip — let the stream try anyway.
      }

      if (cancelled) return;

      const qs = isLive
        ? "?live=true"
        : isDemo
          ? "?demo=true"
          : "?demo=false";
      eventSource = new EventSource(`/api/cases/${caseId}/stream${qs}`);
      attachStreamHandlers(eventSource);
    })();

    function attachStreamHandlers(es: EventSource) {
      es.onmessage = (event) => {
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (data.type) {
          case "phase":
            setPhase(data.phase);
            setPhaseText(data.text);
            setCourtEvents((prev) => [...prev, { kind: "phase", phase: data.phase, text: data.text }]);
            break;

          case "speaker":
            setCurrentSpeaker(data.role);
            break;

          case "tool_call": {
            const call: StreamedToolCall = {
              tool: data.call.tool,
              cost: data.call.cost,
              latencyMs: data.call.latencyMs,
              variant: data.variant,
            };
            if (data.variant === "BASELINE") {
              setBaselineCalls((prev) => [...prev, call]);
              setBaselineCost(data.runningCost);
            } else {
              setWgCalls((prev) => [...prev, call]);
              setWgCost(data.runningCost);
            }
            break;
          }

          case "tool_call_complete":
            if (data.variant === "BASELINE") setBaselineCost(data.totalCost);
            if (data.variant === "WUNDERGRAPH") setWgCost(data.totalCost);
            break;

          case "agent_complete":
            if (data.variant === "BASELINE") setBaselineCost(data.run.totalCost);
            if (data.variant === "WUNDERGRAPH") setWgCost(data.run.totalCost);
            break;

          case "message":
            setCurrentSpeaker(null);
            setCourtEvents((prev) => [
              ...prev,
              {
                kind: "message",
                role: data.role,
                text: data.text,
                citedExhibitIds: data.citedExhibitIds,
              },
            ]);
            break;

          case "jury_vote":
            setJuryVotes((prev) => [...prev, data.vote]);
            break;

          case "budget":
            if (typeof data.budget === "number") setBudget(data.budget);
            break;

          case "verdict":
            setVerdict({
              verdict: data.verdict,
              sentence: data.sentence,
              tally: {
                reject: data.rejectCount ?? 0,
                retry: data.retryCount ?? 0,
                approve: data.approveCount ?? 0,
              },
              stats: data.stats,
            });
            setCurrentSpeaker(null);
            break;

          case "done":
            es.close();
            break;

          case "error":
            if (data.message === "Case not found") {
              setNotFound(true);
            } else {
              setCourtEvents((prev) => [...prev, { kind: "status", text: `Error: ${data.message}` }]);
            }
            es.close();
            break;
        }
      };

      es.onerror = () => {
        es.close();
      };
    }

    return () => {
      cancelled = true;
      eventSource?.close();
      if (streamStartedFor.current === caseId) {
        streamStartedFor.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // Auto-scroll the courtroom panel as new events arrive.
  useEffect(() => {
    courtScrollRef.current?.scrollTo({
      top: courtScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [courtEvents.length, currentSpeaker]);

  const baselineOver = baselineCost > budget;
  const wgOver = wgCost > budget;
  const trialOver = verdict !== null;

  const heroSubtitle = useMemo(() => {
    if (trialOver) return verdict?.sentence ?? "";
    if (phaseText) return phaseText;
    return "Awaiting trial to begin…";
  }, [trialOver, verdict, phaseText]);

  if (notFound) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b1220",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: 520,
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            borderRadius: 16,
            padding: "2.25rem",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
          }}
        >
          <Scale size={44} style={{ color: "#fbbf24", margin: "0 auto 1rem" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Case file not in the docket
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem", lineHeight: 1.55 }}>
            This case ID isn&apos;t in our records. The dev server may have
            restarted and cleared older cases. Convene a fresh trial to continue.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              color: "#0b1220",
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={18} />
            Back to docket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b1220", color: "#e5e7eb" }}>
      <header
        style={{
          borderBottom: "1px solid #1e293b",
          background: "rgba(11, 18, 32, 0.85)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0.9rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Link
              href="/"
              style={{
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.85rem",
              }}
            >
              <ArrowLeft style={{ width: "1.1rem", height: "1.1rem" }} />
              Docket
            </Link>
            <div style={{ height: 20, width: 1, background: "#334155" }} />
            <Scale style={{ width: "1.4rem", height: "1.4rem", color: "#fbbf24" }} />
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "Georgia, serif" }}>
                People v. Agent-{caseId.slice(0, 6)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{heroSubtitle}</div>
            </div>
          </div>
          {phase && !trialOver && <PhaseChip phase={phase} text={phaseText ?? ""} />}
        </div>
      </header>

      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "1.5rem",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: "1.25rem",
        }}
      >
        {/* LEFT: Courtroom + jury + verdict */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
          {caseTask && (
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "0.5rem",
                background: "rgba(251, 191, 36, 0.06)",
                border: "1px solid rgba(251, 191, 36, 0.25)",
                fontSize: "0.82rem",
                color: "#cbd5e1",
              }}
            >
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "#fbbf24",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: "0.25rem",
                }}
              >
                Task on Trial
              </div>
              {caseTask}
            </div>
          )}

          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "0.6rem",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.7rem",
              minHeight: 360,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "Georgia, serif" }}>
                Courtroom
              </h2>
              <LiveSpeaker role={currentSpeaker} />
            </div>

            <div
              ref={courtScrollRef}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
                maxHeight: 500,
                overflowY: "auto",
                paddingRight: "0.25rem",
              }}
            >
              {courtEvents.length === 0 && !currentSpeaker ? (
                <StatusLine text="Awaiting opening statement…" />
              ) : (
                courtEvents.map((evt, idx) => {
                  if (evt.kind === "message") {
                    return (
                      <CourtMessage
                        key={idx}
                        role={evt.role}
                        text={evt.text}
                        citedExhibitIds={evt.citedExhibitIds}
                      />
                    );
                  }
                  if (evt.kind === "phase") {
                    return <StatusLine key={idx} text={`— ${evt.text} —`} />;
                  }
                  return <StatusLine key={idx} text={evt.text} />;
                })
              )}
            </div>
          </div>

          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "0.6rem",
              padding: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "Georgia, serif" }}>
                Jury
              </h2>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                {juryVotes.length} / 5 votes in
              </span>
            </div>
            <JuryGrid votes={juryVotes} />
          </div>

          {verdict && (
            <>
              <VerdictCard
                show={!!verdict}
                verdict={verdict.verdict}
                sentence={verdict.sentence}
                tally={verdict.tally}
              />
              {verdict.stats && <LiveStatsCard stats={verdict.stats} />}
            </>
          )}
        </div>

        {/* RIGHT: Live ledgers + tool calls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "0.6rem",
              padding: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "Georgia, serif" }}>
                Budget Ledger
              </h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Limit {formatBudget(budget)}</span>
            </div>
            <BudgetBar
              label="Defendant A — Baseline"
              variant="BASELINE"
              current={baselineCost}
              max={budget}
              callCount={baselineCalls.length}
              pulse={baselineOver}
            />
            <BudgetBar
              label="Defendant B — WunderGraph"
              variant="WUNDERGRAPH"
              current={wgCost}
              max={budget}
              callCount={wgCalls.length}
              pulse={wgOver}
            />

            {(baselineOver || wgOver) && (
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.72rem",
                  color: "#fca5a5",
                  textAlign: "center",
                }}
              >
                ⚠ Budget violation detected — automatic conviction trigger armed
              </div>
            )}
          </div>

          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "0.6rem",
              padding: "1rem",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                fontFamily: "Georgia, serif",
                marginBottom: "0.75rem",
              }}
            >
              Tool Calls (Live)
            </h2>
            <ToolCallTicker variant="BASELINE" calls={baselineCalls} />
            <ToolCallTicker variant="WUNDERGRAPH" calls={wgCalls} />
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(11, 18, 32, 0.95))",
              border: "1px solid #1e293b",
              borderRadius: "0.6rem",
              padding: "0.95rem",
              fontSize: "0.72rem",
              color: "#94a3b8",
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: "#cbd5e1", marginBottom: "0.35rem", letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.65rem" }}>
              Sponsor Stack
            </div>
            <div>
              <strong style={{ color: "#10b981" }}>WunderGraph</strong> federates flights + policy via MCP supergraph ·{" "}
              <strong style={{ color: "#3b82f6" }}>TinyFish</strong> captures evidence from the live web ·{" "}
              <strong style={{ color: "#8b5cf6" }}>Guild.ai</strong> logs every tool call as a courtroom exhibit.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
