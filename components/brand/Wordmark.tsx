type Props = {
  size?: "hero" | "sm";
  className?: string;
};

export function Wordmark({ size = "sm", className = "" }: Props) {
  const sizeClass =
    size === "hero"
      ? "text-[22px] sm:text-[28px] leading-tight animate-brand-snap"
      : "text-[10px] sm:text-[11px] leading-tight";

  return (
    <p
      className={[
        "font-[family-name:var(--font-press-start)] text-[var(--ink)] uppercase",
        sizeClass,
        className,
      ].join(" ")}
    >
      Sideline
      <br />
      Report
    </p>
  );
}