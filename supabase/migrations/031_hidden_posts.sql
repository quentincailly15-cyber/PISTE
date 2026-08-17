-- =============================================================================
-- PISTE — persistance réelle du "masquer ce contenu"
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : le bouton "Masquer" (ContentActionSheet) n'écrivait que dans un
-- useState local côté React (hidePost, App.jsx) — jamais persisté nulle part.
-- Un contenu masqué réapparaissait donc au moindre rafraîchissement de page
-- ou sur un autre appareil. Cette table corrige ça, sur le même modèle que
-- `blocked_users` (005_blocked_users.sql) : privée, gérée uniquement par son
-- propriétaire.
-- =============================================================================

create table hidden_posts (
  user_id     uuid not null references profiles(id) on delete cascade,
  post_id     uuid not null references posts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table hidden_posts enable row level security;

create policy "user reads own hidden posts" on hidden_posts
  for select using (auth.uid() = user_id);

create policy "user manages own hidden posts" on hidden_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
