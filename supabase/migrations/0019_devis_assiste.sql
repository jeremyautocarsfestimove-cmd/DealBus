-- ============================================================
-- 0019 — Devis assisté : dépôt et tarifs du transporteur, offre enrichie
-- ============================================================

alter table transporteurs
  add column if not exists depot_adresse text,
  add column if not exists cout_km numeric(6,2),
  add column if not exists cout_heure numeric(6,2),
  add column if not exists cout_nuit numeric(7,2),
  add column if not exists cout_immobilisation numeric(7,2),
  add column if not exists marge_pct numeric(4,1);

comment on column transporteurs.depot_adresse is 'Adresse du dépôt, pour le calcul du haut-le-pied sur chaque lead';
comment on column transporteurs.cout_km is '€ HT par km (calculateur de devis) ; null = barème DealBus';
comment on column transporteurs.cout_heure is '€ HT par heure d''amplitude conducteur ; null = barème DealBus';
comment on column transporteurs.cout_nuit is '€ HT par nuit (hôtel + repas) ; null = barème DealBus';
comment on column transporteurs.cout_immobilisation is '€ HT par journée d''immobilisation sur place ; null = barème DealBus';
comment on column transporteurs.marge_pct is 'Marge cible en % ; null = barème DealBus';

alter table offres
  add column if not exists inclus text[] not null default '{}',
  add column if not exists validite_jours int;

comment on column offres.inclus is 'hebergement, repas, peages, parkings, toilettes, wifi, usb, pmr';
comment on column offres.validite_jours is 'Durée de validité annoncée par le transporteur (7, 14, 30)';
