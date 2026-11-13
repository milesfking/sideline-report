import type { ScheduleGame } from "@/lib/types";

export type KickoffBatch = "thu" | "sun1" | "sun4" | "snf" | "mnf" | "other";

/** Fallback when no kickoff ISO is available; prefer formatKickoff locally. */
export const BATCH_LABELS: Record<KickoffBatch, string> = {
  thu: "THU",
  sun1: "SUN",
  sun4: "SUN",
  snf: "SNF",
  mnf: "MNF",
  other: "OTHER",
};

const BATCH_ORDER: KickoffBatch[] = ["thu", "sun1", "sun4", "snf", "mnf", "other"];

/** Convert ISO kickoff to Eastern Time parts. */
export function toEasternParts(iso: string): {
  weekday: number; // 0=Sun … 6=Sat
  hour: number;
  minute: number;
} {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(d);

  const weekdayName = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    weekday: weekdayMap[weekdayName] ?? d.getUTCDay(),
    hour: hour === 24 ? 0 : hour,
    minute,
  };
}

export function classifyKickoffBatch(iso: string): KickoffBatch {
  const { weekday, hour, minute } = toEasternParts(iso);
  const mins = hour * 60 + minute;

  if (weekday === 4) return "thu"; // Thursday
  if (weekday === 1) return "mnf"; // Monday
  if (weekday === 0) {
    // Sunday windows: 1pm (~13:00), 4pm (~16:00–16:30), night (~20:00+)
    if (mins < 15 * 60) return "sun1";
    if (mins < 19 * 60) return "sun4";
    return "snf";
  }
  return "other";
}

export function normalizeGameStatus(
  status: string | null | undefined,
  statusState?: string | null,
): "pre" | "in" | "post" {
  const state = (statusState ?? "").toLowerCase();
  if (state === "in" || state === "halftime") return "in";
  if (state === "post") return "post";
  if (state === "pre") return "pre";

  const name = (status ?? "").toUpperCase();
  if (
    name.includes("IN_PROGRESS") ||
    name.includes("HALFTIME") ||
    name === "STATUS_IN_PROGRESS" ||
    name === "STATUS_HALFTIME"
  ) {
    return "in";
  }
  if (
    name.includes("FINAL") ||
    name.includes("STATUS_FINAL") ||
    name === "STATUS_END_PERIOD"
  ) {
    // END_PERIOD alone isn't final — treat only clear finals as post
    if (name.includes("FINAL") || name === "STATUS_FINAL") return "post";
  }
  if (name.includes("FINAL")) return "post";
  return "pre";
}

export function getCurrentKickoffBatch(
  games: ScheduleGame[],
  now = new Date(),
): KickoffBatch | null {
  if (!games.length) return null;

  const byBatch = new Map<KickoffBatch, ScheduleGame[]>();
  for (const game of games) {
    const batch = classifyKickoffBatch(game.kickoffIso);
    const list = byBatch.get(batch) ?? [];
    list.push(game);
    byBatch.set(batch, list);
  }

  // Prefer a batch that is currently live.
  for (const batch of BATCH_ORDER) {
    const list = byBatch.get(batch);
    if (!list) continue;
    if (list.some((g) => normalizeGameStatus(g.status, g.statusState) === "in")) {
      return batch;
    }
  }

  // Else next batch that still has a game not finished and kickoff <= now+grace or upcoming.
  for (const batch of BATCH_ORDER) {
    const list = byBatch.get(batch);
    if (!list) continue;
    const unfinished = list.filter(
      (g) => normalizeGameStatus(g.status, g.statusState) !== "post",
    );
    if (!unfinished.length) continue;
    return batch;
  }

  // Everything final — fall back to the latest batch that exists.
  for (let i = BATCH_ORDER.length - 1; i >= 0; i--) {
    if (byBatch.has(BATCH_ORDER[i])) return BATCH_ORDER[i];
  }

  // Deterministic unused fallback (keeps `now` referenced for API symmetry).
  void now;
  return "other";
}

export function kickoffInBatch(iso: string | null, batch: KickoffBatch | null): boolean {
  if (!iso || !batch) return false;
  return classifyKickoffBatch(iso) === batch;
}

/** Earliest kickoff in a batch — used to label the slate tab in local time. */
export function batchRepresentativeKickoff(
  games: ScheduleGame[],
  batch: KickoffBatch | null,
): string | null {
  if (!batch || !games.length) return null;
  const times = games
    .filter((g) => classifyKickoffBatch(g.kickoffIso) === batch)
    .map((g) => g.kickoffIso)
    .filter(Boolean)
    .sort();
  return times[0] ?? null;
}