import { ActivityIndicator } from 'react-native';
import { Box, Text } from '../components/ui';
import { HomeScreen } from '../screens/HomeScreen';
import { useBanking } from '../hooks/useBanking';
import { theme } from '../theme';

export default function HomeRoute() {
  const banking = useBanking();
  if (!banking.ready) return <Box flex={1} backgroundColor="surface" alignItems="center" justifyContent="center" gap="md"><ActivityIndicator color={theme.colors.primary} accessibilityLabel="Carregando início" /><Text color="muted">Carregando…</Text></Box>;
  return <HomeScreen banking={banking} />;
}
