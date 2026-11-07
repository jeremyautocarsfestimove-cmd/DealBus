import { NextResponse } from "next/server";
import { pointsMarche } from "@/lib/calibration-serveur";
import { fourchetteDepuisDevis } from "@/lib/calibration-prix";
import { gabaritPour } from "@/lib/assistant-demande";

// GET ?km=640&type=aller_retour&passagers=52 → { min, max, source: "devis", n } ou null si pas assez de devis de distance proche.
// Aucun devis individuel n'est exposé.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const km = Number(url.searchParams.get("km"));
  const type = url.searchParams.get("type") ?? "aller_retour";
  const cars = gabaritPour(Number(url.searchParams.get("passagers")) || 1)?.nbVehicules ?? 1;
  if (!km || km <= 0) return NextResponse.json(null);
  try {
    const f = fourchetteDepuisDevis(await pointsMarche(), km, type, cars);
    return NextResponse.json(f, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json(null);
  }
}
