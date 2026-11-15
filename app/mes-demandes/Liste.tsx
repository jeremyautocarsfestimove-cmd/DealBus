import Link from "next/link";
import { Caveat } from "next/font/google";
import type { Demande } from "@/lib/types";
import { demandeActive, dateDepassee } from "@/lib/demandes";
import "./mes-demandes.css";

// Espace client : chaque demande est présentée comme un billet de voyage,
// avec sa date, son trajet, l'avancement en quatre étapes et l'action à faire.

export const caveat = Caveat({ weight: ["600"], subsets: ["latin"], variable: "--font-caveat" });

export type MissionResume = { demande_id: string | null; statut: string; annulation_motif: string | null; annulation_demandee_at: string | null; annulation_decision: string | null };
export type OffresResume = { nb: number; min: number | null };

export const ETAPES = ["Demande envoyée", "Offres reçues", "Transporteur choisi", "Voyage"];
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const eur = (n: number) => Math.round(n).toLocaleString("fr-FR") + " €";
const jours = (date: string) => Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86400000);

export function Car() {
  return (
    <svg className="mesd-car" viewBox="0 0 30 17" aria-hidden="true">
      <path className="c" d="M2 5.5A3.5 3.5 0 0 1 5.5 2H21c3.8 0 7 3 7 6.8V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
      <path className="v" d="M5 4.5h4.5v3.5H5zM11 4.5h4.5v3.5H11zM17 4.5h3.2c2.3 0 4 1.5 4.7 3.5H17z" />
      <circle cx="8.5" cy="13" r="2.5" /><circle cx="21.5" cy="13" r="2.5" />
    </svg>
  );
}

export function DateBillet({ date }: { date: string }) {
  const d = new Date(`${date}T12:00:00`);
  return (
    <div className="mesd-date">
      <span>{d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}</span>
      <b>{d.getDate()}</b>
      <span>{d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")} {d.getFullYear()}</span>
    </div>
  );
}

export function ListeDemandes({ demandes, missions, offres, nonLus }: {
  demandes: Demande[];
  missions: MissionResume[];
  offres: Record<string, OffresResume>;
  nonLus: Record<string, number>;
}) {
  const missionDe = new Map(missions.filter((m) => m.demande_id).map((m) => [m.demande_id as string, m]));
  const actives = demandes.filter(demandeActive);
  const archives = demandes.filter((d) => !demandeActive(d));

  return (
    <div className={`mesd sous-capsule ${caveat.variable}`}>
      <main className="mesd-page">
        <header className="mesd-tete">
          <div>
            <span className="mesd-main">Espace client</span>
            <h1>Vos voyages. <em>{actives.length ? `${actives.length} en préparation.` : "Rien en cours."}</em></h1>
          </div>
          {demandes.length > 0 && <Link href="/demande" className="mesd-btn">Nouvelle demande</Link>}
        </header>

        <div className="mesd-liste">
          {actives.map((d) => {
            const mission = missionDe.get(d.id);
            const o = offres[d.id] ?? { nb: 0, min: null };
            const messages = nonLus[d.id] ?? 0;
            const annulee = mission?.statut === "annulee";
            const annulationSignalee = !!mission?.annulation_motif && (annulee || mission.statut === "litige");
            const annulationEnAttente =
              (!!mission?.annulation_demandee_at && !mission?.annulation_decision && mission?.statut === "a_venir") ||
              (!!d.annulation_demandee_at && !d.annulation_decision);
            const enchere = d.mode === "enchere" && d.statut === "ouverte";

            // Étape en cours : 0 demande envoyée, 1 offres reçues, 2 transporteur choisi, 3 voyage
            const etape = d.statut === "confirmee" ? 3 : o.nb > 0 ? 1 : 0;
            const j = jours(d.date_aller);
            const dans = j <= 0 ? "aujourd'hui" : j === 1 ? "demain" : `dans ${j} jours`;

            let titre: string, detail: string, bouton: string, fort = false;
            if (annulationEnAttente) { titre = "Annulation en attente"; detail = "DealBus examine votre demande d'annulation."; bouton = "Voir le dossier"; }
            else if (annulationSignalee) { titre = annulee ? "Mission annulée" : "Annulation signalée"; detail = `Motif : ${mission?.annulation_motif}`; bouton = "Voir le dossier"; }
            else if (d.statut === "confirmee") { titre = "Transporteur choisi"; detail = `Départ ${dans}.`; bouton = "Voir mon voyage"; }
            else if (enchere) { titre = "Enchère en cours"; detail = "Les transporteurs se positionnent."; bouton = "Voir l'enchère"; }
            else if (o.nb > 0) { titre = pluriel(o.nb, "offre") + (o.nb > 1 ? " reçues" : " reçue"); detail = o.min !== null ? `À partir de ${eur(o.min)}. À vous de choisir.` : "À vous de choisir."; bouton = "Comparer les offres"; fort = true; }
            else { titre = "En attente d'offres"; detail = "Les autocaristes de votre zone ont reçu votre demande."; bouton = "Voir ma demande"; }

            return (
              <Link key={d.id} href={`/mes-demandes/${d.id}`} className={`mesd-billet ${annulationSignalee || annulationEnAttente ? "mesd-alerte" : ""}`}>
                <DateBillet date={d.date_aller} />
                <div className="mesd-corps">
                  <div className="mesd-trajet">
                    <strong>{d.depart_adresse}</strong>
                    <i><span style={{ left: `${[8, 38, 68, 88][etape]}%` }}><Car /></span></i>
                    <strong>{d.arrivee_adresse}</strong>
                  </div>
                  <p className="mesd-meta">
                    {pluriel(d.passagers, "passager")} · {d.type_trajet === "aller_simple" ? "Aller simple" : d.type_trajet === "circuit" ? "Circuit" : "Aller-retour"} · Demande n° {d.numero}
                    {messages > 0 && <span className="mesd-msg">{messages} {messages > 1 ? "nouveaux messages" : "nouveau message"}</span>}
                  </p>
                  <ol className="mesd-etapes">
                    {ETAPES.map((e, i) => (
                      <li key={e} className={i < etape || (i === 0) ? "fait" : i === etape ? "encours" : ""}><span>{i < etape || i === 0 ? "✓" : i + 1}</span>{e}</li>
                    ))}
                  </ol>
                </div>
                <div className="mesd-action">
                  <p className="mesd-etat">{titre}</p>
                  <p className="mesd-detail">{detail}</p>
                  <span className={`mesd-btn ${fort ? "" : "mesd-gris"}`}>{bouton}</span>
                </div>
              </Link>
            );
          })}

          {demandes.length === 0 && (
            <div className="mesd-vide">
              <span className="mesd-main">Par où commencer ?</span>
              <h2>Décrivez votre premier trajet.</h2>
              <p>Deux minutes suffisent. Les autocaristes de votre zone vous envoient leurs offres ici.</p>
              <Link href="/demande" className="mesd-btn">Demander un devis</Link>
            </div>
          )}
          {demandes.length > 0 && actives.length === 0 && (
            <div className="mesd-vide">
              <h2>Aucun voyage en préparation.</h2>
              <p>Vos demandes passées sont dans les archives, plus bas.</p>
              <Link href="/demande" className="mesd-btn">Nouvelle demande</Link>
            </div>
          )}
        </div>

        {archives.length > 0 && (
          <details className="mesd-archives">
            <summary>Archives, {pluriel(archives.length, "demande")} passée{archives.length > 1 ? "s" : ""}</summary>
            <ul>
              {archives.map((d) => (
                <li key={d.id}>
                  <Link href={`/mes-demandes/${d.id}`}>
                    <span className="t">{d.depart_adresse} → {d.arrivee_adresse}</span>
                    <span className="m">{new Date(d.date_aller).toLocaleDateString("fr-FR")} · {pluriel(d.passagers, "passager")} · n° {d.numero}</span>
                    <span className="e">{d.statut === "confirmee" ? "Réalisée" : d.statut === "annulee" ? "Annulée" : d.statut === "expiree" ? "Close" : dateDepassee(d) ? "Date passée" : "Close"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </main>
    </div>
  );
}
