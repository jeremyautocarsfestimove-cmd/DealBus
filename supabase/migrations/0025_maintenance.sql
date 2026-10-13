-- 0025 — Paramètres du site (mode « en travaux » pilotable depuis l'admin)
create table if not exists parametres_site (
  cle text primary key,
  valeur jsonb not null default '{}'::jsonb,
  maj_le timestamptz not null default now(),
  maj_par uuid references auth.users(id)
);

alter table parametres_site enable row level security;

-- Lecture publique (le middleware lit l'état avec la clé anon) ;
-- écriture uniquement via le service role (route API admin).
drop policy if exists "parametres_site lecture" on parametres_site;
create policy "parametres_site lecture" on parametres_site for select using (true);

insert into parametres_site (cle, valeur)
values ('maintenance', '{"actif": false, "message": "", "retour": ""}'::jsonb)
on conflict (cle) do nothing;
