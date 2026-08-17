-- =============================================================================
-- PISTE — photo de groupe de discussion + quitter un groupe
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : deux manques dans la messagerie de groupe.
-- 1. `conversations` n'avait pas de colonne pour une photo — messageService.js
--    mettait toujours avatar=null pour un groupe, faute de colonne à lire.
-- 2. `conversation_members.left_at` existe depuis 001_init.sql (la policy
--    "member manages own membership" autorise déjà un membre à modifier sa
--    propre ligne) mais rien côté écran n'appelait jamais cette mise à jour —
--    impossible de vraiment quitter un groupe.
-- =============================================================================

alter table conversations add column if not exists image_url text;

-- Aucune policy UPDATE n'existait sur `conversations` — sans elle, même une
-- fois la colonne ajoutée, personne n'aurait pu l'alimenter. Réutilise le
-- helper is_conversation_member() déjà créé par 013_fix_conversation_rls_recursion.sql.
create policy "member updates own conversation" on conversations
  for update using (is_conversation_member(id, auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'conversations',
  'conversations',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "conversation images publicly readable"
  on storage.objects for select
  using (bucket_id = 'conversations');

-- Chemin attendu : {conversation_id}/{timestamp}-{nom_fichier}.
create policy "member uploads conversation image"
  on storage.objects for insert
  with check (
    bucket_id = 'conversations'
    and is_conversation_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

create policy "member manages conversation image"
  on storage.objects for update
  using (
    bucket_id = 'conversations'
    and is_conversation_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

create policy "member deletes conversation image"
  on storage.objects for delete
  using (
    bucket_id = 'conversations'
    and is_conversation_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
