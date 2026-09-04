// Définition des réseaux sociaux configurables (fichier pur, importable côté client).
// Les URLs sont stockées dans la table parametres (clés reseau_*) et éditées dans /admin/reseaux.

export const RESEAUX_DEF = [
  { cle: "reseau_facebook", nom: "Facebook", placeholder: "https://www.facebook.com/…" },
  { cle: "reseau_instagram", nom: "Instagram", placeholder: "https://www.instagram.com/…" },
  { cle: "reseau_linkedin", nom: "LinkedIn", placeholder: "https://www.linkedin.com/company/…" },
  { cle: "reseau_tiktok", nom: "TikTok", placeholder: "https://www.tiktok.com/@…" },
  { cle: "reseau_youtube", nom: "YouTube", placeholder: "https://www.youtube.com/@…" },
  { cle: "reseau_x", nom: "X", placeholder: "https://x.com/…" },
] as const;

export type ReseauCle = (typeof RESEAUX_DEF)[number]["cle"];
export type Reseau = { cle: ReseauCle; nom: string; href: string };
