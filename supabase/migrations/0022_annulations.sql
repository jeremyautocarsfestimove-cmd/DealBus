-- ============================================================
-- 0022 — Annulations soumises à validation DealBus
-- Une annulation (client ou transporteur) est d'abord une DEMANDE motivée ;
-- la mission reste « à venir » tant que l'administration n'a pas statué.
-- ============================================================

alter table missions
  add column if not exists annulation_demandee_par uuid references profiles(id),
  add column if not exists annulation_demandee_role text check (annulation_demandee_role in ('client','transporteur')),
  add column if not exists annulation_demandee_at timestamptz,
  add column if not exists annulation_decision text check (annulation_decision in ('validee','refusee')),
  add column if not exists annulation_decidee_at timestamptz;

-- Demande (avant mission) : le client peut demander l'annulation dès qu'une offre est reçue
alter table demandes
  add column if not exists annulation_motif text,
  add column if not exists annulation_demandee_at timestamptz,
  add column if not exists annulation_decision text check (annulation_decision in ('validee','refusee')),
  add column if not exists annulation_decidee_at timestamptz;

comment on column missions.annulation_demandee_at is 'Demande d''annulation en attente tant que annulation_decision est null';
comment on column demandes.annulation_demandee_at is 'Demande d''annulation (offres reçues) en attente de validation DealBus';
