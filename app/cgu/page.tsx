import { Nav } from "@/components/Nav";

export const metadata = { title: "Conditions Générales d'Utilisation — DealBus" };

function Article({ n, titre, children }: { n: number; titre: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="h-display text-xl mb-3">
        <span className="text-ambre mr-2.5">{n}.</span>{titre}
      </h2>
      <div className="text-[14.5px] leading-relaxed text-blanc-dim space-y-3">{children}</div>
    </section>
  );
}

export default function CguPage() {
  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Cadre d&apos;utilisation</p>
        <h1 className="h-display text-4xl mb-3">Conditions Générales d&apos;Utilisation</h1>
        <p className="font-mono text-xs text-blanc-faint mb-12">
          Dernière mise à jour : 17 août 2026 · Version 1.0
        </p>

        <Article n={1} titre="Éditeur et hébergement">
          <p>
            La plateforme DealBus, accessible à l&apos;adresse dealbus.fr (ci-après « la Plateforme »),
            est éditée par DEALBUS, SASU au capital de 500 €,
            immatriculée sous le numéro SIREN 933210296, dont le siège social est situé 78270 Limetz-Villez.
          </p>
          <p>
            Directeur de la publication : Peloso Jeremy · Contact : contact@dealbus.fr.
            La Plateforme est hébergée par Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723,
            États-Unis) ; les données sont hébergées par Supabase (infrastructure située dans
            l&apos;Union européenne).
          </p>
          <p>
            DealBus est un opérateur indépendant : la Plateforme n&apos;appartient à aucun
            transporteur, groupement de transporteurs ou opérateur logistique, et n&apos;est
            liée à aucun d&apos;eux par un accord d&apos;exclusivité.
          </p>
        </Article>

        <Article n={2} titre="Objet et acceptation">
          <p>
            Les présentes Conditions Générales d&apos;Utilisation (« CGU ») encadrent l&apos;accès
            à la Plateforme et l&apos;usage de ses services. Toute navigation sur la Plateforme,
            toute création de compte et toute utilisation des services emportent acceptation
            pleine et entière des présentes CGU.
          </p>
          <p>
            DealBus peut faire évoluer les CGU à tout moment ; la version applicable est celle
            en ligne au moment de l&apos;utilisation. Les Utilisateurs inscrits sont informés des
            modifications substantielles par email ou lors de leur connexion. L&apos;usage
            continu de la Plateforme après modification vaut acceptation de la nouvelle version.
          </p>
        </Article>

        <Article n={3} titre="Définitions">
          <p><strong className="text-blanc">Client</strong> : toute personne physique ou morale (particulier, association, entreprise, établissement, collectivité) ayant créé un compte pour publier des Demandes de transport de groupe.</p>
          <p><strong className="text-blanc">Transporteur</strong> : tout professionnel du transport de personnes (autocariste, exploitant VTC, taxi, transporteur LOTI/capacitaire) ayant créé un compte professionnel, dont l&apos;inscription a été validée par DealBus.</p>
          <p><strong className="text-blanc">Demande</strong> : annonce publiée par un Client décrivant un besoin de transport (trajet, dates et horaires, effectif, précisions) et le mode de consultation choisi.</p>
          <p><strong className="text-blanc">Offre</strong> : proposition tarifaire ferme émise par un Transporteur en réponse à une Demande en mode devis.</p>
          <p><strong className="text-blanc">Enchère</strong> : mode de consultation dans lequel les Transporteurs positionnent des prix successivement décroissants jusqu&apos;à une clôture fixée par le Client.</p>
          <p><strong className="text-blanc">Retour à vide</strong> : trajet publié par un Transporteur correspondant à un repositionnement de véhicule, proposé aux Clients à prix fixe pour la location du véhicule complet.</p>
          <p><strong className="text-blanc">Sélection</strong> : acte par lequel le Client retient une Offre, valide le résultat d&apos;une Enchère, ou par lequel un Transporteur valide la réservation d&apos;un Retour à vide. La Sélection déclenche la révélation mutuelle des identités et coordonnées.</p>
          <p><strong className="text-blanc">Mission</strong> : prestation de transport issue d&apos;une Sélection, conclue directement entre le Client et le Transporteur.</p>
        </Article>

        <Article n={4} titre="Nature du service">
          <p>
            DealBus est une plateforme de mise en relation. Elle permet aux Clients de recevoir
            des propositions de Transporteurs vérifiés, de les comparer et d&apos;en retenir une ;
            elle permet aux Transporteurs d&apos;accéder à des Demandes qualifiées et de valoriser
            leurs trajets de repositionnement.
          </p>
          <p>
            DealBus n&apos;est ni transporteur, ni commissionnaire de transport, ni agence de
            voyages : la Plateforme n&apos;est pas partie au contrat de transport, lequel se forme
            directement et exclusivement entre le Client et le Transporteur au moment de la
            Sélection. Le prix de la prestation est réglé par le Client directement au
            Transporteur, selon les modalités convenues entre eux ; aucune somme n&apos;est
            encaissée par DealBus pour le compte de l&apos;un ou de l&apos;autre.
          </p>
        </Article>

        <Article n={5} titre="Comptes et validation des Transporteurs">
          <p>
            La création d&apos;un compte Client requiert un email valide et un mot de passe ;
            celle d&apos;un compte Transporteur requiert en outre l&apos;identité du responsable,
            la raison sociale, le numéro SIREN, le titre d&apos;exercice de la profession
            (licence communautaire ou de transport intérieur, autorisation de stationnement,
            inscription au registre des VTC, attestation LOTI selon le cas), le secteur
            d&apos;activité et les départements d&apos;intervention.
          </p>
          <p>
            Chaque compte Transporteur fait l&apos;objet d&apos;une validation manuelle par
            DealBus avant tout accès aux Demandes. DealBus peut solliciter toute pièce
            justificative (titre d&apos;exercice, attestation d&apos;assurance responsabilité
            civile professionnelle en cours de validité) et refuser, suspendre ou clôturer un
            compte dont les informations se révéleraient inexactes, incomplètes ou périmées.
          </p>
          <p>
            Les identifiants sont strictement personnels ; chaque Utilisateur est responsable
            de leur confidentialité et de l&apos;usage fait de son compte.
          </p>
        </Article>

        <Article n={6} titre="Demandes des Clients">
          <p>
            La publication d&apos;une Demande est gratuite et sans engagement pour le Client.
            Le Client s&apos;engage à décrire son besoin avec exactitude (trajet, horaires,
            effectif, contraintes particulières) : les propositions des Transporteurs sont
            établies sur la foi de ces informations.
          </p>
          <p>
            Un extrait anonymisé des Demandes en cours (villes, date, effectif, mode) peut être
            affiché publiquement sur la Plateforme, sans aucune donnée permettant
            d&apos;identifier le Client. Le détail des Demandes n&apos;est accessible qu&apos;aux
            Transporteurs validés intervenant dans la zone concernée, qui peuvent également en
            être informés par email.
          </p>
          <p>
            DealBus se réserve la faculté de retirer toute Demande manifestement incohérente,
            frauduleuse, sans rapport avec du transport de personnes ou contraire aux présentes CGU.
          </p>
        </Article>

        <Article n={7} titre="Mode devis : l'offre unique">
          <p>
            En mode devis, chaque Transporteur ne peut émettre qu&apos;une seule Offre par
            Demande. Cette Offre est ferme et définitive : elle ne peut être ni modifiée ni
            surenchérie, et engage le Transporteur à réaliser la prestation au prix TTC indiqué,
            toutes sujétions comprises (péages, parkings, frais de conducteur), sauf mention
            contraire explicite portée dans l&apos;Offre ou dans les conditions du Transporteur.
          </p>
          <p>
            Le Client compare les Offres reçues sur la base des éléments anonymisés fournis
            (prix, véhicule proposé, note et volume d&apos;avis, ancienneté d&apos;activité sur
            la Plateforme, conditions) et retient librement celle de son choix, selon ses
            propres critères.
          </p>
        </Article>

        <Article n={8} titre="Mode enchère">
          <p>
            En mode enchère, le Client fixe lors de la publication la date et l&apos;heure de
            clôture (au plus tard trois heures avant le départ). Les Transporteurs positionnent
            des prix successivement décroissants, chaque nouveau prix devant être inférieur
            d&apos;au moins un pour cent au meilleur prix en cours. L&apos;enchère court
            jusqu&apos;à son terme : aucune clôture anticipée n&apos;est possible, quel que soit
            le niveau de prix atteint.
          </p>
          <p>
            À la clôture, le Client dispose du choix de valider le meilleur prix — ce qui vaut
            Sélection du Transporteur correspondant — ou de ne pas donner suite, auquel cas la
            Demande est close sans qu&apos;aucune partie ne soit engagée. Chaque prix positionné
            par un Transporteur constitue un engagement ferme de réaliser la prestation à ce
            prix en cas de validation par le Client.
          </p>
        </Article>

        <Article n={9} titre="Retours à vide">
          <p>
            Un Transporteur peut publier un Retour à vide : un trajet de repositionnement de son
            véhicule, proposé à prix fixe pour la location du véhicule complet par un seul
            groupe. Il ne s&apos;agit en aucun cas de vente de places individuelles ni d&apos;un
            service régulier de transport.
          </p>
          <p>
            La réservation d&apos;un Retour à vide par un Client est soumise à la validation
            expresse du Transporteur. Tant que celui-ci n&apos;a pas statué, le trajet
            n&apos;est proposé à aucun autre Client. En cas de refus, le Client peut renouveler
            sa demande tant que le trajet demeure disponible. La validation vaut Sélection.
          </p>
        </Article>

        <Article n={10} titre="Anonymat et révélation des identités">
          <p>
            Jusqu&apos;à la Sélection, Clients et Transporteurs demeurent mutuellement anonymes :
            les Transporteurs apparaissent sous un numéro accompagné de leurs indicateurs de
            réputation ; l&apos;identité et les coordonnées du Client ne sont pas communiquées.
          </p>
          <p>
            Il est en conséquence interdit, avant Sélection, de communiquer ou de solliciter par
            quelque moyen que ce soit (contenu d&apos;une Offre, conditions, précisions de
            Demande, pièce jointe) des éléments d&apos;identification directe ou indirecte :
            nom ou raison sociale, téléphone, email, adresse de site internet, réseaux sociaux,
            ou toute formulation destinée à permettre une prise de contact hors Plateforme.
          </p>
          <p>
            La Sélection déclenche la communication réciproque des identités et coordonnées
            (nom, téléphone, email) aux seules deux parties concernées, afin de leur permettre
            de finaliser et d&apos;exécuter le contrat de transport.
          </p>
        </Article>

        <Article n={11} titre="Commission">
          <p>
            L&apos;usage de la Plateforme est intégralement gratuit pour les Clients. Les
            Transporteurs sont redevables d&apos;une commission uniquement en cas de succès,
            c&apos;est-à-dire lorsqu&apos;une Sélection aboutit à une Mission réalisée.
            Aucun abonnement, aucun frais d&apos;inscription, aucun coût d&apos;accès aux
            Demandes ne sont facturés.
          </p>
          <p>
            La commission est calculée sur le prix TTC de la Mission selon le barème dégressif
            suivant : neuf pour cent (9 %) jusqu&apos;à 2 000 € ; sept pour cent (7 %) de
            2 001 € à 5 000 € ; cinq pour cent (5 %) au-delà de 5 000 €. Ce taux est réduit
            d&apos;un point pour les Missions issues du mode enchère et de deux points pour les
            Missions issues d&apos;un Retour à vide, sans pouvoir être inférieur à trois pour
            cent (3 %). Le taux applicable est affiché au Transporteur avant tout engagement.
          </p>
          <p>
            La facture de commission est émise après la réalisation de la Mission et payable à
            réception. Le défaut de paiement des commissions dues entraîne, après relance
            restée sans effet, la suspension de l&apos;accès aux Demandes puis la clôture du
            compte, sans préjudice du recouvrement des sommes dues.
          </p>
        </Article>

        <Article n={12} titre="Annulations et vérifications">
          <p>
            Toute annulation d&apos;une Mission, qu&apos;elle émane du Client ou du
            Transporteur, doit être déclarée sans délai sur la Plateforme avec indication du
            motif. Les annulations sont enregistrées et horodatées. Une Mission régulièrement
            annulée ne donne lieu à aucune commission.
          </p>
          <p>
            Afin de garantir la sincérité des déclarations, DealBus peut interroger le Client
            après la date prévue du trajet pour confirmer la réalité de l&apos;annulation. En
            cas de déclarations divergentes ou d&apos;indices sérieux de contournement, la
            Mission est placée en litige et instruite par DealBus ; les deux parties
            s&apos;engagent à coopérer de bonne foi à cette instruction. Un taux
            d&apos;annulation anormalement élevé peut entraîner une revue du compte du
            Transporteur.
          </p>
        </Article>

        <Article n={13} titre="Loyauté de la mise en relation — droit de suite">
          <p>
            La valeur du service rendu par DealBus réside dans la mise en relation. En
            conséquence, toute prestation de transport conclue entre un Client et un
            Transporteur mis en relation par la Plateforme, portant sur la Demande ayant donné
            lieu à cette mise en relation ou en découlant directement, donne lieu à commission
            dans les conditions de l&apos;article 11 — y compris lorsqu&apos;elle est
            conclue, modifiée ou réglée en dehors de la Plateforme, et ce pendant une durée de
            douze (12) mois suivant la révélation des identités.
          </p>
          <p>
            Constitue notamment un contournement : la conclusion en direct d&apos;une prestation
            correspondant à une Demande publiée sur la Plateforme ; l&apos;annulation de
            complaisance d&apos;une Mission suivie de sa réalisation effective ; la minoration
            du prix déclaré. Tout contournement avéré rend la commission éludée immédiatement
            exigible, majorée des frais de recouvrement, et expose son auteur à la clôture
            définitive de son compte.
          </p>
          <p>
            Demeure en revanche libre de toute commission la relation commerciale nouvelle et
            distincte que les parties développeraient au-delà de la période précitée, pour des
            besoins sans lien avec la Demande d&apos;origine.
          </p>
        </Article>

        <Article n={14} titre="Obligations des Transporteurs">
          <p>Le Transporteur s&apos;engage, pendant toute la durée de son inscription, à :</p>
          <p>
            — détenir et maintenir en cours de validité l&apos;ensemble des titres, licences,
            autorisations et inscriptions requis pour l&apos;exercice de son activité, ainsi
            qu&apos;une assurance de responsabilité civile professionnelle couvrant le transport
            de personnes ;<br />
            — respecter la réglementation sociale et de sécurité applicable au transport de
            personnes, notamment les temps de conduite et de repos ;<br />
            — affecter aux Missions des conducteurs qualifiés et des véhicules conformes,
            entretenus et contrôlés ;<br />
            — honorer chaque Offre, prix d&apos;enchère et Retour à vide publiés, au prix et aux
            conditions annoncés ;<br />
            — ne pas sous-traiter une Mission sans l&apos;accord exprès du Client ;<br />
            — régler les commissions dues à réception de facture.
          </p>
        </Article>

        <Article n={15} titre="Avis et réputation">
          <p>
            À l&apos;issue d&apos;une Mission déclarée réalisée, le Client peut publier une
            évaluation du Transporteur (note de 1 à 5 et commentaire facultatif). Les
            évaluations, agrégées en une note moyenne, participent au profil public anonymisé
            du Transporteur.
          </p>
          <p>
            Les avis expriment l&apos;opinion de leurs auteurs, qui s&apos;engagent à la
            sincérité et à la mesure de leurs propos. Toute manipulation du système
            d&apos;évaluation (avis de complaisance, dénigrement organisé, sollicitation
            d&apos;avis contre avantage) est interdite. DealBus peut retirer un avis
            manifestement injurieux, mensonger ou étranger à la prestation, à la demande
            motivée d&apos;une partie ou de sa propre initiative ; le retrait entraîne le
            recalcul de la note. Des évaluations durablement insuffisantes, ou tout avis
            mettant en cause la sécurité des passagers, peuvent justifier la suspension ou la
            clôture du compte du Transporteur.
          </p>
        </Article>

        <Article n={16} titre="Suspension et clôture des comptes">
          <p>
            DealBus peut adresser un avertissement, suspendre temporairement ou clôturer
            définitivement un compte, sans indemnité, en cas de manquement aux présentes CGU,
            et notamment : informations d&apos;inscription inexactes ou périmées, tentative de
            contournement, non-paiement des commissions, comportement déloyal ou dangereux,
            usage frauduleux de la Plateforme. Sauf urgence ou fraude caractérisée, la mesure
            est précédée d&apos;une information permettant à l&apos;Utilisateur de présenter
            ses observations.
          </p>
          <p>
            Tout Utilisateur peut par ailleurs demander à tout moment la clôture de son compte
            en écrivant à contact@dealbus.fr ; les commissions afférentes aux Missions déjà
            sélectionnées restent dues.
          </p>
        </Article>

        <Article n={17} titre="Données personnelles">
          <p>
            DealBus traite les données personnelles des Utilisateurs en qualité de responsable
            de traitement, aux fins de fourniture du service (gestion des comptes, mise en
            relation, notifications, facturation des commissions, prévention de la fraude) et
            sur les bases légales de l&apos;exécution du contrat et de l&apos;intérêt légitime.
            Les données ne sont ni vendues ni transmises à des tiers à des fins commerciales ;
            elles ne sont communiquées à l&apos;autre partie d&apos;une Mission qu&apos;au
            moment de la Sélection, dans la mesure nécessaire à l&apos;exécution du contrat de
            transport.
          </p>
          <p>
            Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et
            Libertés, chaque Utilisateur dispose de droits d&apos;accès, de rectification,
            d&apos;effacement, de limitation, d&apos;opposition et de portabilité, exerçables
            à l&apos;adresse contact@dealbus.fr. Il peut introduire une réclamation auprès de
            la CNIL. Les données sont conservées pendant la durée de la relation puis archivées
            selon les durées légales applicables (notamment comptables).
          </p>
        </Article>

        <Article n={18} titre="Propriété intellectuelle">
          <p>
            La Plateforme, sa marque, son identité visuelle, ses textes, son code, ses bases de
            données et l&apos;ensemble de leurs éléments constitutifs sont la propriété
            exclusive de l&apos;éditeur. Toute reproduction, extraction ou réutilisation, en
            tout ou partie, sans autorisation écrite préalable est interdite. Les contenus
            publiés par les Utilisateurs (Demandes, Offres, conditions, avis) restent leur
            propriété ; ils concèdent à DealBus une licence non exclusive de les héberger,
            afficher et adapter techniquement pour les besoins du service.
          </p>
        </Article>

        <Article n={19} titre="Responsabilité de DealBus">
          <p>
            DealBus est tenue d&apos;une obligation de moyens quant à la disponibilité et au
            bon fonctionnement de la Plateforme, et ne saurait répondre des interruptions dues
            à la maintenance, aux réseaux ou à des causes extérieures. DealBus ne garantit ni
            aux Clients d&apos;obtenir des propositions, ni aux Transporteurs d&apos;être
            sélectionnés.
          </p>
          <p>
            N&apos;étant pas partie au contrat de transport, DealBus n&apos;encourt aucune
            responsabilité au titre de la formation, de l&apos;exécution, de
            l&apos;inexécution ou du paiement de la prestation de transport, qui relèvent
            exclusivement du Client et du Transporteur. En toute hypothèse, et dans la limite
            permise par la loi, la responsabilité de DealBus est exclue pour les préjudices
            indirects et plafonnée, tous préjudices confondus, aux sommes effectivement
            perçues de l&apos;Utilisateur concerné au cours des six mois précédant le fait
            générateur.
          </p>
        </Article>

        <Article n={20} titre="Droit applicable et litiges">
          <p>
            Les présentes CGU sont soumises au droit français. En cas de différend, les parties
            rechercheront prioritairement une solution amiable. Le Client consommateur peut
            recourir gratuitement au médiateur de la consommation dont relève DealBus
            ou à la plateforme européenne de règlement en ligne des
            litiges. À défaut de résolution amiable, compétence est attribuée aux tribunaux
            français ; pour les Utilisateurs professionnels, compétence exclusive est attribuée
            au tribunal des activités économiques du ressort du siège de l&apos;éditeur.
          </p>
        </Article>

        <p className="font-mono text-[11px] text-blanc-faint border-t border-ligne pt-6 mt-12">
          Document établi le 17 août 2026. Pour toute question relative aux présentes :
          contact@dealbus.fr.
        </p>
      </main>
    </>
  );
}
