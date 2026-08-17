// Gabarit HTML des emails DealBus — table-based et styles inline
// (les clients mail ignorent les feuilles de style modernes).
// Chaque email fournit : titre, paragraphes, encadré optionnel, bouton optionnel.

type Highlight = { label: string; value: string; detail?: string };
type Cta = { label: string; url: string };

export function emailHtml(opts: {
  titre: string;
  paragraphes: string[];        // HTML simple autorisé (<strong>, <br/>)
  highlight?: Highlight;
  cta?: Cta;
  note?: string;                // petite ligne grise sous le contenu
}): string {
  const { titre, paragraphes, highlight, cta, note } = opts;

  const blocParagraphes = paragraphes
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:14.5px;line-height:1.65;color:#3A4150;">${p}</p>`
    )
    .join("");

  const blocHighlight = highlight
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;">
        <tr><td style="background:#FBF6EA;border-left:3px solid #E8A63D;border-radius:0 6px 6px 0;padding:14px 18px;">
          <div style="font-family:Consolas,Menlo,monospace;font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:#8A8272;margin-bottom:5px;">${highlight.label}</div>
          <div style="font-size:21px;font-weight:700;color:#12151B;">${highlight.value}</div>
          ${highlight.detail ? `<div style="font-size:13px;color:#6B7280;margin-top:4px;">${highlight.detail}</div>` : ""}
        </td></tr>
      </table>`
    : "";

  const blocCta = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 6px;">
        <tr><td style="border-radius:5px;background:#E8A63D;">
          <a href="${cta.url}" target="_blank"
             style="display:inline-block;padding:13px 26px;font-size:14.5px;font-weight:700;color:#12151B;text-decoration:none;">
            ${cta.label}&nbsp;&rarr;
          </a>
        </td></tr>
      </table>`
    : "";

  const blocNote = note
    ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#9AA0AB;">${note}</p>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EDEAE2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEAE2;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0"
             style="max-width:560px;width:100%;background:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #DDD8CC;">
        <!-- En-tête -->
        <tr><td style="background:#12151B;padding:18px 28px;">
          <span style="display:inline-block;width:11px;height:11px;background:#E8A63D;border-radius:2px;margin-right:9px;vertical-align:middle;"></span>
          <span style="font-family:Arial Black,Arial,sans-serif;font-size:17px;font-weight:900;letter-spacing:2.5px;color:#F5F2EA;vertical-align:middle;">DEAL<span style="color:#E8A63D;">BUS</span></span>
        </td></tr>
        <!-- Corps -->
        <tr><td style="padding:30px 28px 24px;font-family:Arial,Helvetica,sans-serif;">
          <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:#12151B;">${titre}</h1>
          ${blocParagraphes}
          ${blocHighlight}
          ${blocCta}
          ${blocNote}
        </td></tr>
        <!-- Pied -->
        <tr><td style="padding:16px 28px;background:#F7F4EC;border-top:1px solid #E7E1D3;">
          <p style="margin:0;font-family:Consolas,Menlo,monospace;font-size:10.5px;letter-spacing:0.8px;color:#9AA0AB;">
            DEALBUS · LA PLACE DE MARCHÉ DU TRANSPORT DE GROUPE<br/>
            <a href="https://dealbus.fr" style="color:#A85D00;text-decoration:none;">dealbus.fr</a>
            &nbsp;·&nbsp; <a href="mailto:contact@dealbus.fr" style="color:#9AA0AB;text-decoration:none;">contact@dealbus.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
