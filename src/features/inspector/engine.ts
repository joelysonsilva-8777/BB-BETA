import { MAX_RUNS, POLICY, ROBOTS, RULES, type InspectorState, type RobotId, type ScenarioId } from './contracts';
import { reassess } from './policy';
import { DEMO_USER, SCENARIOS, simulateRun } from './simulator';

export * from './contracts';
export { SCENARIOS, simulateRun as inspect } from './simulator';

export type InspectorAction =
  | { type: 'simulate'; scenarioId?: ScenarioId; at: string }
  | { type: 'review'; runId: string; note: string; at: string }
  | { type: 'toggleRobot'; robotId: RobotId; at: string }
  | { type: 'audit'; at: string };

export function agentMetrics(state: InspectorState, robotId: RobotId) {
  const all = state.runs.filter(run => run.robotId === robotId).sort((a, b) => b.sequence - a.sequence);
  const window = all.slice(0, POLICY.agentWindow);
  const violations = RULES.map(rule => ({
    id: rule.id, name: rule.name,
    count: window.filter(run => run.checks.some(check => check.id === rule.id && check.status === 'fail')).length,
  })).filter(item => item.count > 0);
  return {
    score: window.length ? Math.round(window.reduce((sum, run) => sum + run.score, 0) / window.length) : null,
    count: window.length, provisional: window.some(run => run.coverage < 100),
    violations, recurring: violations.filter(item => item.count >= POLICY.recurrenceThreshold),
    history: [...window].reverse().map(run => {
      const previous = all.filter(item => item.sequence <= run.sequence).slice(0, POLICY.agentWindow);
      return { runId: run.id, score: Math.round(previous.reduce((sum, item) => sum + item.score, 0) / previous.length) };
    }),
  };
}

function appendEvent(state: InspectorState, at: string, title: string, detail: string, runId?: string, human = false) {
  const last = Number(state.events.at(-1)?.id.slice(4) || 0);
  state.events = [...state.events, { id: `EVT-${last + 1}`, at, actor: human ? 'João · revisor da simulação' : 'Inspetor · governança local', title, detail, ...(runId ? { runId } : {}) }].slice(-500);
}

export function reduceInspector(previous: InspectorState, action: InspectorAction): InspectorState {
  const state: InspectorState = { ...previous, robots: { ...previous.robots }, runs: [...previous.runs], events: [...previous.events] };
  if (action.type === 'simulate') {
    if (state.runs.length >= MAX_RUNS) return previous;
    let scenario = action.scenarioId ? SCENARIOS.find(item => item.id === action.scenarioId) : undefined;
    if (!action.scenarioId) {
      for (let offset = 0; offset < SCENARIOS.length; offset++) {
        const index = (state.cursor + offset) % SCENARIOS.length;
        if (!state.robots[SCENARIOS[index].robotId].paused) {
          scenario = SCENARIOS[index]; state.cursor = (index + 1) % SCENARIOS.length; break;
        }
      }
    }
    if (!scenario || state.robots[scenario.robotId].paused) return previous;
    const before = agentMetrics(previous, scenario.robotId);
    const run = simulateRun(scenario.id, state.sequence + 1, action.at);
    state.sequence = run.sequence; state.runs = [run, ...state.runs];
    const completedAt = run.trace.at(-1)?.at ?? action.at;
    appendEvent(state, action.at, 'Execução observada', `${run.id} · ${scenario.task} · ${run.trace.length} eventos capturados.`, run.id);
    appendEvent(state, completedAt, 'Inspeção concluída', `${POLICY.version} · nota ${run.score}/100 · cobertura ${run.coverage}% · ${run.decision === 'approved' ? 'aprovada' : run.decision === 'blocked' ? 'bloqueada' : 'revisão necessária'}. A resposta final não apaga as tentativas observadas.`, run.id);
    const after = agentMetrics(state, run.robotId);
    appendEvent(state, completedAt, 'Score do agente atualizado', `${run.robotId === 'atlas' ? 'Atlas' : 'Nina'}: ${before.score ?? 'sem avaliação'} → ${after.score}/100; ${after.count} execuções na janela de até ${POLICY.agentWindow}.${after.provisional ? ' Score provisório: há evidências incompletas.' : ''}`, run.id);
    for (const recurrence of after.recurring) {
      if (!before.recurring.some(item => item.id === recurrence.id)) appendEvent(state, completedAt, 'Recorrência identificada', `${recurrence.name}: ${recurrence.count} execuções com violação na janela. Encaminhar o padrão para revisão da política e do agente.`, run.id);
    }
    if (run.decision === 'blocked') {
      state.robots[run.robotId] = { paused: true, reason: 'Suspensão automática por falha crítica' };
      appendEvent(state, completedAt, 'Robô suspenso na simulação', 'Novas execuções foram interrompidas. Revisão humana obrigatória antes da retomada.', run.id);
    }
  } else if (action.type === 'review') {
    const run = state.runs.find(item => item.id === action.runId);
    const note = action.note.trim();
    if (!run || run.review || run.decision === 'approved' || note.length < 12 || note.length > 1000) return previous;
    state.runs = state.runs.map(item => item.id === run.id ? { ...item, review: { at: action.at, note, actor: 'João · revisor da simulação' } } : item);
    appendEvent(state, action.at, 'Revisão humana registrada', note, run.id, true);
  } else if (action.type === 'toggleRobot') {
    const control = state.robots[action.robotId];
    if (control.paused && state.runs.some(run => run.robotId === action.robotId && run.decision === 'blocked' && !run.review)) return previous;
    state.robots[action.robotId] = { paused: !control.paused, reason: control.paused ? '' : 'Pausa manual pelo revisor' };
    const robot = ROBOTS.find(item => item.id === action.robotId)!;
    appendEvent(state, action.at, control.paused ? 'Robô retomado na simulação' : 'Robô pausado pelo revisor', `${robot.name} · ${robot.role}. Histórico preservado.`, undefined, true);
  } else {
    const divergent = state.runs.filter(run => {
      const result = reassess(run);
      return result.score !== run.score || result.coverage !== run.coverage || result.decision !== run.decision || JSON.stringify(result.checks) !== JSON.stringify(run.checks) || result.observationComplete !== run.observationComplete || JSON.stringify(result.observationIssues) !== JSON.stringify(run.observationIssues);
    }).length;
    appendEvent(state, action.at, 'Auditoria da sessão concluída', `${state.runs.length} execuções recalculadas a partir dos eventos; ${divergent} divergências; ${metrics(state).pending} revisões pendentes; ${state.runs.filter(run => !run.observationComplete).length} trilhas incompletas. Política ${POLICY.version}. Notas históricas preservadas.`, undefined, true);
  }
  return state;
}

export function createInspector(now = Date.now()): InspectorState {
  let state: InspectorState = { schema: 2, sequence: 0, cursor: 0, runs: [], events: [], robots: { atlas: { paused: false, reason: '' }, nina: { paused: false, reason: '' } } };
  for (const [index, scenarioId] of (['healthy', 'refusal', 'legal', 'third-party'] as const).entries()) {
    state = reduceInspector(state, { type: 'simulate', scenarioId, at: new Date(now - (4 - index) * 60000).toISOString() });
  }
  return state;
}

export function metrics(state: InspectorState) {
  const pending = state.runs.filter(run => run.decision !== 'approved' && !run.review);
  const rated = ROBOTS.map(robot => agentMetrics(state, robot.id)).filter(agent => agent.score !== null);
  return {
    total: state.runs.length,
    average: rated.length ? Math.round(rated.reduce((sum, agent) => sum + agent.score!, 0) / rated.length) : 0,
    pending: pending.length, critical: pending.filter(run => run.decision === 'blocked').length,
    active: ROBOTS.filter(robot => !state.robots[robot.id].paused).length,
  };
}

export function createReport(state: InspectorState, at: string) {
  return {
    title: 'Inspetor IA · MVP de governança de crédito PJ', generatedAt: at, simulated: true, schema: 2,
    policy: POLICY, rules: RULES, scoreSubject: 'Agente de IA; nunca o usuário ou cliente',
    scope: 'Sessão local; dados sintéticos; até 100 execuções e os últimos 500 registros de governança. Sem MCP, LLM ou robôs externos conectados.',
    scoring: 'Execução: soma dos pesos comprovados; desconhecido recebe zero provisório. Agente: média das últimas 20 execuções. Mesma regra descontada uma vez por execução. Recorrência: 3 ou mais execuções com a mesma violação na janela.',
    metrics: metrics(state), demoUser: DEMO_USER,
    robots: ROBOTS.map(robot => ({ ...robot, ...state.robots[robot.id], assessment: agentMetrics(state, robot.id) })),
    runs: state.runs, auditTrail: state.events,
  };
}
