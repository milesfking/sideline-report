"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LeagueCareList } from "@/components/care/LeagueCareList";
import { useAppState } from "@/components/providers/AppState";

export default function CarePage() {
  const router = useRouter();
  const { hydrated, username, leagues } = useAppState();

  useEffect(() => {
    if (!hydrated) return;
    if (!username || leagues.length === 0) {
      router.replace("/enter");
    }
  }, [hydrated, username, leagues, router]);

  if (!hydrated || !username) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--turf-mid)] font-[family-name:var(--font-silkscreen)] text-[var(--cream)]">
        LOADING…
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--sky-light),var(--turf-light)_28%,var(--turf-mid))]">
      <LeagueCareList />
    </main>
  );
}