import { queryFederatedSupergraph } from "../lib/wundergraph/federation";

async function main() {
  console.log("Querying federated supergraph...");
  const res = await queryFederatedSupergraph(`
    query {
      searchFlights(from: "SFO", to: "JFK", date: "2026-05-02") {
        id airline price refundable policyCompliant policyReason
      }
      policy { maxPrice refundableRequired }
    }
  `);
  console.log("errors:", res.errors);
  console.log("subgraphFetches:", res.subgraphFetches);
  console.log("data:", JSON.stringify(res.data, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAIL:", err);
    process.exit(1);
  });
