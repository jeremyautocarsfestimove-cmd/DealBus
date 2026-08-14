-- ============================================================
-- DealBus — Schéma initial
-- MVP : devis (tir unique) + enchère (relance libre, palier 1%)
--       + retours à vide (prix fixe, validation manuelle)
-- Anonymat symétrique jusqu'à sélection.
-- ============================================================

-- ---------- ENUMS ----------
create type user_role as enum ('client', 'transporteur', 'admin');
create type transporteur_statut as enum ('en_attente', 'valide', 'suspendu');
create type demande_mode as enum ('devis', 'enchere');
create type demande_statut as enum ('ouverte', 'selection', 'confirmee', 'annulee', 'expiree');
create type offre_statut as enum ('envoyee', 'consultee', 'retenue', 'non_retenue');
create type retour_statut as enum ('publie', 'demande_recue', 'confirme', 'expire', 'annule');
create type mission_statut as enum ('a_venir', 'terminee_declaree', 'litige');

-- ---------- PROFILES ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  nom text,
  telephone text,
  created_at timestamptz not null default now()
);

-- ---------- TRANSPORTEURS ----------
create table transporteurs (
  id uuid primary key references profiles(id) on delete cascade,
  raison_sociale text not null,
  siren text not null,
  licence_transport text not null,          -- n° licence communautaire
  rc_pro_url text,                          -- justificatif uploadé (bucket)
  statut transporteur_statut not null default 'en_attente',
  departement_siege text not null,          -- ex. '76'
  note_moyenne numeric(2,1) default null,
  nb_avis int not null default 0,
  nb_missions int not null default 0,
  numero_anonyme int generated always as identity, -- "Transporteur #1222"
  valide_at timestamptz,
  created_at timestamptz not null default now()
);

-- Zones de chalandise choisies par le transporteur (codes département)
create table transporteur_zones (
  transporteur_id uuid not null references transporteurs(id) on delete cascade,
  departement text not null,
  primary key (transporteur_id, departement)
);

-- ---------- DEMANDES ----------
create table demandes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  numero int generated always as identity,        -- "Demande #4127"
  mode demande_mode not null,
  statut demande_statut not null default 'ouverte',
  type_trajet text not null check (type_trajet in ('aller_retour','aller_simple','circuit')),
  depart_adresse text not null,
  depart_departement text not null,               -- pour le matching zones
  arrivee_adresse text not null,
  date_aller date not null,
  heure_aller time,
  date_retour date,
  heure_retour time,
  passagers int not null check (passagers > 0),
  vehicule_utilise_sur_place boolean not null default false,
  precisions text,                                -- sans coordonnées personnelles
  motif text,
  bagages text,
  prix_estime numeric(10,2),
  -- Enchère uniquement :
  enchere_fin timestamptz,                        -- clôture (pas d'arrêt anticipé)
  enchere_prix_depart numeric(10,2),
  created_at timestamptz not null default now()
);

-- ---------- OFFRES (mode devis : tir unique) ----------
create table offres (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references demandes(id) on delete cascade,
  transporteur_id uuid not null references transporteurs(id),
  statut offre_statut not null default 'envoyee',
  prix_ttc numeric(10,2) not null,
  vehicule_type text not null,
  vehicule_places int not null,
  vehicule_annee int,
  conditions text,
  created_at timestamptz not null default now(),
  unique (demande_id, transporteur_id)            -- TIR UNIQUE garanti en base
);

-- ---------- ENCHÈRES (relances, palier -1%) ----------
create table bids (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references demandes(id) on delete cascade,
  transporteur_id uuid not null references transporteurs(id),
  prix_ttc numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index bids_demande_prix on bids (demande_id, prix_ttc asc);

-- Palier de 1% + fenêtre ouverte, vérifiés côté base
create or replace function check_bid() returns trigger as $$
declare
  best numeric(10,2);
  fin timestamptz;
begin
  select enchere_fin into fin from demandes where id = new.demande_id;
  if fin is null or now() > fin then
    raise exception 'Enchère clôturée';
  end if;
  select min(prix_ttc) into best from bids where demande_id = new.demande_id;
  if best is not null and new.prix_ttc > best * 0.99 then
    raise exception 'Palier non respecté : maximum autorisé %', floor(best * 0.99);
  end if;
  return new;
end;
$$ language plpgsql;
create trigger trg_check_bid before insert on bids
  for each row execute function check_bid();

-- ---------- SÉLECTION / MISSION ----------
create table missions (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null unique references demandes(id),
  transporteur_id uuid not null references transporteurs(id),
  prix_final numeric(10,2) not null,
  source text not null check (source in ('devis','enchere','retour_vide')),
  statut mission_statut not null default 'a_venir',
  commission_taux numeric(4,2) not null,          -- calculée à la sélection
  commission_montant numeric(10,2) not null,
  identites_revelees_at timestamptz not null default now(),
  terminee_declaree_at timestamptz,
  created_at timestamptz not null default now()
);

-- Barème DealBus : 9% ≤ 2000€, 7% 2001-5000€, 5% > 5000€.
-- Taux réduit enchère (-1pt) et retour à vide (-2pts). Plancher 3%.
create or replace function commission_taux(prix numeric, source text)
returns numeric as $$
declare t numeric;
begin
  t := case when prix <= 2000 then 9 when prix <= 5000 then 7 else 5 end;
  if source = 'enchere' then t := t - 1; end if;
  if source = 'retour_vide' then t := t - 2; end if;
  return greatest(t, 3);
end;
$$ language plpgsql immutable;

-- ---------- RETOURS À VIDE ----------
create table retours_vide (
  id uuid primary key default gen_random_uuid(),
  transporteur_id uuid not null references transporteurs(id),
  statut retour_statut not null default 'publie',
  depart_adresse text not null,
  depart_departement text not null,
  arrivee_adresse text not null,
  arrivee_departement text not null,
  date_dispo date not null,
  heure_apres time,                                -- "départ après 15h"
  places int not null,
  prix_fixe numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table reservations_retour (
  id uuid primary key default gen_random_uuid(),
  retour_id uuid not null references retours_vide(id) on delete cascade,
  client_id uuid not null references profiles(id),
  statut text not null default 'en_attente'
    check (statut in ('en_attente','validee','refusee')), -- VALIDATION MANUELLE
  message text,
  created_at timestamptz not null default now(),
  unique (retour_id, client_id)
);

-- ---------- AVIS (après mission déclarée terminée uniquement) ----------
create table avis (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null unique references missions(id),
  client_id uuid not null references profiles(id),
  transporteur_id uuid not null references transporteurs(id),
  note int not null check (note between 1 and 5),
  commentaire text,
  created_at timestamptz not null default now()
);

-- Mise à jour de la note moyenne du transporteur
create or replace function refresh_note() returns trigger as $$
begin
  update transporteurs t set
    note_moyenne = (select round(avg(note)::numeric, 1) from avis where transporteur_id = new.transporteur_id),
    nb_avis = (select count(*) from avis where transporteur_id = new.transporteur_id)
  where t.id = new.transporteur_id;
  return new;
end;
$$ language plpgsql;
create trigger trg_refresh_note after insert on avis
  for each row execute function refresh_note();

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table transporteurs enable row level security;
alter table transporteur_zones enable row level security;
alter table demandes enable row level security;
alter table offres enable row level security;
alter table bids enable row level security;
alter table missions enable row level security;
alter table retours_vide enable row level security;
alter table reservations_retour enable row level security;
alter table avis enable row level security;

-- Profiles : chacun voit/édite le sien
create policy "own profile" on profiles for all using (auth.uid() = id);

-- Transporteurs : le sien en écriture ; lecture publique du profil ANONYME
-- (les champs identifiants sont filtrés côté vue, jamais exposés directement)
create policy "own transporteur" on transporteurs for all using (auth.uid() = id);
create policy "read transporteurs valides" on transporteurs for select using (statut = 'valide');
create policy "own zones" on transporteur_zones for all using (auth.uid() = transporteur_id);

-- Demandes : le client voit les siennes ; les transporteurs VALIDÉS voient
-- les demandes ouvertes de leurs zones (sans identité client — cf. vue)
create policy "client own demandes" on demandes for all using (auth.uid() = client_id);
create policy "transporteurs read demandes zone" on demandes for select using (
  statut = 'ouverte' and exists (
    select 1 from transporteur_zones z
    join transporteurs t on t.id = z.transporteur_id
    where z.transporteur_id = auth.uid()
      and t.statut = 'valide'
      and z.departement = demandes.depart_departement
  )
);

-- Offres : le transporteur gère les siennes ; le client lit celles de SES demandes
create policy "transporteur own offres" on offres for all using (auth.uid() = transporteur_id);
create policy "client read offres" on offres for select using (
  exists (select 1 from demandes d where d.id = offres.demande_id and d.client_id = auth.uid())
);

-- Bids : le transporteur insère les siens ; lecture du meilleur prix pour
-- participants + client (anonyme : ne jamais exposer transporteur_id côté client)
create policy "transporteur own bids" on bids for insert with check (auth.uid() = transporteur_id);
create policy "read bids participants" on bids for select using (
  auth.uid() = transporteur_id
  or exists (select 1 from demandes d where d.id = bids.demande_id and d.client_id = auth.uid())
  or exists (select 1 from bids b2 where b2.demande_id = bids.demande_id and b2.transporteur_id = auth.uid())
);

-- Missions : visibles par les deux parties
create policy "mission parties" on missions for select using (
  auth.uid() = transporteur_id
  or exists (select 1 from demandes d where d.id = missions.demande_id and d.client_id = auth.uid())
);

-- Retours à vide : publics en lecture, gérés par leur transporteur
create policy "read retours" on retours_vide for select using (statut in ('publie','demande_recue'));
create policy "own retours" on retours_vide for all using (auth.uid() = transporteur_id);

-- Réservations retour : client la sienne ; transporteur celles de ses retours
create policy "client own resa" on reservations_retour for all using (auth.uid() = client_id);
create policy "transporteur read resa" on reservations_retour for select using (
  exists (select 1 from retours_vide r where r.id = reservations_retour.retour_id and r.transporteur_id = auth.uid())
);
create policy "transporteur update resa" on reservations_retour for update using (
  exists (select 1 from retours_vide r where r.id = reservations_retour.retour_id and r.transporteur_id = auth.uid())
);

-- Avis : client de la mission uniquement, mission terminée déclarée
create policy "read avis" on avis for select using (true);
create policy "client insert avis" on avis for insert with check (
  auth.uid() = client_id and exists (
    select 1 from missions m where m.id = avis.mission_id
      and m.statut = 'terminee_declaree'
      and exists (select 1 from demandes d where d.id = m.demande_id and d.client_id = auth.uid())
  )
);

-- ---------- VUE PUBLIQUE ANONYME DU TRANSPORTEUR ----------
-- À utiliser côté client pour afficher note/avis/missions sans identité
create view transporteurs_anonymes as
  select id, numero_anonyme, departement_siege, note_moyenne, nb_avis, nb_missions
  from transporteurs where statut = 'valide';
