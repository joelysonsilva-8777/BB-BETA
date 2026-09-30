import { useState } from 'react';
import { TextInput } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { ArrowLeft, Check, ChevronRight, CircleAlert, FileCheck2, ShieldAlert } from 'lucide-react-native';
import { Box, Button, Card, Icon, Tap, Text } from '../../components/ui';
import type { Color, Theme } from '../../theme';
import { ROBOTS, RULES, type Decision, type Run } from './engine';
import type { InspectorController } from './useInspector';

export const time = (at: string) => new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
export const decisionName: Record<Decision, string> = { approved: 'Aprovada', review: 'Revisão necessária', blocked: 'Bloqueada' };
export const decisionColor: Record<Decision, Color> = { approved: 'positive', review: 'warning', blocked: 'danger' };

export function Badge({ label, color = 'primary' }: { label: string; color?: Color }) {
  return <Box alignSelf="flex-start" maxWidth="100%" borderRadius="sm" backgroundColor={color === 'danger' ? 'dangerSoft' : color === 'warning' ? 'warningSoft' : color === 'positive' ? 'positiveSoft' : 'blueSoft'} paddingHorizontal="xs" paddingVertical="xxs"><Text variant="caption" fontSize={11} flexShrink={1} color={color}>{label}</Text></Box>;
}

export function RunRow({ run, onPress }: { run: Run; onPress: () => void }) {
  const robot = ROBOTS.find(item => item.id === run.robotId)!;
  return (
    <Tap accessibilityLabel={`Inspecionar ${run.id}, ${robot.name}, ${decisionName[run.decision]}`} onPress={onPress}>
      <Box paddingVertical="md" gap="xs" borderBottomWidth={1} borderColor="border">
        <Box flexDirection="row" alignItems="center" gap="sm">
          <Box width={42} minHeight={42} alignItems="center" justifyContent="center" backgroundColor="surfaceSoft" borderRadius="sm"><Text variant="title" color={decisionColor[run.decision]}>{run.score}</Text></Box>
          <Box flex={1} minWidth={0} gap="xxs"><Text variant="subtitle">{robot.name} <Text variant="caption" color="muted">· {robot.role}</Text></Text><Text variant="caption" color="muted">{run.id} · {time(run.at)}</Text></Box>
          <Icon icon={ChevronRight} color="muted" size={18} />
        </Box>
        <Text variant="body">{run.task}</Text>
        <Box flexDirection="row" flexWrap="wrap" gap="xs"><Badge label={decisionName[run.decision]} color={decisionColor[run.decision]} />{run.review && <Badge label="Revisão registrada" />}{run.coverage < 100 && <Badge label="Evidência incompleta" color="warning" />}</Box>
      </Box>
    </Tap>
  );
}

export function RunDetail({ run, inspector, onBack }: { run: Run; inspector: InspectorController; onBack: () => void }) {
  const [note, setNote] = useState('');
  const theme = useTheme<Theme>();
  const robot = ROBOTS.find(item => item.id === run.robotId)!;
  const blocking = inspector.state.runs.some(item => item.robotId === run.robotId && item.decision === 'blocked' && !item.review);
  const paused = inspector.state.robots[run.robotId].paused;
  return (
    <Box gap="lg" testID="inspection-detail">
      <Tap accessibilityLabel="Voltar à central" onPress={onBack}><Box flexDirection="row" gap="xs" minHeight={44} alignItems="center"><Icon icon={ArrowLeft} color="primary" size={18} /><Text variant="button" color="primary">Voltar à central</Text></Box></Tap>
      <Box gap="xs"><Text variant="eyebrow" color="muted">{run.id} · {robot.name.toUpperCase()}</Text><Text variant="heading" accessibilityRole="header">Relatório de inspeção</Text><Text color="muted">{run.task}</Text><Badge label={decisionName[run.decision]} color={decisionColor[run.decision]} /></Box>
      <Card gap="md">
        <Box flexDirection="row" flexWrap="wrap" alignItems="baseline" gap="sm"><Text variant="balance" color={decisionColor[run.decision]} testID="run-score">{run.score}<Text variant="title" color="muted"> / 100</Text></Text><Text variant="caption" color="muted">{run.coverage < 100 ? 'Nota provisória' : 'Nota calculada'}</Text></Box>
        <Text variant="caption" color="muted">Cobertura das evidências: {run.coverage}% dos pesos. Uma falha crítica bloqueia a execução, mesmo com nota alta.</Text>
        <Box flexDirection="row" flexWrap="wrap" gap="sm"><Text variant="caption">{run.durationMs === null ? 'Tempo não informado' : `${run.durationMs} ms`}</Text><Text variant="caption">{run.costCents === null ? 'Custo não informado' : `R$ ${(run.costCents / 100).toFixed(2).replace('.', ',')} · fictício`}</Text><Text variant="caption">{time(run.at)}</Text></Box>
      </Card>
      <Card gap="md">
        <Text variant="title" accessibilityRole="header">Por que recebeu essa nota?</Text>
        {run.checks.map(check => {
          const rule = RULES.find(item => item.id === check.id)!;
          const color = check.status === 'pass' ? 'positive' : check.status === 'unknown' ? 'warning' : rule.critical ? 'danger' : 'warning';
          return <Box key={check.id} paddingTop="md" borderTopWidth={1} borderColor="border" gap="xs">
            <Box flexDirection="row" gap="xs" alignItems="center"><Icon icon={check.status === 'pass' ? Check : CircleAlert} color={color} size={19} /><Text variant="subtitle" flex={1} minWidth={0}>{rule.name}</Text><Text variant="button" color={color}>{check.status === 'pass' ? rule.weight : 0}/{rule.weight}</Text></Box>
            <Text variant="caption" color={color}>{check.status === 'pass' ? 'Verificado' : check.status === 'unknown' ? 'Sem evidência suficiente' : rule.critical ? 'Falha crítica' : 'Fora do esperado'}</Text>
            <Text variant="body" color="muted">{check.evidence}</Text>
            {check.status !== 'pass' && <Box backgroundColor="surfaceSoft" padding="sm" borderRadius="sm"><Text variant="caption">Próximo passo: {check.recommendation}</Text></Box>}
          </Box>;
        })}
      </Card>
      <Card gap="md">
        <Text variant="title" accessibilityRole="header">Evidências da execução</Text>
        <Box gap="xxs"><Text variant="button">Pedido recebido</Text><Text color="muted" selectable>{run.input}</Text></Box>
        <Box gap="xxs"><Text variant="button">Saída observada</Text><Text color="muted" selectable>{run.output}</Text></Box>
        <Box gap="xxs" borderTopWidth={1} borderColor="border" paddingTop="md"><Text variant="caption" selectable>Ferramenta: {run.tool}</Text><Text variant="caption" selectable>Rastreamento: {run.traceId ?? 'não recebido'}</Text><Text variant="caption">Política: {run.policyVersion} · Robô v{robot.version}</Text></Box>
        <Text variant="caption" color="muted">Evidências sintéticas. As validações usam regras locais; não há análise de robôs externos ou modelo de IA conectado.</Text>
      </Card>
      {run.decision !== 'approved' && <Card gap="md" testID="human-review">
        <Box flexDirection="row" alignItems="center" gap="xs"><Icon icon={FileCheck2} color="primary" /><Text variant="title" flex={1} accessibilityRole="header">Revisão humana</Text></Box>
        {run.review ? <><Badge label="Revisão registrada" color="positive" /><Text>{run.review.note}</Text><Text variant="caption" color="muted">{run.review.actor} · {time(run.review.at)}</Text><Text variant="caption" color="muted">A revisão encerra a pendência. A nota e o bloqueio desta execução permanecem no histórico.</Text></> : <>
          <Text color="muted">Registre o que foi conferido e a correção simulada. A revisão é uma decisão do responsável.</Text>
          <TextInput accessibilityLabel="Nota da revisão humana" multiline value={note} onChangeText={setNote} maxLength={1000} placeholder="Descreva sua análise (mínimo de 12 caracteres)" placeholderTextColor={theme.colors.muted} textAlignVertical="top" style={{ minHeight: 112, width: '100%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 4, padding: 12, color: theme.colors.text, fontSize: 16 }} />
          <Button label="Registrar revisão" disabled={note.trim().length < 12} onPress={() => inspector.review(run.id, note)} />
        </>}
        {paused && <><Button label={`Retomar ${robot.name}`} secondary disabled={blocking} onPress={() => inspector.toggleRobot(robot.id)} />{blocking && <Text variant="caption" color="danger">Conclua as revisões críticas deste robô antes de retomá-lo.</Text>}</>}
      </Card>}
      {run.decision === 'approved' && <Box flexDirection="row" gap="xs"><Icon icon={ShieldAlert} color="muted" size={18} /><Text variant="caption" flex={1} color="muted">Aprovação dentro das regras demonstradas. Não representa certificação ou garantia de segurança.</Text></Box>}
    </Box>
  );
}
