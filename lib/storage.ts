import type { LeagueCare, LeagueSummary } from "@/lib/types";

export const STORAGE_KEY = "sideline-report-v1";

export interface PersistedState {
  username: string;
  displayName: string;
  season: string;
  week: number;
  leagues: LeagueSummary[];
  care: Record<string, LeagueCare>;
}

export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}