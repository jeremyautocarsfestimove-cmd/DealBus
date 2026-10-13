-- ============================================================
-- 0020 — Messagerie demande ↔ transporteur
-- Une conversation = (demande, transporteur). Écriture uniquement via
-- /api/messages (service role) : contrôle des contacts et des prix.
-- ============================================================

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references demandes(id) on delete cascade,
  transporteur_id uuid not null references transporteurs(id) on delete cascade,
  auteur_id uuid not null references profiles(id),
  auteur_role text not null check (auteur_role in ('client','transporteur')),
  contenu text not null check (char_length(contenu) between 1 and 2000),
  lu_le timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_conv_idx on messages (demande_id, transporteur_id, created_at);

alter table messages enable row level security;

-- Lecture : le client de la demande et le transporteur de la conversation
create policy "messages parties" on messages for select using (
  auth.uid() = transporteur_id
  or exists (select 1 from demandes d where d.id = messages.demande_id and d.client_id = auth.uid())
);

-- Admin : lecture complète (modération, litiges)
create policy "messages admin" on messages for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Temps réel
alter publication supabase_realtime add table messages;
