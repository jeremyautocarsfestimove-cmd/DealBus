#!/usr/bin/env bash
# Contrôle + mise en ligne. Depuis la racine du repo :
#   bash check.sh                      → vérifie seulement (tsc + build)
#   bash check.sh "message de commit"  → vérifie, puis commit + push + vercel --prod
set -e

[ -f package.json ] || { echo "❌ Lance ce script depuis la racine du repo"; exit 1; }

if [ ! -f .env.local ]; then
  echo "── .env.local absent : récupération des variables depuis Vercel"
  npx vercel env pull .env.local --environment=production
fi

echo "── Typage (tsc)"
npx tsc --noEmit

echo "── Build (next build)"
npm run build > /tmp/check-build.log 2>&1 || { tail -40 /tmp/check-build.log; echo "❌ build en échec"; exit 1; }
echo "✅ Build OK"

[ -z "$1" ] && { echo "Tout est bon. Relance avec un message de commit pour mettre en ligne."; exit 0; }

echo "── Commit + push + déploiement"
git add -A
git commit -m "$1"
git push
npx vercel --prod
echo "🚀 En ligne"
