import { runBaselineAgent, runWunderGraphAgent } from '@/lib/agents/agent-runners';
import { conductTrial } from '@/lib/agents/court-orchestrator';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;

  // Update case status
  const caseData = await db.cases.findUnique({ where: { id: caseId } });
  if (!caseData) {
    return new Response('Case not found', { status: 404 });
  }

  // Run both agents
  const task = caseData.task;
  const [baselineRun, wunderGraphRun] = await Promise.all([
    runBaselineAgent(task),
    runWunderGraphAgent(task),
  ]);

  // Conduct trial
  const trialResult = await conductTrial(task, baselineRun, wunderGraphRun);

  // Store results in case (simplified - in real app would store all details)
  caseData.verdict = trialResult.finalVerdict;
  caseData.sentence = trialResult.sentence;
  caseData.status = 'COMPLETED';

  return Response.json({
    baselineRun,
    wunderGraphRun,
    trialResult,
  });
}
