import { ChartNoAxesCombined, ChevronRight, CreditCard, Headphones, House, LayoutGrid, ReceiptText, ShieldCheck } from 'lucide-react-native';
import type { Sheet } from '../data/bank';
import { account } from '../data/bank';
import { Brand } from './Brand';
import { Box, Icon, Tap, Text } from './ui';

const items = [
  { label: 'Início', icon: House, sheet: null },
  { label: 'Extrato', icon: ReceiptText, sheet: 'statement' },
  { label: 'Cartões', icon: CreditCard, sheet: 'card' },
  { label: 'Investimentos', icon: ChartNoAxesCombined, sheet: 'investments' },
  { label: 'Todos os serviços', icon: LayoutGrid, sheet: 'services' },
] as const;

export function Sidebar({ onOpen, onHome }: { onOpen: (sheet: Sheet) => void; onHome: () => void }) {
  return (
    <Box width={214} backgroundColor="surface" borderRightWidth={1} borderColor="border" paddingHorizontal="lg" paddingTop="xl" paddingBottom="lg" justifyContent="space-between">
      <Box>
        <Brand />
        <Text variant="eyebrow" color="muted" marginTop="xxl" marginBottom="md">MEU BANCO</Text>
        <Box gap="xs">
          {items.map(item => (
            <Tap key={item.label} accessibilityLabel={item.label} accessibilityState={{ selected: item.sheet === null }} onPress={() => item.sheet ? onOpen(item.sheet) : onHome()}>
              <Box flexDirection="row" alignItems="center" gap="sm" minHeight={48} paddingHorizontal="sm" borderRadius="sm" backgroundColor={item.sheet === null ? 'blueSoft' : 'transparent'}>
                <Icon icon={item.icon} color={item.sheet === null ? 'primary' : 'muted'} size={20} />
                <Text variant="button" color={item.sheet === null ? 'primary' : 'muted'} fontSize={12}>{item.label}</Text>
              </Box>
            </Tap>
          ))}
        </Box>
        <Box marginTop="xl" borderTopWidth={1} borderColor="border" paddingTop="lg">
          <Tap accessibilityLabel="Atendimento" onPress={() => onOpen('support')}>
            <Box flexDirection="row" alignItems="center" gap="sm" minHeight={44}><Icon icon={Headphones} color="muted" size={20} /><Text variant="button" color="muted">Atendimento</Text></Box>
          </Tap>
        </Box>
      </Box>
      <Box gap="lg">
        <Box flexDirection="row" alignItems="center" gap="xs"><Icon icon={ShieldCheck} size={16} color="muted" /><Text variant="caption" fontSize={10} color="muted">Ambiente demonstrativo</Text></Box>
        <Tap accessibilityLabel="Meu perfil" onPress={() => onOpen('profile')}>
          <Box borderTopWidth={1} borderColor="border" paddingTop="lg" flexDirection="row" gap="sm" alignItems="center">
            <Box width={36} height={36} borderRadius="sm" backgroundColor="blueSoft" alignItems="center" justifyContent="center"><Text variant="button" color="primary">{account.initials}</Text></Box>
            <Box flex={1}><Text variant="button">{account.firstName} Costa</Text><Text variant="caption" fontSize={10} color="muted">Minha conta</Text></Box>
            <Icon icon={ChevronRight} size={14} color="muted" />
          </Box>
        </Tap>
      </Box>
    </Box>
  );
}

export function BottomBar({ bottomInset, onOpen, onHome }: { bottomInset: number; onOpen: (sheet: Sheet) => void; onHome: () => void }) {
  const mobileItems = [items[0], items[1], items[2], { label: 'Ajuda', icon: Headphones, sheet: 'support' as const }, { label: 'Menu', icon: LayoutGrid, sheet: 'services' as const }];
  return (
    <Box backgroundColor="surface" borderTopWidth={1} borderColor="border" paddingHorizontal="xs" style={{ paddingBottom: Math.max(bottomInset, 8) }}>
      <Box flexDirection="row" minHeight={64}>
        {mobileItems.map(item => (
          <Tap key={item.label} flex={1} accessibilityLabel={item.label} accessibilityState={{ selected: item.sheet === null }} onPress={() => item.sheet ? onOpen(item.sheet) : onHome()}>
            <Box flex={1} minHeight={64} paddingVertical="xs" alignItems="center" justifyContent="center" gap="xxs" borderTopWidth={2} borderColor={item.sheet === null ? 'brandBlue' : 'transparent'}>
              <Icon icon={item.icon} color={item.sheet === null ? 'primary' : 'muted'} size={21} />
              <Text fontSize={10} lineHeight={15} flexShrink={1} textAlign="center" fontWeight={item.sheet === null ? '700' : '400'} color={item.sheet === null ? 'primary' : 'muted'}>{item.label}</Text>
            </Box>
          </Tap>
        ))}
      </Box>
    </Box>
  );
}
