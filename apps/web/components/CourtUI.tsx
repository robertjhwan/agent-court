"use client";

import { Gavel } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  JUDGE: "#fbbf24",
  PROSECUTOR: "#ef4444",
  DEFENSE: "#3b82f6",
  JUROR: "#8b5cf6",
};

const ROLE_LABELS: Record<string, string> = {
  JUDGE: "Judge",
  PROSECUTOR: "Prosecutor",
  DEFENSE: "Defense",
  JUROR: "Juror",
};

export const RoleBadge = ({ role }: { role: string }) => {
  const color = ROLE_COLORS[role] ?? "#94a3b8";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.18rem 0.55rem",
        borderRadius: "999px",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color,
        background: `${color}1A`,
        border: `1px solid ${color}55`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      {ROLE_LABELS[role] ?? role}
    </span>
  );
};

export const LiveSpeaker = ({ role }: { role: string | null }) => {
  if (!role) return null;
  const color = ROLE_COLORS[role] ?? "#94a3b8";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.55rem 0.9rem",
        borderRadius: "0.5rem",
        background: `${color}14`,
        border: `1px solid ${color}40`,
        animation: "fade-in 0.3s ease-out",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 12px ${color}`,
          animation: "pulse-dot 1s infinite",
        }}
      />
      <span style={{ fontSize: "0.8rem", color, fontWeight: 600, letterSpacing: "0.03em" }}>
        {ROLE_LABELS[role] ?? role} is speaking…
      </span>
    </div>
  );
};

export const CourtMessage = ({
  role,
  text,
  citedExhibitIds,
}: {
  role: string;
  text: string;
  citedExhibitIds?: string[];
}) => {
  const color = ROLE_COLORS[role] ?? "#94a3b8";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "0.85rem 1rem",
        borderRadius: "0.5rem",
        background: "rgba(15, 23, 42, 0.45)",
        borderLeft: `3px solid ${color}`,
        animation: "fade-in 0.4s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RoleBadge role={role} />
        {citedExhibitIds && citedExhibitIds.length > 0 && (
          <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
            cites {citedExhibitIds.join(", ")}
          </span>
        )}
      </div>
      <div style={{ fontSize: "0.875rem", lineHeight: 1.55, color: "#e2e8f0" }}>{text}</div>
    </div>
  );
};

export const StatusLine = ({ text }: { text: string }) => (
  <div
    style={{
      fontSize: "0.78rem",
      color: "#94a3b8",
      fontStyle: "italic",
      padding: "0.4rem 0",
      animation: "fade-in 0.3s ease-out",
    }}
  >
    {text}
  </div>
);

export const BudgetBar = ({
  label,
  variant,
  current,
  max,
  callCount,
  pulse,
}: {
  label: string;
  variant: "BASELINE" | "WUNDERGRAPH";
  current: number;
  max: number;
  callCount: number;
  pulse?: boolean;
}) => {
  const percentage = Math.min((current / max) * 100, 100);
  const overBudget = current > max;
  const barColor = overBudget ? "#ef4444" : variant === "WUNDERGRAPH" ? "#10b981" : "#f59e0b";

  return (
    <div
      style={{
        marginBottom: "0.85rem",
        padding: "0.75rem",
        borderRadius: "0.5rem",
        background: overBudget ? "rgba(239, 68, 68, 0.08)" : "rgba(15, 23, 42, 0.5)",
        border: overBudget ? "1px solid rgba(239, 68, 68, 0.45)" : "1px solid #334155",
        animation: overBudget ? "alert-flash 0.6s ease-out" : undefined,
      }}
    >
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          marginBottom: "0.45rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: variant === "WUNDERGRAPH" ? "#10b981" : "#f59e0b" }}>{label}</span>
        <span style={{ fontFamily: "ui-monospace, monospace", color: overBudget ? "#fca5a5" : "#cbd5e1" }}>
          ${current.toFixed(3)} / ${max.toFixed(2)}
          {overBudget && <span style={{ marginLeft: "0.4rem", fontWeight: 700 }}>OVER</span>}
        </span>
      </div>
      <div
        style={{
          background: "#0f172a",
          borderRadius: "0.4rem",
          height: "1.4rem",
          position: "relative",
          overflow: "hidden",
          border: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            background: barColor,
            height: "100%",
            width: `${percentage}%`,
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            boxShadow: pulse ? `0 0 12px ${barColor}` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
              animation: "shimmer 2.2s infinite",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }}
        >
          {percentage.toFixed(0)}%
        </div>
      </div>
      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.4rem" }}>
        {callCount} tool call{callCount === 1 ? "" : "s"}
      </div>
    </div>
  );
};

export type StreamedToolCall = {
  tool: string;
  cost: number;
  latencyMs: number;
  variant: "BASELINE" | "WUNDERGRAPH";
};

export const ToolCallTicker = ({
  variant,
  calls,
}: {
  variant: "BASELINE" | "WUNDERGRAPH";
  calls: StreamedToolCall[];
}) => {
  const accent = variant === "WUNDERGRAPH" ? "#10b981" : "#f59e0b";
  const label = variant === "WUNDERGRAPH" ? "WunderGraph Agent" : "Baseline Agent";

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {calls.length === 0 ? (
          <div style={{ fontSize: "0.72rem", color: "#64748b", fontStyle: "italic" }}>
            Waiting for tool calls…
          </div>
        ) : (
          calls.map((call, i) => {
            const isDuplicate =
              variant === "BASELINE" &&
              calls.slice(0, i).some((c) => c.tool === call.tool);
            return (
              <div
                key={i}
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "ui-monospace, monospace",
                  padding: "0.35rem 0.55rem",
                  borderRadius: "0.3rem",
                  background: isDuplicate ? "rgba(239, 68, 68, 0.1)" : "rgba(15, 23, 42, 0.7)",
                  border: isDuplicate ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #1e293b",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                  animation: "fade-in-right 0.35s ease-out",
                }}
              >
                <span style={{ color: isDuplicate ? "#fca5a5" : "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isDuplicate && <span style={{ marginRight: "0.3rem" }}>↻</span>}
                  {call.tool}
                </span>
                <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
                  ${call.cost.toFixed(3)} · {call.latencyMs}ms
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export type JuryVoteData = {
  jurorId: number;
  rubric: string;
  verdict: "APPROVE" | "REJECT" | "RETRY" | "ESCALATE";
  rationale: string;
};

export const JuryGrid = ({ votes }: { votes: JuryVoteData[] }) => {
  const slots: (JuryVoteData | null)[] = Array.from({ length: 5 }, (_, i) => votes[i] ?? null);

  const colorFor = (verdict?: string) => {
    if (verdict === "APPROVE") return "#10b981";
    if (verdict === "REJECT") return "#ef4444";
    if (verdict === "RETRY") return "#f59e0b";
    return "#64748b";
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
      {slots.map((vote, i) => {
        const color = colorFor(vote?.verdict);
        return (
          <div
            key={i}
            title={vote?.rationale ?? "Awaiting vote"}
            style={{
              padding: "0.7rem 0.4rem",
              borderRadius: "0.45rem",
              background: vote ? `${color}10` : "#0f172a",
              border: vote ? `1px solid ${color}55` : "1px dashed #334155",
              textAlign: "center",
              transition: "all 0.3s ease",
              animation: vote ? "fade-in-up 0.4s ease-out" : undefined,
            }}
          >
            <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
              Juror {i + 1}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.78rem",
                color,
                letterSpacing: "0.03em",
              }}
            >
              {vote ? vote.verdict : "…"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const VerdictCard = ({
  verdict,
  sentence,
  show,
  tally,
}: {
  verdict: string;
  sentence: string;
  show: boolean;
  tally?: { reject: number; retry: number; approve: number };
}) => {
  if (!show) return null;
  const isWG = sentence?.includes("WUNDERGRAPH");
  const accent = isWG ? "#fbbf24" : verdict === "APPROVED" ? "#10b981" : "#ef4444";

  return (
    <div
      style={{
        position: "relative",
        animation: "card-flip 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
        transformStyle: "preserve-3d",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
        border: `2px solid ${accent}`,
        borderRadius: "0.75rem",
        padding: "1.75rem 1.5rem",
        textAlign: "center",
        boxShadow: `0 0 40px ${accent}40, inset 0 0 20px ${accent}10`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 0%, ${accent}20 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ animation: "gavel-slam 0.6s ease-out", display: "inline-block" }}>
          <Gavel style={{ width: "3rem", height: "3rem", color: accent, marginBottom: "0.5rem" }} />
        </div>
        <div
          style={{
            fontSize: "0.7rem",
            color: "#94a3b8",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "0.4rem",
          }}
        >
          The Court Has Reached A Verdict
        </div>
        <div
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            color: accent,
            letterSpacing: "0.02em",
            marginBottom: "0.5rem",
            fontFamily: "Georgia, serif",
          }}
        >
          {verdict}
        </div>
        {tally && (
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Jury tally: {tally.approve} approve · {tally.retry} retry · {tally.reject} reject
          </div>
        )}
        <div
          style={{
            display: "inline-block",
            padding: "0.55rem 1.1rem",
            borderRadius: "0.4rem",
            background: `${accent}18`,
            border: `1px solid ${accent}55`,
            fontSize: "0.95rem",
            fontWeight: 700,
            fontFamily: "ui-monospace, monospace",
            color: accent,
            letterSpacing: "0.03em",
          }}
        >
          SENTENCE: {sentence}
        </div>
      </div>
    </div>
  );
};

export const PhaseChip = ({ phase, text }: { phase: string; text: string }) => {
  const colors: Record<string, string> = {
    agents: "#3b82f6",
    court: "#fbbf24",
    jury: "#8b5cf6",
  };
  const color = colors[phase] ?? "#94a3b8";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.45rem 0.9rem",
        borderRadius: "999px",
        background: `${color}15`,
        border: `1px solid ${color}40`,
        fontSize: "0.78rem",
        color,
        fontWeight: 600,
        animation: "fade-in 0.3s ease-out",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          animation: "pulse-dot 1.2s infinite",
        }}
      />
      {text}
    </div>
  );
};

// Inject CSS keyframes once.
if (typeof document !== "undefined" && !document.getElementById("court-ui-keyframes")) {
  const style = document.createElement("style");
  style.id = "court-ui-keyframes";
  style.textContent = `
    @keyframes gavel-slam {
      0% { transform: rotate(0deg) translateY(0); }
      30% { transform: rotate(-25deg) translateY(-12px); }
      60% { transform: rotate(15deg) translateY(0); }
      100% { transform: rotate(0deg) translateY(0); }
    }
    @keyframes card-flip {
      0% { transform: rotateX(60deg) scale(0.85); opacity: 0; }
      60% { transform: rotateX(-10deg) scale(1.02); opacity: 1; }
      100% { transform: rotateX(0deg) scale(1); opacity: 1; }
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes fade-in-right {
      from { opacity: 0; transform: translateX(-8px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(0.85); }
    }
    @keyframes alert-flash {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      100% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.3); }
      50% { box-shadow: 0 0 50px rgba(251, 191, 36, 0.6); }
    }
    @keyframes hero-pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.5); }
      50% { transform: scale(1.02); box-shadow: 0 0 0 16px rgba(251, 191, 36, 0); }
    }
  `;
  document.head.appendChild(style);
}
