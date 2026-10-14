import { randomUUID } from 'node:crypto';
import type { Execution, Fields } from '../src/features/assistant/contracts.ts';
import type { Principal, Store } from './store.ts';
import { requireValue } from './errors.ts';

export class PermissionValidator {
  static user(principal: Principal) { requireValue(principal.role === 'user', 403, 'FORBIDDEN', 'Esta sessão não possui acesso a contas individuais.'); }
  static admin(principal: Principal) { requireValue(principal.role === 'admin', 403, 'FORBIDDEN', 'Monitoramento disponível somente ao administrador.'); }
  static company(store: Store, principal: Principal, id: string) {
    this.user(principal);
    requireValue(store.db.prepare('SELECT 1 FROM memberships WHERE user_id=? AND company_id=?').get(principal.id, id), 403, 'FORBIDDEN', 'Você não possui vínculo autorizado com essa empresa.');
  }
}

export class DomainServices {
  store: Store;
  constructor(store: Store) { this.store = store; }
  profile(principal: Principal): Fields {
    PermissionValidator.user(principal);
    const row = this.store.db.prepare('SELECT name FROM users WHERE id=?').get(principal.id)!;
    return { name: row.name as string, category: 'Cadastro individual demonstrativo', source: 'SQLite · dados fictícios' };
  }
  confirmName(principal: Principal, id: string): Execution {
    PermissionValidator.user(principal);
    const start = performance.now();
    return this.store.transaction(() => {
      const row = this.store.db.prepare('SELECT * FROM confirmations WHERE id=? AND user_id=?').get(id, principal.id);
      requireValue(row, 404, 'NOT_FOUND', 'Confirmação não encontrada.');
      const run = this.store.execution(row.execution_id as string, principal);
      if (row.consumed === 1) return run;
      requireValue(run.status === 'needs_confirmation' && Number(row.expires) > Date.now(), 409, 'CONFIRMATION_EXPIRED', 'Proposta expirada ou cancelada. Envie outra solicitação.');
      requireValue(this.store.enabled('individual'), 503, 'AGENT_UNAVAILABLE', 'O agente de cadastro está desabilitado.');
      this.store.db.prepare('UPDATE users SET name=? WHERE id=?').run(row.name, principal.id);
      this.store.db.prepare('UPDATE confirmations SET consumed=1 WHERE id=?').run(id);
      run.status = 'completed'; run.summary = 'Nome atualizado no cadastro demonstrativo após sua confirmação.';
      const durationMs = Math.round(performance.now() - start);
      run.durationMs += durationMs;
      run.steps.push({ id: randomUUID(), agentId: 'individual', operation: 'profile.confirm', status: 'completed', startedAt: new Date().toISOString(), durationMs, summary: run.summary, data: { name: row.name as string, source: 'SQLite · dados fictícios' } });
      delete run.confirmation; this.store.save(run); this.store.audit('profile.update.confirmed'); return run;
    });
  }
  company(principal: Principal): Fields {
    PermissionValidator.user(principal);
    const rows = this.store.db.prepare('SELECT c.* FROM companies c JOIN memberships m ON m.company_id=c.id WHERE m.user_id=?').all(principal.id);
    requireValue(rows.length === 1, 422, 'COMPANY_AMBIGUOUS', rows.length ? 'Há mais de uma empresa vinculada. A seleção explícita ainda não está disponível.' : 'Não há empresa vinculada à sua conta de demonstração.');
    const row = rows[0]; PermissionValidator.company(this.store, principal, row.id as string);
    return { companyId: row.id as string, name: row.name as string, registration: row.registration as string, source: 'SQLite · dados fictícios' };
  }
  finance(principal: Principal, companyId?: string): Fields {
    PermissionValidator.user(principal);
    if (companyId) PermissionValidator.company(this.store, principal, companyId);
    const owner = companyId ?? principal.id;
    const account = this.store.db.prepare('SELECT opening FROM accounts WHERE owner=?').get(owner);
    requireValue(account, 404, 'NO_RECORDS', 'Não há registros financeiros disponíveis.');
    const rows = this.store.db.prepare('SELECT amount FROM ledger WHERE owner=?').all(owner);
    const amounts = rows.map(row => Number(row.amount));
    requireValue(amounts.every(Number.isSafeInteger) && Number.isSafeInteger(Number(account.opening)), 500, 'INVALID_LEDGER', 'Os registros apresentam valores inconsistentes.');
    const incomeCents = amounts.filter(n => n > 0).reduce((a, b) => a + b, 0);
    const expenseCents = -amounts.filter(n => n < 0).reduce((a, b) => a + b, 0);
    const balanceCents = Number(account.opening) + incomeCents - expenseCents;
    requireValue([incomeCents, expenseCents, balanceCents].every(Number.isSafeInteger), 500, 'INVALID_LEDGER', 'Os totais ultrapassam o limite de precisão.');
    return { openingCents: Number(account.opening), incomeCents, expenseCents, balanceCents, records: rows.length, period: 'Todos os movimentos da base demonstrativa; sem filtro mensal', source: 'SQLite · dados fictícios' };
  }
}
