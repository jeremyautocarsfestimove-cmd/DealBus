import Link from "next/link";

// Liste des demandes à chiffrer : une carte par demande.
// Date en bloc à gauche, trajet avec la distance sur la ligne, repère de marché et concurrence à droite.

export type Lead = {
  id: string; depart: string; arrivee: string; date: string; heure: string; nature: string;
  passagers: number; km: number | null; duree: string | null; organisme: string | null;
  badges: { t: string; alerte?: boolean }[]; repere: string | null; nb: number;
  invitation: boolean; enchere: boolean; messages: number; jours: number;
};

export function ListeLeads({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) return <div className="pl-vide">Aucune demande ouverte pour l&apos;instant.</div>;
  return (
    <div className="pl-liste">
      {leads.map((l, i) => {
        const d = new Date(`${l.date}T12:00:00`);
        const urgent = l.jours <= 7;
        const fort = urgent || l.invitation || l.nb === 0;
        return (
          <article key={l.id} className={`pl ${l.invitation ? "pl-inv" : ""} ${urgent ? "pl-urgent" : ""}`} style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
            <div className="pl-date">
              <span>{d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}</span>
              <b>{d.getDate()}</b>
              <small>{l.jours <= 0 ? "Aujourd'hui" : l.jours === 1 ? "Demain" : `J-${l.jours}`}</small>
            </div>

            <div className="pl-corps">
              <Link href={`/pro/leads/${l.id}`} className="pl-route">
                <strong>{l.depart}</strong>
                <i>{l.km && <em>{l.km} km{l.duree ? ` · ${l.duree}` : ""}</em>}</i>
                <strong>{l.arrivee}</strong>
              </Link>
              <div className="pl-meta">
                <span>{l.heure ? `${l.heure} · ` : ""}{l.nature}</span>
                <span><b>{l.passagers}</b> passagers</span>
                {l.organisme && <span>{l.organisme}</span>}
                {l.invitation && <span className="pl-tag pl-ambre">Sur invitation</span>}
                {l.enchere && <span className="pl-tag pl-vert">Enchère</span>}
                {l.messages > 0 && <span className="pl-tag pl-plein">{l.messages} message{l.messages > 1 ? "s" : ""}</span>}
                {l.badges.map((b) => <span key={b.t} className={`pl-tag ${b.alerte ? "pl-rouge" : ""}`}>{b.t}</span>)}
              </div>
            </div>

            <div className="pl-marche">
              <span>Repère marché</span>
              <b>{l.repere ?? "à établir"}</b>
              {l.nb > 0
                ? <p><i className="pl-points" aria-hidden="true">{Array.from({ length: Math.min(l.nb, 5) }).map((_, k) => <u key={k} />)}</i>{l.nb} transporteur{l.nb > 1 ? "s ont" : " a"} répondu</p>
                : <p className="pl-premier">Vous seriez le premier</p>}
            </div>

            <div className="pl-cta">
              <Link href={`/pro/leads/${l.id}`} className={`pl-btn ${fort ? "" : "pl-btn-gris"}`}>Faire une offre</Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
