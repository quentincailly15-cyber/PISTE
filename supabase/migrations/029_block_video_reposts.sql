-- =============================================================================
-- PISTE — impossible de reposter une vidéo longue (video - vidéo)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : sur demande explicite, les Instants (posts.type = 'video_courte')
-- restent repostables comme avant, mais les vidéos longues (type = 'video')
-- ne doivent plus pouvoir l'être. La policy "user manages own reposts"
-- (010_reposts.sql) était un simple `for all` sans distinction de type — on
-- la split en insert/update/delete pour n'ajouter la restriction qu'à
-- l'insertion (update/delete gardent le même comportement qu'avant).
-- =============================================================================

drop policy if exists "user manages own reposts" on reposts;

create policy "user reposts non-video content" on reposts
  for insert with check (
    auth.uid() = user_id
    and not exists (select 1 from posts p where p.id = reposts.post_id and p.type = 'video')
  );

create policy "user updates own reposts" on reposts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user deletes own reposts" on reposts
  for delete using (auth.uid() = user_id);
