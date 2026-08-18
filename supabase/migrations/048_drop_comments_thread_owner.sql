-- =============================================================================
-- PISTE — supprime thread_owner_id (comments), entièrement abandonnée depuis
-- l'annulation des commentaires privés (047).
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : cette colonne créait une DEUXIÈME clé étrangère comments → profiles
-- (en plus de author_id), ce qui rend ambigu tout embed court
-- "profiles(...)" dans une requête PostgREST — exactement le bug qui rendait
-- les commentaires invisibles malgré des policies RLS correctes et des
-- lignes bien présentes en base. On la supprime pour de bon plutôt que de
-- seulement contourner le problème côté requête.
-- =============================================================================

alter table comments drop column if exists thread_owner_id;

notify pgrst, 'reload schema';
