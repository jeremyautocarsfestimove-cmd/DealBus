"use client";

import { useEffect } from "react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmer →",
  cancelLabel = "Annuler",
  danger = false,
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  // Échap pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
      {/* Fond */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onCancel} />
      {/* Boîte */}
      <div className="relative w-full max-w-md bg-asphalte-2 border border-ligne-strong rounded p-7 shadow-2xl">
        <div className={`h-1 -mt-7 -mx-7 mb-6 rounded-t ${danger ? "bg-[#AE2A22]" : "bg-ambre"}`} />
        <h2 className="h-display text-2xl mb-3">{title}</h2>
        {message && <p className="text-sm text-blanc-dim mb-5">{message}</p>}
        {children}
        <div className="flex gap-3 mt-6">
          <button className="btn-ghost flex-1" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={`btn flex-1 disabled:opacity-50 ${danger ? "bg-[#AE2A22] text-blanc hover:-translate-y-px" : "bg-ambre text-asphalte hover:-translate-y-px"}`}
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
