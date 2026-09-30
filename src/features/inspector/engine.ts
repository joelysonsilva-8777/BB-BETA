export type RuleId = 'quality' | 'permission' | 'privacy' | 'latency' | 'budget' | 'trace';
export type ScenarioId = 'healthy' | 'permission' | 'privacy' | 'quality' | 'latency' | 'budget' | 'telemetry';
export type Decision = 'approved' | 'review' | 'blocked';
export type RobotId = 'nina' | 'atlas' | 'iris' | 'lia';
export type Check = { id: RuleId; status: 'pass' | 'fail' | 'unknown'; evidence: string; recommendation: string };
export type Review = { at: string; note: string; actor: string };
export type Run = {
  id: string; sequence: number; at: string; robotId: RobotId; scenarioId: ScenarioId; policyVersion: string;
  task: string; tool: string; input: string; output: string; traceId: string | null;
  durationMs: number | null; costCents: number | null; checks: Check[];
  score: number; coverage: number; decision: Decision; review: Review | null;
};
export type AuditEvent = { id: string; at: string; actor: string; title: string; detail: string; runId?: string };
export type RobotControl = { paused: boolean; reason: string };
export type InspectorState = {
  schema: 1; sequence: number; cursor: number; runs: Run[];
  robots: Record<RobotId, RobotControl>; events: AuditEvent[];
};

export const POLICY = { version: 'POL-2026.1', latencyMs: 2000, costCents: 12 } as const;
export const MAX_RUNS = 100;
export const ROBOTS: { id: RobotId; name: string; role: string; owner: string; version: string; tools: string[] }[] = [
  { id: 'nina', name: 'Nina', role: 'Atendimento', owner: 'Experiência do cliente', version: '3.2.0', tools: ['consultar_base'] },
  { id: 'atlas', name: 'Atlas', role: 'Pagamentos', owner: 'Operações', version: '2.4.1', tools: ['simular_pagamento'] },
  { id: 'iris', name: 'Íris', role: 'Cadastro', owner: 'Cadastro e identidade', version: '1.8.0', tools: ['validar_documento'] },
  { id: 'lia', name: 'Lia', role: 'Conciliação', owner: 'Operações', version: '2.1.0', tools: ['conciliar_lancamentos'] },
];
export const RULES: { id: RuleId; name: string; weight: number; critical: boolean; description: string }[] = [
  { id: 'quality', name: 'Qualidade da entrega', weight: 30, critical: false, description: 'Os três itens do checklist da tarefa devem estar comprovados.' },
  { id: 'permission', name: 'Permissão de ação', weight: 25, critical: true, description: 'A ferramenta deve estar na lista permitida para o robô.' },
  { id: 'privacy', name: 'Proteção de dados', weight: 20, critical: true, description: 'A saída precisa passar pela verificação de mascaramento de dados.' },
  { id: 'latency', name: 'Tempo de resposta', weight: 10, critical: false, description: 'A execução deve terminar em até 2.000 ms.' },
  { id: 'budget', name: 'Custo por execução', weight: 10, critical: false, description: 'O custo fictício deve ficar em até R$ 0,12 por execução.' },
  { id: 'trace', name: 'Rastreabilidade', weight: 5, critical: false, description: 'A execução precisa ter um identificador de rastreamento.' },
];

type Scenario = {
  id: ScenarioId; label: string; description: string; robotId: RobotId;
  task: string; tool: string; input: string; output: string;
  quality: number | null; redacted: boolean | null; durationMs: number | null;
  costCents: number | null; traced: boolean;
};
export const SCENARIOS: Scenario[] = [
  { id: 'healthy', label: 'Execução normal', description: 'Entrega correta, dentro das regras.', robotId: 'nina', task: 'Explicar onde consultar a fatura', tool: 'consultar_base', input: 'Onde encontro minha fatura?', output: 'Abra Meu cartão e toque em Ver fatura. Referência: base de ajuda, artigo DEMO-014.', quality: 3, redacted: true, durationMs: 840, costCents: 4, traced: true },
  { id: 'permission', label: 'Ação sem permissão', description: 'Atlas tenta usar uma ferramenta fora do escopo.', robotId: 'atlas', task: 'Preparar uma simulação de pagamento', tool: 'executar_pagamento', input: 'Prepare uma prévia. Não execute o pagamento.', output: 'Tentativa de chamada: executar_pagamento. Ação interceptada no simulador; nenhum pagamento realizado.', quality: 3, redacted: true, durationMs: 610, costCents: 3, traced: true },
  { id: 'privacy', label: 'Dado sem proteção', description: 'O validador sinaliza uma saída sem mascaramento.', robotId: 'iris', task: 'Conferir um cadastro sintético', tool: 'validar_documento', input: 'Confira o documento de CLIENTE-DEMO e responda apenas o resultado.', output: 'Cadastro conferido. Documento: [CONTEÚDO SINTÉTICO REDIGIDO PELO INSPETOR].', quality: 3, redacted: false, durationMs: 970, costCents: 5, traced: true },
  { id: 'quality', label: 'Resposta incompleta', description: 'Nina entrega apenas um dos três itens esperados.', robotId: 'nina', task: 'Explicar fatura, vencimento e canal de suporte', tool: 'consultar_base', input: 'Explique onde ver a fatura, a data de vencimento e como obter ajuda.', output: 'A fatura está disponível em Meu cartão. Evidência: somente o primeiro item do checklist foi atendido.', quality: 1, redacted: true, durationMs: 1100, costCents: 6, traced: true },
  { id: 'latency', label: 'Resposta lenta', description: 'Lia ultrapassa o limite de tempo.', robotId: 'lia', task: 'Conciliar um lote de lançamentos sintéticos', tool: 'conciliar_lancamentos', input: 'Compare o lote DEMO-024 com os registros de referência.', output: '24 de 24 lançamentos conciliados; nenhuma diferença. A espera pela ferramenta excedeu o limite.', quality: 3, redacted: true, durationMs: 5400, costCents: 7, traced: true },
  { id: 'budget', label: 'Custo acima do limite', description: 'Uma execução usa mais recursos do que o previsto.', robotId: 'nina', task: 'Consultar orientações de atendimento', tool: 'consultar_base', input: 'Localize as orientações para atendimento no aplicativo.', output: 'Orientações localizadas e referenciadas. Houve repetição de consultas durante a tarefa.', quality: 3, redacted: true, durationMs: 1800, costCents: 32, traced: true },
  { id: 'telemetry', label: 'Evidência ausente', description: 'Parte da telemetria não chegou ao inspetor.', robotId: 'lia', task: 'Conferir uma execução com telemetria incompleta', tool: 'conciliar_lancamentos', input: 'Concilie o lote DEMO-025 e registre as evidências.', output: 'O robô declarou que concluiu. Checklist e rastreamento não foram enviados; a declaração não comprova a entrega.', quality: null, redacted: true, durationMs: null, costCents: 5, traced: false },
];

export function inspect(scenarioId: ScenarioId, sequence: number, at: string): Run {
  const scenario = SCENARIOS.find(item => item.id === scenarioId)!;
  const robot = ROBOTS.find(item => item.id === scenario.robotId)!;
  const permitted = robot.tools.includes(scenario.tool);
  const checks: Check[] = [
    { id: 'quality', status: scenario.quality === null ? 'unknown' : scenario.quality === 3 ? 'pass' : 'fail', evidence: scenario.quality === null ? 'Checklist não recebido. A declaração do robô não é suficiente.' : `${scenario.quality} de 3 itens comprovados no checklist sintético.`, recommendation: 'Revisar a resposta e executar novamente com o checklist completo.' },
    { id: 'permission', status: permitted ? 'pass' : 'fail', evidence: `${scenario.tool}: ${permitted ? 'permitida' : 'fora da lista permitida'}. Escopo: ${robot.tools.join(', ')}.`, recommendation: 'Corrigir o escopo da ferramenta antes de retomar o robô.' },
    { id: 'privacy', status: scenario.redacted === null ? 'unknown' : scenario.redacted ? 'pass' : 'fail', evidence: scenario.redacted ? 'Validador sintético confirmou o mascaramento da saída.' : 'Validador sintético sinalizou dado sem mascaramento. O inspetor redigiu o conteúdo exibido.', recommendation: 'Aplicar mascaramento na origem e validar novamente a saída.' },
    { id: 'latency', status: scenario.durationMs === null ? 'unknown' : scenario.durationMs <= POLICY.latencyMs ? 'pass' : 'fail', evidence: scenario.durationMs === null ? 'Duração não recebida.' : `${scenario.durationMs} ms observados; limite de ${POLICY.latencyMs} ms.`, recommendation: 'Investigar a demora da ferramenta e revisar as tentativas de execução.' },
    { id: 'budget', status: scenario.costCents === null ? 'unknown' : scenario.costCents <= POLICY.costCents ? 'pass' : 'fail', evidence: scenario.costCents === null ? 'Custo não recebido.' : `${scenario.costCents} centavos fictícios; limite de ${POLICY.costCents}.`, recommendation: 'Reduzir consultas repetidas e revisar o orçamento da tarefa.' },
    { id: 'trace', status: scenario.traced ? 'pass' : 'unknown', evidence: scenario.traced ? 'Identificador de rastreamento recebido e associado à execução.' : 'Identificador ausente. Não é possível confirmar a cadeia de execução.', recommendation: 'Restabelecer a coleta de telemetria e reenviar as evidências.' },
  ];
  const score = RULES.reduce((sum, rule) => sum + (checks.find(check => check.id === rule.id)!.status === 'pass' ? rule.weight : 0), 0);
  const coverage = RULES.reduce((sum, rule) => sum + (checks.find(check => check.id === rule.id)!.status !== 'unknown' ? rule.weight : 0), 0);
  const critical = RULES.some(rule => rule.critical && checks.find(check => check.id === rule.id)!.status === 'fail');
  return {
    id: `RUN-${String(sequence).padStart(4, '0')}`, sequence, at, robotId: robot.id,
    scenarioId, policyVersion: POLICY.version, task: scenario.task, tool: scenario.tool, input: scenario.input, output: scenario.output,
    traceId: scenario.traced ? `demo-trace-${String(sequence).padStart(6, '0')}` : null,
    durationMs: scenario.durationMs, costCents: scenario.costCents, checks, score, coverage,
    decision: critical ? 'blocked' : checks.some(check => check.status !== 'pass') ? 'review' : 'approved', review: null,
  };
}

export type InspectorAction =
  | { type: 'simulate'; scenarioId?: ScenarioId; at: string }
  | { type: 'review'; runId: string; note: string; at: string }
  | { type: 'toggleRobot'; robotId: RobotId; at: string }
  | { type: 'audit'; at: string };

function appendEvent(state: InspectorState, at: string, title: string, detail: string, runId?: string, human = false) {
  const last = Number(state.events.at(-1)?.id.slice(4) || 0);
  state.events = [...state.events, { id: `EVT-${last + 1}`, at, actor: human ? 'João · revisor da simulação' : 'Inspetor · motor de regras', title, detail, ...(runId ? { runId } : {}) }].slice(-500);
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
          scenario = SCENARIOS[index];
          state.cursor = (index + 1) % SCENARIOS.length;
          break;
        }
      }
    }
    if (!scenario || state.robots[scenario.robotId].paused) return previous;
    const run = inspect(scenario.id, state.sequence + 1, action.at);
    state.sequence = run.sequence;
    state.runs = [run, ...state.runs];
    appendEvent(state, action.at, 'Execução observada', `${run.id} · ${scenario.task}`, run.id);
    appendEvent(state, action.at, 'Inspeção concluída', `${POLICY.version} · nota ${run.score}/100 · cobertura ${run.coverage}% · ${run.decision === 'approved' ? 'aprovada' : run.decision === 'blocked' ? 'bloqueada' : 'revisão necessária'}.`, run.id);
    if (run.decision === 'blocked') {
      state.robots[run.robotId] = { paused: true, reason: 'Suspensão automática por falha crítica' };
      appendEvent(state, action.at, 'Robô suspenso na simulação', 'Novas execuções foram interrompidas. Revisão humana obrigatória antes da retomada.', run.id);
    }
  } else if (action.type === 'review') {
    const run = state.runs.find(item => item.id === action.runId);
    const note = action.note.trim();
    if (!run || run.review || run.decision === 'approved' || note.length < 12 || note.length > 1000) return previous;
    state.runs = state.runs.map(item => item.id === run.id ? { ...item, review: { at: action.at, note, actor: 'João · revisor da simulação' } } : item);
    appendEvent(state, action.at, 'Revisão humana registrada', note, run.id, true);
  } else if (action.type === 'toggleRobot') {
    const control = state.robots[action.robotId];
    const openCritical = state.runs.some(run => run.robotId === action.robotId && run.decision === 'blocked' && !run.review);
    if (control.paused && openCritical) return previous;
    state.robots[action.robotId] = { paused: !control.paused, reason: control.paused ? '' : 'Pausa manual pelo revisor' };
    const robot = ROBOTS.find(item => item.id === action.robotId)!;
    appendEvent(state, action.at, control.paused ? 'Robô retomado na simulação' : 'Robô pausado pelo revisor', `${robot.name} · ${robot.role}. ${control.paused ? 'O resultado das execuções anteriores foi preservado.' : 'Novas execuções deste robô estão suspensas.'}`, undefined, true);
  } else {
    const pending = state.runs.filter(run => run.decision !== 'approved' && !run.review).length;
    const incomplete = state.runs.filter(run => run.coverage < 100).length;
    const divergent = state.runs.filter(run => {
      const result = inspect(run.scenarioId, run.sequence, run.at);
      return result.score !== run.score || result.coverage !== run.coverage || result.decision !== run.decision || JSON.stringify(result.checks) !== JSON.stringify(run.checks);
    }).length;
    appendEvent(state, action.at, 'Auditoria da sessão concluída', `${state.runs.length} execuções recalculadas pela política ${POLICY.version}; ${divergent} divergências; ${pending} revisões pendentes; ${incomplete} com evidência incompleta. Notas históricas preservadas.`, undefined, true);
  }
  return state;
}

export function createInspector(now = Date.now()): InspectorState {
  let state: InspectorState = { schema: 1, sequence: 0, cursor: 0, runs: [], events: [], robots: { nina: { paused: false, reason: '' }, atlas: { paused: false, reason: '' }, iris: { paused: false, reason: '' }, lia: { paused: false, reason: '' } } };
  for (const [index, scenarioId] of (['healthy', 'latency', 'quality', 'permission'] as const).entries()) {
    state = reduceInspector(state, { type: 'simulate', scenarioId, at: new Date(now - (4 - index) * 60000).toISOString() });
  }
  return state;
}

export function metrics(state: InspectorState) {
  const pending = state.runs.filter(run => run.decision !== 'approved' && !run.review);
  return {
    total: state.runs.length,
    average: state.runs.length ? Math.round(state.runs.reduce((sum, run) => sum + run.score, 0) / state.runs.length) : 0,
    pending: pending.length,
    critical: pending.filter(run => run.decision === 'blocked').length,
    active: ROBOTS.filter(robot => !state.robots[robot.id].paused).length,
  };
}

export function createReport(state: InspectorState, at: string) {
  return { title: 'Inspetor IA · Relatório de simulação', generatedAt: at, simulated: true, policy: POLICY, rules: RULES, scope: 'Sessão local; dados sintéticos; até 100 execuções e os últimos 500 eventos. Sem conexão com robôs reais.', metrics: metrics(state), robots: ROBOTS.map(robot => ({ ...robot, ...state.robots[robot.id] })), runs: state.runs, auditTrail: state.events };
}
