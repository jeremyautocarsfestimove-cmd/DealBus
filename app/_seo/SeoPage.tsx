import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export type Fil = { href: string; label: string };

// Gabarit commun des pages d'atterrissage SEO.
// Émet FAQPage + BreadcrumbList et affiche un fil d'Ariane cliquable :
// le fil est à la fois un signal de structure pour Google et un chemin de
// remontée région → département → ville pour le visiteur.
export function SeoPage({
  eyebrow, h1, intro, sections, faq, related, fil = [],
}: {
  eyebrow: string;
  h1: React.ReactNode;
  intro: string;
  sections: { titre: string; corps: React.ReactNode }[];
  faq: { q: string; r: string }[];
  related: { href: string; label: string }[];
  fil?: Fil[];
}) {
  const filComplet: Fil[] = [{ href: "/", label: "Accueil" }, ...fil];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.r },
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: filComplet.map((f, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: f.label,
                item: `https://dealbus.fr${f.href === "/" ? "" : f.href}`,
              })),
            },
          ],
        }) }}
      />
      <Nav />
      <main className="max-w-3xl mx-auto px-7 py-16">
        {fil.length > 0 && (
          <nav aria-label="Fil d'Ariane" className="mb-6 text-[12.5px] text-blanc-faint flex flex-wrap gap-x-2 gap-y-1">
            {filComplet.map((f, i) => (
              <span key={f.href} className="flex gap-2">
                {i < filComplet.length - 1 ? (
                  <Link href={f.href} className="hover:text-blanc transition">{f.label}</Link>
                ) : (
                  <span className="text-blanc-dim">{f.label}</span>
                )}
                {i < filComplet.length - 1 && <span aria-hidden="true">/</span>}
              </span>
            ))}
          </nav>
        )}

        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="h-display text-4xl md:text-5xl mb-5 leading-[1.05]">{h1}</h1>
        <p className="text-lg text-blanc-dim leading-relaxed mb-8">{intro}</p>

        <div className="flex flex-wrap gap-3 mb-14">
          <Link href="/demande" className="btn-primary">Publier ma demande — gratuit →</Link>
          <Link href="/retours" className="btn-ghost">Voir les retours à vide</Link>
        </div>

        {sections.map((s) => (
          <section key={s.titre} className="mb-10">
            <h2 className="h-display text-2xl mb-3">{s.titre}</h2>
            <div className="text-[15px] text-blanc-dim leading-relaxed space-y-3">{s.corps}</div>
          </section>
        ))}

        <section className="mb-14">
          <h2 className="h-display text-2xl mb-5">Questions fréquentes</h2>
          <div className="space-y-4">
            {faq.map((f) => (
              <details key={f.q} className="card group">
                <summary className="cursor-pointer font-semibold text-[15px] list-none flex justify-between items-center">
                  {f.q}<span className="text-ambre ml-3 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-[14.5px] text-blanc-dim leading-relaxed mt-3">{f.r}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="card bg-ambre-dim border-ambre/30 text-center py-8">
          <p className="h-display text-2xl mb-2">Votre groupe a un trajet ?</p>
          <p className="text-blanc-dim mb-5">2 minutes pour publier — les transporteurs de votre région font le reste.</p>
          <Link href="/demande" className="btn-primary">Commencer →</Link>
        </div>

        <nav className="mt-12 pt-8 border-t border-ligne">
          <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mb-3">À lire aussi</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
            {related.map((r) => (
              <Link key={r.href} href={r.href} className="text-ambre hover:underline underline-offset-4">{r.label}</Link>
            ))}
          </div>
        </nav>
      </main>
      <Footer />
    </>
  );
}
