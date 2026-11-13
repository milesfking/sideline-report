import { getOrSetCached, TTL } from "@/lib/cache";
import { normalizeGameStatus } from "@/lib/schedule/batches";
import type { ScheduleGame } from "@/lib/types";

/** Map common ESPN abbreviations onto Sleeper/NFL abbreviations. */
const ESPN_TO_SLEEPER: Record<string, string> = {
  WSH: "WAS",
  LAR: "LA",
  JAX: "JAC",
};

function normalizeTeam(abbr: string): string {
  const upper = abbr.toUpperCase();
  return ESPN_TO_SLEEPER[upper] ?? upper;
}

interface EspnCompetitor {
  homeAway?: string;
  team?: { abbreviation?: string };
}

interface EspnEvent {
  date?: string;
  status?: { type?: { name?: string; state?: string; completed?: boolean } };
  competitions?: Array<{
    competitors?: EspnCompetitor[];
    status?: { type?: { name?: string; state?: string; completed?: boolean } };
  }>;
}

interface EspnScoreboard {
  events?: EspnEvent[];
}

export async function getWeekSchedule(
  season: string,
  week: number,
): Promise<ScheduleGame[]> {
  return getOrSetCached(`espn:schedule:${season}:${week}:v2`, TTL.schedule, async () => {
    const url = new URL(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    );
    url.searchParams.set("week", String(week));
    url.searchParams.set("seasontype", "2");
    url.searchParams.set("dates", season);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      throw new Error(`ESPN schedule failed (${res.status})`);
    }
    const data = (await res.json()) as EspnScoreboard;
    const games: ScheduleGame[] = [];

    for (const event of data.events ?? []) {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors ?? [];
      const home = competitors.find((c) => c.homeAway === "home");
      const away = competitors.find((c) => c.homeAway === "away");
      const homeAbbr = home?.team?.abbreviation;
      const awayAbbr = away?.team?.abbreviation;
      if (!homeAbbr || !awayAbbr || !event.date) continue;

      const statusName =
        competition?.status?.type?.name ??
        event.status?.type?.name ??
        event.status?.type?.state ??
        "scheduled";
      const rawState =
        competition?.status?.type?.state ?? event.status?.type?.state ?? null;
      const statusState = normalizeGameStatus(statusName, rawState);

      games.push({
        home: normalizeTeam(homeAbbr),
        away: normalizeTeam(awayAbbr),
        kickoffIso: event.date,
        status: statusName,
        statusState,
      });
    }

    return games;
  });
}

export function buildTeamKickoffMap(
  games: ScheduleGame[],
): Map<
  string,
  { kickoffIso: string; status: string; statusState: "pre" | "in" | "post" | null }
> {
  const map = new Map<
    string,
    { kickoffIso: string; status: string; statusState: "pre" | "in" | "post" | null }
  >();
  for (const game of games) {
    const info = {
      kickoffIso: game.kickoffIso,
      status: game.status,
      statusState: game.statusState,
    };
    map.set(game.home, info);
    map.set(game.away, info);
  }
  return map;
}