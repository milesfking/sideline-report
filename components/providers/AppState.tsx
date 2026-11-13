"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  clearState,
  loadState,
  saveState,
  type PersistedState,
} from "@/lib/storage";
import type { LeagueCare, LeagueSummary } from "@/lib/types";
import type { RootingResultRow } from "@/lib/rooting/score";
import type { ReportResponse } from "@/lib/types";

export type RankedReport = ReportResponse & { ranked: RootingResultRow[] };

interface AppStateValue {
  hydrated: boolean;
  username: string;
  displayName: string;
  season: string;
  week: number;
  leagues: LeagueSummary[];
  care: Record<string, LeagueCare>;
  report: RankedReport | null;
  setLeaguesSession: (data: {
    username: string;
    displayName: string;
    season: string;
    week: number;
    leagues: LeagueSummary[];
  }) => void;
  setCare: (leagueId: string, value: LeagueCare) => void;
  setAllCareDefault: (value?: LeagueCare) => void;
  careComplete: boolean;
  setReport: (report: RankedReport | null) => void;
  reset: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const emptyPersisted: PersistedState = {
  username: "",
  displayName: "",
  season: "",
  week: 0,
  leagues: [],
  care: {},
};

let memoryState: PersistedState = emptyPersisted;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let bootstrapped = false;

function ensureBootstrapped() {
  if (typeof window === "undefined" || bootstrapped) return;
  const saved = loadState();
  if (saved) memoryState = saved;
  bootstrapped = true;
}

function getClientSnapshot(): PersistedState {
  ensureBootstrapped();
  return memoryState;
}

function getServerSnapshot(): PersistedState {
  return emptyPersisted;
}

function writePersisted(next: PersistedState) {
  memoryState = next;
  bootstrapped = true;
  if (next.username) {
    saveState(next);
  } else {
    clearState();
  }
  emit();
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const persisted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [report, setReport] = useState<RankedReport | null>(null);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const setLeaguesSession = useCallback(
    (data: {
      username: string;
      displayName: string;
      season: string;
      week: number;
      leagues: LeagueSummary[];
    }) => {
      const care: Record<string, LeagueCare> = {};
      for (const league of data.leagues) {
        care[league.leagueId] =
          memoryState.care[league.leagueId] ?? "careALittle";
      }
      writePersisted({
        username: data.username,
        displayName: data.displayName,
        season: data.season,
        week: data.week,
        leagues: data.leagues,
        care,
      });
      setReport(null);
    },
    [],
  );

  const setCare = useCallback((leagueId: string, value: LeagueCare) => {
    writePersisted({
      ...memoryState,
      care: { ...memoryState.care, [leagueId]: value },
    });
  }, []);

  const setAllCareDefault = useCallback(
    (value: LeagueCare = "careALittle") => {
      const care = { ...memoryState.care };
      for (const league of memoryState.leagues) {
        if (!care[league.leagueId]) care[league.leagueId] = value;
      }
      writePersisted({ ...memoryState, care });
    },
    [],
  );

  const careComplete = useMemo(
    () =>
      persisted.leagues.length > 0 &&
      persisted.leagues.every((league) => Boolean(persisted.care[league.leagueId])),
    [persisted.leagues, persisted.care],
  );

  const reset = useCallback(() => {
    writePersisted(emptyPersisted);
    setReport(null);
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      username: persisted.username,
      displayName: persisted.displayName,
      season: persisted.season,
      week: persisted.week,
      leagues: persisted.leagues,
      care: persisted.care,
      report,
      setLeaguesSession,
      setCare,
      setAllCareDefault,
      careComplete,
      setReport,
      reset,
    }),
    [
      hydrated,
      persisted,
      report,
      setLeaguesSession,
      setCare,
      setAllCareDefault,
      careComplete,
      reset,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}