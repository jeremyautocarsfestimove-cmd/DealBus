import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RechercheVoyage } from "@/components/RechercheVoyage";
import Image from "next/image";
import { IllustrationsSprite, Illu, type IlluId } from "@/components/Illustrations";
import { photoVille, photoGroupe } from "@/lib/photos-villes";

// Accueil « voyage » : on donne envie de partir, puis on montre que DealBus
// est le moyen simple d'y aller en car. Illustrations SVG intégrées
// (components/Illustrations.tsx), un autocar ambre dans chaque scène.

type Envie = { illu: IlluId; saison: string; titre: string; texte: string; href: string; grande?: boolean };
const ENVIES: Envie[] = [
  { illu: "noel", saison: "Décembre · Marchés de Noël", titre: "Strasbourg, Colmar, Reims", texte: "La sortie de fin d'année des CSE et des associations. Réservez tôt : les cars sont pleins dès novembre.", href: "/voyages/marches-de-noel", grande: true },
  { illu: "parc", saison: "Toute l'année", titre: "Parcs d'attractions", texte: "Disneyland, Astérix, Puy du Fou.", href: "/voyages/parcs-attractions" },
  { illu: "mer", saison: "Mai à septembre", titre: "Journée à la mer", texte: "Deauville, Étretat, Le Touquet.", href: "/voyages/journee-mer" },
  { illu: "vigne", saison: "Septembre · Octobre", titre: "Vignobles & caves", texte: "Champagne, Loire, Bourgogne.", href: "/voyages/vignobles" },
  { illu: "chateau", saison: "Printemps", titre: "Châteaux de la Loire", texte: "Chambord, Chenonceau, Amboise.", href: "/voyages/chateaux-loire" },
  { illu: "londres", saison: "Séjours · 2 à 4 jours", titre: "Londres, Bruxelles, Amsterdam", texte: "Le car reste avec le groupe sur place : transferts, visites, retour. Un seul transporteur, un seul devis.", href: "/voyages/sejours-europe", grande: true },
];

const TYPES: { illu: IlluId; photo: string; titre: string; sous: string; organisme: string }[] = [
  { illu: "parc", photo: "ecoles", titre: "Écoles", sous: "Sorties, voyages scolaires", organisme: "ecole" },
  { illu: "vigne", photo: "associations", titre: "Associations", sous: "Sorties annuelles, aînés", organisme: "association" },
  { illu: "londres", photo: "cse", titre: "CSE & entreprises", sous: "Séminaires, arbres de Noël", organisme: "cse" },
  { illu: "chateau", photo: "mariages", titre: "Mariages", sous: "Navettes invités", organisme: "mariage" },
  { illu: "mer", photo: "clubs", titre: "Clubs sportifs", sous: "Matchs, tournois, stages", organisme: "club" },
  { illu: "route", photo: "collectivites", titre: "Collectivités", sous: "Centres de loisirs, colos", organisme: "collectivite" },
];

const ETAPES = [
  { tag: "2 min", tagCls: "bg-ambre-dim text-ambre", titre: "Décrivez le voyage", texte: "Trajet, dates, nombre de passagers, ce qu'il faut prévoir. Un assistant vérifie les horaires et vous donne une fourchette de prix." },
  { tag: "24 h", tagCls: "bg-vert-dim text-vert", titre: "Recevez des offres fermes", texte: "Chaque transporteur répond une fois : prix tout compris, véhicule, ce qui est inclus. Posez-lui vos questions par la messagerie." },
  { tag: "Vous décidez", tagCls: "bg-asphalte-3 text-blanc", titre: "Retenez, et partez", texte: "Coordonnées échangées avec le transporteur choisi, règlement direct avec lui. DealBus ne prend rien côté client." },
];

type Dest = { illu: IlluId; photo: string; titre: string; meta: string; texte: string; href: string };
const DESTINATIONS: Dest[] = [
  { illu: "parc", photo: "disneyland-paris", titre: "Disneyland Paris", meta: "Depuis Paris · 45 km · journée", texte: "La sortie la plus demandée par les écoles et les CSE. Dépose au parking cars, reprise le soir.", href: "/voyages/parcs-attractions?vers=Disneyland%20Paris" },
  { illu: "msm", photo: "mont-saint-michel", titre: "Mont-Saint-Michel", meta: "Depuis Paris · 360 km · journée ou 2 jours", texte: "Longue journée : les transporteurs prévoient souvent deux conducteurs, c'est inclus dans leur offre.", href: "/voyages/normandie-bretagne?vers=Mont-Saint-Michel" },
  { illu: "mer", photo: "plages-debarquement", titre: "Plages du Débarquement", meta: "Depuis Caen · 30 km · journée", texte: "Circuit mémoriel : Omaha Beach, cimetière américain, Arromanches. Le car suit le groupe toute la journée.", href: "/voyages/normandie-bretagne?vers=Plages%20du%20D%C3%A9barquement" },
  { illu: "vigne", photo: "puy-du-fou", titre: "Puy du Fou", meta: "Depuis Paris · 380 km · 2 jours", texte: "Nuit sur place : hébergement du chauffeur et immobilisation du car compris dans les offres.", href: "/voyages/parcs-attractions?vers=Puy%20du%20Fou" },
  { illu: "mer", photo: "deauville", titre: "Deauville · Honfleur", meta: "Depuis Paris · 200 km · journée", texte: "La journée à la mer des associations et des aînés. Arrêt possible à Honfleur sur le retour.", href: "/voyages/journee-mer?vers=Deauville" },
  { illu: "londres", photo: "londres", titre: "Londres", meta: "Depuis Paris · 460 km · 3 jours", texte: "Séjour avec le car sur place. Transporteurs habitués au tunnel et aux formalités de groupe.", href: "/voyages/sejours-europe?vers=Londres" },
];

const CONFIANCE = [
  { ic: "✓", titre: "Transporteurs vérifiés", texte: "Licence de transport et assurance RC Pro contrôlées par DealBus avant toute mise en relation, puis à échéance." },
  { ic: "👁", titre: "Vous restez anonyme", texte: "Les transporteurs voient le trajet, jamais votre nom, votre école ou votre téléphone, jusqu'à votre choix." },
  { ic: "€", titre: "Des prix fermes, comparables", texte: "Un seul devis par transporteur, tout compris, avec ce qui est inclus écrit noir sur blanc. Pas de marchandage." },
  { ic: "🛟", titre: "Une équipe derrière", texte: "Une question, un doute, une annulation ? DealBus suit chaque dossier et répond dans la journée." },
];

const FAQ = [
  { q: "Combien ça coûte ?", r: "Rien pour vous. DealBus se rémunère par une commission versée par le transporteur, uniquement s'il remporte la mission." },
  { q: "Suis-je obligé d'accepter une offre ?", r: "Non. Vous comparez, vous posez vos questions, et vous pouvez clore la demande sans donner suite." },
  { q: "Comment se passe le paiement ?", r: "Directement avec le transporteur retenu, selon ses conditions (acompte, solde, mandat administratif pour les établissements publics)." },
  { q: "Combien de temps à l'avance ?", r: "2 à 6 semaines dans l'idéal, davantage pour les samedis de mai, juin et septembre et les marchés de Noël." },
  { q: "Et si le transporteur annule ?", r: "Toute annulation est motivée et validée par DealBus. Votre demande est relancée en priorité auprès des autres transporteurs." },
  { q: "Peut-on aller à l'étranger ?", r: "Oui pour la destination. Le départ doit se situer en France pour que les transporteurs de votre zone répondent." },
];

const eyebrow = "font-mono text-[11px] uppercase tracking-[.14em] text-ambre-fort";
const h2 = "h-display text-4xl md:text-5xl mt-3 mb-2";

export default function Home() {
  return (
    <>
      <Nav />
      <IllustrationsSprite />
      <main className="relative overflow-x-clip">

        {/* ---------- 1. HERO ---------- */}
        <header className="relative min-h-[600px] flex items-end text-white">
          <Illu id="msm" priorite titre="Groupe devant le Mont-Saint-Michel au lever du soleil, autocar sur la digue" />
          <div className="absolute inset-0 bg-gradient-to-b from-encre/10 via-transparent to-encre/70" />
          <div className="relative max-w-6xl mx-auto px-7 pt-24 pb-10 w-full">
            <span className="inline-flex items-center gap-2 bg-white/15 border border-white/30 rounded-full px-3 py-1.5 text-[12.5px] backdrop-blur-sm">
              Voyages de groupe en autocar · devis gratuits de transporteurs vérifiés
            </span>
            <h1 className="h-display text-5xl md:text-7xl mt-4 mb-3 drop-shadow-[0_2px_20px_rgba(0,0,0,.3)]">
              Partez ensemble.<br /><span className="inline-block bg-ambre text-white px-3 rounded-sm [box-decoration-break:clone]">On s&apos;occupe du car.</span>
            </h1>
            <p className="text-lg max-w-2xl text-white/90 mb-7">
              Voyage scolaire, sortie d&apos;association, séminaire, mariage, tournoi… Dites-nous où vous allez :
              les autocaristes de votre région vous envoient leurs meilleures offres, vous comparez, vous partez.
            </p>
            <RechercheVoyage />
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-4 text-[12.5px] text-white/90">
              {["Gratuit et sans engagement", "Identité masquée jusqu'à votre choix", "Transporteurs vérifiés : licence et assurance", "Premières offres en général sous 24 h"].map((t) => (
                <span key={t}><span className="text-[#3FCE94] font-bold">✓</span> {t}</span>
              ))}
            </div>
          </div>
        </header>

        {/* ---------- 2. ENVIES DU MOMENT ---------- */}
        <section className="py-20" id="envies">
          <div className="max-w-6xl mx-auto px-7">
            <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:items-end mb-9">
              <div><p className={eyebrow}>Envies du moment</p><h2 className={h2}>Où partir cette saison ?</h2></div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ENVIES.map((e) => (
                <Link key={e.titre} href={e.href} className={`relative rounded-lg overflow-hidden min-h-[300px] flex flex-col justify-end text-white group ${e.grande ? "sm:col-span-2" : ""}`}>
                  <Illu id={e.illu} className="transition group-hover:scale-[1.03] duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-encre/55 to-encre/90" />
                  <div className="relative p-5">
                    <p className="font-mono text-[10.5px] uppercase tracking-[.12em] text-ambre mb-1.5">{e.saison}</p>
                    <h3 className="h-display text-3xl">{e.titre}</h3>
                    <p className="text-[13.5px] text-white/85 mt-1.5 max-w-md">{e.texte}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 3. POUR TOUS LES GROUPES ---------- */}
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-7">
            <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:items-end mb-9">
              <div><p className={eyebrow}>Pour tous les groupes</p><h2 className={h2}>Quel que soit le voyage.</h2></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {TYPES.map((t) => (
                <Link key={t.titre} href={`/demande?organisme=${t.organisme}`} className="bg-asphalte border border-ligne rounded-md overflow-hidden text-center pb-4 hover:border-ligne-strong transition">
                  <div className="relative h-24 overflow-hidden">
                    {photoGroupe(t.photo)
                      ? <Image src={photoGroupe(t.photo)!} alt={t.titre} fill sizes="(max-width: 640px) 50vw, 16vw" className="object-cover" />
                      : <Illu id={t.illu} />}
                  </div>
                  <b className="block text-[14.5px] mt-3">{t.titre}</b>
                  <small className="block text-xs text-blanc-faint px-2">{t.sous}</small>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 4. LE CŒUR ---------- */}
        {/* Photo réaliste en fond (public/img/route.webp, format panoramique),
            voile sombre pour la lisibilité, 3 étapes côte à côte, preuves dessous. */}
        <section className="sombre relative py-20 text-blanc overflow-hidden" id="comment-ca-marche">
          <Illu id="route" titre="Autocar de tourisme sur une route côtière" />
          <div className="absolute inset-0 bg-encre/75" />
          <div className="absolute inset-0 bg-gradient-to-b from-encre/40 via-transparent to-encre/60" />
          <div className="relative max-w-6xl mx-auto px-7">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[.14em] text-ambre">Le principe DealBus</p>
              <h2 className="h-display text-4xl md:text-5xl mt-3 mb-4">Vous choisissez la destination.<br />Les transporteurs viennent à vous.</h2>
              <p className="text-[17px] text-white/85 max-w-xl">Plus d&apos;appels à dix autocaristes pour comparer des devis incomparables. Une seule demande, anonyme, et des offres fermes de professionnels vérifiés.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-10">
              {ETAPES.map((e, i) => (
                <div key={e.titre} className="bg-encre/55 backdrop-blur-sm border border-white/15 rounded-lg px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="h-display text-5xl text-ambre">0{i + 1}</span>
                    <span className={`tag ${e.tagCls}`}>{e.tag}</span>
                  </div>
                  <h3 className="h-display text-2xl mt-3">{e.titre}</h3>
                  <p className="text-sm text-white/80 mt-1.5">{e.texte}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-4 mt-10 pt-6 border-t border-white/15">
              {[["100 %", "Licences & RC Pro contrôlées"], ["1 seul", "Devis par transporteur, ferme"], ["24 h", "Premières offres, en général"]].map(([n, l]) => (
                <div key={l}><p className="h-display text-4xl">{n}</p><p className="font-mono text-[10.5px] uppercase tracking-wider text-white/70 mt-1">{l}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 5. DESTINATIONS PRÉFÉRÉES ---------- */}
        <section className="py-20" id="destinations">
          <div className="max-w-6xl mx-auto px-7">
            <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:items-end mb-9">
              <div><p className={eyebrow}>Ce que les groupes réservent le plus</p><h2 className={h2}>Destinations préférées.</h2></div>
              <Link href="/location-autocar" className="font-mono text-[11px] uppercase tracking-[.1em] text-ambre-fort hover:underline">Toutes les destinations →</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DESTINATIONS.map((d) => (
                <Link key={d.titre} href={d.href} className="bg-asphalte border border-ligne rounded-lg overflow-hidden hover:border-ligne-strong transition group flex flex-col">
                  <div className="relative h-[150px] overflow-hidden">
                    {photoVille(d.photo)
                      ? <Image src={photoVille(d.photo)!} alt={d.titre} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition group-hover:scale-[1.03] duration-500" />
                      : <Illu id={d.illu} className="transition group-hover:scale-[1.03] duration-500" />}
                  </div>
                  <div className="p-4 pb-5 flex flex-col flex-1">
                    <h4 className="h-display text-2xl">{d.titre}</h4>
                    <p className="font-mono text-[11px] text-blanc-faint tracking-wide mt-1">{d.meta}</p>
                    <p className="text-[13.5px] text-blanc-dim mt-2">{d.texte}</p>
                    <div className="mt-auto"><div className="flex justify-end items-center mt-3 pt-3 border-t border-ligne">
                      <span className="font-mono text-[10.5px] uppercase tracking-[.1em]">Demander →</span>
                    </div></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 6. CONFIANCE ---------- */}
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-7 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONFIANCE.map((c) => (
              <div key={c.titre} className="bg-asphalte border border-ligne rounded-lg p-6">
                <div className="w-10 h-10 rounded-full bg-ambre-dim flex items-center justify-center font-condensed font-bold text-ambre-fort text-lg mb-3">{c.ic}</div>
                <b className="block text-[15.5px] mb-1">{c.titre}</b>
                <p className="text-[13.5px] text-blanc-dim">{c.texte}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 7. UN VOYAGE RACONTÉ (cas illustratif) ---------- */}
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-7">
            <div className="bg-asphalte-2 border border-ligne rounded-lg p-8 md:p-10 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className={`${eyebrow} mb-4`}>Exemple de voyage · cas illustratif</p>
                <blockquote className="font-serif text-[21px] leading-snug">« Classe de 6e, 53 élèves, deux jours au Puy du Fou. J&apos;ai décrit le trajet un lundi soir, j&apos;avais trois offres le mercredi. On a choisi celle qui incluait l&apos;hôtel du chauffeur. »</blockquote>
                <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mt-4">Professeure principale · collège des Yvelines · exemple rédigé à partir d&apos;une demande type</p>
              </div>
              <div className="bg-asphalte border border-ligne rounded-md p-5 text-[13.5px] divide-y divide-ligne">
                {[["Mantes-la-Jolie → Puy du Fou", "412 km"], ["12 et 13 mai, car sur place", "2 jours"], ["58 passagers, autocar 63 places", "soute, ceintures"], ["Offres reçues", "3 en 48 h"], ["Offre retenue, tout compris", "2 590 € TTC"]].map(([a, b], i) => (
                  <div key={a} className="flex justify-between py-2"><span>{a}</span><b className={`font-mono ${i === 4 ? "text-ambre-fort" : ""}`}>{b}</b></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 8. TRANSPORTEURS ---------- */}
        <section className="bg-asphalte-2 border-y border-ligne py-20" id="transporteurs">
          <div className="max-w-6xl mx-auto px-7 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className={eyebrow}>Vous êtes autocariste ?</p>
              <h2 className={h2}>Des voyages à remplir, pas du démarchage.</h2>
              <p className="text-blanc-dim max-w-lg">Des demandes réelles, datées, qualifiées, dans vos zones. Vous répondez quand votre planning le permet. Vous ne payez que si vous gagnez.</p>
              <ul className="my-6 space-y-2 text-[15px]">
                {["Commission de 9 à 5 % uniquement sur mission réalisée, aucun abonnement", "Haut-le-pied, journées et nombre de conducteurs calculés depuis votre dépôt", "Le client vous paie directement, DealBus ne touche jamais votre argent", "Messagerie avec le client avant de chiffrer, avis après chaque mission"].map((t) => (
                  <li key={t} className="flex gap-2.5"><span className="text-vert font-bold">✓</span>{t}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="/pro" className="btn-primary">Rejoindre les transporteurs →</Link>
                <Link href="/cgu#commission" className="btn-ghost">Voir le barème</Link>
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden min-h-[360px]"><Illu id="car" titre="Conducteur devant son autocar, dépôt au petit matin" /></div>
          </div>
        </section>

        {/* ---------- 9. FAQ ---------- */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-7">
            <p className={`${eyebrow} mb-2`}>Questions fréquentes</p>
            <div className="grid md:grid-cols-2 gap-x-10">
              {FAQ.map((f) => (
                <div key={f.q} className="border-t border-ligne py-4">
                  <b className="block text-[15.5px] mb-1">{f.q}</b>
                  <p className="text-sm text-blanc-dim">{f.r}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 10. CTA FINAL ---------- */}
        <section className="relative text-white overflow-hidden">
          <Illu id="route" titre="Route côtière, autocar, mer" />
          <div className="absolute inset-0 bg-encre/60" />
          <div className="relative max-w-6xl mx-auto px-7 py-20 text-center">
            <h2 className="h-display text-5xl">Votre groupe a hâte.</h2>
            <p className="text-[17px] text-white/85 max-w-xl mx-auto mt-3 mb-7">Décrivez votre voyage en 2 minutes. Les premières offres arrivent en général dans la journée.</p>
            <Link href="/demande" className="btn-primary px-7 py-4 text-[15px]">Demander des devis, c&apos;est gratuit →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
