"use client";

import Link from "next/link";
import type { MouseEventHandler } from "react";

const classes = "inline-flex min-h-10 items-center justify-center rounded-lg border border-ligne-strong bg-surface/70 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-blanc-dim shadow-sm transition hover:-translate-y-0.5 hover:border-ambre/50 hover:bg-ambre/10 hover:text-ambre";

type BackButtonProps =
  | { href: string; onClick?: never; className?: string }
  | { href?: never; onClick: MouseEventHandler<HTMLButtonElement>; className?: string };

export function BackButton({ href, onClick, className = "" }: BackButtonProps) {
  const merged = `${classes} ${className}`.trim();

  if (href) {
    return <Link href={href} className={merged}>Retour</Link>;
  }

  return <button type="button" onClick={onClick} className={merged}>Retour</button>;
}