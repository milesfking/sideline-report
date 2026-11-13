export type LeagueCare = "careALot" | "careALittle" | "couldntCareLess";

export const LEAGUE_CARE_OPTIONS: { value: LeagueCare; label: string }[] = [
  { value: "careALot", label: "CARE A LOT" },
  { value: "careALittle", label: "CARE A LITTLE" },
  { value: "couldntCareLess", label: "COULDN'T CARE LESS" },
];

export interface ReportPlayerLeague {
  leagueId: string;
  leagueName: string;
  care: LeagueCare;
  ownedByUser: number;
  ownedByOpponents: number;
}

export interface ReportPlayer {
  playerId: string;
  name: string;
  nflTeam: string | null;
  position: string | null;
  onSlate: boolean;
  kickoffIso: string | null;
  /** ESPN-derived game phase for this player's NFL team. */
  gameStatus: "pre" | "in" | "post" | null;
  isLive: boolean;
  leagues: ReportPlayerLeague[];
}

export interface LeagueContext {
  leagueId: string;
  name: string;
  care: LeagueCare;
  record: { wins: number; losses: number; ties: number };
  matchup: {
    userPoints: number;
    opponentPoints: number;
    opponentRosterId: number | null;
  } | null;
}

export interface ScheduleGame {
  home: string;
  away: string;
  kickoffIso: string;
  status: string;
  /** ESPN status.type.state when available: pre | in | post */
  statusState: "pre" | "in" | "post" | null;
}

export interface ReportResponse {
  user: { userId: string; username: string; displayName: string };
  season: string;
  week: number;
  leagues: LeagueContext[];
  players: ReportPlayer[];
  games: ScheduleGame[];
}

export interface LeagueSummary {
  leagueId: string;
  name: string;
  avatar: string | null;
}

export interface LeaguesResponse {
  user: { userId: string; username: string; displayName: string };
  season: string;
  week: number;
  leagues: LeagueSummary[];
}

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar?: string;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  avatar: string | null;
  status: string;
  season: string;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
  players: string[] | null;
  starters?: string[] | null;
  settings: {
    wins?: number;
    losses?: number;
    ties?: number;
    fpts?: number;
    fpts_decimal?: number;
  };
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number | null;
  points: number | null;
  starters?: string[] | null;
  players?: string[] | null;
}

export interface SleeperPlayer {
  player_id?: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  team?: string | null;
  position?: string | null;
  fantasy_positions?: string[] | null;
  status?: string | null;
  active?: boolean | null;
}

export type SleeperPlayersMap = Record<string, SleeperPlayer>;

export interface SleeperNflState {
  week: number;
  season: string;
  season_type: string;
  display_week?: number;
  league_season?: string;
}