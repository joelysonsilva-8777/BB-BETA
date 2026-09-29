import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import type { Sheet } from '../data/bank';

const STORAGE_KEY = '@bb/home/preferences/v1';
type Preferences = { valuesVisible: boolean; notificationsRead: boolean };

export function useBanking() {
  const [preferences, setPreferences] = useState<Preferences>({ valuesVisible: true, notificationsRead: false });
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [storageError, setStorageError] = useState(false);
  const dirty = useRef(false);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw || !active) return;
      const data: unknown = JSON.parse(raw);
      if (data && typeof data === 'object' && 'valuesVisible' in data && 'notificationsRead' in data &&
        typeof data.valuesVisible === 'boolean' && typeof data.notificationsRead === 'boolean') {
        setPreferences({ valuesVisible: data.valuesVisible, notificationsRead: data.notificationsRead });
      }
    }).catch(() => { if (active) setStorageError(true); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready || !dirty.current) return;
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)))
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, [preferences, ready]);

  return {
    ...preferences, ready, sheet, storageError,
    toggleValues: () => {
      dirty.current = true;
      setPreferences(value => ({ ...value, valuesVisible: !value.valuesVisible }));
    },
    openSheet: (next: Sheet) => {
      setSheet(next);
      if (next === 'notifications') {
        dirty.current = true;
        setPreferences(value => ({ ...value, notificationsRead: true }));
      }
    },
    closeSheet: () => setSheet(null),
  };
}

export type BankingController = ReturnType<typeof useBanking>;
