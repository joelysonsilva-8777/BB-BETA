import { Platform } from 'react-native';
import type { Conversation, Execution, Monitoring, Session } from './contracts';

const base = (process.env.EXPO_PUBLIC_ASSISTANT_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8090' : 'http://localhost:8090')).replace(/\/$/, '');
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export async function request<T>(path: string, token?: string, method = 'GET', body?: unknown, key?: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${base}${path}`, { method, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { 'Idempotency-Key': key } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json();
    if (!response.ok) throw new ApiError(response.status, data.error?.message ?? 'Não foi possível concluir a solicitação.');
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Não foi possível acessar o servidor do assistente. Execute npm run dev e confira o endereço da API. Consulte o histórico antes de reenviar.');
  } finally { clearTimeout(timer); }
}
export const api = {
  demo: () => request<Session>('/sessions/demo', undefined, 'POST', {}),
  admin: (password: string) => request<Session>('/sessions/admin', undefined, 'POST', { password }),
  logout: (token: string) => request('/sessions/current', token, 'DELETE'),
  conversations: (token: string) => request<Conversation[]>('/conversations', token),
  create: (token: string) => request<Conversation>('/conversations', token, 'POST', {}),
  history: (token: string, id: string) => request<Execution[]>(`/conversations/${id}/messages`, token),
  send: (token: string, id: string, message: string, key: string) => request<Execution>(`/conversations/${id}/messages`, token, 'POST', { message }, key),
  execution: (token: string, id: string) => request<Execution>(`/executions/${id}`, token),
  cancel: (token: string, id: string) => request<Execution>(`/executions/${id}/cancel`, token, 'POST', {}),
  confirm: (token: string, id: string) => request<Execution>(`/confirmations/${id}`, token, 'POST', { confirmed: true }),
  monitoring: (token: string) => request<Monitoring>('/admin/monitoring', token),
  enabled: (token: string, id: string, enabled: boolean) => request(`/admin/agents/${id}`, token, 'PATCH', { enabled }),
};
