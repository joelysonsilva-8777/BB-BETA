import { useState } from 'react';
import { Linking, Modal, ScrollView, TextInput, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import { ArrowLeftRight, ArrowUpRight, Barcode, Bell, CalendarDays, ChartNoAxesCombined, ChevronDown, ChevronRight, CreditCard as CreditCardIcon, Eye, EyeOff, Headphones, PiggyBank, ReceiptText, Search, ShieldCheck, Smartphone, X, type LucideIcon } from 'lucide-react-native';
import { account, currency, invoiceDate, invoiceItems, transactions, type Sheet } from '../data/bank';
import type { BankingController } from '../hooks/useBanking';
import { useCompactLayout } from '../hooks/useCompactLayout';
import type { Theme } from '../theme';
import { Money, Ourocard } from './BankCards';
import { TransactionRow } from './Transactions';
import { Box, Button, Card, Icon, IconButton, Tap, Text } from './ui';

const titles: Record<Sheet, string> = {
  profile: 'Minha conta', notifications: 'Notificações', statement: 'Extrato da conta',
  pix: 'Pix', payments: 'Pagamentos', transfer: 'Transferências', card: 'Meu Ourocard',
  investments: 'Investimentos', services: 'Todos os serviços', support: 'Fale com o BB',
  savings: 'Meu cofrinho', recharge: 'Recarga de celular',
};

const services: { title: string; detail: string; icon: LucideIcon; sheet: Sheet }[] = [
  { title: 'Pix', detail: 'Seus envios e recebimentos', icon: ArrowLeftRight, sheet: 'pix' },
  { title: 'Pagar contas', detail: 'Boletos e agendamentos', icon: Barcode, sheet: 'payments' },
  { title: 'Transferências', detail: 'Movimentações entre contas', icon: ArrowUpRight, sheet: 'transfer' },
  { title: 'Extrato', detail: 'Entradas e saídas da conta', icon: ReceiptText, sheet: 'statement' },
  { title: 'Cartões', detail: 'Ourocard, fatura e limite', icon: CreditCardIcon, sheet: 'card' },
  { title: 'Investimentos', detail: 'Acompanhe seu dinheiro', icon: ChartNoAxesCombined, sheet: 'investments' },
  { title: 'Cofrinho BB', detail: 'Seus planos, um por vez', icon: PiggyBank, sheet: 'savings' },
  { title: 'Recarga de celular', detail: 'Suas recargas recentes', icon: Smartphone, sheet: 'recharge' },
  { title: 'Atendimento', detail: 'Ajuda e canais oficiais', icon: Headphones, sheet: 'support' },
];

function ListItem({ title, detail, icon, onPress }: { title: string; detail: string; icon: LucideIcon; onPress?: () => void }) {
  const content = (
    <Box paddingVertical="md" flexDirection="row" alignItems="center" gap="md" borderBottomWidth={1} borderColor="border">
      <Box width={40} height={40} backgroundColor="blueSoft" alignItems="center" justifyContent="center" borderRadius="sm"><Icon icon={icon} color="primary" /></Box>
      <Box flex={1} minWidth={0} gap="xxs"><Text variant="subtitle">{title}</Text><Text variant="caption" color="muted">{detail}</Text></Box>
      {onPress && <Icon icon={ChevronRight} size={16} color="muted" />}
    </Box>
  );
  return onPress ? <Tap accessibilityLabel={title} onPress={onPress}>{content}</Tap> : content;
}

function SupportContent() {
  const [open, setOpen] = useState<number | null>(null);
  const [linkError, setLinkError] = useState(false);
  const questions = [
    ['Como ocultar meu saldo?', 'Toque no ícone de olho no bloco Conta corrente. Sua escolha também oculta fatura, extrato e cofrinho.'],
    ['Onde vejo minha fatura?', 'No início, toque em Ver fatura, abaixo do seu Ourocard. Você também pode usar Cartões no menu.'],
    ['Esta conta movimenta dinheiro?', 'Não. Esta é uma demonstração de interface com dados fictícios, sem vínculo com uma conta bancária real.'],
  ];
  return (
    <Box gap="lg">
      <Text color="muted">Uma dúvida rápida ou algo que precisa de mais atenção. Encontre o melhor caminho.</Text>
      <Box>{questions.map(([question, answer], index) => (
        <Box key={question} borderBottomWidth={1} borderColor="border">
          <Tap accessibilityLabel={question} accessibilityState={{ expanded: open === index }} onPress={() => setOpen(open === index ? null : index)}>
            <Box paddingVertical="md" flexDirection="row" alignItems="center" gap="sm"><Text variant="button" flex={1}>{question}</Text><Icon icon={ChevronDown} size={16} /></Box>
          </Tap>
          {open === index && <Text color="muted" paddingBottom="md">{answer}</Text>}
        </Box>
      ))}</Box>
      <Card backgroundColor="blueSoft" borderColor="blueSoft" gap="sm">
        <Text variant="subtitle">Central de Relacionamento BB</Text>
        <Text>4004 0001 <Text variant="caption" color="muted">· Capitais e regiões metropolitanas</Text></Text>
        <Text>0800 729 0001 <Text variant="caption" color="muted">· Demais localidades</Text></Text>
      </Card>
      <Button label="Abrir atendimento oficial" icon={ArrowUpRight} onPress={() => {
        Linking.openURL('https://www.bb.com.br/atendimento').catch(() => setLinkError(true));
      }} />
      {linkError && <Text color="danger" accessibilityRole="alert">Não foi possível abrir o site. Acesse bb.com.br/atendimento no navegador.</Text>}
    </Box>
  );
}

export function ServiceSheet({ banking }: { banking: BankingController }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Todas' | 'Entradas' | 'Saídas'>('Todas');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = useCompactLayout();
  const contentPadding = width < 390 ? 16 : 24;
  const theme = useTheme<Theme>();
  const { sheet, valuesVisible: visible, openSheet } = banking;
  if (!sheet) return null;
  const amount = (value: number) => visible ? currency(value) : '••••••';
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredServices = services.filter(service => normalize(`${service.title} ${service.detail}`).includes(normalize(query)));

  function content() {
    switch (sheet) {
      case 'profile': return (
        <Box gap="lg">
          <Box flexDirection="row" alignItems="center" gap="md"><Box width={56} height={56} backgroundColor="blueSoft" alignItems="center" justifyContent="center" borderRadius="md"><Text variant="title" color="primary">{account.initials}</Text></Box><Box flex={1} minWidth={0}><Text variant="title">{account.fullName}</Text><Text variant="caption" color="muted">Conta demonstrativa</Text></Box></Box>
          <Card gap="md"><Text>Agência <Text fontWeight="700">{account.branch}</Text></Text><Text>Conta corrente <Text fontWeight="700">{account.number}</Text></Text><Text variant="caption" color="muted">Dados de exemplo para explorar o aplicativo.</Text></Card>
          <Button label={visible ? 'Ocultar valores' : 'Mostrar valores'} icon={visible ? EyeOff : Eye} secondary onPress={banking.toggleValues} />
        </Box>
      );
      case 'notifications': return (
        <Box gap="md">
          <Text variant="caption" color="muted">Você está em dia com seus avisos.</Text>
          <ListItem title="Sua fatura está disponível" detail={`Ourocard final ${account.cardLastDigits} · vencimento em ${invoiceDate()}`} icon={CreditCardIcon} onPress={() => openSheet('card')} />
          <ListItem title="Seu próximo plano tem um lugar" detail="Acompanhe o objetivo Próxima viagem no Cofrinho BB." icon={PiggyBank} onPress={() => openSheet('savings')} />
          <Box flexDirection="row" gap="xs" alignItems="center"><Icon icon={Bell} size={14} color="muted" /><Text variant="caption" flex={1} color="muted">Avisos demonstrativos, marcados como lidos.</Text></Box>
        </Box>
      );
      case 'services': return (
        <Box gap="md">
          <Box flexDirection="row" alignItems="center" backgroundColor="surfaceSoft" borderRadius="sm" paddingHorizontal="md" gap="xs">
            <Icon icon={Search} color="muted" size={19} />
            <TextInput accessibilityLabel="Buscar um serviço" placeholder="O que você precisa?" placeholderTextColor={theme.colors.muted} value={query} onChangeText={setQuery} style={{ flex: 1, minWidth: 0, minHeight: 50, color: theme.colors.text, fontSize: 16 }} autoCorrect={false} />
          </Box>
          <Box>{filteredServices.map(service => <ListItem key={service.sheet} {...service} onPress={() => openSheet(service.sheet)} />)}</Box>
          {filteredServices.length === 0 && <Text color="muted">Nenhum serviço encontrado. Tente outro nome.</Text>}
        </Box>
      );
      case 'statement': {
        const items = transactions.filter(item => filter === 'Todas' || (filter === 'Entradas' ? item.amount > 0 : item.amount < 0));
        return (
          <Box gap="lg">
            <Box gap="xxs"><Text color="muted">Saldo disponível</Text><Money amount={account.balance} visible={visible} /></Box>
            <Box flexDirection="row" gap="xs">{(['Todas', 'Entradas', 'Saídas'] as const).map(label => <Tap key={label} flex={1} accessibilityLabel={label} accessibilityState={{ selected: filter === label }} onPress={() => setFilter(label)}><Box minHeight={44} alignItems="center" justifyContent="center" borderRadius="sm" backgroundColor={filter === label ? 'primary' : 'surfaceSoft'}><Text variant="button" color={filter === label ? 'onPrimary' : 'muted'}>{label}</Text></Box></Tap>)}</Box>
            <Box testID="statement-list">{items.map(item => <TransactionRow key={item.id} item={item} visible={visible} />)}</Box>
          </Box>
        );
      }
      case 'card': return (
        <Box gap="lg">
          <Ourocard />
          <Box flexDirection={compact ? 'column' : 'row'} justifyContent="space-between" alignItems={compact ? 'stretch' : 'center'} gap="xs"><Box minWidth={0} flexShrink={1}><Text color="muted">Fatura aberta</Text><Money amount={account.invoice} visible={visible} /></Box><Text variant="caption" flexShrink={1} color="muted">Vence em {invoiceDate()}</Text></Box>
          <Box borderTopWidth={1} borderColor="border" paddingTop="md" gap="xs"><Text variant="subtitle">Compras nesta fatura</Text>{invoiceItems.map(item => <Box key={item.name} flexDirection="row" flexWrap="wrap" justifyContent="space-between" gap="sm" paddingVertical="xs"><Text flexShrink={1}>{item.name}</Text><Text variant="button" flexShrink={1}>{amount(item.amount)}</Text></Box>)}</Box>
          <Card backgroundColor="blueSoft" borderColor="blueSoft" gap="xs"><Text variant="caption" color="muted">Limite disponível</Text><Text variant="title">{amount(account.cardLimit - account.invoice)}</Text></Card>
        </Box>
      );
      case 'savings': return (
        <Box gap="lg">
          <Icon icon={PiggyBank} color="primary" size={38} /><Text variant="heading">Próxima viagem</Text><Text color="muted">Um objetivo com nome fica mais perto de acontecer.</Text>
          <Card gap="md"><Text variant="caption" color="muted">Você já guardou</Text><Money amount={account.savings} visible={visible} /><Box height={6} backgroundColor="surfaceSoft"><Box height="100%" width={visible ? `${Math.round(account.savings / account.savingsTarget * 100)}%` : '0%'} backgroundColor="primary" /></Box><Text variant="caption" color="muted">Objetivo: {amount(account.savingsTarget)}</Text></Card>
          <Text variant="caption" color="muted">Este objetivo é um exemplo. Nenhum valor foi aplicado ou movimentado.</Text>
        </Box>
      );
      case 'investments': return (
        <Box gap="lg"><Text color="muted">Um lugar para acompanhar seus planos.</Text><Card gap="xs"><Text variant="caption" color="muted">Total em objetivos</Text><Money amount={account.savings} visible={visible} /></Card><ListItem title="Cofrinho BB" detail="Próxima viagem" icon={PiggyBank} onPress={() => openSheet('savings')} /><Text variant="caption" color="muted">Carteira ilustrativa, sem aplicações ou rentabilidades reais.</Text></Box>
      );
      case 'pix': return (
        <Box gap="lg"><Text color="muted">Seus Pix, organizados em um só lugar.</Text><Text variant="subtitle">Últimos envios e recebimentos</Text><Box>{transactions.filter(item => item.kind === 'pix').map(item => <TransactionRow key={item.id} item={item} visible={visible} />)}</Box><Text variant="caption" color="muted">Esta prévia permite consultar exemplos. Enviar ou receber dinheiro exige uma conta no aplicativo oficial.</Text></Box>
      );
      case 'payments': return (
        <Box gap="lg"><Text variant="subtitle">Para acompanhar</Text><ListItem title="Fatura Ourocard" detail={`${amount(account.invoice)} · vence em ${invoiceDate()}`} icon={CreditCardIcon} onPress={() => openSheet('card')} /><ListItem title="Agendamentos" detail="Nenhum pagamento agendado nesta demonstração." icon={CalendarDays} /><Text variant="subtitle">Último pagamento</Text><TransactionRow item={transactions[2]} visible={visible} /></Box>
      );
      case 'transfer': return (
        <Box gap="lg"><Text color="muted">Consulte suas movimentações entre contas.</Text><Box>{transactions.filter(item => item.kind === 'pix').map(item => <TransactionRow key={item.id} item={item} visible={visible} />)}</Box><Button label="Consultar todos os lançamentos" secondary icon={ReceiptText} onPress={() => openSheet('statement')} /><Text variant="caption" color="muted">Nenhuma transferência é executada neste protótipo.</Text></Box>
      );
      case 'recharge': return <Box gap="lg"><Icon icon={Smartphone} color="primary" size={36} /><Text variant="title">Nenhuma recarga por aqui</Text><Text color="muted">As recargas apareceriam aqui depois de realizadas. Esta demonstração não contrata serviços nem faz cobranças.</Text></Box>;
      case 'support': return <SupportContent />;
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={banking.closeSheet}>
      <Box flex={1} backgroundColor="overlay" justifyContent={width >= 768 ? 'center' : 'flex-end'} padding={width >= 768 ? 'lg' : 'none'}>
        <Box position="absolute" top={0} left={0} right={0} bottom={0}><Tap flex={1} accessibilityLabel="Fechar painel pelo fundo" onPress={banking.closeSheet}><Box flex={1} /></Tap></Box>
        <Box testID="service-panel" width="100%" minWidth={0} maxWidth={520} maxHeight={width >= 768 ? '88%' : '90%'} alignSelf="center" backgroundColor="surface" borderTopLeftRadius="md" borderTopRightRadius="md" borderBottomLeftRadius={width >= 768 ? 'md' : 'none'} borderBottomRightRadius={width >= 768 ? 'md' : 'none'} overflow="hidden" accessibilityViewIsModal>
          <Box height={3} backgroundColor="yellow" />
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" paddingLeft={{ phone: 'md', regularPhone: 'lg' }} paddingRight="sm" paddingVertical="sm" borderBottomWidth={1} borderColor="border" gap="xs">
            <Text variant="title" flex={1} minWidth={0} accessibilityRole="header">{titles[sheet]}</Text><IconButton icon={X} label="Fechar painel" onPress={banking.closeSheet} />
          </Box>
          <ScrollView testID="service-scroll" directionalLockEnabled alwaysBounceHorizontal={false} keyboardShouldPersistTaps="handled" style={{ width: '100%' }} contentContainerStyle={{ width: '100%', padding: contentPadding, paddingBottom: Math.max(insets.bottom, contentPadding) }}>
            {content()}
            <Box marginTop="lg" paddingTop="md" borderTopWidth={1} borderColor="border" flexDirection="row" alignItems="center" gap="xs"><Icon icon={ShieldCheck} size={13} color="muted" /><Text variant="caption" flex={1} fontSize={10} color="muted">Demonstração · Nenhuma operação bancária real</Text></Box>
          </ScrollView>
        </Box>
      </Box>
    </Modal>
  );
}
