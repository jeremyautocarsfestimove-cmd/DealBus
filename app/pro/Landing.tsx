import Image from "next/image";
import Link from "next/link";
import { Caveat } from "next/font/google";
import { InscriptionTransporteur } from "./InscriptionTransporteur";
import "../accueil.css";
import "../demande/demande.css";
import "./landing.css";

// Page publique de l'espace transporteur : ce que voit un autocariste avant de s'inscrire.
// Même style que l'accueil client (classes .acc), formulaire d'inscription dans la carte du haut de page.

const caveat = Caveat({ weight: ["600"], subsets: ["latin"], variable: "--font-caveat" });

const ATOUTS = [
  { titre: "Des demandes dans vos zones", texte: "Vous choisissez vos départements de prise en charge. Vous ne recevez que ce qui part de chez vous." },
  { titre: "Vos prix, votre décision", texte: "Vous répondez aux demandes qui vous intéressent, au tarif que vous fixez." },
  { titre: "Le client vous paie en direct", texte: "Acompte, solde, mandat administratif : vos conditions. Aucun paiement ne passe par DealBus." },
  { titre: "Les calculs sont faits", texte: "Distance, durée, journées et nombre de conducteurs sont estimés depuis votre dépôt." },
  { titre: "Vous parlez au client avant de chiffrer", texte: "La messagerie permet de lever un doute sans échanger de coordonnées." },
  { titre: "Des avis après chaque mission", texte: "Les clients notent la prestation une fois le transport réalisé. Vous les retrouvez dans votre espace." },
];

const FAQ = [
  { q: "Qui peut s'inscrire ?", r: "Les professionnels du transport de voyageurs avec une société française et un titre d'exercice valide : licence communautaire, carte VTC, autorisation taxi ou attestation LOTI." },
  { q: "Y a-t-il un abonnement ?", r: "Non. Recevoir les demandes et y répondre est gratuit. La commission n'est due que sur les missions que vous réalisez." },
  { q: "Quand la commission est-elle facturée ?", r: "Après le transport, sur le prix TTC de la mission. Si la mission est annulée, rien n'est dû." },
  { q: "Le client voit-il mes coordonnées ?", r: "Seulement quand il retient votre offre. Avant, les échanges passent par la messagerie." },
  { q: "Suis-je obligé de répondre à toutes les demandes ?", r: "Non. Vous répondez quand votre planning le permet." },
  { q: "Comment mon compte est-il validé ?", r: "Votre titre d'exercice et votre RC Pro sont vérifiés manuellement. Vous recevez un e-mail dès que l'accès aux demandes est ouvert." },
];

// Page /pro pour un visiteur : se connecter ou s'inscrire, rien d'autre.
export function LandingPro() {
  return (
    <main className="overflow-x-clip">
      <div className={`acc acc-pro acc-simple ${caveat.variable}`}>
        <section className="a-haut" id="haut">
          {/* Fond sans photo : quadrillage discret, lueur ambre et tracé d'un itinéraire */}
          <div className="a-decor" aria-hidden="true">
            <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
              <path d="M-40 560 C 220 520, 300 300, 520 320 S 820 470, 980 250 S 1180 90, 1260 110" />
              <circle cx="520" cy="320" r="7" />
              <circle cx="980" cy="250" r="7" />
              <circle className="a-arr" cx="1130" cy="118" r="9" />
            </svg>
          </div>
          <div>
            <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3" /></svg>Espace transporteur</span>
            <h1>Les demandes de transport <span className="a-or">de votre zone.</span></h1>
            <p className="a-in">Connectez-vous à votre espace, ou inscrivez votre entreprise pour recevoir les demandes.</p>
            <div className="a-actions">
              <Link className="a-btn a-bl" href="/login">Se connecter</Link>
              <Link className="a-btn a-contour" href="/pro/decouvrir">En savoir plus</Link>
            </div>
          </div>
          <div id="inscription">
            <div className="a-devis">
              <div className="a-tete"><h2>Inscription</h2><div className="a-prog">Gratuite, 3 étapes</div></div>
              <div className="dem dem-nu"><InscriptionTransporteur /></div>
            </div>
            <p className="a-deja">Déjà inscrit ? <Link href="/login">Se connecter</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}

// Page /pro/decouvrir : le fonctionnement expliqué, ouverte par « En savoir plus ».
export function DecouvrirPro() {
  return (
    <main className="overflow-x-clip">
      <div className={`acc acc-pro acc-decouvrir ${caveat.variable}`}>
        <section className="a-haut" id="haut">
          <Image className="a-fond" src="/img/pro.jpg" alt="" fill priority sizes="100vw" />
          <div>
            <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3" /></svg>Espace transporteur</span>
            <h1>Des demandes de transport <span className="a-rot"><b><span>dans vos zones.</span><span>sans démarchage.</span><span>sans abonnement.</span><span>prêtes à chiffrer.</span><span>dans vos zones.</span></b></span></h1>
            <p className="a-in">Des groupes cherchent un autocar près de chez vous. Vous recevez leur demande, vous envoyez votre prix, le client vous paie directement.</p>
            <ul className="a-petits">
              <li><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>Inscription gratuite</li>
              <li><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>Commission au succès</li>
              <li><svg className="a-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>Paiement direct</li>
            </ul>
            <div className="a-actions">
              <Link className="a-btn" href="/pro#inscription">Inscription gratuite</Link>
              <Link className="a-btn a-contour" href="/login">Se connecter</Link>
            </div>
          </div>
        </section>

        <section className="a-zone" id="comment">
          <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3" /></svg>Comment ça marche ?</span>
          <h2>Vous chiffrez. <em>Le client choisit.</em></h2>
          <div className="a-frise">
            <div><span className="a-n">1</span><small>une fois</small><h3>Vous vous inscrivez</h3><p>Société, titre d&apos;exercice, zones de prise en charge. Votre dossier est vérifié avant l&apos;ouverture de l&apos;accès.</p></div>
            <div><span className="a-n">2</span><small>par e-mail</small><h3>Vous recevez les demandes</h3><p>Trajet, dates, nombre de passagers, ce qu&apos;il faut prévoir. Un repère de prix du marché vous situe.</p></div>
            <div><span className="a-n">3</span><small>à votre prix</small><h3>Vous envoyez votre offre</h3><p>Le client compare et retient un transporteur. Vos coordonnées lui sont alors transmises.</p></div>
          </div>
        </section>

        <section className="a-zone a-f-nuit" id="commission">
          <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3" /></svg>Et ça coûte combien ?</span>
          <h2>Rien, tant que vous n&apos;avez pas <em>gagné une mission.</em></h2>
          <p className="a-chapo">Une commission sur le prix TTC de la mission réalisée, dégressive selon son montant. Le même taux partout en France.</p>
          <div className="a-crit a-taux">
            <div><b>9 %</b><strong>Jusqu&apos;à 2 000 €</strong><span>Sorties à la journée, transferts.</span></div>
            <div><b>7 %</b><strong>De 2 001 à 5 000 €</strong><span>Longues distances, séjours courts.</span></div>
            <div><b>5 %</b><strong>Au-delà de 5 000 €</strong><span>Séjours et circuits.</span></div>
          </div>
          <div className="a-promo">
            <div><h3>Pas d&apos;abonnement. <i>Pas de frais d&apos;inscription.</i></h3><p>Vous ne payez que sur les missions réalisées, après le transport.</p></div>
            <div className="a-ex">Exemple : une sortie à 920 € TTC<b>82,80 €</b>de commission, soit 9 %.<a className="a-btn a-bloc" href="/pro#inscription" style={{ marginTop: 14 }}>Inscription gratuite</a></div>
          </div>
        </section>

        <section className="a-zone a-f-creme" id="atouts">
          <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3" /></svg>Pourquoi DealBus ?</span>
          <h2>Du transport à faire. <em>Pas du démarchage.</em></h2>
          <div className="a-atouts">
            {ATOUTS.map((a, i) => (
              <div key={a.titre}><span className="a-num">{i + 1}</span><h3>{a.titre}</h3><p>{a.texte}</p></div>
            ))}
          </div>
        </section>

        <section className="a-zone a-c" id="questions">
          <span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3" /></svg>Avant de vous inscrire</span>
          <h2>On vous répond.</h2>
          <div className="a-faq">
            {FAQ.map((f) => (
              <details key={f.q}><summary>{f.q}</summary><p>{f.r}</p></details>
            ))}
          </div>
        </section>

        <section className="a-fin">
          <div><span className="a-main"><svg className="a-fl" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 9c6-6 14-7 22-3" /><path d="M19 2l5 4-6 3" /></svg>Votre planning a de la place ?</span><h2>Recevez les demandes de votre zone.</h2><p>L&apos;inscription prend quelques minutes. Elle est gratuite.</p></div>
          <a className="a-btn a-bl" href="/pro#inscription">Inscription gratuite</a>
        </section>
      </div>
    </main>
  );
}
