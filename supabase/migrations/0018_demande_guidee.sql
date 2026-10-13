-- ============================================================
-- 0018 — Demande guidée : qualification du groupe et complétude
-- ============================================================

alter table demandes
  add column if not exists organisme text
    check (organisme in ('ecole','association','cse','mariage','club','collectivite','autre')),
  add column if not exists equipements text[] not null default '{}',
  add column if not exists heure_arrivee time,
  add column if not exists budget text
    check (budget in ('moins_1000','1000_2000','2000_3000','plus_3000','inconnu')),
  add column if not exists sur_place_repondu boolean not null default false,
  add column if not exists completude int not null default 0
    check (completude between 0 and 100);

comment on column demandes.organisme is 'Type de demandeur (école, association, CSE…)';
comment on column demandes.equipements is 'soute, pmr, ceintures, materiel, toilettes, prise_etablissement';
comment on column demandes.heure_arrivee is 'Heure d''arrivée souhaitée à destination (facultatif)';
comment on column demandes.budget is 'Fourchette de budget déclarée, jamais transmise telle quelle aux transporteurs';
comment on column demandes.sur_place_repondu is 'Le client a répondu à « le car reste-t-il sur place ? »';
comment on column demandes.completude is 'Score de complétude de la demande, 0 à 100';
