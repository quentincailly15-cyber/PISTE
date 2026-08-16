-- =============================================================================
-- PISTE — table de blocage utilisateur
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : 001_init.sql ne contenait pas de table pour "bloquer un utilisateur"
-- (seulement `follows`, `reports`, `user_sanctions`). Cette table permet à
-- socialService.js de persister réellement les blocages, jusque-là gardés en
-- mémoire locale uniquement côté React.
--
-- Contrairement à `follows` (publiquement lisible), la liste des blocages
-- reste privée : seul l'utilisateur qui bloque peut la lire.
-- =============================================================================

create table blocked_users (
  blocker_id  uuid not null references profiles(id) on delete cascade,
  blocked_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table blocked_users enable row level security;

create policy "user reads own blocks" on blocked_users
  for select using (auth.uid() = blocker_id);

create policy "user manages own blocks" on blocked_users
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);
