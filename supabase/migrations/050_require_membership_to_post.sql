-- =============================================================================
-- PISTE — il faut avoir rejoint une communauté pour y publier (publication ou
-- discussion), pas seulement côté écran : la vraie vérification vit ici.
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
-- =============================================================================

drop policy if exists "author creates own posts" on posts;
create policy "author creates own posts" on posts
  for insert with check (
    auth.uid() = author_id
    and (
      group_id is null
      or exists (select 1 from group_members gm where gm.group_id = posts.group_id and gm.user_id = auth.uid())
    )
  );

drop policy if exists "authenticated users create discussions" on group_discussions;
create policy "members create discussions" on group_discussions
  for insert with check (
    auth.uid() = author_id
    and exists (select 1 from group_members gm where gm.group_id = group_discussions.group_id and gm.user_id = auth.uid())
  );

notify pgrst, 'reload schema';
