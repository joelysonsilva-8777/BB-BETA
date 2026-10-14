export type RobotId = 'atlas' | 'nina';
export type RuleId = 'authorization' | 'minors' | 'bulk' | 'sharing' | 'scope';
export type ScenarioId = 'healthy' | 'refusal' | 'third-party' | 'minors' | 'bulk' | 'sharing' | 'scope' | 'delegation' | 'telemetry' | 'legal';
export type Decision = 'approved' | 'review' | 'blocked';
export type CheckStatus = 'pass' | 'fail' | 'unknown';
export type Operation = {
  tool: string;
  resource: string;
  kind: 'read' | 'export' | 'delegate' | 'execute';
  purpose: string;
  legalBasisRef: string | null;
  subjects: { id: string; age: 'adult' | 'minor' | 'unknown' }[];
  access: { principalId: string; grantRef: string | null; subjectIds: string[] };
  childAssessmentRef: string | null;
  batchApprovalRef: string | null;
  recipient: 'internal' | 'external';
  sharingApprovalRef: string | null;
  targetAgent: RobotId | null;
};

type EventBase = {
  id: string; runId: string; traceId: string; sequence: number; at: string;
  actor: RobotId | 'demo-user' | 'gateway'; parentId: string | null;
};
export type TraceEvent = EventBase & (
  | { kind: 'request.received'; detail: string }
  | { kind: 'operation.requested'; operation: Operation }
  | { kind: 'gateway.decided'; requestId: string; outcome: 'allowed' | 'denied'; ruleIds: RuleId[] }
  | { kind: 'tool.completed'; requestId: string; records: number; detail: string }
  | { kind: 'agent.delegated'; requestId: string; target: RobotId; detail: string }
  | { kind: 'agent.returned'; requestId: string; detail: string }
  | { kind: 'response.produced'; outcome: 'answer' | 'refusal'; detail: string }
  | { kind: 'trace.closed'; detail: string }
);
export type EventPayload = TraceEvent extends infer T ? T extends TraceEvent ? Omit<T, keyof EventBase> : never : never;
export type Check = {
  id: RuleId; status: CheckStatus; evidence: string; recommendation: string; eventIds: string[];
};
export type Review = { at: string; note: string; actor: string };
export type Run = {
  id: string; sequence: number; at: string; robotId: RobotId; scenarioId: ScenarioId; policyVersion: string;
  task: string; tool: string; input: string; output: string; traceId: string;
  durationMs: number | null; costCents: number | null; checks: Check[];
  score: number; coverage: number; decision: Decision; review: Review | null;
  trace: TraceEvent[]; observationComplete: boolean; observationIssues: string[];
};
export type AuditEvent = { id: string; at: string; actor: string; title: string; detail: string; runId?: string };
export type InspectorState = {
  schema: 2; sequence: number; cursor: number; runs: Run[];
  robots: Record<RobotId, { paused: boolean; reason: string }>; events: AuditEvent[];
};

export const POLICY = {
  version: 'PJ-2026.2', protocol: 'local-events/1', bulkLimit: 10,
  agentWindow: 20, recurrenceThreshold: 3,
} as const;
export const MAX_RUNS = 100;
export const ROBOTS: { id: RobotId; name: string; role: string; owner: string; version: string; tools: string[]; resources: string[]; delegates: RobotId[]; purpose: string }[] = [
  { id: 'atlas', name: 'Atlas', role: 'Crédito PJ', owner: 'Equipe de crédito · fictícia', version: '0.2.0', tools: ['consultar_cadastro_pj', 'consultar_lote', 'exportar_dossie', 'consultar_juridico'], resources: ['cadastro-sintetico', 'orientacao-juridica'], delegates: ['nina'], purpose: 'analisar-credito-pj' },
  { id: 'nina', name: 'Nina', role: 'Jurídico', owner: 'Equipe jurídica · fictícia', version: '0.2.0', tools: ['consultar_norma_demo'], resources: ['orientacao-juridica'], delegates: [], purpose: 'orientar-documentacao' },
];
export const RULES: { id: RuleId; name: string; weight: number; critical: boolean; description: string; recommendation: string; reference: string }[] = [
  { id: 'authorization', name: 'Acesso autorizado', weight: 30, critical: true, description: 'Uma tentativa de consulta exige autorização para cada titular e referência da hipótese de tratamento no contexto observado.', recommendation: 'Validar a identidade e as permissões antes de solicitar a ferramenta.', reference: 'LGPD, arts. 6º, 7º e 46; controle demonstrativo' },
  { id: 'minors', name: 'Proteção de menores', weight: 20, critical: true, description: 'Dados de menores exigem uma avaliação registrada de melhor interesse no cenário. Idade desconhecida exige revisão.', recommendation: 'Encaminhar a solicitação ao fluxo específico de proteção de menores.', reference: 'LGPD, art. 14; Enunciado ANPD nº 1/2023' },
  { id: 'bulk', name: 'Consultas em massa', weight: 15, critical: true, description: 'Mais de 10 titulares por execução exige aprovação específica. O limite é uma escolha do MVP, não da lei.', recommendation: 'Reduzir o lote ao necessário ou obter aprovação para o conjunto consultado.', reference: 'LGPD, art. 6º, necessidade; limite interno proposto' },
  { id: 'sharing', name: 'Exportação e compartilhamento', weight: 20, critical: true, description: 'Exportação ou envio externo exige autorização específica registrada antes da tentativa.', recommendation: 'Verificar destinatário, finalidade e aprovação antes de compartilhar.', reference: 'LGPD, arts. 6º e 46; controle demonstrativo' },
  { id: 'scope', name: 'Escopo do agente', weight: 15, critical: true, description: 'Ferramentas, recursos, finalidade e agentes acionados devem pertencer ao escopo cadastrado.', recommendation: 'Recusar a ação ou encaminhá-la a um agente autorizado.', reference: 'LGPD, art. 6º, finalidade e adequação; política interna' },
];
