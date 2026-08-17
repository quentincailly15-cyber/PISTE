-- =============================================================================
-- PISTE — vrai titre de vidéo + durée réelle
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : App.jsx affichait "titre" en réutilisant simplement `texte` (la
-- description) — jamais un vrai champ dédié. Ajoute une colonne `titre`
-- distincte, utilisée uniquement par les publications de type vidéo pour
-- l'instant (rien n'empêche de l'étendre plus tard aux autres types).
--
-- `video.duree` était référencé côté interface (VideoCard) mais jamais
-- réellement alimenté nulle part — la pastille de durée n'a donc jamais
-- rien affiché pour du vrai contenu. `post_media.duration_seconds` corrige
-- ça, sondée côté navigateur à l'envoi (voir ComposeScreen).
-- =============================================================================

alter table posts add column if not exists titre text;
alter table post_media add column if not exists duration_seconds integer;
