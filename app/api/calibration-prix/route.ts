import { NextResponse } from "next/server";
import { pointsMarche } from "@/lib/calibration-serveur";
import { fourchetteDepuisDevis } from "@/lib/calibration-prix";

// GET ?km=634&type=aller_retour → { min, max, source: "devis", n } ou null si pas assez de devis comparables.
// Aucun devis individuel n'est exposé.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const km = Number(url.searchParams.get("km"));
  const type = url.searchParams.get("type") ?? "aller_retour";
  if (!km || km <= 0) return NextResponse.json(null);
  try {
    const f = fourchetteDepuisDevis(await pointsMarche(), km, type);
    return NextResponse.json(f, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json(null);
  }
}
