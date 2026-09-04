import Link from "next/link";
import { DEPARTEMENTS } from "@/lib/departements";
import { REGIONS } from "@/lib/regions";
import { getReseauxActifs } from "@/lib/reseaux";
import type { ReseauCle } from "@/lib/reseaux-def";

// Footer SEO commun — colonnes de maillage interne.
// Les villes proviennent de lib/villes.ts : toute ville ajoutée apparaît automatiquement.

const colTitre = "font-mono text-[10.5px] uppercase tracking-widest text-blanc-faint mb-4";
const colLien = "block text-[13px] text-blanc-dim hover:text-blanc transition py-1";

const ZONES_FORTES = ["yvelines", "eure", "seine-maritime", "val-d-oise", "eure-et-loir", "calvados", "oise", "seine-et-marne"];

// Icônes des réseaux sociaux (les URLs sont gérées dans /admin/reseaux).
const ICONES: Record<ReseauCle, React.ReactNode> = {
  reseau_facebook: (
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
  ),
  reseau_instagram: (
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
  ),
  reseau_linkedin: (
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  ),
  reseau_tiktok: (
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .58.05.85.13V9.4a6.33 6.33 0 0 0-1-.05A6.34 6.34 0 0 0 3 15.67a6.34 6.34 0 0 0 10.86 4.44 6.3 6.3 0 0 0 1.85-4.44V8.73a8.2 8.2 0 0 0 4.77 1.52V6.81a4.85 4.85 0 0 1-.89-.12z" />
  ),
  reseau_youtube: (
    <path d="M23.5 6.19a3 3 0 0 0-2.12-2.13C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3 3 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3 3 0 0 0 2.12 2.13c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3 3 0 0 0 2.12-2.13C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.6 15.6V8.4l6.24 3.6-6.24 3.6z" />
  ),
  reseau_x: (
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
  ),
};

export async function Footer() {
  const reseaux = await getReseauxActifs();
  const zonesFortes = DEPARTEMENTS.filter((d) => ZONES_FORTES.includes(d.slug));

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
          <p className={colTitre}>Autocar par région</p>
          {REGIONS.map((r) => (
            <Link key={r.slug} href={`/location-autocar/${r.slug}`} className={colLien}>
              Autocar {r.nom}
            </Link>
          ))}
        </div>
        <div>
          <p className={colTitre}>Nos zones fortes</p>
          {zonesFortes.map((d) => (
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
          {reseaux.length > 0 && (
          <div className="flex items-center gap-4">
            {reseaux.map((r) => (
              <a
                key={r.cle}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`DealBus sur ${r.nom}`}
                title={r.nom}
                className="text-blanc-faint hover:text-blanc transition"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  {ICONES[r.cle]}
                </svg>
              </a>
            ))}
          </div>
          )}
          <p className="font-mono text-[11px] text-blanc-faint">
            La place de marché du transport de groupe · dealbus.fr
          </p>
        </div>
      </div>
    </footer>
  );
}
