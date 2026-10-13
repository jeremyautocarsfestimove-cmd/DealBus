#!/usr/bin/env bash
# Applique une livraison (patch ou zip) puis lance check.sh.
#   bash appliquer.sh etape9.patch "feat(nav): menu déroulant"
#   bash appliquer.sh etape9-fichiers.zip "feat(nav): menu déroulant"
#   bash appliquer.sh etape9.patch              → applique et vérifie, sans commit
set -e

FICHIER="$1"
MESSAGE="$2"

[ -f package.json ] || { echo "❌ Lance ce script depuis la racine du repo"; exit 1; }
[ -n "$FICHIER" ] && [ -f "$FICHIER" ] || { echo "❌ Fichier introuvable : $FICHIER"; exit 1; }

case "$FICHIER" in
  *.patch)
    echo "── Application de $FICHIER"
    if git apply --check "$FICHIER" 2>/dev/null; then
      git apply "$FICHIER"
    else
      echo "   Le patch ne s'applique pas tel quel, tentative fichier par fichier…"
      git apply --reject "$FICHIER" || true
      REJ=$(find . -name "*.rej" -not -path "./node_modules/*")
      if [ -n "$REJ" ]; then
        echo "❌ Conflits sur :"; echo "$REJ"
        echo "   Nettoyage des .rej. Utilise le zip des fichiers complets de cette étape à la place."
        find . -name "*.rej" -not -path "./node_modules/*" -delete
        exit 1
      fi
    fi
    ;;
  *.zip)
    echo "── Extraction de $FICHIER à la racine (les fichiers existants sont écrasés)"
    unzip -o -q "$FICHIER" -d .
    ;;
  *)
    echo "❌ Format inconnu : attendu .patch ou .zip"; exit 1
    ;;
esac

rm -f "$FICHIER"
echo "✅ Fichiers en place"

if [ -n "$MESSAGE" ]; then
  bash check.sh "$MESSAGE"
else
  bash check.sh
fi
