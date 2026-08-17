import type { Metadata } from "next";
import { SeoPage } from "../_seo/SeoPage";

export const metadata: Metadata = {
  title: "Location d'autocar avec chauffeur au meilleur prix",
  description:
    "Louez un autocar avec chauffeur pour votre groupe : publiez votre trajet gratuitement, recevez des offres fermes de transporteurs vérifiés et choisissez au meilleur prix. Associations, CSE, clubs, mariages, écoles.",
  alternates: { canonical: "/location-autocar" },
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Location d'autocar avec chauffeur"
      h1={<>Louer un autocar avec chauffeur, <span className="text-ambre">sans courir après les devis.</span></>}
      intro="Sortie de club, séminaire d'entreprise, mariage, voyage scolaire, déplacement de supporters : dès qu'un groupe se déplace, la location d'un autocar avec chauffeur est la solution la plus simple et la plus économique par personne. DealBus vous évite la partie pénible : trouver, comparer et négocier avec les transporteurs."
      sections={[
        {
          titre: "Comment ça fonctionne",
          corps: (
            <>
              <p>Vous décrivez votre trajet une seule fois : départ, destination, dates et horaires, nombre de passagers. Votre demande part instantanément vers les transporteurs vérifiés qui couvrent votre zone de départ — autocaristes, mais aussi minibus, VTC et taxis pour les petits groupes.</p>
              <p>Chaque professionnel intéressé répond par une offre ferme et définitive : un prix TTC tout compris (carburant, péages, frais du conducteur), les caractéristiques du véhicule proposé, sa note laissée par les groupes précédents. Un transporteur, un seul prix — la règle du jeu interdit le marchandage et pousse chacun à donner son meilleur tarif dès le départ.</p>
              <p>Vous comparez tranquillement et retenez l&apos;offre qui vous convient. Ce n&apos;est qu&apos;à ce moment que les identités et coordonnées s&apos;échangent : vous finalisez directement avec le transporteur, sans intermédiaire de paiement.</p>
            </>
          ),
        },
        {
          titre: "Quel véhicule pour quel groupe ?",
          corps: (
            <>
              <p>De 1 à 8 passagers, un VTC ou un taxi suffit souvent. De 9 à 30, le minibus ou le midicar offrent le meilleur rapport confort/prix. Au-delà, l&apos;autocar standard (49 à 63 places) ou à étage (jusqu&apos;à 90 places) s&apos;imposent — avec soute à bagages, climatisation et, selon les modèles, sièges inclinables, prises USB ou toilettes.</p>
              <p>Sur DealBus, vous n&apos;avez pas à trancher vous-même : indiquez votre effectif, et les transporteurs proposent le véhicule adapté dans leur offre. C&apos;est leur métier, et leur proposition les engage.</p>
            </>
          ),
        },
        {
          titre: "Combien coûte la location d'un autocar ?",
          corps: (
            <>
              <p>Le prix dépend de la distance, de la durée de mise à disposition, de la période (les samedis de mai à septembre sont les plus demandés) et de l&apos;amplitude horaire du conducteur, encadrée par la réglementation. C&apos;est précisément pourquoi les simulateurs en ligne donnent des chiffres peu fiables : seul un professionnel qui connaît ses coûts et son planning peut établir un vrai prix.</p>
              <p>Notre conviction : la meilleure estimation, ce sont plusieurs offres fermes qui se comparent. Et pour les budgets serrés, deux leviers uniques à DealBus : l&apos;enchère en direct, où les transporteurs font baisser le prix entre eux, et les retours à vide — des trajets déjà programmés, proposés à une fraction du prix normal.</p>
            </>
          ),
        },
      ]}
      faq={[
        { q: "La publication d'une demande est-elle vraiment gratuite ?", r: "Oui, totalement gratuite et sans engagement pour les clients. Vous ne payez que le transporteur que vous choisissez, directement, au prix affiché dans son offre. DealBus se rémunère par une commission versée par le transporteur, uniquement en cas de mission réalisée." },
        { q: "Les transporteurs sont-ils fiables ?", r: "Chaque compte transporteur est validé manuellement avant d'accéder aux demandes : vérification du SIREN et du titre d'exercice (licence de transport, autorisation VTC ou taxi). Les notes et avis laissés par les groupes précédents complètent le tableau." },
        { q: "Combien d'offres vais-je recevoir ?", r: "Cela dépend de votre trajet et de votre zone de départ. Les transporteurs de votre région sont notifiés par email dès la publication ; les premières offres arrivent souvent en quelques heures." },
        { q: "Puis-je louer un autocar pour un aller simple ?", r: "Oui — aller simple, aller-retour dans la journée, ou séjour de plusieurs jours avec le véhicule sur place : le formulaire couvre tous les cas, et le prix s'adapte." },
        { q: "Le chauffeur est-il toujours inclus ?", r: "Oui. En France, la location d'autocar s'entend systématiquement avec conducteur professionnel — c'est lui qui garantit le respect de la réglementation (temps de conduite, sécurité). Les offres reçues sur DealBus incluent toujours le chauffeur." },
      ]}
      related={[
        { href: "/reserver-un-bus", label: "Réserver un bus : le guide" },
        { href: "/comparateur-devis-autocar", label: "Comparer les devis d'autocar" },
        { href: "/retours", label: "Les retours à vide du moment" },
      ]}
    />
  );
}
