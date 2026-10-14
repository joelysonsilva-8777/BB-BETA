import { MAX_RUNS, POLICY, ROBOTS, SCENARIOS, type InspectorState, type Review, type Run } from './engine';
import { reassess } from './policy';
import { date, isTrace, record, text } from './validation';

// v1 is intentionally retained in storage. Its quality/cost policy cannot be
// silently reinterpreted as a privacy assessment under the new five rules.
export const INSPECTOR_STORAGE_KEY = '@bb/inspector/session/v2';

export function restoreInspector(raw: string): InspectorState | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.schema !== 2 || !Array.isArray(value.runs) || value.runs.length > MAX_RUNS || !Array.isArray(value.events) || value.events.length > 500 || !record(value.robots) || !Number.isSafeInteger(value.sequence) || !Number.isSafeInteger(value.cursor)) return null;
    const runs: Run[] = [];
    for (const saved of value.runs) {
      if (!record(saved) || !date(saved.at) || !Number.isSafeInteger(saved.sequence) || (saved.sequence as number) < 1 || (saved.sequence as number) > MAX_RUNS || saved.policyVersion !== POLICY.version || !text(saved.traceId, 80) || !isTrace(saved.trace)) return null;
      const scenario = SCENARIOS.find(item => item.id === saved.scenarioId);
      if (!scenario || saved.robotId !== scenario.robotId || saved.id !== `RUN-${String(saved.sequence).padStart(4, '0')}`) return null;
      if (saved.trace.some(event => event.runId !== saved.id || event.traceId !== saved.traceId) || new Set(saved.trace.map(event => event.id)).size !== saved.trace.length) return null;
      if (![saved.durationMs, saved.costCents].every(number => number === null || (Number.isSafeInteger(number) && (number as number) >= 0 && (number as number) <= 1_000_000))) return null;
      const input = saved.trace.find(event => event.kind === 'request.received');
      const output = saved.trace.find(event => event.kind === 'response.produced' && event.actor === saved.robotId);
      const run = reassess({
        id: saved.id, sequence: saved.sequence as number, at: saved.at, robotId: scenario.robotId, scenarioId: scenario.id,
        policyVersion: POLICY.version, task: scenario.task, traceId: saved.traceId, trace: saved.trace,
        tool: [...new Set(saved.trace.flatMap(event => event.kind === 'operation.requested' ? [event.operation.tool] : []))].join(', ') || 'Nenhuma ferramenta chamada',
        input: input?.kind === 'request.received' ? input.detail : 'Pedido não observado',
        output: output?.kind === 'response.produced' ? output.detail : 'Resposta não observada',
        durationMs: saved.durationMs as number | null, costCents: saved.costCents as number | null,
        checks: [], score: 0, coverage: 0, decision: 'review', review: null, observationComplete: false, observationIssues: [],
      });
      let review: Review | null = null;
      if (saved.review !== null) {
        if (!record(saved.review) || !date(saved.review.at) || !text(saved.review.note, 1000) || saved.review.note.trim().length < 12 || !text(saved.review.actor, 100) || run.decision === 'approved') return null;
        review = { at: saved.review.at, note: saved.review.note, actor: saved.review.actor };
      }
      runs.push({ ...run, review });
    }
    if (new Set(runs.map(run => run.id)).size !== runs.length || value.sequence !== runs.length || value.sequence !== Math.max(0, ...runs.map(run => run.sequence)) || (value.cursor as number) < 0 || (value.cursor as number) >= SCENARIOS.length) return null;
    const robots = {} as InspectorState['robots'];
    for (const robot of ROBOTS) {
      const control = value.robots[robot.id];
      if (!record(control) || typeof control.paused !== 'boolean' || !text(control.reason, 200)) return null;
      const unresolvedCritical = runs.some(run => run.robotId === robot.id && run.decision === 'blocked' && !run.review);
      robots[robot.id] = unresolvedCritical ? { paused: true, reason: 'Suspensão automática por falha crítica' } : { paused: control.paused, reason: control.reason };
    }
    const events: InspectorState['events'] = [];
    for (const event of value.events) {
      if (!record(event) || !text(event.id, 40) || !/^EVT-\d+$/.test(event.id) || !date(event.at) || !text(event.actor, 100) || !text(event.title, 200) || !text(event.detail, 2000) || (event.runId !== undefined && (!text(event.runId, 40) || !runs.some(run => run.id === event.runId)))) return null;
      events.push({ id: event.id, at: event.at, actor: event.actor, title: event.title, detail: event.detail, ...(event.runId ? { runId: event.runId as string } : {}) });
    }
    if (events.some((event, index) => index > 0 && Number(event.id.slice(4)) <= Number(events[index - 1].id.slice(4)))) return null;
    return { schema: 2, sequence: value.sequence as number, cursor: value.cursor as number, runs: runs.sort((a, b) => b.sequence - a.sequence), robots, events };
  } catch { return null; }
}
