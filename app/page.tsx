import Image from "next/image";
import { Caveat } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AvisClients } from "@/components/AvisClients";
import { DevisRapide } from "@/components/DevisRapide";
import "./accueil.css";

// Accueil client : une seule action, demander un devis. Le haut de page porte la carte de devis,
// les sections suivantes répondent aux questions dans l'ordre où on se les pose.
// Onglets « Pour qui » et « Véhicule » en CSS seul (boutons radio), sans script.

const caveat = Caveat({ weight: ["600"], subsets: ["latin"], variable: "--font-caveat" });

/* eslint-disable @next/next/no-img-element */
export default function Home() {
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <div className={`acc ${caveat.variable}`}>
<section className="a-haut" id="haut">
  <Image className="a-fond" src="/img/msm.webp" alt="" fill priority sizes="100vw" />
  <div>
    <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3"/></svg>Partout en France et en Europe</span>
    <h1>Location d&apos;autocar avec chauffeur pour <span className="a-rot"><b><span>votre classe.</span><span>votre club.</span><span>votre mariage.</span><span>votre séminaire.</span><span>votre classe.</span></b></span></h1>
    <p className="a-in">Une seule demande, gratuite. Les autocaristes de votre région vous envoient leur prix, vous comparez et vous choisissez.</p>
    <ul className="a-petits">
      <li><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15 9a3.5 3.5 0 1 0 0 6M7.5 11h5M7.5 13h5"/></svg>Devis gratuit</li>
      <li><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16 9.5"/></svg>Sans engagement</li>
      <li><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2.2 2.2L15 10"/></svg>Autocaristes vérifiés</li>
    </ul>
  </div>

  <div id="devis">
    <DevisRapide />
    <div className="a-nuit"><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2.2 2.2L15 10"/></svg><div><b>Votre identité reste masquée</b><br /><span>jusqu&apos;à ce que vous choisissiez un autocariste.</span></div></div>
  </div>
</section>

<section className="a-zone" id="comment">
  <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3"/></svg>Comment ça marche ?</span>
  <h2>Un devis simple et rapide. <em>En trois étapes.</em></h2>
  <div className="a-frise">
    <div><span className="a-n">1</span><small>deux minutes</small><h3>Vous décrivez votre trajet</h3><p>Départ, destination, dates, nombre de passagers. Une fourchette de prix s&apos;affiche aussitôt.</p></div>
    <div><span className="a-n">2</span><small>le meilleur prix</small><h3>Les autocaristes vous répondent</h3><p>Chacun envoie une offre ferme : prix tout compris, véhicule, ce qui est inclus.</p></div>
    <div><span className="a-n">3</span><small>le jour J</small><h3>Vous choisissez et vous partez</h3><p>Vous retenez l&apos;offre qui vous convient et vous réglez directement le transporteur.</p></div>
  </div>
</section>

<section className="a-zone a-c a-f-creme" id="pour-qui">
  <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3"/></svg>Pour qui ?</span>
  <h2>Pour tous vos déplacements en groupe.</h2>
  <input className="a-x" type="radio" name="qui" id="q-ecoles" defaultChecked /><input className="a-x" type="radio" name="qui" id="q-assos" /><input className="a-x" type="radio" name="qui" id="q-cse" /><input className="a-x" type="radio" name="qui" id="q-mariages" /><input className="a-x" type="radio" name="qui" id="q-clubs" /><input className="a-x" type="radio" name="qui" id="q-coll" />
  <div className="a-seg"><label htmlFor="q-ecoles"><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11.5V16c1.5 1.5 8.5 1.5 10 0v-4.5"/></svg>Écoles</label><label htmlFor="q-assos"><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.100.9-4.400 4.3 1 6.100L12 17l-5.400 2.9 1-6.100L3.2 9.5l6.100-.9z"/></svg>Associations</label><label htmlFor="q-cse"><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/></svg>Entreprises et CSE</label><label htmlFor="q-mariages"><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.7-7 10-7 10z"/></svg>Mariages</label><label htmlFor="q-clubs"><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0zM6 5H4c0 3 1 4 4 4M18 5h2c0 3-1 4-4 4M12 13v4M8 20h8"/></svg>Clubs sportifs</label><label htmlFor="q-coll"><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16M6 20V10M10 20V10M14 20V10M18 20V10M3 10l9-6 9 6z"/></svg>Collectivités</label></div>
  <div className="a-pans"><div className="a-pan" id="p-ecoles"><img src="/img/groupes/ecoles.webp" alt="Location d&apos;autocar pour écoles" loading="lazy" /><div><h3>Écoles</h3><p>Sorties à la journée, classes découverte, voyages de fin d&apos;année. Les transporteurs acceptent le mandat administratif.</p><div className="a-tags"><span>Sorties scolaires</span><span>Classes découverte</span><span>Voyages linguistiques</span><span>Piscine et gymnase</span></div><div className="a-acts"><a className="a-btn" href="/demande?organisme=ecole">Demander un devis</a></div></div></div><div className="a-pan" id="p-assos"><img src="/img/groupes/associations.webp" alt="Location d&apos;autocar pour associations" loading="lazy" /><div><h3>Associations</h3><p>La sortie annuelle des adhérents, le voyage des aînés. Le car peut rester sur place toute la journée.</p><div className="a-tags"><span>Sorties annuelles</span><span>Voyages des aînés</span><span>Excursions</span><span>Séjours</span></div><div className="a-acts"><a className="a-btn" href="/demande?organisme=association">Demander un devis</a></div></div></div><div className="a-pan" id="p-cse"><img src="/img/groupes/cse.webp" alt="Location d&apos;autocar pour entreprises et cse" loading="lazy" /><div><h3>Entreprises et CSE</h3><p>Séminaires, arbres de Noël, navettes entre plusieurs sites. Facture au nom de la société.</p><div className="a-tags"><span>Séminaires</span><span>Arbres de Noël</span><span>Navettes</span><span>Sorties du personnel</span></div><div className="a-acts"><a className="a-btn" href="/demande?organisme=cse">Demander un devis</a></div></div></div><div className="a-pan" id="p-mariages"><img src="/img/groupes/mariages.webp" alt="Location d&apos;autocar pour mariages" loading="lazy" /><div><h3>Mariages</h3><p>Navettes des invités entre la cérémonie et la réception, retours échelonnés en fin de soirée.</p><div className="a-tags"><span>Navettes invités</span><span>Retours de nuit</span><span>Minibus</span><span>Autocar</span></div><div className="a-acts"><a className="a-btn" href="/demande?organisme=mariage">Demander un devis</a></div></div></div><div className="a-pan" id="p-clubs"><img src="/img/groupes/clubs.webp" alt="Location d&apos;autocar pour clubs sportifs" loading="lazy" /><div><h3>Clubs sportifs</h3><p>Matchs à l&apos;extérieur, tournois, stages. Soute pour le matériel, départs tôt et retours tardifs.</p><div className="a-tags"><span>Matchs</span><span>Tournois</span><span>Stages</span><span>Supporters</span></div><div className="a-acts"><a className="a-btn" href="/demande?organisme=club">Demander un devis</a></div></div></div><div className="a-pan" id="p-coll"><img src="/img/groupes/collectivites.webp" alt="Location d&apos;autocar pour collectivités" loading="lazy" /><div><h3>Collectivités</h3><p>Centres de loisirs, colonies, sorties des seniors. Demandes groupées sur l&apos;année.</p><div className="a-tags"><span>Centres de loisirs</span><span>Colonies</span><span>Sorties seniors</span><span>Mandat administratif</span></div><div className="a-acts"><a className="a-btn" href="/demande?organisme=collectivite">Demander un devis</a></div></div></div></div>
</section>

<section className="a-zone a-f-gris" id="vehicule">
  <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3"/></svg>On sera combien, déjà ?</span>
  <h2>Le bon véhicule <em>pour votre groupe.</em></h2>
  <div className="a-panneau">
    <input className="a-x" type="radio" name="nb" id="n-a" /><input className="a-x" type="radio" name="nb" id="n-b" /><input className="a-x" type="radio" name="nb" id="n-c" defaultChecked /><input className="a-x" type="radio" name="nb" id="n-d" /><input className="a-x" type="radio" name="nb" id="n-e" />
    <div className="a-seg"><label htmlFor="n-a">Moins de 20</label><label htmlFor="n-b">20 à 35</label><label htmlFor="n-c">36 à 57</label><label htmlFor="n-d">58 à 63</label><label htmlFor="n-e">Plus de 63</label></div>
    <div className="a-vps"><div className="a-vp" id="v-a"><h3>Minibus</h3><b>9 à 22 places</b><p>Pour les petits groupes, les transferts et les navettes.</p><a className="a-lien" href="/demande?passagers=19">Utiliser ce nombre dans mon devis ›</a></div><div className="a-vp" id="v-b"><h3>Midicar</h3><b>30 à 39 places</b><p>Pour les groupes moyens et les accès étroits.</p><a className="a-lien" href="/demande?passagers=35">Utiliser ce nombre dans mon devis ›</a></div><div className="a-vp" id="v-c"><h3>Autocar</h3><b>49 à 57 places</b><p>Confortable et spacieux, pour les longs trajets ou les visites.</p><a className="a-lien" href="/demande?passagers=53">Utiliser ce nombre dans mon devis ›</a></div><div className="a-vp" id="v-d"><h3>Autocar grande capacité</h3><b>59 à 63 places</b><p>Un seul véhicule pour un grand groupe.</p><a className="a-lien" href="/demande?passagers=61">Utiliser ce nombre dans mon devis ›</a></div><div className="a-vp" id="v-e"><h3>Plusieurs véhicules</h3><b>Deux autocars ou plus</b><p>Les transporteurs proposent la combinaison adaptée.</p><a className="a-lien" href="#devis">Utiliser ce nombre dans mon devis ›</a></div></div>
  </div>
</section>

<section className="a-zone a-f-nuit" id="prix">
  <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3"/></svg>Et ça coûte combien ?</span>
  <h2>Un prix ferme. <em>Selon votre trajet.</em></h2>
  <p className="a-chapo">Aucun trajet ne se ressemble. Le prix d&apos;un autocar avec chauffeur dépend de plusieurs critères :</p>
  <div className="a-crit">
    <div><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><strong>La durée</strong><span>Une journée ou plusieurs jours.</span></div>
    <div><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8"/></svg><strong>Le trajet</strong><span>Le départ et la destination.</span></div>
    <div><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/></svg><strong>La date</strong><span>Semaine, samedi, haute saison.</span></div>
    <div><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="3"/><path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5"/><circle cx="17" cy="8" r="2.5"/><path d="M17 13c2.2 0 3.6 1.2 4.2 3.5"/></svg><strong>Le groupe</strong><span>Le nombre de passagers.</span></div>
    <div><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5"/></svg><strong>Les équipements</strong><span>Ceux que vous souhaitez à bord.</span></div>
  </div>
  <div className="a-promo">
    <div><h3>Plusieurs offres à comparer. <i>Rien à payer à DealBus.</i></h3><p>Vous voyez une fourchette avant d&apos;envoyer votre demande, puis les prix fermes des autocaristes.</p></div>
    <div className="a-ex">Une fourchette s&apos;affiche pendant votre demande, calculée sur les devis déjà envoyés par les autocaristes.<a className="a-btn a-bloc" href="#devis" style={{ marginTop: 14 }}>Calculer mon devis</a></div>
  </div>
</section>

<section className="a-zone" id="destinations">
  <div className="a-dest">
    <div>
      <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3"/></svg>Et vous ?</span>
      <h2>Où allez-vous <em>cette saison ?</em></h2>
      <div className="a-villes"><a href="/voyages/parcs-attractions?vers=Disneyland%20Paris">Disneyland Paris</a><a href="/voyages/normandie-bretagne?vers=Mont-Saint-Michel">Mont-Saint-Michel</a><a href="/voyages/normandie-bretagne?vers=Plages%20du%20D%C3%A9barquement">Plages du Débarquement</a><a href="/voyages/parcs-attractions?vers=Puy%20du%20Fou">Puy du Fou</a><a href="/voyages/journee-mer?vers=Deauville">Deauville</a><a href="/voyages/marches-de-noel">Strasbourg</a><a href="/location-autocar">Toutes les destinations ›</a></div>
    </div>
    <div className="a-rail">
      <a href="/voyages/marches-de-noel"><img src="/img/noel.webp" alt="Marchés de Noël en autocar" loading="lazy" /><span>Marchés de Noël</span></a>
      <a href="/voyages/journee-mer"><img src="/img/mer.webp" alt="Journée à la mer en autocar" loading="lazy" /><span>Journée à la mer</span></a>
      <a href="/voyages/chateaux-loire"><img src="/img/chateau.webp" alt="Châteaux de la Loire en autocar" loading="lazy" /><span>Châteaux de la Loire</span></a>
    </div>
  </div>
</section>


        </div>

        <AvisClients />

        <div className={`acc ${caveat.variable}`}>
<section className="a-zone a-c a-f-creme" id="questions">
  <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3"/></svg>Encore une petite question…</span>
  <h2>On vous répond.</h2>
  <div className="a-faq">
    <details><summary>Combien ça coûte ?</summary><p>Rien pour vous. DealBus se rémunère par une commission versée par le transporteur, uniquement s&apos;il remporte la mission.</p></details>
    <details><summary>Suis-je obligé d&apos;accepter une offre ?</summary><p>Non. Vous comparez, vous posez vos questions, et vous pouvez clore la demande sans donner suite.</p></details>
    <details><summary>Comment se passe le paiement ?</summary><p>Directement avec le transporteur retenu, selon ses conditions (acompte, solde, mandat administratif pour les établissements publics).</p></details>
    <details><summary>Combien de temps à l&apos;avance ?</summary><p>2 à 6 semaines dans l&apos;idéal, davantage pour les samedis de mai, juin et septembre et les marchés de Noël.</p></details>
    <details><summary>Et si le transporteur annule ?</summary><p>Toute annulation est motivée et validée par DealBus. Votre demande est relancée en priorité auprès des autres transporteurs.</p></details>
    <details><summary>Peut-on aller à l&apos;étranger ?</summary><p>Oui pour la destination. Le départ doit se situer en France pour que les transporteurs de votre zone répondent.</p></details>
  </div>
</section>

<section className="a-fin">
  <div><span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3"/></svg>Votre groupe a hâte</span><h2>Recevez vos offres dans la journée.</h2><p>Décrivez votre voyage en deux minutes, c&apos;est gratuit et sans engagement.</p></div>
  <a className="a-btn a-bl" href="#devis">Calculer mon devis</a>
</section>

        </div>
      </main>
      <Footer />
    </>
  );
}
