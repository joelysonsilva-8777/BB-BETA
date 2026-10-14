import { MonitoringScreen } from '../features/assistant/MonitoringScreen';
import { useAssistantSession } from '../features/assistant/AssistantProvider';

export default function AdminRoute() {
  const { session } = useAssistantSession();
  return <MonitoringScreen key={session?.token ?? 'guest'} />;
}
