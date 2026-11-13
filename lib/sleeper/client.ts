import { promises as fs } from "fs";
import path from "path";
import { getCached, getOrSetCached, setCached, TTL } from "@/lib/cache";
import type {
  SleeperLeague,
  SleeperMatchup,
  SleeperNflState,
  SleeperPlayersMap,
  SleeperRoster,
  SleeperUser,
} from "@/lib/types";

const BASE = "https://api.sleeper.app/v1";
const PLAYERS_CACHE_PATH = path.join(process.cwd(), ".cache", "players-nfl.json");

async function sleeperGet<T>(pathname: string): Promise<T> {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sleeper ${pathname} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function getUser(username: string): Promise<SleeperUser | null> {
  const res = await fetch(`${BASE}/user/${encodeURIComponent(username)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Sleeper user lookup failed (${res.status})`);
  }
  const data = (await res.json()) as SleeperUser | null;
  return data?.user_id ? data : null;
}

export async function getNflState(): Promise<SleeperNflState> {
  return getOrSetCached("sleeper:nfl-state", TTL.nflState, () =>
    sleeperGet<SleeperNflState>("/state/nfl"),
  );
}

export async function getUserLeagues(
  userId: string,
  season: string,
): Promise<SleeperLeague[]> {
  return sleeperGet<SleeperLeague[]>(`/user/${userId}/leagues/nfl/${season}`);
}

export async function getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
  return sleeperGet<SleeperRoster[]>(`/league/${leagueId}/rosters`);
}

export async function getLeagueMatchups(
  leagueId: string,
  week: number,
): Promise<SleeperMatchup[]> {
  return sleeperGet<SleeperMatchup[]>(`/league/${leagueId}/matchups/${week}`);
}

async function readPlayersFromDisk(): Promise<SleeperPlayersMap | null> {
  try {
    const raw = await fs.readFile(PLAYERS_CACHE_PATH, "utf8");
    return JSON.parse(raw) as SleeperPlayersMap;
  } catch {
    return null;
  }
}

async function writePlayersToDisk(players: SleeperPlayersMap): Promise<void> {
  try {
    await fs.mkdir(path.dirname(PLAYERS_CACHE_PATH), { recursive: true });
    await fs.writeFile(PLAYERS_CACHE_PATH, JSON.stringify(players));
  } catch {
    // Disk cache is best-effort.
  }
}

export async function getPlayersMap(): Promise<SleeperPlayersMap> {
  const mem = getCached<SleeperPlayersMap>("sleeper:players");
  if (mem) return mem;

  const disk = await readPlayersFromDisk();
  if (disk) {
    return setCached("sleeper:players", disk, TTL.players);
  }

  const players = await sleeperGet<SleeperPlayersMap>("/players/nfl");
  await writePlayersToDisk(players);
  return setCached("sleeper:players", players, TTL.players);
}