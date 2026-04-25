import "dotenv/config";
import { runBaselineAgentLive, runWunderGraphAgentLive } from "../lib/agents/agents-live";
import { conductTrialLive, computeBudget } from "../lib/agents/court-live";

const TASK =
  "Find the cheapest refundable flight from SFO to JFK on 2026-05-02 that satisfies our company policy, and recommend it for booking.";

async function main() {
  console.log(">>> Running both agents in parallel...");
  const [baseline, wundergraph] = await Promise.all([
    runBaselineAgentLive(TASK),
    runWunderGraphAgentLive(TASK),
  ]);
  console.log(`Baseline: ${baseline.toolCalls.length} calls, $${baseline.totalCost.toFixed(4)}`);
  console.log(`WG:       ${wundergraph.toolCalls.length} calls, $${wundergraph.totalCost.toFixed(4)}`);
  const BUDGET = computeBudget(wundergraph);
  console.log(`Adaptive budget (1.5x WG): $${BUDGET.toFixed(4)}`);

  console.log("\n>>> Conducting trial...");
  const trial = await conductTrialLive(TASK, baseline, wundergraph, BUDGET, (e) =>
    console.log(`  [${e.kind}]`, JSON.stringify(e.payload).slice(0, 80))
  );

  console.log("\n=== JUDGE ===");
  console.log(trial.openingStatement);

  console.log("\n=== PROSECUTION ===");
  trial.prosecutionCharges.forEach((c, i) =>
    console.log(`Charge ${i + 1}: ${c.text}\n  Cited: ${c.citedExhibitIds.join(", ")}`)
  );

  console.log("\n=== DEFENSE ===");
  trial.defenseRebuttals.forEach((c, i) =>
    console.log(`Rebuttal ${i + 1}: ${c.text}\n  Cited: ${c.citedExhibitIds.join(", ")}`)
  );

  console.log("\n=== JURY ===");
  trial.juryVotes.forEach((v) =>
    console.log(`Juror #${v.jurorId} (${v.rubric.split(" (")[0]}): ${v.verdict} \u2014 ${v.rationale}`)
  );

  console.log("\n=== VERDICT ===");
  console.log(`Final: ${trial.finalVerdict} (sentence: ${trial.sentence})`);
  console.log(`Court LLM cost: $${trial.llmCostUsd.toFixed(4)} (${trial.promptTokens} in / ${trial.completionTokens} out)`);
  console.log(`\nGRAND TOTAL: $${(baseline.totalCost + wundergraph.totalCost + trial.llmCostUsd).toFixed(4)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAIL:", err);
    process.exit(1);
  });
