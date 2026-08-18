-- =============================================================================
-- PISTE — commentaires privés : chaque commentaire n'est visible que par son
-- auteur et par l'auteur de la publication (jamais par les autres visiteurs),
-- comme une conversation privée avec le publieur plutôt qu'un mur public. Le
-- NOMBRE de commentaires reste public (posts.comments_count, inchangé).
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Modèle : chaque commentaire porte "thread_owner_id" = l'utilisateur qui a
-- démarré ce fil (l'auteur du commentaire racine). Une réponse hérite du
-- thread_owner_id de son parent. Un commentaire n'est visible qu'à
-- thread_owner_id ou à l'auteur de la publication — jamais à un tiers, même
-- s'il a lui-même commenté ailleurs sur le même post (son propre fil reste
-- séparé et tout aussi privé).
-- =============================================================================

alter table comments add column if not exists thread_owner_id uuid references profiles(id) on delete cascade;

-- Rattrapage des commentaires déjà existants : un commentaire racine
-- démarre son propre fil ; une réponse hérite du fil de son parent.
update comments set thread_owner_id = author_id where parent_id is null and thread_owner_id is null;
update comments c set thread_owner_id = p.thread_owner_id
  from comments p where c.parent_id = p.id and c.thread_owner_id is null and p.thread_owner_id is not null;
-- Filet de sécurité si un parent n'a pas encore de thread_owner_id résolu
-- (chaîne plus profonde que prévu) : rattache au moins à son propre auteur.
update comments set thread_owner_id = author_id where thread_owner_id is null;

alter table comments alter column thread_owner_id set not null;

drop policy if exists "comments readable" on comments;
create policy "comments visible to thread owner and post author" on comments
  for select using (
    auth.uid() = (select p.author_id from posts p where p.id = comments.post_id)
    or auth.uid() = thread_owner_id
  );

drop policy if exists "author creates comments" on comments;
create policy "author creates comments in own or owned thread" on comments
  for insert with check (
    auth.uid() = author_id
    and (
      (parent_id is null and thread_owner_id = author_id)
      or (parent_id is not null and thread_owner_id = (select c2.thread_owner_id from comments c2 where c2.id = comments.parent_id))
    )
    and (
      auth.uid() = (select p.author_id from posts p where p.id = comments.post_id)
      or auth.uid() = thread_owner_id
    )
  );

notify pgrst, 'reload schema';
