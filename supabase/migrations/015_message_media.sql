-- =============================================================================
-- PISTE — médias dans les messages (photo, vidéo, vocal)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- message_media existait déjà (001_init.sql) mais sans bucket Storage associé
-- ni colonne pour la durée des messages vocaux. Chemin utilisé par
-- messageService.sendMediaMessage() : {conversation_id}/{message_id}-{nom}.
-- Sécurité : réutilise is_conversation_member() (migration 013) pour que
-- seuls les membres de la conversation lisent/écrivent ses médias.
-- =============================================================================

alter table message_media add column if not exists duration_seconds integer;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'messages',
  'messages',
  true,
  20971520, -- 20 Mo (les vidéos/vocaux sont plus lourds que les avatars)
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','audio/webm','audio/mp4','audio/mpeg','audio/ogg']
)
on conflict (id) do nothing;

create policy "message media readable by conversation members"
  on storage.objects for select
  using (bucket_id = 'messages' and is_conversation_member((storage.foldername(name))[1]::uuid, auth.uid()));

create policy "conversation members upload message media"
  on storage.objects for insert
  with check (bucket_id = 'messages' and is_conversation_member((storage.foldername(name))[1]::uuid, auth.uid()));
