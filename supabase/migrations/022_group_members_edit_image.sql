-- =============================================================================
-- PISTE — les membres peuvent ajouter/changer la photo d'un groupe
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : 009_groups_bucket.sql limitait volontairement la modification de la
-- photo au créateur du groupe ou à un admin. Problème : les groupes prédéfinis
-- PISTE ont created_by = NULL, donc aucun membre normal ne pouvait jamais
-- ajouter de photo à un groupe auquel il a rejoint — seul un admin le pouvait.
-- On ouvre donc cette action à tout membre du groupe (table group_members).
-- =============================================================================

drop policy if exists "creator or admin updates group" on groups;
create policy "creator, admin or member updates group" on groups
  for update using (
    auth.uid() = created_by
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid())
  );

drop policy if exists "creator or admin uploads group image" on storage.objects;
create policy "creator, admin or member uploads group image" on storage.objects
  for insert with check (
    bucket_id = 'groups'
    and exists (
      select 1 from groups g
      where g.id::text = (storage.foldername(name))[1]
      and (
        g.created_by = auth.uid()
        or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
        or exists (select 1 from group_members gm where gm.group_id = g.id and gm.user_id = auth.uid())
      )
    )
  );

drop policy if exists "creator or admin manages group image" on storage.objects;
create policy "creator, admin or member manages group image" on storage.objects
  for update using (
    bucket_id = 'groups'
    and exists (
      select 1 from groups g
      where g.id::text = (storage.foldername(name))[1]
      and (
        g.created_by = auth.uid()
        or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
        or exists (select 1 from group_members gm where gm.group_id = g.id and gm.user_id = auth.uid())
      )
    )
  );

drop policy if exists "creator or admin deletes group image" on storage.objects;
create policy "creator, admin or member deletes group image" on storage.objects
  for delete using (
    bucket_id = 'groups'
    and exists (
      select 1 from groups g
      where g.id::text = (storage.foldername(name))[1]
      and (
        g.created_by = auth.uid()
        or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
        or exists (select 1 from group_members gm where gm.group_id = g.id and gm.user_id = auth.uid())
      )
    )
  );
