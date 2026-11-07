// Connecteur Qonto (Business API) — SERVEUR UNIQUEMENT.
// Qonto est plateforme agréée (PA) : les factures créées ici sont au format Factur-X
// et pourront être transmises par le réseau de facture électronique.
//
// Variables d'environnement (Vercel) :
//   QONTO_LOGIN            identifiant de l'organisation (Intégrations > Clé API)
//   QONTO_SECRET_KEY       clé secrète
//   QONTO_IBAN             IBAN du compte Qonto qui reçoit les paiements
//   QONTO_STAGING_TOKEN    (optionnel) jeton sandbox
//   QONTO_EINVOICE=1       (optionnel) envoi par le réseau de facture électronique au lieu de l'email

const BASE = process.env.QONTO_STAGING_TOKEN
  ? "https://thirdparty-sandbox.staging.qonto.co/v2"
  : "https://thirdparty.qonto.com/v2";

export function qontoConfigure(): boolean {
  return !!(process.env.QONTO_LOGIN && process.env.QONTO_SECRET_KEY && process.env.QONTO_IBAN);
}

async function q<T>(chemin: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (process.env.QONTO_STAGING_TOKEN) headers["X-Qonto-Staging-Token"] = process.env.QONTO_STAGING_TOKEN;
  const res = await fetch(`${BASE}${chemin}`, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) }, cache: "no-store" });
  if (res.status === 204) return undefined as T;
  const texte = await res.text();
  if (!res.ok) throw new Error(`Qonto ${res.status} sur ${chemin} : ${texte.slice(0, 400)}`);
  return (texte ? JSON.parse(texte) : undefined) as T;
}

// N° de TVA intracommunautaire français déduit du SIREN
export function tvaDepuisSiren(siren: string): string | null {
  const s = siren.replace(/\D/g, "").slice(0, 9); // accepte aussi un SIRET (14 chiffres)
  if (s.length !== 9) return null;
  const cle = (12 + 3 * (Number(s) % 97)) % 97;
  return `FR${String(cle).padStart(2, "0")}${s}`;
}

// « 12 rue X, 78270 Limetz-Villez » → { rue, cp, ville }
export function decouperAdresse(adresse: string | null): { street_address: string; zip_code: string; city: string } | null {
  if (!adresse) return null;
  const m = adresse.match(/^(.*?)[,\s]+(\d{5})\s+(.+)$/);
  if (!m) return null;
  return { street_address: m[1].replace(/,\s*$/, "").trim() || m[3], zip_code: m[2], city: m[3].replace(/,.*$/, "").trim().slice(0, 50) };
}

// Adresse du siège depuis l'annuaire public des entreprises (API Recherche d'entreprises, data.gouv)
export async function adresseDepuisSiren(siren: string): Promise<{ street_address: string; zip_code: string; city: string } | null> {
  try {
    const s = siren.replace(/\D/g, "").slice(0, 9); // SIREN, même si un SIRET est saisi
    const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${s}&page=1&per_page=1`, { cache: "no-store" });
    if (!res.ok) return null;
    const j = await res.json();
    const r = (j.results ?? []).find((x: { siren?: string }) => x.siren === s);
    const g = r?.siege;
    if (!g?.code_postal || !g?.libelle_commune) return null;
    const rue = [g.numero_voie, g.indice_repetition, g.type_voie, g.libelle_voie].filter(Boolean).join(" ").trim();
    return { street_address: (rue || g.complement_adresse || g.libelle_commune).slice(0, 250), zip_code: g.code_postal, city: String(g.libelle_commune).slice(0, 50) };
  } catch {
    return null;
  }
}

export async function creerClient(t: { raison_sociale: string; siren: string; email: string | null; depot_adresse: string | null }): Promise<string> {
  const adresse = decouperAdresse(t.depot_adresse) ?? (await adresseDepuisSiren(t.siren));
  if (!adresse) throw new Error(`Adresse de ${t.raison_sociale} introuvable (ni adresse de dépôt lisible, ni siège trouvé par le SIREN ${t.siren}).`);
  const r = await q<{ client: { id: string } }>("/clients", {
    method: "POST",
    body: JSON.stringify({
      kind: "company",
      name: t.raison_sociale.slice(0, 250),
      email: t.email ?? undefined,
      tax_identification_number: t.siren.replace(/\D/g, ""),
      vat_number: tvaDepuisSiren(t.siren) ?? undefined,
      billing_address: { ...adresse, country_code: "FR" },
      currency: "EUR",
      locale: "FR",
    }),
  });
  return r.client.id;
}

export type LigneQonto = { title: string; description: string; ht: number };

export async function creerFacture(opts: {
  clientId: string; dateEmission: string; debut: string; fin: string; intitule: string; lignes: LigneQonto[];
}): Promise<{ id: string; number: string | null }> {
  const r = await q<{ client_invoice: { id: string; number?: string | null } }>("/client_invoices", {
    method: "POST",
    body: JSON.stringify({
      client_id: opts.clientId,
      issue_date: opts.dateEmission,
      due_date: opts.dateEmission, // payable à réception (CGU, art. 12)
      currency: "EUR",
      status: "unpaid",
      performance_start_date: opts.debut,
      performance_end_date: opts.fin,
      payment_methods: { iban: process.env.QONTO_IBAN },
      header: `Commission DealBus, mise en relation pour le transport de voyageurs : ${opts.intitule}.`,
      terms_and_conditions:
        "Facture payable à réception. Commission calculée sur le prix TTC de la mission selon l'article 12 des CGU DealBus. " +
        "En cas de retard de paiement : pénalités au taux de trois fois le taux d'intérêt légal et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 du Code de commerce). " +
        "Pas d'escompte pour paiement anticipé.",
      items: opts.lignes.map((l) => ({
        title: l.title.slice(0, 40),
        description: l.description.slice(0, 1800),
        quantity: "1",
        unit: "mission",
        unit_price: { value: l.ht.toFixed(2), currency: "EUR" },
        vat_rate: "0.2",
      })),
    }),
  });
  return { id: r.client_invoice.id, number: r.client_invoice.number ?? null };
}

export async function envoyerFacture(id: string, email: string, titre: string, corps: string) {
  if (process.env.QONTO_EINVOICE === "1") {
    await q(`/client_invoices/${id}/send_by_einvoice`, { method: "POST", body: "{}" });
    return;
  }
  await q(`/client_invoices/${id}/send`, {
    method: "POST",
    body: JSON.stringify({ send_to: [email], email_title: titre, email_body: corps, copy_to_self: true }),
  });
}

export async function lireFacture(id: string): Promise<{ status: string; number: string | null; paid_at?: string | null }> {
  const r = await q<{ client_invoice: { status: string; number?: string | null; paid_at?: string | null } }>(`/client_invoices/${id}`);
  return { status: r.client_invoice.status, number: r.client_invoice.number ?? null, paid_at: r.client_invoice.paid_at ?? null };
}

export async function marquerPayee(id: string, date: string) {
  await q(`/client_invoices/${id}/mark_as_paid`, { method: "POST", body: JSON.stringify({ paid_at: date }) });
}
