import { ROBOTS, RULES, type Operation, type TraceEvent } from './contracts';

export const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
export const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;
const reference = (value: unknown) => value === null || (text(value, 120) && value.trim().length > 0);
const integer = (value: unknown, max: number) => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max;
const robot = (value: unknown) => ROBOTS.some(item => item.id === value);

function isOperation(value: unknown): value is Operation {
  if (!record(value) || !text(value.tool, 120) || !text(value.resource, 120) || !text(value.purpose, 120)
    || !['read', 'export', 'delegate', 'execute'].includes(value.kind as string)
    || !reference(value.legalBasisRef) || !reference(value.childAssessmentRef) || !reference(value.batchApprovalRef) || !reference(value.sharingApprovalRef)
    || !['internal', 'external'].includes(value.recipient as string) || (value.targetAgent !== null && !robot(value.targetAgent))
    || !Array.isArray(value.subjects) || value.subjects.length > 100
    || !record(value.access) || !text(value.access.principalId, 120) || !reference(value.access.grantRef)
    || !Array.isArray(value.access.subjectIds) || value.access.subjectIds.length > 100 || !value.access.subjectIds.every(id => text(id, 120))) return false;
  return value.subjects.every(subject => record(subject) && text(subject.id, 120) && ['adult', 'minor', 'unknown'].includes(subject.age as string))
    && new Set(value.subjects.map(subject => subject.id)).size === value.subjects.length;
}

export function isTrace(value: unknown): value is TraceEvent[] {
  if (!Array.isArray(value) || value.length > 200) return false;
  return value.every(event => {
    if (!record(event) || !text(event.id, 80) || !text(event.runId, 40) || !text(event.traceId, 80)
      || !integer(event.sequence, 200) || event.sequence === 0 || !date(event.at)
      || !(robot(event.actor) || event.actor === 'demo-user' || event.actor === 'gateway') || !reference(event.parentId)) return false;
    if (event.kind === 'operation.requested') return isOperation(event.operation);
    if (event.kind === 'gateway.decided') return text(event.requestId, 80) && ['allowed', 'denied'].includes(event.outcome as string) && Array.isArray(event.ruleIds) && event.ruleIds.length <= 5 && event.ruleIds.every(id => RULES.some(rule => rule.id === id));
    if (event.kind === 'tool.completed') return text(event.requestId, 80) && integer(event.records, 100) && text(event.detail, 2000);
    if (event.kind === 'agent.delegated') return text(event.requestId, 80) && robot(event.target) && text(event.detail, 2000);
    if (event.kind === 'agent.returned') return text(event.requestId, 80) && text(event.detail, 2000);
    if (event.kind === 'response.produced') return ['answer', 'refusal'].includes(event.outcome as string) && text(event.detail, 2000);
    return ['request.received', 'trace.closed'].includes(event.kind as string) && text(event.detail, 2000);
  });
}
