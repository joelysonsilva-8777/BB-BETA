import { randomUUID } from 'node:crypto';
import type { AgentDefinition, AgentId, Execution, Fields, Intent, Step } from '../src/features/assistant/contracts.ts';
import { requireValue, safeError } from './errors.ts';
import { DomainServices } from './services.ts';
import type { Principal, Store } from './store.ts';

export type Task = {
  id: string; conversationId: string; correlationId: string; principal: Principal;
  intent: Intent; agentId: AgentId; operation: string; params: { companyId?: string; name?: string };
};
export interface Agent { definition: AgentDefinition; execute(task: Task, signal: AbortSignal): Promise<{ data: Fields; summary: string }>; confirm?: (principal: Principal, id: string) => Execution }
function definition(id: AgentId, name: string, description: string, operations: string[], authorization: string): AgentDefinition {
  return { id, name, description, capabilities: operations, operations, inputContract: 'Task v1: identidade do servidor, intenção e parâmetros validados', outputContract: 'Resultado v1: campos escalares e resumo validado', authorization, enabled: true };
}
export class FinancialAgent implements Agent {
  definition = definition('financial', 'Agente financeiro', 'Calcula totais dos movimentos autorizados em centavos.', ['finance.personal', 'finance.business'], 'Titular da conta ou membro da empresa');
  services: DomainServices;
  constructor(services: DomainServices) { this.services = services; }
  async execute(task: Task, signal: AbortSignal) {
    signal.throwIfAborted();
    requireValue(task.operation === 'finance.personal' || typeof task.params.companyId === 'string', 400, 'INVALID_TASK', 'Vínculo empresarial ausente.');
    return { data: this.services.finance(task.principal, task.params.companyId), summary: 'Resumo calculado a partir dos registros fictícios autorizados.' };
  }
}
export class IndividualUserAgent implements Agent {
  definition = definition('individual', 'Agente de cadastro individual', 'Consulta o próprio perfil e valida propostas de nome.', ['profile.read', 'profile.update', 'profile.confirm'], 'Somente o próprio titular; edição exige confirmação');
  services: DomainServices;
  constructor(services: DomainServices) { this.services = services; }
  confirm(principal: Principal, id: string) { return this.services.confirmName(principal, id); }
  async execute(task: Task, signal: AbortSignal) {
    signal.throwIfAborted();
    const data = this.services.profile(task.principal);
    if (task.operation === 'profile.update') {
      requireValue(typeof task.params.name === 'string' && /^[\p{L}][\p{L} .'-]{1,79}$/u.test(task.params.name), 400, 'INVALID_NAME', 'Informe um nome de 2 a 80 caracteres, sem números ou comandos.');
      return { data: { proposedName: task.params.name, source: 'Proposta demonstrativa · ainda não aplicada' }, summary: 'Confirme a proposta para alterar o nome no cadastro demonstrativo.' };
    }
    return { data, summary: 'Seu cadastro demonstrativo foi consultado.' };
  }
}
export class BusinessUserAgent implements Agent {
  definition = definition('business', 'Agente empresarial', 'Verifica vínculo e consulta cadastro da pessoa jurídica.', ['business.read'], 'Associação entre usuário autenticado e empresa no banco');
  services: DomainServices;
  constructor(services: DomainServices) { this.services = services; }
  async execute(task: Task, signal: AbortSignal) { signal.throwIfAborted(); return { data: this.services.company(task.principal), summary: 'Empresa vinculada localizada e acesso verificado.' }; }
}
export class AgentRegistry {
  agents = new Map<AgentId, Agent>();
  store: Store;
  constructor(store: Store, agents: Agent[]) {
    this.store = store;
    for (const agent of agents) { requireValue(!this.agents.has(agent.definition.id), 500, 'DUPLICATE_AGENT', 'Agente duplicado.'); this.agents.set(agent.definition.id, agent); }
  }
  list() { return [...this.agents.values()].map(agent => ({ ...agent.definition, enabled: this.store.enabled(agent.definition.id) })); }
  get(id: AgentId, operation: string) {
    const agent = this.agents.get(id);
    requireValue(agent && this.store.enabled(id), 503, 'AGENT_UNAVAILABLE', 'O agente necessário está desabilitado ou indisponível.');
    requireValue(agent.definition.operations.includes(operation), 400, 'INVALID_OPERATION', 'Operação fora das capacidades do agente.'); return agent;
  }
}
export class TaskDispatcher {
  registry: AgentRegistry;
  constructor(registry: AgentRegistry) { this.registry = registry; }
  async dispatch(task: Task, signal: AbortSignal, onStep: (step: Step) => void): Promise<Step> {
    const start = performance.now();
    const step: Step = { id: randomUUID(), agentId: task.agentId, operation: task.operation, status: 'running', startedAt: new Date().toISOString(), durationMs: 0, summary: 'Executando operação autorizada.' };
    onStep(step);
    let abortListener: () => void = () => {};
    try {
      signal.throwIfAborted();
      const agent = this.registry.get(task.agentId, task.operation);
      const result = await Promise.race([
        agent.execute(task, signal),
        new Promise<never>((_, reject) => { abortListener = () => reject(signal.reason); signal.addEventListener('abort', abortListener, { once: true }); }),
      ]);
      signal.throwIfAborted();
      requireValue(result && typeof result.summary === 'string' && result.data && typeof result.data === 'object' && !Array.isArray(result.data) && Object.values(result.data).every(v => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))), 500, 'INVALID_RESULT', 'O agente retornou um resultado inválido.');
      step.status = 'completed'; step.summary = result.summary; step.data = result.data;
    } catch (error) { step.status = signal.aborted ? 'cancelled' : 'failed'; step.error = signal.aborted ? 'Execução cancelada ou limite de tempo atingido.' : safeError(error); step.summary = step.error; }
    finally { signal.removeEventListener('abort', abortListener); }
    step.durationMs = Math.round(performance.now() - start); onStep(step); return step;
  }
}
