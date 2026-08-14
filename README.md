# DealBus

Marketplace de transport en autocar : devis (tir unique), enchère en direct (palier −1%, fenêtre fixe), retours à vide (prix fixe, validation manuelle). Anonymat symétrique client/transporteur jusqu'à la sélection.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (auth, DB, realtime, RLS) · Resend · Vercel.

## Mise en route

### 1. GitHub

```bash
cd dealbus
git init && git add -A && git commit -m "init DealBus"
gh repo create dealbus --private --source=. --push
```

### 2. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (région `eu-west-3` Paris).
2. SQL Editor → coller et exécuter `supabase/migrations/0001_init.sql`.
3. Authentication → Providers → activer **Email** (magic link).
4. Authentication → URL Configuration → Site URL = URL Vercel de prod, ajouter `http://localhost:3000` aux Redirect URLs.
5. Récupérer Project URL + anon key (Settings → API).

### 3. Variables d'environnement

```bash
cp .env.local.example .env.local
# remplir NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# RESEND_API_KEY, NEXT_PUBLIC_SITE_URL
```

⚠️ Ne jamais commiter `SUPABASE_SERVICE_ROLE_KEY` (leçon apprise sur le projet Comité des Fêtes).

### 4. Resend (emails transactionnels)

1. Créer une clé API sur [resend.com](https://resend.com), vérifier le domaine d'envoi.
2. Optionnel : brancher Resend comme SMTP custom dans Supabase (Auth → SMTP) pour les magic links, comme sur WayPilot.

### 5. Dev local

```bash
npm install
npm run dev
```

### 6. Déploiement Vercel

```bash
vercel login          # compte dédié DealBus (éviter le conflit multi-comptes connu)
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add RESEND_API_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel --prod         # pas d'auto-deploy sur git push, comme d'habitude
```

## Structure

```
app/
  page.tsx                     Landing + tableau demandes en direct
  demande/page.tsx             Wizard 4 étapes (trajet → estimation → détails → mode)
  mes-demandes/page.tsx        Tableau de bord client
  mes-demandes/[id]/page.tsx   Comparaison devis OU vue enchère
  retours/page.tsx             Liste publique retours à vide + demande de place
  pro/page.tsx                 Espace transporteur (leads par zone)
  pro/leads/[id]/page.tsx      Répondre : devis tir unique / enchère realtime
  login/page.tsx               Magic link Supabase
lib/supabase/                  Clients browser + server (@supabase/ssr)
supabase/migrations/0001_init.sql   Schéma complet + RLS + triggers
middleware.ts                  Protection routes + refresh session
```

## Règles métier encodées en base

- **Tir unique devis** : contrainte `unique(demande_id, transporteur_id)` sur `offres`.
- **Palier enchère −1% + fenêtre** : trigger `check_bid` (rejette hors palier ou après `enchere_fin`).
- **Commission** : fonction `commission_taux` — 9/7/5 % selon tranche, −1 pt enchère, −2 pts retour à vide, plancher 3 %.
- **Avis** : insertion possible uniquement si mission `terminee_declaree` (policy RLS).
- **Anonymat** : vue `transporteurs_anonymes` (numéro, dépt, note, avis, missions) — ne jamais joindre `transporteurs` directement côté client.

## TODO prioritaires (marqués dans le code)

- [ ] Server action « Retenir cette offre » → création `missions`, calcul commission, révélation identités
- [ ] Clôture d'enchère (cron/Edge Function à `enchere_fin`) + validation client de la meilleure offre
- [ ] Formulaire d'inscription transporteur (upload RC Pro → bucket) + back-office de validation manuelle
- [ ] Matching automatique retours à vide ↔ demandes (notification Resend)
- [ ] Emails transactionnels Resend (nouvelle offre, enchère clôturée, réservation validée)
- [ ] Realtime sur le tableau de bord client (nouvelles offres, meilleure enchère)
- [ ] Estimation de prix affinée (distance réelle)
