// Contenu de l'email de prospection transporteurs — partagé entre
// le back-office (/admin/prospection) et le script scripts/campagne.

export const DEPTS: Record<string, string> = {
  "14": "le Calvados", "27": "l'Eure", "28": "l'Eure-et-Loir", "50": "la Manche",
  "60": "l'Oise", "61": "l'Orne", "76": "la Seine-Maritime", "78": "les Yvelines",
  "91": "l'Essonne", "95": "le Val-d'Oise",
};

export type Prospect = { email: string; societe?: string | null; departement?: string | null };

export function sujetProspection(p: Prospect): string {
  const zone = p.departement ? DEPTS[p.departement] : undefined;
  return zone
    ? `Nouvelle plateforme — nous cherchons nos autocaristes partenaires dans ${zone}`
    : `Nouvelle plateforme — nous cherchons nos autocaristes partenaires`;
}

export function texteProspection(p: Prospect): string {
  const bonjour = p.societe ? `Bonjour,\n\n(Message à l'attention de ${p.societe})` : "Bonjour,";
  return `${bonjour}

DealBus est une plateforme toute neuve, et nous cherchons nos premiers transporteurs partenaires. Pas de chiffres gonflés, pas de promesses de milliers de clients — juste une réalité de marketplace que vous connaissez aussi bien que nous : les clients arriveront, mais sans transporteurs pour leur répondre, il n'y a pas de clients. C'est donc par vous que tout commence.

Pourquoi nous rejoindre maintenant ? Parce que je l'ai pensée en connaissant votre métier de l'intérieur — les devis envoyés le soir restés sans réponse, les plateformes qui prélèvent 10 à 13 % en apportant de moins en moins, et ces cars qui rentrent vides après une dépose, conducteur payé et gasoil brûlé pour zéro euro de chiffre.

Ce que j'ai construit pour y répondre :

→ Des demandes qualifiées, directement par email. Les groupes (associations, CSE, mariages, écoles, clubs) publient leurs trajets ; vous recevez ceux qui partent de vos départements. Vous répondez si ça vous arrange, au prix que VOUS fixez — un devis ferme, la règle du prix unique s'appliquant à tous.

→ Vos retours à vide, enfin monétisés. Vous rentrez de Barcelone, de Bretagne, des stations ? Publiez le trajet retour à votre prix : un groupe peut réserver le car complet. Le kilomètre subi devient du chiffre — aucune autre plateforme ne le propose.

→ Des conditions de partenaires. Zéro abonnement, zéro frais d'inscription, zéro engagement. Une commission uniquement quand vous gagnez une mission : 5 à 9 % selon le montant, encore réduite sur les retours à vide, facturée après la prestation — jamais avant. Et le client vous règle en direct : la plateforme ne touche jamais votre argent.

Être parmi les premiers a un avantage concret : les premiers inscrits de chaque département recevront naturellement les premières demandes de leur zone, sans concurrence ou presque.

L'inscription prend 2 minutes, chaque compte est vérifié et validé sous 24 h :

→ https://dealbus.fr/pro

Une question, un doute ? Répondez simplement à cet email — c'est moi qui vous lirai.

Bonne route,
Jeremy, de DealBus™
contact@dealbus.fr · https://dealbus.fr

—
Pour ne plus recevoir nos messages : répondez « STOP » et votre adresse sera retirée immédiatement.`;
}

export function htmlProspection(p: Prospect): string {
  const zone = p.departement ? DEPTS[p.departement] : undefined;
  const par = (t: string) => `<p style="margin:0 0 15px;font-size:14.5px;line-height:1.65;color:#3A4150;">${t}</p>`;
  const bloc = (titre: string, texte: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr>
    <td style="background:#FBF6EA;border-left:3px solid #E8A63D;border-radius:0 6px 6px 0;padding:12px 16px;">
      <div style="font-size:14px;font-weight:700;color:#12151B;margin-bottom:3px;">${titre}</div>
      <div style="font-size:13.5px;line-height:1.55;color:#5A6170;">${texte}</div>
    </td></tr></table>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#EDEAE2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEAE2;padding:26px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #DDD8CC;">
<tr><td style="background:#12151B;padding:17px 30px;">
  <span style="display:inline-block;width:11px;height:11px;background:#E8A63D;border-radius:2px;margin-right:9px;vertical-align:middle;"></span>
  <span style="font-family:Arial Black,Arial,sans-serif;font-size:16px;font-weight:900;letter-spacing:2.5px;color:#F5F2EA;vertical-align:middle;">DEAL<span style="color:#E8A63D;">BUS</span><sup style="font-size:8px;font-weight:400;opacity:0.6;">™</sup></span>
</td></tr>
<tr><td style="padding:28px 30px 24px;font-family:Arial,Helvetica,sans-serif;">
  <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;color:#12151B;">Nous cherchons nos autocaristes partenaires${zone ? ` dans ${zone}` : ""}.</h1>
  ${par(`Bonjour${p.societe ? ` <strong>${p.societe}</strong>` : ""},`)}
  ${par(`<strong>DealBus est une plateforme toute neuve</strong>, et nous cherchons nos premiers transporteurs partenaires. Pas de chiffres gonflés — juste une réalité de marketplace que vous connaissez : les clients arriveront, mais <strong>sans transporteurs pour leur répondre, il n'y a pas de clients</strong>. C'est par vous que tout commence.`)}
  ${par(`Je l'ai pensée en connaissant votre métier de l'intérieur — les devis restés sans réponse, les plateformes qui prélèvent 10 à 13 %, et ces cars qui rentrent <strong>vides</strong> après une dépose, conducteur payé et gasoil brûlé pour zéro euro de chiffre.`)}
  ${bloc("Des demandes qualifiées, par email", "Les groupes (associations, CSE, mariages, écoles) publient leurs trajets ; vous recevez ceux de vos départements. Vous répondez si ça vous arrange, au prix que VOUS fixez.")}
  ${bloc("Vos retours à vide, enfin monétisés", "Publiez vos trajets retour à votre prix : un groupe réserve le car complet. Le kilomètre subi devient du chiffre — personne d'autre ne le propose.")}
  ${bloc("Des conditions de partenaires", "0 € d'abonnement, 0 engagement. Commission uniquement sur les missions gagnées : 5 à 9 %, réduite sur les retours à vide, facturée après la prestation. Le client vous règle en direct.")}
  ${par(`Avantage concret d'être parmi les premiers : <strong>les premiers inscrits de chaque département recevront les premières demandes de leur zone</strong>, sans concurrence ou presque.`)}
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;"><tr><td style="border-radius:5px;background:#E8A63D;">
    <a href="https://dealbus.fr/pro" target="_blank" style="display:inline-block;padding:13px 26px;font-size:14.5px;font-weight:700;color:#12151B;text-decoration:none;font-family:Arial,sans-serif;">S'inscrire en 2 minutes &rarr;</a>
  </td></tr></table>
  ${par(`<span style="font-size:13px;color:#6B7280;">Compte vérifié et validé sous 24 h. Une question ? Répondez à cet email — c'est moi qui vous lirai.</span>`)}
  ${par(`Bonne route,<br/><strong>Jeremy, de DealBus™</strong>`)}
</td></tr>
<tr><td style="padding:15px 30px;background:#F7F4EC;border-top:1px solid #E7E1D3;">
  <p style="margin:0;font-family:Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.8px;color:#9AA0AB;">
    DEALBUS™ · LA PLACE DE MARCHÉ DU TRANSPORT DE GROUPE — MARQUE DÉPOSÉE (INPI)<br/>
    <a href="https://dealbus.fr" style="color:#A85D00;text-decoration:none;">dealbus.fr</a> &nbsp;·&nbsp; contact@dealbus.fr<br/><br/>
    <span style="color:#B4B9C2;">Pour ne plus recevoir nos messages, répondez « STOP » — votre adresse sera retirée immédiatement.</span>
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}


// ---------- Relance (court, angle pionnier) ----------

export function sujetRelance(p: Prospect): string {
  const zone = p.departement ? DEPTS[p.departement] : undefined;
  return zone
    ? `Re : les premières demandes de ${zone} arrivent`
    : `Re : votre place de partenaire fondateur DealBus`;
}

export function texteRelance(p: Prospect): string {
  return `Bonjour${p.societe ? ` (${p.societe})` : ""},

Je me permets de revenir vers vous — je vous avais écrit au sujet de DealBus, la place de marché du transport de groupe que nous lançons.

Depuis, les inscriptions de transporteurs avancent, et le principe reste inchangé : les premiers inscrits de chaque département recevront les premières demandes de leur zone. Cette place se prend en 2 minutes, sans abonnement ni engagement — commission uniquement sur les missions gagnées.

Et si vous avez des trajets retour à vide dans les semaines qui viennent, publiez-les dès maintenant : ils seront visibles des premiers clients.

→ https://dealbus.fr/pro

Une question ? Répondez à cet email, c'est moi qui vous lirai.

Bonne route,
Jeremy, de DealBus™
contact@dealbus.fr · https://dealbus.fr

—
Pour ne plus recevoir nos messages : répondez « STOP » et votre adresse sera retirée immédiatement.`;
}

export function htmlRelance(p: Prospect): string {
  const zone = p.departement ? DEPTS[p.departement] : undefined;
  const par = (t: string) => `<p style="margin:0 0 15px;font-size:14.5px;line-height:1.65;color:#3A4150;">${t}</p>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#EDEAE2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEAE2;padding:26px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #DDD8CC;">
<tr><td style="background:#12151B;padding:17px 30px;">
  <span style="display:inline-block;width:11px;height:11px;background:#E8A63D;border-radius:2px;margin-right:9px;vertical-align:middle;"></span>
  <span style="font-family:Arial Black,Arial,sans-serif;font-size:16px;font-weight:900;letter-spacing:2.5px;color:#F5F2EA;vertical-align:middle;">DEAL<span style="color:#E8A63D;">BUS</span><sup style="font-size:8px;font-weight:400;opacity:0.6;">™</sup></span>
</td></tr>
<tr><td style="padding:28px 30px 24px;font-family:Arial,Helvetica,sans-serif;">
  <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;color:#12151B;">${zone ? `Les premières demandes de ${zone} arrivent.` : "Votre place de partenaire fondateur vous attend."}</h1>
  ${par(`Bonjour${p.societe ? ` <strong>${p.societe}</strong>` : ""},`)}
  ${par(`Je me permets de revenir vers vous — je vous avais écrit au sujet de <strong>DealBus</strong>, la place de marché du transport de groupe que nous lançons.`)}
  ${par(`Depuis, les inscriptions de transporteurs avancent, et le principe reste inchangé : <strong>les premiers inscrits de chaque département recevront les premières demandes de leur zone</strong>. Cette place se prend en 2 minutes, sans abonnement ni engagement — commission uniquement sur les missions gagnées.`)}
  ${par(`Et si vous avez des trajets <strong>retour à vide</strong> dans les semaines qui viennent, publiez-les dès maintenant : ils seront visibles des premiers clients.`)}
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;"><tr><td style="border-radius:5px;background:#E8A63D;">
    <a href="https://dealbus.fr/pro" target="_blank" style="display:inline-block;padding:13px 26px;font-size:14.5px;font-weight:700;color:#12151B;text-decoration:none;font-family:Arial,sans-serif;">Prendre ma place &rarr;</a>
  </td></tr></table>
  ${par(`<span style="font-size:13px;color:#6B7280;">Une question ? Répondez à cet email — c'est moi qui vous lirai.</span>`)}
  ${par(`Bonne route,<br/><strong>Jeremy, de DealBus™</strong>`)}
</td></tr>
<tr><td style="padding:15px 30px;background:#F7F4EC;border-top:1px solid #E7E1D3;">
  <p style="margin:0;font-family:Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.8px;color:#9AA0AB;">
    DEALBUS™ · LA PLACE DE MARCHÉ DU TRANSPORT DE GROUPE — MARQUE DÉPOSÉE (INPI)<br/>
    <a href="https://dealbus.fr" style="color:#A85D00;text-decoration:none;">dealbus.fr</a> &nbsp;·&nbsp; contact@dealbus.fr<br/><br/>
    <span style="color:#B4B9C2;">Pour ne plus recevoir nos messages, répondez « STOP » — votre adresse sera retirée immédiatement.</span>
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}
