import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

// Illustrations de la page d'accueil : scènes SVG « plat », palette DealBus.
// Le sprite est injecté une fois (IllustrationsSprite), chaque <Illu id> y fait référence.
// Un autocar ambre figure dans chaque scène : c'est le fil rouge visuel du site.

export const SPRITE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
<defs>
  <linearGradient id="g-aube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E2A44"/><stop offset=".42" stop-color="#6E4A5E"/><stop offset=".72" stop-color="#D98A4A"/><stop offset="1" stop-color="#F6D08C"/></linearGradient>
  <linearGradient id="g-nuit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1424"/><stop offset="1" stop-color="#2A3752"/></linearGradient>
  <linearGradient id="g-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FC3E8"/><stop offset="1" stop-color="#DCEFFB"/></linearGradient>
  <linearGradient id="g-mer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E7FB8"/><stop offset="1" stop-color="#6FB3DC"/></linearGradient>
  <linearGradient id="g-soir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2F5A"/><stop offset=".55" stop-color="#C56FA3"/><stop offset="1" stop-color="#F6C69A"/></linearGradient>
  <linearGradient id="g-vert" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9CC26E"/><stop offset="1" stop-color="#4F7A33"/></linearGradient>
  <linearGradient id="g-sable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2E2B8"/><stop offset="1" stop-color="#D9C08E"/></linearGradient>
  <linearGradient id="g-brume" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE0F1"/><stop offset="1" stop-color="#E9F1F8"/></linearGradient>

  <!-- autocar vu de côté, réutilisable -->
  <symbol id="bus" viewBox="0 0 200 70">
    <rect x="4" y="10" width="192" height="46" rx="8" fill="#E8A63D"/>
    <rect x="4" y="34" width="192" height="12" fill="#12151B" opacity=".9"/>
    <rect x="12" y="16" width="26" height="16" rx="2" fill="#DCEFFB"/><rect x="44" y="16" width="26" height="16" rx="2" fill="#DCEFFB"/><rect x="76" y="16" width="26" height="16" rx="2" fill="#DCEFFB"/><rect x="108" y="16" width="26" height="16" rx="2" fill="#DCEFFB"/><rect x="140" y="16" width="26" height="16" rx="2" fill="#DCEFFB"/>
    <path d="M172 16h18a6 6 0 0 1 6 6v10h-24z" fill="#DCEFFB"/>
    <circle cx="40" cy="56" r="10" fill="#12151B"/><circle cx="40" cy="56" r="4" fill="#9AA0AB"/>
    <circle cx="156" cy="56" r="10" fill="#12151B"/><circle cx="156" cy="56" r="4" fill="#9AA0AB"/>
    <rect x="186" y="40" width="8" height="5" fill="#FFF3C4"/>
  </symbol>

  <!-- 1. Mont-Saint-Michel à l'aube -->
  <symbol id="s-msm" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="url(#g-aube)"/>
    <circle cx="520" cy="318" r="56" fill="#FFF0C2" opacity=".95"/>
    <rect y="330" width="800" height="170" fill="#E9B784"/>
    <path d="M0 330 Q200 310 400 330 T800 330 V500 H0z" fill="#D89C6A" opacity=".7"/>
    <path d="M600 330 L630 250 L650 230 L660 120 L668 110 L676 120 L686 230 L710 250 L740 330z" fill="#2E3B50"/>
    <path d="M560 330 L600 290 L630 300 L650 280 L740 290 L780 330z" fill="#3A4A62"/>
    <path d="M664 110 L668 70 L672 110z" fill="#2E3B50"/>
    <rect x="0" y="380" width="800" height="18" fill="#6B5B4E"/>
    <use href="#bus" x="470" y="350" width="120" height="42"/>
    <g fill="#12151B" opacity=".85"><circle cx="340" cy="372" r="5"/><circle cx="356" cy="372" r="5"/><circle cx="372" cy="372" r="5"/><circle cx="388" cy="372" r="5"/><circle cx="404" cy="372" r="5"/><rect x="336" y="376" width="72" height="14" rx="3"/></g>
    <g fill="#fff" opacity=".6"><circle cx="120" cy="90" r="3"/><circle cx="700" cy="60" r="2"/><circle cx="650" cy="130" r="2"/></g>
  </symbol>

  <!-- 2. Marché de Noël -->
  <symbol id="s-noel" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="url(#g-nuit)"/>
    <g fill="#fff" opacity=".8"><circle cx="80" cy="60" r="2"/><circle cx="200" cy="40" r="2.5"/><circle cx="330" cy="90" r="2"/><circle cx="520" cy="50" r="2"/><circle cx="700" cy="80" r="2.5"/><circle cx="760" cy="30" r="2"/><circle cx="430" cy="30" r="1.5"/></g>
    <path d="M420 340 L420 200 L450 140 L480 200 L480 340z M460 140 L465 90 L470 140z" fill="#1B2028"/>
    <path d="M400 340 L400 230 L420 230 L420 340z M480 340 L480 230 L500 230 L500 340z" fill="#1B2028"/>
    <rect y="340" width="800" height="160" fill="#E9EEF3"/>
    <g><path d="M60 340 V260 L130 220 L200 260 V340z" fill="#7A3B2E"/><rect x="60" y="340" width="140" height="0"/><rect x="70" y="280" width="120" height="60" fill="#F6C66A"/><rect x="60" y="250" width="140" height="14" fill="#E9EEF3"/></g>
    <g><path d="M240 340 V260 L310 220 L380 260 V340z" fill="#2E5E3E"/><rect x="250" y="280" width="120" height="60" fill="#FFE39A"/><rect x="240" y="250" width="140" height="14" fill="#E9EEF3"/></g>
    <g><path d="M560 340 V260 L630 220 L700 260 V340z" fill="#7A3B2E"/><rect x="570" y="280" width="120" height="60" fill="#F6C66A"/><rect x="560" y="250" width="140" height="14" fill="#E9EEF3"/></g>
    <path d="M0 200 Q400 150 800 200" stroke="#E8A63D" stroke-width="2" fill="none" opacity=".7"/>
    <g fill="#FFD36B"><circle cx="100" cy="188" r="4"/><circle cx="200" cy="178" r="4"/><circle cx="300" cy="170" r="4"/><circle cx="400" cy="167" r="4"/><circle cx="500" cy="170" r="4"/><circle cx="600" cy="178" r="4"/><circle cx="700" cy="188" r="4"/></g>
    <path d="M720 340 L740 260 L760 340z" fill="#2E5E3E"/><path d="M724 300 L740 240 L756 300z" fill="#3B7A4E"/>
    <use href="#bus" x="440" y="300" width="110" height="38"/>
  </symbol>

  <!-- 3. Parc d'attractions -->
  <symbol id="s-parc" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="url(#g-soir)"/>
    <circle cx="600" cy="220" r="120" fill="none" stroke="#fff" stroke-width="6" opacity=".9"/>
    <g stroke="#fff" stroke-width="3" opacity=".8"><line x1="600" y1="100" x2="600" y2="340"/><line x1="480" y1="220" x2="720" y2="220"/><line x1="515" y1="135" x2="685" y2="305"/><line x1="685" y1="135" x2="515" y2="305"/></g>
    <g fill="#E8A63D"><circle cx="600" cy="100" r="12"/><circle cx="720" cy="220" r="12"/><circle cx="600" cy="340" r="12"/><circle cx="480" cy="220" r="12"/><circle cx="685" cy="135" r="12"/><circle cx="685" cy="305" r="12"/><circle cx="515" cy="135" r="12"/><circle cx="515" cy="305" r="12"/></g>
    <path d="M560 400 L600 340 L640 400z" fill="#2A3752"/>
    <path d="M150 400 V220 h40 V180 h20 V220 h40 V160 l20 -40 l20 40 V220 h40 V180 h20 V220 h40 V400z" fill="#F5F2EA"/>
    <g fill="#C56FA3"><path d="M170 180 l20 -40 l20 40z"/><path d="M290 180 l20 -40 l20 40z"/><path d="M230 120 l20 -45 l20 45z"/></g>
    <rect x="235" y="330" width="30" height="70" rx="15" fill="#2A3752"/>
    <rect y="400" width="800" height="100" fill="#4F7A33"/>
    <g><circle cx="80" cy="300" r="16" fill="#E8A63D"/><line x1="80" y1="316" x2="84" y2="400" stroke="#fff" stroke-width="1.5"/><circle cx="110" cy="280" r="14" fill="#3FCE94"/><line x1="110" y1="294" x2="112" y2="400" stroke="#fff" stroke-width="1.5"/></g>
    <use href="#bus" x="380" y="372" width="100" height="35"/>
  </symbol>

  <!-- 4. Journée à la mer (Étretat) -->
  <symbol id="s-mer" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="url(#g-ciel)"/>
    <circle cx="140" cy="110" r="40" fill="#FFE9A8"/>
    <rect y="260" width="800" height="150" fill="url(#g-mer)"/>
    <path d="M520 260 L560 120 L640 100 L720 140 L800 120 V260z" fill="#DCE5EC"/>
    <path d="M600 260 L620 190 L660 180 L690 200 L700 260z" fill="#C5D1DA"/>
    <path d="M640 260 a30 60 0 0 1 60 0z" fill="#8FC3E8"/>
    <path d="M0 410 Q400 380 800 410 V500 H0z" fill="url(#g-sable)"/>
    <g><path d="M200 420 l-40 40 h80z" fill="#E8A63D"/><path d="M200 420 l-40 40 h40z" fill="#F5F2EA"/><line x1="200" y1="420" x2="200" y2="490" stroke="#12151B" stroke-width="3"/></g>
    <g><path d="M330 405 l-40 40 h80z" fill="#C56FA3"/><path d="M330 405 l-40 40 h40z" fill="#F5F2EA"/><line x1="330" y1="405" x2="330" y2="480" stroke="#12151B" stroke-width="3"/></g>
    <g fill="#fff" opacity=".7"><path d="M60 300 q10 -8 20 0 q10 -8 20 0" stroke="#fff" stroke-width="3" fill="none"/><path d="M420 330 q10 -8 20 0 q10 -8 20 0" stroke="#fff" stroke-width="3" fill="none"/></g>
    <use href="#bus" x="560" y="430" width="110" height="38"/>
  </symbol>

  <!-- 5. Vignobles -->
  <symbol id="s-vigne" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="url(#g-ciel)"/>
    <circle cx="660" cy="120" r="46" fill="#FFE9A8"/>
    <path d="M0 300 Q200 220 400 290 T800 260 V500 H0z" fill="#B8D48A"/>
    <path d="M0 360 Q250 300 500 360 T800 330 V500 H0z" fill="url(#g-vert)"/>
    <g stroke="#2E5E3E" stroke-width="4" fill="none" opacity=".8"><path d="M0 380 Q250 330 520 380 T800 355"/><path d="M0 410 Q250 360 520 410 T800 385"/><path d="M0 440 Q250 390 520 440 T800 415"/><path d="M0 470 Q250 420 520 470 T800 445"/></g>
    <g fill="#5E3A7A"><circle cx="120" cy="396" r="4"/><circle cx="130" cy="402" r="4"/><circle cx="300" cy="372" r="4"/><circle cx="310" cy="378" r="4"/><circle cx="520" cy="396" r="4"/><circle cx="530" cy="402" r="4"/><circle cx="680" cy="372" r="4"/></g>
    <path d="M560 300 V240 h40 V300z M600 300 V260 h30 V300z" fill="#F5F2EA"/><path d="M555 240 l25 -30 l25 30z" fill="#C96A3A"/><path d="M598 260 l17 -20 l17 20z" fill="#C96A3A"/>
    <use href="#bus" x="80" y="296" width="100" height="35"/>
  </symbol>

  <!-- 6. Château de la Loire -->
  <symbol id="s-chateau" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="url(#g-brume)"/>
    <rect y="360" width="800" height="140" fill="#9FC3DE"/>
    <g fill="#EDE6D8"><rect x="230" y="200" width="340" height="160"/><rect x="200" y="180" width="60" height="180"/><rect x="540" y="180" width="60" height="180"/><rect x="380" y="160" width="40" height="200"/></g>
    <g fill="#5A6E8C"><path d="M195 180 l35 -60 l35 60z"/><path d="M535 180 l35 -60 l35 60z"/><path d="M376 160 l24 -50 l24 50z"/><rect x="230" y="200" width="340" height="14"/></g>
    <g fill="#2A3752"><rect x="280" y="240" width="18" height="34" rx="9"/><rect x="330" y="240" width="18" height="34" rx="9"/><rect x="450" y="240" width="18" height="34" rx="9"/><rect x="500" y="240" width="18" height="34" rx="9"/><rect x="385" y="300" width="30" height="60" rx="15"/></g>
    <g fill="#5A6E8C" opacity=".35"><rect x="230" y="372" width="340" height="80"/><rect x="200" y="372" width="60" height="60"/><rect x="540" y="372" width="60" height="60"/></g>
    <g fill="#4F7A33"><circle cx="90" cy="330" r="40"/><rect x="84" y="330" width="12" height="40"/><circle cx="720" cy="320" r="50"/><rect x="713" y="320" width="14" height="50"/></g>
    <use href="#bus" x="620" y="330" width="100" height="35"/>
  </symbol>

  <!-- 7. Londres -->
  <symbol id="s-londres" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="url(#g-brume)"/>
    <rect y="380" width="800" height="120" fill="#7E9BB5"/>
    <g fill="#5A6E8C"><rect x="120" y="140" width="50" height="240"/><path d="M115 140 l30 -50 l30 50z"/><rect x="60" y="260" width="60" height="120"/><rect x="170" y="280" width="120" height="100"/></g>
    <circle cx="145" cy="190" r="16" fill="#F5F2EA"/><circle cx="145" cy="190" r="12" fill="none" stroke="#2A3752" stroke-width="2"/>
    <g fill="#2A3752"><rect x="440" y="180" width="50" height="200"/><rect x="640" y="180" width="50" height="200"/><path d="M435 180 l30 -40 l30 40z"/><path d="M635 180 l30 -40 l30 40z"/></g>
    <rect x="380" y="300" width="380" height="14" fill="#2A3752"/>
    <path d="M490 300 Q565 230 640 300" stroke="#2A3752" stroke-width="6" fill="none"/>
    <path d="M380 300 Q410 250 440 300" stroke="#2A3752" stroke-width="6" fill="none"/><path d="M690 300 Q725 250 760 300" stroke="#2A3752" stroke-width="6" fill="none"/>
    <g><rect x="520" y="260" width="90" height="40" rx="5" fill="#C9342B"/><rect x="520" y="240" width="90" height="22" rx="5" fill="#C9342B"/><g fill="#DCEFFB"><rect x="526" y="244" width="16" height="12"/><rect x="546" y="244" width="16" height="12"/><rect x="566" y="244" width="16" height="12"/><rect x="586" y="244" width="16" height="12"/></g><circle cx="540" cy="302" r="7" fill="#12151B"/><circle cx="590" cy="302" r="7" fill="#12151B"/></g>
    <use href="#bus" x="40" y="340" width="110" height="38"/>
  </symbol>

  <!-- 8. Autocar de nuit -->
  <symbol id="s-car" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="url(#g-nuit)"/>
    <g fill="#fff" opacity=".7"><circle cx="60" cy="50" r="2"/><circle cx="180" cy="90" r="1.5"/><circle cx="300" cy="40" r="2"/><circle cx="460" cy="70" r="1.5"/><circle cx="620" cy="40" r="2"/><circle cx="740" cy="100" r="2"/><circle cx="560" cy="130" r="1.5"/></g>
    <circle cx="700" cy="110" r="34" fill="#FFF0C2" opacity=".9"/>
    <rect y="360" width="800" height="140" fill="#1B2028"/>
    <g stroke="#E8A63D" stroke-width="3" stroke-dasharray="30 24" opacity=".8"><line x1="0" y1="430" x2="800" y2="430"/></g>
    <g transform="translate(130 200) scale(2.6)"><use href="#bus" width="200" height="70"/></g>
    <g fill="#FFF3C4" opacity=".9"><rect x="150" y="241" width="68" height="42" rx="3"/><rect x="232" y="241" width="68" height="42" rx="3"/><rect x="314" y="241" width="68" height="42" rx="3"/><rect x="396" y="241" width="68" height="42" rx="3"/><rect x="478" y="241" width="68" height="42" rx="3"/></g>
    <path d="M620 300 l160 70 v-10 l-160 -80z" fill="#FFF3C4" opacity=".25"/>
  </symbol>

  <!-- 9. Route côtière -->
  <symbol id="s-route" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="url(#g-ciel)"/>
    <rect y="200" width="800" height="300" fill="url(#g-mer)"/>
    <path d="M0 500 V260 Q150 240 260 300 Q400 380 520 320 Q680 240 800 300 V500z" fill="#B8D48A"/>
    <path d="M0 500 V320 Q150 300 260 350 Q400 430 520 370 Q680 300 800 360 V500z" fill="#4F7A33"/>
    <path d="M0 440 Q150 400 300 440 T600 420 T800 440" stroke="#6B5B4E" stroke-width="26" fill="none"/>
    <path d="M0 440 Q150 400 300 440 T600 420 T800 440" stroke="#F5F2EA" stroke-width="2" stroke-dasharray="18 16" fill="none"/>
    <use href="#bus" x="330" y="404" width="90" height="32"/>
    <g fill="#fff" opacity=".8"><path d="M520 150 h60 a20 20 0 0 0 0 -40 a30 30 0 0 0 -55 10 a15 15 0 0 0 -5 30z"/><path d="M120 110 h50 a16 16 0 0 0 0 -32 a24 24 0 0 0 -45 8 a12 12 0 0 0 -5 24z"/></g>
  </symbol>
</defs>
</svg>`;

export type IlluId = "msm" | "noel" | "parc" | "mer" | "vigne" | "chateau" | "londres" | "car" | "route";

export function IllustrationsSprite() {
  return <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: SPRITE_SVG }} />;
}

// Si une image existe dans public/img/<id>.(webp|png|jpg), elle remplace le
// SVG de la même scène. Vérifié au build (page statique) : aucun coût au runtime.
const EXTENSIONS = ["webp", "png", "jpg", "jpeg", "webp.png", "webp.jpg"];  // « webp.png » : nom donné par ChatGPT à ses PNG
const cacheImages = new Map<IlluId, string | null>();

function imagePour(id: IlluId): string | null {
  if (cacheImages.has(id)) return cacheImages.get(id)!;
  let trouve: string | null = null;
  try {
    for (const ext of EXTENSIONS) {
      if (fs.existsSync(path.join(process.cwd(), "public", "img", `${id}.${ext}`))) { trouve = `/img/${id}.${ext}`; break; }
    }
  } catch { trouve = null; }
  cacheImages.set(id, trouve);
  return trouve;
}

export function Illu({ id, className = "", titre, priorite = false }: { id: IlluId; className?: string; titre?: string; priorite?: boolean }) {
  const src = imagePour(id);
  if (src) {
    return (
      <Image
        src={src}
        alt={titre ?? ""}
        fill
        priority={priorite}
        sizes="(max-width: 768px) 100vw, 50vw"
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <svg className={`absolute inset-0 w-full h-full block ${className}`} role={titre ? "img" : undefined} aria-label={titre} aria-hidden={titre ? undefined : true}>
      <use href={`#s-${id}`} />
    </svg>
  );
}
