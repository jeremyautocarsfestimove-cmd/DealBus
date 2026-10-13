// ============================================================
// Assistant de demande — calculs purs, partagés entre le formulaire
// client (/demande) et, plus tard, la fiche lead transporteur.
// Aucun appel réseau ici : le kilométrage vient de /api/itineraire.
// ============================================================

export const ORGANISMES = [
  { id: "ecole", label: "Un établissement scolaire" },
  { id: "association", label: "Une association" },
  { id: "cse", label: "Un CSE / une entreprise" },
  { id: "mariage", label: "Un mariage / une famille" },
  { id: "club", label: "Un club sportif" },
  { id: "collectivite", label: "Une collectivité" },
  { id: "autre", label: "Autre" },
] as const;
export type Organisme = typeof ORGANISMES[number]["id"];

export const MOTIFS = [
  "Voyage scolaire", "Sortie à la journée", "Compétition", "Séminaire",
  "Navette événement", "Mariage", "Excursion", "Autre",
] as const;

export const EQUIPEMENTS = [
  { id: "soute", label: "Bagages en soute", aide: "Valises, séjour avec nuit" },
  { id: "pmr", label: "Passager à mobilité réduite", aide: "Fauteuil, rampe ou élévateur" },
  { id: "ceintures", label: "Ceintures obligatoires", aide: "Transport d'enfants" },
  { id: "materiel", label: "Matériel volumineux", aide: "Vélos, instruments, stands" },
  { id: "toilettes", label: "Toilettes à bord", aide: "Conseillé au-delà de 3 h de route" },
  { id: "prise_etablissement", label: "Prise en charge à l'adresse exacte", aide: "Parking cars disponible" },
] as const;
export type Equipement = typeof EQUIPEMENTS[number]["id"];

export const BUDGETS = [
  { id: "moins_1000", label: "Moins de 1 000 €" },
  { id: "1000_2000", label: "1 000 à 2 000 €" },
  { id: "2000_3000", label: "2 000 à 3 000 €" },
  { id: "plus_3000", label: "Plus de 3 000 €" },
  { id: "inconnu", label: "Pas d'idée" },
] as const;

// ---------- Barème indicatif (à ajuster avec les premières missions) ----------
export const BAREME = {
  vitesseMoyenne: 80,        // km/h, autoroute + approche
  hautLePiedKm: 60,          // km moyens dépôt → prise en charge, aller + retour
  coutKm: 1.15,              // € HT par km
  coutHeure: 35,             // € HT par heure d'amplitude conducteur
  nuitConducteur: 150,       // € HT par nuit (hôtel + repas)
  immobilisationJour: 120,   // € HT par journée d'immobilisation sur place
  marge: 0.18,               // marge transporteur
  tva: 0.10,                 // transport de voyageurs
  pauseMinParTranche: 45,    // 45 min toutes les 4 h 30 de conduite
  trancheConduiteMin: 270,
  conduiteMaxJourMin: 9 * 60,   // au-delà : second conducteur probable
  amplitudeMaxJourMin: 13 * 60, // au-delà : second conducteur ou découcher probable
};

export type Gabarit = { label: string; places: number; nbVehicules: number };

export function gabaritPour(passagers: number): Gabarit | null {
  if (!passagers || passagers <= 0) return null;
  if (passagers <= 8) return { label: "Minibus 8 places", places: 8, nbVehicules: 1 };
  if (passagers <= 19) return { label: "Minibus 19 places", places: 19, nbVehicules: 1 };
  if (passagers <= 35) return { label: "Midibus 30 à 35 places", places: 35, nbVehicules: 1 };
  if (passagers <= 53) return { label: "Autocar 49 à 53 places", places: 53, nbVehicules: 1 };
  if (passagers <= 63) return { label: "Autocar 55 à 63 places", places: 63, nbVehicules: 1 };
  if (passagers <= 70) return { label: "Autocar 70 places", places: 70, nbVehicules: 1 };
  const n = Math.ceil(passagers / 63);
  return { label: `${n} autocars de 55 à 63 places`, places: 63 * n, nbVehicules: n };
}

export function minutesDeRoute(km: number): number {
  return Math.round((km / BAREME.vitesseMoyenne) * 60);
}

export function minutesDePause(minutesConduite: number): number {
  return Math.floor(minutesConduite / BAREME.trancheConduiteMin) * BAREME.pauseMinParTranche;
}

export function fmtDuree(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export function fmtHeure(min: number): string {
  const total = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function toMin(h: string): number | null {
  if (!h) return null;
  const [hh, mm] = h.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function joursEntre(a: string, b: string): number {
  if (!a || !b) return 0;
  const d = (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
  return Math.max(0, Math.round(d));
}

export type EntreeAssistant = {
  type_trajet: string;
  km: number | null;
  date_aller: string;
  heure_aller: string;
  date_retour: string;
  heure_retour: string;
  passagers: number;
  vehicule_utilise_sur_place: boolean;
};

export type Alerte = { niveau: "info" | "ok" | "attention"; titre: string; texte: string };

export type Analyse = {
  km: number | null;
  routeMin: number | null;          // aller simple, hors pauses
  pauseMin: number | null;
  gabarit: Gabarit | null;
  arriveeMin: number | null;        // heure d'arrivée estimée jour 1 (minutes depuis minuit)
  amplitudeJ1Min: number | null;
  nuits: number;
  deuxConducteurs: boolean;
  alertes: Alerte[];
  fourchette: { min: number; max: number } | null;  // TTC
};

export function analyser(e: EntreeAssistant): Analyse {
  const alertes: Alerte[] = [];
  const km = e.km;
  const routeMin = km ? minutesDeRoute(km) : null;
  const pauseMin = routeMin ? minutesDePause(routeMin) : null;
  const gabarit = gabaritPour(e.passagers);
  const depart = toMin(e.heure_aller);
  const retour = toMin(e.heure_retour);
  const nuits = e.type_trajet === "aller_simple" ? 0 : joursEntre(e.date_aller, e.date_retour);
  const memeJour = e.type_trajet !== "aller_simple" && !!e.date_retour && nuits === 0;

  let arriveeMin: number | null = null;
  let amplitudeJ1Min: number | null = null;
  let deuxConducteurs = false;

  if (routeMin !== null && depart !== null) {
    arriveeMin = depart + routeMin + (pauseMin ?? 0);
    amplitudeJ1Min = routeMin + (pauseMin ?? 0);
    if (memeJour) {
      // aller-retour dans la journée : amplitude du départ au retour au point de départ
      if (retour !== null) {
        const finRetour = retour + routeMin + (pauseMin ?? 0);
        amplitudeJ1Min = Math.max(finRetour - depart, amplitudeJ1Min);
      } else {
        amplitudeJ1Min = 2 * (routeMin + (pauseMin ?? 0)) + 120; // 2 h sur place par défaut
      }
      const conduiteJour = 2 * routeMin;
      if (conduiteJour > BAREME.conduiteMaxJourMin || amplitudeJ1Min > BAREME.amplitudeMaxJourMin) {
        deuxConducteurs = true;
      }
    } else if (routeMin > BAREME.conduiteMaxJourMin) {
      deuxConducteurs = true;
    }
  }

  // ---------- Alertes ----------
  if (nuits > 0) {
    alertes.push({
      niveau: "info",
      titre: nuits === 1 ? "Une nuit sur place" : `${nuits} nuits sur place`,
      texte: e.vehicule_utilise_sur_place
        ? "Le car et le chauffeur restent sur place : les transporteurs ajouteront l'hébergement du conducteur et l'immobilisation du véhicule, c'est normal."
        : "Dépose puis reprise : le car ne reste pas, le transporteur enchaîne deux trajets séparés. Si vous avez besoin du car sur place, dites-le à l'étape suivante.",
    });
  }
  if (deuxConducteurs) {
    alertes.push({
      niveau: "attention",
      titre: "Second conducteur probable",
      texte: "Le temps de conduite ou l'amplitude dépasse ce qu'un seul conducteur peut faire dans la journée. Les offres incluront sans doute un second chauffeur ou un départ plus tôt.",
    });
  } else if (routeMin !== null && depart !== null) {
    alertes.push({
      niveau: "ok",
      titre: "Horaires réalistes",
      texte: "Un seul conducteur suffit : les temps de conduite et de repos sont respectés sur la journée.",
    });
  }
  if (routeMin !== null && routeMin > 180) {
    alertes.push({
      niveau: "info",
      titre: "Plus de 3 h de route",
      texte: "Pensez aux toilettes à bord et à une pause : c'est une case à cocher à l'étape suivante.",
    });
  }
  if (gabarit && gabarit.nbVehicules > 1) {
    alertes.push({
      niveau: "attention",
      titre: `${gabarit.nbVehicules} véhicules nécessaires`,
      texte: "Au-delà de 70 passagers, il faut plusieurs autocars. Les transporteurs chiffreront l'ensemble, ou se regrouperont.",
    });
  }

  // ---------- Fourchette indicative ----------
  let fourchette: Analyse["fourchette"] = null;
  if (km && routeMin !== null && gabarit) {
    const trajets = e.type_trajet === "aller_simple" ? 1 : 2;
    const kmTotal = km * trajets + BAREME.hautLePiedKm;
    const heures = (trajets * (routeMin + (pauseMin ?? 0))) / 60 + (memeJour ? 2 : 0);
    let ht = kmTotal * BAREME.coutKm + heures * BAREME.coutHeure;
    if (e.vehicule_utilise_sur_place && nuits > 0) {
      ht += nuits * BAREME.nuitConducteur + nuits * BAREME.immobilisationJour;
    }
    if (deuxConducteurs) ht += heures * BAREME.coutHeure * 0.8;
    ht *= gabarit.nbVehicules;
    ht *= 1 + BAREME.marge;
    const ttc = ht * (1 + BAREME.tva);
    const arrondi = (n: number) => Math.round(n / 50) * 50;
    fourchette = { min: arrondi(ttc * 0.9), max: arrondi(ttc * 1.12) };
  }

  return { km, routeMin, pauseMin, gabarit, arriveeMin, amplitudeJ1Min, nuits, deuxConducteurs, alertes, fourchette };
}

// ---------- Score de complétude ----------
export type Critere = { label: string; ok: boolean; poids: number };

export function completude(f: {
  depart_adresse: string; arrivee_adresse: string; date_aller: string; heure_aller: string;
  type_trajet: string; date_retour: string; heure_retour: string; passagers: string;
  organisme: string; motif: string; equipements: string[]; sur_place_repondu: boolean;
  heure_arrivee: string; precisions: string;
}): { score: number; criteres: Critere[] } {
  const retourOk = f.type_trajet === "aller_simple" || (!!f.date_retour && !!f.heure_retour);
  const criteres: Critere[] = [
    { label: "Trajet, dates et horaires", ok: !!f.depart_adresse && !!f.arrivee_adresse && !!f.date_aller && !!f.heure_aller && retourOk, poids: 25 },
    { label: "Nombre de passagers exact", ok: Number(f.passagers) > 0, poids: 15 },
    { label: "Type de groupe et motif", ok: !!f.organisme && !!f.motif, poids: 15 },
    { label: "Car sur place : oui ou non", ok: f.sur_place_repondu, poids: 10 },
    { label: "Bagages et équipements", ok: f.equipements.length > 0, poids: 10 },
    { label: "Heure d'arrivée souhaitée", ok: !!f.heure_arrivee, poids: 10 },
    { label: "Précisions utiles (20 caractères ou plus)", ok: f.precisions.trim().length >= 20, poids: 15 },
  ];
  const score = criteres.reduce((s, c) => s + (c.ok ? c.poids : 0), 0);
  return { score, criteres };
}

export const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
