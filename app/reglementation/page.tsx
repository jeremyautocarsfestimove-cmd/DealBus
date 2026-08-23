import type { Metadata } from "next";
import { SeoPage } from "../_seo/SeoPage";

export const metadata: Metadata = {
  title: "Réglementation du transport de voyageurs en autocar — le guide de l'organisateur | DealBus",
  description:
    "Temps de conduite, pauses, amplitude, double équipage, liste des passagers : la réglementation autocar expliquée simplement aux organisateurs de voyages de groupe. Ce qu'elle change pour votre trajet.",
  alternates: { canonical: "https://dealbus.fr/reglementation" },
};

export default function ReglementationPage() {
  return (
    <SeoPage
      eyebrow="Le guide de l'organisateur"
      h1={<>La réglementation autocar, expliquée simplement<span className="text-ambre">.</span></>}
      intro="Le transport de voyageurs est l'un des secteurs les plus encadrés de France — et c'est tant mieux pour la sécurité de votre groupe. Mais ces règles s'imposent aussi à vous, organisateur : elles déterminent les horaires possibles, le nombre de conducteurs nécessaires et vos obligations à bord. Voici l'essentiel, sans jargon."
      sections={[
        {
          titre: "Le temps de conduite : 9 heures par jour, 4 h 30 d'affilée",
          corps: (
            <>
              <p>
                Un conducteur d&apos;autocar ne peut pas conduire plus de <strong className="text-blanc">9 heures par jour</strong> (10 heures
                deux fois par semaine maximum, règlement européen 561/2006). Et jamais plus de <strong className="text-blanc">4 h 30 sans
                interruption</strong> : au-delà, une pause de 45 minutes est obligatoire — ou 15 minutes puis 30 minutes réparties
                dans la période. De nuit (21 h – 6 h), la conduite continue est limitée à 4 heures.
              </p>
              <p>
                Concrètement pour vous : sur un Paris → Marseille (environ 8 heures de route), votre planning doit intégrer
                ces pauses. Elles ne sont pas négociables — le conducteur qui les saute risque sa licence, et votre sécurité.
              </p>
            </>
          ),
        },
        {
          titre: "L'amplitude : la journée du conducteur ne commence pas à votre départ",
          corps: (
            <>
              <p>
                L&apos;amplitude est le temps entre la prise de service du conducteur et sa fin de service — préparation du véhicule
                comprise, avant et après votre trajet. Elle est plafonnée à <strong className="text-blanc">12 heures, extensibles à 14 heures
                en service occasionnel</strong> avec des coupures obligatoires (2 h 30 minimum entre 12 et 13 heures d&apos;amplitude,
                3 heures au-delà).
              </p>
              <p>
                C&apos;est LA règle que les organisateurs découvrent trop tard : partir à 6 h et rentrer à 23 h avec un seul
                conducteur est <strong className="text-blanc">impossible légalement</strong>. Pour les journées longues, deux solutions : réduire
                l&apos;amplitude du programme, ou prévoir un <strong className="text-blanc">double équipage</strong> (deux conducteurs, amplitude
                portée à 18 heures) — plus cher, mais parfois incontournable.
              </p>
            </>
          ),
        },
        {
          titre: "Le repos : 11 heures par nuit, incompressible ou presque",
          corps: (
            <p>
              Entre deux journées de travail, le conducteur doit bénéficier de <strong className="text-blanc">11 heures de repos
              consécutives</strong> (réductibles à 9 heures, trois fois maximum entre deux repos hebdomadaires). Sur un séjour
              de plusieurs jours, votre conducteur ne peut donc pas être disponible à toute heure : si votre groupe rentre
              à 1 h du matin, il ne repartira pas à 8 h. Anticipez-le dans votre programme — ou prévoyez que l&apos;autocar
              reste sur place avec son conducteur (frais d&apos;hébergement à intégrer au devis).
            </p>
          ),
        },
        {
          titre: "Vos obligations d'organisateur à bord",
          corps: (
            <>
              <p>
                Depuis 2009, une <strong className="text-blanc">liste nominative des passagers</strong> doit être présente à bord pour tout
                service occasionnel sortant du département d&apos;origine ou des départements limitrophes — avec, pour les
                groupes d&apos;enfants, les coordonnées d&apos;une personne à contacter. C&apos;est à vous, organisateur, de l&apos;établir
                et de la remettre à votre accompagnateur.
              </p>
              <p>
                À bord, vous êtes aussi le relais du conducteur : port de la ceinture obligatoire pour tous, passagers
                assis pendant le trajet, calme suffisant, et — le nerf de la guerre — <strong className="text-blanc">respect des horaires de
                rendez-vous</strong> après chaque visite. Un groupe en retard de 45 minutes peut mettre le conducteur hors
                réglementation pour le retour.
              </p>
            </>
          ),
        },
        {
          titre: "Les documents que votre transporteur doit détenir",
          corps: (
            <p>
              Tout autocariste doit être inscrit au registre des transporteurs et détenir une <strong className="text-blanc">licence de
              transport intérieur</strong> (ou communautaire), une assurance responsabilité civile professionnelle, et des
              véhicules à jour de contrôle technique. Sur DealBus, ces éléments sont <strong className="text-blanc">contrôlés à
              l&apos;inscription de chaque transporteur</strong> — SIREN, licence, RC Pro — avant qu&apos;il puisse répondre à la
              moindre demande. Vous n&apos;avez pas à jouer les inspecteurs : c&apos;est fait.
            </p>
          ),
        },
        {
          titre: "Ce que ça change pour votre demande de devis",
          corps: (
            <p>
              Quand vous publiez un trajet sur DealBus, donnez des horaires réalistes et complets (départ, retour, étapes) :
              les transporteurs calculent immédiatement si votre programme tient en simple équipage ou exige un second
              conducteur — et leurs prix en dépendent directement. Un programme précis = des offres justes et comparables,
              sans mauvaise surprise à la réservation. En cas de doute sur la faisabilité de vos horaires, posez la
              question dans le champ libre de votre demande : les professionnels vous répondront.
            </p>
          ),
        },
      ]}
      faq={[
        {
          q: "Combien d'heures un conducteur d'autocar peut-il conduire par jour ?",
          r: "9 heures de conduite maximum par jour (10 heures deux fois par semaine), sans jamais dépasser 4 h 30 de conduite continue — une pause de 45 minutes est alors obligatoire. La nuit (21 h – 6 h), la conduite continue est limitée à 4 heures.",
        },
        {
          q: "Qu'est-ce que l'amplitude d'un conducteur d'autocar ?",
          r: "C'est la durée totale entre sa prise et sa fin de service, préparation du véhicule comprise. Elle est limitée à 12 heures, extensibles à 14 heures en service occasionnel avec coupures obligatoires, et à 18 heures en double équipage (deux conducteurs).",
        },
        {
          q: "Quand faut-il prévoir deux conducteurs pour un voyage en autocar ?",
          r: "Dès que la journée dépasse 14 heures d'amplitude (départ très matinal et retour tardif, par exemple), ou pour les longues distances effectuées d'une traite. Le double équipage porte l'amplitude autorisée à 18 heures — un surcoût à anticiper dans votre budget.",
        },
        {
          q: "La liste des passagers est-elle obligatoire en autocar ?",
          r: "Oui, depuis le 1er juillet 2009, pour tout service occasionnel sortant du département d'origine ou des départements limitrophes. Elle est établie par l'organisateur et présente à bord ; pour les groupes d'enfants, elle inclut les coordonnées d'une personne à contacter.",
        },
        {
          q: "Que se passe-t-il si mon groupe est en retard au moment du retour ?",
          r: "Le conducteur reste soumis à ses limites de conduite et d'amplitude : un retard important peut l'empêcher légalement d'effectuer le retour prévu. Respecter les horaires convenus fait partie des obligations de l'organisateur — en cas d'imprévu, prévenez le conducteur au plus tôt.",
        },
        {
          q: "DealBus vérifie-t-il que les transporteurs respectent la réglementation ?",
          r: "DealBus contrôle à l'inscription les documents de chaque transporteur : SIREN, licence de transport et assurance RC Pro. Le respect opérationnel des temps de conduite relève du transporteur, contrôlé par l'État (DREAL) — les avis clients publiés après chaque mission complètent cette transparence.",
        },
      ]}
      related={[
        { href: "/location-autocar", label: "Location d'autocar avec chauffeur" },
        { href: "/reserver-un-bus", label: "Réserver un bus pour un groupe" },
        { href: "/comparateur-devis-autocar", label: "Comparer les devis d'autocar" },
      ]}
    />
  );
}
