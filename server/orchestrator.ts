import { createHash, randomUUID } from 'node:crypto';
import type { AgentId, Execution, Intent, Monitoring } from '../src/features/assistant/contracts.ts';
import { AgentRegistry, BusinessUserAgent, FinancialAgent, IndividualUserAgent, TaskDispatcher, type Agent, type Task } from './agents.ts';
import { requireValue, safeError } from './errors.ts';
import { interpret, type IntentProvider } from './routing.ts';
import { DomainServices, PermissionValidator } from './services.ts';
import type { Principal, Store } from './store.ts';

type PlanStep = { agentId: AgentId; operation: string; companyFromPrevious?: boolean };
const plans: Partial<Record<Intent, PlanStep[]>> = {
  'finance.personal': [{ agentId: 'financial', operation: 'finance.personal' }],
  'profile.read': [{ agentId: 'individual', operation: 'profile.read' }],
  'profile.update': [{ agentId: 'individual', operation: 'profile.update' }],
  'business.read': [{ agentId: 'business', operation: 'business.read' }],
  'finance.business': [{ agentId: 'business', operation: 'business.read' }, { agentId: 'financial', operation: 'finance.business', companyFromPrevious: true }],
};
export class MainOrchestratorAgent {
  store: Store;
  registry: AgentRegistry;
  dispatcher: TaskDispatcher;
  provider?: IntentProvider;
  timeoutMs: number;
  running = new Map<string, { controller: AbortController; done: Promise<void> }>();
  constructor(store: Store, options: { agents?: Agent[]; provider?: IntentProvider; timeoutMs?: number } = {}) {
    this.store = store; this.provider = options.provider; this.timeoutMs = options.timeoutMs ?? 8000;
    const services = new DomainServices(store);
    this.registry = new AgentRegistry(store, options.agents ?? [new FinancialAgent(services), new IndividualUserAgent(services), new BusinessUserAgent(services)]);
    this.dispatcher = new TaskDispatcher(this.registry);
  }
  start(principal: Principal, conversationId: string, message: string, key: string): Execution {
    PermissionValidator.user(principal); this.store.ownConversation(conversationId, principal);
    const fingerprint = createHash('sha256').update(JSON.stringify({ conversationId, message })).digest('hex');
    const previous = this.store.previous(principal, key, fingerprint); if (previous) return previous;
    requireValue(this.running.size < 20, 429, 'BUSY', 'O servidor está ocupado. Tente novamente em instantes.');
    requireValue(![...this.store.history(conversationId, principal)].some(run => run.status === 'running'), 409, 'BUSY', 'Aguarde a execução atual desta conversa.');
    requireValue(this.store.history(conversationId, principal).length < 100, 422, 'HISTORY_LIMIT', 'Esta conversa atingiu 100 solicitações. Abra uma nova conversa.');
    const run: Execution = { id: randomUUID(), correlationId: randomUUID(), conversationId, userId: principal.id, message, intent: 'clarify', status: 'running', startedAt: new Date().toISOString(), durationMs: 0, routing: 'deterministic', summary: 'Interpretando solicitação no servidor.', steps: [] };
    this.store.insert(run, key, fingerprint);
    const controller = new AbortController();
    // Defer until the execution is registered, so cancellation and shutdown see it.
    const done = Promise.resolve().then(() => this.execute(run, principal, controller)).finally(() => this.running.delete(run.id));
    this.running.set(run.id, { controller, done });
    return run;
  }
  private async execute(run: Execution, principal: Principal, controller: AbortController) {
    const start = performance.now();
    const timer = setTimeout(() => controller.abort(new Error('TIMEOUT')), this.timeoutMs);
    const signal = controller.signal;
    try {
      const interpretation = await interpret(run.message, this.provider, signal);
      signal.throwIfAborted(); run.intent = interpretation.intent; run.routing = interpretation.routing;
      const plan = plans[run.intent];
      if (!plan) {
        run.status = run.intent === 'clarify' ? 'needs_clarification' : 'failed';
        run.summary = interpretation.summary ?? 'Solicitação não suportada.'; return;
      }
      requireValue(plan.length <= 4, 500, 'STEP_LIMIT', 'Limite de etapas excedido.');
      const visited = new Set<string>();
      for (const item of plan) {
        signal.throwIfAborted();
        requireValue(!visited.has(`${item.agentId}:${item.operation}`), 500, 'LOOP', 'Etapa repetida impedida.');
        visited.add(`${item.agentId}:${item.operation}`);
        const params: Task['params'] = {};
        if (interpretation.name) params.name = interpretation.name;
        if (item.companyFromPrevious) {
          const companyId = run.steps.at(-1)?.data?.companyId;
          requireValue(typeof companyId === 'string', 500, 'DEPENDENCY_FAILED', 'Não foi possível verificar a empresa vinculada.');
          PermissionValidator.company(this.store, principal, companyId); params.companyId = companyId;
        }
        const task: Task = { id: randomUUID(), conversationId: run.conversationId, correlationId: run.correlationId, principal, intent: run.intent, agentId: item.agentId, operation: item.operation, params };
        const step = await this.dispatcher.dispatch(task, signal, current => {
          const index = run.steps.findIndex(s => s.id === current.id);
          if (index >= 0) run.steps[index] = current; else run.steps.push(current);
          run.summary = `${this.registry.agents.get(current.agentId)?.definition.name ?? current.agentId}: ${current.summary}`;
          this.store.save(run);
        });
        if (step.status !== 'completed') { run.status = step.status; run.summary = step.error ?? 'A tarefa falhou e as etapas dependentes não foram executadas.'; return; }
      }
      signal.throwIfAborted();
      if (run.intent === 'profile.update') {
        const name = run.steps.at(-1)?.data?.proposedName;
        requireValue(typeof name === 'string', 500, 'INVALID_RESULT', 'Proposta inválida.');
        const id = randomUUID(), expires = Date.now() + 5 * 60_000;
        run.confirmation = { id, expiresAt: new Date(expires).toISOString(), name };
        run.status = 'needs_confirmation'; run.summary = `Alterar seu nome demonstrativo para “${name}”? O cadastro ainda não foi modificado.`;
        this.store.transaction(() => {
          this.store.db.prepare('INSERT INTO confirmations(id,user_id,execution_id,name,expires) VALUES(?,?,?,?,?)').run(id, principal.id, run.id, name, expires);
          this.store.save(run); this.store.audit('profile.update.proposed');
        });
      } else {
        run.status = 'completed'; run.summary = run.intent === 'finance.business' ? 'Empresa autorizada verificada. Resumo financeiro empresarial calculado com os registros fictícios.' : run.steps.at(-1)!.summary;
      }
    } catch (error) { run.status = signal.aborted ? 'cancelled' : 'failed'; run.summary = signal.aborted ? 'Execução cancelada ou limite de tempo atingido. Consulte o histórico antes de tentar novamente.' : safeError(error); }
    finally {
      clearTimeout(timer); run.durationMs = Math.round(performance.now() - start); this.store.save(run);
      this.store.audit(`execution.${run.status}`);
    }
  }
  confirm(principal: Principal, id: string): Execution {
    PermissionValidator.user(principal);
    const agent = this.registry.get('individual', 'profile.confirm');
    requireValue(agent.confirm, 503, 'AGENT_UNAVAILABLE', 'O agente não suporta confirmações.');
    return agent.confirm(principal, id);
  }
  cancel(principal: Principal, id: string) {
    const run = this.store.execution(id, principal);
    if (run.status === 'running') { this.running.get(id)?.controller.abort(new Error('CANCELLED')); return run; }
    if (run.status === 'needs_confirmation') { run.status = 'cancelled'; run.summary = 'Proposta cancelada. O cadastro não foi modificado.'; delete run.confirmation; this.store.save(run); this.store.audit('profile.update.cancelled'); }
    return run;
  }
  monitoring(principal: Principal): Monitoring {
    PermissionValidator.admin(principal);
    return {
      agents: this.registry.list(),
      executions: this.store.allExecutions().slice(0, 100).map(({ id, correlationId, status, intent, startedAt, durationMs, steps }) => ({ id, correlationId, status, intent, startedAt, durationMs, steps: steps.map(({ id, agentId, operation, status, startedAt, durationMs }) => ({ id, agentId, operation, status, startedAt, durationMs, summary: 'Metadados técnicos; conteúdo privado omitido.' })) })),
      audit: this.store.db.prepare('SELECT action,at FROM audit ORDER BY rowid DESC LIMIT 100').all() as Monitoring['audit'],
    };
  }
  async shutdown() { const jobs = [...this.running.values()]; for (const job of jobs) job.controller.abort(); await Promise.allSettled(jobs.map(job => job.done)); }
}
