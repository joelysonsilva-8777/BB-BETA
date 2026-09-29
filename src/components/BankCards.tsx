import { ArrowLeftRight, ArrowRight, Barcode, CalendarDays, ChevronRight, Eye, EyeOff, Grid2X2, Headphones, Plane, Wifi } from 'lucide-react-native';
import { account, currency, invoiceDate, type Sheet } from '../data/bank';
import type { BankingController } from '../hooks/useBanking';
import { useCompactLayout } from '../hooks/useCompactLayout';
import { BBMark, PixMark } from './Brand';
import { Box, Card, Icon, IconButton, Tap, Text, TextLink } from './ui';

export function Money({ amount, visible, large = false, testID }: {
  amount: number; visible: boolean; large?: boolean; testID?: string;
}) {
  return <Text variant={large ? 'balance' : 'amount'} fontSize={large ? { phone: 32, regularPhone: 36 } : 25} flexShrink={1} minWidth={0} testID={testID} accessibilityLabel={visible ? currency(amount) : 'Valor oculto'}>{visible ? currency(amount) : '••••••'}</Text>;
}

export function AccountCard({ banking }: { banking: BankingController }) {
  const compact = useCompactLayout();
  const actions = [
    { label: 'Pix', sheet: 'pix', icon: null },
    { label: 'Pagar', sheet: 'payments', icon: Barcode },
    { label: 'Transferir', sheet: 'transfer', icon: ArrowLeftRight },
    { label: 'Mais', sheet: 'services', icon: Grid2X2 },
  ] as const;

  return (
    <Card padding="none" overflow="hidden">
      <Box padding={{ phone: 'md', regularPhone: 'lg' }} paddingBottom="md">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="sm">
          <Box flex={1} minWidth={0} flexDirection="row" flexWrap="wrap" alignItems="center" gap="xs">
            <Text variant="subtitle" flexShrink={1}>Conta corrente</Text>
            <Box backgroundColor="surfaceSoft" paddingHorizontal="xs" paddingVertical="xxs" borderRadius="sm">
              <Text fontSize={9} lineHeight={12} color="muted">DEMO</Text>
            </Box>
          </Box>
          <IconButton icon={banking.valuesVisible ? Eye : EyeOff} label={banking.valuesVisible ? 'Ocultar valores' : 'Mostrar valores'} onPress={banking.toggleValues} color="muted" />
        </Box>
        <Text variant="caption" color="muted" marginBottom="xxs">Saldo disponível</Text>
        <Money amount={account.balance} visible={banking.valuesVisible} large testID="account-balance" />
        <TextLink label="Ver extrato" onPress={() => banking.openSheet('statement')} />
      </Box>
      <Box flexDirection={compact ? 'column' : 'row'} paddingHorizontal="md" paddingBottom={{ phone: 'md', regularPhone: 'lg' }} gap="xs">
        {[actions.slice(0, 2), actions.slice(2)].map((group, index) => (
          <Box key={index} flex={compact ? undefined : 1} minWidth={0} flexDirection="row" gap="xs">
            {group.map(action => (
              <Tap key={action.label} flex={1} accessibilityLabel={action.label === 'Mais' ? 'Mais serviços' : action.label} onPress={() => banking.openSheet(action.sheet)}>
                <Box minWidth={0} minHeight={compact ? 48 : undefined} padding={compact ? 'xs' : 'none'} backgroundColor={compact ? 'blueSoft' : 'transparent'} borderRadius="sm" flexDirection={compact ? 'row' : 'column'} justifyContent="center" alignItems="center" gap="xs">
                  <Box width={compact ? 24 : '100%'} height={compact ? 24 : 56} backgroundColor="blueSoft" borderRadius="sm" alignItems="center" justifyContent="center">
                    {action.icon ? <Icon icon={action.icon} color="primary" size={24} /> : <PixMark size={24} />}
                  </Box>
                  <Text variant="button" flexShrink={1} textAlign="center" fontSize={12}>{action.label}</Text>
                </Box>
              </Tap>
            ))}
          </Box>
        ))}
      </Box>
      <Tap accessibilityLabel="Consultar agendamentos" onPress={() => banking.openSheet('payments')}>
        <Box paddingHorizontal={{ phone: 'md', regularPhone: 'lg' }} paddingVertical="md" borderTopWidth={1} borderColor="border" flexDirection="row" alignItems="center" gap="sm">
          <Icon icon={CalendarDays} size={19} color="muted" />
          <Text variant="caption" color="muted" flex={1}>Seus pagamentos e agendamentos</Text>
          <Icon icon={ChevronRight} size={16} color="muted" />
        </Box>
      </Tap>
    </Card>
  );
}

export function Ourocard({ small = false }: { small?: boolean }) {
  return (
    <Box backgroundColor="navy" borderRadius="md" padding="md" height={small ? 130 : 160} overflow="hidden" justifyContent="space-between" accessibilityLabel={`Cartão Ourocard Visa, final ${account.cardLastDigits}`}>
      <Box position="absolute" right={-25} top={-16} opacity={0.075} pointerEvents="none"><BBMark size={172} color="onPrimary" /></Box>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text fontSize={14} fontWeight="700" letterSpacing={0.6} color="onPrimary">OUROCARD</Text>
        <BBMark color="yellow" size={23} />
      </Box>
      <Box flexDirection="row" alignItems="center" gap="xs">
        <Box width={29} height={22} borderRadius="sm" backgroundColor="gold" overflow="hidden" justifyContent="space-evenly">
          <Box height={1} backgroundColor="navy" opacity={0.3} />
          <Box height={1} backgroundColor="navy" opacity={0.3} />
          <Box position="absolute" left={9} width={1} height="100%" backgroundColor="navy" opacity={0.3} />
          <Box position="absolute" right={9} width={1} height="100%" backgroundColor="navy" opacity={0.3} />
        </Box>
        <Icon icon={Wifi} color="blueMuted" size={17} />
      </Box>
      <Box flexDirection="row" justifyContent="space-between" alignItems="flex-end">
        <Box gap="xxs"><Text color="blueMuted" fontSize={11} letterSpacing={1.7}>••••  {account.cardLastDigits}</Text><Text color="onPrimary" fontSize={9} lineHeight={14} letterSpacing={1}>JOÃO COSTA</Text></Box>
        <Text color="onPrimary" fontSize={20} fontWeight="800" fontStyle="italic">VISA</Text>
      </Box>
    </Box>
  );
}

export function CreditCard({ banking }: { banking: BankingController }) {
  const compact = useCompactLayout();
  return (
    <Card gap="md">
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text variant="subtitle">Meu cartão</Text>
        <Tap accessibilityLabel="Gerenciar cartão" onPress={() => banking.openSheet('card')}>
          <Box minHeight={44} minWidth={44} alignItems="flex-end" justifyContent="center"><Icon icon={ArrowRight} size={18} color="primary" /></Box>
        </Tap>
      </Box>
      <Ourocard small />
      <Box flexDirection={compact ? 'column' : 'row'} alignItems={compact ? 'stretch' : 'center'} justifyContent="space-between" gap="xs">
        <Box minWidth={0} flexShrink={1} gap="xxs"><Text variant="caption" color="muted">Fatura aberta</Text><Money amount={account.invoice} visible={banking.valuesVisible} testID="invoice-amount" /></Box>
        <Box flexDirection={compact ? 'row' : 'column'} alignItems={compact ? 'center' : 'flex-end'} flexWrap="wrap" gap="xxs"><Text fontSize={10} color="muted">Vencimento</Text><Text variant="button">{invoiceDate()}</Text></Box>
      </Box>
      <Tap accessibilityLabel="Ver fatura" onPress={() => banking.openSheet('card')}>
        <Box borderTopWidth={1} borderColor="border" paddingTop="sm" minHeight={44} flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text variant="button" color="primary">Ver fatura</Text><Icon icon={ChevronRight} color="primary" size={17} />
        </Box>
      </Tap>
    </Card>
  );
}

export function SavingsCard({ visible, onOpen }: { visible: boolean; onOpen: (sheet: Sheet) => void }) {
  return (
    <Card gap="md">
      <Box flexDirection="row" alignItems="center" justifyContent="space-between"><Text variant="subtitle">Seus planos</Text><Icon icon={Plane} color="primary" size={21} /></Box>
      <Box gap="xxs"><Text variant="title" fontSize={21}>Próxima viagem</Text><Text variant="caption" color="muted">Um pouco por vez. No seu ritmo.</Text></Box>
      <Box height={5} backgroundColor="surfaceSoft" overflow="hidden">
        <Box height="100%" width={visible ? `${Math.round(account.savings / account.savingsTarget * 100)}%` : '0%'} backgroundColor="primary" />
      </Box>
      <Box flexDirection="row" flexWrap="wrap" justifyContent="space-between" gap="xs">
        <Text variant="button">{visible ? currency(account.savings) : '••••'}</Text>
        <Text variant="caption" color="muted">de {visible ? currency(account.savingsTarget) : '••••'}</Text>
      </Box>
      <TextLink label="Acompanhar cofrinho" onPress={() => onOpen('savings')} />
    </Card>
  );
}

export function SupportCard({ onPress }: { onPress: () => void }) {
  return (
    <Box padding={{ phone: 'md', regularPhone: 'lg' }} backgroundColor="yellowSoft" borderRadius="md" gap="sm">
      <Icon icon={Headphones} color="navy" size={24} />
      <Text variant="subtitle">Precisa de uma mão?</Text>
      <Text variant="caption" color="muted">Encontre respostas e os canais de atendimento do BB.</Text>
      <TextLink label="Falar com o BB" onPress={onPress} />
    </Box>
  );
}
