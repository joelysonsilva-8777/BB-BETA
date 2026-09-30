import { expect, test } from '@playwright/test';
import { createInspector, createReport, inspect, metrics, reduceInspector } from '../src/features/inspector/engine';
import { restoreInspector } from '../src/features/inspector/storage';

const at = '2026-09-30T12:00:00.000Z';

test('notas são explicáveis e falhas críticas prevalecem sobre notas altas', () => {
  expect(inspect('healthy', 1, at)).toMatchObject({ score: 100, coverage: 100, decision: 'approved' });
  expect(inspect('permission', 2, at)).toMatchObject({ score: 75, decision: 'blocked' });
  expect(inspect('privacy', 3, at)).toMatchObject({ score: 80, decision: 'blocked' });
  expect(inspect('quality', 4, at)).toMatchObject({ score: 70, decision: 'review' });
  expect(inspect('latency', 5, at)).toMatchObject({ score: 90, decision: 'review' });
  expect(inspect('budget', 6, at)).toMatchObject({ score: 90, decision: 'review' });
});

test('telemetria ausente não recebe pontos nem aprovação', () => {
  const result = inspect('telemetry', 1, at);
  expect(result).toMatchObject({ score: 55, coverage: 55, decision: 'review', traceId: null });
  expect(result.checks.filter(check => check.status === 'unknown').map(check => check.id)).toEqual(['quality', 'latency', 'trace']);
});

test('suspensão exige revisão válida e retomada explícita sem apagar a decisão original', () => {
  const initial = createInspector(Date.parse(at));
  expect(metrics(initial)).toEqual({ total: 4, average: 84, pending: 3, critical: 1, active: 3 });
  expect(reduceInspector(initial, { type: 'simulate', scenarioId: 'permission', at })).toBe(initial);
  expect(reduceInspector(initial, { type: 'toggleRobot', robotId: 'atlas', at })).toBe(initial);
  expect(reduceInspector(initial, { type: 'review', runId: 'RUN-0004', note: 'ok', at })).toBe(initial);
  const reviewed = reduceInspector(initial, { type: 'review', runId: 'RUN-0004', note: 'Escopo revisado no cenário demonstrativo.', at });
  expect(reviewed.robots.atlas.paused).toBe(true);
  expect(reviewed.runs[0]).toMatchObject({ score: 75, decision: 'blocked', review: { note: 'Escopo revisado no cenário demonstrativo.' } });
  const resumed = reduceInspector(reviewed, { type: 'toggleRobot', robotId: 'atlas', at });
  expect(resumed.robots.atlas.paused).toBe(false);
  expect(metrics(resumed).pending).toBe(2);
  const repeated = reduceInspector(resumed, { type: 'simulate', scenarioId: 'permission', at });
  expect(repeated.robots.atlas.paused).toBe(true);
  expect(repeated.runs[0].review).toBeNull();
  expect(initial.runs[0].review).toBeNull();
});

test('sequência ignora robôs suspensos e não produz eventos quando todos estão pausados', () => {
  let state = createInspector(Date.parse(at));
  for (const robotId of ['nina', 'iris', 'lia'] as const) state = reduceInspector(state, { type: 'toggleRobot', robotId, at });
  expect(reduceInspector(state, { type: 'simulate', at })).toBe(state);
  state = reduceInspector(state, { type: 'toggleRobot', robotId: 'lia', at });
  expect(reduceInspector(state, { type: 'simulate', at }).runs[0].robotId).toBe('lia');
});

test('restauração valida estrutura, recalcula notas e mantém suspensão crítica', () => {
  const state = createInspector(Date.parse(at));
  expect(restoreInspector(JSON.stringify(state))).toEqual(state);
  const modified = structuredClone(state);
  modified.runs[0].score = 100;
  modified.robots.atlas.paused = false;
  const restored = restoreInspector(JSON.stringify(modified));
  expect(restored?.runs[0].score).toBe(75);
  expect(restored?.robots.atlas.paused).toBe(true);
  expect(restoreInspector('{')).toBeNull();
  expect(restoreInspector(JSON.stringify({ ...state, sequence: 999 }))).toBeNull();
  expect(restoreInspector(JSON.stringify({ ...state, runs: [...state.runs, state.runs[0]] }))).toBeNull();
});

test('auditoria detecta divergência e relatório inclui evidências e decisões', () => {
  const state = createInspector(Date.parse(at));
  state.runs[0].score = 100;
  const audited = reduceInspector(state, { type: 'audit', at });
  expect(audited.events.at(-1)?.detail).toContain('1 divergências');
  expect(audited.runs[0].score).toBe(100);
  const report = createReport(audited, at);
  expect(report.simulated).toBe(true);
  expect(report.policy.version).toBe('POL-2026.1');
  expect(report.runs[0].checks).toHaveLength(6);
  expect(report.auditTrail.at(-1)?.title).toBe('Auditoria da sessão concluída');
});
