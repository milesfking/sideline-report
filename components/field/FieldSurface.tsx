import type { CSSProperties } from "react";

export function FieldSurface() {
  // 0 and 100 = goal lines; end zones peek beyond and are mostly clipped.
  const yardLines = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const hashYards = Array.from({ length: 99 }, (_, i) => i + 1);

  return (
    <>
      {/* Partial end zones — largely cut off by overflow:hidden on the surface */}
      <div className="endzone endzone-for pointer-events-none absolute inset-x-[8%] top-[-3.5%] z-[1] h-[7%]" />
      <div className="endzone endzone-against pointer-events-none absolute inset-x-[8%] bottom-[-3.5%] z-[1] h-[7%]" />

      <GoalPost placement="top" />
      <GoalPost placement="bottom" />

      {/* Orange pylons at goal-line corners */}
      <Pylon style={{ left: "8%", top: "0%" }} />
      <Pylon style={{ right: "8%", top: "0%" }} />
      <Pylon style={{ left: "8%", bottom: "0%" }} />
      <Pylon style={{ right: "8%", bottom: "0%" }} />

      <p className="pointer-events-none absolute left-1/2 top-[1.2%] z-[1] -translate-x-1/2 font-[family-name:var(--font-press-start)] text-[10px] text-[var(--chalk)] opacity-70 sm:text-[11px]">
        ROOT FOR
      </p>
      <p className="pointer-events-none absolute bottom-[1.2%] left-1/2 z-[1] -translate-x-1/2 font-[family-name:var(--font-press-start)] text-[10px] text-[var(--chalk)] opacity-70 sm:text-[11px]">
        ROOT AGAINST
      </p>

      {yardLines.map((yard) => (
        <div
          key={yard}
          className="pointer-events-none absolute inset-x-[8%] z-[1] border-t border-[var(--chalk-dim)]"
          style={{ top: `${yard}%` }}
        >
          {yard > 0 && yard < 100 ? (
            <>
              <span className="absolute left-1 top-1 font-[family-name:var(--font-plex-mono)] text-[10px] text-[var(--hash)]">
                {yard <= 50 ? yard : 100 - yard}
              </span>
              <span className="absolute right-1 top-1 font-[family-name:var(--font-plex-mono)] text-[10px] text-[var(--hash)]">
                {yard <= 50 ? yard : 100 - yard}
              </span>
            </>
          ) : null}
        </div>
      ))}

      {hashYards.map((yard) => (
        <div
          key={`hash-${yard}`}
          className="pointer-events-none absolute z-[1] h-px w-[3.2%] bg-[var(--chalk-dim)]"
          style={{ top: `${yard}%`, left: "34%" }}
        />
      ))}
      {hashYards.map((yard) => (
        <div
          key={`hash-r-${yard}`}
          className="pointer-events-none absolute z-[1] h-px w-[3.2%] bg-[var(--chalk-dim)]"
          style={{ top: `${yard}%`, right: "34%" }}
        />
      ))}

      <div className="pointer-events-none absolute inset-y-0 left-[8%] z-[1] w-px bg-[var(--chalk-dim)]" />
      <div className="pointer-events-none absolute inset-y-0 right-[8%] z-[1] w-px bg-[var(--chalk-dim)]" />
    </>
  );
}

function Pylon({ style }: { style: CSSProperties }) {
  return (
    <div
      className="pointer-events-none absolute z-[2] h-2.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-[#ff6b00] shadow-[1px_1px_0_#0e1a12]"
      style={style}
      aria-hidden
    />
  );
}

function GoalPost({ placement }: { placement: "top" | "bottom" }) {
  const isTop = placement === "top";
  // ~1.5x prior size (w-12/h-10 → w-[4.5rem]/h-[3.75rem]), seated in the end zone.
  return (
    <div
      className={[
        "pointer-events-none absolute left-1/2 z-[1] w-[4.5rem] -translate-x-1/2",
        isTop ? "top-[-2.8%]" : "bottom-[-2.8%]",
      ].join(" ")}
      aria-hidden
    >
      <div
        className={[
          "relative mx-auto h-[3.75rem] w-[4.5rem]",
          isTop ? "" : "rotate-180",
        ].join(" ")}
      >
        <div className="absolute left-0 top-0 h-[3rem] w-[4px] bg-[#ffd60a] shadow-[1px_0_0_#0e1a12]" />
        <div className="absolute right-0 top-0 h-[3rem] w-[4px] bg-[#ffd60a] shadow-[1px_0_0_#0e1a12]" />
        <div className="absolute left-0 top-[2.85rem] h-[4px] w-full bg-[#ffd60a]" />
        <div className="absolute left-1/2 top-[2.85rem] h-4 w-[4px] -translate-x-1/2 bg-[#ffd60a]" />
      </div>
    </div>
  );
}