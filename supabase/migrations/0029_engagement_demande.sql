-- Engagement du client à l'envoi d'une demande : code à 6 chiffres reçu par e-mail.
-- On garde la preuve : e-mail, date, IP, navigateur et texte exact accepté.
-- Toutes les écritures passent par le serveur (clé de service) ; le client ne lit que ses lignes.

create table if not exists demande_engagements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  demande_id uuid references demandes(id) on delete set null,
  email text not null,
  code_hash text not null,
  essais int not null default 0,
  expire_le timestamptz not null,
  valide_le timestamptz,
  texte text not null,
  texte_version text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists demande_engagements_user_idx on demande_engagements (user_id, created_at desc);
create index if not exists demande_engagements_demande_idx on demande_engagements (demande_id);

alter table demande_engagements enable row level security;
create policy "own demande engagements" on demande_engagements for select using (auth.uid() = user_id);
create policy "admin read demande engagements" on demande_engagements for select using (is_admin());

comment on table demande_engagements is 'Preuve de validation par code e-mail à l''envoi d''une demande de devis';
