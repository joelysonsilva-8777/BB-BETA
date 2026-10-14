import { AssistantScreen } from '../features/assistant/AssistantScreen';
import { useAssistantSession } from '../features/assistant/AssistantProvider';

export default function AssistantRoute() {
  const { session } = useAssistantSession();
  return <AssistantScreen key={session?.token ?? 'guest'} />;
}
