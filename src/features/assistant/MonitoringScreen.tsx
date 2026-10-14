import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Button, Card, Text } from '../../components/ui';
import { theme } from '../../theme';
import { useAssistantSession } from './AssistantProvider';
import { api } from './client';
import type { Monitoring } from './contracts';
import { inputStyle } from './AssistantScreen';

export function MonitoringScreen() {
  const { session, enter, logout } = useAssistantSession();
  const [password, setPassword] = useState('');
  const [data, setData] = useState<Monitoring | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  const admin = session?.user.role === 'admin';
  async function act(action: () => Promise<void>) { setBusy(true); setError(''); try { await action(); } catch (error) { setError(error instanceof Error ? error.message : 'Falha na consulta.'); } finally { setBusy(false); } }
  useEffect(() => {
    if (!admin || !session) return;
    let active = true;
    api.monitoring(session.token).then(data => { if (active) setData(data); }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [session, admin]);
  return <Box flex={1} backgroundColor="background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}><ScrollView testID="monitoring-scroll" keyboardShouldPersistTaps="handled" contentContainerStyle={{ width: '100%' }}><Box width="100%" maxWidth={1000} alignSelf="center" padding="md" gap="md">
    <Button label="Voltar ao assistente" secondary onPress={() => router.replace('/assistant')} />
    <Text variant="heading" accessibilityRole="header">Monitoramento dos agentes</Text>
    <Text color="muted">Demonstração · Execuções do servidor. Conteúdo de conversas e dados cadastrais não são exibidos.</Text>
    {error ? <Card backgroundColor="dangerSoft"><Text color="danger" accessibilityRole="alert">{error}</Text></Card> : null}
    {!admin && <Card gap="md"><Text variant="subtitle">Acesso restrito ao administrador</Text><Text>A senha é exibida no terminal ao iniciar o backend ou definida em ASSISTANT_ADMIN_PASSWORD.</Text><TextInput accessibilityLabel="Senha administrativa" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" style={inputStyle} /><Button label="Entrar como administrador" disabled={busy || !password} onPress={() => { void act(async () => { await enter(password); setPassword(''); }); }} /></Card>}
    {busy && <ActivityIndicator color={theme.colors.primary} />}
    {admin && session && <>
      <Box flexDirection="row" flexWrap="wrap" gap="sm"><Button label="Atualizar monitoramento" disabled={busy} onPress={() => { void act(async () => { setData(await api.monitoring(session.token)); }); }} /><Button label="Sair da administração" secondary disabled={busy} onPress={() => { void act(logout); }} /></Box>
      {data?.agents.map(agent => <Card key={agent.id} gap="sm"><Text variant="title">{agent.name}</Text><Text color={agent.enabled ? 'positive' : 'warning'}>{agent.enabled ? 'Habilitado' : 'Desabilitado'}</Text><Text>{agent.description}</Text><Text variant="caption">Capacidades: {agent.capabilities.join(', ')}</Text><Text variant="caption">Autorização: {agent.authorization}</Text><Text variant="caption" color="muted">{agent.inputContract} → {agent.outputContract}</Text><Button label={`${agent.enabled ? 'Desabilitar' : 'Habilitar'} ${agent.name}`} secondary disabled={busy} onPress={() => { void act(async () => { await api.enabled(session.token, agent.id, !agent.enabled); setData(await api.monitoring(session.token)); }); }} /></Card>)}
      <Text variant="title">Histórico de tarefas</Text>
      {data && !data.executions.length && <Text color="muted">Nenhuma execução registrada no servidor.</Text>}
      {data?.executions.map(run => <Card key={run.id} gap="xs"><Text variant="subtitle">{run.intent} · {run.status}</Text><Text variant="caption">{new Date(run.startedAt).toLocaleString('pt-BR')} · {run.durationMs} ms</Text><Text variant="caption" color="muted">Correlação: {run.correlationId}</Text>{run.steps.map((step, index) => <Text key={step.id} variant="caption">{index + 1}. {step.agentId} · {step.operation} · {step.status} · {step.durationMs} ms</Text>)}</Card>)}
      <Text variant="title">Auditoria técnica</Text>{data?.audit.map((item, index) => <Text key={index} variant="caption" color="muted">{new Date(item.at).toLocaleString('pt-BR')} · {item.action}</Text>)}
    </>}
  </Box></ScrollView></Box>;
}
