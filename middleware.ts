import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cheminLibre, lireMaintenance } from "@/lib/maintenance";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Zones où la session est rafraîchie (comportement historique) et zones
// qui exigent d'être connecté.
const AVEC_SESSION = ["/mes-demandes", "/admin", "/pro", "/demande", "/compte"];
const PROTEGES = ["/mes-demandes", "/admin", "/compte"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── Mode « site en travaux » (piloté depuis /admin/parametres) ─────────────
  const maintenance = await lireMaintenance();
  const estProtege = PROTEGES.some((p) => pathname.startsWith(p));
  const avecSession = AVEC_SESSION.some((p) => pathname.startsWith(p));

  if (pathname === "/maintenance" && !maintenance.actif) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Hors travaux, les pages publiques sont servies sans appel d'authentification.
  if (!maintenance.actif && !avecSession) return response;

  const { data: { user } } = await supabase.auth.getUser();

  if (maintenance.actif && !cheminLibre(pathname)) {
    let admin = false;
    if (user) {
      const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      admin = me?.role === "admin";
    }
    if (!admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      return NextResponse.rewrite(url, { status: 503, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
    }
  }

  if (estProtege && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Toutes les pages (pour le mode travaux), sauf les assets, les fichiers
  // statiques et les routes API (webhooks, cron et actions restent joignables).
  matcher: ["/((?!api/|_next/|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
