// Contenu de l'email de prospection clients (associations, CSE, écoles,
// mariages, clubs…) — partagé entre le back-office (/admin/prospection-clients)
// et l'API associée. Miroir de lib/prospection.ts (transporteurs).

export const DEPTS: Record<string, string> = {
  "14": "le Calvados", "27": "l'Eure", "28": "l'Eure-et-Loir", "50": "la Manche",
  "60": "l'Oise", "61": "l'Orne", "76": "la Seine-Maritime", "78": "les Yvelines",
  "91": "l'Essonne", "95": "le Val-d'Oise",
};

export type ProspectClient = { email: string; nom?: string | null; departement?: string | null };

export function sujetProspectionClient(p: ProspectClient): string {
  const zone = p.departement ? DEPTS[p.departement] : undefined;
  return zone
    ? `Organisez un déplacement en car ? Comparez les devis en 2 minutes (${zone})`
    : `Organisez un déplacement en car ? Comparez les devis en 2 minutes`;
}

export function texteProspectionClient(p: ProspectClient): string {
  const bonjour = p.nom ? `Bonjour,\n\n(Message à l'attention de ${p.nom})` : "Bonjour,";
  return `${bonjour}

DealBus est une nouvelle plateforme qui simplifie l'organisation d'un déplacement en autocar : voyage scolaire, sortie d'association, séminaire, mariage, tournoi sportif…

Le principe : vous décrivez votre trajet en 2 minutes (départ, arrivée, date, nombre de passagers), et des autocaristes vérifiés de votre région vous envoient directement leurs devis fermes. Vous comparez prix et conditions, vous choisissez, c'est gratuit et sans engagement.

Ce que ça change pour vous :

→ Un seul formulaire au lieu de dix appels. Vos coordonnées restent anonymes tant que vous n'avez pas choisi une offre — aucun démarchage.

→ Des prix fermes et comparables. Chaque autocariste propose un devis unique, tout compris — pas de marchandage, pas de mauvaise surprise le jour J.

→ Des transporteurs vérifiés. Titre d'exercice et assurance RC Pro contrôlés avant toute mise en relation.

→ Le paiement se fait directement avec le transporteur choisi — DealBus ne prend jamais votre argent.

Décrire votre trajet ne prend que 2 minutes :

→ https://dealbus.fr/reserver-un-bus

Une question ? Répondez simplement à cet email.

Bonne route,
Jeremy, de DealBus™
contact@dealbus.fr · https://dealbus.fr

—
Pour ne plus recevoir nos messages : répondez « STOP » et votre adresse sera retirée immédiatement.`;
}

export function htmlProspectionClient(p: ProspectClient): string {
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
  <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;color:#12151B;">Un déplacement en car à organiser${zone ? ` depuis ${zone}` : ""} ?</h1>
  ${par(`Bonjour${p.nom ? ` <strong>${p.nom}</strong>` : ""},`)}
  ${par(`<strong>DealBus</strong> simplifie l'organisation d'un déplacement en autocar : voyage scolaire, sortie d'association, séminaire, mariage, tournoi sportif…`)}
  ${par(`Décrivez votre trajet en 2 minutes, et des <strong>autocaristes vérifiés</strong> de votre région vous envoient directement leurs devis fermes. Vous comparez, vous choisissez — gratuit et sans engagement.`)}
  ${bloc("Un seul formulaire", "Fini les dix appels. Vos coordonnées restent anonymes tant que vous n'avez pas choisi une offre — aucun démarchage.")}
  ${bloc("Des prix fermes et comparables", "Chaque autocariste propose un devis unique, tout compris. Pas de marchandage, pas de mauvaise surprise le jour J.")}
  ${bloc("Des transporteurs vérifiés", "Titre d'exercice et assurance RC Pro contrôlés avant toute mise en relation. Vous payez directement le transporteur choisi.")}
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;"><tr><td style="border-radius:5px;background:#E8A63D;">
    <a href="https://dealbus.fr/reserver-un-bus" target="_blank" style="display:inline-block;padding:13px 26px;font-size:14.5px;font-weight:700;color:#12151B;text-decoration:none;font-family:Arial,sans-serif;">Décrire mon trajet &rarr;</a>
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


// ---------- Relance (court) ----------

export function sujetRelanceClient(p: ProspectClient): string {
  const zone = p.departement ? DEPTS[p.departement] : undefined;
  return zone
    ? `Re : comparer des devis autocaristes ${zone ? `en ${zone}` : ""} — 2 minutes`
    : `Re : comparer des devis autocaristes en 2 minutes`;
}

export function texteRelanceClient(p: ProspectClient): string {
  return `Bonjour${p.nom ? ` (${p.nom})` : ""},

Je me permets de revenir vers vous — je vous avais écrit au sujet de DealBus, qui permet de comparer gratuitement des devis d'autocaristes vérifiés pour un déplacement en groupe.

Si un trajet est à organiser dans les semaines qui viennent, décrire votre besoin prend 2 minutes et ne vous engage à rien :

→ https://dealbus.fr/reserver-un-bus

Une question ? Répondez à cet email, c'est moi qui vous lirai.

Bonne route,
Jeremy, de DealBus™
contact@dealbus.fr · https://dealbus.fr

—
Pour ne plus recevoir nos messages : répondez « STOP » et votre adresse sera retirée immédiatement.`;
}

export function htmlRelanceClient(p: ProspectClient): string {
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
  <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;color:#12151B;">Comparer des devis autocaristes, ça prend 2 minutes.</h1>
  ${par(`Bonjour${p.nom ? ` <strong>${p.nom}</strong>` : ""},`)}
  ${par(`Je me permets de revenir vers vous — je vous avais écrit au sujet de <strong>DealBus</strong>, qui permet de comparer gratuitement des devis d'autocaristes vérifiés pour un déplacement en groupe.`)}
  ${par(`Si un trajet est à organiser dans les semaines qui viennent, décrire votre besoin prend 2 minutes et ne vous engage à rien.`)}
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;"><tr><td style="border-radius:5px;background:#E8A63D;">
    <a href="https://dealbus.fr/reserver-un-bus" target="_blank" style="display:inline-block;padding:13px 26px;font-size:14.5px;font-weight:700;color:#12151B;text-decoration:none;font-family:Arial,sans-serif;">Décrire mon trajet &rarr;</a>
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
