-- 0024 — Relance des transporteurs par DealBus sur une demande sans offre
alter table demandes
  add column if not exists relance_transporteurs_le timestamptz,
  add column if not exists nb_relances_transporteurs int not null default 0;
