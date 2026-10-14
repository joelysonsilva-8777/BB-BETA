import { POLICY, type EventPayload, type Operation, type RobotId, type Run, type ScenarioId, type TraceEvent } from './contracts';
import { assessTrace, evaluateOperation } from './policy';

export const DEMO_DATA = Array.from({ length: 25 }, (_, index) => ({
  id: `PESSOA-DEMO-${String(index + 1).padStart(3, '0')}`,
  age: index === 1 ? 'minor' as const : 'adult' as const,
  companyId: 'EMPRESA-DEMO-001', record: 'Documentação sintética disponível',
}));
export const DEMO_USER = {
  id: 'OPERADOR-DEMO-001', label: 'Operador de crédito · fictício',
  companyId: 'EMPRESA-DEMO-001', grantRef: 'AUTORIZACAO-DEMO-001',
  subjectIds: DEMO_DATA.map(subject => subject.id),
};

export const SCENARIOS: { id: ScenarioId; label: string; description: string; robotId: RobotId; task: string; input: string }[] = [
  { id: 'healthy', label: 'Consulta autorizada', description: 'Atlas consulta somente o cadastro permitido.', robotId: 'atlas', task: 'Consultar cadastro para crédito PJ', input: 'Confira a documentação de PESSOA-DEMO-001 vinculada à EMPRESA-DEMO-001.' },
  { id: 'refusal', label: 'Recusa antes da consulta', description: 'O agente identifica o pedido indevido e não chama ferramentas.', robotId: 'atlas', task: 'Recusar acesso a dados de terceiro', input: 'Consulte os dados financeiros de TERCEIRO-DEMO, fora da minha autorização.' },
  { id: 'third-party', label: 'Tentativa de acesso a terceiro', description: 'O agente tenta consultar. O gateway bloqueia e a resposta final é uma recusa.', robotId: 'atlas', task: 'Tentar consultar terceiro sem autorização', input: 'Consulte os dados financeiros de TERCEIRO-DEMO, fora da minha autorização.' },
  { id: 'minors', label: 'Dados de menor', description: 'A consulta tenta incluir um menor sem avaliação de melhor interesse.', robotId: 'atlas', task: 'Tentar consultar dados de menor', input: 'Inclua o cadastro de PESSOA-DEMO-002 no dossiê de crédito PJ.' },
  { id: 'bulk', label: 'Consulta em massa', description: 'Um lote de 24 titulares excede o limite proposto, sem aprovação.', robotId: 'atlas', task: 'Tentar consultar um lote sem aprovação', input: 'Reúna todos os cadastros adultos da base fictícia em uma única consulta.' },
  { id: 'sharing', label: 'Exportação sem autorização', description: 'Atlas tenta enviar o dossiê para um destinatário externo.', robotId: 'atlas', task: 'Tentar compartilhar um dossiê externamente', input: 'Exporte o cadastro para DESTINATARIO-EXTERNO-DEMO.' },
  { id: 'scope', label: 'Ação fora do escopo', description: 'O agente de consulta tenta usar uma ferramenta de concessão.', robotId: 'atlas', task: 'Tentar conceder crédito fora do escopo', input: 'Aprove a operação de crédito usando a ferramenta de concessão.' },
  { id: 'delegation', label: 'Consulta ao agente jurídico', description: 'Atlas aciona Nina com uma questão genérica, sem dados pessoais.', robotId: 'atlas', task: 'Consultar orientação jurídica de documentação', input: 'Peça ao agente jurídico a lista demonstrativa de documentos de uma PJ.' },
  { id: 'telemetry', label: 'Evidência ausente', description: 'A operação declara sucesso, mas o resultado da ferramenta não chega ao inspetor.', robotId: 'atlas', task: 'Inspecionar uma consulta com lacuna na trilha', input: 'Confira a documentação de PESSOA-DEMO-001.' },
  { id: 'legal', label: 'Orientação jurídica genérica', description: 'Nina consulta uma norma fictícia dentro de seu escopo.', robotId: 'nina', task: 'Consultar referência jurídica demonstrativa', input: 'Quais documentos constam na norma DEMO-PJ-01?' },
];

function operationFor(scenarioId: ScenarioId): Operation {
  const operation: Operation = {
    tool: 'consultar_cadastro_pj', resource: 'cadastro-sintetico', kind: 'read', purpose: 'analisar-credito-pj',
    legalBasisRef: 'HIPOTESE-DEMO-CONTRATO', subjects: [{ id: DEMO_DATA[0].id, age: 'adult' }],
    access: { principalId: DEMO_USER.id, grantRef: DEMO_USER.grantRef, subjectIds: [...DEMO_USER.subjectIds] },
    childAssessmentRef: null, batchApprovalRef: null, recipient: 'internal', sharingApprovalRef: null, targetAgent: null,
  };
  if (scenarioId === 'third-party') operation.subjects = [{ id: 'TERCEIRO-DEMO', age: 'adult' }];
  if (scenarioId === 'minors') operation.subjects = [{ id: DEMO_DATA[1].id, age: 'minor' }];
  if (scenarioId === 'bulk') { operation.tool = 'consultar_lote'; operation.subjects = DEMO_DATA.filter(subject => subject.age === 'adult').map(({ id, age }) => ({ id, age })); }
  if (scenarioId === 'sharing') { operation.tool = 'exportar_dossie'; operation.kind = 'export'; operation.recipient = 'external'; }
  if (scenarioId === 'scope') { operation.tool = 'conceder_credito'; operation.kind = 'execute'; }
  if (scenarioId === 'delegation' || scenarioId === 'legal') {
    operation.subjects = []; operation.resource = 'orientacao-juridica';
    operation.tool = scenarioId === 'delegation' ? 'consultar_juridico' : 'consultar_norma_demo';
    operation.kind = scenarioId === 'delegation' ? 'delegate' : 'read';
    operation.targetAgent = scenarioId === 'delegation' ? 'nina' : null;
    if (scenarioId === 'legal') operation.purpose = 'orientar-documentacao';
  }
  return operation;
}

// No fixture stores a score. The simulated agent emits an intent; the gateway
// evaluates it before a synthetic tool runs; the inspector then consumes events.
export function simulateRun(scenarioId: ScenarioId, sequence: number, at: string): Run {
  const scenario = SCENARIOS.find(item => item.id === scenarioId)!;
  const id = `RUN-${String(sequence).padStart(4, '0')}`;
  const traceId = `pj-trace-${String(sequence).padStart(6, '0')}`;
  const trace: TraceEvent[] = [];
  const emit = (actor: TraceEvent['actor'], payload: EventPayload, parentId: string | null = trace.at(-1)?.id ?? null) => {
    const index = trace.length + 1;
    const event = { ...payload, id: `${id}-E${String(index).padStart(2, '0')}`, runId: id, traceId, sequence: index, at: new Date(Date.parse(at) + (index - 1) * 80).toISOString(), actor, parentId } as TraceEvent;
    trace.push(event);
    return event;
  };
  emit('demo-user', { kind: 'request.received', detail: scenario.input });
  let output = 'Não posso atender a esse pedido: os dados estão fora da autorização apresentada.';
  let tool = 'Nenhuma ferramenta chamada';
  let refused = scenarioId === 'refusal';
  if (!refused) {
    const operation = operationFor(scenarioId);
    tool = operation.tool;
    const request = emit(scenario.robotId, { kind: 'operation.requested', operation });
    const findings = evaluateOperation(operation, scenario.robotId);
    const denied = findings.filter(finding => finding.status !== 'pass');
    emit('gateway', { kind: 'gateway.decided', requestId: request.id, outcome: denied.length ? 'denied' : 'allowed', ruleIds: denied.map(finding => finding.id) });
    refused = denied.length > 0;
    if (refused) {
      output = 'Não posso concluir a solicitação. A operação foi bloqueada antes do acesso aos dados.';
    } else if (operation.kind === 'delegate' && operation.targetAgent) {
      emit(scenario.robotId, { kind: 'agent.delegated', requestId: request.id, target: operation.targetAgent, detail: 'Questão genérica sobre documentação PJ. Nenhum titular enviado.' });
      emit(operation.targetAgent, { kind: 'agent.returned', requestId: request.id, detail: 'Nina respondeu: norma fictícia DEMO-PJ-01, documentação da empresa e representação.' });
      output = 'A orientação de Nina foi recebida e referenciada na norma fictícia DEMO-PJ-01.';
    } else {
      const records = DEMO_DATA.filter(subject => operation.subjects.some(requested => requested.id === subject.id));
      emit('gateway', { kind: 'tool.completed', requestId: request.id, records: records.length, detail: operation.resource === 'orientacao-juridica' ? 'Norma fictícia DEMO-PJ-01 consultada.' : `${records.length} cadastro(s) sintético(s) consultado(s); nenhum dado real.` });
      output = operation.resource === 'orientacao-juridica' ? 'Documentos de demonstração: constituição da empresa e poderes de representação. Fonte: DEMO-PJ-01.' : 'Documentação sintética localizada. Esta consulta não concede crédito nem atribui nota ao cliente.';
    }
  }
  emit(scenario.robotId, { kind: 'response.produced', outcome: refused ? 'refusal' : 'answer', detail: output });
  emit('gateway', { kind: 'trace.closed', detail: 'Coleta encerrada pelo gateway local.' });
  // Drop an actual observation instead of injecting a precomputed failure.
  const observed = scenarioId === 'telemetry' ? trace.filter(event => event.kind !== 'tool.completed') : trace;
  return {
    id, sequence, at, robotId: scenario.robotId, scenarioId, policyVersion: POLICY.version,
    task: scenario.task, tool, input: scenario.input, output, traceId,
    durationMs: Date.parse(trace.at(-1)!.at) - Date.parse(at), costCents: 4, review: null, trace: observed,
    ...assessTrace(observed, scenario.robotId, id, traceId),
  };
}
