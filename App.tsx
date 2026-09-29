import { ThemeProvider } from '@shopify/restyle';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Box, Text } from './src/components/ui';
import { useBanking } from './src/hooks/useBanking';
import { HomeScreen } from './src/screens/HomeScreen';
import { theme } from './src/theme';

export default function App() {
  const banking = useBanking();
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <StatusBar style="dark" />
        {banking.ready ? <HomeScreen banking={banking} /> : (
          <Box flex={1} backgroundColor="surface" alignItems="center" justifyContent="center" gap="md">
            <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Carregando início" />
            <Text color="muted">Carregando…</Text>
          </Box>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
