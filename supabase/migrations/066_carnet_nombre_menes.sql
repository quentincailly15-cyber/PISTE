-- =============================================================================
-- PISTE — carnet de chasse : nombre de "mené"
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : arrêts et levés existent déjà (037_carnet_champs_avances.sql) —
-- "mené" (chien courant qui mène/poursuit le gibier à la voix) manquait,
-- même terme de chasse, même traitement.
-- =============================================================================

alter table hunting_logs add column if not exists nombre_menes integer;
