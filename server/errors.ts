export class AppError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message); this.status = status; this.code = code;
  }
}
export function requireValue(condition: unknown, status: number, code: string, message: string): asserts condition {
  if (!condition) throw new AppError(status, code, message);
}
export function object(value: unknown): Record<string, unknown> {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), 400, 'INVALID_INPUT', 'Parâmetros inválidos.');
  return value as Record<string, unknown>;
}
export function string(value: unknown, max = 200): string {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.length <= max, 400, 'INVALID_INPUT', 'Texto ausente ou acima do limite.');
  return value.trim();
}
export function exactKeys(value: Record<string, unknown>, allowed: string[]) {
  requireValue(Object.keys(value).every(key => allowed.includes(key)), 400, 'INVALID_INPUT', 'Parâmetro não permitido.');
}
export function safeError(error: unknown) {
  return error instanceof AppError ? error.message : 'A operação falhou. Nenhuma conclusão foi confirmada; tente consultar o histórico.';
}
