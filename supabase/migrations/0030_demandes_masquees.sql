-- Un transporteur peut masquer une demande qui ne l'intéresse pas : elle disparaît de sa liste, pour lui seul.
create table if not exists demandes_masquees (
  transporteur_id uuid not null references transporteurs(id) on delete cascade,
  demande_id uuid not null references demandes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transporteur_id, demande_id)
);
alter table demandes_masquees enable row level security;
create policy "voir mes demandes masquees" on demandes_masquees for select using (auth.uid() = transporteur_id);
create policy "masquer une demande" on demandes_masquees for insert with check (auth.uid() = transporteur_id);
create policy "reafficher mes demandes" on demandes_masquees for delete using (auth.uid() = transporteur_id);
