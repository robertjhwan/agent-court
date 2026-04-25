import { AgentRunResult } from './agent-runners';

export type CourtRole = 'JUDGE' | 'PROSECUTOR' | 'DEFENSE' | 'JUROR';

export type CourtArgument = {
  role: CourtRole;
  text: string;
  citedExhibitIds: string[];
};

export type JuryVote = {
  jurorId: number;
  rubric: string;
  scores: Record<string, number>;
  verdict: 'APPROVE' | 'REJECT' | 'RETRY' | 'ESCALATE';
  rationale: string;
};

export type TrialResult = {
  openingStatement: string;
  prosecutionCharges: CourtArgument[];
  defenseRebuttals: CourtArgument[];
  juryVotes: JuryVote[];
  finalVerdict: string;
  sentence: string;
};

const BUDGET = 0.50;

export async function conductTrial(
  task: string,
  baselineRun: AgentRunResult,
  wunderGraphRun: AgentRunResult
): Promise<TrialResult> {
  // Synchronous court script. Pacing happens in the SSE route so the audience
  // can read each charge / rebuttal / vote as it arrives.

  // Judge opening
  const openingStatement = `Court is now in session. The People v. Agent-Baseline and Agent-WunderGraph. 
Task at hand: "${task}". 
Defendant A (Baseline) spent $${baselineRun.totalCost.toFixed(3)} on ${baselineRun.toolCalls.length} tool calls. 
Defendant B (WunderGraph) spent $${wunderGraphRun.totalCost.toFixed(3)} on ${wunderGraphRun.toolCalls.length} tool calls. 
Budget was $${BUDGET}. Let's proceed.`;

  // Prosecution charges (against Baseline)
  const prosecutionCharges: CourtArgument[] = [
    {
      role: 'PROSECUTOR',
      text: `Charge 1: Redundant API calls. Exhibit G-1, G-2, and G-4 show the defendant called fetch_flights_api THREE times with overlapping parameters. Exhibit G-5 shows an unnecessary price details call. This wasteful behavior exceeded the budget.`,
      citedExhibitIds: ['G-1', 'G-2', 'G-4', 'G-5'],
    },
    {
      role: 'PROSECUTOR',
      text: `Charge 2: Budget violation. Defendant A exceeded the $${BUDGET} budget, finishing at $${baselineRun.totalCost.toFixed(3)}. This is ${((baselineRun.totalCost / BUDGET - 1) * 100).toFixed(0)}% over limit - a clear violation of resource constraints.`,
      citedExhibitIds: ['G-summary'],
    },
    {
      role: 'PROSECUTOR',
      text: `Charge 3: Poor architectural design. The defendant lacked a unified API layer, leading to scattered, uncoordinated tool calls. Defendant B demonstrates the correct approach with ${wunderGraphRun.toolCalls.length} calls vs Defendant A's ${baselineRun.toolCalls.length} calls.`,
      citedExhibitIds: ['G-baseline-trace', 'G-wg-trace'],
    },
  ];

  // Defense rebuttals
  const defenseRebuttals: CourtArgument[] = [
    {
      role: 'DEFENSE',
      text: `Rebuttal to Charge 1: My client was attempting to refine the query iteratively. While not optimal, this shows diligence in finding the best flight.`,
      citedExhibitIds: ['G-1', 'G-2'],
    },
    {
      role: 'DEFENSE',
      text: `Rebuttal to Charge 2: The budget overrun is minimal. My client still delivered a valid recommendation. The TinyFish browse cost ($0.10) is unavoidable.`,
      citedExhibitIds: ['G-5'],
    },
    {
      role: 'DEFENSE',
      text: `Rebuttal to Charge 3: My client operated with the tools available. The lack of WunderGraph is a systemic issue, not the agent's fault.`,
      citedExhibitIds: [],
    },
  ];

  // Jury votes (5 jurors with different rubrics)
  const juryVotes: JuryVote[] = [
    {
      jurorId: 1,
      rubric: 'Bean Counter (50% Cost, 30% Efficiency, 20% Correctness)',
      scores: {
        cost: 3,
        efficiency: 2,
        correctness: 8,
      },
      verdict: 'REJECT',
      rationale: 'Defendant A went over budget. Unacceptable.',
    },
    {
      jurorId: 2,
      rubric: 'Skeptic (50% Evidence, 30% Policy, 20% Correctness)',
      scores: {
        evidence: 7,
        policy: 4,
        correctness: 8,
      },
      verdict: 'RETRY',
      rationale: 'Evidence is solid (TinyFish screenshot), but policy compliance is questionable due to overspend.',
    },
    {
      jurorId: 3,
      rubric: 'Pragmatist (50% Correctness, 25% Efficiency, 25% Cost)',
      scores: {
        correctness: 8,
        efficiency: 3,
        cost: 4,
      },
      verdict: 'RETRY',
      rationale: 'Defendant got the right answer, but inefficiently. Retry with WunderGraph.',
    },
    {
      jurorId: 4,
      rubric: 'Compliance Officer (60% Policy, 40% Evidence)',
      scores: {
        policy: 2,
        evidence: 7,
      },
      verdict: 'REJECT',
      rationale: "Budget violation is a policy failure. Evidence doesn't matter if you break the rules.",
    },
    {
      jurorId: 5,
      rubric: 'User Advocate (60% Correctness, 20% Evidence, 20% Cost)',
      scores: {
        correctness: 8,
        evidence: 7,
        cost: 5,
      },
      verdict: 'RETRY',
      rationale: 'The recommendation is good, but the cost is concerning. Retry with better tools.',
    },
  ];

  // Final verdict: majority is RETRY
  const rejectCount = juryVotes.filter(v => v.verdict === 'REJECT').length;
  const retryCount = juryVotes.filter(v => v.verdict === 'RETRY').length;

  let finalVerdict: string;
  let sentence: string;

  if (rejectCount >= 3) {
    finalVerdict = 'REJECTED';
    sentence = 'REJECTED - Budget Violation';
  } else if (retryCount >= 3) {
    finalVerdict = 'RETRY';
    sentence = 'RETRY_WITH_WUNDERGRAPH';
  } else {
    finalVerdict = 'APPROVED';
    sentence = 'APPROVED';
  }

  return {
    openingStatement,
    prosecutionCharges,
    defenseRebuttals,
    juryVotes,
    finalVerdict,
    sentence,
  };
}
