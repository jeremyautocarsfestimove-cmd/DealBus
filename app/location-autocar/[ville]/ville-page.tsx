import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoPage } from "../../_seo/SeoPage";
import { VILLES, getVille } from "@/lib/villes";

export function generateStaticParams() {
  return VILLES.map((v) => ({ ville: v.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ ville: string }> }
): Promise<Metadata> {
  const { ville } = await params;
  const v = getVille(ville);
  if (!v) return {};
  return {
    title: `Location d'autocar avec chauffeur ${v.dans} — devis comparés | DealBus`,
    description: `Louez un autocar avec chauffeur ${v.dans} (${v.dept}) : publiez votre trajet, recevez plusieurs devis de transporteurs vérifiés, comparez et choisissez. Gratuit, sans engagement. Retours à vide ${v.depuis} à prix cassé.`,
    alternates: { canonical: `https://dealbus.fr/location-autocar/${v.slug}` },
  };
}

export default async function VillePage(
  { params }: { params: Promise<{ ville: string }> }
) {
  const { ville } = await params;
  const v = getVille(ville);
  if (!v) notFound();

  const voisines = VILLES.filter((x) => x.slug !== v.slug)
    .sort((a, b) => (a.region === v.region ? -1 : 0) - (b.region === v.region ? -1 : 0))
    .slice(0, 3);

  return (
    <SeoPage
      eyebrow={`${v.dept} · ${v.region}`}
      h1={<>Location d&apos;autocar avec chauffeur {v.dans}<span className="text-ambre">.</span></>}
      intro={`Un car pour votre association, votre école, votre entreprise ou votre mariage ${v.dans} ? Publiez votre trajet en 2 minutes : les transporteurs vérifiés qui couvrent votre secteur vous répondent avec des offres fermes — vous comparez et vous choisissez. Gratuit côté client, sans engagement.`}
      sections={[
        {
          titre: `Le transport de groupe ${v.dans}`,
          corps: <p>{v.contexte}</p>,
        },
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
                    {v.destinations.map((d) => (
                      <tr key={d.vers} className="border-b border-ligne/50 last:border-0">
                        <td className="px-5 py-3 font-semibold text-blanc">{v.nom} → {d.vers}</td>
                        <td className="px-5 py-3 text-right font-mono text-blanc-dim">≈ {d.km} km</td>
                        <td className="px-5 py-3 text-blanc-dim hidden sm:table-cell">{d.usage}</td>
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
              avant de publier une demande classique : la bonne affaire est peut-être déjà en ligne.
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
        ...voisines.map((x) => ({ href: `/location-autocar/${x.slug}`, label: `Location d'autocar ${x.dans}` })),
        { href: "/location-autocar", label: "Location d'autocar — guide complet" },
        { href: "/reglementation", label: "Réglementation autocar" },
      ]}
    />
  );
}
