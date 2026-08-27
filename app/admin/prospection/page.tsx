"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image as PdfImage,
} from "@react-pdf/renderer";
import { supabase } from "@/lib/supabase";

type ZoneKey =
  | "france"
  | "france-loin"
  | "benelux"
  | "espagne"
  | "portugal"
  | "italie"
  | "uk"
  | "irlande"
  | "europe-est"
  | "europe-centrale"
  | "lointain";

type ZoneRatios = { t: number; h: number; r: number; a: number };

const ZONES: Record<ZoneKey, { label: string; ratios: ZoneRatios }> = {
  france: { label: "France proche (<400km)", ratios: { t: 25, h: 15, r: 13, a: 5 } },
  "france-loin": { label: "France lointaine", ratios: { t: 31, h: 19, r: 17, a: 6 } },
  benelux: { label: "Bénélux", ratios: { t: 31, h: 19, r: 17, a: 6 } },
  espagne: { label: "Espagne", ratios: { t: 35, h: 20, r: 17, a: 6 } },
  portugal: { label: "Portugal", ratios: { t: 42, h: 24, r: 21, a: 7 } },
  italie: { label: "Italie", ratios: { t: 42, h: 31, r: 21, a: 6 } },
  uk: { label: "Royaume-Uni (ferry, tunnel)", ratios: { t: 38, h: 23, r: 20, a: 7 } },
  irlande: { label: "Irlande (ferry)", ratios: { t: 48, h: 29, r: 25, a: 8 } },
  "europe-est": { label: "Allemagne", ratios: { t: 31, h: 19, r: 16, a: 6 } },
  "europe-centrale": {
    label: "Europe Centrale (Tchéquie, Pologne, Hongrie, Roumanie)",
    ratios: { t: 47, h: 29, r: 24, a: 9 },
  },
  lointain: { label: "Long courrier (avion, hors transport)", ratios: { t: 0, h: 30, r: 19, a: 7 } },
};

const ADMIN_PASSWORD_FLAG = "scolamove-admin";

function genRef() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `SCOLA-${digits}`;
}

declare global {
  interface Window {
    Tesseract?: {
      recognize: (
        file: File,
        lang: string,
        opts: { logger: (m: { status: string; progress: number }) => void }
      ) => Promise<{
        data: {
          text: string;
          words?: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }[];
        };
      }>;
    };
  }
}

type SavedDevisData = {
  zone: ZoneKey | "";
  jours: number;
  nuits: number;
  eleves: number;
  accomp: number;
  confort: "0.85" | "1" | "1.25";
  visites: number;
  marge: number;
  sousTraite: boolean;
  margeTransport: number;
  ratios: ZoneRatios;
  assuranceCheck: boolean;
  assurancePct: number;
  assuranceMin: number;
  taxeSejourCheck: boolean;
  taxeSejourMontant: number;
  cautionCheck: boolean;
  cautionMontant: number;
  chambreIndivCheck: boolean;
  chambreIndivMontant: number;
  etablissement: string;
  dossierSuiviPar: string;
  teacherName: string;
  teacherEmail: string;
  ville: string;
  reference: string;
  dateVoyage: string;
  programme: string;
  prixParVisite: number;
  selectedSejourId: string;
};

type SavedDevisRow = {
  id: string;
  reference: string;
  etablissement: string | null;
  ville: string | null;
  zone: string | null;
  prix_ferme: number | null;
  pax: number | null;
  created_at: string;
  data: SavedDevisData;
};

type CatalogueSejour = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  country: string;
  duration: string;
  visit_budget: string | null;
  program: { day: string; title: string; text: string }[];
  hidden: boolean;
};

export default function DevisExpressPage() {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    setIsLogged(localStorage.getItem(ADMIN_PASSWORD_FLAG) === "true");
  }, []);

  // --- Voyage ---
  const [zone, setZone] = useState<ZoneKey | "">("");
  const [jours, setJours] = useState(0);
  const [nuits, setNuits] = useState(0);
  const [eleves, setEleves] = useState(0);
  const [accomp, setAccomp] = useState(0);

  // --- Niveau & marge ---
  const [confort, setConfort] = useState<"0.85" | "1" | "1.25">("1");
  const [visites, setVisites] = useState(0);
  const [marge, setMarge] = useState(5);

  // --- Transport ---
  const [sousTraite, setSousTraite] = useState(false);
  const [margeTransport, setMargeTransport] = useState(20);

  // --- Ratios ajustables (seedés par zone) ---
  const emptyRatios: ZoneRatios = { t: 0, h: 0, r: 0, a: 0 };
  const [ratios, setRatios] = useState<ZoneRatios>(emptyRatios);
  useEffect(() => {
    setRatios(zone ? ZONES[zone].ratios : emptyRatios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone]);

  // --- Options tarifaires ---
  const [assuranceCheck, setAssuranceCheck] = useState(false);
  const [assurancePct, setAssurancePct] = useState(2.5);
  const [assuranceMin, setAssuranceMin] = useState(6);
  const [taxeSejourCheck, setTaxeSejourCheck] = useState(false);
  const [taxeSejourMontant, setTaxeSejourMontant] = useState(1.5);
  const [cautionCheck, setCautionCheck] = useState(false);
  const [cautionMontant, setCautionMontant] = useState(10);
  const [chambreIndivCheck, setChambreIndivCheck] = useState(false);
  const [chambreIndivMontant, setChambreIndivMontant] = useState(25);

  // --- Identification devis ---
  const [etablissement, setEtablissement] = useState("");
  const [dossierSuiviPar, setDossierSuiviPar] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [ville, setVille] = useState("");
  const [reference, setReference] = useState("");
  const [dateVoyage, setDateVoyage] = useState("");

  // La référence est obligatoire dès la création d'un devis et ne doit jamais changer
  // ensuite : elle identifie le dossier de bout en bout (nom de fichier PDF, accès
  // espace enseignant...). Générée une seule fois au chargement d'un devis vierge.
  useEffect(() => {
    setReference((prev) => prev || genRef());
  }, []);

  // --- Programme & OCR ---
  const [programme, setProgramme] = useState("");
  const [prixParVisite, setPrixParVisite] = useState(6);
  const [estimateMsg, setEstimateMsg] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrRawText, setOcrRawText] = useState("");
  const [copyState, setCopyState] = useState("");

  // --- Sauvegarde / historique des devis ---
  const [savedDevis, setSavedDevis] = useState<SavedDevisRow[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

  const fetchSavedDevis = async () => {
    setLoadingSaved(true);
    const { data, error } = await supabase
      .from("devis_express")
      .select("id, reference, etablissement, ville, zone, prix_ferme, pax, created_at, data")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      setSavedDevis(data as SavedDevisRow[]);
    } else if (error) {
      console.error("Erreur Supabase (select devis_express):", error);
      setSaveStatus(`Erreur de chargement : ${error.message || error.code || "voir console"}`);
      setTimeout(() => setSaveStatus(""), 5000);
    }
    setLoadingSaved(false);
  };

  useEffect(() => {
    if (isLogged) {
      fetchSavedDevis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogged]);

  // --- Catalogue de séjours existants (source : table sejours, remplie via /admin) ---
  const [catalogueSejours, setCatalogueSejours] = useState<CatalogueSejour[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [selectedSejourId, setSelectedSejourId] = useState("");
  const [sejourImportMsg, setSejourImportMsg] = useState("");

  const sejoursByCountry = useMemo(() => {
    const groups: Record<string, CatalogueSejour[]> = {};
    catalogueSejours.forEach((s) => {
      const country = s.country || "Autre";
      if (!groups[country]) groups[country] = [];
      groups[country].push(s);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [catalogueSejours]);

  useEffect(() => {
    if (!isLogged) return;
    (async () => {
      setLoadingCatalogue(true);
      const { data, error } = await supabase
        .from("sejours")
        .select("id, slug, title, destination, country, duration, visit_budget, program, hidden")
        .order("title", { ascending: true });
      if (!error && data) {
        setCatalogueSejours(data as CatalogueSejour[]);
      } else if (error) {
        console.error("Erreur Supabase (select sejours):", error);
      }
      setLoadingCatalogue(false);
    })();
  }, [isLogged]);

  function handleImportFromSejour(sejourId: string) {
    setSelectedSejourId(sejourId);
    if (!sejourId) return;
    const s = catalogueSejours.find((x) => x.id === sejourId);
    if (!s) return;

    // Programme : reconstruit proprement au format "JOUR X : titre" à partir des vraies
    // données du site, sans passer par l'OCR.
    const programmeText = (s.program || [])
      .map((p) => `${p.day || ""}${p.title ? ` : ${p.title}` : ""}\n${p.text || ""}`.trim())
      .join("\n\n");
    setProgramme(programmeText);

    // Durée : essaie d'extraire "X jours / Y nuits" depuis le texte du site.
    const mJ = (s.duration || "").match(/(\d+)\s*jour/i);
    const mN = (s.duration || "").match(/(\d+)\s*nuit/i);
    if (mJ) setJours(Number(mJ[1]));
    if (mN) setNuits(Number(mN[1]));

    // Budget visites : "Environ 49€ par personne" → applique au champ visites/jour.
    const mB = (s.visit_budget || "").match(/(\d+[.,]?\d*)\s*€/);
    if (mB) {
      const budgetDetecte = parseFloat(mB[1].replace(",", "."));
      const jP = Math.max((mN ? Number(mN[1]) : nuits) + 1, 1);
      setVisites(Number((budgetDetecte / jP).toFixed(2)));
    }

    setSejourImportMsg(
      `Programme importé depuis "${s.title}" (${s.program?.length || 0} jour(s), donnée officielle du site — pas d'OCR).`
    );
    setTimeout(() => setSejourImportMsg(""), 4000);
  }

  const result = useMemo(() => {
    const pax = eleves + accomp;
    const niveauFactor = parseFloat(confort);
    const groupFactor = pax < 20 ? 1.4 : pax < 40 ? 1.15 : pax < 60 ? 1.0 : 0.95;

    const coachBase = 43;
    const transportFactor = coachBase / Math.max(pax, 1);
    const transportTotal = ratios.t * Math.max(jours, 1) * transportFactor;
    const hebergTotal = ratios.h * nuits * niveauFactor * groupFactor;
    const joursPension = Math.max(nuits + 1, 1);
    const repasTotal = ratios.r * joursPension * niveauFactor;
    const assistTotal = ratios.a * Math.max(jours, 1);
    const visitesTotal = visites * joursPension;

    const transportCost = transportTotal * (sousTraite ? 1 : 0.7);
    const transportMargePct = sousTraite ? marge : margeTransport;
    const transportWithMarge = transportCost * (1 + transportMargePct / 100);

    const restTotal = hebergTotal + repasTotal + assistTotal + visitesTotal;
    const restWithMarge = restTotal * (1 + marge / 100);

    const avecMarge = transportWithMarge + restWithMarge;

    const assuranceMontant = assuranceCheck
      ? Math.max((avecMarge * assurancePct) / 100, assuranceMin)
      : 0;
    const taxeSejourTotal = taxeSejourCheck ? taxeSejourMontant * nuits : 0;
    const chambreIndivTotalGroupe = chambreIndivCheck
      ? chambreIndivMontant * nuits * accomp
      : 0;

    const prixFerme = avecMarge + assuranceMontant + taxeSejourTotal;

    return {
      pax,
      transportTotal,
      hebergTotal,
      repasTotal,
      assistTotal,
      visitesTotal,
      transportCost,
      transportMargePct,
      transportWithMarge,
      avecMarge,
      assuranceMontant,
      taxeSejourTotal,
      chambreIndivTotalGroupe,
      prixFerme,
      joursPension,
    };
  }, [
    eleves,
    accomp,
    confort,
    ratios,
    jours,
    nuits,
    visites,
    sousTraite,
    marge,
    margeTransport,
    assuranceCheck,
    assurancePct,
    assuranceMin,
    taxeSejourCheck,
    taxeSejourMontant,
    cautionCheck,
    chambreIndivCheck,
    chambreIndivMontant,
  ]);

  function estimateVisites() {
    if (!programme.trim()) {
      setEstimateMsg("Colle d'abord un programme dans le champ ci-dessus.");
      return;
    }
    const motsClefs =
      /\b(visite|musée|excursion|découverte|monument|château|parc|aquarium|atelier|entrée|billet)\b/gi;
    const lignes = programme.split("\n");
    let nbDetecte = 0;
    lignes.forEach((l) => {
      motsClefs.lastIndex = 0;
      if (motsClefs.test(l)) nbDetecte++;
    });
    const budgetTotal = nbDetecte * prixParVisite;
    const budgetParJour = result.joursPension > 0 ? budgetTotal / result.joursPension : budgetTotal;
    setEstimateMsg(
      `${nbDetecte} ligne(s) avec activité détectée × ${prixParVisite.toFixed(
        2
      )} € ≈ ${budgetTotal.toFixed(2)} € par personne sur le séjour (soit ~${budgetParJour.toFixed(
        2
      )} €/jour).`
    );
  }

  function applyEstimate() {
    const motsClefs =
      /\b(visite|musée|excursion|découverte|monument|château|parc|aquarium|atelier|entrée|billet)\b/gi;
    const lignes = programme.split("\n");
    let nbDetecte = 0;
    lignes.forEach((l) => {
      motsClefs.lastIndex = 0;
      if (motsClefs.test(l)) nbDetecte++;
    });
    const budgetTotal = nbDetecte * prixParVisite;
    const budgetParJour = result.joursPension > 0 ? budgetTotal / result.joursPension : budgetTotal;
    setVisites(Number(budgetParJour.toFixed(2)));
    setEstimateMsg((prev) => (prev ? prev + " — appliqué ✓" : "Appliqué ✓"));
  }

  async function handleFicheUpload(file: File) {
    if (typeof window === "undefined" || !window.Tesseract) {
      setOcrStatus(
        "La lecture d'image n'a pas pu se charger (connexion internet requise). Réessaie avec une connexion active."
      );
      return;
    }
    setOcrStatus("Lecture de l'image en cours... (peut prendre 15-30 secondes)");
    try {
      const { data } = await window.Tesseract.recognize(file, "fra", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrStatus(`Lecture en cours... ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      });
      const text = data.text;

      // Reconstruction colonne par colonne : sur les fiches en 2 colonnes, Tesseract.js
      // (contrairement au moteur en ligne de commande) fusionne souvent les deux colonnes
      // ligne par ligne dans le texte brut ("Voyage aller" + "Grenade" sur la même ligne).
      // On reconstruit l'ordre de lecture à partir des coordonnées de chaque mot :
      // colonne gauche lue en entier de haut en bas, puis colonne droite.
      let columnAwareText = text;
      const words = data.words || [];
      if (words.length > 20) {
        const minX = Math.min(...words.map((w) => w.bbox.x0));
        const maxX = Math.max(...words.map((w) => w.bbox.x1));
        const midX = (minX + maxX) / 2;

        const buildColumnText = (colWords: typeof words) => {
          const sorted = [...colWords].sort((a, b) => a.bbox.y0 - b.bbox.y0);
          const lines: { y: number; words: typeof words }[] = [];
          const lineHeightTolerance = 12;
          sorted.forEach((w) => {
            const line = lines.find((l) => Math.abs(l.y - w.bbox.y0) < lineHeightTolerance);
            if (line) {
              line.words.push(w);
              line.y = (line.y + w.bbox.y0) / 2;
            } else {
              lines.push({ y: w.bbox.y0, words: [w] });
            }
          });
          lines.sort((a, b) => a.y - b.y);
          let out = "";
          let prevY: number | null = null;
          lines.forEach((l) => {
            const lineText = l.words.sort((a, b) => a.bbox.x0 - b.bbox.x0).map((w) => w.text).join(" ");
            if (prevY !== null && l.y - prevY > lineHeightTolerance * 2.5) {
              out += "\n";
            }
            out += lineText + "\n";
            prevY = l.y;
          });
          return out;
        };

        const leftWords = words.filter((w) => w.bbox.x0 < midX);
        const rightWords = words.filter((w) => w.bbox.x0 >= midX);
        columnAwareText = buildColumnText(leftWords) + "\n\n" + buildColumnText(rightWords);
      }
      setOcrRawText(
        `--- TEXTE BRUT (ordre original) ---\n${text}\n\n--- TEXTE RECONSTRUIT PAR COLONNE ---\n${columnAwareText}`
      );

      // 1er essai : programme au format texte simple avec "JOUR X" écrit en toutes lettres
      // (fonctionne pour les devis d'agences concurrentes en PDF/Word classiques).
      const jourRegex = /JOUR\s*\d+[^\n]*(?:\n(?!JOUR\s*\d+|BUDGET|AUTRES)[^\n]*)*/gi;
      let joursTrouves: string[] = columnAwareText.match(jourRegex) || [];
      let usedFallback = false;

      // Repli : sur les fiches Scolamove/brochures illustrées, le numéro "JOUR X" est un
      // badge graphique coloré que l'OCR ne lit quasiment jamais correctement (il ressort
      // souvent comme "CLÉS Tolède" ou "EU Séville" au lieu de "JOUR 2"/"JOUR 4"...).
      // On détecte alors les paragraphes de contenu directement, via les verbes d'action
      // qui démarrent presque toujours un jour de programme, et on les numérote nous-mêmes.
      if (joursTrouves.length < 2) {
        usedFallback = true;
        const startKeywords =
          /^(départ|arrivée|visite|excursion|retour|petit-déjeuner|découverte|journée|matinée|après-midi|route)/i;
        const excludeNoise = /budget|^www\.|base\s*\d+\s*\+\s*\d+|environ.*€/i;
        const blocks = columnAwareText
          .split(/\n\s*\n/)
          .map((b) => b.trim())
          .filter(Boolean);
        joursTrouves = blocks.filter(
          (b) => b.length >= 25 && !excludeNoise.test(b) && startKeywords.test(b)
        );
      }

      if (joursTrouves.length) {
        setProgramme(
          joursTrouves
            .map((j, i) => (usedFallback ? `JOUR ${i + 1}\n${j.trim()}` : j.trim()))
            .join("\n\n")
        );
      }
      const mJours = text.match(/(\d+)\s*JOURS?/i);
      const mNuits = text.match(/(\d+)\s*NUITS?/i);
      if (mJours) setJours(Number(mJours[1]));
      if (mNuits) setNuits(Number(mNuits[1]));

      const mBudget =
        text.match(/budget\s*visites?[\s\S]{0,100}?(\d+[.,]?\d*)\s*€/i) ||
        text.match(/environ\s*(\d+[.,]?\d*)\s*€/i);
      let budgetMsg = "";
      if (mBudget) {
        const budgetDetecte = parseFloat(mBudget[1].replace(",", "."));
        const jP = Math.max((mNuits ? Number(mNuits[1]) : nuits) + 1, 1);
        const parJour = budgetDetecte / jP;
        setVisites(Number(parJour.toFixed(2)));
        budgetMsg = ` Budget visites détecté : ${budgetDetecte.toFixed(
          2
        )} €/pers, appliqué (~${parJour.toFixed(2)} €/jour).`;
      }
      const mPrixCatalogue = text.match(/à\s*partir\s*de\s*(\d+[.,]?\d*)\s*€/i);
      const prixMsg = mPrixCatalogue
        ? ` Prix catalogue détecté : ${mPrixCatalogue[1]} €/pers (comparaison uniquement).`
        : "";

      setOcrStatus(
        `${joursTrouves.length} jour(s) de programme détecté(s) et inséré(s)${
          usedFallback ? " (numérotation automatique, les intitulés de jour n'étaient pas lisibles sur les badges colorés)" : ""
        }.${budgetMsg}${prixMsg} Vérifie le texte — l'OCR peut contenir des erreurs.`
      );
    } catch {
      setOcrStatus("Échec de la lecture de l'image. Réessaie avec une photo plus nette, ou colle le texte manuellement.");
    }
  }

  const pdfStyles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#292420" },
    letterhead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 3,
      borderBottomColor: "#8ec63f",
      paddingBottom: 10,
      marginBottom: 20,
    },
    brand: { fontFamily: "Helvetica-Bold", fontSize: 18, color: "#1a1a1a" },
    coords: { fontSize: 8, color: "#777", textAlign: "right", lineHeight: 1.5 },
    addrBlock: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
    addrName: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: "#1a1a1a" },
    addrMeta: { fontSize: 10, color: "#555" },
    refLine: { fontSize: 9.5, marginBottom: 16, color: "#444" },
    refBold: { fontFamily: "Helvetica-Bold", color: "#e8683a" },
    letter: { fontSize: 10.5, marginBottom: 10, lineHeight: 1.5 },
    metaTable: { borderWidth: 1, borderColor: "#e2ddd0", marginBottom: 16 },
    metaRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2ddd0" },
    metaLabel: {
      width: "22%",
      flexGrow: 0,
      flexShrink: 0,
      backgroundColor: "#faf7f0",
      fontFamily: "Helvetica-Bold",
      color: "#3d5a45",
      fontSize: 9,
      padding: 6,
    },
    metaValue: { flexGrow: 1, flexShrink: 1, fontSize: 9.5, padding: 6 },
    programmeBlock: { marginVertical: 16 },
    programmeText: {
      fontSize: 9.5,
      lineHeight: 1.5,
      borderLeftWidth: 2,
      borderLeftColor: "#8ec63f",
      paddingLeft: 10,
    },
    offerTitle: {
      textAlign: "center",
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#fff",
      backgroundColor: "#e8683a",
      borderRadius: 4,
      padding: 8,
      marginVertical: 16,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    offerTable: { borderWidth: 1, borderColor: "#e2ddd0", marginBottom: 6 },
    offerHeadRow: { flexDirection: "row", backgroundColor: "#3d5a45" },
    offerHeadCell: { flexGrow: 1, flexShrink: 1, color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 9.5, padding: 7 },
    offerHeadValueCell: { flexGrow: 0, flexShrink: 0, width: 90, color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 9.5, padding: 7, textAlign: "right" },
    offerRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e2ddd0" },
    offerLabelCell: { flexGrow: 1, flexShrink: 1, fontSize: 9.5, padding: 7 },
    offerValueCell: { flexGrow: 0, flexShrink: 0, width: 90, fontSize: 9.5, padding: 7, textAlign: "right", fontFamily: "Helvetica-Bold" },
    totalBox: {
      backgroundColor: "#6fae2a",
      borderRadius: 8,
      padding: 16,
      alignItems: "center",
      marginVertical: 18,
    },
    totalLine: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#fff", marginBottom: 4 },
    totalPers: { fontSize: 10, color: "#eaf6da", fontFamily: "Helvetica-Bold" },
    totalNote: { fontSize: 9, color: "#eaf6da", marginTop: 6, fontStyle: "italic" },
    sectionTitle: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: "#3d5a45",
      backgroundColor: "#eef5e5",
      borderLeftWidth: 3,
      borderLeftColor: "#8ec63f",
      padding: 6,
      marginTop: 16,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    listItem: { fontSize: 9.5, lineHeight: 1.5, marginBottom: 3, color: "#444" },
    signoff: { marginTop: 22, fontSize: 10 },
    signoffName: { fontFamily: "Helvetica-Bold", marginTop: 12, color: "#3d5a45" },
    legalFooter: {
      marginTop: 26,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#e2ddd0",
      fontSize: 7.5,
      color: "#999",
      textAlign: "center",
    },
  });

  function DevisPdfDocument({ logoDataUrl, refOverride }: { logoDataUrl: string; refOverride?: string }) {
    const zoneLabel = zone ? ZONES[zone].label : "Destination non renseignée";
    const refVal = refOverride || reference;
    const dateStr = new Date().toLocaleDateString("fr-FR");
    const etabStr = [etablissement, ville].filter(Boolean).join(" — ") || "Établissement scolaire";
    const periodeStr = dateVoyage || `${jours} jours / ${nuits} nuits (dates à préciser)`;
    const sejourTotal = result.prixFerme - result.visitesTotal;
    const logoUrl = logoDataUrl;

    const comprend = [
      sousTraite
        ? "Le transport en autocar, depuis votre établissement, aller et retour, et son utilisation sur place pour le programme des visites"
        : "Le transport en autocar de la flotte Festimove, depuis votre établissement, aller et retour, et son utilisation sur place pour le programme des visites",
      "Les repas et l'hébergement des chauffeurs, ainsi que les frais de parking, autoroutes et péages",
      `L'hébergement en pension complète (${nuits} nuits)`,
      taxeSejourCheck ? "Les taxes de séjour" : "Les taxes de séjour, quand applicables",
      assuranceCheck ? "L'assurance annulation" : "Une prestation d'assistance et de rapatriement en cas d'accident grave",
      "Une permanence téléphonique 24h/24 durant votre voyage",
      "La réservation des sites et musées quand elle est obligatoire",
      "De la documentation pédagogique à télécharger",
    ];
    const nComprend = [
      "Les repas du voyage aller et retour, ainsi que les repas proposés en option",
      assuranceCheck ? null : "L'assurance annulation, proposée en option",
      taxeSejourCheck ? null : "Les taxes de séjour, quand applicables sur place",
      cautionCheck
        ? `L'éventuelle caution demandée sur place par certains hébergements (environ ${cautionMontant.toFixed(2)} € par personne, restituée en fin de séjour)`
        : "L'éventuelle caution demandée sur place par certains hébergements (restituée en fin de séjour)",
      chambreIndivCheck
        ? `Le supplément chambre individuelle (${chambreIndivMontant.toFixed(2)} €/nuit/accompagnateur, sur demande)`
        : "Le supplément chambre individuelle",
      "Les dépenses personnelles",
      'Tout ce qui n\'est pas mentionné dans "Le prix comprend"',
    ].filter((l): l is string => Boolean(l));

    const programmeLines = programme.trim() ? programme.split("\n") : [];

    return (
      <Document>
        {/* PAGE 1 — Identification + tarification + mot de clôture + signature */}
        <Page size="A4" style={pdfStyles.page}>
          <View style={pdfStyles.letterhead}>
            {logoUrl ? <PdfImage src={logoUrl} style={{ width: 130, objectFit: "contain" }} /> : <Text style={pdfStyles.brand}>Scolamove</Text>}
            <Text style={pdfStyles.coords}>Scolamove — Agence de voyages scolaires{"\n"}contact@scolamove.fr</Text>
          </View>

          <View style={pdfStyles.addrBlock}>
            <Text style={pdfStyles.addrName}>{etabStr}</Text>
            <Text style={pdfStyles.addrMeta}>{dateStr}</Text>
          </View>

          <Text style={pdfStyles.refLine}>
            Votre référence de voyage est : <Text style={pdfStyles.refBold}>{refVal}</Text>
            {dossierSuiviPar ? `\nDossier suivi par : ${dossierSuiviPar}` : ""}
          </Text>

          <Text style={pdfStyles.letter}>Bonjour,</Text>
          <Text style={pdfStyles.letter}>
            Nous avons le plaisir de vous adresser ci-après notre proposition pour votre projet de voyage scolaire :
          </Text>

          <View style={pdfStyles.metaTable}>
            <View style={pdfStyles.metaRow}>
              <Text style={pdfStyles.metaLabel}>Destination</Text>
              <Text style={pdfStyles.metaValue}>{zoneLabel}</Text>
            </View>
            <View style={pdfStyles.metaRow}>
              <Text style={pdfStyles.metaLabel}>Effectif</Text>
              <Text style={pdfStyles.metaValue}>{eleves} élèves et {accomp} accompagnateurs</Text>
            </View>
            <View style={[pdfStyles.metaRow, { borderBottomWidth: 0 }]}>
              <Text style={pdfStyles.metaLabel}>Période</Text>
              <Text style={pdfStyles.metaValue}>{periodeStr}</Text>
            </View>
          </View>

          <Text style={pdfStyles.offerTitle}>Devis {zoneLabel}</Text>

          <View style={pdfStyles.offerTable}>
            <View style={pdfStyles.offerHeadRow}>
              <Text style={pdfStyles.offerHeadCell}>Détail de l&apos;offre</Text>
              <Text style={pdfStyles.offerHeadValueCell}>Montants</Text>
            </View>
            <View style={pdfStyles.offerRow}>
              <Text style={pdfStyles.offerLabelCell}>Prix du séjour (voyage à forfait)</Text>
              <Text style={pdfStyles.offerValueCell}>{sejourTotal.toFixed(2)} €</Text>
            </View>
            <View style={pdfStyles.offerRow}>
              <Text style={pdfStyles.offerLabelCell}>Visites / activités</Text>
              <Text style={pdfStyles.offerValueCell}>{result.visitesTotal.toFixed(2)} €</Text>
            </View>
            {assuranceCheck && (
              <View style={pdfStyles.offerRow}>
                <Text style={pdfStyles.offerLabelCell}>Assurance annulation</Text>
                <Text style={pdfStyles.offerValueCell}>{result.assuranceMontant.toFixed(2)} €</Text>
              </View>
            )}
            {taxeSejourCheck && (
              <View style={pdfStyles.offerRow}>
                <Text style={pdfStyles.offerLabelCell}>Taxe de séjour ({nuits} nuits)</Text>
                <Text style={pdfStyles.offerValueCell}>{result.taxeSejourTotal.toFixed(2)} €</Text>
              </View>
            )}
          </View>

          <View style={pdfStyles.totalBox}>
            <Text style={pdfStyles.totalLine}>
              Le coût du voyage est de {(result.prixFerme * result.pax).toFixed(2)} €
            </Text>
            <Text style={pdfStyles.totalPers}>
              Soit {result.prixFerme.toFixed(2)} € par personne (élèves et adultes)
            </Text>
            {cautionCheck && (
              <Text style={pdfStyles.totalNote}>
                + Caution hôtel d&apos;environ {cautionMontant.toFixed(2)} € par personne, à régler sur place et restituée en fin de séjour (non incluse au prix ci-dessus)
              </Text>
            )}
            {chambreIndivCheck && (
              <Text style={pdfStyles.totalNote}>
                + Chambre individuelle accompagnateurs (en option) : {chambreIndivMontant.toFixed(2)} € par nuit et par accompagnateur, sur demande
              </Text>
            )}
          </View>

          <Text style={pdfStyles.letter}>
            Je reste à votre disposition pour l&apos;organisation de ce voyage et faire en sorte que votre projet puisse se concrétiser.
          </Text>

          <View style={pdfStyles.signoff}>
            <Text>Bien cordialement,</Text>
            <Text style={pdfStyles.signoffName}>Jérémy — Scolamove</Text>
          </View>

          <Text style={pdfStyles.legalFooter}>
            Scolamove — Agence de voyages scolaires · Ce document est une estimation non contractuelle établie à titre indicatif.
          </Text>
        </Page>

        {/* PAGE 2 — Le prix comprend / ne comprend pas / conditions tarifaires */}
        <Page size="A4" style={pdfStyles.page}>
          <View style={pdfStyles.letterhead}>
            {logoUrl ? <PdfImage src={logoUrl} style={{ width: 110, objectFit: "contain" }} /> : <Text style={pdfStyles.brand}>Scolamove</Text>}
            <Text style={pdfStyles.coords}>Devis {refVal}</Text>
          </View>

          <Text style={pdfStyles.sectionTitle}>Le prix comprend</Text>
          {comprend.map((l, i) => (
            <Text key={i} style={pdfStyles.listItem}>• {l}</Text>
          ))}

          <Text style={pdfStyles.sectionTitle}>Le prix ne comprend pas</Text>
          {nComprend.map((l, i) => (
            <Text key={i} style={pdfStyles.listItem}>• {l}</Text>
          ))}

          <Text style={pdfStyles.sectionTitle}>Conditions tarifaires</Text>
          <Text style={pdfStyles.listItem}>
            • Tarifs valables sous réserve de disponibilité dans les hébergements choisis et auprès de notre partenaire autocariste au moment de la réservation.
          </Text>
          <Text style={pdfStyles.listItem}>
            • Cette offre est une estimation et ne constitue pas un devis contractuel. Un devis détaillé et personnalisé sera établi dès validation de votre projet.
          </Text>

          <Text style={pdfStyles.legalFooter}>
            Scolamove — Agence de voyages scolaires · Ce document est une estimation non contractuelle établie à titre indicatif.
          </Text>
        </Page>

        {/* PAGE 3 — Programme du séjour */}
        {programmeLines.length > 0 && (
          <Page size="A4" style={pdfStyles.page}>
            <View style={pdfStyles.letterhead}>
              {logoUrl ? <PdfImage src={logoUrl} style={{ width: 110, objectFit: "contain" }} /> : <Text style={pdfStyles.brand}>Scolamove</Text>}
              <Text style={pdfStyles.coords}>Devis {refVal}</Text>
            </View>

            <Text style={pdfStyles.sectionTitle}>Programme du séjour</Text>
            <View style={pdfStyles.programmeText}>
              {programmeLines.map((line, i) => (
                <Text key={i} style={{ marginBottom: line.trim() === "" ? 4 : 1 }}>
                  {line}
                </Text>
              ))}
            </View>

            <Text style={pdfStyles.legalFooter}>
              Scolamove — Agence de voyages scolaires · Ce document est une estimation non contractuelle établie à titre indicatif.
            </Text>
          </Page>
        )}
      </Document>
    );
  }

  function buildSavedData(): SavedDevisData {
    return {
      zone,
      jours,
      nuits,
      eleves,
      accomp,
      confort,
      visites,
      marge,
      sousTraite,
      margeTransport,
      ratios,
      assuranceCheck,
      assurancePct,
      assuranceMin,
      taxeSejourCheck,
      taxeSejourMontant,
      cautionCheck,
      cautionMontant,
      chambreIndivCheck,
      chambreIndivMontant,
      etablissement,
      dossierSuiviPar,
      teacherName,
      teacherEmail,
      ville,
      reference,
      dateVoyage,
      programme,
      prixParVisite,
      selectedSejourId,
    };
  }

  async function syncTeacherProject(refVal: string) {
    if (!teacherEmail.trim()) return; // pas d'email = pas de dossier enseignant possible

    const zoneLabel = zone ? ZONES[zone].label : "Voyage scolaire";
    const { data: projectRow, error: projectError } = await supabase
      .from("teacher_projects")
      .upsert(
        {
          access_code: refVal,
          sejour_title: zoneLabel,
          school_name: etablissement || "Établissement non renseigné",
          school_city: ville || null,
          teacher_name: teacherName || "Non renseigné",
          teacher_email: teacherEmail.trim(),
          teacher_phone: null,
          level: null,
          student_target: eleves || null,
          budget_target: `${result.prixFerme.toFixed(2)} € / pers`,
          status: "Devis envoyé",
          notes: dossierSuiviPar ? `Dossier suivi par ${dossierSuiviPar} (Scolamove).` : null,
        },
        { onConflict: "access_code" }
      )
      .select("id")
      .single();

    if (projectError || !projectRow) {
      console.error("Erreur Supabase (upsert teacher_projects):", projectError);
      return;
    }

    // Dépose le PDF du devis comme document du projet, remplace l'ancien s'il existe déjà
    try {
      const logoDataUrl = await loadLogoAsPngDataUrl().catch(() => "");
      const blob = await pdf(<DevisPdfDocument logoDataUrl={logoDataUrl} refOverride={refVal} />).toBlob();
      const filePath = `${refVal}/devis.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("project-documents")
        .upload(filePath, blob, { upsert: true, contentType: "application/pdf" });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("project-documents").getPublicUrl(filePath);
        await supabase.from("project_documents").delete().eq("project_id", projectRow.id).eq("title", "Devis");
        await supabase.from("project_documents").insert({
          project_id: projectRow.id,
          title: "Devis",
          category: "Devis",
          file_url: publicUrlData.publicUrl,
        });
      } else {
        console.error("Erreur Supabase (upload devis PDF):", uploadError);
      }
    } catch (e) {
      console.error("Erreur génération/dépôt du PDF pour l'espace enseignant:", e);
    }
  }

  async function handleSaveDevis() {
    setSaveStatus("Enregistrement...");
    const refVal = reference;
    const payload = {
      reference: refVal,
      etablissement: etablissement || null,
      ville: ville || null,
      zone,
      prix_ferme: result.prixFerme,
      pax: result.pax,
      data: { ...buildSavedData(), reference: refVal },
      updated_at: new Date().toISOString(),
    };

    if (loadedId) {
      const { error } = await supabase.from("devis_express").update(payload).eq("id", loadedId);
      if (error) {
        console.error("Erreur Supabase (update devis_express):", error);
        setSaveStatus(`Erreur : ${error.message || error.code || "voir console"}`);
        return;
      }
    } else {
      const { data, error } = await supabase.from("devis_express").insert(payload).select("id").single();
      if (error) {
        console.error("Erreur Supabase (insert devis_express):", error);
        setSaveStatus(`Erreur : ${error.message || error.code || "voir console"}`);
        return;
      }
      setLoadedId(data.id);
    }

    if (teacherEmail.trim()) {
      setSaveStatus("Devis enregistré — synchronisation avec l'espace enseignant...");
      await syncTeacherProject(refVal);
      setSaveStatus("Devis enregistré et disponible dans l'espace enseignant ✓");
    } else {
      setSaveStatus("Devis enregistré ✓ (renseigne l'email du professeur pour qu'il le retrouve dans son espace)");
    }

    await fetchSavedDevis();
    setTimeout(() => setSaveStatus(""), 6000);
  }

  function handleLoadDevis(row: SavedDevisRow) {
    const d = row.data;
    setZone(d.zone);
    setJours(d.jours);
    setNuits(d.nuits);
    setEleves(d.eleves);
    setAccomp(d.accomp);
    setConfort(d.confort);
    setVisites(d.visites);
    setMarge(d.marge);
    setSousTraite(d.sousTraite);
    setMargeTransport(d.margeTransport);
    setRatios(d.ratios);
    setAssuranceCheck(d.assuranceCheck);
    setAssurancePct(d.assurancePct);
    setAssuranceMin(d.assuranceMin);
    setTaxeSejourCheck(d.taxeSejourCheck);
    setTaxeSejourMontant(d.taxeSejourMontant);
    setCautionCheck(d.cautionCheck);
    setCautionMontant(d.cautionMontant);
    setChambreIndivCheck(d.chambreIndivCheck);
    setChambreIndivMontant(d.chambreIndivMontant);
    setEtablissement(d.etablissement);
    setDossierSuiviPar(d.dossierSuiviPar || "");
    setTeacherName(d.teacherName || "");
    setTeacherEmail(d.teacherEmail || "");
    setVille(d.ville);
    setReference(d.reference);
    setDateVoyage(d.dateVoyage);
    setProgramme(d.programme);
    setPrixParVisite(d.prixParVisite);
    setSelectedSejourId(d.selectedSejourId || ""); // restaure le séjour lié à CE devis précisément
    setLoadedId(row.id);
    setSaveStatus(`Devis "${row.reference}" chargé ✓`);
    setTimeout(() => setSaveStatus(""), 2500);
  }

  async function handleDeleteDevis(id: string) {
    if (!confirm("Supprimer définitivement ce devis ?")) return;
    const { error } = await supabase.from("devis_express").delete().eq("id", id);
    if (!error) {
      if (loadedId === id) setLoadedId(null);
      await fetchSavedDevis();
    }
  }

  function handleNewDevis() {
    setLoadedId(null);
    setZone("");
    setJours(0);
    setNuits(0);
    setEleves(0);
    setAccomp(0);
    setConfort("1");
    setVisites(0);
    setMarge(5);
    setSousTraite(false);
    setMargeTransport(20);
    setRatios(emptyRatios);
    setAssuranceCheck(false);
    setAssurancePct(2.5);
    setAssuranceMin(6);
    setTaxeSejourCheck(false);
    setTaxeSejourMontant(1.5);
    setCautionCheck(false);
    setCautionMontant(10);
    setChambreIndivCheck(false);
    setChambreIndivMontant(25);
    setEtablissement("");
    setDossierSuiviPar("");
    setTeacherName("");
    setTeacherEmail("");
    setVille("");
    setReference(genRef());
    setDateVoyage("");
    setProgramme("");
    setPrixParVisite(6);
    setSelectedSejourId("");
    setSaveStatus("Nouveau devis — champs propres au voyage réinitialisés (marges conservées).");
    setTimeout(() => setSaveStatus(""), 2500);
  }

  async function loadLogoAsPngDataUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible d'obtenir le contexte canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Échec du chargement du logo"));
      img.src = "/images/logo-scolamove.png";
    });
  }

  async function handleDownload() {
    let logoDataUrl = "";
    try {
      logoDataUrl = await loadLogoAsPngDataUrl();
    } catch {
      logoDataUrl = "";
    }
    // Une seule référence générée pour tout le document : évite qu'un devis sans référence
    // saisie se retrouve avec un nom de fichier différent de la référence écrite dedans.
    const refVal = reference;
    const blob = await pdf(<DevisPdfDocument logoDataUrl={logoDataUrl} refOverride={refVal} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devis-${refVal}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }


  async function handleCopyEmail() {
    const zoneLabel = zone ? ZONES[zone].label : "Destination non renseignée";
    const civilite = teacherName.trim() ? `Bonjour ${teacherName.trim()},` : "Bonjour,";
    const etabLine = etablissement.trim()
      ? `\nÉtablissement : ${etablissement.trim()}${ville.trim() ? ` — ${ville.trim()}` : ""}`
      : "";
    const dossierLine = dossierSuiviPar.trim() ? `\nDossier suivi par : ${dossierSuiviPar.trim()}` : "";

    const objet = `Objet : Devis voyage scolaire ${zoneLabel} — ${etablissement.trim() || "votre établissement"} (réf. ${reference})`;

    const texte = `${objet}

${civilite}

Suite à votre demande, voici notre proposition pour votre projet de voyage scolaire (référence ${reference}) :
${etabLine}${dossierLine}

Destination : ${zoneLabel}
Durée : ${jours} jours / ${nuits} nuits
Effectif : ${eleves} élèves + ${accomp} accompagnateurs (${result.pax} personnes)

Prix : ${result.prixFerme.toFixed(0)} € par personne, soit ${(result.prixFerme * result.pax).toFixed(0)} € pour le groupe, sous réserve de disponibilités auprès de nos partenaires (hébergement) au moment de la réservation.
${assuranceCheck ? `(dont assurance annulation incluse : ${result.assuranceMontant.toFixed(2)} €/pers)\n` : ""}${taxeSejourCheck ? `(dont taxe de séjour incluse : ${result.taxeSejourTotal.toFixed(2)} €/pers)\n` : ""}${cautionCheck ? `Une caution hôtel d'environ ${cautionMontant.toFixed(2)} €/pers sera à régler sur place (restituée en fin de séjour, non incluse au prix).\n` : ""}${chambreIndivCheck ? `Option chambre individuelle pour les accompagnateurs disponible : +${chambreIndivMontant.toFixed(2)} €/nuit/accompagnateur.\n` : ""}
Vous trouverez le devis détaillé (programme, prix comprend/ne comprend pas) en pièce jointe.
${teacherEmail.trim() ? `\nCe projet est également accessible depuis votre espace enseignant avec le code ${reference} :\nhttps://www.scolamove.fr/espace-enseignant\n` : ""}
N'hésitez pas à revenir vers nous pour toute précision.

Cordialement,
Jérémy — Scolamove`;

    try {
      await navigator.clipboard.writeText(texte);
      setCopyState("Copié ✓");
    } catch {
      setCopyState("Copie impossible — sélectionne le texte manuellement.");
    }
    setTimeout(() => setCopyState(""), 2500);
  }

  if (!isLogged) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card">
          <a href="/admin" className="admin-back">
            Retour au dashboard admin
          </a>
          <h1>Devis Express</h1>
          <p>Connecte-toi depuis le dashboard admin pour accéder à cet outil.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <Script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" strategy="lazyOnload" />

      <aside className="admin-sidebar">
        <div className="admin-brand">
          Scolamove
          <span>Devis Express</span>
        </div>
        <nav className="admin-menu">
          <a href="/admin">Retour dashboard</a>
          <a href="/" target="_blank" rel="noreferrer">
            Voir le site
          </a>
        </nav>
      </aside>

      <section className="admin-content de-content" style={{ maxWidth: 960 }}>
        <style jsx>{`
          .de-content {
            background: linear-gradient(180deg, #f4f9f2 0%, #f7f9fb 340px, transparent 340px);
          }
          .de-hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            background: linear-gradient(120deg, #123c3f 0%, #1c5450 60%, #4f9d7a 130%);
            border-radius: 22px;
            padding: 26px 30px;
            margin-bottom: 26px;
            box-shadow: 0 16px 34px rgba(18, 60, 63, 0.28);
          }
          .de-hero-title {
            color: #fff;
          }
          .de-hero-eyebrow {
            display: inline-block;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #d7f2c8;
            background: rgba(255, 255, 255, 0.12);
            padding: 4px 10px;
            border-radius: 999px;
            margin-bottom: 10px;
          }
          .de-hero h1 {
            color: #fff;
            font-size: 28px;
            margin: 0;
          }
          .de-hero p {
            color: #dcece2;
            font-size: 13px;
            margin: 8px 0 0;
            max-width: 480px;
          }
          .de-hero-logo {
            background: #fff;
            border-radius: 14px;
            padding: 10px 16px;
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
          }

          .de-panel {
            margin-bottom: 22px;
            position: relative;
            border-top: 4px solid var(--panel-accent, var(--green));
            overflow: hidden;
          }
          .de-panel.identite { --panel-accent: #f6d77a; }
          .de-panel.voyage { --panel-accent: #4f9d7a; }
          .de-panel.options { --panel-accent: #e8683a; }
          .de-panel.programme { --panel-accent: #123c3f; }

          .de-panel-head {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
          }
          .de-panel-icon {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            background: color-mix(in srgb, var(--panel-accent, var(--green)) 16%, white);
            flex-shrink: 0;
          }
          .de-panel-head h2 {
            margin: 0;
            font-size: 16px;
            color: var(--navy);
          }
          .de-panel-head .de-eyebrow {
            display: block;
            font-size: 10.5px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 2px;
          }

          .de-panel label {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
            color: var(--muted);
            margin: 0;
          }
          .de-panel input[type="text"],
          .de-panel input[type="number"],
          .de-panel input[type="email"],
          .de-panel select,
          .de-panel textarea,
          .de-panel input:not([type]) {
            font-family: inherit;
            font-size: 14px;
            font-weight: 500;
            color: var(--navy);
            padding: 11px 13px;
            border-radius: 12px;
            border: 1.5px solid #dce8f5;
            background: #fbfdff;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .de-panel input:focus,
          .de-panel select:focus,
          .de-panel textarea:focus {
            outline: none;
            border-color: #4f9d7a;
            box-shadow: 0 0 0 4px rgba(79, 157, 122, 0.15);
          }
          .de-panel input[type="file"] {
            border: 1.5px dashed #c8dceb;
            border-radius: 12px;
            padding: 14px;
            background: #fbfdff;
            font-size: 13px;
          }

          .de-check-row {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #fbfdff;
            border: 1.5px solid #e5eef8;
            border-radius: 14px;
            padding: 12px 14px;
            margin-top: 14px;
            transition: border-color 0.15s ease, background 0.15s ease;
          }
          .de-check-row:has(input:checked) {
            border-color: #4f9d7a;
            background: #f0f9ec;
          }
          .de-check-row input {
            width: 19px;
            height: 19px;
            accent-color: #4f9d7a;
          }
          .de-check-row span {
            font-size: 13px;
            font-weight: 700;
            color: var(--navy);
          }

          .de-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 13.5px;
            font-weight: 800;
            padding: 12px 20px;
            border-radius: 999px;
            border: none;
            cursor: pointer;
            transition: transform 0.12s ease, box-shadow 0.12s ease;
          }
          .de-btn:active {
            transform: translateY(1px);
          }
          .de-btn-primary {
            background: linear-gradient(120deg, #4f9d7a, #3d8064);
            color: #fff;
            box-shadow: 0 10px 20px rgba(79, 157, 122, 0.35);
          }
          .de-btn-primary:hover {
            box-shadow: 0 12px 26px rgba(79, 157, 122, 0.45);
          }
          .de-btn-accent {
            background: linear-gradient(120deg, #e8683a, #d85426);
            color: #fff;
            box-shadow: 0 10px 20px rgba(232, 104, 58, 0.35);
          }
          .de-btn-accent:hover {
            box-shadow: 0 12px 26px rgba(232, 104, 58, 0.45);
          }
          .de-btn-outline {
            background: #fff;
            color: var(--navy);
            border: 1.5px solid #dce8f5;
            font-size: 12px;
            padding: 8px 14px;
          }

          .de-result {
            background: linear-gradient(135deg, #123c3f 0%, #1c5450 55%, #2d6b58 100%);
            border-radius: 22px;
            padding: 28px 30px;
            margin: 24px 0;
            color: #f6f4ee;
            box-shadow: 0 18px 36px rgba(18, 60, 63, 0.3);
          }
          .de-result-eyebrow {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #b7d9c8;
            font-weight: 800;
          }
          .de-result-price {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: -0.01em;
            margin: 6px 0 18px;
          }
          .de-result-price small {
            font-size: 15px;
            font-weight: 500;
            color: #b7d9c8;
            margin-left: 8px;
          }
          .de-result-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.18);
            padding-top: 18px;
            font-size: 13px;
          }
          .de-result-grid .row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.14);
            padding-bottom: 6px;
          }
          .de-result-grid .row.italic {
            font-style: italic;
            color: #d7f2c8;
          }
          .de-result-footer {
            margin-top: 16px;
            font-size: 12.5px;
            color: #cfe6d9;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 10px 14px;
          }
          .de-disclaimer {
            font-size: 11.5px;
            color: #8a6a3c;
            background: #fdf3e2;
            border-left: 4px solid #e8683a;
            border-radius: 10px;
            padding: 12px 16px;
            margin-top: 10px;
          }
          .de-actions {
            display: flex;
            gap: 12px;
            margin-top: 16px;
            flex-wrap: wrap;
            align-items: center;
          }
          .de-copystate {
            font-size: 12.5px;
            font-weight: 700;
            color: #3d8064;
          }
          .de-hint {
            font-size: 11px;
            color: var(--muted);
            margin-top: 8px;
            line-height: 1.6;
          }
          .de-panel details summary {
            cursor: pointer;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #4f9d7a;
            padding: 8px 0;
          }
          .de-estimate-msg {
            font-size: 12.5px;
            color: #3d8064;
            background: #f0f9ec;
            border-radius: 10px;
            padding: 10px 12px;
            margin-top: 10px;
          }
          .de-ocr-status {
            font-size: 12px;
            color: var(--muted);
            margin-top: 8px;
          }

          @media (max-width: 720px) {
            .de-hero {
              flex-direction: column;
              align-items: flex-start;
            }
            .de-result-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <div className="de-hero">
          <div className="de-hero-title">
            <span className="de-hero-eyebrow">Outil interne</span>
            <h1>Devis Express</h1>
            <p>
              Estimation instantanée par ratios moyens — sans sourcing détaillé. À envoyer en
              première réponse client ; le devis ferme se construit uniquement après accord de
              principe.
            </p>
          </div>
          <div className="de-hero-logo">
            <Image src="/images/logo-scolamove.png" alt="Scolamove" width={140} height={40} style={{ objectFit: "contain", display: "block" }} />
          </div>
        </div>

        {/* Devis enregistrés */}
        <div className="admin-panel de-panel identite" style={{ marginBottom: 22 }}>
          <div className="de-panel-head">
            <div className="de-panel-icon">💾</div>
            <div>
              <span className="de-eyebrow">{loadedId ? "Devis chargé" : "Nouveau devis"}</span>
              <h2>Mes devis enregistrés</h2>
            </div>
          </div>

          {loadedId && (
            <div className="de-check-row" style={{ marginBottom: 14, justifyContent: "space-between" }}>
              <span>Modifications en cours sur un devis existant ({reference})</span>
              <button type="button" onClick={handleNewDevis} className="de-btn de-btn-outline">
                Nouveau devis vierge
              </button>
            </div>
          )}

          {loadingSaved ? (
            <p style={{ fontSize: 12.5, color: "var(--muted)" }}>Chargement...</p>
          ) : savedDevis.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
              Aucun devis enregistré pour l&apos;instant — clique sur &quot;Enregistrer le devis&quot; en bas de page une fois ton calcul prêt.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8, maxHeight: 260, overflowY: "auto" }}>
              {savedDevis.map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: row.id === loadedId ? "1.5px solid #4f9d7a" : "1.5px solid #e5eef8",
                    background: row.id === loadedId ? "#f0f9ec" : "#fbfdff",
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--navy)" }}>
                      {row.etablissement || "Établissement non renseigné"} — {row.reference}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 11.5 }}>
                      {row.zone ? ZONES[row.zone as ZoneKey]?.label ?? row.zone : ""}
                      {row.pax ? ` · ${row.pax} pers` : ""}
                      {row.prix_ferme ? ` · ${Number(row.prix_ferme).toFixed(0)} €/pers` : ""}
                      {" · "}
                      {new Date(row.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button type="button" onClick={() => handleLoadDevis(row)} className="de-btn de-btn-outline">
                      Charger
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDevis(row.id)}
                      className="de-btn de-btn-outline"
                      style={{ color: "#c0392b", borderColor: "#f0c4bc" }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Identification */}
        <div className="admin-panel de-panel identite">
          <div className="de-panel-head">
            <div className="de-panel-icon">🗂️</div>
            <div>
              <span className="de-eyebrow">Étape 1</span>
              <h2>Identification du devis</h2>
            </div>
          </div>
          <div className="admin-form-grid two">
            <label>
              Établissement
              <input value={etablissement} onChange={(e) => setEtablissement(e.target.value)} placeholder="Collège / Lycée..." />
            </label>
            <label>
              Dossier suivi par
              <input value={dossierSuiviPar} onChange={(e) => setDossierSuiviPar(e.target.value)} placeholder="Nom du responsable du dossier" />
            </label>
            <label>
              Ville
              <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville de l'établissement" />
            </label>
            <label>
              Personne responsable (enseignant)
              <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Nom du professeur demandeur" />
            </label>
            <label>
              Adresse email <span style={{ fontWeight: 400, color: "#e8683a" }}>(nécessaire pour l&apos;espace enseignant)</span>
              <input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} placeholder="professeur@etablissement.fr" />
            </label>
            <label>
              Référence
              <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Générée automatiquement si vide" />
            </label>
            <label>
              Période du voyage
              <input value={dateVoyage} onChange={(e) => setDateVoyage(e.target.value)} placeholder="du .../.../... au .../.../..." />
            </label>
          </div>
        </div>

        {/* Voyage & marges */}
        <div className="admin-panel de-panel voyage">
          <div className="de-panel-head">
            <div className="de-panel-icon">🚌</div>
            <div>
              <span className="de-eyebrow">Étape 2</span>
              <h2>Le voyage</h2>
            </div>
          </div>
          <div className="admin-form-grid two">
            <label>
              Destination / zone
              <select value={zone} onChange={(e) => setZone(e.target.value as ZoneKey | "")}>
                <option value="">— Choisir —</option>
                {Object.entries(ZONES).map(([key, z]) => (
                  <option key={key} value={key}>
                    {z.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Niveau de confort
              <select value={confort} onChange={(e) => setConfort(e.target.value as "0.85" | "1" | "1.25")}>
                <option value="0.85">Économique</option>
                <option value="1">Standard</option>
                <option value="1.25">Confort</option>
              </select>
            </label>
            <label>
              Jours (amplitude)
              <input type="number" value={jours} min={1} onChange={(e) => setJours(Number(e.target.value))} />
            </label>
            <label>
              Nuits sur place
              <input type="number" value={nuits} min={0} onChange={(e) => setNuits(Number(e.target.value))} />
            </label>
            <label>
              Élèves
              <input type="number" value={eleves} min={1} onChange={(e) => setEleves(Number(e.target.value))} />
            </label>
            <label>
              Accompagnateurs
              <input type="number" value={accomp} min={0} onChange={(e) => setAccomp(Number(e.target.value))} />
            </label>
            <label>
              Budget visites/activités (€/jour/pers)
              <input type="number" value={visites} min={0} onChange={(e) => setVisites(Number(e.target.value))} />
            </label>
            <label>
              Marge — hébergement/repas/visites (%)
              <input type="number" value={marge} min={0} onChange={(e) => setMarge(Number(e.target.value))} />
            </label>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }} className="de-check-row" >
            <input type="checkbox" checked={sousTraite} onChange={(e) => setSousTraite(e.target.checked)} style={{ width: "auto" }} />
            <span>Sous-traiter le transport (autocariste tiers)</span>
          </label>
          <div className="admin-form-grid two" style={{ marginTop: 8 }}>
            <label>
              Marge transport {sousTraite ? "(sous-traité)" : "(flotte propre)"} (%)
              <input type="number" value={margeTransport} min={0} onChange={(e) => setMargeTransport(Number(e.target.value))} />
            </label>
          </div>
          <p className="de-hint">
            Par défaut, transport assuré par la flotte Festimove : coût réel estimé à ~70% du tarif
            marché, ratio calibré sur un car de 43 places (le plus petit de la flotte).
          </p>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontSize: 12, color: "#6b7268", textTransform: "uppercase" }}>
              Ajuster les ratios de base (€/jour/pers) ▾
            </summary>
            <div className="admin-form-grid two" style={{ marginTop: 10 }}>
              <label>
                Transport
                <input type="number" value={ratios.t} onChange={(e) => setRatios({ ...ratios, t: Number(e.target.value) })} />
              </label>
              <label>
                Hébergement (€/nuit)
                <input type="number" value={ratios.h} onChange={(e) => setRatios({ ...ratios, h: Number(e.target.value) })} />
              </label>
              <label>
                Pension complète (€/jour)
                <input type="number" value={ratios.r} onChange={(e) => setRatios({ ...ratios, r: Number(e.target.value) })} />
              </label>
              <label>
                Assistance / gestion (€/jour)
                <input type="number" value={ratios.a} onChange={(e) => setRatios({ ...ratios, a: Number(e.target.value) })} />
              </label>
            </div>
          </details>
        </div>

        {/* Options tarifaires */}
        <div className="admin-panel de-panel options">
          <div className="de-panel-head">
            <div className="de-panel-icon">💶</div>
            <div>
              <span className="de-eyebrow">Étape 3</span>
              <h2>Options tarifaires (hors forfait)</h2>
            </div>
          </div>
          <label className="de-check-row">
            <input type="checkbox" checked={assuranceCheck} onChange={(e) => setAssuranceCheck(e.target.checked)} style={{ width: "auto" }} />
            <span>Ajouter l&apos;assurance annulation au devis</span>
          </label>
          <div className="admin-form-grid two" style={{ marginTop: 8 }}>
            <label>
              Taux (% du forfait)
              <input type="number" step={0.1} value={assurancePct} onChange={(e) => setAssurancePct(Number(e.target.value))} />
            </label>
            <label>
              Minimum par personne (€)
              <input type="number" value={assuranceMin} onChange={(e) => setAssuranceMin(Number(e.target.value))} />
            </label>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }} className="de-check-row">
            <input type="checkbox" checked={taxeSejourCheck} onChange={(e) => setTaxeSejourCheck(e.target.checked)} style={{ width: "auto" }} />
            <span>Ajouter la taxe de séjour au devis</span>
          </label>
          <label>
            Montant par nuit et par personne (€)
            <input type="number" step={0.1} value={taxeSejourMontant} onChange={(e) => setTaxeSejourMontant(Number(e.target.value))} />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }} className="de-check-row">
            <input type="checkbox" checked={cautionCheck} onChange={(e) => setCautionCheck(e.target.checked)} style={{ width: "auto" }} />
            <span>Mentionner la caution hôtel (à régler sur place, non incluse au prix)</span>
          </label>
          <label>
            Montant par personne (€)
            <input type="number" value={cautionMontant} onChange={(e) => setCautionMontant(Number(e.target.value))} />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }} className="de-check-row">
            <input type="checkbox" checked={chambreIndivCheck} onChange={(e) => setChambreIndivCheck(e.target.checked)} style={{ width: "auto" }} />
            <span>Proposer la chambre individuelle pour les accompagnateurs</span>
          </label>
          <label>
            Supplément par nuit et par accompagnateur (€)
            <input type="number" value={chambreIndivMontant} onChange={(e) => setChambreIndivMontant(Number(e.target.value))} />
          </label>
        </div>

        {/* Programme + OCR */}
        <div className="admin-panel de-panel programme">
          <div className="de-panel-head">
            <div className="de-panel-icon">📋</div>
            <div>
              <span className="de-eyebrow">Optionnel</span>
              <h2>Programme du séjour</h2>
            </div>
          </div>

          <label>
            Importer depuis un séjour existant du site (recommandé — donnée officielle, pas d&apos;OCR)
            <select
              value={selectedSejourId}
              onChange={(e) => handleImportFromSejour(e.target.value)}
              disabled={loadingCatalogue}
            >
              <option value="">
                {loadingCatalogue ? "Chargement des séjours..." : "— Choisir un séjour —"}
              </option>
              {sejoursByCountry.map(([country, sejoursOfCountry]) => (
                <optgroup key={country} label={country}>
                  {sejoursOfCountry.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {s.destination} ({s.duration}){s.hidden ? " [masqué]" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {sejourImportMsg && <p className="de-estimate-msg">{sejourImportMsg}</p>}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
            <label>
              Ou colle le programme jour par jour à la main (JOUR 1, JOUR 2...)
              <textarea rows={8} value={programme} onChange={(e) => setProgramme(e.target.value)} placeholder={"JOUR 1 : Départ...\nJOUR 2 : Visite du site archéologique..."} />
            </label>
          </div>
          <div className="admin-form-grid two" style={{ marginTop: 8 }}>
            <label>
              Prix moyen estimé par visite détectée (€)
              <input type="number" value={prixParVisite} onChange={(e) => setPrixParVisite(Number(e.target.value))} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="button" onClick={estimateVisites} className="de-btn de-btn-outline">
                Estimer le budget visites
              </button>
            </div>
          </div>
          {estimateMsg && (
            <p className="de-estimate-msg">
              {estimateMsg}{" "}
              <button type="button" onClick={applyEstimate} className="de-btn de-btn-outline" style={{ marginLeft: 6 }}>
                Appliquer au champ visites
              </button>
            </p>
          )}

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed #d8d3c4" }}>
            <label>
              Ou importer une fiche séjour (photo / capture d&apos;écran)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFicheUpload(file);
                }}
              />
            </label>
            {ocrStatus && <p className="de-ocr-status">{ocrStatus}</p>}
            {ocrRawText && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer", fontSize: 11, color: "var(--muted)" }}>
                  Voir le texte brut détecté par l&apos;OCR (debug)
                </summary>
                <textarea
                  readOnly
                  value={ocrRawText}
                  rows={12}
                  style={{ width: "100%", marginTop: 8, fontSize: 11, fontFamily: "monospace" }}
                />
              </details>
            )}
          </div>
        </div>

        {/* Résultat */}
        <div className="de-result">
          <div className="de-result-eyebrow">Prix ferme</div>
          <div className="de-result-price">
            {result.prixFerme.toFixed(0)} € <small>/ personne</small>
          </div>
          <div className="de-result-grid">
            <div className="row"><span>Transport {sousTraite ? "(sous-traité)" : "(flotte Festimove)"}, marge {result.transportMargePct}%</span><span>{result.transportWithMarge.toFixed(2)} €</span></div>
            <div className="row"><span>Hébergement ({nuits} nuits), marge {marge}%</span><span>{(result.hebergTotal * (1 + marge / 100)).toFixed(2)} €</span></div>
            <div className="row"><span>Pension complète ({jours} jours), marge {marge}%</span><span>{(result.repasTotal * (1 + marge / 100)).toFixed(2)} €</span></div>
            <div className="row"><span>Visites / activités, marge {marge}%</span><span>{(result.visitesTotal * (1 + marge / 100)).toFixed(2)} €</span></div>
            <div className="row"><span>Assistance / gestion, marge {marge}%</span><span>{(result.assistTotal * (1 + marge / 100)).toFixed(2)} €</span></div>
            {assuranceCheck && <div className="row"><span>+ Assurance annulation</span><span>{result.assuranceMontant.toFixed(2)} €</span></div>}
            {taxeSejourCheck && <div className="row"><span>+ Taxe de séjour</span><span>{result.taxeSejourTotal.toFixed(2)} €</span></div>}
            {cautionCheck && <div className="row italic"><span>Caution hôtel (non incluse)</span><span>{cautionMontant.toFixed(2)} €</span></div>}
            {chambreIndivCheck && (er 
              <div className="row italic"><span>+ Chambre individuelle accompagnateurs (option)</span><span>{result.chambreIndivTotalGroupe.toFixed(2)} € groupe</span></div>
            )}
          </div>
          <div className="de-result-footer">
            Groupe de {result.pax} personnes ({eleves} élèves + {accomp} accompagnateurs) → coût total
            groupe : {(result.prixFerme * result.pax).toFixed(0)} €.
          </div>
        </div>

        <p className="de-disclaimer">
          Ce prix est calculé à partir de ratios moyens et de vos marges. Il constitue une base de
          devis ferme, sous réserve de disponibilités au moment de la réservation.
        </p>

        <div className="de-actions">
          <button type="button" onClick={handleSaveDevis} className="de-btn de-btn-outline" style={{ background: "#123c3f", color: "#fff", border: "none" }}>
            {loadedId ? "Mettre à jour le devis" : "Enregistrer le devis"}
          </button>
          <button type="button" onClick={handleCopyEmail} className="de-btn de-btn-primary">
            Copier le texte pour l&apos;email client
          </button>
          <button type="button" onClick={handleDownload} className="de-btn de-btn-accent">
            Télécharger le devis (PDF)
          </button>
          {(copyState || saveStatus) && <span className="de-copystate">{copyState || saveStatus}</span>}
        </div>
      </section>
    </main>
  );
}
