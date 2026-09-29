import { useRef } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, CalendarDays, ChevronRight, Search, ShieldCheck } from 'lucide-react-native';
import { account } from '../data/bank';
import type { BankingController } from '../hooks/useBanking';
import { Box, Icon, IconButton, Tap, Text } from '../components/ui';
import { Brand } from '../components/Brand';
import { AccountCard, CreditCard, SavingsCard, SupportCard } from '../components/BankCards';
import { RecentTransactions } from '../components/Transactions';
import { BottomBar, Sidebar } from '../components/Navigation';
import { ServiceSheet } from '../components/ServiceSheet';

export function HomeScreen({ banking }: { banking: BankingController }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const desktop = width >= 1180;
  const columns = width >= 900;
  const date = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  const goHome = () => scroll.current?.scrollTo({ y: 0, animated: true });

  return (
    <Box flex={1} backgroundColor="background">
      <Box height={3} backgroundColor="yellow" />
      <Box
        flex={1}
        flexDirection="row"
        aria-hidden={banking.sheet !== null}
        accessibilityElementsHidden={banking.sheet !== null}
        importantForAccessibility={banking.sheet ? 'no-hide-descendants' : 'auto'}
      >
        {desktop && <Sidebar onOpen={banking.openSheet} onHome={goHome} />}
        <Box flex={1} minWidth={0} style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
          <Box backgroundColor="surface" borderBottomWidth={1} borderColor="border">
            <Box maxWidth={1190} width="100%" alignSelf="center" paddingHorizontal={{ phone: 'md', regularPhone: 'lg', tablet: 'xl' }} minHeight={68} paddingVertical="xs" flexDirection="row" alignItems="center" justifyContent="space-between" gap="xs">
              {desktop ? (
                <Box flexDirection="row" alignItems="center" gap="sm"><Text variant="caption" color="muted">Início</Text><Icon icon={ChevronRight} size={12} color="muted" /><Text variant="button">Minha conta</Text></Box>
              ) : <Brand />}
              <Box flexDirection="row" alignItems="center" gap="xs">
                <IconButton icon={Search} label="Buscar serviços" onPress={() => banking.openSheet('services')} color="muted" />
                <IconButton icon={Bell} label={banking.notificationsRead ? 'Notificações' : 'Notificações, 2 não lidas'} onPress={() => banking.openSheet('notifications')} color="muted" badge={!banking.notificationsRead} />
                {desktop && <Tap accessibilityLabel="Detalhes da conta" onPress={() => banking.openSheet('profile')}><Box marginLeft="md" backgroundColor="blueSoft" width={36} height={36} borderRadius="sm" alignItems="center" justifyContent="center"><Text variant="button" color="primary">{account.initials}</Text></Box></Tap>}
              </Box>
            </Box>
          </Box>

          <ScrollView
            ref={scroll}
            testID="home-scroll"
            directionalLockEnabled
            alwaysBounceHorizontal={false}
            style={{ width: '100%' }}
            contentContainerStyle={{ width: '100%', paddingBottom: desktop ? Math.max(insets.bottom, 24) : 24 }}
          >
            <Box width="100%" maxWidth={1190} alignSelf="center" paddingHorizontal={{ phone: 'sm', regularPhone: 'md', tablet: 'xl' }}>
              <Box paddingVertical={{ phone: 'md', regularPhone: 'lg', tablet: 'xl' }} flexDirection="row" alignItems="center" justifyContent="space-between" gap="md">
                <Box flex={1} minWidth={0} gap="xxs">
                  <Text variant="heading" fontSize={{ phone: 25, tablet: 28 }} accessibilityRole="header">Olá, {account.firstName}.</Text>
                  <Tap accessibilityLabel="Ver dados da conta" onPress={() => banking.openSheet('profile')}>
                    <Box flexDirection="row" alignItems="center" gap="xs" minHeight={32}>
                      <Text variant="caption" flexShrink={1} color="muted">Ag. {account.branch}  ·  Conta {account.number}</Text>
                      <Icon icon={ChevronRight} size={12} color="muted" />
                    </Box>
                  </Tap>
                </Box>
                {columns && <Box flexDirection="row" alignItems="center" gap="xs"><Icon icon={CalendarDays} size={16} color="muted" /><Text variant="caption" color="muted">{date}</Text></Box>}
              </Box>

              {banking.storageError && <Box padding="md" marginBottom="md" backgroundColor="surface"><Text variant="caption" color="danger" accessibilityRole="alert">Não foi possível salvar sua preferência de privacidade neste aparelho.</Text></Box>}

              <Box flexDirection={columns ? 'row' : 'column'} alignItems="flex-start" gap={{ phone: 'md', regularPhone: 'lg' }}>
                <Box minWidth={0} flex={columns ? 1 : undefined} width={columns ? undefined : '100%'}><AccountCard banking={banking} /></Box>
                <Box width={columns ? 320 : '100%'}><CreditCard banking={banking} /></Box>
              </Box>

              <Box flexDirection={columns ? 'row' : 'column'} alignItems="flex-start" gap={{ phone: 'md', regularPhone: 'lg' }} marginTop={{ phone: 'md', regularPhone: 'lg' }}>
                <Box minWidth={0} flex={columns ? 1 : undefined} width={columns ? undefined : '100%'} gap="lg">
                  <RecentTransactions visible={banking.valuesVisible} onOpen={() => banking.openSheet('statement')} />
                  <Box flexDirection="row" gap="sm" alignItems="center" paddingHorizontal="xxs" paddingVertical="sm">
                    <Icon icon={ShieldCheck} color="primary" size={25} />
                    <Box flex={1}><Text variant="button">Segurança faz parte da sua rotina.</Text><Text variant="caption" color="muted">O BB nunca pede sua senha por telefone ou mensagem.</Text></Box>
                  </Box>
                </Box>
                <Box width={columns ? 320 : '100%'} gap="lg">
                  <SavingsCard visible={banking.valuesVisible} onOpen={banking.openSheet} />
                  <SupportCard onPress={() => banking.openSheet('support')} />
                </Box>
              </Box>
              <Box paddingTop="xl" paddingBottom="xs" flexDirection="row" flexWrap="wrap" justifyContent="space-between" gap="xs" borderTopWidth={1} borderColor="border" marginTop="xl">
                <Text variant="caption" fontSize={10} color="muted">Banco do Brasil. Pra tudo que você imaginar.</Text>
                <Text variant="caption" fontSize={10} color="muted">Protótipo demonstrativo · Dados fictícios</Text>
              </Box>
            </Box>
          </ScrollView>
          {!desktop && <BottomBar bottomInset={insets.bottom} onOpen={banking.openSheet} onHome={goHome} />}
        </Box>
      </Box>
      <ServiceSheet key={banking.sheet ?? 'closed'} banking={banking} />
    </Box>
  );
}
