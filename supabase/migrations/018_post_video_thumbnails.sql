-- =============================================================================
-- PISTE — miniatures des vidéos de publication
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : post_media (001_init.sql) n'avait pas de colonne pour une image de
-- prévisualisation. Sans elle, les listes affichaient directement un élément
-- <video>, ce qui montre souvent un rectangle noir tant qu'on n'a pas cliqué
-- dessus (comportement peu fiable selon navigateur/appareil). La miniature
-- est désormais générée côté client à l'envoi (capture d'une image de la
-- vidéo) et uploadée comme une vraie image.
-- =============================================================================

alter table post_media add column if not exists thumbnail_url text;
