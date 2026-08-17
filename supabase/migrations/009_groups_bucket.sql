-- =============================================================================
-- PISTE — bucket Storage pour les images de groupe
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : bucket "groups" utilisé par groupService.uploadGroupImage() pour
-- alimenter groups.image_url (colonne déjà présente dans 001_init.sql, mais
-- jamais alimentée par un vrai upload jusqu'ici).
--
-- Permissions : la policy RLS "creator or admin updates group" existe déjà
-- sur la table `groups` (001_init.sql) et autorise la mise à jour uniquement
-- par le créateur (created_by) ou un admin (profiles.role = 'admin'). Comme
-- les 24 groupes prédéfinis ont created_by = NULL, seul un admin peut les
-- modifier — c'est exactement le comportement demandé, sans rien y toucher.
-- Les policies Storage ci-dessous appliquent la même règle à l'upload du
-- fichier lui-même.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'groups',
  'groups',
  true, -- lecture publique : cohérent avec "groups publicly readable"
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "group images publicly readable"
  on storage.objects for select
  using (bucket_id = 'groups');

-- Chemin attendu : {group_id}/{timestamp}-{nom_fichier}. On vérifie que
-- l'utilisateur est bien créateur du groupe ciblé, ou admin.
create policy "creator or admin uploads group image"
  on storage.objects for insert
  with check (
    bucket_id = 'groups'
    and exists (
      select 1 from groups g
      where g.id::text = (storage.foldername(name))[1]
      and (g.created_by = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
    )
  );

create policy "creator or admin manages group image"
  on storage.objects for update
  using (
    bucket_id = 'groups'
    and exists (
      select 1 from groups g
      where g.id::text = (storage.foldername(name))[1]
      and (g.created_by = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
    )
  );

create policy "creator or admin deletes group image"
  on storage.objects for delete
  using (
    bucket_id = 'groups'
    and exists (
      select 1 from groups g
      where g.id::text = (storage.foldername(name))[1]
      and (g.created_by = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
    )
  );
