import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { IllustrationsSprite, Illu } from "@/components/Illustrations";
import { FormulaireVoyage } from "@/components/FormulaireVoyage";
import { VOYAGES, voyageParSlug } from "@/lib/voyages";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return VOYAGES.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const v = voyageParSlug((await params).slug);
  if (!v) return {};
  return {
    title: `${v.titre} — devis de transporteurs vérifiés | DealBus`,
    description: `${v.accroche} Gratuit pour le client, sans engagement.`,
    alternates: { canonical: `https://dealbus.fr/voyages/${v.slug}` },
  };
}

// Page thème « Idées de voyage » : contenu factuel + formulaire pré-réglé.
// DealBus met en relation ; l'organisation du voyage reste au transporteur retenu.
// Page statique : la destination pré-sélectionnée (?vers=) est lue côté client.
export default async function VoyagePage({ params }: { params: Params }) {
  const v = voyageParSlug((await params).slug);
  if (!v) notFound();
  const autres = VOYAGES.filter((x) => x.slug !== v.slug);

  return (
    <>
      <Nav />
      <IllustrationsSprite />
      <main>
        {/* Hero */}
        <header className="relative min-h-[420px] flex items-end text-white overflow-hidden">
          <Illu id={v.illu} priorite titre={v.titre} />
          <div className="absolute inset-0 bg-gradient-to-b from-encre/20 via-encre/10 to-encre/80" />
          <div className="relative max-w-6xl mx-auto px-7 pt-24 pb-10 w-full">
            <nav className="text-[13px] text-white/70 mb-4" aria-label="Fil d'Ariane">
              <Link href="/" className="hover:text-white">Accueil</Link><span className="mx-2 opacity-60">/</span>
              <Link href="/#envies" className="hover:text-white">Idées de voyage</Link><span className="mx-2 opacity-60">/</span>
              <span className="text-white">{v.titreCourt}</span>
            </nav>
            <span className="eyebrow">{v.saison}</span>
            <h1 className="h-display text-5xl md:text-6xl mt-4 mb-3 drop-shadow-[0_2px_20px_rgba(0,0,0,.3)]">{v.titre}</h1>
            <p className="text-lg max-w-2xl text-white/90 mb-6">{v.accroche} DealBus met en relation, chaque transporteur reste maître de son offre.</p>
            <div className="flex flex-wrap gap-x-7 gap-y-2">
              {v.chiffres.map((c) => (
                <div key={c.l}><b className="block h-display text-2xl text-ambre">{c.n}</b><span className="font-mono text-[11px] uppercase tracking-[.08em] text-white/75">{c.l}</span></div>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-7 py-12 grid lg:grid-cols-[minmax(0,1fr)_400px] gap-10">
          <div className="min-w-0 space-y-12">

            {/* Exemples + liste ouverte */}
            <section>
              <h2 className="h-display text-3xl mb-1">{v.exemplesTitre}</h2>
              <p className="text-blanc-dim max-w-2xl mb-5">{v.exemplesIntro}</p>
              <div className="grid sm:grid-cols-3 gap-3.5">
                {v.exemples.map((e, i) => (
                  <Link key={e.nom} href={`/voyages/${v.slug}?vers=${encodeURIComponent(e.nom)}#devis`} className="card p-0 overflow-hidden hover:border-ligne-strong transition group relative">
                    <div className="relative h-28 overflow-hidden"><Illu id={v.illu} className="transition group-hover:scale-[1.03] duration-500" /></div>
                    {i === 0 && <span className="absolute top-2.5 left-2.5 font-mono text-[10px] uppercase tracking-[.1em] bg-ambre text-encre px-2 py-0.5 rounded-sm">Exemple</span>}
                    <div className="p-3.5">
                      <h3 className="h-display text-xl">{e.nom}</h3>
                      <p className="font-mono text-[11px] text-blanc-faint mt-0.5 mb-2">{e.meta}</p>
                      <p className="text-[13.5px] text-blanc-dim">{e.texte}</p>
                      <span className="inline-block mt-3 font-mono text-[10.5px] uppercase tracking-[.1em] border border-ligne-strong px-2.5 py-1 rounded-sm group-hover:bg-ambre group-hover:border-ambre group-hover:text-encre transition">Choisir →</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3.5">
                {v.autres.map((a) => (
                  <Link key={a} href={`/voyages/${v.slug}?vers=${encodeURIComponent(a)}#devis`} className="border border-ligne-strong rounded-full px-3 py-1.5 text-[13px] hover:border-ambre transition">{a}</Link>
                ))}
                <a href="#devis" className="border border-dashed border-ambre text-ambre-fort rounded-full px-3 py-1.5 text-[13px]">+ votre destination</a>
              </div>
            </section>

            {/* Repères */}
            <section>
              <h2 className="h-display text-3xl mb-1">Ce qu&apos;il faut savoir avant de demander</h2>
              <p className="text-blanc-dim max-w-2xl mb-5">Quelques repères pour formuler une demande claire. L&apos;organisation du voyage (horaires définitifs, arrêts, dépose) est fixée avec le transporteur retenu.</p>
              <div className="card py-1 px-5">
                {v.reperes.map((r) => (
                  <div key={r.titre} className="grid grid-cols-[76px_1fr] gap-3.5 py-3.5 border-b border-ligne last:border-0">
                    <div className="font-mono text-[13px] font-bold text-ambre-fort">{r.k}</div>
                    <div><b className="block">{r.titre}</b><span className="text-[13.5px] text-blanc-dim">{r.texte}</span></div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contenu des offres */}
            <section>
              <h2 className="h-display text-3xl mb-1">Ce que vous verrez dans chaque offre</h2>
              <p className="text-blanc-dim max-w-2xl mb-4">Chaque transporteur indique lui-même ce que son prix comprend. Les éléments varient d&apos;une offre à l&apos;autre, c&apos;est ce qui vous permet de comparer.</p>
              <div className="flex flex-wrap gap-2">
                {["Prix ferme tout compris", "Véhicule proposé (places, année)", "Ce qui est inclus (péages, parking, second conducteur…)", "Validité de l'offre", "Note et avis du transporteur"].map((t) => (
                  <span key={t} className="card py-1.5 px-3 rounded-full text-[13px]"><span className="text-vert font-bold">✓</span> {t}</span>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section>
              <h2 className="h-display text-3xl mb-4">Questions fréquentes</h2>
              <div className="space-y-2">
                {v.faq.map((f, i) => (
                  <details key={f.q} open={i === 0} className="card py-3 px-4">
                    <summary className="font-semibold cursor-pointer">{f.q}</summary>
                    <p className="text-[14px] text-blanc-dim mt-2">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* Autres thèmes */}
            <section>
              <p className="font-mono text-[11px] uppercase tracking-[.14em] text-ambre-fort mb-3">Autres idées de voyage</p>
              <div className="flex flex-wrap gap-2">
                {autres.map((a) => (
                  <Link key={a.slug} href={`/voyages/${a.slug}`} className="border border-ligne-strong rounded-full px-3 py-1.5 text-[13px] hover:border-ambre transition">{a.titreCourt}</Link>
                ))}
              </div>
            </section>
          </div>

          <aside id="devis" className="lg:sticky lg:top-24 lg:self-start">
            <Suspense fallback={<div className="sombre bg-asphalte rounded-xl min-h-[520px]" />}>
              <FormulaireVoyage voyage={v} />
            </Suspense>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
