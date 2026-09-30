import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInspector, MAX_RUNS, metrics, reduceInspector, type InspectorAction, type RobotId, type ScenarioId } from './engine';
import { INSPECTOR_STORAGE_KEY, restoreInspector } from './storage';

export function useInspector(visible: boolean) {
  const [state, setState] = useState(createInspector);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [storageError, setStorageError] = useState<string | null>(null);
  const dirty = useRef(false);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(INSPECTOR_STORAGE_KEY).then(raw => {
      if (!active || !raw) return;
      const restored = restoreInspector(raw);
      if (restored) setState(restored);
      else setStorageError('O histórico salvo não pôde ser validado. Uma nova sessão demonstrativa foi carregada.');
    }).catch(() => { if (active) setStorageError('Não foi possível recuperar o histórico deste aparelho.'); })
      .finally(() => { if (active) setReady(true); });
    const subscription = AppState.addEventListener('change', status => setForeground(status === 'active'));
    return () => { active = false; subscription.remove(); };
  }, []);

  const dispatch = useCallback((action: InspectorAction) => {
    if (!ready) return;
    dirty.current = true;
    setState(previous => reduceInspector(previous, action));
  }, [ready]);

  useEffect(() => {
    if (!ready || !dirty.current) return;
    const snapshot = JSON.stringify(state);
    writes.current = writes.current.then(() => AsyncStorage.setItem(INSPECTOR_STORAGE_KEY, snapshot))
      .then(() => setStorageError(null))
      .catch(() => setStorageError('O histórico atual está apenas na memória. Não foi possível salvá-lo neste aparelho.'));
  }, [state, ready]);

  const stats = metrics(state);
  const running = ready && live && visible && foreground && stats.active > 0 && state.runs.length < MAX_RUNS;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => dispatch({ type: 'simulate', at: new Date().toISOString() }), 8000);
    return () => clearInterval(timer);
  }, [running, dispatch]);

  // Leaving the inspector always ends automatic playback, including on native.
  useEffect(() => { if (!visible) setLive(false); }, [visible]);

  return {
    state, ready, live, running, stats, storageError,
    toggleLive: () => setLive(value => !value),
    simulate: (scenarioId?: ScenarioId) => dispatch({ type: 'simulate', scenarioId, at: new Date().toISOString() }),
    review: (runId: string, note: string) => dispatch({ type: 'review', runId, note, at: new Date().toISOString() }),
    toggleRobot: (robotId: RobotId) => dispatch({ type: 'toggleRobot', robotId, at: new Date().toISOString() }),
    audit: () => dispatch({ type: 'audit', at: new Date().toISOString() }),
  };
}

export type InspectorController = ReturnType<typeof useInspector>;
