import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoPage, type Fil } from "../../_seo/SeoPage";
import { VILLES, getVille } from "@/lib/villes";
import { DEPARTEMENTS, getDepartement, departementDeVille } from "@/lib/departements";
import { REGIONS, getRegion, departementsDeRegion, regionParNom } from "@/lib/regions";
import { VILLES as TOUTES_VILLES } from "@/lib/villes";
import { trajetsDeVille } from "@/lib/trajets";
import {
  estimerTrajet, formatEuros, faqZone, choisir,
  ACCROCHES_TITRE_TRAJETS, ACCROCHES_TITRE_SAISON,
  type ContexteZone,
} from "@/lib/seo-contenu";

// Route géographique unifiée : /location-autocar/[slug]
// résout une VILLE (versailles…), un DÉPARTEMENT (yvelines…) ou une RÉGION.

export function generateStaticParams() {
  return [
    ...VILLES.map((v) => ({ ville: v.slug })),
    ...DEPARTEMENTS.map((d) => ({ ville: d.slug })),
    ...REGIONS.map((r) => ({ ville: r.slug })),
  ];
}

const FIL_BASE: Fil = { href: "/location-autocar", label: "Location d'autocar" };

/* ======================= TABLEAU TRAJETS + PRIX ======================= */
function TableTrajets({
  origine, trajets,
}: {
  origine: string;
  trajets: { vers: string; km: number; usage: string }[];
}) {
  return (
    <>
      <div className="card p-0 overflow-hidden mb-4">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-ligne font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint">
              <th className="text-left px-5 py-3">Trajet</th>
              <th className="text-right px-5 py-3">Distance</th>
              <th className="text-right px-5 py-3">Ordre de prix</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Usage typique</th>
            </tr>
          </thead>
          <tbody>
            {trajets.map((t) => {
              const f = estimerTrajet(t.km);
              return (
                <tr key={t.vers} className="border-b border-ligne/50 last:border-0">
                  <td className="px-5 py-3 font-semibold text-blanc">{origine} → {t.vers}</td>
                  <td className="px-5 py-3 text-right font-mono text-blanc-dim whitespace-nowrap">≈ {t.km} km</td>
                  <td className="px-5 py-3 text-right font-mono text-ambre whitespace-nowrap">
                    {formatEuros(f.bas)}–{formatEuros(f.haut)}
                  </td>
                  <td className="px-5 py-3 text-blanc-dim hidden md:table-cell">{t.usage}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[13.5px] text-blanc-faint">
        Ordres de grandeur pour un autocar de 50 places en aller-retour dans la journée, hors haute saison,
        carburant et péages inclus. Ce ne sont pas des devis : le prix réel dépend de l&apos;amplitude horaire
        du conducteur et du planning du transporteur ce jour-là. Seule une offre ferme engage un professionnel.
      </p>
    </>
  );
}

/* ============================ METADATA ============================ */
export async function generateMetadata(
  { params }: { params: Promise<{ ville: string }> }
): Promise<Metadata> {
  const { ville } = await params;

  const v = getVille(ville);
  if (v) {
    const court = [...v.destinations].sort((a, b) => a.km - b.km)[0];
    const f = court ? estimerTrajet(court.km) : null;
    return {
      title: `Location d'autocar avec chauffeur ${v.dans} — devis comparés | DealBus`,
      description: f
        ? `Louez un autocar avec chauffeur ${v.dans} (${v.dept}). ${v.nom} → ${court.vers} : ${formatEuros(f.bas)} à ${formatEuros(f.haut)} l'aller-retour à titre indicatif. Devis fermes de transporteurs vérifiés, comparés en une demande. Gratuit, sans engagement.`
        : `Louez un autocar avec chauffeur ${v.dans} (${v.dept}) : devis fermes de transporteurs vérifiés, comparés en une seule demande. Gratuit, sans engagement.`,
      alternates: { canonical: `https://dealbus.fr/location-autocar/${v.slug}` },
    };
  }

  const r = getRegion(ville);
  if (r) {
    const depts = departementsDeRegion(r.nom);
    return {
      title: `Location d'autocar ${r.dans} — bus avec chauffeur, devis comparés | DealBus`,
      description: `Location d'autocar avec chauffeur ${r.dans} : ${depts.length} départements couverts, transporteurs vérifiés, devis fermes comparés et retours à vide à prix réduit. Gratuit côté client, sans engagement.`,
      alternates: { canonical: `https://dealbus.fr/location-autocar/${r.slug}` },
    };
  }

  const d = getDepartement(ville);
  if (d) {
    const court = [...d.trajets].sort((a, b) => a.km - b.km)[0];
    const f = court ? estimerTrajet(court.km) : null;
    const art = d.code === "75" ? "" : "le département ";
    return {
      title: `Location d'autocar ${d.nom} (${d.code}) — bus avec chauffeur, devis comparés | DealBus`,
      description: f
        ? `Location d'autocar avec chauffeur dans ${art}${d.nom} : ${d.villes.length} villes desservies, ordres de prix dès ${formatEuros(f.bas)} l'aller-retour, devis fermes de transporteurs vérifiés. Gratuit côté client.`
        : `Location d'autocar avec chauffeur dans ${art}${d.nom} : transporteurs vérifiés, devis fermes comparés, retours à vide. Gratuit côté client.`,
      alternates: { canonical: `https://dealbus.fr/location-autocar/${d.slug}` },
    };
  }

  return {};
}

/* ============================== ROUTAGE ============================== */
export default async function ZonePage(
  { params }: { params: Promise<{ ville: string }> }
) {
  const { ville } = await params;
  const v = getVille(ville);
  if (v) return <PageVille v={v} />;
  const d = getDepartement(ville);
  if (d) return <PageDepartement d={d} />;
  const r = getRegion(ville);
  if (r) return <PageRegion r={r} />;
  notFound();
}

/* =============================== VILLE =============================== */
function PageVille({ v }: { v: NonNullable<ReturnType<typeof getVille>> }) {
  const dept = departementDeVille(v.slug);
  const region = regionParNom(v.region);
  const voisines = VILLES.filter((x) => x.slug !== v.slug && x.region === v.region).slice(0, 3);
  const liaisons = trajetsDeVille(v.slug);

  const tries = [...v.destinations].sort((a, b) => a.km - b.km);
  const ctx: ContexteZone = {
    slug: v.slug,
    dans: v.dans,
    depuis: v.depuis,
    nom: v.nom,
    trajetCourt: tries[0],
    trajetLong: tries[tries.length - 1],
    poles: v.destinations.map((d) => d.vers),
  };

  const fil: Fil[] = [FIL_BASE];
  if (region) fil.push({ href: `/location-autocar/${region.slug}`, label: region.nom });
  if (dept) fil.push({ href: `/location-autocar/${dept.slug}`, label: `${dept.nom} (${dept.code})` });
  fil.push({ href: `/location-autocar/${v.slug}`, label: v.nom });

  return (
    <SeoPage
      fil={fil}
      eyebrow={`${v.dept} · ${v.region}`}
      h1={<>Location d&apos;autocar avec chauffeur {v.dans}<span className="text-ambre">.</span></>}
      intro={`Un car pour votre association, votre école, votre entreprise ou votre mariage ${v.dans} ? Publiez votre trajet en 2 minutes : les transporteurs vérifiés qui couvrent votre secteur vous répondent avec des offres fermes — vous comparez et vous choisissez. Gratuit côté client, sans engagement.`}
      sections={[
        { titre: `Le transport de groupe ${v.dans}`, corps: <p>{v.contexte}</p> },
        {
          titre: `${choisir(v.slug, ACCROCHES_TITRE_TRAJETS)} ${v.depuis}`,
          corps: (
            <>
              <TableTrajets origine={v.nom} trajets={v.destinations} />
              <p>
                Quel que soit votre trajet, y compris hors de cette liste, le fonctionnement est identique :
                une demande, plusieurs offres fermes de professionnels licenciés, et votre choix en connaissance de cause.
              </p>
            </>
          ),
        },
        {
          titre: choisir(v.slug, ACCROCHES_TITRE_SAISON, 1),
          corps: <p>{v.saison}</p>,
        },
        ...(liaisons.length ? [{
          titre: `Nos pages liaison au départ ${v.dans.replace(/^à /, "de ").replace(/^au /, "du ")}`,
          corps: (
            <>
              <div className="flex flex-wrap gap-2.5 mb-4">
                {liaisons.map((t) => (
                  <Link key={t.slug} href={`/location-autocar/trajet/${t.slug}`}
                    className="card px-4 py-2 text-[13.5px] font-semibold text-ambre hover:border-ambre/50 transition">
                    {t.depart} → {t.arrivee} →
                  </Link>
                ))}
              </div>
              <p>
                Chaque liaison détaille la distance, le temps de route, l&apos;ordre de prix constaté et les
                contraintes propres au trajet.
              </p>
            </>
          ),
        }] : []),
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
              Chaque autocariste inscrit sur DealBus est contrôlé (SIREN, licence de transport, assurance RC Pro)
              avant de pouvoir répondre à la moindre demande. Vous comparez leurs offres sur des critères objectifs
              (prix ferme, note, ancienneté, véhicule) sous anonymat mutuel jusqu&apos;à votre sélection. Et si vous préférez
              la mise en concurrence en direct, le <Link href="/#comment-ca-marche" className="text-ambre hover:underline">mode enchère</Link>{" "}
              fait baisser les prix sous vos yeux, à la clôture que vous fixez.
            </p>
          ),
        },
      ]}
      faq={faqZone(ctx, 5)}
      related={[
        ...liaisons.slice(0, 2).map((t) => ({
          href: `/location-autocar/trajet/${t.slug}`,
          label: `Autocar ${t.depart} → ${t.arrivee}`,
        })),
        ...(dept ? [{ href: `/location-autocar/${dept.slug}`, label: `Location d'autocar — ${dept.nom} (${dept.code})` }] : []),
        ...voisines.slice(0, 2).map((x) => ({ href: `/location-autocar/${x.slug}`, label: `Location d'autocar ${x.dans}` })),
        { href: "/location-autocar", label: "Location d'autocar — guide complet" },
        { href: "/reglementation", label: "Réglementation autocar" },
      ]}
    />
  );
}

/* ============================ DÉPARTEMENT ============================ */
function PageDepartement({ d }: { d: NonNullable<ReturnType<typeof getDepartement>> }) {
  const region = regionParNom(d.region);
  const voisins = DEPARTEMENTS.filter((x) => x.slug !== d.slug && x.region === d.region).slice(0, 3);
  const art = d.code === "75" ? "" : "le ";
  const artLong = d.code === "75" ? "" : "le département ";
  const origine = d.villes[0]?.nom ?? d.nom;

  const tries = [...d.trajets].sort((a, b) => a.km - b.km);
  const ctx: ContexteZone = {
    slug: d.slug,
    dans: `dans ${artLong}${d.nom}`,
    depuis: `depuis ${art}${d.code === "75" ? "Paris" : d.nom}`,
    nom: origine,
    trajetCourt: tries[0],
    trajetLong: tries[tries.length - 1],
    poles: d.villes.map((v) => v.nom),
  };

  const fil: Fil[] = [FIL_BASE];
  if (region) fil.push({ href: `/location-autocar/${region.slug}`, label: region.nom });
  fil.push({ href: `/location-autocar/${d.slug}`, label: `${d.nom} (${d.code})` });

  return (
    <SeoPage
      fil={fil}
      eyebrow={`Département ${d.code} · ${d.region}`}
      h1={<>Location d&apos;autocar — {d.nom} ({d.code})<span className="text-ambre">.</span></>}
      intro={`Besoin d'un autocar avec chauffeur dans ${artLong}${d.nom} ? Publiez votre trajet gratuitement : les transporteurs vérifiés qui couvrent le ${d.code} vous répondent avec des devis fermes, ou s'affrontent en enchère si vous préférez. Comparez, choisissez, partez.`}
      sections={[
        { titre: `Le transport de groupe dans ${art}${d.nom}`, corps: <p>{d.contexte}</p> },
        {
          titre: `${choisir(d.slug, ACCROCHES_TITRE_TRAJETS)} au départ du ${d.code}`,
          corps: (
            <>
              <TableTrajets origine={origine} trajets={d.trajets} />
              <p>
                Ces trajets ne sont que les plus fréquents : les transporteurs du {d.code} répondent à toute
                demande au départ du département, y compris les séjours de plusieurs jours et les liaisons
                transfrontalières.
              </p>
            </>
          ),
        },
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
              Chaque autocariste inscrit est contrôlé (SIREN, licence de transport de personnes, assurance RC Pro)
              avant de pouvoir répondre. Vous comparez des offres fermes sous anonymat mutuel, avec notes et avis
              vérifiés à l&apos;appui, et le client règle le transporteur en direct : DealBus ne touche jamais votre argent.
            </p>
          ),
        },
      ]}
      faq={faqZone(ctx, 5)}
      related={[
        ...(region ? [{ href: `/location-autocar/${region.slug}`, label: `Location d'autocar ${region.dans}` }] : []),
        ...voisins.slice(0, 2).map((x) => ({ href: `/location-autocar/${x.slug}`, label: `Location d'autocar — ${x.nom} (${x.code})` })),
        { href: "/location-autocar", label: "Location d'autocar — guide complet" },
        { href: "/reglementation", label: "Réglementation autocar" },
      ]}
    />
  );
}

/* ============================== RÉGION ============================== */
function PageRegion({ r }: { r: NonNullable<ReturnType<typeof getRegion>> }) {
  const depts = departementsDeRegion(r.nom);
  const villesPhares = TOUTES_VILLES.filter((v) => v.region === r.nom).slice(0, 6);
  const autresRegions = REGIONS.filter((x) => x.slug !== r.slug).slice(0, 3);

  // Trajets types de la région : dédoublonnés sur la destination, les 5 plus courts.
  const trajetsRegion = depts
    .flatMap((d) => d.trajets.map((t) => ({ ...t, origine: d.villes[0]?.nom ?? d.nom })))
    .filter((t, i, arr) => arr.findIndex((x) => x.vers === t.vers) === i)
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);

  const ctx: ContexteZone = {
    slug: r.slug,
    dans: r.dans,
    depuis: `depuis ${r.nom}`,
    nom: r.nom,
    trajetCourt: trajetsRegion[0],
    trajetLong: trajetsRegion[trajetsRegion.length - 1],
    poles: villesPhares.length ? villesPhares.map((v) => v.nom) : depts.map((d) => d.nom),
  };

  const fil: Fil[] = [FIL_BASE, { href: `/location-autocar/${r.slug}`, label: r.nom }];

  return (
    <SeoPage
      fil={fil}
      eyebrow={`Région · ${r.nom}`}
      h1={<>Location d&apos;autocar {r.dans}<span className="text-ambre">.</span></>}
      intro={`Un autocar avec chauffeur ${r.dans} ? Publiez votre trajet gratuitement : les transporteurs vérifiés des ${depts.length} départements de la région — et des territoires limitrophes — vous répondent avec des devis fermes, ou s'affrontent en enchère si vous préférez. Comparez, choisissez, partez.`}
      sections={[
        { titre: `Le transport de groupe ${r.dans}`, corps: <p>{r.contexte}</p> },
        {
          titre: choisir(r.slug, ACCROCHES_TITRE_SAISON, 2),
          corps: <p>{r.saison}</p>,
        },
        ...(trajetsRegion.length ? [{
          titre: `${choisir(r.slug, ACCROCHES_TITRE_TRAJETS, 3)} ${r.dans}`,
          corps: (
            <>
              <div className="card p-0 overflow-hidden mb-4">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="border-b border-ligne font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint">
                      <th className="text-left px-5 py-3">Trajet</th>
                      <th className="text-right px-5 py-3">Distance</th>
                      <th className="text-right px-5 py-3">Ordre de prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trajetsRegion.map((t) => {
                      const f = estimerTrajet(t.km);
                      return (
                        <tr key={t.vers} className="border-b border-ligne/50 last:border-0">
                          <td className="px-5 py-3 font-semibold text-blanc">{t.origine} → {t.vers}</td>
                          <td className="px-5 py-3 text-right font-mono text-blanc-dim whitespace-nowrap">≈ {t.km} km</td>
                          <td className="px-5 py-3 text-right font-mono text-ambre whitespace-nowrap">
                            {formatEuros(f.bas)}–{formatEuros(f.haut)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[13.5px] text-blanc-faint">
                Ordres de grandeur pour un autocar de 50 places en aller-retour dans la journée, hors haute saison.
                Le prix réel dépend du planning du transporteur : seule une offre ferme engage un professionnel.
              </p>
            </>
          ),
        }] : []),
        {
          titre: "Les départements couverts",
          corps: (
            <>
              <div className="flex flex-wrap gap-2.5 mb-4">
                {depts.map((d) => (
                  <Link key={d.slug} href={`/location-autocar/${d.slug}`}
                    className="card px-4 py-2 text-[13.5px] font-semibold text-ambre hover:border-ambre/50 transition">
                    {d.nom} ({d.code}) →
                  </Link>
                ))}
              </div>
              <p>
                Chaque page département détaille les villes desservies, les trajets types et les
                spécificités locales du marché.
              </p>
            </>
          ),
        },
        ...(villesPhares.length ? [{
          titre: "Les villes les plus demandées",
          corps: (
            <div className="flex flex-wrap gap-2.5">
              {villesPhares.map((v) => (
                <Link key={v.slug} href={`/location-autocar/${v.slug}`}
                  className="card px-4 py-2 text-[13.5px] text-blanc-dim hover:text-blanc hover:border-ligne-strong transition">
                  {v.nom}
                </Link>
              ))}
            </div>
          ),
        }] : []),
        {
          titre: `Les retours à vide ${r.dans}`,
          corps: (
            <p>
              {r.axesRetours}{" "}
              <Link href="/retours" className="text-ambre hover:underline">Consultez le tableau des retours à vide</Link>{" "}
              avant toute demande classique : un autocar complet à prix réduit passe peut-être par chez vous.
            </p>
          ),
        },
      ]}
      faq={faqZone(ctx, 5)}
      related={[
        ...autresRegions.map((x) => ({ href: `/location-autocar/${x.slug}`, label: `Location d'autocar ${x.dans}` })),
        { href: "/location-autocar", label: "Location d'autocar — guide complet" },
        { href: "/reglementation", label: "Réglementation autocar" },
      ]}
    />
  );
}
