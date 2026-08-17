-- =============================================================================
-- PISTE — l'admin peut aussi supprimer n'importe quel contenu
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : jusqu'ici, seul l'auteur d'un post/commentaire pouvait le supprimer
-- (policies "author deletes own posts"/"author deletes own comments",
-- 001_init.sql). On ajoute l'admin (profiles.role = 'admin') comme deuxième
-- cas autorisé, sans rien retirer à l'auteur — même principe que
-- canEditImage côté groupes (App.jsx).
-- =============================================================================

drop policy if exists "author deletes own posts" on posts;
create policy "author or admin deletes posts" on posts
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "author deletes own comments" on comments;
create policy "author or admin deletes comments" on comments
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
