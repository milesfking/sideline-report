export const FIELD_VH = 300;
export const FIELD_PADDING = 0.08;
export const JITTER_X = 72;
export const JITTER_Y = 36;

/** Approximate marker footprint as % of field for de-overlap. */
const MIN_DX_PCT = 24;
const MIN_DY_PCT = 2.6;

/**
 * Sidelines sit at 8% / 92%. Markers are centered with translate(-50%) and
 * up to ~11rem wide (~28% of a 390px phone), so keep centers inset enough
 * that the plate stays in the field of play.
 */
const LEFT_MIN = 28;
const LEFT_MAX = 72;
const TOP_MIN = 6;
const TOP_MAX = 94;

/** FNV-1a 32-bit hash for stable jitter seeds. */
export function hash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function jitter(
  playerId: string,
  ampX = JITTER_X,
  ampY = JITTER_Y,
): { jx: number; jy: number } {
  const h = hash32(playerId);
  const jx = ((h & 0xffff) / 0xffff - 0.5) * 2 * ampX;
  const jy = (((h >>> 16) & 0xffff) / 0xffff - 0.5) * 2 * ampY;
  return { jx, jy };
}

function laneLeftPct(playerId: string): number {
  const lanes = 5;
  const lane = hash32(`${playerId}:lane`) % lanes;
  const t = (lane + 0.5) / lanes;
  return LEFT_MIN + t * (LEFT_MAX - LEFT_MIN);
}

/**
 * Place a player on the field.
 * fieldPos 0 = top (root for), 1 = bottom (root against).
 */
export function placePlayer(fieldPos: number, playerId: string): {
  leftPct: number;
  topPct: number;
} {
  const { jx, jy } = jitter(playerId);
  const usable = 1 - 2 * FIELD_PADDING;
  const yNorm = FIELD_PADDING + fieldPos * usable;
  const baseLeft = laneLeftPct(playerId);
  const leftPct = baseLeft + (jx / JITTER_X) * 8;
  const topPct = yNorm * 100 + (jy / JITTER_Y) * 1.5;
  return {
    leftPct: clamp(leftPct, LEFT_MIN, LEFT_MAX),
    topPct: clamp(topPct, TOP_MIN, TOP_MAX),
  };
}

export function placePlayers(
  players: Array<{ playerId: string; fieldPos: number }>,
): Map<string, { leftPct: number; topPct: number }> {
  const initial = players.map((p) => {
    const pos = placePlayer(p.fieldPos, p.playerId);
    return {
      playerId: p.playerId,
      fieldPos: p.fieldPos,
      leftPct: pos.leftPct,
      topPct: pos.topPct,
      anchorTop: pos.topPct,
    };
  });

  for (let iter = 0; iter < 10; iter++) {
    let moved = false;
    for (let i = 0; i < initial.length; i++) {
      for (let j = i + 1; j < initial.length; j++) {
        const a = initial[i];
        const b = initial[j];
        const dx = b.leftPct - a.leftPct;
        const dy = b.topPct - a.topPct;
        if (Math.abs(dx) >= MIN_DX_PCT || Math.abs(dy) >= MIN_DY_PCT) continue;

        const pushX = (MIN_DX_PCT - Math.abs(dx || 0.01)) / 2 + 0.4;
        const dir =
          dx !== 0
            ? Math.sign(dx)
            : hash32(a.playerId) % 2 === 0
              ? 1
              : -1;

        a.leftPct = clamp(a.leftPct - dir * pushX, LEFT_MIN, LEFT_MAX);
        b.leftPct = clamp(b.leftPct + dir * pushX, LEFT_MIN, LEFT_MAX);

        const dx2 = b.leftPct - a.leftPct;
        if (Math.abs(dx2) < MIN_DX_PCT * 0.55 && Math.abs(dy) < MIN_DY_PCT) {
          const pushY = (MIN_DY_PCT - Math.abs(dy || 0.01)) / 2 + 0.15;
          const yDir = a.fieldPos <= b.fieldPos ? -1 : 1;
          a.topPct = clamp(a.anchorTop + yDir * pushY, TOP_MIN, TOP_MAX);
          b.topPct = clamp(b.anchorTop - yDir * pushY, TOP_MIN, TOP_MAX);
        }
        moved = true;
      }
    }
    if (!moved) break;
  }

  return new Map(
    initial.map((p) => [
      p.playerId,
      {
        leftPct: clamp(p.leftPct, LEFT_MIN, LEFT_MAX),
        topPct: clamp(p.topPct, TOP_MIN, TOP_MAX),
      },
    ]),
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function formatKickoff(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}