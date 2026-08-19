-- =============================================================================
-- PISTE — bucket "posts" privé + lecture par URL signée
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois, et
-- SEULEMENT une fois le code correspondant déployé (postService.js,
-- traceService.js, messageService.js, groupService.js génèrent désormais des
-- URLs signées au lieu d'URLs publiques) — sinon toute URL publique déjà
-- affichée dans un client ouvert devient invalide le temps du déploiement.
-- Même précaution que 057_private_message_media_bucket.sql.
--
-- Bug (trouvé lors de l'audit pré-bêta, vague 2) : le bucket Storage "posts"
-- est public et postService.js/traceService.js appelaient getPublicUrl() —
-- exactement le même défaut déjà corrigé pour les messages privés (057), en
-- plus large : les RLS sur posts/post_media (020, 056, 058) protègent bien
-- les LIGNES en base (compte privé, contenu sensible masqué aux mineurs),
-- mais pas le FICHIER lui-même, servi sans aucune vérification via la route
-- publique du bucket. Un compte qui passe en privé après coup, ou un mineur
-- qui a autrefois obtenu l'URL directe d'un contenu sensible, y a toujours
-- accès. Le bucket "posts" est aussi réutilisé par Trace (traceService.js) :
-- même défaut, même correctif.
--
-- Le bucket sert TROIS types de chemins différents :
--   - média de publication      : {authorId}/{postId}/{index}-{nom}
--   - miniature générée après coup : {viewerId}/generated/{mediaId}-{ts}.jpg
--   - média de Trace            : {authorId}/trace-{timestamp}-{nom}
-- is_posts_object_visible() ne dépend donc pas de la forme du chemin : elle
-- cherche directement la ligne (post_media ou trace) dont la colonne
-- url/thumbnail_url/media_path correspond exactement à l'objet demandé, et
-- réutilise le prédicat de visibilité déjà en place pour cette ligne.
-- =============================================================================

update storage.buckets set public = false where id = 'posts';

create or replace function public.is_posts_object_visible(p_object_name text, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from post_media pm
      join posts p on p.id = pm.post_id
      where (pm.url = p_object_name or pm.thumbnail_url = p_object_name)
        and is_post_visible(p.id, p_uid)
    )
    or exists (
      -- Même prédicat que "trace readable if active and not private or
      -- approved" (024_traces.sql) — réimplémenté ici plutôt que dépendu,
      -- même raison que is_post_visible (éviter toute récursion RLS).
      select 1 from traces t
      where t.media_path = p_object_name
        and (
          t.author_id = p_uid
          or (
            t.expires_at > now()
            and (
              not exists (select 1 from profiles pr where pr.id = t.author_id and pr.is_private)
              or exists (select 1 from follows f where f.follower_id = p_uid and f.followed_id = t.author_id)
            )
          )
        )
    );
$$;

drop policy if exists "posts media publicly readable" on storage.objects;
create policy "posts media readable if content visible" on storage.objects
  for select using (
    bucket_id = 'posts'
    and is_posts_object_visible(name, auth.uid())
  );

notify pgrst, 'reload schema';
