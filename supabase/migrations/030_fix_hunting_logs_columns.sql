-- =============================================================================
-- PISTE — rattrape les colonnes manquantes sur hunting_logs
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : 025_carnet_chasse.sql utilise `create table if not exists`. Si la
-- table hunting_logs avait déjà été créée chez vous lors d'un essai précédent
-- (avant que certaines colonnes comme `avec_chien` ne soient finalisées dans
-- le fichier de migration), relancer 025 ne rajoute rien : "if not exists"
-- ignore silencieusement toute la instruction `create table` dès que la table
-- existe déjà, colonnes manquantes ou non. D'où l'erreur "Could not find the
-- 'avec_chien' column ... in the schema cache".
--
-- Cette migration rajoute, une par une et sans risque, toutes les colonnes
-- attendues par huntingLogService.js si elles manquent encore — sans jamais
-- toucher à celles déjà présentes.
-- =============================================================================

alter table hunting_logs add column if not exists lieu_nom          text;
alter table hunting_logs add column if not exists lieu_commune      text;
alter table hunting_logs add column if not exists lieu_lat          double precision;
alter table hunting_logs add column if not exists lieu_lng          double precision;
alter table hunting_logs add column if not exists avec_chien        boolean not null default false;
alter table hunting_logs add column if not exists dog_id            uuid references dogs(id) on delete set null;
alter table hunting_logs add column if not exists espece            text;
alter table hunting_logs add column if not exists observation       text;
alter table hunting_logs add column if not exists resultat          text;
alter table hunting_logs add column if not exists duree_minutes     integer;
alter table hunting_logs add column if not exists nombre_personnes  integer;
alter table hunting_logs add column if not exists meteo             text;
alter table hunting_logs add column if not exists temperature       numeric;
alter table hunting_logs add column if not exists terrain           text;
alter table hunting_logs add column if not exists distance_km       numeric;
alter table hunting_logs add column if not exists nombre_prises     integer;
alter table hunting_logs add column if not exists notes             text;

notify pgrst, 'reload schema';
