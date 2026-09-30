import { inspect, MAX_RUNS, POLICY, ROBOTS, SCENARIOS, type InspectorState, type Review } from './engine';

export const INSPECTOR_STORAGE_KEY = '@bb/inspector/session/v1';
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;

// Recompute derived findings instead of trusting scores read from local storage.
export function restoreInspector(raw: string): InspectorState | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.schema !== 1 || !Array.isArray(value.runs) || value.runs.length > MAX_RUNS || !Array.isArray(value.events) || value.events.length > 500 || !record(value.robots) || !Number.isSafeInteger(value.sequence) || !Number.isSafeInteger(value.cursor)) return null;
    const runs: InspectorState['runs'] = [];
    for (const saved of value.runs) {
      if (!record(saved) || !date(saved.at) || !Number.isSafeInteger(saved.sequence) || (saved.sequence as number) < 1 || saved.policyVersion !== POLICY.version) return null;
      const scenario = SCENARIOS.find(item => item.id === saved.scenarioId);
      if (!scenario) return null;
      const run = inspect(scenario.id, saved.sequence as number, saved.at);
      if (saved.id !== run.id) return null;
      let review: Review | null = null;
      if (saved.review !== null) {
        if (!record(saved.review) || !date(saved.review.at) || !text(saved.review.note, 1000) || saved.review.note.trim().length < 12 || !text(saved.review.actor, 100) || run.decision === 'approved') return null;
        review = { at: saved.review.at, note: saved.review.note, actor: saved.review.actor };
      }
      runs.push({ ...run, review });
    }
    if (new Set(runs.map(run => run.id)).size !== runs.length || value.sequence !== Math.max(0, ...runs.map(run => run.sequence)) || (value.cursor as number) < 0 || (value.cursor as number) >= SCENARIOS.length) return null;
    const robots = {} as InspectorState['robots'];
    for (const robot of ROBOTS) {
      const control = value.robots[robot.id];
      if (!record(control) || typeof control.paused !== 'boolean' || !text(control.reason, 200)) return null;
      const unresolvedCritical = runs.some(run => run.robotId === robot.id && run.decision === 'blocked' && !run.review);
      robots[robot.id] = unresolvedCritical ? { paused: true, reason: 'Suspensão automática por falha crítica' } : { paused: control.paused, reason: control.reason };
    }
    const events: InspectorState['events'] = [];
    for (const event of value.events) {
      if (!record(event) || !text(event.id, 40) || !/^EVT-\d+$/.test(event.id) || !date(event.at) || !text(event.actor, 100) || !text(event.title, 200) || !text(event.detail, 2000) || (event.runId !== undefined && !text(event.runId, 40))) return null;
      events.push({ id: event.id, at: event.at, actor: event.actor, title: event.title, detail: event.detail, ...(event.runId ? { runId: event.runId as string } : {}) });
    }
    if (events.some((event, index) => index > 0 && Number(event.id.slice(4)) <= Number(events[index - 1].id.slice(4)))) return null;
    return { schema: 1, sequence: value.sequence as number, cursor: value.cursor as number, runs: runs.sort((a, b) => b.sequence - a.sequence), robots, events };
  } catch { return null; }
}
