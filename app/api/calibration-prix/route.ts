import { NextResponse } from "next/server";
import { calibrationPrix } from "@/lib/calibration-serveur";

// GET → ratios agrégés (P25 / médiane / P75 par segment). Aucune offre individuelle exposée.
export async function GET() {
  try {
    const calib = await calibrationPrix();
    return NextResponse.json(calib, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
