// Le pictogramme suit la couleur du texte parent (currentColor) : sur le header
// ambre il passe en encre, sur un fond sombre il reprendrait le crème.
// Sans ça, un logo ambre sur un aplat ambre disparaîtrait.
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5 font-condensed font-extrabold text-2xl uppercase">
      <svg width={size} height={size} viewBox="0 0 58 58" aria-hidden="true">
        <rect x="10" y="12" width="38" height="36" rx="7" fill="none" stroke="currentColor" strokeWidth="3.4" />
        <path d="M 14 30 L 14 19 Q 14 16 17 16 L 41 16 Q 44 16 44 19 L 44 30 Z" fill="currentColor" opacity="0.28" />
        <line x1="14" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="2.8" />
        <circle cx="20.5" cy="39" r="3.6" fill="currentColor" />
        <circle cx="37.5" cy="39" r="3.6" fill="currentColor" />
      </svg>
      DealBus
    </span>
  );
}
