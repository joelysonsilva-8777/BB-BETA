import { ThemeProvider } from '@shopify/restyle';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme';

export default function App({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <StatusBar style="dark" />
        {children}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
