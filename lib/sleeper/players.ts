import type { SleeperPlayer, SleeperPlayersMap } from "@/lib/types";

const TEAM_NAMES: Record<string, string> = {
  ARI: "Arizona",
  ATL: "Atlanta",
  BAL: "Baltimore",
  BUF: "Buffalo",
  CAR: "Carolina",
  CHI: "Chicago",
  CIN: "Cincinnati",
  CLE: "Cleveland",
  DAL: "Dallas",
  DEN: "Denver",
  DET: "Detroit",
  GB: "Green Bay",
  HOU: "Houston",
  IND: "Indianapolis",
  JAC: "Jacksonville",
  JAX: "Jacksonville",
  KC: "Kansas City",
  LA: "Los Angeles",
  LAC: "LA Chargers",
  LAR: "LA Rams",
  LV: "Las Vegas",
  MIA: "Miami",
  MIN: "Minnesota",
  NE: "New England",
  NO: "New Orleans",
  NYG: "NY Giants",
  NYJ: "NY Jets",
  PHI: "Philadelphia",
  PIT: "Pittsburgh",
  SEA: "Seattle",
  SF: "San Francisco",
  TB: "Tampa Bay",
  TEN: "Tennessee",
  WAS: "Washington",
  WSH: "Washington",
};

export function resolvePlayerDisplay(
  playerId: string,
  players: SleeperPlayersMap,
): { name: string; nflTeam: string | null; position: string | null } {
  const player = players[playerId];
  if (!player) {
    if (TEAM_NAMES[playerId]) {
      return {
        name: `${TEAM_NAMES[playerId]} DEF`,
        nflTeam: playerId === "JAX" ? "JAC" : playerId === "WSH" ? "WAS" : playerId === "LAR" ? "LA" : playerId,
        position: "DEF",
      };
    }
    return { name: playerId, nflTeam: null, position: null };
  }

  return {
    name: playerDisplayName(playerId, player),
    nflTeam: normalizeNflTeam(player.team ?? (isTeamId(playerId) ? playerId : null)),
    position: player.position ?? player.fantasy_positions?.[0] ?? null,
  };
}

function playerDisplayName(playerId: string, player: SleeperPlayer): string {
  if (player.full_name) return player.full_name;
  const composed = [player.first_name, player.last_name].filter(Boolean).join(" ");
  if (composed) return composed;
  if (player.position === "DEF" || player.fantasy_positions?.includes("DEF")) {
    const team = player.team ?? playerId;
    return `${TEAM_NAMES[team] ?? team} DEF`;
  }
  return playerId;
}

function isTeamId(id: string): boolean {
  return Boolean(TEAM_NAMES[id]);
}

function normalizeNflTeam(team: string | null): string | null {
  if (!team) return null;
  if (team === "JAX") return "JAC";
  if (team === "WSH") return "WAS";
  if (team === "LAR") return "LA";
  return team;
}