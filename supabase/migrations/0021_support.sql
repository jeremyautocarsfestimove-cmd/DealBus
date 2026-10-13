-- ============================================================
-- 0021 — Support : conversations utilisateur ↔ DealBus (admin)
-- Alimentées par la bulle « Aide » (après l'assistant automatique)
-- et par l'administration (message à un client ou un transporteur).
-- ============================================================

create table if not exists support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  demande_id uuid references demandes(id) on delete set null,
  sujet text,
  statut text not null default 'ouverte' check (statut in ('ouverte','close')),
  ouverte_par text not null default 'user' check (ouverte_par in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references support_conversations(id) on delete cascade,
  auteur text not null check (auteur in ('user','admin')),
  contenu text not null check (char_length(contenu) between 1 and 4000),
  lu_le timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_conv_idx on support_messages (conversation_id, created_at);
create index if not exists support_conversations_user_idx on support_conversations (user_id, updated_at desc);

alter table support_conversations enable row level security;
alter table support_messages enable row level security;

create policy "support conv propriétaire" on support_conversations for select using (auth.uid() = user_id);
create policy "support conv admin" on support_conversations for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "support msg propriétaire" on support_messages for select using (
  exists (select 1 from support_conversations c where c.id = support_messages.conversation_id and c.user_id = auth.uid())
);
create policy "support msg admin" on support_messages for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

alter publication supabase_realtime add table support_messages;
