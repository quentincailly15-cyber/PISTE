-- =============================================================================
-- PISTE — personnes identifiées sur une publication (table dédiée)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : jusqu'ici, "identifier quelqu'un" fusionnait simplement son
-- @pseudo dans posts.mentions (même colonne que les @mentions tapées à la
-- main dans le texte) — suffisant pour déclencher la notification, mais
-- impossible de savoir ensuite QUI a été identifié spécifiquement (par
-- opposition à quelqu'un juste cité au fil du texte), pour l'afficher
-- "avec Untel" dans l'en-tête d'une publication. Table dédiée, même
-- principe many-to-many que post_dogs (003/001_init.sql).
-- =============================================================================

create table if not exists post_identified_users (
  post_id  uuid not null references posts(id) on delete cascade,
  user_id  uuid not null references profiles(id) on delete cascade,
  primary key (post_id, user_id)
);
alter table post_identified_users enable row level security;

create policy "post_identified_users readable if post visible" on post_identified_users
  for select using (is_post_visible(post_id, auth.uid()));

create policy "author manages own post_identified_users" on post_identified_users
  for all
  using (auth.uid() = (select author_id from posts where id = post_id))
  with check (auth.uid() = (select author_id from posts where id = post_id));

notify pgrst, 'reload schema';
