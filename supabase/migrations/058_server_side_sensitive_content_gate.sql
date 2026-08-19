-- =============================================================================
-- PISTE — filtrage "contenu sensible" appliqué aussi côté serveur
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Bug (trouvé lors de l'audit pré-bêta) : le contenu classé "sensible"
-- (content_rating = 'sensitive') n'était jamais montré aux comptes mineurs
-- côté interface (filterAge, App.jsx), mais aucune policy RLS ne reprenait
-- cette règle — un compte mineur (ou n'importe qui contournant simplement
-- l'interface) pouvait lire ce contenu directement via l'API. La policy
-- posée par 020_private_accounts.sql gérait déjà "restricted" et les
-- comptes privés ; elle est étendue ici pour couvrir aussi ce cas.
--
-- Par prudence, le défaut est restrictif : un contenu sensible n'est visible
-- que si on peut confirmer que le lecteur n'est PAS mineur (profil existant
-- et est_mineur() faux) — un visiteur non connecté ou sans profil ne le voit
-- jamais, plutôt que de supposer qu'il n'est pas mineur faute de preuve.
-- =============================================================================

drop policy if exists "posts readable if not restricted or private" on posts;
create policy "posts readable if not restricted, private, or sensitive-gated" on posts
  for select using (
    auth.uid() = author_id
    or (
      content_rating <> 'restricted'
      and (
        content_rating <> 'sensitive'
        or exists (select 1 from profiles me where me.id = auth.uid() and not est_mineur(me.date_naissance))
      )
      and (
        not exists (select 1 from profiles pr where pr.id = posts.author_id and pr.is_private)
        or exists (select 1 from follows f where f.follower_id = auth.uid() and f.followed_id = posts.author_id)
      )
    )
  );

-- is_post_visible() (056_fix_public_post_children_rls.sql) réimplémente
-- volontairement ce même prédicat en interne, plutôt que de dépendre de la
-- policy de "posts" elle-même (pour éviter toute récursion RLS). Sans mise à
-- jour ici, post_media/post_dogs/comments/likes resteraient visibles pour un
-- compte mineur même sur un post désormais bloqué au niveau de "posts" —
-- corrigé une porte, oubliée la suivante.
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
            p.content_rating <> 'sensitive'
            or exists (select 1 from profiles me where me.id = p_uid and not est_mineur(me.date_naissance))
          )
          and (
            not exists (select 1 from profiles pr where pr.id = p.author_id and pr.is_private)
            or exists (select 1 from follows f where f.follower_id = p_uid and f.followed_id = p.author_id)
          )
        )
      )
  );
$$;

notify pgrst, 'reload schema';
