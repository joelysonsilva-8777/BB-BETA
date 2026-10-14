import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Button, Card, Text } from '../../components/ui';
import { currency } from '../../data/bank';
import { theme } from '../../theme';
import { useAssistantSession } from './AssistantProvider';
import { api, ApiError } from './client';
import type { Conversation, Execution, Status } from './contracts';

const examples = ['Quero consultar meu resumo financeiro.', 'Quero verificar os dados do meu cadastro.', 'Quero consultar as informações da minha empresa.', 'Preciso de um resumo financeiro da minha empresa.'];
const statusLabels: Record<Status, string> = { running: 'Em processamento', completed: 'Concluída', failed: 'Não concluída', cancelled: 'Cancelada', needs_confirmation: 'Aguardando confirmação', needs_clarification: 'Precisa de esclarecimento' };
const agentNames = { financial: 'Agente financeiro', individual: 'Agente de cadastro individual', business: 'Agente empresarial' };
const fieldNames: Record<string, string> = { name: 'Nome', category: 'Categoria', registration: 'Registro', source: 'Fonte', companyId: 'Empresa', openingCents: 'Saldo inicial', incomeCents: 'Receitas', expenseCents: 'Despesas', balanceCents: 'Saldo final', records: 'Movimentos', period: 'Período', proposedName: 'Nome proposto' };
export const inputStyle = { minHeight: 50, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 4, padding: 12, fontSize: 16, color: theme.colors.text, backgroundColor: theme.colors.surface };
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Falha inesperada. Tente novamente.';

function Result({ run, onConfirm, onCancel, busy }: { run: Execution; onConfirm: () => void; onCancel: () => void; busy: boolean }) {
  const [details, setDetails] = useState(false);
  return <Card gap="md" testID={`execution-${run.id}`}>
    <Text variant="caption" color="muted">Você</Text><Text>{run.message}</Text>
    <Box borderTopWidth={1} borderColor="border" paddingTop="md" gap="sm">
      <Text variant="subtitle" color="primary">Bot principal · {statusLabels[run.status]}</Text>
      <Text accessibilityLiveRegion="polite">{run.summary}</Text>
      {run.status === 'running' && <ActivityIndicator accessibilityLabel="Servidor processando solicitação" color={theme.colors.primary} />}
      {run.steps.filter(step => step.status === 'completed' && step.data).map(step => <Box key={step.id} backgroundColor="blueSoft" padding="sm" borderRadius="sm" gap="xs">
        <Text variant="button">{agentNames[step.agentId]}</Text>
        {Object.entries(step.data!).filter(([key]) => key !== 'companyId').map(([key, value]) => <Box key={key} flexDirection="row" flexWrap="wrap" justifyContent="space-between" gap="xs">
          <Text variant="caption" color="muted">{fieldNames[key] ?? key}</Text>
          <Text variant="button" flexShrink={1}>{key.endsWith('Cents') && typeof value === 'number' ? currency(value) : String(value)}</Text>
        </Box>)}
      </Box>)}
      {run.confirmation && run.status === 'needs_confirmation' && <Box gap="sm">
        <Text variant="caption" color="warning">Confirme somente se deseja aplicar esta proposta. Expira às {new Date(run.confirmation.expiresAt).toLocaleTimeString('pt-BR')}.</Text>
        <Button label="Confirmar alteração do nome" onPress={onConfirm} disabled={busy} />
        <Button label="Cancelar proposta" secondary onPress={onCancel} disabled={busy} />
      </Box>}
      {run.status === 'running' && <Button label="Cancelar execução" secondary onPress={onCancel} disabled={busy} />}
      <Button label={details ? 'Ocultar detalhes da execução' : 'Ver detalhes da execução'} secondary onPress={() => setDetails(value => !value)} />
      {details && <Box gap="sm" testID="execution-details">
        <Text variant="caption" color="muted">Correlação: {run.correlationId}</Text>
        <Text variant="caption" color="muted">Roteamento: {run.routing} · {run.durationMs} ms · {run.steps.length} etapa(s)</Text>
        {run.steps.map((step, index) => <Text key={step.id} variant="caption">{index + 1}. {agentNames[step.agentId]} · {step.operation} · {statusLabels[step.status]} · {step.durationMs} ms{step.error ? ` · ${step.error}` : ''}</Text>)}
      </Box>}
    </Box>
  </Card>;
}

export function AssistantScreen() {
  const { session, enter, logout } = useAssistantSession();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [runs, setRuns] = useState<Execution[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const pending = useRef<{ conversation: string; message: string; key: string } | null>(null);
  const scroll = useRef<ScrollView>(null);
  const running = runs.some(run => run.status === 'running');
  const locked = busy || running || !ready;

  async function act(action: () => Promise<void>) { setBusy(true); setError(''); try { await action(); } catch (error) { setError(messageOf(error)); } finally { setBusy(false); } }
  function update(run: Execution) { setRuns(previous => previous.some(item => item.id === run.id) ? previous.map(item => item.id === run.id ? run : item) : [...previous, run]); }

  useEffect(() => {
    const frame = requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }));
    return () => cancelAnimationFrame(frame);
  }, [runs.length]);

  useEffect(() => {
    if (!session || session.user.role !== 'user') return;
    let active = true;
    api.conversations(session.token).then(async items => {
      const conversation = items[0] ?? await api.create(session.token);
      const history = await api.history(session.token, conversation.id);
      if (active) { setConversations(items.length ? items : [conversation]); setSelected(conversation.id); setRuns(history); }
    }).catch(error => { if (active) setError(messageOf(error)); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    if (!session || !selected || !running) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const conversationId = selected;
    const poll = async () => {
      try { const history = await api.history(session.token, conversationId); if (active) setRuns(history); }
      catch (error) {
        if (active) setError(messageOf(error));
        if (error instanceof ApiError && error.status === 401) active = false;
      }
      finally { if (active) timer = setTimeout(() => { void poll(); }, 1000); }
    };
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [session, selected, running]);

  async function send(text = message) {
    if (!session || !selected || !text.trim() || locked) return;
    const id = selected;
    await act(async () => {
      if (!pending.current || pending.current.conversation !== id || pending.current.message !== text.trim()) pending.current = { conversation: id, message: text.trim(), key: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}` };
      const run = await api.send(session.token, id, pending.current.message, pending.current.key);
      update(run); setMessage(''); pending.current = null;
    });
  }
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Box flex={1} style={{ paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}>
      <ScrollView ref={scroll} style={{ flex: 1 }} testID="assistant-scroll" keyboardShouldPersistTaps="handled" contentContainerStyle={{ width: '100%', paddingBottom: 24 }}>
        <Box maxWidth={900} width="100%" alignSelf="center" padding="md" gap="md">
          <Box flexDirection="row" flexWrap="wrap" gap="sm" justifyContent="space-between"><Button label="Voltar ao início" secondary onPress={() => router.replace('/')} /><Text variant="caption" color="warning">Demonstração · Dados fictícios</Text></Box>
          <Text variant="heading" accessibilityRole="header">Converse com o bot principal</Text>
          <Text color="muted">Agentes consultam uma base SQLite no servidor. Não há conexão bancária nem modelo de IA conectado.</Text>
          {error ? <Card backgroundColor="dangerSoft"><Text color="danger" accessibilityRole="alert">{error}</Text>{session?.user.role === 'user' && <Button label="Reconectar e consultar histórico" secondary disabled={busy} onPress={() => { void act(async () => { await enter(); }); }} />}</Card> : null}
          {!session && <Card gap="md"><Text variant="subtitle">Entrar na demonstração</Text><Text>Use a conta fictícia de João Costa, vinculada à Costa Comércio. O histórico é compartilhado entre sessões dessa identidade de demonstração.</Text><Button label="Entrar como usuário de demonstração" disabled={busy} onPress={() => { void act(() => enter()); }} /><Button label="Acesso administrativo" secondary onPress={() => router.push('/admin')} /></Card>}
          {session?.user.role === 'admin' && <Card gap="md"><Text>Você está conectado como administrador. O administrador acompanha metadados e não consulta contas privadas.</Text><Button label="Abrir monitoramento" onPress={() => router.push('/admin')} /><Button label="Sair da sessão" secondary onPress={() => { void act(logout); }} /></Card>}
          {session?.user.role === 'user' && <>
            <Box flexDirection="row" flexWrap="wrap" gap="sm"><Button label="Histórico de conversas" secondary disabled={locked} onPress={() => setShowHistory(value => !value)} /><Button label="Nova conversa" secondary disabled={locked} onPress={() => { void act(async () => { const next = await api.create(session.token); setConversations(items => [next, ...items]); setSelected(next.id); setRuns([]); pending.current = null; }); }} /><Button label="Sair da sessão" secondary disabled={locked} onPress={() => { void act(logout); }} /></Box>
            {showHistory && <Card gap="sm">{conversations.map((item, index) => <Button key={item.id} label={`Conversa ${conversations.length - index} · ${item.id.slice(0, 8)} · ${new Date(item.createdAt).toLocaleString('pt-BR')}`} secondary disabled={locked} onPress={() => { void act(async () => { const history = await api.history(session.token, item.id); setSelected(item.id); setRuns(history); setShowHistory(false); pending.current = null; }); }} />)}</Card>}
            {!runs.length && <Card gap="sm"><Text variant="subtitle">Experimente os quatro fluxos</Text>{examples.map(text => <Button key={text} label={text} secondary disabled={locked || !selected} onPress={() => { void send(text); }} />)}</Card>}
            {runs.map(run => <Result key={run.id} run={run} busy={busy} onConfirm={() => { void act(async () => { update(await api.confirm(session.token, run.confirmation!.id)); }); }} onCancel={() => { void act(async () => { update(await api.cancel(session.token, run.id)); }); }} />)}
            {busy && <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Aguardando servidor" />}
          </>}
        </Box>
      </ScrollView>
      {session?.user.role === 'user' && <Box width="100%" maxWidth={900} alignSelf="center" paddingHorizontal="md" paddingBottom="sm">
        <Card padding="sm" gap="xs"><TextInput accessibilityLabel="Mensagem para o bot principal" placeholder="O que você deseja consultar?" value={message} onChangeText={setMessage} multiline maxLength={2000} editable={!locked} style={{ ...inputStyle, maxHeight: 120 }} /><Text variant="caption" color="muted">{message.length}/2000 · Alterações exigem confirmação.</Text><Button label="Enviar mensagem" disabled={locked || !selected || !message.trim()} onPress={() => { void send(); }} /></Card>
      </Box>}
    </Box>
  </KeyboardAvoidingView>;
}
