import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import type { Session } from './contracts';
import { api } from './client';

const Context = createContext<{ session: Session | null; enter: (password?: string) => Promise<void>; logout: () => Promise<void> } | null>(null);
export function AssistantProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  async function enter(password?: string) {
    const next = password === undefined ? await api.demo() : await api.admin(password);
    if (session) { try { await api.logout(session.token); } catch { /* The prior session may already have expired. */ } }
    setSession(next);
  }
  async function logout() { if (session) await api.logout(session.token); setSession(null); }
  return <Context.Provider value={{ session, enter, logout }}>{children}</Context.Provider>;
}
export function useAssistantSession() { const context = useContext(Context); if (!context) throw new Error('AssistantProvider ausente'); return context; }
