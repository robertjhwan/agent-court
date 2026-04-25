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

const BUDGET = 0.5;

type CourtEvent =
  | { kind: "message"; role: string; text: string; citedExhibitIds?: string[] }
  | { kind: "status"; text: string }
  | { kind: "phase"; phase: string; text: string };

export default function TrialPage() {
  const params = useParams();
  const search = useSearchParams();
  const caseId = params.caseId as string;
  const isDemo = search.get("demo") === "true";

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
  const [verdict, setVerdict] = useState<{ verdict: string; sentence: string; tally?: { reject: number; retry: number; approve: number } } | null>(null);
  const [notFound, setNotFound] = useState(false);

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

      eventSource = new EventSource(
        `/api/cases/${caseId}/stream${isDemo ? "?demo=true" : "?demo=false"}`
      );
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

          case "verdict":
            setVerdict({
              verdict: data.verdict,
              sentence: data.sentence,
              tally: {
                reject: data.rejectCount ?? 0,
                retry: data.retryCount ?? 0,
                approve: data.approveCount ?? 0,
              },
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

  const baselineOver = baselineCost > BUDGET;
  const wgOver = wgCost > BUDGET;
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
            <VerdictCard
              show={!!verdict}
              verdict={verdict.verdict}
              sentence={verdict.sentence}
              tally={verdict.tally}
            />
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
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Limit ${BUDGET.toFixed(2)}</span>
            </div>
            <BudgetBar
              label="Defendant A — Baseline"
              variant="BASELINE"
              current={baselineCost}
              max={BUDGET}
              callCount={baselineCalls.length}
              pulse={baselineOver}
            />
            <BudgetBar
              label="Defendant B — WunderGraph"
              variant="WUNDERGRAPH"
              current={wgCost}
              max={BUDGET}
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
