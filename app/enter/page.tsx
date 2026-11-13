import { Wordmark } from "@/components/brand/Wordmark";
import { UsernameForm } from "@/components/enter/UsernameForm";

export default function EnterPage() {
  return (
    <main className="sky-scene relative flex min-h-dvh flex-col items-center justify-center px-4 pb-[max(2rem,var(--safe-bot))] pt-[max(2rem,var(--safe-top))]">
      <div className="mb-10 max-w-sm text-center">
        <Wordmark size="hero" />
        <p className="mt-4 font-[family-name:var(--font-plex-mono)] text-sm leading-snug text-[var(--ink-muted)] sm:text-base">
          Determine who you&apos;re rooting for in fantasy this week
        </p>
      </div>
      <UsernameForm />
    </main>
  );
}