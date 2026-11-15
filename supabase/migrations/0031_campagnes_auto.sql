-- ============================================================
-- 0031 — Envoi automatique des campagnes, du lundi au vendredi
-- Une ligne par liste : activée ou non, et combien d'e-mails par jour.
-- ============================================================

create table if not exists campagnes_auto (
  liste text primary key check (liste in ('clients', 'transporteurs')),
  actif boolean not null default false,
  par_jour int not null default 30 check (par_jour between 1 and 200),
  dernier_envoi timestamptz,
  dernier_resultat text,
  updated_at timestamptz not null default now()
);

alter table campagnes_auto enable row level security;

create policy "admin full campagnes_auto" on campagnes_auto
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

insert into campagnes_auto (liste) values ('clients'), ('transporteurs')
  on conflict (liste) do nothing;
