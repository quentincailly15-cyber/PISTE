-- =============================================================================
-- PISTE — pouvoir supprimer un message envoyé
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : la table "messages" (001_init.sql) n'avait qu'une policy select et
-- une policy insert — aucune suppression n'était possible, même pour son
-- propre message. message_media est en "on delete cascade" (001_init.sql) :
-- supprimer un message retire donc automatiquement sa pièce jointe éventuelle
-- de la base (le fichier Storage lui-même est nettoyé côté client, voir
-- messageService.deleteMessage).
-- =============================================================================

drop policy if exists "sender deletes own messages" on messages;
create policy "sender deletes own messages" on messages
  for delete using (auth.uid() = sender_id);
