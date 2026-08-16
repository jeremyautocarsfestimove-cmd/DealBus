import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client service role — SERVEUR UNIQUEMENT (route handlers / server actions).
// Bypasse le RLS et donne accès à auth.admin (emails des utilisateurs).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}