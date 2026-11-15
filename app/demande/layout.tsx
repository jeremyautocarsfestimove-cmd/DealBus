import type { Metadata } from "next";

// La page est un composant client : ses balises vivent ici.
export const metadata: Metadata = {
  title: "Demander un devis d'autocar gratuit",
  description: "Décrivez votre trajet en deux minutes : départ, arrivée, date, nombre de passagers. Les autocaristes de votre région vous répondent avec un prix ferme. Gratuit et sans engagement.",
  alternates: { canonical: "/demande" },
};

export default function DemandeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
