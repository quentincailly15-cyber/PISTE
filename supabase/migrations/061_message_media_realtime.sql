-- =============================================================================
-- PISTE — active Supabase Realtime sur message_media
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : messages (012), message_reactions (038) et conversation_members (032)
-- sont déjà dans la publication supabase_realtime, mais message_media ne l'a
-- jamais été. Conséquence concrète : sendMediaMessage() crée d'abord la ligne
-- "messages" (texte vide), PUIS uploade le fichier et insère la ligne
-- "message_media" une fois l'upload terminé — le destinataire reçoit bien
-- l'événement temps réel sur "messages", mais jamais celui sur
-- "message_media", donc rien ne déclenche le second rechargement qui
-- afficherait la photo/vidéo/vocal une fois réellement disponible (voir
-- messageService.subscribeToConversation, déjà câblé pour écouter cet
-- événement — juste jamais alimenté côté base).
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_media'
  ) then
    alter publication supabase_realtime add table message_media;
  end if;
end $$;
