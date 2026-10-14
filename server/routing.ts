import type { Intent } from '../src/features/assistant/contracts.ts';
export type Interpretation = { intent: Intent; name?: string; summary?: string };
// Providers interpret only. They never receive credentials, select resource IDs or execute tools.
export interface IntentProvider { interpret(message: string, signal: AbortSignal): Promise<unknown> }
const readIntents: Intent[] = ['finance.personal', 'profile.read', 'business.read', 'finance.business'];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function deterministic(message: string): Interpretation {
  const text = normalize(message);
  if (/\b(ignore|ignorar|instrucoes|sistema|terceiro|outra pessoa|outro usuario|outro cliente|cpf|cnpj|admin|sql|execute|comando|senha|token|todos os usuarios|id\s*[:=])\b/.test(text)) {
    return { intent: 'unsupported', summary: 'Só posso consultar seu próprio cadastro, suas finanças e sua empresa vinculada. Instruções de acesso a terceiros ou comandos não são executadas.' };
  }
  if (/\b(pagar|pague|pix|transferir|transfira|depositar|excluir|apagar|deletar|contratar|emprestimo)\b/.test(text)) {
    return { intent: 'unsupported', summary: 'Esta demonstração não movimenta dinheiro, exclui cadastros ou contrata produtos.' };
  }
  const update = /\b(atualiz|alter|mudar|mude|editar|trocar)/.test(text);
  if (update) {
    const match = message.match(/^(?:quero\s+)?(?:atualizar|alterar|mudar|mude|trocar)\s+(?:o\s+)?meu\s+nome\s+para\s+([\p{L}][\p{L} .'-]{1,79})\.?$/iu);
    return match ? { intent: 'profile.update', name: match[1].trim() } : { intent: 'clarify', summary: 'Qual informação deseja atualizar? Nesta demonstração posso propor a alteração do seu nome. Escreva: “Alterar meu nome para Maria Silva”. A alteração exige confirmação.' };
  }
  const finance = /\b(financeir|saldo|receita|despesa|extrato|movimenta)/.test(text);
  const business = /\b(empresa|empresarial|pessoa juridica|pj|organizacao)\b/.test(text);
  const profile = /\b(cadastro|perfil|conta individual|pessoa fisica|civil|pf)\b/.test(text);
  if (business && /\b(pessoal|individual|minha conta)\b/.test(text)) return { intent: 'clarify', summary: 'Você deseja consultar os dados pessoais ou os dados da empresa? Envie uma solicitação por vez.' };
  if (finance && profile) return { intent: 'clarify', summary: 'Você quer consultar o cadastro ou o resumo financeiro? Envie uma solicitação por vez.' };
  if (finance) return { intent: business ? 'finance.business' : 'finance.personal' };
  if (business) return { intent: 'business.read' };
  if (profile) return { intent: 'profile.read' };
  return { intent: 'clarify', summary: 'Você deseja consultar seu resumo financeiro, seu cadastro individual ou sua empresa? Especifique também quando o financeiro for da empresa.' };
}
export async function interpret(message: string, provider: IntentProvider | undefined, signal: AbortSignal): Promise<Interpretation & { routing: 'deterministic' | 'provider' | 'fallback' }> {
  const rule = deterministic(message);
  // Sensitive rules and known requests cannot be overridden by a language model.
  if (!provider || rule.intent !== 'clarify') return { ...rule, routing: 'deterministic' };
  if (/\b(atualiz|alter|mudar|mude|editar|trocar)/.test(normalize(message))) return { ...rule, routing: 'deterministic' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const local = new AbortController();
  const abort = () => local.abort(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  try {
    signal.throwIfAborted();
    const raw = await Promise.race([
      provider.interpret(message, local.signal),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { local.abort(); reject(new Error('Provider timeout')); }, 1500); }),
      new Promise<never>((_, reject) => local.signal.addEventListener('abort', () => reject(new Error('Provider cancelled')), { once: true })),
    ]);
    if (raw && typeof raw === 'object' && 'intent' in raw && 'confidence' in raw &&
      Object.keys(raw).every(key => ['intent', 'confidence'].includes(key)) &&
      readIntents.includes(raw.intent as Intent) && typeof raw.confidence === 'number' && raw.confidence >= 0.9 && raw.confidence <= 1) {
      return { intent: raw.intent as Intent, routing: 'provider' };
    }
    return { ...rule, routing: 'fallback' };
  } catch { return { ...rule, routing: 'fallback' }; }
  finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
}
