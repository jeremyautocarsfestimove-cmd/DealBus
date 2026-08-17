import type { Metadata } from "next";
import { SeoPage } from "../_seo/SeoPage";

export const metadata: Metadata = {
  title: "Comparateur de devis d'autocar : recevez et comparez les vrais prix",
  description:
    "Comparez les devis d'autocar sans démarcher : une seule demande, plusieurs offres fermes de transporteurs vérifiés, notes et avis à l'appui. Et l'enchère inversée pour faire baisser les prix.",
  alternates: { canonical: "/comparateur-devis-autocar" },
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Comparateur de devis"
      h1={<>Comparer les devis d&apos;autocar, <span className="text-ambre">sans démarcher personne.</span></>}
      intro="Obtenir trois devis d'autocar à l'ancienne, c'est six appels, quatre messageries, deux relances et des prix impossibles à comparer — l'un inclut les péages, l'autre non, le troisième « reviendra vers vous ». DealBus inverse la mécanique : une demande unique, et des offres normalisées qui se comparent réellement."
      sections={[
        {
          titre: "Des offres réellement comparables",
          corps: (
            <>
              <p>Toutes les offres reçues sur DealBus suivent le même format : un prix TTC tout compris, le type de véhicule et son nombre de places, l&apos;année du véhicule, les conditions particulières éventuelles, et la réputation du transporteur (note moyenne et nombre d&apos;avis de groupes réels). Vous comparez des choses comparables — enfin.</p>
              <p>La règle du prix unique change tout : chaque transporteur n&apos;a droit qu&apos;à une seule offre par demande, ferme et définitive. Impossible de « voir venir » avec un prix gonflé puis de négocier : celui qui veut la mission donne son meilleur prix du premier coup.</p>
            </>
          ),
        },
        {
          titre: "L'enchère inversée : le comparateur qui négocie pour vous",
          corps: (
            <p>Pour aller plus loin que la comparaison, le mode enchère met les transporteurs en concurrence directe : vous fixez l&apos;heure de clôture, et chaque professionnel peut battre le meilleur prix en cours d&apos;au moins 1 %. Le prix ne monte jamais, il ne fait que descendre — et à la clôture, vous restez libre de valider ou non. C&apos;est la négociation, sans avoir à négocier.</p>
          ),
        },
        {
          titre: "Ce que les simulateurs ne vous disent pas",
          corps: (
            <p>Les calculateurs de prix automatiques ignorent l&apos;essentiel : le planning réel des transporteurs, les contraintes d&apos;amplitude des conducteurs, la saison, et surtout les opportunités — comme un véhicule qui repasse justement par votre région. C&apos;est pourquoi DealBus n&apos;affiche aucune estimation théorique : uniquement de vrais prix, engageants, émis par des professionnels vérifiés qui connaissent leurs coûts. Et pour les opportunités, la section retours à vide liste les trajets déjà programmés, à prix cassé.</p>
          ),
        },
      ]}
      faq={[
        { q: "Combien de devis vais-je recevoir ?", r: "Autant qu'il y a de transporteurs disponibles et intéressés dans votre zone — chacun ne pouvant en déposer qu'un seul. Les transporteurs de votre région sont notifiés dès la publication de votre demande." },
        { q: "Les devis sont-ils engageants ?", r: "Oui. Chaque offre déposée sur DealBus engage le transporteur à réaliser la prestation au prix indiqué, toutes sujétions comprises sauf mention contraire explicite dans ses conditions. C'est inscrit dans nos CGU." },
        { q: "Comment être sûr de comparer à prestations égales ?", r: "Chaque offre précise le véhicule (type, capacité, année) et les conditions. À prix proche, la note du transporteur et le véhicule proposé font la différence — tout est affiché côte à côte." },
        { q: "L'enchère m'engage-t-elle à accepter le prix final ?", r: "Non. À la clôture, vous validez le meilleur prix... ou pas. Tant que vous n'avez pas validé, rien n'est engagé de votre côté — chaque prix positionné n'engage que le transporteur qui l'a posé." },
        { q: "Pourquoi est-ce gratuit pour moi ?", r: "DealBus se rémunère par une commission modérée versée par le transporteur, uniquement lorsqu'une mission se réalise. Vous ne payez jamais la plateforme, et les prix affichés sont ceux que vous réglez au transporteur." },
      ]}
      related={[
        { href: "/location-autocar", label: "Location d'autocar avec chauffeur" },
        { href: "/reserver-un-bus", label: "Réserver un bus : le guide" },
        { href: "/retours", label: "Les retours à vide du moment" },
      ]}
    />
  );
}
