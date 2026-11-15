import Link from "next/link";
import { redirect } from "next/navigation";
import { Caveat } from "next/font/google";
import { Nav } from "@/components/Nav";
import { ChangerMotDePasse } from "@/components/ChangerMotDePasse";
import { createClient } from "@/lib/supabase/server";
import "../demande/demande.css";
import "./compte.css";

export const metadata = { title: "Mon compte" };

const caveat = Caveat({ weight: ["600"], subsets: ["latin"], variable: "--font-caveat" });

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
    role === "transporteur" ? "Mon espace transporteur"
    : role === "admin" ? "Administration"
    : "Mes demandes";
  const roleLabel = role === "transporteur" ? "Transporteur" : role === "admin" ? "Administration" : "Client";

  // L'email de connexion fait foi : profiles.email peut avoir été modifié
  // sans que le changement d'email auth ait encore été confirmé.
  const emailConnexion = user.email!;
  const nom: string = profil?.nom?.trim() || emailConnexion.split("@")[0];
  const initiales = nom.split(/[\s.@]+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join("") || "?";
  const depuis = user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : null;

  return (
    <>
      <Nav />
      <div className={`dem cpt ${caveat.variable}`}>
        <main className="cpt-page">
          <p className="eyebrow mb-3">Mon compte</p>
          <h1 className="h-display mb-8">Vos accès. <em>En sécurité.</em></h1>

          <div className="cpt-grille">
            {/* Qui est connecté */}
            <section className="cpt-identite">
              <span className="cpt-avatar">{initiales}</span>
              <h2>{nom}</h2>
              <p className="cpt-mail">{emailConnexion}</p>
              <p className="cpt-pills">
                <span className="cpt-role">{roleLabel}</span>
                {depuis && <span>Inscrit en {depuis}</span>}
              </p>
              <Link href={espaceHref} className="cpt-lien">{espaceLabel}</Link>
              {role === "transporteur" && <Link href="/pro/profil" className="cpt-lien cpt-lien-2">Mon entreprise</Link>}
              {role !== "transporteur" && role !== "admin" && <Link href="/demande" className="cpt-lien cpt-lien-2">Nouvelle demande</Link>}
            </section>

            {/* Mot de passe */}
            <section className="cpt-securite">
              <ChangerMotDePasse email={emailConnexion} />
              <p className="cpt-note">Votre adresse e-mail sert à vous connecter et à recevoir les notifications. Elle n&apos;est jamais transmise sans votre accord.</p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
