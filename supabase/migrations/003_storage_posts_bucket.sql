-- =============================================================================
-- PISTE — bucket Storage pour les médias des publications
-- =============================================================================
-- À exécuter manuellement dans l'éditeur SQL de votre projet Supabase
-- (Dashboard > SQL Editor > New query > coller ce fichier > Run).
--
-- Rôle : crée le bucket "posts" utilisé par postService.js (createPost) pour
-- l'upload des photos/vidéos jointes à une publication. Sans ce bucket,
-- l'upload échoue avec une erreur 400 ("Bucket not found").
--
-- Chemin des fichiers utilisé par le code : {user_id}/{post_id}/{index}-{nom}
-- (voir postService.js, fonction createPost) — les policies ci-dessous
-- s'appuient sur ce premier segment ({user_id}) pour vérifier le propriétaire.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'posts',
  'posts',
  true, -- lecture publique : cohérent avec la policy "posts readable if not restricted"
  10485760, -- 10 Mo par fichier
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
)
on conflict (id) do nothing; -- ré-exécutable sans erreur si déjà créé

-- Lecture publique des fichiers du bucket "posts" (cohérent avec le fait que
-- les publications sont publiques par défaut — voir policy "posts readable...").
create policy "posts media publicly readable"
  on storage.objects for select
  using (bucket_id = 'posts');

-- Seul le propriétaire (1er segment du chemin = son user_id) peut uploader
-- dans son propre dossier.
create policy "users upload to their own posts folder"
  on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Seul le propriétaire peut modifier/supprimer ses propres fichiers.
create policy "users manage their own posts media"
  on storage.objects for update
  using (bucket_id = 'posts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users delete their own posts media"
  on storage.objects for delete
  using (bucket_id = 'posts' and auth.uid()::text = (storage.foldername(name))[1]);
