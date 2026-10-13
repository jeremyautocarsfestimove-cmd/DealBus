import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CarteCouverture } from "@/components/CarteCouverture";
import { QuickDemandeForm } from "@/components/QuickDemandeForm";
import { FEATURES } from "@/lib/features";

// Home en bandes pleine largeur. Le rythme repose sur quatre valeurs
// (blanc, asphalte-2, asphalte-3, .sombre) et jamais sur une teinte :
// l'ambre reste le seul accent, comme sur le reste du site.

const STATS = [
  { num: "0 €", label: "Côté client, sans condition" },
  { num: "9-5 %", label: "Commission au succès, la plus basse du marché" },
  { num: "100 %", label: "Licences & RC Pro contrôlées" },
  { num: "24 h", label: "Premières offres, en général" },
];

// Destinations mises en avant sur la section "Où partez-vous". Chaque puce
// pointe vers sa page liaison : c'est à la fois l'accroche et un lien interne
// de la home vers le bas de la pyramide SEO.
const ENVIES = [
  { label: "Disneyland Paris", href: "/location-autocar/trajet/paris-disneyland" },
  { label: "Le Puy du Fou", href: "/location-autocar/trajet/paris-puy-du-fou" },
  { label: "Le Mont-Saint-Michel", href: "/location-autocar/trajet/paris-mont-saint-michel" },
  { label: "Les plages du Débarquement", href: "/location-autocar/trajet/caen-plages-du-debarquement" },
  { label: "Un week-end à Deauville", href: "/location-autocar/trajet/paris-deauville" },
  { label: "Les caves de champagne", href: "/location-autocar/trajet/paris-reims" },
  { label: "Le Parc Astérix", href: "/location-autocar/trajet/saint-germain-en-laye-parc-asterix" },
  { label: "Londres", href: "/location-autocar/trajet/paris-londres" },
];

const ETAPES = [
  {
    tag: "2 min", tagCls: "bg-ambre-dim text-ambre-fort",
    titre: "Décrivez le trajet",
    texte: "Départ, arrivée, dates, nombre de passagers. Pas de nom, pas de téléphone : la demande part anonymisée aux transporteurs de votre région.",
  },
  {
    tag: "24 h", tagCls: "bg-bleunuit text-bleunuit-fort",
    titre: "Recevez les offres",
    texte: "Les autocaristes vérifiés répondent chacun avec une offre unique et définitive : prix ferme, véhicule, année, conditions.",
  },
  {
    tag: "Vous décidez", tagCls: "bg-vert-dim text-vert",
    titre: "Choisissez, ou pas",
    texte: "Vous retenez une offre : les coordonnées s'échangent, vous réglez le transporteur directement. Ou vous ne donnez pas suite.",
  },
];

const ETAPES_ENCHERE = [
  "Une fenêtre d'enchère s'ouvre (2 h) avec un prix de départ indicatif.",
  "Les transporteurs surenchérissent à la baisse, anonymement, par paliers d'au moins 1 %.",
  "À la clôture, vous validez (ou non) le meilleur prix — identité révélée à ce moment seulement.",
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative overflow-x-clip">

        {/* ---------- 1. HERO — photo pleine, sans voile ---------- */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image src="/img/hero.jpg" alt="" fill priority className="object-cover" />
            {/* Aucun voile : la photo doit être claire par elle-même, sinon le
                titre en encre sombre devient illisible. Seul le fondu bas
                raccorde l'image à la bande suivante. */}
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-asphalte/70 to-asphalte" />
          </div>

          <div className="max-w-6xl mx-auto px-7 pt-28 pb-32">
            <div className="max-w-2xl">
              <p className="eyebrow mb-5">Marketplace B2B — Transport en autocar</p>
              <h1 className="h-display text-6xl md:text-7xl mb-6">
                Le prix juste,<br />pas le premier prix<span className="text-ambre">.</span>
              </h1>
              <p className="text-lg text-blanc-dim mb-9 max-w-xl">
                Déposez votre trajet. Les transporteurs vérifiés de votre région vous envoient
                des devis fermes, sous profil anonyme. Vous comparez, vous gardez la main.
              </p>
              <div className="flex flex-wrap gap-3.5">
                <Link href="#demande-rapide" className="btn-primary">Demander mon transport →</Link>
                <Link href="#comment-ca-marche" className="btn-ghost">Voir comment ça marche</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 2. CHIFFRES — bande ambre claire ---------- */}
        <section className="bg-ambre-dim border-y border-ambre/35">
          <div className="max-w-6xl mx-auto px-7 py-14 grid grid-cols-2 md:grid-cols-4 gap-7">
            {STATS.map((s) => (
              <div key={s.label} className="chiffre">
                <p className="h-display text-4xl">{s.num}</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 3. DEMANDE — blanc ---------- */}
        <section id="demande-rapide" className="py-24">
          <div className="max-w-6xl mx-auto px-7 grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-12 lg:items-center">
            <div>
              <p className="eyebrow mb-4">Votre demande en 2 minutes</p>
              <h2 className="h-display text-4xl md:text-5xl mb-4">Où partez-vous ?</h2>
              <p className="text-blanc-dim mb-7 leading-relaxed">
                Un mariage, un match à l&apos;extérieur, une classe qui part en voyage, la sortie
                annuelle du club : derrière chaque demande, il y a un groupe qui a hâte.
                Dites-nous où vous allez, on s&apos;occupe de la partie pénible.
              </p>

              <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mb-3">
                Ce que les groupes réservent le plus
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {ENVIES.map((e) => (
                  <Link
                    key={e.href}
                    href={e.href}
                    className="bg-ambre-dim border border-ambre/35 rounded-sm px-3 py-1.5 text-[13px] font-medium text-ambre-fort hover:bg-ambre hover:text-encre hover:border-ambre transition"
                  >
                    {e.label}
                  </Link>
                ))}
              </div>

              <ul className="text-[13.5px] text-blanc-dim space-y-1.5">
                <li>— Estimation de prix instantanée</li>
                <li>— Identité masquée jusqu&apos;à la sélection</li>
                <li>— Gratuit, sans engagement</li>
              </ul>
            </div>
            <QuickDemandeForm />
          </div>
        </section>

        {/* ---------- 4. COMMENT ÇA MARCHE — trois étapes ---------- */}
        <section id="comment-ca-marche" className="bg-asphalte-2 border-y border-ligne py-24">
          <div className="max-w-6xl mx-auto px-7">
            <div className="grid lg:grid-cols-[1fr_auto] gap-8 lg:items-end mb-12">
              <div>
                <p className="eyebrow mb-4">Comment ça marche</p>
                <h2 className="h-display text-4xl md:text-5xl mb-3">Trois étapes, zéro coup de fil.</h2>
              </div>
              <p className="text-blanc-dim max-w-md leading-relaxed text-[15px]">
                Vous ne contactez personne : les transporteurs disponibles viennent à vous,
                sans connaître votre identité tant que vous n&apos;avez pas choisi.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {ETAPES.map((e, i) => (
                <div key={e.titre} className="relative bg-asphalte border border-ligne rounded p-8 shadow-carte">
                  <span className={`absolute top-7 right-7 tag ${e.tagCls}`}>{e.tag}</span>
                  <p className="h-display text-6xl text-ambre mb-5">0{i + 1}</p>
                  <h3 className="h-display text-2xl mb-2.5">{e.titre}</h3>
                  <p className="text-sm text-blanc-dim leading-relaxed">{e.texte}</p>
                </div>
              ))}
            </div>

            {FEATURES.enchere && (
              <div className="mt-8 bg-asphalte border border-ligne border-t-[3px] border-t-vert p-9 max-w-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-9 h-9 rounded-sm bg-vert-dim text-vert flex items-center justify-center font-mono font-semibold">E</span>
                  <h3 className="h-display text-2xl">Enchère</h3>
                </div>
                <ul className="text-sm text-blanc-dim divide-y divide-ligne">
                  {ETAPES_ENCHERE.map((e, i) => (
                    <li key={e} className="flex gap-3.5 py-3">
                      <span className="font-mono text-xs text-vert pt-0.5">0{i + 1}</span>{e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ---------- 5. RETOURS À VIDE — bande sombre ---------- */}
        {FEATURES.retours && <section className="sombre relative overflow-hidden">
          {/* Sortie du conteneur centré : l'image court jusqu'au bord de l'écran,
              son flanc gauche fondu dans la bande — plus aucune arête visible. */}
          <div className="absolute inset-y-0 right-0 w-[52%] hidden md:block">
            <Image
              src="/img/retour.jpg"
              alt="Autocar sur la route"
              fill
              className="object-cover grayscale-[0.4] brightness-[0.75]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-asphalte via-asphalte/55 to-transparent" />
          </div>

          <div className="relative max-w-6xl mx-auto px-7 py-24">
            <div className="md:max-w-xl">
              <p className="eyebrow mb-5">Uniquement sur DealBus</p>
              <h2 className="h-display text-4xl md:text-5xl mb-4">
                Un trajet déjà en route,<br />à prix cassé.
              </h2>
              <p className="text-[15px] text-blanc-dim mb-8 leading-relaxed">
                Après avoir déposé un groupe, un transporteur publie son retour à vide :
                prix fixe défini par lui, souvent bien en dessous du marché. Vous économisez,
                il rentabilise des kilomètres perdus — et un car de moins roule pour rien.
              </p>
              <div className="flex flex-wrap gap-10 mb-9">
                <div className="chiffre">
                  <p className="h-display text-3xl">−40 %</p>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mt-1.5">Écart moyen constaté</p>
                </div>
                <div className="chiffre">
                  <p className="h-display text-3xl">0 km</p>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mt-1.5">Roulé pour rien</p>
                </div>
              </div>
              <Link href="/retours" className="btn-primary">Voir les retours à vide →</Link>
            </div>
          </div>
        </section>}

        {/* ---------- 6. DEUX PUBLICS — blanc ---------- */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-7">
            <p className="eyebrow mb-4">Une plateforme, deux interfaces</p>
            <h2 className="h-display text-4xl md:text-5xl mb-12">Fait pour les deux côtés du trajet.</h2>
            <div className="grid md:grid-cols-2 gap-5">

              <div className="bg-ambre-dim border border-ambre/40 rounded p-0 overflow-hidden group">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src="/img/client.jpg"
                    alt="Groupe de voyageurs"
                    fill
                    className="object-cover grayscale-[0.55] brightness-105 group-hover:grayscale-0 transition duration-500"
                  />
                </div>
                <div className="p-9 pt-7 border-t-[3px] border-ambre">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ambre-fort mb-4">Espace client</p>
                  <h3 className="h-display text-3xl mb-3">Organisez, comparez, partez.</h3>
                  <p className="text-sm text-blanc-dim mb-6 max-w-sm leading-relaxed">
                    Pour les entreprises, écoles, associations, clubs et particuliers qui
                    organisent un déplacement de groupe.
                  </p>
                  <ul className="text-[13.5px] text-blanc-dim space-y-1.5 mb-7">
                    <li>— Demande en moins de 2 minutes</li>
                    <li>— Identité masquée jusqu&apos;à votre choix</li>
                    <li>— Des offres fermes, détaillées et comparables</li>
                    <li>— Avis vérifiés et licences contrôlées</li>
                  </ul>
                  <Link href="/demande" className="btn-ghost">Faire une demande →</Link>
                </div>
              </div>

              <div className="bg-vert-dim border border-vert/40 rounded p-0 overflow-hidden group">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src="/img/pro.jpg"
                    alt="Flotte d'autocars"
                    fill
                    className="object-cover grayscale-[0.55] brightness-105 group-hover:grayscale-0 transition duration-500"
                  />
                </div>
                <div className="p-9 pt-7 border-t-[3px] border-vert">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-vert mb-4">Espace transporteur</p>
                  <h3 className="h-display text-3xl mb-3">Des leads qualifiés, pas du bruit.</h3>
                  <p className="text-sm text-blanc-dim mb-6 max-w-sm leading-relaxed">
                    Pour les autocaristes qui veulent remplir leur planning
                    sans démarchage à froid.
                  </p>
                  <ul className="text-[13.5px] text-blanc-dim space-y-1.5 mb-7">
                    <li>— Leads filtrés par zones que vous choisissez</li>
                    <li>— Client anonyme jusqu&apos;à votre offre retenue</li>
                    <li>— Un devis par demande, en un seul envoi</li>
                    <li>— Vous ne payez que si vous gagnez la mission</li>
                  </ul>
                  <Link href="/pro" className="btn-ghost">Devenir partenaire →</Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ---------- 7. COUVERTURE — gris moyen + panneau blanc ---------- */}
        <section className="bg-asphalte-3 border-y border-ligne">
          <div className="max-w-6xl mx-auto px-7 py-24 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14 lg:items-center">
            <div className="mb-10 lg:mb-0">
              <p className="eyebrow mb-4">Couverture en temps réel</p>
              <h2 className="h-display text-4xl md:text-5xl mb-4">Nos transporteurs, département par département.</h2>
              <p className="text-blanc-dim mb-6 leading-relaxed">
                Chaque zone ambre est couverte par au moins un transporteur vérifié — la carte
                s&apos;actualise à chaque nouvelle inscription. Survolez un département pour voir
                le détail.
              </p>
              <p className="text-blanc-dim mb-8 leading-relaxed">
                <span className="text-blanc font-semibold">Transporteur dans une zone encore libre ?</span>{" "}
                Les premiers inscrits de chaque département recevront ses premières demandes.
              </p>
              <a href="/pro" className="btn-ghost">Prendre ma zone →</a>
            </div>
            <CarteCouverture />
          </div>
        </section>

        {/* ---------- 8. MODÈLE ÉCONOMIQUE — gris clair, collé au footer ---------- */}
        <section className="bg-asphalte-2 pt-24 pb-24">
          <div className="max-w-6xl mx-auto px-7">
            <p className="eyebrow mb-4">Transparence commerciale</p>
            <h2 className="h-display text-4xl md:text-5xl mb-3">Comment on se rémunère.</h2>
            <p className="text-blanc-dim max-w-lg mb-12 leading-relaxed">
              Pas d&apos;abonnement à l&apos;entrée, pas de frais cachés. DealBus ne gagne
              que si le transport a vraiment lieu.
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-asphalte border border-ligne p-9">
                <p className="font-mono text-[11px] uppercase tracking-widest text-blanc-faint mb-4">Côté client</p>
                <h3 className="h-display text-3xl mb-3">Gratuit, sans condition.</h3>
                <ul className="text-[13.5px] text-blanc-dim space-y-1.5">
                  <li>— 0 € à l&apos;inscription</li>
                  <li>— 0 € par demande déposée</li>
                  <li>— 0 € de commission sur le prix payé au transporteur</li>
                </ul>
              </div>
              <div className="bg-asphalte border border-ligne border-l-[3px] border-l-ambre p-9">
                <p className="font-mono text-[11px] uppercase tracking-widest text-blanc-faint mb-4">Côté transporteur</p>
                <h3 className="h-display text-3xl mb-3">Une commission, uniquement si vous gagnez.</h3>
                <ul className="text-[13.5px] text-blanc-dim space-y-1.5">
                  <li>— 9 % jusqu&apos;à 2 000 € · 7 % jusqu&apos;à 5 000 € · 5 % au-delà</li>
                  <li>— Aucun abonnement, aucun frais fixe</li>
                  <li>— Même taux partout en France, sans majoration géographique</li>
                  <li>— Facturée après la mission — aucun forfait sans course gagnée</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 9. FOOTER — bande sombre ---------- */}
        <div className="sombre">
          <Footer />
        </div>
      </main>
    </>
  );
}
