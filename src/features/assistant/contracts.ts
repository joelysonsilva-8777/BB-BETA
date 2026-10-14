export type AgentId = 'financial' | 'individual' | 'business';
export type Intent = 'finance.personal' | 'profile.read' | 'business.read' | 'finance.business' | 'profile.update' | 'clarify' | 'unsupported';
export type Status = 'running' | 'completed' | 'failed' | 'cancelled' | 'needs_confirmation' | 'needs_clarification';
export type Fields = Record<string, string | number | boolean>;
export type AgentDefinition = {
  id: AgentId; name: string; description: string; capabilities: string[];
  operations: string[]; inputContract: string; outputContract: string;
  authorization: string; enabled: boolean;
};
export type Step = {
  id: string; agentId: AgentId; operation: string; status: Status;
  startedAt: string; durationMs: number; summary: string; data?: Fields; error?: string;
};
export type Execution = {
  id: string; conversationId: string; correlationId: string; userId: string;
  message: string; intent: Intent; status: Status; startedAt: string; durationMs: number;
  routing: 'deterministic' | 'provider' | 'fallback'; summary: string; steps: Step[];
  confirmation?: { id: string; expiresAt: string; name: string };
};
export type Session = { token: string; user: { id: string; role: 'user' | 'admin' }; demo: true };
export type Conversation = { id: string; createdAt: string };
export type Monitoring = {
  agents: AgentDefinition[];
  executions: { id: string; correlationId: string; status: Status; intent: Intent; startedAt: string; durationMs: number; steps: Omit<Step, 'data'>[] }[];
  audit: { action: string; at: string }[];
};
