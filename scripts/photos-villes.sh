#!/usr/bin/env bash
# Récupère une photo par destination des pages « Idées de voyage » depuis
# Wikipédia / Wikimedia Commons (images sous licence libre), la redimensionne
# en WebP 1200 px et enregistre les crédits (auteur, licence) pour l'affichage.
#
#   bash scripts/photos-villes.sh            → télécharge ce qui manque
#   bash scripts/photos-villes.sh --force    → retélécharge tout
#
# Résultat : public/img/villes/<cle>.webp + public/img/villes/credits.json
# Pour remplacer une photo par la tienne : dépose <cle>.webp dans le dossier, le script
# ne l'écrase pas (sauf --force).
set -euo pipefail

DEST="public/img/villes"
CREDITS="$DEST/credits.json"
FORCE="${1:-}"
UA="DealBus/1.0 (https://dealbus.fr; contact@dealbus.fr)"
mkdir -p "$DEST"

# clé du fichier | titre de l'article Wikipédia (fr) dont on prend l'image principale
LISTE="
strasbourg|Strasbourg
colmar|Colmar
reims|Cathédrale Notre-Dame de Reims
disneyland-paris|Parc Disneyland
parc-asterix|Parc Astérix
puy-du-fou|Puy du Fou
deauville|Deauville
etretat|Étretat
le-touquet|Le Touquet-Paris-Plage
epernay|Épernay
val-de-loire|Val de Loire
beaune|Beaune
chambord|Château de Chambord
chenonceau|Château de Chenonceau
amboise|Château d'Amboise
londres|Londres
bruxelles|Bruxelles
amsterdam|Amsterdam
mont-saint-michel|Mont-Saint-Michel
plages-debarquement|Arromanches-les-Bains
honfleur|Honfleur
"

command -v jq >/dev/null || { echo "jq manquant : sudo apt-get install -y jq"; exit 1; }
node -e "require('sharp')" 2>/dev/null || { echo "sharp manquant : npm i -D sharp"; exit 1; }

urlencode() { jq -rn --arg v "$1" '$v|@uri'; }

[ -f "$CREDITS" ] || echo '{}' > "$CREDITS"

echo "$LISTE" | sed '/^\s*$/d' | while IFS='|' read -r cle titre; do
  out="$DEST/$cle.webp"
  if [ -f "$out" ] && [ "$FORCE" != "--force" ]; then echo "✓ $cle (déjà présent)"; continue; fi

  # 1. image principale de l'article
  resume=$(curl -fsSL -A "$UA" "https://fr.wikipedia.org/api/rest_v1/page/summary/$(urlencode "$titre")" || true)
  src=$(echo "$resume" | jq -r '.originalimage.source // empty')
  if [ -z "$src" ]; then echo "✗ $cle : pas d'image pour « $titre »"; continue; fi
  fichier=$(basename "$src" | sed 's/^[0-9]*px-//')
  fichier=$(printf '%b' "${fichier//%/\\x}")   # décodage URL

  # 2. crédits (auteur, licence) depuis Commons
  meta=$(curl -fsSL -A "$UA" "https://commons.wikimedia.org/w/api.php?action=query&titles=File:$(urlencode "$fichier")&prop=imageinfo&iiprop=extmetadata&format=json" || echo '{}')
  auteur=$(echo "$meta" | jq -r '.query.pages[]?.imageinfo[0]?.extmetadata.Artist.value // "Auteur inconnu"' | sed 's/<[^>]*>//g' | head -c 80)
  licence=$(echo "$meta" | jq -r '.query.pages[]?.imageinfo[0]?.extmetadata.LicenseShortName.value // "Licence libre"')

  # 3. téléchargement + redimensionnement
  tmp=$(mktemp --suffix=.img)
  curl -fsSL -A "$UA" "$src" -o "$tmp"
  node -e "require('sharp')(process.argv[1]).rotate().resize({width:1200,withoutEnlargement:true}).webp({quality:80}).toFile(process.argv[2])" "$tmp" "$out"
  rm -f "$tmp"

  # 4. enregistrement du crédit
  jq --arg k "$cle" --arg a "$auteur" --arg l "$licence" --arg f "$fichier" \
     '.[$k] = {auteur:$a, licence:$l, source:("https://commons.wikimedia.org/wiki/File:"+$f)}' "$CREDITS" > "$CREDITS.tmp" && mv "$CREDITS.tmp" "$CREDITS"
  echo "✓ $cle ← $fichier ($licence, $auteur)"
done

echo
echo "Terminé. Vérifie les photos dans $DEST puis : bash check.sh \"feat(voyages): photos des destinations\""
