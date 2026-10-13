// Emails et helpers du circuit d'annulation (client / transporteur → DealBus).
import { Resend } from "resend";
import { emailHtml } from "@/lib/email";

const from = () => process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>";
const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

export async function envoyer(to: string | string[], subject: string, titre: string, paragraphes: string[], cta?: { label: string; url: string }, note?: string) {
  if (!process.env.RESEND_API_KEY || !to || (Array.isArray(to) && !to.length)) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: from(), to, subject,
      text: paragraphes.map((p) => p.replace(/<[^>]+>/g, "")).join("\n\n") + (cta ? `\n\n${cta.url}` : ""),
      html: emailHtml({ titre, paragraphes, cta, note }),
    });
  } catch { /* jamais bloquant */ }
}

export const echap = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const url = (chemin: string) => `${site()}${chemin}`;

export function enAttente(x: { annulation_demandee_at?: string | null; annulation_decision?: string | null } | null | undefined) {
  return !!x?.annulation_demandee_at && !x?.annulation_decision;
}
