-- =============================================================================
-- PISTE — autorise l'ajout de médias aux messages
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Bug : message_media (001_init.sql) n'avait qu'une policy SELECT ("member
-- reads media of own conversations") — jamais de policy INSERT. Avec RLS
-- activé, toute tentative d'insert est refusée par défaut tant qu'aucune
-- policy ne l'autorise explicitement, d'où l'erreur "new row violates
-- row-level security policy" dès qu'on essayait d'envoyer une photo/vidéo/
-- vocal (voir messageService.sendMediaMessage).
-- =============================================================================

create policy "sender adds own message media" on message_media
  for insert
  with check (
    exists (select 1 from messages m where m.id = message_media.message_id and m.sender_id = auth.uid())
  );
