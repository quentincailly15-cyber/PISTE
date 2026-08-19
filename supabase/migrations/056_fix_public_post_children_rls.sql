-- =============================================================================
-- PISTE — corrige la fuite RLS sur post_media / post_dogs / comments / likes
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Bug (trouvé lors de l'audit pré-bêta) : la migration 020 a bien resserré la
-- policy SELECT de `posts` pour respecter les comptes privés — mais les
-- quatre tables qui dépendent d'un post (post_media, post_dogs, comments,
-- likes) sont restées sur leur policy d'origine `using (true)`, posée avant
-- que les comptes privés n'existent (001_init.sql). Résultat concret :
-- n'importe qui (même non connecté, avec la seule clé publique) peut lire
-- TOUTES les photos/vidéos, TOUS les tags de chien, TOUS les commentaires et
-- TOUS les likes de l'app via l'API Supabase — y compris ceux d'un compte
-- que son propriétaire croit privé. La légende du post (`posts` lui-même)
-- est protégée, mais pas ce qu'elle contient.
--
-- Correction : chaque policy relit désormais la même règle de visibilité que
-- `posts` (auteur, ou compte non privé / abonné approuvé, jamais restricted),
-- via une fonction SECURITY DEFINER qui réimplémente ce prédicat directement
-- (ne dépend pas de la policy de `posts` elle-même, pour éviter tout risque
-- de récursion RLS — même principe que is_conversation_member, 013).
-- =============================================================================

create or replace function public.is_post_visible(p_post_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from posts p
    where p.id = p_post_id
      and (
        p.author_id = p_uid
        or (
          p.content_rating <> 'restricted'
          and (
            not exists (select 1 from profiles pr where pr.id = p.author_id and pr.is_private)
            or exists (select 1 from follows f where f.follower_id = p_uid and f.followed_id = p.author_id)
          )
        )
      )
  );
$$;

drop policy if exists "post_media readable with post" on post_media;
create policy "post_media readable if post visible" on post_media
  for select using (is_post_visible(post_id, auth.uid()));

drop policy if exists "post_dogs readable" on post_dogs;
create policy "post_dogs readable if post visible" on post_dogs
  for select using (is_post_visible(post_id, auth.uid()));

drop policy if exists "comments readable" on comments;
create policy "comments readable if post visible" on comments
  for select using (is_post_visible(post_id, auth.uid()));

drop policy if exists "likes readable" on likes;
create policy "likes readable if post visible" on likes
  for select using (is_post_visible(post_id, auth.uid()));

notify pgrst, 'reload schema';
