import "dotenv/config";
import { runBaselineAgentLive, runWunderGraphAgentLive } from "../lib/agents/agents-live";

const TASK =
  "Find the cheapest refundable flight from SFO to JFK on 2026-05-02 that satisfies our company policy, and recommend it for booking.";

async function main() {
  console.log("=== BASELINE (scattered tools) ===");
  const baseT0 = Date.now();
  const baseline = await runBaselineAgentLive(TASK, (c) => {
    console.log(`  [tool] ${c.tool} (${c.latencyMs}ms, $${c.cost.toFixed(4)})`);
  });
  console.log(`Total elapsed: ${Date.now() - baseT0}ms`);
  console.log(`Tokens: ${baseline.promptTokens} in / ${baseline.completionTokens} out`);
  console.log(`LLM cost: $${baseline.llmCost.toFixed(4)}`);
  console.log(`Tool cost: $${baseline.toolCost.toFixed(4)}`);
  console.log(`TOTAL: $${baseline.totalCost.toFixed(4)}`);
  console.log(`Tool calls: ${baseline.toolCalls.length}`);
  console.log(`Recommendation:\n${baseline.recommendation}`);

  console.log("\n=== WUNDERGRAPH (federated supergraph) ===");
  const wgT0 = Date.now();
  const wg = await runWunderGraphAgentLive(TASK, (c) => {
    console.log(`  [tool] ${c.tool} (${c.latencyMs}ms, $${c.cost.toFixed(4)})`);
  });
  console.log(`Total elapsed: ${Date.now() - wgT0}ms`);
  console.log(`Tokens: ${wg.promptTokens} in / ${wg.completionTokens} out`);
  console.log(`LLM cost: $${wg.llmCost.toFixed(4)}`);
  console.log(`Tool cost: $${wg.toolCost.toFixed(4)}`);
  console.log(`TOTAL: $${wg.totalCost.toFixed(4)}`);
  console.log(`Tool calls: ${wg.toolCalls.length}`);
  console.log(`Recommendation:\n${wg.recommendation}`);

  console.log("\n=== SUMMARY ===");
  console.log(`Baseline: ${baseline.toolCalls.length} calls, $${baseline.totalCost.toFixed(4)}`);
  console.log(`WG:       ${wg.toolCalls.length} calls, $${wg.totalCost.toFixed(4)}`);
  console.log(`Savings: ${(((baseline.totalCost - wg.totalCost) / baseline.totalCost) * 100).toFixed(1)}%`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAIL:", err);
    process.exit(1);
  });
