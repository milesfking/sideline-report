"use client";

import { LEAGUE_CARE_OPTIONS, type LeagueCare } from "@/lib/types";

type Props = {
  value: LeagueCare | undefined;
  onChange: (value: LeagueCare) => void;
};

export function CareToggle({ value, onChange }: Props) {
  return (
    <div className="grid gap-2">
      {LEAGUE_CARE_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "pixel-btn min-h-11 px-3 py-2 text-left font-[family-name:var(--font-silkscreen)] text-xs uppercase sm:text-sm",
              selected
                ? "bg-[var(--accent)] text-[var(--cream)] pressed"
                : "bg-[var(--cream)] text-[var(--ink)]",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}