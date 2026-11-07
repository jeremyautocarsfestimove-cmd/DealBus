import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigerAdmin, depuis } from "@/lib/admin-crm";
import { missionsAFacturer, prochainesFactures, ht, TVA, arrondi2 } from "@/lib/facturation";
import { qontoConfigure } from "@/lib/qonto";
import { eur, jour } from "../helpers";
import { ActionFacturation } from "./facturation-actions";
import { TesterQonto } from "./tester-qonto";

export const metadata = { title: "Facturation — Administration" };

const STATUT: Record<string, { label: string; classe: string }> = {
  emise: { label: "À payer", classe: "bg-[#FFF4E0] text-[#B26A00]" },
  payee: { label: "Payée", classe: "bg-[#E6F6EE] text-[#1A7F52]" },
  annulee: { label: "Annulée", classe: "bg-[#F1F0ED] text-[#8A8882]" },
};

const euro2 = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function FacturationPage() {
  if (!(await exigerAdmin())) return null;
  const admin = createAdminClient();
  const [dues, prochaines, { data: factures }] = await Promise.all([
    missionsAFacturer(),
    prochainesFactures(14),
    admin.from("factures").select("*, transporteur:transporteurs(raison_sociale), mission:missions(demande:demandes(numero))").order("emise_le", { ascending: false }).limit(300),
  ]);
  const F = (factures ?? []) as any[];
  const somme = (l: any[]) => l.reduce((s, f) => s + Number(f.montant_ttc), 0);
  const impayees = F.filter((f) => f.statut === "emise");
  const enRetard = impayees.filter((f) => Date.now() - new Date(f.emise_le).getTime() > 15 * 86400000);

  const kpis = [
    { num: String(dues.length), label: "À émettre maintenant", accent: dues.length > 0 },
    { num: euro2(somme(impayees)), label: `À encaisser · ${impayees.length} facture${impayees.length > 1 ? "s" : ""}` },
    { num: String(enRetard.length), label: "Impayées depuis plus de 15 j", accent: enRetard.length > 0 },
    { num: euro2(somme(F.filter((f) => f.statut === "payee"))), label: "Encaissé" },
    { num: euro2(prochaines.reduce((s, m) => s + m.commissionTtc, 0)), label: "Facturable sous 14 jours" },
  ];

  return (
    <main>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="crm-titre">Facturation</h1>
          <p className="crm-sous">Une facture par mission, émise et envoyée automatiquement par Qonto le lendemain de la fin du transport (chaque matin vers 7 h).</p>
        </div>
        <ActionFacturation action="synchroniser" label="Synchroniser les paiements Qonto" />
      </div>

      {!qontoConfigure() && (
        <div className="crm-panel px-4 py-3 mb-5 text-[13px]">
          <strong className="text-[#C2410C]">Qonto n&apos;est pas encore branché.</strong>{" "}
          Ajoutez <code className="font-mono">QONTO_LOGIN</code>, <code className="font-mono">QONTO_SECRET_KEY</code> et <code className="font-mono">QONTO_IBAN</code> dans les variables d&apos;environnement Vercel (Qonto : Intégrations et partenariats, puis Clé API).
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="crm-kpi">
            <p className={`crm-kpi-num ${k.accent ? "text-ambre-fort" : ""}`}>{k.num}</p>
            <p className="crm-kpi-lbl">{k.label}</p>
          </div>
        ))}
      </div>

      {qontoConfigure() && <TesterQonto />}

      {/* À émettre */}
      <section className="crm-panel mb-6">
        <div className="crm-panel-h">
          <div>
            <p className="crm-panel-t">À émettre</p>
            <p className="text-[11.5px] text-blanc-faint">Transport terminé, facture pas encore émise (normalement traité par l&apos;envoi automatique du matin)</p>
          </div>
          {dues.length > 0 && (
            <ActionFacturation action="emettre" primary label={`Tout émettre (${dues.length})`}
              confirm={`Émettre et envoyer ${dues.length} facture${dues.length > 1 ? "s" : ""} via Qonto ? Une facture émise ne se supprime pas (avoir nécessaire).`} />
          )}
        </div>
        {dues.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-blanc-dim">Rien à émettre : toutes les missions terminées sont facturées.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead><tr><th>Mission</th><th>Transporteur</th><th>Fin du transport</th><th className="text-right">Prix mission</th><th className="text-right">Commission HT</th><th className="text-right">TTC</th><th></th></tr></thead>
              <tbody>
                {dues.map((m) => {
                  const mht = ht(m.commissionTtc);
                  return (
                    <tr key={m.id}>
                      <td><span className="font-mono text-blanc-faint">{m.numero ? `#${m.numero}` : "retour"}</span>{m.erreur && <p className="font-mono text-[11px] text-[#C2410C] max-w-[320px]">Échec : {m.erreur}</p>}</td>
                      <td className="font-semibold"><Link href={`/admin/transporteurs/${m.transporteurId}`} className="hover:underline">{m.transporteur}</Link></td>
                      <td className="font-mono text-[12px]">{jour(m.dateTransport)}</td>
                      <td className="text-right font-mono">{eur(m.prixTtc)} <span className="text-blanc-faint">× {m.taux} %</span></td>
                      <td className="text-right font-mono">{euro2(mht)}</td>
                      <td className="text-right font-mono font-semibold">{euro2(arrondi2(mht * (1 + TVA)))}</td>
                      <td className="text-right">
                        <ActionFacturation action="emettre" missionId={m.id} label={m.erreur ? "Réessayer" : "Émettre"}
                          confirm={`Émettre et envoyer la facture de ${m.transporteur} ?`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Factures émises */}
      <section className="crm-panel mb-6">
        <div className="crm-panel-h"><p className="crm-panel-t">Factures émises</p><span className="font-mono text-[11px] text-blanc-faint">{F.length}</span></div>
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead><tr><th>N°</th><th>Transporteur</th><th>Mission</th><th className="text-right">HT</th><th className="text-right">TTC</th><th>Statut</th><th>Émise</th><th></th></tr></thead>
            <tbody>
              {F.map((f) => (
                <tr key={f.id}>
                  <td className="font-mono text-[12px]">{f.numero ?? "—"}</td>
                  <td><Link href={`/admin/transporteurs/${f.transporteur_id}`} className="hover:underline">{f.transporteur?.raison_sociale ?? "—"}</Link></td>
                  <td className="font-mono text-[12px] whitespace-nowrap">{f.mission?.demande?.numero ? `#${f.mission.demande.numero}` : "retour"} · {jour(f.date_transport)}</td>
                  <td className="text-right font-mono">{euro2(Number(f.montant_ht))}</td>
                  <td className="text-right font-mono font-semibold">{euro2(Number(f.montant_ttc))}</td>
                  <td className="whitespace-nowrap">
                    <span className={`pill ${STATUT[f.statut]?.classe}`}>{STATUT[f.statut]?.label ?? f.statut}</span>
                    {f.nb_relances > 0 && <span className="font-mono text-[10.5px] text-blanc-faint ml-1.5">{f.nb_relances} relance{f.nb_relances > 1 ? "s" : ""}</span>}
                  </td>
                  <td className="text-blanc-dim whitespace-nowrap text-[12px]">{depuis(f.emise_le)}</td>
                  <td className="text-right">
                    {f.statut === "emise" && (
                      <span className="inline-flex gap-2">
                        <ActionFacturation action="renvoyer" factureId={f.id} label="Relancer" confirm="Renvoyer la facture au transporteur avec un rappel ?" />
                        <ActionFacturation action="payee" factureId={f.id} label="Marquer payée" confirm="Marquer cette facture payée (aussi dans Qonto) ?" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {F.length === 0 && <tr><td colSpan={8} className="text-center text-blanc-dim py-8">Aucune facture émise pour l&apos;instant.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Prochaines */}
      {prochaines.length > 0 && (
        <section className="crm-panel">
          <div className="crm-panel-h"><p className="crm-panel-t">Prochaines factures (transports des 14 prochains jours)</p></div>
          <ul>
            {prochaines.map((m) => (
              <li key={m.id} className="flex justify-between gap-4 px-4 py-2.5 border-b border-ligne last:border-0 text-[13px]">
                <span><span className="font-mono text-blanc-faint">{m.numero ? `#${m.numero}` : "retour"}</span> · {m.transporteur}</span>
                <span className="font-mono text-blanc-dim">facture le lendemain du {jour(m.dateTransport)} · {euro2(m.commissionTtc)} TTC</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
