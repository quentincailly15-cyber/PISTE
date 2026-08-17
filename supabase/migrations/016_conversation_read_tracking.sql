-- =============================================================================
-- PISTE — suivi de lecture des conversations
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : conversation_members n'avait aucune trace de "quand cet utilisateur
-- a-t-il lu cette conversation pour la dernière fois". Nécessaire pour
-- afficher un badge = nombre de CONVERSATIONS avec au moins un message non lu
-- (et non le nombre total de messages non lus).
-- =============================================================================

alter table conversation_members add column if not exists last_read_at timestamptz;
