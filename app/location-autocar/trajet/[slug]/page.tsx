import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoPage, type Fil } from "../../../_seo/SeoPage";
import { TRAJETS, getTrajet, trajetsDeVille } from "@/lib/trajets";
import { getVille } from "@/lib/villes";
import { estimerTrajet, formatEuros } from "@/lib/seo-contenu";

export function generateStaticParams() {
  return TRAJETS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const t = getTrajet(slug);
  if (!t) return {};
  const f = estimerTrajet(t.km);
  return {
    title: `Location d'autocar ${t.depart} → ${t.arrivee} — devis comparés | DealBus`,
    description: `Louer un bus avec chauffeur de ${t.depart} à ${t.arrivee} (≈ ${t.km} km, ${t.duree}) : comptez ${formatEuros(f.bas)} à ${formatEuros(f.haut)} l'aller-retour à titre indicatif. Recevez plusieurs devis fermes de transporteurs vérifiés. Gratuit, sans engagement.`,
    alternates: { canonical: `https://dealbus.fr/location-autocar/trajet/${t.slug}` },
  };
}

export default async function TrajetPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const t = getTrajet(slug);
  if (!t) notFound();

  const ville = t.departSlug ? getVille(t.departSlug) : undefined;
  const autres = t.departSlug
    ? trajetsDeVille(t.departSlug).filter((x) => x.slug !== t.slug)
    : TRAJETS.filter((x) => x.slug !== t.slug).slice(0, 3);

  const f = estimerTrajet(t.km);
  const fSimple = estimerTrajet(t.km / 2);

  const fil: Fil[] = [{ href: "/location-autocar", label: "Location d'autocar" }];
  if (ville) fil.push({ href: `/location-autocar/${ville.slug}`, label: ville.nom });
  fil.push({ href: `/location-autocar/trajet/${t.slug}`, label: `${t.depart} → ${t.arrivee}` });

  return (
    <SeoPage
      fil={fil}
      eyebrow={`Liaison · ≈ ${t.km} km`}
      h1={<>Location d&apos;autocar {t.depart} → {t.arrivee}<span className="text-ambre">.</span></>}
      intro={`Un car avec chauffeur de ${t.depart} à ${t.arrivee} ? Publiez votre trajet en 2 minutes : les transporteurs vérifiés qui couvrent cette liaison vous répondent avec des offres fermes, et vous comparez. Gratuit côté client, sans engagement.`}
      sections={[
        {
          titre: "La liaison en bref",
          corps: (
            <>
              <div className="card p-0 overflow-hidden mb-4">
                <table className="w-full text-[14px]">
                  <tbody>
                    <tr className="border-b border-ligne/50">
                      <td className="px-5 py-3 text-blanc-dim">Distance (aller simple)</td>
                      <td className="px-5 py-3 text-right font-mono text-blanc">≈ {t.km} km</td>
                    </tr>
                    <tr className="border-b border-ligne/50">
                      <td className="px-5 py-3 text-blanc-dim">Temps de route</td>
                      <td className="px-5 py-3 text-right text-blanc">{t.duree}</td>
                    </tr>
                    <tr className="border-b border-ligne/50">
                      <td className="px-5 py-3 text-blanc-dim">Ordre de prix — aller simple</td>
                      <td className="px-5 py-3 text-right font-mono text-ambre whitespace-nowrap">
                        {formatEuros(fSimple.bas)}–{formatEuros(fSimple.haut)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-blanc-dim">Ordre de prix — aller-retour journée</td>
                      <td className="px-5 py-3 text-right font-mono text-ambre whitespace-nowrap">
                        {formatEuros(f.bas)}–{formatEuros(f.haut)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[13.5px] text-blanc-faint">
                Fourchettes indicatives pour un autocar de 50 places, hors haute saison, carburant et péages inclus.
                Ce ne sont pas des devis : seule une offre ferme reçue d&apos;un transporteur l&apos;engage.
              </p>
            </>
          ),
        },
        { titre: `Qui réserve ce trajet`, corps: (
          <>
            <p>{t.contexte}</p>
            <ul className="space-y-1.5 mt-3">
              {t.usages.map((u) => (
                <li key={u} className="text-blanc-dim">— {u}</li>
              ))}
            </ul>
          </>
        ) },
        { titre: "Le conseil d'exploitation", corps: <p>{t.conseil}</p> },
        {
          titre: "Payer moins cher sur cette liaison",
          corps: (
            <p>
              Trois leviers, dans l&apos;ordre d&apos;efficacité. Publier tôt : un transporteur qui a du planning
              libre chiffre plus bas que celui qui doit sortir un véhicule en extra. Comparer plusieurs offres
              fermes plutôt que d&apos;accepter le premier devis. Et si vos dates peuvent bouger de quelques jours,{" "}
              <Link href="/retours" className="text-ambre hover:underline">regarder les retours à vide</Link>{" "}
              publiés sur cet axe : un autocar complet à une fraction du tarif normal.
            </p>
          ),
        },
      ]}
      faq={[
        {
          q: `Combien coûte un autocar de ${t.depart} à ${t.arrivee} ?`,
          r: `À titre indicatif, comptez ${formatEuros(fSimple.bas)} à ${formatEuros(fSimple.haut)} pour un aller simple et ${formatEuros(f.bas)} à ${formatEuros(f.haut)} pour un aller-retour dans la journée, avec un autocar de 50 places, hors haute saison. Le prix réel dépend de l'amplitude horaire du conducteur, du nombre d'arrêts et du planning du transporteur ce jour-là. Publiez votre demande pour obtenir des prix fermes et comparables.`,
        },
        {
          q: `Combien de temps dure le trajet ${t.depart} → ${t.arrivee} en car ?`,
          r: `${t.duree} de temps de route effectif. À cela s'ajoutent les pauses réglementaires : un conducteur doit interrompre sa conduite 45 minutes après 4 h 30 de volant. Sur un aller-retour dans la journée, ces pauses entrent dans le calcul de l'amplitude et donc dans le prix.`,
        },
        {
          q: `Peut-on faire ${t.depart} → ${t.arrivee} en aller-retour dans la journée ?`,
          r: t.km <= 250
            ? `Oui, largement : la liaison laisse du temps sur place tout en restant dans l'amplitude réglementaire du conducteur. C'est la formule la plus économique, car elle évite l'hébergement du conducteur.`
            : `C'est possible mais tendu : ${t.duree} dans chaque sens, plus les pauses réglementaires, laissent peu de marge sur place. Selon votre programme, un séjour de deux jours revient parfois moins cher qu'un aller-retour nécessitant un double équipage.`,
        },
        {
          q: `Le chauffeur, le carburant et les péages sont-ils inclus ?`,
          r: `Oui. Les offres reçues sur DealBus sont des prix TTC tout compris : véhicule, conducteur, carburant, péages et frais de route. Restent éventuellement à votre charge les parkings spécifiques, les repas de votre groupe et, sur un séjour, l'hébergement du conducteur — précisé dans l'offre.`,
        },
        {
          q: `Combien d'offres vais-je recevoir sur ce trajet ?`,
          r: `Cela dépend de la densité de transporteurs sur l'axe et de vos dates. Les autocaristes vérifiés qui couvrent le département de départ sont notifiés dès la publication, et les premières offres arrivent souvent en quelques heures. La demande est gratuite et sans engagement : vous n'êtes tenu de rien tant que vous n'avez pas sélectionné une offre.`,
        },
      ]}
      related={[
        ...(ville ? [{ href: `/location-autocar/${ville.slug}`, label: `Location d'autocar ${ville.dans}` }] : []),
        ...autres.slice(0, 3).map((x) => ({
          href: `/location-autocar/trajet/${x.slug}`,
          label: `Autocar ${x.depart} → ${x.arrivee}`,
        })),
        { href: "/location-autocar", label: "Location d'autocar — guide complet" },
        { href: "/reglementation", label: "Temps de conduite et amplitude" },
      ]}
    />
  );
}
