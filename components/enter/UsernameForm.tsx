"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppState } from "@/components/providers/AppState";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import type { LeaguesResponse } from "@/lib/types";

export function UsernameForm() {
  const router = useRouter();
  const { setLeaguesSession } = useAppState();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setShake(true);
      setError("Enter a username");
      window.setTimeout(() => setShake(false), 400);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sleeper/leagues?username=${encodeURIComponent(trimmed)}`,
      );
      const data = (await res.json()) as LeaguesResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not find that user");
      }
      if (!data.leagues?.length) {
        throw new Error("No NFL leagues found for this season");
      }
      setLeaguesSession({
        username: data.user.username,
        displayName: data.user.displayName,
        season: data.season,
        week: data.week,
        leagues: data.leagues,
      });
      router.push("/care");
    } catch (err) {
      setShake(true);
      setError(err instanceof Error ? err.message : "Lookup failed");
      window.setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <label className="font-[family-name:var(--font-silkscreen)] text-sm text-[var(--ink)]">
        SLEEPER USERNAME
      </label>
      <PixelInput
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="username"
        shake={shake}
        disabled={loading}
      />
      {error ? (
        <p className="font-[family-name:var(--font-plex-mono)] text-sm text-[var(--accent-hot)]">
          {error}
        </p>
      ) : null}
      <PixelButton type="submit" disabled={loading} className="mt-1 w-full">
        {loading ? "LOADING…" : "KICK OFF"}
      </PixelButton>
    </form>
  );
}