"use client";

import { Wordmark } from "@/components/brand/Wordmark";
import { PixelButton } from "@/components/ui/PixelButton";
import { formatKickoff } from "@/lib/fieldMath";
import type { KickoffBatch } from "@/lib/schedule/batches";
import { BATCH_LABELS } from "@/lib/schedule/batches";

export type FieldViewMode = "batch" | "week";

type Props = {
  week: number;
  viewMode: FieldViewMode;
  onViewModeChange: (mode: FieldViewMode) => void;
  currentBatch: KickoffBatch | null;
  batchKickoffIso: string | null;
  onReset: () => void;
};

export function FieldChrome({
  week,
  viewMode,
  onViewModeChange,
  currentBatch,
  batchKickoffIso,
  onReset,
}: Props) {
  const localKickoff = formatKickoff(batchKickoffIso);
  const batchLabel =
    localKickoff !== "—"
      ? localKickoff
      : currentBatch
        ? BATCH_LABELS[currentBatch]
        : "—";

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,var(--safe-top))]">
      <div className="pointer-events-auto rounded-none border-[2px] border-[var(--pixel-border)] bg-[rgba(247,243,232,0.88)] px-2 py-1">
        <Wordmark size="sm" />
        <p className="mt-1 font-[family-name:var(--font-plex-mono)] text-[11px] text-[var(--ink-muted)]">
          WEEK {week}
        </p>
      </div>

      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <PixelButton variant="ghost" className="text-xs" onClick={onReset}>
          RESET
        </PixelButton>
        <div className="flex border-[2px] border-[var(--pixel-border)] bg-[rgba(247,243,232,0.92)] p-0.5 shadow-[2px_2px_0_var(--pixel-shadow)]">
          <button
            type="button"
            className={[
              "min-h-9 px-2 font-[family-name:var(--font-silkscreen)] text-[10px] uppercase",
              viewMode === "batch"
                ? "bg-[var(--accent)] text-[var(--cream)]"
                : "bg-transparent text-[var(--ink)]",
            ].join(" ")}
            onClick={() => onViewModeChange("batch")}
            aria-pressed={viewMode === "batch"}
          >
            {batchLabel}
          </button>
          <button
            type="button"
            className={[
              "min-h-9 px-2 font-[family-name:var(--font-silkscreen)] text-[10px] uppercase",
              viewMode === "week"
                ? "bg-[var(--accent)] text-[var(--cream)]"
                : "bg-transparent text-[var(--ink)]",
            ].join(" ")}
            onClick={() => onViewModeChange("week")}
            aria-pressed={viewMode === "week"}
          >
            WEEK
          </button>
        </div>
      </div>
    </header>
  );
}