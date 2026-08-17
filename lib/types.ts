export type DemandeMode = "devis" | "enchere";
export type DemandeStatut = "ouverte" | "selection" | "confirmee" | "annulee" | "expiree";

export interface Demande {
  id: string;
  numero: number;
  mode: DemandeMode;
  statut: DemandeStatut;
  type_trajet: "aller_retour" | "aller_simple" | "circuit";
  depart_adresse: string;
  arrivee_adresse: string;
  date_aller: string;
  heure_aller: string | null;
  heure_retour: string | null;
  date_retour: string | null;
  passagers: number;
  prix_estime: number | null;
  enchere_fin: string | null;
  created_at: string;
}

export interface Offre {
  id: string;
  demande_id: string;
  statut: "envoyee" | "consultee" | "retenue" | "non_retenue";
  prix_ttc: number;
  vehicule_type: string;
  vehicule_places: number;
  vehicule_annee: number | null;
  conditions: string | null;
}

export interface TransporteurAnonyme {
  id: string;
  numero_anonyme: number;
  departement_siege: string;
  note_moyenne: number | null;
  nb_avis: number;
  nb_missions: number;
  cgv: string | null;
}

export interface RetourVide {
  id: string;
  statut: "publie" | "demande_recue" | "confirme" | "expire" | "annule";
  depart_adresse: string;
  arrivee_adresse: string;
  date_dispo: string;
  heure_apres: string | null;
  places: number;
  prix_fixe: number;
}
