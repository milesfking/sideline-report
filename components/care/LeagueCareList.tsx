"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CareToggle } from "@/components/care/CareToggle";
import { useAppState } from "@/components/providers/AppState";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelSheet } from "@/components/ui/PixelSheet";

export function LeagueCareList() {
  const router = useRouter();
  const {
    leagues,
    care,
    setCare,
    careComplete,
    username,
    setReport,
    reset,
  } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  async function goToField() {
    if (!careComplete || !username) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, care }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to build report");
      }
      setReport(data);
      router.push("/field");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load field");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-press-start)] text-[11px] leading-relaxed text-[var(--ink)] sm:text-xs">
          HOW MUCH DO YOU CARE?
        </h1>
        <PixelButton
          variant="ghost"
          className="text-xs"
          onClick={() => setConfirmReset(true)}
        >
          RESET
        </PixelButton>
      </div>

      <ul className="flex flex-col gap-5">
        {leagues.map((league) => (
          <li
            key={league.leagueId}
            className="border-[3px] border-[var(--pixel-border)] bg-[rgba(247,243,232,0.92)] p-3 shadow-[3px_3px_0_var(--pixel-shadow)]"
          >
            <p className="mb-3 font-[family-name:var(--font-silkscreen)] text-sm text-[var(--ink)]">
              {league.name}
            </p>
            <CareToggle
              value={care[league.leagueId]}
              onChange={(value) => setCare(league.leagueId, value)}
            />
          </li>
        ))}
      </ul>

      {error ? (
        <p className="font-[family-name:var(--font-plex-mono)] text-sm text-[var(--accent-hot)]">
          {error}
        </p>
      ) : null}

      <PixelButton
        className="w-full animate-care-bounce"
        disabled={!careComplete || loading}
        onClick={goToField}
      >
        {loading ? "SCOUTING…" : "TO THE FIELD"}
      </PixelButton>

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