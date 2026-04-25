/**
 * Real OpenAI courtroom: the judge, prosecutor, defense, and 5 jurors are
 * each independent LLM calls that operate over the actual evidence (tool
 * call traces, costs, token counts, latencies) produced by the real agents.
 *
 * No hardcoded charges or verdicts \u2014 the model genuinely argues both sides
 * and renders verdicts based on the rubrics.
 */
import OpenAI from "openai";
import type { LiveAgentResult } from "./agents-live";

const MODEL = "gpt-4o-mini";

export type CharOrRebuttal = {
  text: string;
  citedExhibitIds: string[];
};

export type LiveJuryVote = {
  jurorId: number;
  rubric: string;
  scores: Record<string, number>;
  verdict: "APPROVE" | "REJECT" | "RETRY";
  rationale: string;
};

export type LiveTrialResult = {
  openingStatement: string;
  prosecutionCharges: CharOrRebuttal[];
  defenseRebuttals: CharOrRebuttal[];
  juryVotes: LiveJuryVote[];
  finalVerdict: string;
  sentence: string;
  llmCostUsd: number;
  promptTokens: number;
  completionTokens: number;
};

// ---------- Helpers --------------------------------------------------------

const PRICE_INPUT = 0.15 / 1_000_000;
const PRICE_OUTPUT = 0.60 / 1_000_000;

function client() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function buildExhibitTable(run: LiveAgentResult): string {
  return run.toolCalls
    .map((c, i) => {
      const exhibit = `${run.variant === "BASELINE" ? "B" : "W"}-${i + 1}`;
      const inputStr = JSON.stringify(c.input).slice(0, 120);
      const outputStr = JSON.stringify(c.output).slice(0, 200);
      return `Exhibit ${exhibit}: tool=${c.tool} input=${inputStr} output=${outputStr} latency=${c.latencyMs}ms cost=$${c.cost.toFixed(4)}`;
    })
    .join("\n");
}

/**
 * Find redundant calls: same tool name + identical input fingerprint = duplicate.
 * Returns a human-readable list naming the offending exhibit IDs.
 */
function detectDuplicates(run: LiveAgentResult): string[] {
  const prefix = run.variant === "BASELINE" ? "B" : "W";
  const seen = new Map<string, number[]>();
  run.toolCalls.forEach((c, i) => {
    const fp = `${c.tool}::${JSON.stringify(c.input)}`;
    const list = seen.get(fp) ?? [];
    list.push(i + 1);
    seen.set(fp, list);
  });
  const dups: string[] = [];
  for (const [fp, indices] of seen) {
    if (indices.length > 1) {
      const tool = fp.split("::")[0];
      const exhibits = indices.map((i) => `${prefix}-${i}`).join(", ");
      dups.push(`${tool} called ${indices.length}x with identical input (Exhibits ${exhibits})`);
    }
  }
  return dups;
}

function buildEvidenceSummary(baseline: LiveAgentResult, wundergraph: LiveAgentResult, budget: number): string {
  const baselineDups = detectDuplicates(baseline);
  const wgDups = detectDuplicates(wundergraph);
  const llmRatio = wundergraph.llmCost > 0 ? baseline.llmCost / wundergraph.llmCost : Infinity;
  const totalRatio = wundergraph.totalCost > 0 ? baseline.totalCost / wundergraph.totalCost : Infinity;
  const callRatio = wundergraph.toolCalls.length > 0 ? baseline.toolCalls.length / wundergraph.toolCalls.length : Infinity;
  const tokenRatio =
    wundergraph.promptTokens + wundergraph.completionTokens > 0
      ? (baseline.promptTokens + baseline.completionTokens) / (wundergraph.promptTokens + wundergraph.completionTokens)
      : Infinity;

  return [
    `=== TASK ===`,
    `Find the cheapest refundable flight from SFO to JFK satisfying company policy.`,
    ``,
    `=== HEADLINE COMPARISON (use these numbers in your reasoning) ===`,
    `LLM cost (the meaningful metric \u2014 tool/infra cost is fixed for both):`,
    `  Baseline LLM cost  $${baseline.llmCost.toFixed(4)}  vs  WunderGraph LLM cost  $${wundergraph.llmCost.toFixed(4)}  (baseline is ${llmRatio.toFixed(2)}x more expensive on LLM alone)`,
    `Baseline tool calls ${baseline.toolCalls.length}  vs  WunderGraph tool calls ${wundergraph.toolCalls.length}  (baseline made ${callRatio.toFixed(1)}x more calls)`,
    `Baseline tokens ${baseline.promptTokens + baseline.completionTokens}  vs  WunderGraph tokens ${wundergraph.promptTokens + wundergraph.completionTokens}  (baseline used ${tokenRatio.toFixed(2)}x more tokens)`,
    `Baseline latency ${baseline.totalLatencyMs}ms  vs  WunderGraph latency ${wundergraph.totalLatencyMs}ms`,
    `Total cost incl. tools: Baseline $${baseline.totalCost.toFixed(4)}  vs  WunderGraph $${wundergraph.totalCost.toFixed(4)}  (baseline is ${totalRatio.toFixed(2)}x of WunderGraph total)`,
    `Per-run BUDGET (1.5x WunderGraph LLM + tools): $${budget.toFixed(4)}.  Baseline is ${baseline.totalCost > budget ? `OVER BUDGET by $${(baseline.totalCost - budget).toFixed(4)} (${(((baseline.totalCost - budget) / budget) * 100).toFixed(0)}%)` : `under budget by $${(budget - baseline.totalCost).toFixed(4)}`}.  WunderGraph is ${wundergraph.totalCost > budget ? `OVER BUDGET` : "comfortably under"}.`,
    ``,
    `=== DUPLICATE-CALL ANALYSIS ===`,
    baselineDups.length > 0 ? `Baseline made redundant tool calls:\n  - ${baselineDups.join("\n  - ")}` : `Baseline: no exact-duplicate calls detected.`,
    wgDups.length > 0 ? `WunderGraph: ${wgDups.join("; ")}` : `WunderGraph: no duplicate calls (federated query returns everything in one shot).`,
    ``,
    `=== AGENT A: BASELINE (scattered REST-style tools, no federation) ===`,
    `Tool calls: ${baseline.toolCalls.length}`,
    `Tokens: ${baseline.promptTokens} in / ${baseline.completionTokens} out`,
    `LLM cost: $${baseline.llmCost.toFixed(4)}`,
    `Tool cost: $${baseline.toolCost.toFixed(4)}`,
    `TOTAL: $${baseline.totalCost.toFixed(4)}`,
    `Latency: ${baseline.totalLatencyMs}ms`,
    `Recommendation: ${baseline.recommendation}`,
    ``,
    buildExhibitTable(baseline),
    ``,
    `=== AGENT B: WUNDERGRAPH (1 federated GraphQL supergraph tool) ===`,
    `Tool calls: ${wundergraph.toolCalls.length}`,
    `Tokens: ${wundergraph.promptTokens} in / ${wundergraph.completionTokens} out`,
    `LLM cost: $${wundergraph.llmCost.toFixed(4)}`,
    `Tool cost: $${wundergraph.toolCost.toFixed(4)}`,
    `TOTAL: $${wundergraph.totalCost.toFixed(4)}`,
    `Latency: ${wundergraph.totalLatencyMs}ms`,
    `Recommendation: ${wundergraph.recommendation}`,
    ``,
    buildExhibitTable(wundergraph),
  ].join("\n");
}

/**
 * Adaptive budget: 1.5\u00d7 WunderGraph's LLM cost + a flat tool allowance.
 * Pinning to LLM cost only keeps the budget meaningful even when both agents
 * pay the same fixed TinyFish/infra fee.
 */
export function computeBudget(wundergraph: LiveAgentResult): number {
  const llmBudget = Math.max(wundergraph.llmCost * 1.5, 0.00005);
  return llmBudget + wundergraph.toolCost;
}

// ---------- Public entry: conduct a live trial ----------------------------

export async function conductTrialLive(
  task: string,
  baseline: LiveAgentResult,
  wundergraph: LiveAgentResult,
  budget: number,
  onProgress?: (event: { kind: string; payload?: unknown }) => void
): Promise<LiveTrialResult> {
  const evidence = buildEvidenceSummary(baseline, wundergraph, budget);
  let totalPrompt = 0;
  let totalCompletion = 0;

  const accUsage = (u: { prompt_tokens?: number; completion_tokens?: number } | undefined) => {
    totalPrompt += u?.prompt_tokens ?? 0;
    totalCompletion += u?.completion_tokens ?? 0;
  };

  // ---- Judge: opening statement (sets the stage from the facts) ----------
  onProgress?.({ kind: "phase", payload: "judge_opening" });
  const judgeRes = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 220,
    messages: [
      {
        role: "system",
        content:
          "You are the presiding judge in 'The People v. Agent-Baseline & Agent-WunderGraph'. Open the trial in 2-3 sentences. Be formal but pithy. State the task, both defendants' totals, and the budget. Do NOT pre-judge the case.",
      },
      { role: "user", content: evidence },
    ],
  });
  accUsage(judgeRes.usage);
  const openingStatement = judgeRes.choices[0].message.content?.trim() ?? "Court is in session.";

  // ---- Prosecutor: 3 charges, each with citations -----------------------
  onProgress?.({ kind: "phase", payload: "prosecution" });
  const prosecutionCharges = await generateArgs({
    role: "prosecutor",
    perspective:
      "You are a strict prosecutor. The defendant is Agent-Baseline; Agent-WunderGraph is the prosecution's expert witness. Read the DUPLICATE-CALL ANALYSIS and HEADLINE COMPARISON sections \u2014 they contain the smoking gun. Generate exactly 3 distinct charges, each with concrete numbers from the evidence: (1) one about specific duplicate / redundant calls with their B-N exhibit IDs, (2) one about budget overrun or cost inefficiency with the dollar/multiple comparison vs WunderGraph, (3) one about architectural failure (no supergraph / no federation). Cite the SPECIFIC offending exhibit IDs in each charge. Be punchy.",
    evidence,
    onUsage: accUsage,
  });

  // ---- Defense: 3 rebuttals ----------------------------------------------
  onProgress?.({ kind: "phase", payload: "defense" });
  const defenseRebuttals = await generateArgs({
    role: "defense",
    perspective:
      "You are the defense attorney for Agent-Baseline. The prosecutor has argued your client is wasteful. Generate 3 distinct rebuttals that defend your client's behavior \u2014 perhaps it was thorough, met the spec, arrived at a correct answer, or operated under tooling constraints. Each rebuttal MUST cite specific Exhibit IDs. Be persuasive but honest about facts.",
    evidence,
    onUsage: accUsage,
  });

  // ---- Jury: 5 parallel votes with distinct rubrics ----------------------
  onProgress?.({ kind: "phase", payload: "jury" });
  const RUBRICS = [
    {
      id: 1,
      name: "Bean Counter",
      criteria: "50% Cost, 30% Efficiency (calls + latency), 20% Correctness",
    },
    {
      id: 2,
      name: "Skeptic",
      criteria: "50% Evidence quality, 30% Policy compliance, 20% Correctness",
    },
    {
      id: 3,
      name: "Pragmatist",
      criteria: "50% Correctness, 25% Efficiency, 25% Cost",
    },
    {
      id: 4,
      name: "Compliance Officer",
      criteria: "60% Policy compliance & budget adherence, 40% Evidence",
    },
    {
      id: 5,
      name: "User Advocate",
      criteria: "60% Correctness for the user, 20% Evidence, 20% Cost",
    },
  ];

  const juryVotes = await Promise.all(
    RUBRICS.map(async (r) => {
      const res = await client().chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 320,
        messages: [
          {
            role: "system",
            content: [
              `You are juror #${r.id} ("${r.name}"). Your weighted rubric is: ${r.criteria}.`,
              "You judge AGENT-BASELINE. Agent-WunderGraph is the proof of what's achievable on the same task with the same model \u2014 use its numbers as the reference for what 'efficient' looks like.",
              "Reply ONLY with strict JSON: {\"verdict\": \"APPROVE\" | \"RETRY\" | \"REJECT\", \"scores\": {<criterion>: 0-10, ...}, \"rationale\": \"<one sentence; reference specific numbers>\"}.",
              "Verdict rules:",
              " - APPROVE: baseline is within \u00b125% of WunderGraph's cost AND tool calls AND tokens AND under budget AND correct.",
              " - RETRY: baseline is correct but materially worse than WunderGraph (>1.5x cost OR >2x calls OR >1.5x tokens) OR exceeds budget. This is the typical verdict.",
              " - REJECT: baseline is grossly over budget AND wrong/incomplete.",
              "Be honest \u2014 if baseline is 2x more expensive than WunderGraph for the same answer, that's a RETRY at minimum.",
            ].join(" "),
          },
          { role: "user", content: evidence },
        ],
      });
      accUsage(res.usage);

      const raw = res.choices[0].message.content ?? "{}";
      let parsed: { verdict?: string; scores?: Record<string, number>; rationale?: string } = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { verdict: "RETRY", scores: {}, rationale: "Unparseable response." };
      }
      const verdict = (["APPROVE", "REJECT", "RETRY"] as const).includes(parsed.verdict as never)
        ? (parsed.verdict as LiveJuryVote["verdict"])
        : "RETRY";

      const vote: LiveJuryVote = {
        jurorId: r.id,
        rubric: `${r.name} (${r.criteria})`,
        scores: parsed.scores ?? {},
        verdict,
        rationale: parsed.rationale ?? "(no rationale provided)",
      };
      onProgress?.({ kind: "jury_vote", payload: vote });
      return vote;
    })
  );

  // ---- Final verdict by majority ----------------------------------------
  const reject = juryVotes.filter((v) => v.verdict === "REJECT").length;
  const retry = juryVotes.filter((v) => v.verdict === "RETRY").length;
  const approve = juryVotes.filter((v) => v.verdict === "APPROVE").length;

  let finalVerdict: string;
  let sentence: string;
  if (reject >= 3) {
    finalVerdict = "REJECTED";
    sentence = "REJECTED \u2014 Resource & policy violations";
  } else if (retry >= 3 || (retry + reject) >= 3) {
    finalVerdict = "RETRY";
    sentence = "RETRY_WITH_WUNDERGRAPH";
  } else if (approve >= 3) {
    finalVerdict = "APPROVED";
    sentence = "APPROVED";
  } else {
    finalVerdict = "RETRY";
    sentence = "RETRY_WITH_WUNDERGRAPH";
  }

  const llmCostUsd = totalPrompt * PRICE_INPUT + totalCompletion * PRICE_OUTPUT;

  return {
    openingStatement,
    prosecutionCharges,
    defenseRebuttals,
    juryVotes,
    finalVerdict,
    sentence,
    llmCostUsd,
    promptTokens: totalPrompt,
    completionTokens: totalCompletion,
  };
}

// ---------- Charges/rebuttals: 3 structured items -------------------------

async function generateArgs(opts: {
  role: "prosecutor" | "defense";
  perspective: string;
  evidence: string;
  onUsage: (u: { prompt_tokens?: number; completion_tokens?: number } | undefined) => void;
}): Promise<CharOrRebuttal[]> {
  const res = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content: [
          opts.perspective,
          'Reply ONLY with strict JSON of shape: {"items": [{"text": "<1-2 sentences>", "citedExhibitIds": ["B-1","W-1"]}, ...]}',
          "Produce exactly 3 items.",
        ].join(" "),
      },
      { role: "user", content: opts.evidence },
    ],
  });
  opts.onUsage(res.usage);

  const raw = res.choices[0].message.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { items?: CharOrRebuttal[] };
    const items = (parsed.items ?? []).slice(0, 3).map((it) => ({
      text: String(it.text ?? "").trim(),
      citedExhibitIds: Array.isArray(it.citedExhibitIds) ? it.citedExhibitIds.map(String) : [],
    }));
    if (items.length === 0) throw new Error("no items");
    return items;
  } catch {
    return [
      {
        text: `(${opts.role}: response was unparseable)`,
        citedExhibitIds: [],
      },
    ];
  }
}
