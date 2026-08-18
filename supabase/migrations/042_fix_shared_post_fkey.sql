-- =============================================================================
-- PISTE — rattrape la relation shared_post_id si 041 ne l'a pas créée
-- (jamais exécutée, ou colonne ajoutée sans sa contrainte)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : même cause que 039 pour reply_to_id — "Could not find a
-- relationship between 'messages' and 'posts'" signifie que la clé
-- étrangère shared_post_id → posts n'existe pas côté base. On sépare l'ajout
-- de la colonne de l'ajout de la contrainte, nommée explicitement, pour ne
-- dépendre d'aucune supposition sur ce que 041 a réellement exécuté chez
-- vous.
-- =============================================================================

alter table messages add column if not exists shared_post_id uuid;

alter table messages drop constraint if exists messages_shared_post_id_fkey;
alter table messages add constraint messages_shared_post_id_fkey
  foreign key (shared_post_id) references posts(id) on delete set null;

notify pgrst, 'reload schema';
