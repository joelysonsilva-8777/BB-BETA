import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { account, transactions } from '../src/data/bank.ts';
import type { Execution, AgentId } from '../src/features/assistant/contracts.ts';
import { requireValue } from './errors.ts';

export type Principal = { id: string; role: 'user' | 'admin' };
export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY, name TEXT NOT NULL, registration TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS memberships(user_id TEXT NOT NULL REFERENCES users(id), company_id TEXT NOT NULL REFERENCES companies(id), PRIMARY KEY(user_id,company_id));
      CREATE TABLE IF NOT EXISTS accounts(owner TEXT PRIMARY KEY, opening INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES accounts(owner), label TEXT NOT NULL, amount INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS conversations(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS executions(id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id), user_id TEXT NOT NULL, request_key TEXT NOT NULL, fingerprint TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(user_id,request_key));
      CREATE TABLE IF NOT EXISTS confirmations(id TEXT PRIMARY KEY, user_id TEXT NOT NULL, execution_id TEXT NOT NULL UNIQUE REFERENCES executions(id), name TEXT NOT NULL, expires INTEGER NOT NULL, consumed INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS agent_state(id TEXT PRIMARY KEY, enabled INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY, action TEXT NOT NULL, at TEXT NOT NULL);`);
    this.transaction(() => {
      const user = this.db.prepare('INSERT OR IGNORE INTO users VALUES(?,?,?)');
      user.run('demo-user', account.fullName, 'user'); user.run('demo-other', 'Outra pessoa fictícia', 'user'); user.run('demo-admin', 'Administrador demo', 'admin');
      this.db.prepare('INSERT OR IGNORE INTO companies VALUES(?,?,?)').run('demo-company', 'Costa Comércio · fictícia', 'DEMO-PJ-001');
      this.db.prepare('INSERT OR IGNORE INTO memberships VALUES(?,?)').run('demo-user', 'demo-company');
      this.db.prepare('INSERT OR IGNORE INTO accounts VALUES(?,?)').run('demo-user', account.balance - transactions.reduce((sum, item) => sum + item.amount, 0));
      this.db.prepare('INSERT OR IGNORE INTO accounts VALUES(?,?)').run('demo-company', 1000000);
      const entry = this.db.prepare('INSERT OR IGNORE INTO ledger VALUES(?,?,?,?)');
      for (const item of transactions) entry.run(`personal-${item.id}`, 'demo-user', item.detail, item.amount);
      entry.run('business-1', 'demo-company', 'Receita fictícia de vendas', 425000);
      entry.run('business-2', 'demo-company', 'Despesa fictícia de fornecedores', -175000);
    });
    // A restart never reports an unfinished operation as successful or repeats it.
    const interrupted = this.db.prepare("SELECT payload FROM executions WHERE json_extract(payload,'$.status')='running'").all();
    for (const row of interrupted) {
      const run = JSON.parse(row.payload as string) as Execution;
      if (run.status === 'running') {
        run.status = 'failed'; run.summary = 'Execução interrompida pelo reinício do servidor. Não foi repetida.';
        run.steps = run.steps.map(step => step.status === 'running' ? { ...step, status: 'failed', summary: run.summary } : step);
        this.save(run);
      }
    }
  }
  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const value = fn(); this.db.exec('COMMIT'); return value; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  principal(id: string): Principal {
    const row = this.db.prepare('SELECT id,role FROM users WHERE id=?').get(id) as Principal | undefined;
    requireValue(row, 401, 'UNAUTHENTICATED', 'Entre novamente na demonstração.'); return row;
  }
  ownConversation(id: string, principal: Principal) {
    requireValue(this.db.prepare('SELECT id FROM conversations WHERE id=? AND user_id=?').get(id, principal.id), 404, 'NOT_FOUND', 'Conversa não encontrada.');
  }
  createConversation(principal: Principal) {
    const result = { id: randomUUID(), createdAt: new Date().toISOString() };
    this.db.prepare('INSERT INTO conversations VALUES(?,?,?)').run(result.id, principal.id, result.createdAt); return result;
  }
  conversations(principal: Principal) {
    return this.db.prepare('SELECT id,created_at AS createdAt FROM conversations WHERE user_id=? ORDER BY rowid DESC LIMIT 100').all(principal.id);
  }
  insert(run: Execution, key: string, fingerprint: string) {
    this.db.prepare('INSERT INTO executions VALUES(?,?,?,?,?,?)').run(run.id, run.conversationId, run.userId, key, fingerprint, JSON.stringify(run));
  }
  previous(principal: Principal, key: string, fingerprint: string): Execution | undefined {
    const row = this.db.prepare('SELECT payload,fingerprint FROM executions WHERE user_id=? AND request_key=?').get(principal.id, key);
    if (!row) return;
    requireValue(row.fingerprint === fingerprint, 409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já pertence a outra solicitação.');
    return JSON.parse(row.payload as string) as Execution;
  }
  save(run: Execution) { this.db.prepare('UPDATE executions SET payload=? WHERE id=?').run(JSON.stringify(run), run.id); }
  execution(id: string, principal: Principal): Execution {
    const row = this.db.prepare('SELECT payload FROM executions WHERE id=? AND user_id=?').get(id, principal.id);
    requireValue(row, 404, 'NOT_FOUND', 'Execução não encontrada.'); return JSON.parse(row.payload as string) as Execution;
  }
  history(conversationId: string, principal: Principal): Execution[] {
    this.ownConversation(conversationId, principal);
    return this.db.prepare('SELECT payload FROM executions WHERE conversation_id=? ORDER BY rowid').all(conversationId).map(row => JSON.parse(row.payload as string) as Execution);
  }
  allExecutions(): Execution[] {
    return this.db.prepare('SELECT payload FROM executions ORDER BY rowid DESC LIMIT 1000').all().map(row => JSON.parse(row.payload as string) as Execution);
  }
  enabled(id: AgentId) { return this.db.prepare('SELECT enabled FROM agent_state WHERE id=?').get(id)?.enabled !== 0; }
  setEnabled(id: AgentId, enabled: boolean) {
    this.db.prepare('INSERT INTO agent_state VALUES(?,?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled').run(id, Number(enabled));
    this.audit(`agent.${id}.${enabled ? 'enabled' : 'disabled'}`);
  }
  audit(action: string) { this.db.prepare('INSERT INTO audit VALUES(?,?,?)').run(randomUUID(), action, new Date().toISOString()); }
  close() { this.db.close(); }
}
