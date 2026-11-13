import type { LeagueCare, ReportPlayer } from "@/lib/types";

export type SameLeagueConflict = "netWithBias" | "cancelToZero" | "preferOwn";

export interface RootingConfig {
  careWeights: Record<LeagueCare, number>;
  ownWeight: number;
  oppWeight: number;
  tiebreakOwnBias: number;
  excludeOffSlate: boolean;
  sameLeagueConflict: SameLeagueConflict;
}

export const DEFAULT_ROOTING_CONFIG: RootingConfig = {
  careWeights: {
    careALot: 1.0,
    careALittle: 0.45,
    couldntCareLess: 0.15,
  },
  ownWeight: 1.0,
  oppWeight: 0.92,
  tiebreakOwnBias: 0,
  excludeOffSlate: true,
  sameLeagueConflict: "netWithBias",
};

export interface RootingResultRow {
  playerId: string;
  displayName: string;
  nflTeam: string | null;
  position: string | null;
  kickoffIso: string | null;
  gameStatus: "pre" | "in" | "post" | null;
  isLive: boolean;
  score: number;
  rank: number;
  fieldPos: number;
  ownCount: number;
  opponentCount: number;
  leagues: ReportPlayer["leagues"];
}

function mergeConfig(partial?: Partial<RootingConfig>): RootingConfig {
  const base = DEFAULT_ROOTING_CONFIG;
  const careWeights = {
    ...base.careWeights,
    ...(partial?.careWeights ?? {}),
  };
  for (const value of Object.values(careWeights)) {
    if (!(value > 0)) {
      throw new Error("Care weights must be > 0");
    }
  }
  return {
    ...base,
    ...partial,
    careWeights,
  };
}

export function scorePlayerRooting(
  player: ReportPlayer,
  config: RootingConfig = DEFAULT_ROOTING_CONFIG,
): number {
  let score = 0;
  let totalOwn = 0;

  for (const row of player.leagues) {
    let o = row.ownedByUser;
    let x = row.ownedByOpponents;
    if (o > 0 && x > 0) {
      if (config.sameLeagueConflict === "cancelToZero") {
        o = 0;
        x = 0;
      } else if (config.sameLeagueConflict === "preferOwn") {
        x = 0;
      }
    }
    totalOwn += o;
    const w = config.careWeights[row.care];
    score += w * (o * config.ownWeight - x * config.oppWeight);
  }

  if (totalOwn > 0) {
    score += config.tiebreakOwnBias;
  }

  return score;
}

export function orderPlayersForRooting(
  players: ReportPlayer[],
  partialConfig?: Partial<RootingConfig>,
): RootingResultRow[] {
  const config = mergeConfig(partialConfig);
  const filtered = config.excludeOffSlate
    ? players.filter((p) => p.onSlate)
    : players;

  const scored = filtered.map((player) => ({
    player,
    score: scorePlayerRooting(player, config),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.player.playerId.localeCompare(b.player.playerId);
  });

  const n = scored.length;
  return scored.map(({ player, score }, index) => {
    const ownCount = player.leagues.reduce((sum, l) => sum + l.ownedByUser, 0);
    const opponentCount = player.leagues.reduce(
      (sum, l) => sum + l.ownedByOpponents,
      0,
    );
    return {
      playerId: player.playerId,
      displayName: player.name,
      nflTeam: player.nflTeam,
      position: player.position,
      kickoffIso: player.kickoffIso,
      gameStatus: player.gameStatus,
      isLive: player.isLive,
      score,
      rank: index,
      fieldPos: n <= 1 ? 0.5 : index / (n - 1),
      ownCount,
      opponentCount,
      leagues: player.leagues,
    };
  });
}