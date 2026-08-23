import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoPage } from "../../_seo/SeoPage";
import { VILLES, getVille } from "@/lib/villes";
import { DEPARTEMENTS, getDepartement, departementDeVille } from "@/lib/departements";

// Route géographique unifiée : /location-autocar/[slug]
// résout soit une VILLE (versailles, rouen…) soit un DÉPARTEMENT (yvelines, eure…).

export function generateStaticParams() {
  return [
    ...VILLES.map((v) => ({ ville: v.slug })),
    ...DEPARTEMENTS.map((d) => ({ ville: d.slug })),
  ];
}

export async function generateMetadata(
  { params }: { params: Promise<{ ville: string }> }
): Promise<Metadata> {
  const { ville } = await params;
  const v = getVille(ville);
  if (v) {
    return {
      title: `Location d'autocar avec chauffeur ${v.dans} — devis comparés | DealBus`,
      description: `Louez un autocar avec chauffeur ${v.dans} (${v.dept}) : publiez votre trajet, recevez plusieurs devis de transporteurs vérifiés, comparez et choisissez. Gratuit, sans engagement. Retours à vide ${v.depuis} à prix cassé.`,
      alternates: { canonical: `https://dealbus.fr/location-autocar/${v.slug}` },
    };
  }
  const d = getDepartement(ville);
  if (d) {
    return {
      title: `Location d'autocar ${d.nom} (${d.code}) — bus avec chauffeur, devis comparés | DealBus`,
      description: `Location d'autocar avec chauffeur dans ${d.code === "75" ? "" : "le département "}${d.nom} : transporteurs vérifiés, devis fermes comparés, enchères et retours à vide. Gratuit côté client. ${d.villes.slice(0, 4).map((x) => x.nom).join(", ")}…`,
      alternates: { canonical: `https://dealbus.fr/location-autocar/${d.slug}` },
    };
  }
  return {};
}

export default async function ZonePage(
  { params }: { params: Promise<{ ville: string }> }
) {
  const { ville } = await params;
  const v = getVille(ville);
  if (v) return <PageVille v={v} />;
  const d = getDepartement(ville);
  if (d) return <PageDepartement d={d} />;
  notFound();
}

/* ============================ VILLE ============================ */
function PageVille({ v }: { v: NonNullable<ReturnType<typeof getVille>> }) {
  const dept = departementDeVille(v.slug);
  const voisines = VILLES.filter((x) => x.slug !== v.slug)
    .sort((a, b) => (a.region === v.region ? -1 : 0) - (b.region === v.region ? -1 : 0))
    .slice(0, 3);

  return (
    <SeoPage
      eyebrow={`${v.dept} · ${v.region}`}
      h1={<>Location d&apos;autocar avec chauffeur {v.dans}<span className="text-ambre">.</span></>}
      intro={`Un car pour votre association, votre école, votre entreprise ou votre mariage ${v.dans} ? Publiez votre trajet en 2 minutes : les transporteurs vérifiés qui couvrent votre secteur vous répondent avec des offres fermes — vous comparez et vous choisissez. Gratuit côté client, sans engagement.`}
      sections={[
        { titre: `Le transport de groupe ${v.dans}`, corps: <p>{v.contexte}</p> },
        {
          titre: `Les trajets les plus demandés ${v.depuis}`,
          corps: (
            <>
              <div className="card p-0 overflow-hidden mb-4">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="border-b border-ligne font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint">
                      <th className="text-left px-5 py-3">Destination</th>
                      <th className="text-right px-5 py-3">Distance</th>
                      <th className="text-left px-5 py-3 hidden sm:table-cell">Usage typique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.destinations.map((dst) => (
                      <tr key={dst.vers} className="border-b border-ligne/50 last:border-0">
                        <td className="px-5 py-3 font-semibold text-blanc">{v.nom} → {dst.vers}</td>
                        <td className="px-5 py-3 text-right font-mono text-blanc-dim">≈ {dst.km} km</td>
                        <td className="px-5 py-3 text-blanc-dim hidden sm:table-cell">{dst.usage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Quel que soit votre trajet — y compris hors de cette liste — le fonctionnement est identique :
                une demande, plusieurs offres fermes de professionnels licenciés, et votre choix en toute connaissance.
              </p>
            </>
          ),
        },
        {
          titre: `Les retours à vide ${v.depuis} : le bon plan local`,
          corps: (
            <p>
              {v.axesRetours}{" "}
              Sur DealBus, les transporteurs publient ces trajets déjà planifiés à prix fixe réduit — votre groupe
              réserve l&apos;autocar complet à une fraction du tarif normal.{" "}
              <Link href="/retours" className="text-ambre hover:underline">Consultez les retours à vide disponibles</Link>{" "}
              avant de publier une demande classique.
            </p>
          ),
        },
        {
          titre: "Des transporteurs vérifiés, des prix comparés",
          corps: (
            <p>
              Chaque autocariste inscrit sur DealBus est contrôlé — SIREN, licence de transport, assurance RC Pro —
              avant de pouvoir répondre à la moindre demande. Vous comparez leurs offres sur des critères objectifs
              (prix ferme, note, ancienneté, véhicule) sous anonymat mutuel jusqu&apos;à votre sélection. Et si vous préférez
              la mise en concurrence en direct, le <Link href="/#comment-ca-marche" className="text-ambre hover:underline">mode enchère</Link>{" "}
              fait baisser les prix sous vos yeux, à la clôture que vous fixez.
            </p>
          ),
        },
      ]}
      faq={[
        {
          q: `Combien coûte la location d'un autocar avec chauffeur ${v.dans} ?`,
          r: `Le prix dépend de la distance, de la durée, de la taille du véhicule et de la saison. C'est précisément pourquoi DealBus fait jouer la concurrence : pour un même trajet ${v.depuis}, les écarts entre transporteurs atteignent couramment 20 à 30 %. Publiez votre demande gratuitement pour obtenir des prix fermes et comparables.`,
        },
        {
          q: `Quels types de véhicules peut-on réserver ${v.dans} ?`,
          r: `Du minibus 8 places au grand tourisme 63 places, en passant par les autocars 30-53 places les plus courants. Précisez la taille de votre groupe dans la demande : seuls les transporteurs équipés répondront.`,
        },
        {
          q: `Combien de temps à l'avance faut-il réserver un bus ${v.dans} ?`,
          r: `2 à 4 semaines suffisent en période normale ; comptez 6 à 8 semaines pour les samedis de mai-juin (mariages) et les départs de vacances scolaires. En dernière minute, les retours à vide ${v.depuis} sont souvent la meilleure option.`,
        },
        {
          q: `Qu'est-ce qu'un retour à vide ${v.depuis} ?`,
          r: `C'est un trajet qu'un autocar effectue de toute façon, sans passagers, après une dépose. Le transporteur le publie sur DealBus à prix fixe réduit, et votre groupe peut réserver le véhicule complet. ${v.axesRetours}`,
        },
      ]}
      related={[
        ...(dept ? [{ href: `/location-autocar/${dept.slug}`, label: `Location d'autocar — ${dept.nom} (${dept.code})` }] : []),
        ...voisines.slice(0, 2).map((x) => ({ href: `/location-autocar/${x.slug}`, label: `Location d'autocar ${x.dans}` })),
        { href: "/location-autocar", label: "Location d'autocar — guide complet" },
        { href: "/reglementation", label: "Réglementation autocar" },
      ]}
    />
  );
}

/* ========================= DÉPARTEMENT ========================= */
function PageDepartement({ d }: { d: NonNullable<ReturnType<typeof getDepartement>> }) {
  const voisins = DEPARTEMENTS.filter((x) => x.slug !== d.slug)
    .sort((a, b) => (a.region === d.region ? -1 : 0) - (b.region === d.region ? -1 : 0))
    .slice(0, 3);

  return (
    <SeoPage
      eyebrow={`Département ${d.code} · ${d.region}`}
      h1={<>Location d&apos;autocar — {d.nom} ({d.code})<span className="text-ambre">.</span></>}
      intro={`Besoin d'un autocar avec chauffeur dans ${d.code === "75" ? "" : "le département "}${d.nom} ? Publiez votre trajet gratuitement : les transporteurs vérifiés qui couvrent le ${d.code} vous répondent avec des devis fermes — ou s'affrontent en enchère si vous préférez. Comparez, choisissez, partez.`}
      sections={[
        { titre: `Le transport de groupe dans ${d.code === "75" ? "" : "le "}${d.nom}`, corps: <p>{d.contexte}</p> },
        {
          titre: "Les principales villes desservies",
          corps: (
            <>
              <div className="flex flex-wrap gap-2.5 mb-4">
                {d.villes.map((ville) =>
                  ville.slug ? (
                    <Link key={ville.nom} href={`/location-autocar/${ville.slug}`}
                      className="card px-4 py-2 text-[13.5px] font-semibold text-ambre hover:border-ambre/50 transition">
                      {ville.nom} →
                    </Link>
                  ) : (
                    <span key={ville.nom} className="card px-4 py-2 text-[13.5px] text-blanc-dim">
                      {ville.nom}
                    </span>
                  )
                )}
              </div>
              <p>
                Et toutes les communes du département : les transporteurs définissent leurs zones par département
                entier — où que vous soyez dans le {d.code}, votre demande leur parvient.
              </p>
            </>
          ),
        },
        {
          titre: `Les retours à vide dans le ${d.code}`,
          corps: (
            <p>
              {d.axesRetours}{" "}
              <Link href="/retours" className="text-ambre hover:underline">Consultez le tableau des retours à vide</Link>{" "}
              avant toute demande classique : un autocar complet à prix réduit passe peut-être par chez vous.
            </p>
          ),
        },
        {
          titre: "Des transporteurs vérifiés, un prix juste",
          corps: (
            <p>
              Chaque autocariste inscrit est contrôlé — SIREN, licence de transport de personnes, assurance RC Pro —
              avant de pouvoir répondre. Vous comparez des offres fermes sous anonymat mutuel, avec notes et avis
              vérifiés à l&apos;appui, et le client règle le transporteur en direct : DealBus ne touche jamais votre argent.
            </p>
          ),
        },
      ]}
      faq={[
        {
          q: `Combien coûte la location d'un autocar dans ${d.code === "75" ? "" : "le "}${d.nom} ?`,
          r: `Tout dépend du trajet, de la durée et de la saison — c'est pourquoi DealBus fait jouer la concurrence entre les transporteurs du ${d.code} et des départements voisins : les écarts atteignent couramment 20 à 30 % pour une même prestation. La demande est gratuite et sans engagement.`,
        },
        {
          q: `Quels transporteurs couvrent le département ${d.code} ?`,
          r: `Les autocaristes définissent leurs zones d'intervention par département : votre demande dans le ${d.code} est envoyée à tous les professionnels vérifiés qui l'ont sélectionné — locaux comme limitrophes, ce qui élargit la concurrence.`,
        },
        {
          q: `Peut-on louer un minibus ou un grand autocar dans ${d.code === "75" ? "" : "le "}${d.nom} ?`,
          r: `Oui : du minibus 8 places au grand tourisme 63 places. Indiquez simplement la taille de votre groupe — seuls les transporteurs équipés du véhicule adapté répondront.`,
        },
      ]}
      related={[
        ...voisins.map((x) => ({ href: `/location-autocar/${x.slug}`, label: `Location d'autocar — ${x.nom} (${x.code})` })),
        { href: "/location-autocar", label: "Location d'autocar — guide complet" },
        { href: "/reglementation", label: "Réglementation autocar" },
      ]}
    />
  );
}
