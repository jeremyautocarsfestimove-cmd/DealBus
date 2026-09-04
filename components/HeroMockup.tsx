// Mockup desktop + mobile de l'application, en CSS pur (aucune capture à maintenir).
// Desktop : le formulaire de demande. Mobile : les offres reçues côté client.

const lbl = "font-mono text-[7px] uppercase tracking-widest text-blanc-faint";
const champ = "bg-asphalte border border-ligne-strong rounded-sm px-2 py-1.5 text-[9px] text-blanc-dim";

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[640px] aspect-[16/11.5] select-none" aria-hidden="true">

      {/* ---------- Laptop ---------- */}
      <div className="absolute left-0 right-[10%] top-0">
        <div className="rounded-t-lg border border-ligne-strong bg-asphalte-2 p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)]">
          <div className="rounded-sm bg-asphalte overflow-hidden">
            {/* barre navigateur */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-ligne">
              <span className="w-1.5 h-1.5 rounded-full bg-blanc-faint/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-blanc-faint/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-blanc-faint/40" />
              <span className="ml-3 flex-1 h-3 rounded-sm bg-asphalte-2 font-mono text-[7px] text-blanc-faint px-2 leading-3">dealbus.fr/demande</span>
            </div>
            {/* nav app */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-ligne">
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest">
                <span className="w-2 h-2 rounded-[2px] bg-ambre" />DEAL<span className="text-ambre">BUS</span>
              </span>
              <span className="flex gap-3 font-mono text-[7px] text-blanc-faint">
                <span>Demande</span><span>Retours à vide</span><span>Transporteurs</span>
              </span>
            </div>
            {/* formulaire */}
            <div className="px-5 py-4">
              <div className="flex gap-4 text-[9px] mb-3">
                <span className="text-ambre border-b border-ambre pb-1 font-semibold">Aller-retour</span>
                <span className="text-blanc-faint pb-1">Aller simple</span>
                <span className="text-blanc-faint pb-1">Circuit</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><p className={lbl}>De</p><div className={champ}>Versailles (78)</div></div>
                <div><p className={lbl}>Vers</p><div className={champ}>Puy du Fou (85)</div></div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div><p className={lbl}>Aller</p><div className={champ}>14/03</div></div>
                <div><p className={lbl}>Départ</p><div className={champ}>06:30</div></div>
                <div><p className={lbl}>Retour</p><div className={champ}>15/03</div></div>
                <div><p className={lbl}>Départ</p><div className={champ}>18:00</div></div>
              </div>
              <div className="mb-3"><p className={lbl}>Passagers</p><div className={champ}>53</div></div>
              <div className="rounded-sm bg-ambre text-asphalte text-center text-[9px] font-semibold py-1.5">
                Étape suivante →
              </div>
            </div>
          </div>
        </div>
        {/* base du laptop */}
        <div className="h-2 rounded-b-md bg-asphalte-3 border-x border-b border-ligne-strong mx-[-3%]" />
      </div>

      {/* ---------- Téléphone ---------- */}
      <div className="absolute right-0 bottom-0 w-[24%] rounded-[22px] border border-ligne-strong bg-asphalte-2 p-1.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,.9)]">
        <div className="rounded-[18px] bg-asphalte overflow-hidden">
          <div className="flex justify-center pt-1.5 pb-1"><span className="w-10 h-1 rounded-full bg-asphalte-3" /></div>
          <div className="px-2.5 pb-3">
            <p className="font-mono text-[6px] uppercase tracking-widest text-blanc-faint mb-0.5">Demande #2418</p>
            <p className="text-[9px] font-semibold leading-tight mb-2">Versailles → Puy du Fou</p>
            <p className="font-mono text-[6px] uppercase tracking-widest text-vert mb-1.5">● 4 offres reçues</p>
            {[
              ["Transporteur A", "2 340 €", true],
              ["Transporteur B", "2 480 €", false],
              ["Transporteur C", "2 590 €", false],
              ["Transporteur D", "2 610 €", false],
            ].map(([nom, prix, best]) => (
              <div key={nom as string}
                className={`flex items-center justify-between rounded-sm px-1.5 py-1 mb-1 border ${best ? "border-ambre/60 bg-ambre/10" : "border-ligne bg-asphalte-2"}`}>
                <span className="text-[7px] text-blanc-dim">{nom as string}</span>
                <span className={`font-mono text-[7px] font-semibold ${best ? "text-ambre" : "text-blanc"}`}>{prix as string}</span>
              </div>
            ))}
            <div className="mt-1.5 rounded-sm bg-ambre text-asphalte text-center text-[7px] font-semibold py-1">
              Choisir cette offre
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
