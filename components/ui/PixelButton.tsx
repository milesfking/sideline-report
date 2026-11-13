"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function PixelButton({
  variant = "primary",
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  const variants = {
    primary: "bg-[var(--accent)] text-[var(--cream)] hover:brightness-110",
    ghost: "bg-[var(--cream)] text-[var(--ink)] hover:bg-white",
    danger: "bg-[var(--accent-hot)] text-[var(--cream)] hover:brightness-110",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "pixel-btn font-[family-name:var(--font-silkscreen)] text-sm uppercase tracking-wide",
        "min-h-11 px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}