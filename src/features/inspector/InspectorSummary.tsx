import { ArrowRight, ShieldCheck } from 'lucide-react-native';
import { Box, Icon, Tap, Text } from '../../components/ui';
import type { InspectorController } from './useInspector';
import { ROBOTS } from './engine';

export function InspectorSummary({ inspector, onOpen }: { inspector: InspectorController; onOpen: () => void }) {
  return (
    <Tap accessibilityLabel="Abrir central de inspeção" onPress={onOpen}>
      <Box testID="inspector-summary" backgroundColor="navy" borderRadius="md" padding={{ phone: 'md', regularPhone: 'lg' }} marginBottom={{ phone: 'md', regularPhone: 'lg' }} gap="sm">
        <Box flexDirection="row" gap="sm" alignItems="center">
          <Icon icon={ShieldCheck} color="yellow" size={26} />
          <Box flex={1} minWidth={0}><Text variant="eyebrow" color="onPrimary">INSPETOR IA</Text><Text variant="caption" color="blueMuted">Governança de crédito PJ · Simulação</Text></Box>
          <Icon icon={ArrowRight} color="onPrimary" />
        </Box>
        <Text variant="title" color="onPrimary">Um olhar atento sobre cada robô.</Text>
        <Text variant="caption" color="blueMuted">Da tentativa de consulta à resposta: acompanhe o que cada agente fez e por que recebeu sua nota.</Text>
        <Box flexDirection="row" flexWrap="wrap" gap="sm" borderTopWidth={1} borderColor="navySoft" paddingTop="sm">
          <Text variant="button" color="onPrimary">{ROBOTS.length} agentes · 5 regras</Text>
          <Text variant="caption" color="onPrimary">{inspector.ready ? `${inspector.stats.pending} ${inspector.stats.pending === 1 ? 'revisão pendente' : 'revisões pendentes'}` : 'Carregando histórico…'}</Text>
          <Text variant="caption" color="yellow">Abrir central →</Text>
        </Box>
      </Box>
    </Tap>
  );
}
