-- =============================================================================
-- PISTE — bucket Storage pour les photos de profil
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase (Dashboard > SQL Editor),
-- une seule fois (les "create policy" ne sont pas ré-exécutables).
--
-- Rôle : bucket "avatars" utilisé par profileService.js pour l'upload de la
-- photo de profil. Chemin utilisé : {user_id}/{timestamp}-{nom_fichier}.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true, -- lecture publique : cohérent avec "profiles are publicly readable"
  5242880, -- 5 Mo par fichier
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "avatars publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users manage their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
