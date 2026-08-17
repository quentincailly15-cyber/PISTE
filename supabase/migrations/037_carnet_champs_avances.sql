-- =============================================================================
-- PISTE — carnet de chasse : terrains multiples, précision "Autre", stats avancées
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle :
--  - terrain devient un tableau (plusieurs terrains par sortie), au lieu
--    d'une seule valeur.
--  - "Autre" (type de sortie et terrain) peut maintenant être précisé par un
--    texte libre.
--  - nouvelles statistiques : arrêts, levés, tirés, et une catégorie
--    gros/petit gibier pour pouvoir les séparer correctement.
-- =============================================================================

alter table hunting_logs
  alter column terrain type text[] using (case when terrain is null or terrain = '' then null else array[terrain] end);

alter table hunting_logs add column if not exists terrain_autre text;
alter table hunting_logs add column if not exists type_sortie_autre text;
alter table hunting_logs add column if not exists nombre_arrets integer;
alter table hunting_logs add column if not exists nombre_leves integer;
alter table hunting_logs add column if not exists nombre_tires integer;
alter table hunting_logs add column if not exists categorie_gibier text;
alter table hunting_logs drop constraint if exists hunting_logs_categorie_gibier_check;
alter table hunting_logs add constraint hunting_logs_categorie_gibier_check
  check (categorie_gibier is null or categorie_gibier in ('gros', 'petit'));

notify pgrst, 'reload schema';
