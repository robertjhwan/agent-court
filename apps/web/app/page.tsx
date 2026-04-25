"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, Plus, Play, Loader2, Zap } from "lucide-react";

type CaseListItem = {
  id: string;
  task: string;
  status: string;
  verdict: string | null;
  sentence: string | null;
  createdAt: string;
};

const DEMO_TASK =
  "Find the cheapest refundable flight from San Francisco to New York next Friday and prepare a booking recommendation.";

export default function HomePage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const styleInjected = useRef(false);
  const launchInFlight = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    if (typeof document !== "undefined" && !document.getElementById("home-keyframes")) {
      const s = document.createElement("style");
      s.id = "home-keyframes";
      s.textContent = `
        @keyframes hero-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.55), 0 0 30px rgba(251, 191, 36, 0.35); }
          50% { box-shadow: 0 0 0 18px rgba(251, 191, 36, 0), 0 0 60px rgba(251, 191, 36, 0.55); }
        }
        @keyframes orbit { 0% { transform: rotate(0deg) translateX(120px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); } }
        @keyframes fade-in-soft { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    fetch("/api/cases")
      .then((res) => res.json())
      .then((data) => {
        setCases(data.cases || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const launchTrial = async (mode: "demo" | "manual" | "live") => {
    if (launchInFlight.current) return;
    launchInFlight.current = true;
    setLaunching(true);
    try {
      const task =
        mode === "live"
          ? "Find the cheapest refundable flight from SFO to JFK on 2026-05-02 that satisfies our company policy, and recommend it for booking."
          : DEMO_TASK;
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const data = await res.json();
      const qs =
        mode === "live"
          ? "?live=true"
          : mode === "demo"
            ? "?demo=true"
            : "?demo=false";
      router.push(`/trial/${data.caseId}${qs}`);
    } catch {
      launchInFlight.current = false;
      setLaunching(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b1220", color: "#e5e7eb" }}>
      <header
        style={{
          borderBottom: "1px solid #1e293b",
          background: "rgba(11, 18, 32, 0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Scale style={{ width: "1.6rem", height: "1.6rem", color: "#fbbf24" }} />
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "Georgia, serif" }}>
                Agent Court
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>AI Agent Governance System</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", fontSize: "0.72rem", color: "#64748b" }}>
            <span style={{ padding: "0.2rem 0.5rem", borderRadius: 4, background: "#10b98115", color: "#10b981", border: "1px solid #10b98140" }}>
              WunderGraph
            </span>
            <span style={{ padding: "0.2rem 0.5rem", borderRadius: 4, background: "#3b82f615", color: "#3b82f6", border: "1px solid #3b82f640" }}>
              TinyFish
            </span>
            <span style={{ padding: "0.2rem 0.5rem", borderRadius: 4, background: "#8b5cf615", color: "#8b5cf6", border: "1px solid #8b5cf640" }}>
              Guild.ai
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        {/* HERO */}
        <section
          style={{
            position: "relative",
            background:
              "radial-gradient(circle at 30% 20%, rgba(251, 191, 36, 0.10) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #0b1220 100%)",
            border: "1px solid #1e293b",
            borderRadius: "1rem",
            padding: "3.5rem 2rem",
            textAlign: "center",
            overflow: "hidden",
            marginBottom: "2.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#fbbf24",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: "0.85rem",
              fontWeight: 600,
            }}
          >
            Put Your AI Agents On Trial
          </div>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 800,
              fontFamily: "Georgia, serif",
              marginBottom: "1rem",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Two agents. <span style={{ color: "#f59e0b" }}>One task.</span>
            <br />
            Let the court decide.
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "#94a3b8",
              maxWidth: 720,
              margin: "0 auto 2rem",
              lineHeight: 1.6,
            }}
          >
            A baseline agent stumbles through scattered REST calls and goes into debt. A
            WunderGraph-enabled agent finishes the same task in one federated call. A live
            judge, prosecutor, defense, and 5-juror panel debate the actual evidence — then
            deliver the sentence.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "1.4rem",
            }}
          >
            <button
              onClick={() => launchTrial("live")}
              disabled={launching}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.65rem",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#0b1220",
                fontWeight: 800,
                fontSize: "1.1rem",
                padding: "1.05rem 2.2rem",
                borderRadius: "0.65rem",
                border: "none",
                cursor: launching ? "wait" : "pointer",
                animation: launching ? undefined : "hero-pulse 2.4s ease-in-out infinite",
                boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.55), 0 0 30px rgba(16, 185, 129, 0.35)",
                transition: "transform 0.15s ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Zap style={{ width: "1.3rem", height: "1.3rem" }} fill="#0b1220" />
              {launching ? "Convening court\u2026" : "Run LIVE Trial"}
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -10,
                  background: "#0b1220",
                  color: "#10b981",
                  border: "1px solid #10b981",
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  padding: "0.15rem 0.45rem",
                  borderRadius: 999,
                  letterSpacing: "0.08em",
                }}
              >
                REAL LLM
              </span>
            </button>
            <button
              onClick={() => launchTrial("demo")}
              disabled={launching}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.65rem",
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                color: "#0b1220",
                fontWeight: 700,
                fontSize: "1rem",
                padding: "1.05rem 1.8rem",
                borderRadius: "0.65rem",
                border: "none",
                cursor: launching ? "wait" : "pointer",
                transition: "transform 0.15s ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Play style={{ width: "1.1rem", height: "1.1rem" }} fill="#0b1220" />
              Run Scripted Demo
            </button>
            <button
              onClick={() => launchTrial("manual")}
              disabled={launching}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "transparent",
                color: "#cbd5e1",
                fontWeight: 600,
                fontSize: "0.9rem",
                padding: "1.05rem 1.4rem",
                borderRadius: "0.65rem",
                border: "1px solid #334155",
                cursor: launching ? "wait" : "pointer",
              }}
            >
              <Plus style={{ width: "1.05rem", height: "1.05rem" }} />
              Scripted (no pacing)
            </button>
          </div>

          <div
            style={{
              fontSize: "0.7rem",
              color: "#64748b",
              maxWidth: 720,
              margin: "0 auto 2rem",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "#10b981" }}>LIVE</strong> = real OpenAI tool-use, real
            Apollo Federation 2 supergraph (WunderGraph spec), real TinyFish Fetch API, real
            LLM-driven jury verdicts ($\u22480.003/run, \u224820s).&nbsp;&nbsp;
            <strong style={{ color: "#fbbf24" }}>SCRIPTED</strong> = canned narrative with
            dramatic pacing (\u224850s). Both run end-to-end without breaking.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
              maxWidth: 760,
              margin: "0 auto",
              fontSize: "0.78rem",
              color: "#94a3b8",
            }}
          >
            <div style={{ padding: "0.85rem", background: "rgba(15, 23, 42, 0.6)", border: "1px solid #1e293b", borderRadius: "0.5rem" }}>
              <div style={{ color: "#fbbf24", fontWeight: 700, marginBottom: "0.25rem" }}>~50s</div>
              live courtroom drama
            </div>
            <div style={{ padding: "0.85rem", background: "rgba(15, 23, 42, 0.6)", border: "1px solid #1e293b", borderRadius: "0.5rem" }}>
              <div style={{ color: "#10b981", fontWeight: 700, marginBottom: "0.25rem" }}>5x</div>
              cheaper with WunderGraph
            </div>
            <div style={{ padding: "0.85rem", background: "rgba(15, 23, 42, 0.6)", border: "1px solid #1e293b", borderRadius: "0.5rem" }}>
              <div style={{ color: "#8b5cf6", fontWeight: 700, marginBottom: "0.25rem" }}>5</div>
              jurors with distinct rubrics
            </div>
          </div>
        </section>

        {/* WHAT YOU'LL SEE */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.85rem",
            marginBottom: "2.5rem",
          }}
        >
          {[
            { num: "01", title: "Two Agents Race", body: "Baseline & WunderGraph defendants execute the same task in parallel.", color: "#3b82f6" },
            { num: "02", title: "Live Budget Bars", body: "Watch the baseline overrun in real time as duplicate calls pile up.", color: "#f59e0b" },
            { num: "03", title: "Court Convenes", body: "Judge, prosecutor & defense argue from logged exhibits.", color: "#fbbf24" },
            { num: "04", title: "Jury Sentences", body: "Five jurors with different rubrics deliver the verdict.", color: "#8b5cf6" },
          ].map((step) => (
            <div
              key={step.num}
              style={{
                padding: "1.1rem",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid #1e293b",
                borderRadius: "0.6rem",
                animation: "fade-in-soft 0.5s ease-out",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  color: step.color,
                  fontFamily: "ui-monospace, monospace",
                  marginBottom: "0.4rem",
                }}
              >
                {step.num}
              </div>
              <div style={{ fontWeight: 700, marginBottom: "0.35rem", fontSize: "0.95rem" }}>
                {step.title}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.5 }}>
                {step.body}
              </div>
            </div>
          ))}
        </section>

        {/* DOCKET */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  fontFamily: "Georgia, serif",
                  marginBottom: "0.25rem",
                }}
              >
                Case Docket
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                Past trials and verdicts. Click any case to replay the trial.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Loading cases…</div>
          ) : cases.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem",
                background: "rgba(15, 23, 42, 0.4)",
                border: "1px dashed #1e293b",
                borderRadius: "0.6rem",
              }}
            >
              <Scale style={{ width: "2.5rem", height: "2.5rem", color: "#334155", margin: "0 auto 0.75rem" }} />
              <div style={{ color: "#94a3b8", marginBottom: "0.25rem" }}>No cases yet.</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                Hit the Run Live Demo button above to start your first trial.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {cases
                .slice()
                .reverse()
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/trial/${c.id}`}
                    style={{
                      display: "block",
                      padding: "1rem 1.1rem",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid #1e293b",
                      borderRadius: "0.55rem",
                      transition: "border-color 0.15s ease",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.45rem" }}>
                      <div style={{ fontWeight: 700, fontFamily: "Georgia, serif" }}>
                        People v. Agent-{c.id.slice(0, 6)}
                      </div>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: 999,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background:
                            c.status === "COMPLETED"
                              ? "rgba(16, 185, 129, 0.12)"
                              : "rgba(245, 158, 11, 0.12)",
                          color: c.status === "COMPLETED" ? "#10b981" : "#f59e0b",
                          border: `1px solid ${c.status === "COMPLETED" ? "#10b98140" : "#f59e0b40"}`,
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: c.verdict ? "0.5rem" : 0 }}>
                      {c.task}
                    </div>
                    {c.verdict && (
                      <div style={{ fontSize: "0.78rem", display: "flex", gap: "0.7rem", color: "#64748b" }}>
                        <span>
                          Verdict:{" "}
                          <span style={{ color: "#cbd5e1", fontFamily: "ui-monospace, monospace" }}>
                            {c.verdict}
                          </span>
                        </span>
                        {c.sentence && (
                          <span>
                            Sentence:{" "}
                            <span style={{ color: "#fbbf24", fontFamily: "ui-monospace, monospace" }}>
                              {c.sentence}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
            </div>
          )}
        </section>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
