-- ============================================================
-- 0017 — Module de prospection transporteurs (back-office admin)
-- ============================================================

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  societe text,
  departement text,
  statut text not null default 'a_contacter'
    check (statut in ('a_contacter', 'envoye', 'stop', 'erreur', 'inscrit')),
  envoye_le timestamptz,
  erreur text,
  created_at timestamptz not null default now()
);

create index if not exists prospects_statut_idx on prospects (statut);

alter table prospects enable row level security;

-- Lecture/écriture réservées aux admins (les routes serveur passent par la service role)
create policy "admin full prospects" on prospects
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
