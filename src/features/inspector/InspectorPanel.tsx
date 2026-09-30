import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bot, ChevronDown, CircleAlert, Download, FileCheck2, Pause, Play, ShieldCheck, X } from 'lucide-react-native';
import { Box, Button, Card, Icon, IconButton, Tap, Text } from '../../components/ui';
import { BBMark } from '../../components/Brand';
import { useCompactLayout } from '../../hooks/useCompactLayout';
import { MAX_RUNS, POLICY, ROBOTS, RULES, SCENARIOS, type RobotId, type ScenarioId } from './engine';
import type { InspectorController } from './useInspector';
import { Badge, decisionColor, RunDetail, RunRow, time } from './InspectorParts';
import { exportReport } from './exportReport';

type Tab = 'overview' | 'robots' | 'audit' | 'rules';
const tabs: { id: Tab; title: string }[] = [{ id: 'overview', title: 'Visão geral' }, { id: 'robots', title: 'Robôs' }, { id: 'audit', title: 'Auditoria' }, { id: 'rules', title: 'Regras' }];

function Stats({ inspector }: { inspector: InspectorController }) {
  const { width } = useWindowDimensions();
  const items = [
    { label: 'Robôs disponíveis', value: `${inspector.stats.active}/4`, detail: 'aptos a executar' },
    { label: 'Nota média', value: `${inspector.stats.average}`, detail: 'de 100 pontos' },
    { label: 'Revisões pendentes', value: `${inspector.stats.pending}`, detail: `${inspector.stats.critical} críticas` },
    { label: 'Execuções', value: `${inspector.stats.total}`, detail: 'nesta sessão local' },
  ];
  return <Box flexDirection={width >= 760 ? 'row' : 'column'} gap="sm">
    {[items.slice(0, 2), items.slice(2)].map((pair, index) => <Box key={index} flex={width >= 760 ? 1 : undefined} minWidth={0} flexDirection="row" gap="sm">{pair.map(item => <Card key={item.label} flex={1} padding="sm" gap="xxs"><Text variant="caption" color="muted">{item.label}</Text><Text variant="heading">{item.value}</Text><Text variant="caption" fontSize={10} color="muted">{item.detail}</Text></Card>)}</Box>)}
  </Box>;
}

function RobotCard({ id, inspector, onSelect }: { id: RobotId; inspector: InspectorController; onSelect: (id: string) => void }) {
  const robot = ROBOTS.find(item => item.id === id)!;
  const control = inspector.state.robots[id];
  const runs = inspector.state.runs.filter(run => run.robotId === id);
  const pending = runs.filter(run => run.decision !== 'approved' && !run.review);
  const critical = pending.find(run => run.decision === 'blocked');
  const target = critical ?? pending[0] ?? runs[0];
  return <Card gap="md" testID={`robot-${id}`}>
    <Box flexDirection="row" gap="sm" alignItems="center"><Box width={44} height={44} borderRadius="sm" backgroundColor="blueSoft" alignItems="center" justifyContent="center"><Icon icon={Bot} color="primary" /></Box><Box flex={1} minWidth={0}><Text variant="title">{robot.name}</Text><Text variant="caption" color="muted">{robot.role} · v{robot.version}</Text></Box></Box>
    <Badge label={control.paused ? 'Suspenso na simulação' : 'Disponível para executar'} color={control.paused ? 'warning' : 'positive'} />
    <Text variant="caption" color="muted">Responsável: {robot.owner}</Text>
    <Text variant="caption">Ferramenta permitida: {robot.tools.join(', ')}</Text>
    <Box flexDirection="row" flexWrap="wrap" gap="md"><Text variant="button">{runs.length} execuções</Text><Text variant="button">{pending.length} pendências</Text></Box>
    {control.reason ? <Text variant="caption" color="warning">{control.reason}</Text> : null}
    {target && <Button label={pending.length ? `Revisar execução de ${robot.name}` : `Ver última execução de ${robot.name}`} secondary onPress={() => onSelect(target.id)} />}
    <Button label={`${control.paused ? 'Retomar' : 'Pausar'} ${robot.name}`} icon={control.paused ? Play : Pause} secondary disabled={control.paused && !!critical} onPress={() => inspector.toggleRobot(id)} />
    {control.paused && !!critical && <Text variant="caption" color="muted">A retomada exige revisão das ocorrências críticas.</Text>}
  </Card>;
}

function SimulationLab({ inspector }: { inspector: InspectorController }) {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('healthy');
  const [choosing, setChoosing] = useState(false);
  const scenario = SCENARIOS.find(item => item.id === scenarioId)!;
  const robot = ROBOTS.find(item => item.id === scenario.robotId)!;
  const paused = inspector.state.robots[scenario.robotId].paused;
  const full = inspector.state.runs.length >= MAX_RUNS;
  return <Card gap="md">
    <Box gap="xxs"><Text variant="title" accessibilityRole="header">Coloque o inspetor à prova</Text><Text variant="caption" color="muted">Escolha um cenário ou acompanhe uma sequência automática a cada 8 segundos.</Text></Box>
    <Tap accessibilityLabel={`Escolher cenário: ${scenario.label}`} accessibilityState={{ expanded: choosing }} onPress={() => setChoosing(value => !value)}><Box minHeight={50} backgroundColor="surfaceSoft" borderRadius="sm" padding="sm" flexDirection="row" gap="xs" alignItems="center"><Text variant="button" flex={1} minWidth={0}>{scenario.label}</Text><Icon icon={ChevronDown} color="muted" size={18} /></Box></Tap>
    {choosing && <Box gap="xs" testID="scenario-options">{SCENARIOS.map(item => <Tap key={item.id} accessibilityLabel={`Cenário: ${item.label}`} accessibilityState={{ selected: item.id === scenarioId }} onPress={() => { setScenarioId(item.id); setChoosing(false); }}><Box padding="sm" backgroundColor={item.id === scenarioId ? 'blueSoft' : 'surfaceSoft'} borderRadius="sm" gap="xxs"><Text variant="button">{item.label}</Text><Text variant="caption" color="muted">{item.description}</Text></Box></Tap>)}</Box>}
    <Text variant="caption" color="muted">{robot.name} · {scenario.description}</Text>
    <Button label="Executar cenário" icon={Play} disabled={!inspector.ready || paused || full} onPress={() => inspector.simulate(scenarioId)} />
    {paused && <Text variant="caption" color="warning">{robot.name} está suspenso. Revise a ocorrência e retome o robô na seção Robôs.</Text>}
    <Button label={inspector.live ? 'Pausar sequência' : 'Iniciar sequência automática'} icon={inspector.live ? Pause : Play} secondary disabled={!inspector.ready || (!inspector.live && (full || inspector.stats.active === 0))} onPress={inspector.toggleLive} />
    {full && <Text variant="caption" color="warning">Limite de {MAX_RUNS} execuções atingido. O histórico foi preservado e pode ser exportado.</Text>}
    <Text variant="caption" color="muted">Somente robôs disponíveis participam da sequência. Ela para ao sair da central e não executa em segundo plano.</Text>
  </Card>;
}

export function InspectorPanel({ inspector, onClose }: { inspector: InspectorController; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'blocked'>('all');
  const [runCount, setRunCount] = useState(8);
  const [eventCount, setEventCount] = useState(15);
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const { width } = useWindowDimensions();
  const compact = useCompactLayout();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const columns = width >= 960;
  const { state } = inspector;
  const selected = state.runs.find(run => run.id === selectedId);
  const pending = state.runs.filter(run => run.decision !== 'approved' && !run.review);
  const critical = pending.find(run => run.decision === 'blocked');
  const filteredRuns = state.runs.filter(run => filter === 'all' || (filter === 'pending' ? run.decision !== 'approved' && !run.review : run.decision === 'blocked'));
  const select = (id: string) => { setSelectedId(id); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const changeTab = (next: Tab) => { setTab(next); setSelectedId(null); setMessage(''); scroll.current?.scrollTo({ y: 0, animated: false }); };
  async function download() {
    setExporting(true);
    try { setMessage(await exportReport(state)); }
    catch { setMessage('Não foi possível exportar. Seu histórico continua disponível nesta central.'); }
    finally { setExporting(false); }
  }

  function overview() {
    return <Box gap="lg">
      <Box gap="xs"><Badge label="AMBIENTE DE SIMULAÇÃO" /><Text variant="heading" accessibilityRole="header">Supervisão, com evidências.</Text><Text color="muted">Cada robô executa. O inspetor observa, confere e explica o que encontrou.</Text></Box>
      <Stats inspector={inspector} />
      {critical && <Box padding="md" backgroundColor="warningSoft" borderLeftWidth={3} borderColor="warning" gap="sm"><Box flexDirection="row" gap="xs" alignItems="center"><Icon icon={CircleAlert} color="warning" /><Text variant="subtitle" flex={1}>Há um bloqueio que precisa de você.</Text></Box><Text variant="body" color="muted">{ROBOTS.find(robot => robot.id === critical.robotId)!.name} foi suspenso após uma falha crítica. As evidências já estão organizadas para revisão.</Text><Button label="Investigar bloqueio" secondary onPress={() => select(critical.id)} /></Box>}
      <Box flexDirection={columns ? 'row' : 'column'} gap="lg" alignItems="flex-start">
        <Box width={columns ? 336 : '100%'} gap="lg"><SimulationLab inspector={inspector} /><Card gap="sm"><Text variant="subtitle">Notas das últimas execuções</Text><Box height={72} flexDirection="row" alignItems="flex-end" gap="xs" accessible accessibilityLabel={`Últimas notas, da mais antiga à mais recente: ${state.runs.slice(0, 10).reverse().map(run => run.score).join(', ')}`}>
          {state.runs.slice(0, 10).reverse().map(run => <Box key={run.id} flex={1} minWidth={0} alignItems="center" gap="xxs"><Box width="100%" maxWidth={28} height={Math.max(3, run.score * 0.48)} borderTopLeftRadius="sm" borderTopRightRadius="sm" backgroundColor={decisionColor[run.decision]} /><Text fontSize={9} color="muted">{run.score}</Text></Box>)}
        </Box><Text variant="caption" color="muted">Da mais antiga à mais recente. A cor considera as falhas, além da nota.</Text></Card></Box>
        <Box flex={columns ? 1 : undefined} width={columns ? undefined : '100%'} minWidth={0}><Card gap="sm">
          <Box gap="xxs"><Text variant="title" accessibilityRole="header">Execuções observadas</Text><Text variant="caption" color="muted">Selecione uma execução para ver evidências, nota e recomendações.</Text></Box>
          <Box flexDirection="row" flexWrap="wrap" gap="xs">{([{ id: 'all', label: 'Todas' }, { id: 'pending', label: 'Pendentes' }, { id: 'blocked', label: 'Bloqueadas' }] as const).map(item => <Tap key={item.id} accessibilityLabel={`Filtrar execuções: ${item.label}`} accessibilityState={{ selected: filter === item.id }} onPress={() => { setFilter(item.id); setRunCount(8); }}><Box minHeight={44} justifyContent="center" paddingHorizontal="sm" borderRadius="sm" backgroundColor={filter === item.id ? 'primary' : 'surfaceSoft'}><Text variant="button" color={filter === item.id ? 'onPrimary' : 'text'}>{item.label}</Text></Box></Tap>)}</Box>
          <Box testID="inspector-runs">{filteredRuns.slice(0, runCount).map(run => <RunRow key={run.id} run={run} onPress={() => select(run.id)} />)}</Box>
          {!filteredRuns.length && <Text color="muted" paddingVertical="lg">Nenhuma execução neste filtro.</Text>}
          {filteredRuns.length > runCount && <Button label="Mostrar mais execuções" secondary onPress={() => setRunCount(count => count + 8)} />}
        </Card></Box>
      </Box>
    </Box>;
  }

  function robots() {
    return <Box gap="lg"><Box gap="xs"><Text variant="heading" accessibilityRole="header">Robôs sob supervisão</Text><Text color="muted">Escopo, responsável e estado de cada agente. Pausas e retomadas ficam registradas.</Text></Box>
      <Box flexDirection={columns ? 'row' : 'column'} gap="lg">{[ROBOTS.slice(0, 2), ROBOTS.slice(2)].map((pair, index) => <Box key={index} flex={columns ? 1 : undefined} minWidth={0} gap="lg">{pair.map(robot => <RobotCard key={robot.id} id={robot.id} inspector={inspector} onSelect={select} />)}</Box>)}</Box>
    </Box>;
  }

  function audit() {
    return <Box gap="lg"><Box gap="xs"><Text variant="heading" accessibilityRole="header">Trilha de auditoria</Text><Text color="muted">O que aconteceu, quem decidiu e quais evidências sustentam cada resultado.</Text></Box>
      <Card gap="md"><Box flexDirection={compact ? 'column' : 'row'} gap="sm"><Box flex={compact ? undefined : 1}><Button label="Auditar sessão" icon={FileCheck2} onPress={() => { inspector.audit(); setMessage('Auditoria concluída. Confira o novo registro abaixo.'); }} /></Box><Box flex={compact ? undefined : 1}><Button label={exporting ? 'Gerando relatório…' : 'Exportar relatório JSON'} icon={Download} secondary disabled={exporting} onPress={download} /></Box></Box><Text variant="caption" color="muted">A auditoria recalcula as notas e confere divergências. O relatório reúne regras, robôs, execuções, evidências e revisões desta sessão.</Text></Card>
      <Card gap="sm"><Text variant="subtitle">{state.events.length} registros locais</Text><Text variant="caption" color="muted">Mais recentes primeiro. Retenção dos últimos 500 eventos.</Text><Box testID="audit-events">{[...state.events].reverse().slice(0, eventCount).map(event => <Box key={event.id} borderTopWidth={1} borderColor="border" paddingVertical="md" gap="xs"><Box flexDirection="row" flexWrap="wrap" gap="xs"><Text variant="caption" color="primary">{event.id}</Text><Text variant="caption" color="muted">{new Date(event.at).toLocaleDateString('pt-BR')} · {time(event.at)}</Text></Box><Text variant="subtitle">{event.title}</Text><Text variant="body" color="muted">{event.detail}</Text><Text variant="caption" color="muted">{event.actor}</Text>{event.runId && state.runs.some(run => run.id === event.runId) && <Tap accessibilityLabel={`Ver evidências de ${event.id}`} onPress={() => select(event.runId!)}><Box minHeight={44} justifyContent="center"><Text variant="button" color="primary">Ver evidências · {event.runId}</Text></Box></Tap>}</Box>)}</Box>{state.events.length > eventCount && <Button label="Mostrar mais registros" secondary onPress={() => setEventCount(count => count + 15)} />}</Card>
      <Text variant="caption" color="muted">Histórico demonstrativo salvo neste aparelho. Não é um registro imutável nem uma auditoria certificada.</Text>
    </Box>;
  }

  function rules() {
    return <Box gap="lg"><Box gap="xs"><Text variant="heading" accessibilityRole="header">Como o inspetor decide</Text><Text color="muted">Regras transparentes, evidência por critério e decisão rastreável.</Text><Badge label={POLICY.version} /></Box>
      <Card gap="md"><Text variant="title">As quatro atribuições</Text>{[
        ['01 · Observar', 'Receber a tarefa, a ferramenta usada, a saída e a telemetria de cada robô.'],
        ['02 · Verificar', 'Conferir as evidências com o escopo permitido e os limites da política.'],
        ['03 · Dar nota', 'Somar os pesos dos critérios comprovados. Evidência ausente não recebe pontos e deixa a avaliação provisória.'],
        ['04 · Auditar', 'Manter resultados e decisões humanas no histórico e recalcular notas para encontrar divergências.'],
      ].map(([title, detail]) => <Box key={title} gap="xxs"><Text variant="subtitle">{title}</Text><Text color="muted">{detail}</Text></Box>)}</Card>
      <Card gap="md"><Text variant="title">Critérios e pesos</Text>{RULES.map(rule => <Box key={rule.id} gap="xs" borderTopWidth={1} borderColor="border" paddingTop="md"><Box flexDirection="row" gap="xs"><Text variant="subtitle" flex={1} minWidth={0}>{rule.name}</Text><Text variant="button" color="primary">{rule.weight} pts</Text></Box><Text color="muted">{rule.description}</Text>{rule.critical && <Badge label="Falha crítica suspende o robô" color="danger" />}</Box>)}</Card>
      <Card gap="md" backgroundColor="blueSoft" borderColor="blueSoft"><Text variant="title">Onde entra a pessoa responsável?</Text><Text>Falhas críticas suspendem o robô na simulação. O responsável analisa as evidências, registra uma justificativa e só então pode retomar novas execuções.</Text><Text>A revisão não transforma uma execução bloqueada em aprovada. O resultado original continua no relatório.</Text></Card>
      <Text variant="caption" color="muted">Este protótipo usa cenários sintéticos e validadores determinísticos. Uma versão conectada precisará receber telemetria real, autenticar revisores e controlar a execução no servidor. Nenhum robô externo é monitorado ou bloqueado aqui.</Text>
    </Box>;
  }

  return <Modal visible animationType="fade" onRequestClose={onClose}>
    <Box flex={1} backgroundColor="background" style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom }}>
      <Box height={3} backgroundColor="yellow" />
      <Box backgroundColor="surface" borderBottomWidth={1} borderColor="border"><Box width="100%" maxWidth={1200} alignSelf="center" paddingHorizontal={{ phone: 'md', tablet: 'xl' }} paddingVertical="xs" flexDirection="row" alignItems="center" gap="sm"><BBMark size={30} /><Box flex={1} minWidth={0}><Text variant="title" accessibilityRole="header">Inspetor IA</Text><Text variant="caption" color="muted">Central de inspeção</Text></Box><IconButton icon={X} label="Fechar central de inspeção" onPress={onClose} /></Box></Box>
      <Box width="100%" maxWidth={1200} alignSelf="center" paddingHorizontal={{ phone: 'sm', tablet: 'xl' }} paddingVertical="xs" flexDirection="row" gap="xxs">{tabs.map(item => <Tap key={item.id} flex={1} accessibilityLabel={`Seção ${item.title}`} accessibilityState={{ selected: tab === item.id && !selected }} onPress={() => changeTab(item.id)}><Box minHeight={48} paddingHorizontal="xxs" paddingVertical="xs" borderRadius="sm" backgroundColor={tab === item.id && !selected ? 'primary' : 'surface'} alignItems="center" justifyContent="center"><Text variant="button" fontSize={compact ? 11 : 13} textAlign="center" color={tab === item.id && !selected ? 'onPrimary' : 'muted'}>{item.title}</Text></Box></Tap>)}</Box>
      <ScrollView ref={scroll} testID="inspector-scroll" directionalLockEnabled alwaysBounceHorizontal={false} keyboardShouldPersistTaps="handled" style={{ width: '100%' }} contentContainerStyle={{ width: '100%', paddingBottom: 32 }}>
        <Box width="100%" maxWidth={1200} alignSelf="center" paddingHorizontal={{ phone: 'sm', regularPhone: 'md', tablet: 'xl' }} paddingTop="md" gap="lg">
          <Box flexDirection="row" flexWrap="wrap" gap="xs" alignItems="center"><Icon icon={ShieldCheck} color="primary" size={16} /><Text variant="caption" color="muted">{inspector.running ? 'Sequência simulada em andamento' : 'Simulação sob seu controle'}</Text><Text variant="caption" color="muted">· {POLICY.version}</Text></Box>
          {inspector.storageError && <Text color="danger" accessibilityRole="alert">{inspector.storageError}</Text>}
          {!!message && <Box padding="md" backgroundColor="blueSoft" borderRadius="sm"><Text accessibilityLiveRegion="polite">{message}</Text></Box>}
          {!inspector.ready ? <ActivityIndicator accessibilityLabel="Carregando inspeções" /> : selected ? <RunDetail key={selected.id} run={selected} inspector={inspector} onBack={() => { setSelectedId(null); scroll.current?.scrollTo({ y: 0, animated: false }); }} /> : tab === 'overview' ? overview() : tab === 'robots' ? robots() : tab === 'audit' ? audit() : rules()}
          <Box paddingTop="lg" borderTopWidth={1} borderColor="border"><Text variant="caption" fontSize={10} color="muted">BB · Conceito independente. Robôs, dados, custos e ações são simulados.</Text></Box>
        </Box>
      </ScrollView>
    </Box>
  </Modal>;
}
