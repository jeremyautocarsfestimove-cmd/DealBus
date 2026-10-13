-- 0023 — Relance du client par DealBus quand des offres attendent sa décision
alter table demandes
  add column if not exists relancee_le timestamptz,
  add column if not exists nb_relances int not null default 0;
