"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  shake?: boolean;
};

export function PixelInput({ shake, className = "", ...rest }: Props) {
  return (
    <input
      className={[
        "w-full min-h-12 px-3 py-2 bg-[var(--cream)] text-[var(--ink)]",
        "border-[3px] border-[var(--pixel-border)] font-[family-name:var(--font-plex-mono)]",
        "text-base outline-none focus:outline focus:outline-2 focus:outline-[var(--chalk)] focus:outline-offset-2",
        shake ? "animate-pixel-shake" : "",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}