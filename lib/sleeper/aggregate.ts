import { getOrSetCached, TTL } from "@/lib/cache";
import { buildTeamKickoffMap, getWeekSchedule } from "@/lib/schedule/espn";
import {
  getLeagueMatchups,
  getLeagueRosters,
  getNflState,
  getPlayersMap,
  getUser,
  getUserLeagues,
} from "@/lib/sleeper/client";
import { resolvePlayerDisplay } from "@/lib/sleeper/players";
import type {
  LeagueCare,
  LeagueContext,
  LeaguesResponse,
  ReportPlayer,
  ReportResponse,
  SleeperMatchup,
  SleeperRoster,
} from "@/lib/types";

export async function fetchLeaguesForUsername(
  username: string,
): Promise<LeaguesResponse> {
  const user = await getUser(username.trim());
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  const state = await getNflState();
  const season = state.league_season ?? state.season;
  const week = state.display_week ?? state.week;
  const leagues = await getUserLeagues(user.user_id, season);

  return {
    user: {
      userId: user.user_id,
      username: user.username,
      displayName: user.display_name,
    },
    season,
    week,
    leagues: leagues.map((l) => ({
      leagueId: l.league_id,
      name: l.name,
      avatar: l.avatar,
    })),
  };
}

export async function buildReport(
  username: string,
  care: Record<string, LeagueCare>,
): Promise<ReportResponse> {
  const careKey = Object.keys(care)
    .sort()
    .map((id) => `${id}:${care[id]}`)
    .join("|");
  const cacheKey = `report:v2-starters:${username.trim().toLowerCase()}:${careKey}`;

  return getOrSetCached(cacheKey, TTL.report, () =>
    buildReportUncached(username, care),
  );
}

async function buildReportUncached(
  username: string,
  care: Record<string, LeagueCare>,
): Promise<ReportResponse> {
  const leaguesPayload = await fetchLeaguesForUsername(username);
  const { user, season, week, leagues: leagueSummaries } = leaguesPayload;

  const [playersMap, games] = await Promise.all([
    getPlayersMap(),
    getWeekSchedule(season, week),
  ]);
  const kickoffByTeam = buildTeamKickoffMap(games);

  const leagueData = await Promise.all(
    leagueSummaries.map(async (summary) => {
      const [rosters, matchups] = await Promise.all([
        getLeagueRosters(summary.leagueId),
        getLeagueMatchups(summary.leagueId, week),
      ]);
      return { summary, rosters, matchups };
    }),
  );

  const leagueContexts: LeagueContext[] = [];
  const ownership = new Map<
    string,
    {
      playerId: string;
      leagues: ReportPlayer["leagues"];
    }
  >();

  for (const { summary, rosters, matchups } of leagueData) {
    const leagueCare = care[summary.leagueId] ?? "careALittle";
    const userRoster = rosters.find((r) => r.owner_id === user.userId) ?? null;
    const userMatchup = userRoster
      ? matchups.find((m) => m.roster_id === userRoster.roster_id) ?? null
      : null;
    const opponent = findOpponent(userRoster, userMatchup, rosters, matchups);

    leagueContexts.push({
      leagueId: summary.leagueId,
      name: summary.name,
      care: leagueCare,
      record: {
        wins: userRoster?.settings?.wins ?? 0,
        losses: userRoster?.settings?.losses ?? 0,
        ties: userRoster?.settings?.ties ?? 0,
      },
      matchup: userMatchup
        ? {
            userPoints: userMatchup.points ?? 0,
            opponentPoints: opponent.matchup?.points ?? 0,
            opponentRosterId: opponent.roster?.roster_id ?? null,
          }
        : null,
    });

    // Only starting lineups count toward rooting / field presence.
    const ownIds = starterIdSet(userMatchup, userRoster);
    const oppIds = starterIdSet(opponent.matchup, opponent.roster);
    const allIds = new Set([...ownIds, ...oppIds]);

    for (const playerId of allIds) {
      let entry = ownership.get(playerId);
      if (!entry) {
        entry = { playerId, leagues: [] };
        ownership.set(playerId, entry);
      }
      entry.leagues.push({
        leagueId: summary.leagueId,
        leagueName: summary.name,
        care: leagueCare,
        ownedByUser: ownIds.has(playerId) ? 1 : 0,
        ownedByOpponents: oppIds.has(playerId) ? 1 : 0,
      });
    }
  }

  const players: ReportPlayer[] = [...ownership.values()].map((entry) => {
    const display = resolvePlayerDisplay(entry.playerId, playersMap);
    const team = display.nflTeam;
    const slate = team ? kickoffByTeam.get(team) : undefined;
    const gameStatus = slate?.statusState ?? null;
    return {
      playerId: entry.playerId,
      name: display.name,
      nflTeam: display.nflTeam,
      position: display.position,
      onSlate: Boolean(slate),
      kickoffIso: slate?.kickoffIso ?? null,
      gameStatus,
      isLive: gameStatus === "in",
      leagues: entry.leagues,
    };
  });

  players.sort((a, b) => a.name.localeCompare(b.name));

  return {
    user,
    season,
    week,
    leagues: leagueContexts,
    players,
    games,
  };
}

function findOpponent(
  userRoster: SleeperRoster | null,
  userMatchup: SleeperMatchup | null,
  rosters: SleeperRoster[],
  matchups: SleeperMatchup[],
): { roster: SleeperRoster | null; matchup: SleeperMatchup | null } {
  if (!userRoster || !userMatchup || userMatchup.matchup_id == null) {
    return { roster: null, matchup: null };
  }

  const oppMatchup =
    matchups.find(
      (m) =>
        m.matchup_id === userMatchup.matchup_id &&
        m.roster_id !== userRoster.roster_id,
    ) ?? null;

  if (!oppMatchup) return { roster: null, matchup: null };

  const oppRoster =
    rosters.find((r) => r.roster_id === oppMatchup.roster_id) ?? null;

  return { roster: oppRoster, matchup: oppMatchup };
}

/** Prefer weekly matchup starters; fall back to roster starters. Skip empty slots. */
function starterIdSet(
  matchup: SleeperMatchup | null,
  roster: SleeperRoster | null,
): Set<string> {
  const raw = matchup?.starters ?? roster?.starters ?? [];
  return new Set(
    raw.filter((id): id is string => typeof id === "string" && id.length > 0 && id !== "0"),
  );
}