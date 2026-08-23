import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { LiveBoard } from "@/components/LiveBoard";
import { QuickDemandeForm } from "@/components/QuickDemandeForm";

const STATS = [
  { num: "0 €", label: "Côté client, sans condition" },
  { num: "9-5 %", label: "Commission au succès, la plus basse du marché" },
  { num: "100 %", label: "Licences & RC Pro contrôlées" },
  { num: "−1 %", label: "Palier minimum entre deux enchères" },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative overflow-x-clip">
        {/* ---------- HERO (image de fond traitée) ---------- */}
        <section className="relative overflow-hidden">
          {/* Photo de fond : /public/img/hero.jpg — autocar sur autoroute, plan large */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="/img/hero.jpg"
              alt=""
              fill
              priority
              className="object-cover opacity-70"
            />
            {/* Voile léger pour la lisibilité du texte, fondu vers le bas seulement */}
            <div className="absolute inset-0 bg-asphalte/35" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-asphalte" />
          </div>

          <div className="max-w-6xl mx-auto px-7 pt-20 pb-16 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12 lg:items-center">
            <div>
              <p className="eyebrow mb-5">Marketplace B2B — Transport en autocar</p>
              <h1 className="h-display text-5xl md:text-6xl mb-6">
                Le prix juste,<br />pas le premier prix<span className="text-ambre">.</span>
              </h1>
              <p className="text-lg text-blanc-dim mb-9">
                Déposez votre trajet. Choisissez de recevoir des devis détaillés ou de
                lancer une enchère en direct entre transporteurs anonymes. Vous gardez la main.
              </p>
              <div className="flex flex-wrap gap-3.5 mb-14 lg:mb-0">
                <Link href="#demande-rapide" className="btn-primary">Demander mon transport →</Link>
                <Link href="#comment-ca-marche" className="btn-ghost">Voir comment ça marche</Link>
              </div>
            </div>

            <LiveBoard />
          </div>
        </section>

        {/* ---------- STATS ---------- */}
        <section className="border-y border-ligne bg-gradient-to-r from-ambre/[0.06] via-transparent to-[#E8735D]/[0.05]">
          <div className="max-w-6xl mx-auto px-7 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-mono text-2xl font-semibold text-ambre">{s.num}</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- FORMULAIRE DE DEMANDE ---------- */}
        <section id="demande-rapide" className="relative py-24">
          <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-ambre/10 blur-[130px] pointer-events-none" />
          <div className="absolute -bottom-72 -right-24 w-[520px] h-[680px] rounded-full bg-[#3D5A8C]/20 blur-[150px] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-7 grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10 lg:items-center">
            <div>
              <p className="eyebrow mb-4">Votre demande en 2 minutes</p>
              <h2 className="h-display text-4xl md:text-5xl mb-4">Où partez-vous ?</h2>
              <p className="text-blanc-dim mb-6">
                Renseignez votre trajet : vous obtenez une estimation immédiate,
                puis vous choisissez entre devis multiples et enchère en direct.
                Rien n&apos;est envoyé aux transporteurs avant votre validation.
              </p>
              <ul className="text-[13.5px] text-blanc-dim space-y-1.5">
                <li>— Estimation de prix instantanée</li>
                <li>— Identité masquée jusqu&apos;à la sélection</li>
                <li>— Gratuit, sans engagement</li>
              </ul>
            </div>
            <QuickDemandeForm />
          </div>
        </section>

        {/* ---------- DEUX PARCOURS ---------- */}
        <section id="comment-ca-marche" className="section-claire">
          <div className="max-w-6xl mx-auto px-7 py-24">
          <p className="eyebrow mb-4">Deux façons de recevoir vos offres</p>
          <h2 className="h-display text-4xl md:text-5xl mb-3">Vous choisissez le rythme.</h2>
          <p className="text-blanc-dim max-w-lg mb-12">
            Même formulaire de départ, deux mécaniques différentes : de la comparaison
            posée, ou de la pression concurrentielle immédiate.
          </p>

          <div className="grid md:grid-cols-2 gap-px bg-ligne border border-ligne rounded overflow-hidden">
            <div className="bg-gradient-to-b from-asphalte-2 to-[#161B26] p-9">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 rounded-sm bg-bleunuit text-[#9DB3DE] flex items-center justify-center font-mono font-semibold">D</span>
                <h3 className="h-display text-2xl">Devis</h3>
              </div>
              <p className="text-sm text-blanc-dim mb-6">
                Vous recevez plusieurs propositions détaillées — note, ancienneté, véhicule,
                avis clients — sous profil masqué. Vous comparez à votre rythme.
              </p>
              <ul className="text-sm text-blanc-dim space-y-0 divide-y divide-ligne">
                <li className="flex gap-3 py-3"><span className="font-mono text-xs text-blanc-faint pt-0.5">01</span>Le trajet est envoyé, anonymisé, aux transporteurs de votre région disponibles à ces dates.</li>
                <li className="flex gap-3 py-3"><span className="font-mono text-xs text-blanc-faint pt-0.5">02</span>Chaque transporteur répond avec prix, véhicule et conditions — en un seul envoi, définitif.</li>
                <li className="flex gap-3 py-3"><span className="font-mono text-xs text-blanc-faint pt-0.5">03</span>Vous comparez ; identités et coordonnées ne sont partagées qu&apos;à la sélection.</li>
              </ul>
            </div>
            <div className="bg-gradient-to-b from-asphalte-2 to-[#131F1A] p-9">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 rounded-sm bg-vert-dim text-vert flex items-center justify-center font-mono font-semibold">E</span>
                <h3 className="h-display text-2xl">Enchère</h3>
              </div>
              <p className="text-sm text-blanc-dim mb-6">
                Votre demande devient anonyme. Les transporteurs se répondent entre eux
                sans se voir, le prix baisse en temps réel pendant une fenêtre définie.
              </p>
              <ul className="text-sm text-blanc-dim space-y-0 divide-y divide-ligne">
                <li className="flex gap-3 py-3"><span className="font-mono text-xs text-blanc-faint pt-0.5">01</span>Une fenêtre d&apos;enchère s&apos;ouvre (2h) avec un prix de départ indicatif.</li>
                <li className="flex gap-3 py-3"><span className="font-mono text-xs text-blanc-faint pt-0.5">02</span>Les transporteurs surenchérissent à la baisse, anonymement, par paliers d&apos;au moins 1 %.</li>
                <li className="flex gap-3 py-3"><span className="font-mono text-xs text-blanc-faint pt-0.5">03</span>À la clôture, vous validez (ou non) le meilleur prix — identité révélée à ce moment seulement.</li>
              </ul>
            </div>
          </div>
          </div>
        </section>

        {/* ---------- RETOURS À VIDE (avec image latérale) ---------- */}
        <section className="max-w-6xl mx-auto px-7 py-24">
          <div className="relative rounded border border-ambre/25 overflow-hidden md:grid md:grid-cols-[1fr_340px] bg-gradient-to-r from-[#241A10] via-asphalte-2 to-asphalte-2">
            <div className="p-9">
              <p className="eyebrow mb-4">Uniquement sur DealBus</p>
              <h2 className="h-display text-3xl md:text-4xl mb-3">
                Un trajet déjà en route, à prix cassé.
              </h2>
              <p className="text-sm text-blanc-dim mb-7">
                Après avoir déposé un groupe, un transporteur publie son retour à vide :
                prix fixe défini par lui, souvent bien en dessous du marché. Vous économisez,
                il rentabilise des kilomètres perdus — et un car de moins roule pour rien.
              </p>
              <Link href="/retours" className="btn-primary">Voir les retours à vide →</Link>
            </div>
            {/* Photo : /public/img/retour.jpg — route au crépuscule / car de dos */}
            <div className="relative hidden md:block">
              <Image
                src="/img/retour.jpg"
                alt="Autocar sur la route"
                fill
                className="object-cover grayscale-[0.4] brightness-[0.75]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-asphalte-2 via-asphalte-2/30 to-transparent" />
            </div>
          </div>
        </section>

        {/* ---------- DEUX PUBLICS (avec bandeaux photo) ---------- */}
        <section className="relative pb-24">
          <div className="absolute -top-40 -right-40 w-[460px] h-[640px] rounded-full bg-vert/[0.07] blur-[150px] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-7">
          <p className="eyebrow mb-4">Une plateforme, deux interfaces</p>
          <h2 className="h-display text-4xl md:text-5xl mb-12">Fait pour les deux côtés du trajet.</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-0 overflow-hidden group">
              {/* Photo : /public/img/client.jpg — groupe qui embarque / voyage */}
              <div className="relative h-44 overflow-hidden">
                <Image
                  src="/img/client.jpg"
                  alt="Groupe de voyageurs"
                  fill
                  className="object-cover grayscale brightness-[0.65] group-hover:grayscale-[0.3] group-hover:brightness-[0.8] transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-asphalte-2 to-transparent" />
              </div>
              <div className="p-9 pt-6">
                <p className="font-mono text-[11px] uppercase tracking-widest text-blanc border-b-2 border-ambre inline-block pb-1 mb-4">Espace client</p>
                <h3 className="h-display text-3xl mb-3">Organisez, comparez, partez.</h3>
                <p className="text-sm text-blanc-dim mb-6 max-w-sm">
                  Pour les entreprises, écoles, associations, clubs et particuliers qui
                  organisent un déplacement de groupe.
                </p>
                <ul className="text-[13.5px] text-blanc-dim space-y-1.5 mb-7">
                  <li>— Demande en moins de 2 minutes</li>
                  <li>— Identité masquée jusqu&apos;à votre choix</li>
                  <li>— Choix devis ou enchère à tout moment</li>
                  <li>— Avis vérifiés et licences contrôlées</li>
                </ul>
                <Link href="/demande" className="btn-ghost">Faire une demande →</Link>
              </div>
            </div>
            <div className="card p-0 overflow-hidden group">
              {/* Photo : /public/img/pro.jpg — chauffeur / flotte de cars */}
              <div className="relative h-44 overflow-hidden">
                <Image
                  src="/img/pro.jpg"
                  alt="Flotte d'autocars"
                  fill
                  className="object-cover grayscale brightness-[0.65] group-hover:grayscale-[0.3] group-hover:brightness-[0.8] transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-asphalte-2 to-transparent" />
              </div>
              <div className="p-9 pt-6">
                <p className="font-mono text-[11px] uppercase tracking-widest text-vert border-b-2 border-vert inline-block pb-1 mb-4">Espace transporteur</p>
                <h3 className="h-display text-3xl mb-3">Des leads qualifiés, pas du bruit.</h3>
                <p className="text-sm text-blanc-dim mb-6 max-w-sm">
                  Pour les autocaristes qui veulent remplir leur planning — et leurs
                  trajets retour — sans démarchage à froid.
                </p>
                <ul className="text-[13.5px] text-blanc-dim space-y-1.5 mb-7">
                  <li>— Leads filtrés par zones que vous choisissez</li>
                  <li>— Client anonyme jusqu&apos;à votre offre retenue</li>
                  <li>— Devis en un envoi, ou enchère en direct</li>
                  <li>— Publiez vos retours à vide, commission réduite</li>
                </ul>
                <Link href="/pro" className="btn-ghost">Devenir partenaire →</Link>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* ---------- MODÈLE ÉCONOMIQUE ---------- */}
        <section className="relative pb-24">
          <div className="absolute -bottom-48 left-1/3 w-[520px] h-[420px] rounded-full bg-ambre/[0.07] blur-[140px] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-7">
          <p className="eyebrow mb-4">Transparence commerciale</p>
          <h2 className="h-display text-4xl md:text-5xl mb-3">Comment on se rémunère.</h2>
          <p className="text-blanc-dim max-w-lg mb-12">
            Pas d&apos;abonnement à l&apos;entrée, pas de frais cachés. DealBus ne gagne
            que si le transport a vraiment lieu.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-9">
              <p className="font-mono text-[11px] uppercase tracking-widest text-blanc-faint mb-4">Côté client</p>
              <h3 className="h-display text-3xl mb-3">Gratuit, sans condition.</h3>
              <ul className="text-[13.5px] text-blanc-dim space-y-1.5">
                <li>— 0 € à l&apos;inscription</li>
                <li>— 0 € par demande déposée</li>
                <li>— 0 € de commission sur le prix payé au transporteur</li>
              </ul>
            </div>
            <div className="card p-9">
              <p className="font-mono text-[11px] uppercase tracking-widest text-blanc-faint mb-4">Côté transporteur</p>
              <h3 className="h-display text-3xl mb-3">Une commission, uniquement si vous gagnez.</h3>
              <ul className="text-[13.5px] text-blanc-dim space-y-1.5">
                <li>— 9 % jusqu&apos;à 2 000 € · 7 % jusqu&apos;à 5 000 € · 5 % au-delà</li>
                <li>— Taux réduit en enchère, encore réduit sur les retours à vide</li>
                <li>— Même taux partout en France, sans majoration géographique</li>
                <li>— Facturée après la mission — aucun forfait sans course gagnée</li>
              </ul>
            </div>
          </div>
          </div>
        </section>

        {/* ---------- FOOTER ---------- */}
        <Footer />
      </main>
    </>
  );
}
