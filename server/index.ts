import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Store } from './store.ts';
import { createApplication } from './http.ts';

if (process.env.NODE_ENV === 'production' || process.env.ASSISTANT_DEMO_MODE === 'false') {
  throw new Error('Este servidor é exclusivo de demonstração. Configure autenticação de produção antes de disponibilizá-lo publicamente.');
}
const dbPath = resolve(process.env.ASSISTANT_DB_PATH ?? '.cache/assistant/demo.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });
const adminPassword = process.env.ASSISTANT_ADMIN_PASSWORD || randomBytes(18).toString('base64url');
const port = Number(process.env.ASSISTANT_PORT ?? 8090), host = process.env.ASSISTANT_HOST ?? '127.0.0.1';
const app = createApplication(new Store(dbPath), { adminPassword, origins: process.env.ASSISTANT_ALLOWED_ORIGINS?.split(',').map((value: string) => value.trim()) });
app.server.listen(port, host, () => {
  console.log(`Assistente BB · DEMONSTRAÇÃO · http://${host}:${port} · SQLite persistente`);
  if (!process.env.ASSISTANT_ADMIN_PASSWORD) console.log(`Senha administrativa temporária: ${adminPassword}`);
});
let closing = false;
async function stop() { if (closing) return; closing = true; await app.close(); }
process.once('SIGINT', () => { void stop(); }); process.once('SIGTERM', () => { void stop(); });
