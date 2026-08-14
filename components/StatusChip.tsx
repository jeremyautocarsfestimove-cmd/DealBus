const styles: Record<string, string> = {
  ouverte: "text-blanc-faint",
  live: "text-vert",
  confirmee: "text-blanc-dim",
  en_attente: "text-ambre",
};

export function StatusChip({ kind, children }: { kind: keyof typeof styles; children: React.ReactNode }) {
  return (
    <span className={`font-mono text-[11.5px] uppercase tracking-wider flex items-center gap-2 ${styles[kind]}`}>
      {kind === "live" && (
        <span className="w-1.5 h-1.5 rounded-full bg-vert animate-pulse" />
      )}
      {children}
    </span>
  );
}
