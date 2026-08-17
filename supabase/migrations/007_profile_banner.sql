-- =============================================================================
-- PISTE — colonne bannière de profil
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : 001_init.sql n'avait pas de colonne pour la bannière/photo de
-- couverture du profil (concept déjà présent côté React sous le nom
-- `profile.imageCouverture`, mais jamais alimenté). Réutilise le bucket
-- Storage "avatars" déjà créé (004_avatars_bucket.sql) — même politique de
-- lecture publique / écriture par le propriétaire, pas besoin d'un bucket dédié.
-- =============================================================================

alter table profiles add column if not exists banniere_url text;
