"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FieldChrome,
  type FieldViewMode,
} from "@/components/field/FieldChrome";
import { FieldSurface } from "@/components/field/FieldSurface";
import { PlayerMarker } from "@/components/field/PlayerMarker";
import { useAppState } from "@/components/providers/AppState";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelSheet } from "@/components/ui/PixelSheet";
import { formatKickoff, placePlayers } from "@/lib/fieldMath";
import {
  getCurrentKickoffBatch,
  kickoffInBatch,
} from "@/lib/schedule/batches";
import type { RootingResultRow } from "@/lib/rooting/score";

export function FieldScroller() {
  const router = useRouter();
  const { report, week, reset, hydrated, username } = useAppState();
  const scrollerRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<RootingResultRow | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [viewMode, setViewMode] = useState<FieldViewMode>("batch");

  const currentBatch = useMemo(() => {
    if (!report?.games?.length) return null;
    return getCurrentKickoffBatch(report.games);
  }, [report]);

  // Place the full week set once so batch/week toggle keeps identical jitter.
  const weekCoords = useMemo(() => {
    if (!report?.ranked?.length) return new Map<string, { leftPct: number; topPct: number }>();
    return placePlayers(
      report.ranked.map((p) => ({
        playerId: p.playerId,
        fieldPos: p.fieldPos,
      })),
    );
  }, [report]);

  const placements = useMemo(() => {
    if (!report?.ranked) return [];
    const visible =
      viewMode === "week"
        ? report.ranked
        : report.ranked.filter((p) =>
            kickoffInBatch(p.kickoffIso, currentBatch),
          );

    return visible.map((player, index) => {
      const pos = weekCoords.get(player.playerId) ?? {
        leftPct: 50,
        topPct: 50,
      };
      return {
        player,
        ...pos,
        delayMs: Math.min(index * 18, 420),
      };
    });
  }, [report, viewMode, currentBatch, weekCoords]);

  useEffect(() => {
    if (!hydrated) return;
    if (!username) {
      router.replace("/enter");
      return;
    }
    if (!report) {
      router.replace("/care");
    }
  }, [hydrated, username, report, router]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !report) return;
    const mid = el.scrollHeight / 2 - el.clientHeight / 2;
    el.scrollTop = Math.max(0, mid);
  }, [report]);

  if (!report) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--turf-mid)] font-[family-name:var(--font-silkscreen)] text-[var(--cream)]">
        LOADING FIELD…
      </div>
    );
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-[var(--turf-deep)]">
      <FieldChrome
        week={week || report.week}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentBatch={currentBatch}
        onReset={() => setConfirmReset(true)}
      />

      <section
        ref={scrollerRef}
        className="field-scroller h-dvh overflow-x-hidden overflow-y-auto"
      >
        <div
          className="field-surface relative w-full overflow-hidden"
          style={{ height: "300dvh" }}
        >
          <FieldSurface />
          {placements.map(({ player, leftPct, topPct, delayMs }) => (
            <PlayerMarker
              key={player.playerId}
              player={player}
              leftPct={leftPct}
              topPct={topPct}
              delayMs={delayMs}
              onSelect={() => setActive(player)}
            />
          ))}
        </div>
      </section>

      <PixelSheet
        open={Boolean(active)}
        title={active?.displayName ?? ""}
        onClose={() => setActive(null)}
      >
        {active ? (
          <div className="space-y-2">
            <p>
              {active.nflTeam ?? "FA"}
              {active.position ? ` · ${active.position}` : ""}
              {active.isLive ? " · LIVE" : ""}
            </p>
            <p>Kickoff: {formatKickoff(active.kickoffIso)}</p>
            <p>
              Own {active.ownCount} · Opp {active.opponentCount}
            </p>
            <p>Score {active.score.toFixed(2)}</p>
            <ul className="mt-2 space-y-1 border-t border-[var(--ink)]/20 pt-2 text-xs">
              {active.leagues.map((league) => (
                <li key={league.leagueId}>
                  {league.leagueName}:{" "}
                  {league.ownedByUser ? "YOU" : ""}
                  {league.ownedByUser && league.ownedByOpponents ? " / " : ""}
                  {league.ownedByOpponents ? "OPP" : ""}
                  {!league.ownedByUser && !league.ownedByOpponents ? "—" : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </PixelSheet>

      <PixelSheet
        open={confirmReset}
        title="RESET?"
        onClose={() => setConfirmReset(false)}
        actions={
          <>
            <PixelButton variant="ghost" onClick={() => setConfirmReset(false)}>
              CANCEL
            </PixelButton>
            <PixelButton
              variant="danger"
              onClick={() => {
                reset();
                setConfirmReset(false);
                router.push("/enter");
              }}
            >
              RESET
            </PixelButton>
          </>
        }
      >
        Clears username and league settings.
      </PixelSheet>
    </div>
  );
}