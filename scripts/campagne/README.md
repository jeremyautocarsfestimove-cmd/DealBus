Campagne email transporteurs
Préparation (une fois)
Exporter le fichier Excel des autocaristes en CSV (colonnes : email obligatoire ; société et département recommandés)
Le placer ici : `scripts/campagne/contacts.csv`
Dans le terminal : `export RESEND_API_KEY=re_…` (la clé du dashboard Resend)
Chaque jour de campagne
```bash
# 1. Répétition générale (rien ne part, tout s'affiche)
node scripts/campagne/campagne.mjs --fichier scripts/campagne/contacts.csv --test

# 2. Envoi réel (40 par défaut)
node scripts/campagne/campagne.mjs --fichier scripts/campagne/contacts.csv

# Variante : cadence différente
node scripts/campagne/campagne.mjs --fichier scripts/campagne/contacts.csv --limite 30
```
Le journal `envoyes.json` garantit qu'aucune adresse n'est contactée deux fois :
relancer la commande chaque jour envoie automatiquement aux 40 suivants.
Désinscriptions
Quand quelqu'un répond « STOP » : ajouter son adresse (une par ligne) dans
`scripts/campagne/stop.txt` — elle ne sera plus jamais contactée.
Cadence recommandée
Jours 1-3 : 30/jour · ensuite : 40-50/jour maximum.
Surveiller les réponses sur contact@dealbus.fr et le dashboard Resend (taux de bounce < 5 %).