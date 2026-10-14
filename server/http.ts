import { createServer, type IncomingMessage } from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Principal, Store } from './store.ts';
import { MainOrchestratorAgent } from './orchestrator.ts';
import { AppError, exactKeys, object, requireValue, safeError, string } from './errors.ts';
import { PermissionValidator } from './services.ts';
import type { IntentProvider } from './routing.ts';
import type { Agent } from './agents.ts';

export function createApplication(store: Store, options: { adminPassword: string; origins?: string[]; provider?: IntentProvider; agents?: Agent[]; timeoutMs?: number; rateLimit?: number }) {
  requireValue(options.adminPassword.length >= 16, 500, 'WEAK_ADMIN_PASSWORD', 'Configure uma senha administrativa com pelo menos 16 caracteres.');
  const orchestrator = new MainOrchestratorAgent(store, options);
  const sessions = new Map<string, { id: string; expires: number }>();
  const buckets = new Map<string, { count: number; expires: number }>();
  const origins = options.origins ?? ['http://localhost:8081', 'http://127.0.0.1:8081'];
  const salt = randomBytes(32), passwordHash = scryptSync(options.adminPassword, salt, 32);
  function issueSession(id: string) {
    for (const [key, value] of sessions) if (value.expires <= Date.now()) sessions.delete(key);
    requireValue(sessions.size < 1000, 429, 'BUSY', 'Limite de sessões atingido.');
    const user = store.principal(id), token = randomBytes(32).toString('base64url');
    sessions.set(token, { id, expires: Date.now() + 60 * 60_000 });
    return { token, user, demo: true as const };
  }
  function auth(req: IncomingMessage): Principal {
    const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
    const session = sessions.get(token);
    requireValue(session && session.expires > Date.now(), 401, 'UNAUTHENTICATED', 'Entre novamente na demonstração.');
    return store.principal(session.id);
  }
  function limit(key: string, max: number) {
    const now = Date.now();
    if (buckets.size > 1000) for (const [id, bucket] of buckets) if (bucket.expires <= now) buckets.delete(id);
    let bucket = buckets.get(key);
    if (!bucket || bucket.expires <= now) { bucket = { count: 0, expires: now + 60_000 }; buckets.set(key, bucket); }
    requireValue(++bucket.count <= max, 429, 'RATE_LIMITED', 'Muitas solicitações. Aguarde um minuto.');
  }
  async function body(req: IncomingMessage) {
    requireValue(req.headers['content-type']?.startsWith('application/json'), 415, 'INVALID_CONTENT_TYPE', 'Envie JSON.');
    let size = 0; const chunks: Buffer[] = [];
    for await (const chunk of req) { size += chunk.length; requireValue(size <= 8192, 413, 'BODY_TOO_LARGE', 'Mensagem acima do limite.'); chunks.push(Buffer.from(chunk)); }
    try { return object(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
    catch (error) { if (error instanceof AppError) throw error; throw new AppError(400, 'INVALID_JSON', 'JSON inválido.'); }
  }
  const server = createServer(async (req, res) => {
    const send = (status: number, value: unknown) => {
      if (res.destroyed) return;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(value));
    };
    try {
      const origin = req.headers.origin;
      requireValue(!origin || origins.includes(origin), 403, 'ORIGIN_FORBIDDEN', 'Origem não autorizada.');
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      const path = new URL(req.url ?? '/', 'http://localhost').pathname;
      const method = req.method;
      if (path === '/health' && method === 'GET') { send(200, { ok: true, demo: true, provider: options.provider ? 'configured' : 'deterministic' }); return; }
      limit(`ip:${req.socket.remoteAddress}`, 600);
      if (path === '/sessions/demo' && method === 'POST') {
        const input = await body(req); exactKeys(input, []); limit(`login:${req.socket.remoteAddress}`, 20);
        send(201, issueSession('demo-user')); return;
      }
      if (path === '/sessions/admin' && method === 'POST') {
        limit(`admin-login:${req.socket.remoteAddress}`, 5);
        const input = await body(req); exactKeys(input, ['password']);
        const password = string(input.password, 200);
        requireValue(timingSafeEqual(scryptSync(password, salt, 32), passwordHash), 401, 'INVALID_CREDENTIALS', 'Credencial administrativa inválida.');
        store.audit('admin.login'); send(201, issueSession('demo-admin')); return;
      }
      const principal = auth(req);
      limit(`user:${principal.id}`, 400);
      if (path === '/sessions/current' && method === 'DELETE') { sessions.delete(req.headers.authorization!.slice(7)); send(200, { ok: true }); return; }
      if (path === '/conversations') {
        PermissionValidator.user(principal);
        if (method === 'GET') { send(200, store.conversations(principal)); return; }
        if (method === 'POST') { const input = await body(req); exactKeys(input, []); limit(`conversation:${principal.id}`, 20); send(201, store.createConversation(principal)); return; }
      }
      const conversation = path.match(/^\/conversations\/([\w-]+)\/messages$/);
      if (conversation) {
        if (method === 'GET') { send(200, store.history(conversation[1], principal)); return; }
        if (method === 'POST') {
          const input = await body(req); exactKeys(input, ['message']);
          const message = string(input.message, 2000), key = string(req.headers['idempotency-key'], 100);
          requireValue(/^[\w-]+$/.test(key), 400, 'INVALID_KEY', 'Chave de idempotência inválida.');
          limit(`message:${principal.id}`, options.rateLimit ?? 30);
          send(202, orchestrator.start(principal, conversation[1], message, key)); return;
        }
      }
      const execution = path.match(/^\/executions\/([\w-]+)(\/cancel)?$/);
      if (execution) {
        if (!execution[2] && method === 'GET') { send(200, store.execution(execution[1], principal)); return; }
        if (execution[2] && method === 'POST') { const input = await body(req); exactKeys(input, []); send(200, orchestrator.cancel(principal, execution[1])); return; }
      }
      const confirm = path.match(/^\/confirmations\/([\w-]+)$/);
      if (confirm && method === 'POST') {
        const input = await body(req); exactKeys(input, ['confirmed']);
        requireValue(input.confirmed === true, 400, 'CONFIRMATION_REQUIRED', 'Confirmação explícita obrigatória.');
        send(200, orchestrator.confirm(principal, confirm[1])); return;
      }
      if (path === '/admin/monitoring' && method === 'GET') { send(200, orchestrator.monitoring(principal)); return; }
      const agent = path.match(/^\/admin\/agents\/([\w-]+)$/);
      if (agent && method === 'PATCH') {
        PermissionValidator.admin(principal);
        const definition = orchestrator.registry.list().find(item => item.id === agent[1]);
        requireValue(definition, 404, 'NOT_FOUND', 'Agente não encontrado.');
        const input = await body(req); exactKeys(input, ['enabled']); requireValue(typeof input.enabled === 'boolean', 400, 'INVALID_INPUT', 'Estado inválido.');
        store.setEnabled(definition.id, input.enabled); send(200, { ok: true }); return;
      }
      throw new AppError(404, 'NOT_FOUND', 'Rota não encontrada.');
    } catch (error) { send(error instanceof AppError ? error.status : 500, { error: { code: error instanceof AppError ? error.code : 'INTERNAL_ERROR', message: safeError(error) } }); }
  });
  server.requestTimeout = 10_000; server.headersTimeout = 10_000;
  return { server, orchestrator, issueSession, async close() { await orchestrator.shutdown(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); store.close(); } };
}
