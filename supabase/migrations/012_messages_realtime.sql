-- =============================================================================
-- PISTE — active Supabase Realtime sur la table messages
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : sans ceci, les nouveaux messages n'apparaissent pas en direct côté
-- destinataire (il faudrait rafraîchir la page). Ajoute `messages` à la
-- publication `supabase_realtime` que Supabase écoute pour les changements
-- postgres_changes côté client (voir messageService.subscribeToConversation).
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
