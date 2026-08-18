-- =============================================================================
-- PISTE — ajoute les communautés prédéfinies "Piégeage" et "Vénerie sous terre"
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : complète les 24 communautés prédéfinies (001_init.sql) — pas de
-- contrainte unique sur groups.nom, donc on protège l'insertion avec un
-- "where not exists" pour rester rejouable sans dupliquer.
-- =============================================================================

insert into groups (nom, description, categorie, is_predefined)
select 'Piégeage', 'Piégeage réglementé : techniques, législation et régulation des nuisibles.', 'Chasse', true
where not exists (select 1 from groups where nom = 'Piégeage' and is_predefined = true);

insert into groups (nom, description, categorie, is_predefined)
select 'Vénerie sous terre', 'Déterrage du renard et du blaireau : équipes, chiens et techniques.', 'Chasse', true
where not exists (select 1 from groups where nom = 'Vénerie sous terre' and is_predefined = true);

-- Le carnet de chasse (025_carnet_chasse.sql) limitait type_sortie à une
-- liste fixe qui n'incluait ni le piégeage ni la vénerie sous terre.
alter table hunting_logs drop constraint if exists hunting_logs_type_sortie_check;
alter table hunting_logs add constraint hunting_logs_type_sortie_check
  check (type_sortie in ('chasse', 'piegeage', 'venerie_sous_terre', 'reperage', 'entrainement_chien', 'observation', 'autre'));
