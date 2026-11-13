"use client";

import type { RootingResultRow } from "@/lib/rooting/score";

type Props = {
  player: RootingResultRow;
  leftPct: number;
  topPct: number;
  delayMs: number;
  onSelect: () => void;
};

export function PlayerMarker({
  player,
  leftPct,
  topPct,
  delayMs,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "player-marker absolute z-[2] min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 animate-marker-drop",
        player.isLive ? "is-live" : "",
      ].join(" ")}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        animationDelay: `${delayMs}ms`,
      }}
      aria-label={`${player.displayName}, ${player.nflTeam ?? "FA"}${player.isLive ? ", live" : ""}`}
    >
      <span
        className={[
          "marker-plate block max-w-[11rem] border-[2px] bg-[var(--ink)] px-2 py-1 text-left text-[var(--cream)] shadow-[2px_2px_0_rgba(0,0,0,0.35)]",
          player.isLive
            ? "border-[var(--live-gold)] ring-2 ring-[var(--live-gold)]"
            : "border-[var(--pixel-border)]",
        ].join(" ")}
      >
        <span className="block font-[family-name:var(--font-plex-mono)] text-[12px] font-semibold leading-tight">
          {player.displayName}
        </span>
        <span className="mt-0.5 block font-[family-name:var(--font-silkscreen)] text-[10px] opacity-80">
          {player.nflTeam ?? "FA"}
          {player.position ? ` · ${player.position}` : ""}
          {player.isLive ? " · LIVE" : ""}
        </span>
      </span>
    </button>
  );
}