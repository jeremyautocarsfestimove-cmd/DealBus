import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { BackButton } from "@/components/BackButton";
import { ChangerMotDePasse } from "@/components/ChangerMotDePasse";
import { createClient } from "@/lib/supabase/server";

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/compte");

  const { data: profil } = await supabase
    .from("profiles").select("nom, role, email").eq("id", user.id).maybeSingle();

  const role = profil?.role ?? "client";
  const espaceHref =
    role === "transporteur" ? "/pro"
    : role === "admin" ? "/admin"
    : "/mes-demandes";
  const espaceLabel =
    role === "transporteur" ? "Espace transporteur"
    : role === "admin" ? "Back-office"
    : "Mes demandes";

  // L'email de connexion fait foi : profiles.email peut avoir été modifié
  // sans que le changement d'email auth ait encore été confirmé.
  const emailConnexion = user.email!;

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Mon compte</p>
        <h1 className="h-display text-4xl mb-3">Sécurité.</h1>
        <p className="text-blanc-dim mb-10">
          Connecté en tant que{" "}
          <span className="font-mono text-blanc">{emailConnexion}</span>
          {profil?.nom ? ` · ${profil.nom}` : ""}.
        </p>

        <ChangerMotDePasse email={emailConnexion} />

        <div className="flex items-center gap-3 mt-8">
          <BackButton href={espaceHref} />
          <Link
            href={espaceHref}
            className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint hover:text-blanc-dim transition"
          >
            {espaceLabel} →
          </Link>
        </div>
      </main>
    </>
  );
}