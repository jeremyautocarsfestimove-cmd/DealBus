#!/usr/bin/env bash
# Contrôle avant commit. À lancer depuis la racine du repo : bash check.sh
ko=0
ok()  { printf '  \033[32mOK\033[0m   %s\n' "$1"; }
err() { printf '  \033[31mKO\033[0m   %s\n' "$1"; ko=$((ko+1)); }

echo
echo "── Racine du projet"
[ -f package.json ] && ok "package.json présent" || { err "pas à la racine du repo — stop"; exit 1; }

echo
echo "── Fichiers racine de app/ (aucun fichier d'admin ne doit y traîner)"
for f in app/AdminBar.tsx app/actions.tsx app/helpers.ts; do
  [ -f "$f" ] && err "$f ne devrait pas exister" || ok "$f absent"
done

echo
echo "── Layout et home"
grep -q "next/font/google" app/layout.tsx \
  && ok "app/layout.tsx est bien le layout racine (polices)" \
  || err "app/layout.tsx ne charge pas les polices — écrasé ?"
grep -q 'from "next/image"' app/page.tsx && grep -q "Home en bandes" app/page.tsx \
  && ok "app/page.tsx est bien la home en bandes" \
  || err "app/page.tsx n'est pas la home"

echo
echo "── Administration"
n=$(find app/admin -type f | wc -l)
[ "$n" -ge 18 ] && ok "app/admin : $n fichiers" || err "app/admin : $n fichiers (18 minimum attendus)"
for f in layout.tsx AdminBar.tsx helpers.ts page.tsx \
         transporteurs/page.tsx demandes/page.tsx missions/page.tsx \
         litiges/page.tsx avis/page.tsx retours/page.tsx; do
  [ -f "app/admin/$f" ] && ok "app/admin/$f" || err "app/admin/$f manquant"
done
grep -rq "AdminTabs" app components 2>/dev/null \
  && err "AdminTabs encore référencé (doit avoir disparu)" \
  || ok "AdminTabs entièrement retiré"
grep -q "PilotageAction" app/retours/page.tsx 2>/dev/null \
  && err "app/retours/page.tsx contient du code admin" \
  || ok "app/retours/page.tsx est bien la page publique"

echo
echo "── Thème"
grep -q -- "--c-surface" app/globals.css && ok "variables de couleur dans globals.css" || err "globals.css sans variables --c-*"
grep -q "^\.sombre" app/globals.css && ok "classe .sombre définie" || err ".sombre absente de globals.css"
grep -q "rgb(var(" tailwind.config.ts && ok "tailwind pointe sur les variables CSS" || err "tailwind.config.ts non migré"
grep -rq 'text-\[#2A3752\]' app components 2>/dev/null \
  && err "text-[#2A3752] encore en dur — lance le sed" \
  || ok "aucun bleu figé en dur"
grep -rq "motif-route" app components 2>/dev/null \
  && err "motif-route encore référencé" \
  || ok "motif de panneaux supprimé"
grep -q "mt-24" components/Footer.tsx \
  && err "Footer garde son mt-24 (espace avant le footer)" \
  || ok "Footer collé au contenu"
grep -q "currentColor" components/Logo.tsx && ok "Logo en currentColor" || err "Logo encore en couleur figée"
grep -q "sombre sticky" components/Nav.tsx && ok "header en bande sombre" || err "Nav.tsx pas en version sombre"

echo
echo "── SEO"
for f in lib/trajets.ts lib/seo-contenu.ts app/location-autocar/trajet/\[slug\]/page.tsx; do
  [ -f "$f" ] && ok "$f" || err "$f manquant"
done
grep -q "TRAJETS" app/sitemap.ts && ok "sitemap inclut les pages liaison" || err "sitemap.ts non mis à jour"
grep -q "MAJ_CONTENU" app/sitemap.ts && ok "lastmod figé" || err "sitemap.ts utilise encore new Date()"
grep -q "trajets:" lib/departements.ts && ok "départements enrichis" || err "lib/departements.ts sans champ trajets"

echo
echo "── Image du hero"
[ -f public/img/hero.jpg ] && ok "public/img/hero.jpg présent ($(du -h public/img/hero.jpg | cut -f1))" \
  || err "public/img/hero.jpg manquant"

echo
echo "── Compilation"
npx tsc --noEmit > /tmp/check-tsc.log 2>&1 \
  && ok "tsc --noEmit" \
  || { err "tsc échoue :"; sed 's/^/       /' /tmp/check-tsc.log | head -20; }

echo
if [ "$ko" -eq 0 ]; then
  printf '\033[32mTout est en place. Lance npm run build, puis commit.\033[0m\n\n'
else
  printf '\033[31m%s problème(s) à corriger avant de commiter.\033[0m\n\n' "$ko"
fi
exit "$ko"
