"use client";

import { useEffect } from "react";
import { PixelButton } from "@/components/ui/PixelButton";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function PixelSheet({ open, title, onClose, children, actions }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-md animate-sheet-up border-[3px] border-[var(--pixel-border)] bg-[var(--cream)] p-4 text-[var(--ink)] shadow-[4px_4px_0_var(--pixel-shadow)]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-[family-name:var(--font-press-start)] text-[11px] leading-relaxed sm:text-xs">
            {title}
          </h2>
          <PixelButton variant="ghost" className="min-h-10 px-3 text-xs" onClick={onClose}>
            CLOSE
          </PixelButton>
        </div>
        <div className="font-[family-name:var(--font-plex-mono)] text-sm leading-relaxed">
          {children}
        </div>
        {actions ? <div className="mt-4 flex gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}