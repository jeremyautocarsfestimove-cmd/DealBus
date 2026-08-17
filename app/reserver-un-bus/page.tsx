import type { Metadata } from "next";
import { SeoPage } from "../_seo/SeoPage";

export const metadata: Metadata = {
  title: "Réserver un bus pour un groupe : simple, rapide, au juste prix",
  description:
    "Réservez un bus ou un autocar pour votre groupe en quelques clics : demande gratuite, offres fermes de transporteurs vérifiés, enchères en direct et retours à vide à prix cassé.",
  alternates: { canonical: "/reserver-un-bus" },
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Réserver un bus"
      h1={<>Réserver un bus pour votre groupe, <span className="text-ambre">en trois étapes.</span></>}
      intro="Réserver un bus ne devrait pas prendre des jours d'appels et de relances. Sur DealBus, vous publiez votre trajet une fois, les transporteurs de votre région viennent à vous avec des prix fermes, et vous réservez celui qui vous convient — le tout gratuitement et sans engagement jusqu'à votre choix."
      sections={[
        {
          titre: "Étape 1 — Décrivez votre trajet (2 minutes)",
          corps: (
            <p>Départ, destination, date et heure, nombre de passagers, aller simple ou aller-retour, besoin du véhicule sur place ou non. Plus votre demande est précise, plus les offres seront justes. Votre identité reste confidentielle : les transporteurs voient le trajet, jamais vos coordonnées.</p>
          ),
        },
        {
          titre: "Étape 2 — Recevez des offres fermes ou lancez une enchère",
          corps: (
            <>
              <p>En mode devis, chaque transporteur intéressé envoie un prix unique et définitif, accompagné du véhicule proposé et de sa réputation. En mode enchère, vous fixez l&apos;heure de clôture et les professionnels se relaient à la baisse — chaque nouveau prix doit battre le précédent d&apos;au moins 1 %. Vous suivez tout en direct, et rien ne vous engage avant validation.</p>
              <p>Troisième voie, unique à DealBus : les retours à vide. Un autocar qui rentre d&apos;une mission dans votre direction est proposé à prix fixe réduit — le transporteur rentabilise son retour, vous voyagez pour une fraction du tarif normal.</p>
            </>
          ),
        },
        {
          titre: "Étape 3 — Choisissez, et finalisez en direct",
          corps: (
            <p>Vous retenez l&apos;offre de votre choix selon vos critères : prix, véhicule, note du transporteur. Les coordonnées s&apos;échangent alors automatiquement, et vous réglez le transporteur directement — DealBus n&apos;encaisse rien côté client et n&apos;ajoute aucun frais. Après le trajet, votre avis nourrit la réputation du professionnel.</p>
          ),
        },
      ]}
      faq={[
        { q: "Combien de temps à l'avance faut-il réserver un bus ?", r: "L'idéal est 2 à 6 semaines avant le départ, et davantage pour les samedis de mai, juin et septembre (mariages, tournois, sorties de fin d'année). Pour les demandes urgentes, le mode enchère avec une clôture courte accélère les réponses." },
        { q: "Peut-on réserver un bus pour un petit groupe (moins de 15 personnes) ?", r: "Oui. DealBus est ouvert aux minibus, VTC et taxis en plus des autocaristes : votre demande atteint le bon type de véhicule quel que soit votre effectif." },
        { q: "Le paiement passe-t-il par la plateforme ?", r: "Non — c'est un choix assumé. Vous payez le transporteur directement, selon les modalités convenues avec lui (acompte, solde). DealBus n'ajoute aucun frais côté client et n'immobilise jamais votre argent." },
        { q: "Que se passe-t-il si aucun transporteur ne répond ?", r: "Votre demande reste visible jusqu'à sa date, et vous êtes notifié à chaque nouvelle offre. Si votre zone est peu couverte, notre équipe le détecte et recrute activement des transporteurs locaux." },
        { q: "Puis-je annuler ma demande ?", r: "Oui, à tout moment avant d'avoir retenu une offre, sans frais ni justification. Après sélection, l'annulation se gère directement avec le transporteur selon ses conditions." },
      ]}
      related={[
        { href: "/location-autocar", label: "Location d'autocar avec chauffeur" },
        { href: "/comparateur-devis-autocar", label: "Comparer les devis d'autocar" },
        { href: "/retours", label: "Les retours à vide du moment" },
      ]}
    />
  );
}
