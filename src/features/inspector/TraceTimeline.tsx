import { Box, Text } from '../../components/ui';
import { ROBOTS, RULES, type TraceEvent } from './contracts';

const actorName = (actor: TraceEvent['actor']) => actor === 'gateway' ? 'Gateway local' : actor === 'demo-user' ? 'Operador fictício' : ROBOTS.find(robot => robot.id === actor)!.name;
const titles: Record<TraceEvent['kind'], string> = {
  'request.received': 'Pedido recebido', 'operation.requested': 'Tentativa registrada',
  'gateway.decided': 'Decisão antes da execução', 'tool.completed': 'Ferramenta executada',
  'agent.delegated': 'Outro agente acionado', 'agent.returned': 'Resposta do agente jurídico',
  'response.produced': 'Resposta final', 'trace.closed': 'Observação encerrada',
};

export function TraceTimeline({ events }: { events: TraceEvent[] }) {
  return <Box gap="md" testID="execution-trace">{events.map(event => <Box key={event.id} borderLeftWidth={2} borderColor={event.kind === 'gateway.decided' && event.outcome === 'denied' ? 'danger' : 'border'} paddingLeft="sm" gap="xs" testID={`trace-${event.kind}`}>
    <Box flexDirection="row" flexWrap="wrap" gap="xs"><Text variant="caption" color="primary">{String(event.sequence).padStart(2, '0')} · {actorName(event.actor)}</Text><Text variant="caption" color="muted">{new Date(event.at).toLocaleTimeString('pt-BR')}</Text></Box>
    <Text variant="subtitle">{titles[event.kind]}</Text>
    {event.kind === 'operation.requested' ? <>
      <Text variant="body" color="muted">{event.operation.tool.replaceAll('_', ' ')} · {event.operation.resource}</Text>
      <Text variant="caption" color="muted">{event.operation.subjects.length} titular(es) · destinatário {event.operation.recipient === 'external' ? 'externo' : 'interno'}</Text>
      {event.operation.subjects.length > 0 && <Text variant="caption" selectable>{event.operation.subjects.slice(0, 3).map(subject => subject.id).join(', ')}{event.operation.subjects.length > 3 ? ` e mais ${event.operation.subjects.length - 3}` : ''}</Text>}
      <Text variant="caption" color="muted">Finalidade: {event.operation.purpose}. Autorização apresentada: {event.operation.access.grantRef ?? 'ausente'}.</Text>
    </> : event.kind === 'gateway.decided' ? <>
      <Text variant="button" color={event.outcome === 'denied' ? 'danger' : 'positive'}>{event.outcome === 'denied' ? 'Acesso impedido' : 'Operação permitida'}</Text>
      <Text variant="body" color="muted">{event.outcome === 'denied' ? 'A ferramenta não recebeu autorização para executar.' : 'A solicitação passou pelos controles do gateway simulado.'}</Text>
      {!!event.ruleIds.length && <Text variant="caption">Critérios: {event.ruleIds.map(id => RULES.find(rule => rule.id === id)!.name).join(', ')}.</Text>}
    </> : <Text variant="body" color="muted">{event.detail}</Text>}
    <Text variant="caption" fontSize={10} color="muted" selectable>{event.id}{'requestId' in event ? ` · origem ${event.requestId}` : ''}</Text>
  </Box>)}</Box>;
}
