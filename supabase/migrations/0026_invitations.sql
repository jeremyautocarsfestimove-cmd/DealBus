-- 0026 — Invitations : un transporteur relancé par DealBus sur une demande hors
-- de ses zones doit pouvoir la voir et y répondre.
create table if not exists demande_invitations (
  demande_id uuid not null references demandes(id) on delete cascade,
  transporteur_id uuid not null references transporteurs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (demande_id, transporteur_id)
);

alter table demande_invitations enable row level security;

drop policy if exists "transporteur own invitations" on demande_invitations;
create policy "transporteur own invitations" on demande_invitations
  for select using (auth.uid() = transporteur_id);

-- Lecture des demandes ouvertes sur invitation (en plus de la règle par zone)
drop policy if exists "transporteurs read demandes invitation" on demandes;
create policy "transporteurs read demandes invitation" on demandes for select using (
  statut = 'ouverte' and exists (
    select 1 from demande_invitations i
    join transporteurs t on t.id = i.transporteur_id
    where i.transporteur_id = auth.uid()
      and i.demande_id = demandes.id
      and t.statut = 'valide'
  )
);
