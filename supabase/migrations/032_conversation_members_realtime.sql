-- =============================================================================
-- PISTE — active Supabase Realtime sur conversation_members (accusés de lecture)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : nécessaire pour l'indicateur "Lu" dans les conversations — quand le
-- destinataire ouvre le fil, son last_read_at est mis à jour
-- (messageService.markConversationRead) ; sans cette ligne, l'expéditeur ne
-- voit ce changement qu'en rouvrant lui-même la conversation, jamais en
-- direct. Même mécanisme que 012_messages_realtime.sql pour la table
-- "messages".
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_members'
  ) then
    alter publication supabase_realtime add table conversation_members;
  end if;
end $$;
