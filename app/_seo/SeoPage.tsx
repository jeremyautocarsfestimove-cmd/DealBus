import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

// Gabarit commun des pages d'atterrissage SEO
export function SeoPage({
  eyebrow, h1, intro, sections, faq, related,
}: {
  eyebrow: string;
  h1: React.ReactNode;
  intro: string;
  sections: { titre: string; corps: React.ReactNode }[];
  faq: { q: string; r: string }[];
  related: { href: string; label: string }[];
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.r },
          })),
        }) }}
      />
      <Nav />
      <main className="max-w-3xl mx-auto px-7 py-16">
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
