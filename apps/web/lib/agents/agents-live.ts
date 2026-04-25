/**
 * Real OpenAI agent runners.
 *
 * Both agents receive the same task and must produce a flight booking
 * recommendation. The only difference is the toolset:
 *
 *   BASELINE:    5 scattered REST-style tools, no federation. The model
 *                naturally chains many calls and often duplicates them.
 *
 *   WUNDERGRAPH: 1 federated GraphQL supergraph tool. One query returns
 *                everything: flights, prices, refundability, policy
 *                compliance \u2014 all stitched by the gateway.
 *
 * Both run an OpenAI tool-use loop with `gpt-4o-mini` and report real
 * token usage, latency, $ cost, and an itemized tool-call trace.
 */
import OpenAI from "openai";
import {
  search_flights,
  get_flight_details,
  get_flight_price,
  check_policy,
} from "@/lib/tools/scattered-tools";
import { tinyfish_browse, TINYFISH_COST_PER_CALL } from "@/lib/tools/tinyfish";
import { queryFederatedSupergraph } from "@/lib/wundergraph/federation";
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

// gpt-4o-mini pricing (as of 2026-Q2): $0.15 / 1M input tokens, $0.60 / 1M output tokens.
const PRICE_INPUT_PER_TOKEN = 0.15 / 1_000_000;
const PRICE_OUTPUT_PER_TOKEN = 0.60 / 1_000_000;
const MODEL = "gpt-4o-mini";

export type LiveToolCall = {
  tool: string;
  input: unknown;
  output: unknown;
  cost: number;
  latencyMs: number;
};

export type LiveAgentResult = {
  variant: "BASELINE" | "WUNDERGRAPH";
  summary: string;
  recommendation: string;
  toolCalls: LiveToolCall[];
  totalCost: number;
  promptTokens: number;
  completionTokens: number;
  llmCost: number;
  toolCost: number;
  totalLatencyMs: number;
};

// ---------- Tool schemas ----------------------------------------------------

const SCATTERED_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "Search flights between two airports on a given date. Returns only flight IDs.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "3-letter airport code, e.g. SFO" },
          to: { type: "string", description: "3-letter airport code, e.g. JFK" },
          date: { type: "string", description: "Date in any reasonable format" },
        },
        required: ["from", "to", "date"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_flight_details",
      description: "Get airline + departure/arrival times for one flight ID.",
      parameters: {
        type: "object",
        properties: { flightId: { type: "string" } },
        required: ["flightId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_flight_price",
      description: "Get the price and refundability for one flight ID.",
      parameters: {
        type: "object",
        properties: { flightId: { type: "string" } },
        required: ["flightId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_policy",
      description: "Get the company's flight booking policy (max price, refundability requirement).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "tinyfish_browse",
      description: "Use TinyFish to fetch and render a real airline URL to verify availability/pricing.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "Full URL to fetch" } },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
];

const FEDERATED_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "query_supergraph",
      description:
        "Query the WunderGraph-style federated GraphQL supergraph. " +
        "Single endpoint stitches flights + policy data. " +
        "Schema: type Flight { id airline from to departTime arriveTime price refundable policyCompliant policyReason } " +
        "type Policy { maxPrice refundableRequired } " +
        "Query: searchFlights(from, to, date), flight(id), policy",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "GraphQL query string" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tinyfish_browse",
      description: "Use TinyFish to fetch a real airline URL to verify availability/pricing.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
];

// ---------- Tool dispatch ---------------------------------------------------

async function executeTool(name: string, args: Record<string, unknown>): Promise<{ output: unknown; cost: number; latencyMs: number }> {
  const t0 = Date.now();

  switch (name) {
    case "search_flights":
      return { output: search_flights(args as { from: string; to: string; date: string }), cost: 0, latencyMs: Date.now() - t0 };
    case "get_flight_details":
      return { output: get_flight_details(args as { flightId: string }), cost: 0, latencyMs: Date.now() - t0 };
    case "get_flight_price":
      return { output: get_flight_price(args as { flightId: string }), cost: 0, latencyMs: Date.now() - t0 };
    case "check_policy":
      return { output: check_policy(), cost: 0, latencyMs: Date.now() - t0 };
    case "query_supergraph": {
      const q = (args as { query: string }).query ?? "";
      const res = await queryFederatedSupergraph(q);
      return { output: res, cost: 0, latencyMs: Date.now() - t0 };
    }
    case "tinyfish_browse": {
      const res = await tinyfish_browse(args as { url: string });
      return { output: res, cost: TINYFISH_COST_PER_CALL, latencyMs: res.latencyMs };
    }
    default:
      return { output: { error: `unknown tool: ${name}` }, cost: 0, latencyMs: Date.now() - t0 };
  }
}

// ---------- Agent runner ----------------------------------------------------

type RunOpts = {
  variant: "BASELINE" | "WUNDERGRAPH";
  task: string;
  systemPrompt: string;
  tools: ChatCompletionTool[];
  maxSteps?: number;
  /** Called as each tool call resolves so the SSE stream can show it live. */
  onToolCall?: (call: LiveToolCall) => void;
};

async function runAgent(opts: RunOpts): Promise<LiveAgentResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const t0 = Date.now();

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: opts.systemPrompt },
    { role: "user", content: opts.task },
  ];

  const toolCalls: LiveToolCall[] = [];
  let promptTokens = 0;
  let completionTokens = 0;
  let recommendation = "";
  const maxSteps = opts.maxSteps ?? 10;

  for (let step = 0; step < maxSteps; step++) {
    const params: ChatCompletionCreateParams = {
      model: MODEL,
      messages,
      tools: opts.tools,
      tool_choice: "auto",
      temperature: 0.2,
    };

    const completion = await client.chat.completions.create(params);
    const usage = completion.usage;
    if (usage) {
      promptTokens += usage.prompt_tokens ?? 0;
      completionTokens += usage.completion_tokens ?? 0;
    }

    const choice = completion.choices[0];
    const msg = choice.message;
    messages.push(msg);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        if (tc.type !== "function") continue;
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(tc.function.arguments || "{}");
        } catch {
          parsed = {};
        }
        const { output, cost, latencyMs } = await executeTool(tc.function.name, parsed);

        const call: LiveToolCall = {
          tool: tc.function.name,
          input: parsed,
          output,
          cost,
          latencyMs,
        };
        toolCalls.push(call);
        opts.onToolCall?.(call);

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(output).slice(0, 4000),
        });
      }
      continue;
    }

    // No more tool calls \u2014 model produced final answer.
    recommendation = msg.content ?? "";
    break;
  }

  const llmCost = promptTokens * PRICE_INPUT_PER_TOKEN + completionTokens * PRICE_OUTPUT_PER_TOKEN;
  const toolCost = toolCalls.reduce((sum, c) => sum + c.cost, 0);
  const totalCost = llmCost + toolCost;
  const totalLatencyMs = Date.now() - t0;

  const summary =
    opts.variant === "BASELINE"
      ? `Baseline agent made ${toolCalls.length} scattered tool call${toolCalls.length === 1 ? "" : "s"} across ${countDistinctTools(toolCalls)} tools. ${promptTokens + completionTokens} total tokens.`
      : `WunderGraph agent made ${toolCalls.length} call${toolCalls.length === 1 ? "" : "s"} via the federated supergraph. ${promptTokens + completionTokens} total tokens.`;

  return {
    variant: opts.variant,
    summary,
    recommendation,
    toolCalls,
    totalCost,
    promptTokens,
    completionTokens,
    llmCost,
    toolCost,
    totalLatencyMs,
  };
}

function countDistinctTools(calls: LiveToolCall[]): number {
  return new Set(calls.map((c) => c.tool)).size;
}

// ---------- Public entry points --------------------------------------------

export async function runBaselineAgentLive(
  task: string,
  onToolCall?: (call: LiveToolCall) => void
): Promise<LiveAgentResult> {
  return runAgent({
    variant: "BASELINE",
    task,
    systemPrompt: [
      "You are a corporate travel booking agent.",
      "You have access to several REST-style tools to search flights, look up details, look up prices, check the company policy, and verify URLs via TinyFish.",
      "Your job: find a flight that satisfies the policy and recommend booking it. Be efficient with tool calls. When you have your answer, reply in plain text \u2014 NOT a tool call \u2014 with: the chosen flight ID, airline, price, refundable status, and a one-line justification.",
    ].join("\n\n"),
    tools: SCATTERED_TOOLS,
    onToolCall,
  });
}

export async function runWunderGraphAgentLive(
  task: string,
  onToolCall?: (call: LiveToolCall) => void
): Promise<LiveAgentResult> {
  return runAgent({
    variant: "WUNDERGRAPH",
    task,
    systemPrompt: [
      "You are a corporate travel booking agent.",
      "You have access to a single federated GraphQL supergraph (WunderGraph-spec) that stitches flight inventory and policy data into one endpoint.",
      "Use ONE GraphQL query through `query_supergraph` to fetch everything you need: search results AND policy AND policy compliance per flight. You may use TinyFish once at the end to verify the chosen flight's URL.",
      "Reply in plain text \u2014 NOT a tool call \u2014 with: the chosen flight ID, airline, price, refundable status, and a one-line justification.",
    ].join("\n\n"),
    tools: FEDERATED_TOOLS,
    onToolCall,
  });
}
