-- =============================================================================
-- PISTE — bucket Storage pour les photos de chien
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : bucket "dogs" utilisé par dogService.js pour la photo de chien,
-- enregistrée dans dogs.photo_url. Chemin : {user_id}/{timestamp}-{nom_fichier}.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dogs',
  'dogs',
  true, -- lecture publique : cohérent avec "dogs publicly readable"
  5242880, -- 5 Mo par fichier
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "dog photos publicly readable"
  on storage.objects for select
  using (bucket_id = 'dogs');

create policy "users upload their own dog photos"
  on storage.objects for insert
  with check (bucket_id = 'dogs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users manage their own dog photos"
  on storage.objects for update
  using (bucket_id = 'dogs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users delete their own dog photos"
  on storage.objects for delete
  using (bucket_id = 'dogs' and auth.uid()::text = (storage.foldername(name))[1]);
