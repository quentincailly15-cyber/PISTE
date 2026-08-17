-- =============================================================================
-- PISTE — demandes d'assistance (écran Aide > Contacter PISTE)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : AideScreen (App.jsx) affichait un formulaire "Contacter PISTE" qui
-- se terminait toujours par un message "Demande envoyée", mais rien n'était
-- réellement stocké nulle part (api.submitHelpRequest était un stub qui
-- renvoyait juste `true`). Cette table donne enfin une vraie destination à
-- ces demandes, sur le même modèle que `reports` (001_init.sql).
-- =============================================================================

create table support_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  category     text not null,
  subject      text not null,
  description  text not null,
  status       text not null default 'ouvert' check (status in ('ouvert','en_cours','resolu')),
  created_at   timestamptz not null default now()
);
alter table support_requests enable row level security;
create policy "user creates own support request" on support_requests for insert with check (auth.uid() = user_id);
create policy "user reads own support requests" on support_requests for select using (auth.uid() = user_id);
