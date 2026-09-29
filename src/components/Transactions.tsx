import { ArrowDownLeft, ArrowUpRight, ReceiptText, ShoppingBag, Wallet } from 'lucide-react-native';
import { currency, transactions, type Transaction } from '../data/bank';
import { useCompactLayout } from '../hooks/useCompactLayout';
import { Box, Card, Icon, Text, TextLink } from './ui';

export function TransactionRow({ item, visible }: { item: Transaction; visible: boolean }) {
  const compact = useCompactLayout();
  const positive = item.amount > 0;
  const icon = item.kind === 'pix' ? positive ? ArrowDownLeft : ArrowUpRight : item.kind === 'purchase' ? ShoppingBag : item.kind === 'income' ? Wallet : ReceiptText;
  return (
    <Box paddingVertical="md" flexDirection="row" alignItems={compact ? 'flex-start' : 'center'} gap="sm" borderTopWidth={1} borderColor="border">
      <Box width={38} height={38} backgroundColor={positive ? 'positiveSoft' : 'surfaceSoft'} borderRadius="sm" alignItems="center" justifyContent="center">
        <Icon icon={icon} size={18} color={positive ? 'positive' : 'muted'} />
      </Box>
      <Box flex={1} minWidth={0} flexDirection={compact ? 'column' : 'row'} gap="xs">
        <Box flex={compact ? undefined : 1} minWidth={0} gap="xxs"><Text variant="button">{item.name}</Text><Text variant="caption" fontSize={11} color="muted">{item.detail}</Text></Box>
        <Box flexShrink={1} minWidth={0} flexDirection={compact ? 'row' : 'column'} flexWrap="wrap" justifyContent="space-between" alignItems={compact ? 'center' : 'flex-end'} gap="xxs">
          <Text variant="button" flexShrink={1} fontSize={12} color={positive ? 'positive' : 'text'}>{visible ? `${positive ? '+ ' : '− '}${currency(Math.abs(item.amount))}` : '••••••'}</Text>
          <Text variant="caption" fontSize={10} color="muted">{item.day}</Text>
        </Box>
      </Box>
    </Box>
  );
}

export function RecentTransactions({ visible, onOpen }: { visible: boolean; onOpen: () => void }) {
  return (
    <Card paddingVertical="xs">
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" paddingVertical="sm" gap="xs">
        <Text variant="title" flex={1} minWidth={0} fontSize={{ phone: 16, tablet: 18 }} accessibilityRole="header">Últimas movimentações</Text>
        <TextLink label="Ver todas" onPress={onOpen} arrow={false} />
      </Box>
      {transactions.slice(0, 4).map(item => <TransactionRow key={item.id} item={item} visible={visible} />)}
      <Box borderTopWidth={1} borderColor="border" paddingVertical="xs"><TextLink label="Consultar extrato completo" onPress={onOpen} /></Box>
    </Card>
  );
}
