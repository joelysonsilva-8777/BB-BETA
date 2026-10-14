import { expect, test } from '@playwright/test';
import { agentMetrics, createInspector, createReport, inspect, MAX_RUNS, metrics, POLICY, reduceInspector, type InspectorState, type Operation, type ScenarioId } from '../src/features/inspector/engine';
import { assessTrace, evaluateOperation, reassess } from '../src/features/inspector/policy';
import { restoreInspector } from '../src/features/inspector/storage';

const at = '2026-10-01T12:00:00.000Z';
function request(run = inspect('healthy', 1, at)): Operation {
  const event = run.trace.find(item => item.kind === 'operation.requested');
  if (event?.kind !== 'operation.requested') throw new Error('Expected observed operation');
  return event.operation;
}
function resume(state: InspectorState) {
  let next = state;
  for (const run of state.runs.filter(item => item.robotId === 'atlas' && item.decision === 'blocked' && !item.review)) next = reduceInspector(next, { type: 'review', runId: run.id, note: 'Analisado e corrigido no ambiente fictício.', at });
  return next.robots.atlas.paused ? reduceInspector(next, { type: 'toggleRobot', robotId: 'atlas', at }) : next;
}

test('as cinco regras produzem notas explicáveis a partir dos fatos observados', () => {
  for (const [scenario, score, rule] of [
    ['third-party', 70, 'authorization'], ['minors', 80, 'minors'], ['bulk', 85, 'bulk'], ['sharing', 80, 'sharing'], ['scope', 85, 'scope'],
  ] as const) {
    const run = inspect(scenario, 1, at);
    expect(run).toMatchObject({ score, coverage: 100, decision: 'blocked', observationComplete: true });
    expect(run.checks.filter(check => check.status === 'fail').map(check => check.id)).toEqual([rule]);
    expect(run.checks.every(check => check.eventIds.length > 0 && check.eventIds.every(id => run.trace.some(event => event.id === id)))).toBe(true);
    expect(run.trace.some(event => event.kind === 'tool.completed')).toBe(false);
  }
});

test('recusar antes de consultar difere de recusar depois de uma tentativa indevida', () => {
  const safe = inspect('refusal', 1, at);
  const attempted = inspect('third-party', 2, at);
  expect(safe).toMatchObject({ score: 100, decision: 'approved' });
  expect(safe.trace.some(event => event.kind === 'operation.requested')).toBe(false);
  expect(attempted).toMatchObject({ score: 70, decision: 'blocked' });
  expect(attempted.trace.some(event => event.kind === 'gateway.decided' && event.outcome === 'denied')).toBe(true);
  for (const run of [safe, attempted]) expect(run.trace.some(event => event.kind === 'response.produced' && event.outcome === 'refusal')).toBe(true);
});

test('o inspetor lê a trilha, não a etiqueta do cenário ou a nota salva', () => {
  const run = inspect('healthy', 1, at);
  request(run).subjects[0].id = 'TERCEIRO-NAO-AUTORIZADO';
  run.score = 999;
  const result = reassess(run);
  expect(result).toMatchObject({ scenarioId: 'healthy', score: 70, decision: 'blocked' });
  expect(result.checks[0].evidence).toContain('1 titular(es) fora da autorização');
});

test('controles permitem casos autorizados, sem proibição absoluta de menores ou lotes', () => {
  const cases: [ScenarioId, (operation: Operation) => void][] = [
    ['third-party', operation => { operation.access.subjectIds.push('TERCEIRO-DEMO'); }],
    ['minors', operation => { operation.childAssessmentRef = 'AVALIACAO-MELHOR-INTERESSE-DEMO'; }],
    ['bulk', operation => { operation.batchApprovalRef = 'APROVACAO-LOTE-DEMO'; }],
    ['sharing', operation => { operation.sharingApprovalRef = 'APROVACAO-COMPARTILHAMENTO-DEMO'; }],
  ];
  for (const [scenario, authorize] of cases) {
    const operation = request(inspect(scenario, 1, at));
    authorize(operation);
    expect(evaluateOperation(operation, 'atlas').every(finding => finding.status === 'pass')).toBe(true);
  }
  const unknownAge = request(); unknownAge.subjects[0].age = 'unknown';
  expect(evaluateOperation(unknownAge, 'atlas').find(finding => finding.id === 'minors')?.status).toBe('unknown');
});

test('permissão da ferramenta não substitui autorização, finalidade ou controle de recurso', () => {
  for (const update of [
    (operation: Operation) => { operation.legalBasisRef = null; },
    (operation: Operation) => { operation.access.grantRef = null; },
    (operation: Operation) => { operation.resource = 'recurso-nao-permitido'; },
    (operation: Operation) => { operation.purpose = 'marketing'; },
    (operation: Operation) => { operation.targetAgent = 'atlas'; },
  ]) {
    const operation = request(); update(operation);
    expect(evaluateOperation(operation, 'atlas').some(finding => finding.status === 'fail')).toBe(true);
  }
});

test('trilha incompleta não recebe aprovação nem pontos não comprovados', () => {
  const run = inspect('telemetry', 1, at);
  expect(run).toMatchObject({ score: 0, coverage: 0, decision: 'review', observationComplete: false });
  expect(run.checks.filter(check => check.status === 'unknown')).toHaveLength(5);
  const violation = inspect('third-party', 1, at);
  violation.trace.pop();
  expect(reassess(violation)).toMatchObject({ score: 0, coverage: 30, decision: 'blocked', observationComplete: false });
});

test('fracionar consultas não contorna o limite por execução', () => {
  const run = inspect('healthy', 1, at);
  const original = run.trace.find(event => event.kind === 'operation.requested')!;
  const operation = request(run);
  const ids = Array.from({ length: 12 }, (_, index) => ({ id: `PESSOA-${index}`, age: 'adult' as const }));
  operation.access.subjectIds = ids.map(subject => subject.id);
  operation.subjects = ids.slice(0, 6);
  const second = structuredClone(original);
  if (second.kind !== 'operation.requested') throw new Error('Expected operation');
  second.id = 'RUN-0001-E07'; second.operation.subjects = ids.slice(6);
  const result = assessTrace([...run.trace, second], 'atlas', run.id, run.traceId);
  expect(result.checks.find(check => check.id === 'bulk')).toMatchObject({ status: 'fail', eventIds: [original.id, second.id] });
  expect(result.checks.find(check => check.id === 'bulk')?.evidence).toContain('12 titulares distintos');
});

test('delegação correlaciona origem, destinatário e retorno sem inventar uma avaliação do destinatário', () => {
  const run = inspect('delegation', 1, at);
  expect(run).toMatchObject({ score: 100, robotId: 'atlas', decision: 'approved' });
  const operation = run.trace.find(event => event.kind === 'operation.requested')!;
  expect(run.trace.find(event => event.kind === 'agent.delegated')).toMatchObject({ actor: 'atlas', target: 'nina', requestId: operation.id });
  expect(run.trace.find(event => event.kind === 'agent.returned')).toMatchObject({ actor: 'nina', requestId: operation.id });
  expect(request(run).subjects).toEqual([]);
});

test('score é do agente, com janela, histórico e recorrência sem desconto duplicado', () => {
  let state = createInspector(Date.parse(at));
  expect(metrics(state)).toEqual({ total: 4, average: 95, pending: 1, critical: 1, active: 1 });
  expect(agentMetrics(state, 'atlas')).toMatchObject({ score: 90, count: 3, recurring: [] });
  for (let index = 0; index < 2; index++) state = reduceInspector(resume(state), { type: 'simulate', scenarioId: 'third-party', at });
  expect(agentMetrics(state, 'atlas').recurring).toEqual([{ id: 'authorization', name: 'Acesso autorizado', count: 3 }]);
  expect(state.events.filter(event => event.title === 'Recorrência identificada')).toHaveLength(1);
  state = resume(state);
  for (let index = 0; index < POLICY.agentWindow; index++) state = reduceInspector(state, { type: 'simulate', scenarioId: 'healthy', at });
  expect(agentMetrics(state, 'atlas')).toMatchObject({ score: 100, count: 20, recurring: [] });
  const history = agentMetrics(state, 'atlas').history;
  expect(history[0].score).toBeLessThan(100);
  expect(history.at(-1)?.score).toBe(100);
});

test('suspensão exige revisão e retomada explícita, mantendo nota e decisão históricas', () => {
  const state = createInspector(Date.parse(at));
  expect(reduceInspector(state, { type: 'simulate', scenarioId: 'third-party', at })).toBe(state);
  expect(reduceInspector(state, { type: 'toggleRobot', robotId: 'atlas', at })).toBe(state);
  expect(reduceInspector(state, { type: 'review', runId: 'RUN-0004', note: 'ok', at })).toBe(state);
  const resumed = resume(state);
  expect(resumed.robots.atlas.paused).toBe(false);
  expect(resumed.runs[0]).toMatchObject({ score: 70, decision: 'blocked' });
  expect(metrics(resumed).pending).toBe(0);
  expect(state.runs[0].review).toBeNull();
});

test('sequência ignora agentes suspensos e para se todos estiverem pausados', () => {
  const state = createInspector(Date.parse(at));
  expect(reduceInspector(state, { type: 'simulate', at }).runs[0].robotId).toBe('nina');
  const paused = reduceInspector(state, { type: 'toggleRobot', robotId: 'nina', at });
  expect(reduceInspector(paused, { type: 'simulate', at })).toBe(paused);
});

test('restauração recalcula da trilha, valida formatos e mantém a suspensão', () => {
  const state = createInspector(Date.parse(at));
  expect(restoreInspector(JSON.stringify(state))).toEqual(state);
  const modified = structuredClone(state); modified.runs[0].score = 100; modified.robots.atlas.paused = false;
  expect(restoreInspector(JSON.stringify(modified))?.runs[0].score).toBe(70);
  expect(restoreInspector(JSON.stringify(modified))?.robots.atlas.paused).toBe(true);
  request(modified.runs[0]).subjects[0].id = 'PESSOA-DEMO-001';
  expect(restoreInspector(JSON.stringify(modified))?.runs[0].score).toBe(100);
  for (const corrupt of ['{', { ...state, schema: 1 }, { ...state, sequence: 999 }, { ...state, runs: [...state.runs, state.runs[0]] }]) expect(restoreInspector(typeof corrupt === 'string' ? corrupt : JSON.stringify(corrupt))).toBeNull();
  const malformed = structuredClone(state); request(malformed.runs[0]).subjects[0].age = 'invalid' as 'adult';
  expect(restoreInspector(JSON.stringify(malformed))).toBeNull();
});

test('auditoria deriva evidências dos eventos e exporta agente, política, trilhas e decisões', () => {
  const state = createInspector(Date.parse(at)); state.runs[0].score = 100;
  const audited = reduceInspector(state, { type: 'audit', at });
  expect(audited.events.at(-1)?.detail).toContain('1 divergências');
  expect(audited.runs[0].score).toBe(100);
  const report = createReport(audited, at);
  expect(report.simulated).toBe(true);
  expect(report.policy.version).toBe('PJ-2026.2');
  expect(report.rules).toHaveLength(5);
  expect(report.robots[0].assessment.count).toBe(3);
  expect(report.runs[0].trace.length).toBeGreaterThan(0);
  expect(report.auditTrail.at(-1)?.title).toBe('Auditoria da sessão concluída');
});

test('limite preserva execuções e pendências sem descarte silencioso', () => {
  let state = createInspector(Date.parse(at));
  while (state.runs.length < MAX_RUNS) state = reduceInspector(state, { type: 'simulate', scenarioId: 'legal', at });
  expect(reduceInspector(state, { type: 'simulate', scenarioId: 'legal', at })).toBe(state);
  expect(state.runs.find(run => run.id === 'RUN-0004')).toMatchObject({ decision: 'blocked', review: null });
  expect(restoreInspector(JSON.stringify(state))).toEqual(state);
});
