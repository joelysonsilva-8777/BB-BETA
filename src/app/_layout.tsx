import { Stack } from 'expo-router';
import App from '../../App';
import { AssistantProvider } from '../features/assistant/AssistantProvider';

export default function RootLayout() {
  return <App><AssistantProvider><Stack screenOptions={{ headerShown: false }} /></AssistantProvider></App>;
}
