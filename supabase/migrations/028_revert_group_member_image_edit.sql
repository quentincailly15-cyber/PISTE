-- =============================================================================
-- PISTE — seul un admin (ou le créateur) modifie la photo d'une communauté
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : 022_group_members_edit_image.sql avait ouvert la modification de la
-- photo à tout membre ayant rejoint une communauté. Sur demande explicite,
-- on revient en arrière pour les communautés PRÉDÉFINIES (created_by = NULL)
-- : seul un admin peut les modifier. Le créateur d'une communauté qu'il a
-- lui-même créée garde évidemment ce droit (created_by = auth.uid()).
-- =============================================================================

drop policy if exists "creator, admin or member updates group" on groups;
create policy "creator or admin updates group" on groups
  for update using (
    auth.uid() = created_by
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "creator, admin or member uploads group image" on storage.objects;
create policy "creator or admin uploads group image" on storage.objects
  for insert with check (
    bucket_id = 'groups'
    and exists (
      select 1 from groups g
      where g.id::text = (storage.foldername(name))[1]
      and (g.created_by = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
    )
  );

drop policy if exists "creator, admin or member manages group image" on storage.objects;
create policy "creator or admin manages group image" on storage.objects
  for update using (
    bucket_id = 'groups'
    and exists (
      select 1 from groups g
      where g.id::text = (storage.foldername(name))[1]
      and (g.created_by = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
    )
  );

drop policy if exists "creator, admin or member deletes group image" on storage.objects;
create policy "creator or admin deletes group image" on storage.objects
  for delete using (
    bucket_id = 'groups'
    and exists (
      select 1 from groups g
      where g.id::text = (storage.foldername(name))[1]
      and (g.created_by = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
    )
  );
