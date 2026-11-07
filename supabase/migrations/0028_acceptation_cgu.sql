-- Traçabilité contractuelle :
-- 1) acceptation des CGU par les transporteurs (version, date, IP), avec historique ;
-- 2) engagement de commission enregistré avec chaque offre.

alter table transporteurs
  add column if not exists cgu_version text,
  add column if not exists cgu_acceptees_le timestamptz;

create table if not exists cgu_acceptations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  version text not null,
  contexte text not null check (contexte in ('inscription','reconsentement')),
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists cgu_acceptations_user_idx on cgu_acceptations (user_id, created_at desc);
alter table cgu_acceptations enable row level security;
create policy "own cgu acceptations" on cgu_acceptations for select using (auth.uid() = user_id);
create policy "admin read cgu acceptations" on cgu_acceptations for select using (is_admin());

alter table offres
  add column if not exists engagement_texte text,
  add column if not exists engagement_cgu_version text,
  add column if not exists engagement_taux numeric(4,2),
  add column if not exists engagement_commission numeric(10,2);

comment on column offres.engagement_texte is 'Texte d''engagement de commission affiché et accepté par le transporteur au moment de l''envoi';
