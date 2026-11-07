-- Facturation des commissions : une facture par mission, émise automatiquement
-- le lendemain de la fin du transport (offre acceptée + transport effectué).
-- Les factures sont émises dans Qonto (plateforme agréée) ; DealBus garde le suivi.

create table if not exists factures (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null unique references missions(id),
  transporteur_id uuid not null references transporteurs(id),
  date_transport date not null,               -- fin du transport
  numero text,                                -- numéro attribué par Qonto
  montant_ht numeric(10,2) not null,
  montant_tva numeric(10,2) not null,
  montant_ttc numeric(10,2) not null,
  statut text not null default 'emise' check (statut in ('emise','payee','annulee')),
  qonto_invoice_id text,
  emise_le timestamptz not null default now(),
  envoyee_le timestamptz,
  payee_le timestamptz,
  nb_relances int not null default 0,
  relancee_le timestamptz,
  erreur text,
  created_at timestamptz not null default now()
);

alter table missions add column if not exists facture_id uuid references factures(id);
alter table missions add column if not exists facturation_erreur text;
alter table transporteurs add column if not exists qonto_client_id text;

alter table factures enable row level security;
create policy "admin all factures" on factures for all using (is_admin()) with check (is_admin());
create policy "transporteur read own factures" on factures for select using (auth.uid() = transporteur_id);

create index if not exists factures_transporteur_idx on factures (transporteur_id);
create index if not exists missions_facture_idx on missions (facture_id);
