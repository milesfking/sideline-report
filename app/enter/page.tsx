import { Wordmark } from "@/components/brand/Wordmark";
import { UsernameForm } from "@/components/enter/UsernameForm";

export default function EnterPage() {
  return (
    <main className="sky-scene relative flex min-h-dvh flex-col items-center justify-center px-4 pb-[max(2rem,var(--safe-bot))] pt-[max(2rem,var(--safe-top))]">
      <div className="mb-10 text-center">
        <Wordmark size="hero" />
      </div>
      <UsernameForm />
    </main>
  );
}