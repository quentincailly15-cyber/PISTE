-- =============================================================================
-- PISTE — remplace l'âge saisi à la main (vite obsolète) par une date de
-- naissance, dont l'âge est recalculé à chaque affichage côté client.
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
-- =============================================================================

alter table dogs add column if not exists birth_date date;

notify pgrst, 'reload schema';
