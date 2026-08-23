import Link from "next/link";
import { DEPARTEMENTS } from "@/lib/departements";

// Footer SEO commun — colonnes de maillage interne.
// Les villes proviennent de lib/villes.ts : toute ville ajoutée apparaît automatiquement.

const colTitre = "font-mono text-[10.5px] uppercase tracking-widest text-blanc-faint mb-4";
const colLien = "block text-[13px] text-blanc-dim hover:text-blanc transition py-1";

export function Footer() {
  const moitie = Math.ceil(DEPARTEMENTS.length / 2);
  const deptsA = DEPARTEMENTS.slice(0, moitie);
  const deptsB = DEPARTEMENTS.slice(moitie);

  return (
    <footer className="border-t border-ligne mt-24">
      <div className="max-w-6xl mx-auto px-7 py-14 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
        <div>
          <p className={colTitre}>DealBus</p>
          <Link href="/#comment-ca-marche" className={colLien}>Comment ça marche</Link>
          <Link href="/demande" className={colLien}>Faire une demande</Link>
          <Link href="/retours" className={colLien}>Retours à vide</Link>
          <Link href="/pro" className={colLien}>Devenir transporteur</Link>
          <Link href="/reglementation" className={colLien}>Réglementation autocar</Link>
          <Link href="/cgu" className={colLien}>Conditions générales</Link>
          <a href="mailto:contact@dealbus.fr" className={colLien}>Contact</a>
        </div>
        <div>
          <p className={colTitre}>Location d&apos;autocar</p>
          <Link href="/location-autocar" className={colLien}>Location d&apos;autocar avec chauffeur</Link>
          <Link href="/reserver-un-bus" className={colLien}>Réserver un bus pour un groupe</Link>
          <Link href="/comparateur-devis-autocar" className={colLien}>Comparateur de devis d&apos;autocar</Link>
          <Link href="/retours" className={colLien}>Autocar pas cher : retours à vide</Link>
          <Link href="/reglementation" className={colLien}>Temps de conduite &amp; amplitude</Link>
        </div>
        <div>
          <p className={colTitre}>Autocar par département</p>
          {deptsA.map((d) => (
            <Link key={d.slug} href={`/location-autocar/${d.slug}`} className={colLien}>
              Autocar {d.nom} ({d.code})
            </Link>
          ))}
        </div>
        <div>
          <p className={colTitre}>Autocar par département (suite)</p>
          {deptsB.map((d) => (
            <Link key={d.slug} href={`/location-autocar/${d.slug}`} className={colLien}>
              Autocar {d.nom} ({d.code})
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-ligne">
        <div className="max-w-6xl mx-auto px-7 py-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] text-blanc-faint">
            © 2026 DealBus™ — Marque déposée (INPI). Tous droits réservés.
          </p>
          <p className="font-mono text-[11px] text-blanc-faint">
            La place de marché du transport de groupe · dealbus.fr
          </p>
        </div>
      </div>
    </footer>
  );
}
