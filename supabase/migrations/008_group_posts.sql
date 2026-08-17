-- =============================================================================
-- PISTE — publications rattachées à un groupe
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : 001_init.sql n'avait pas de colonne pour rattacher une publication à
-- un groupe (le bouton "Publier dans ce groupe" existait déjà côté React mais
-- n'était relié à aucune donnée). NULL = publication normale du fil (hors
-- groupe), comme aujourd'hui.
-- =============================================================================

alter table posts add column if not exists group_id uuid references groups(id) on delete set null;
