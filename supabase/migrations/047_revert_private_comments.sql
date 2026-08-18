-- =============================================================================
-- PISTE — annule les commentaires privés par fil (migration 045) : les
-- commentaires redeviennent publics, visibles par tout le monde comme avant.
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : demande explicite de revenir en arrière sur 045_private_comment_threads.sql.
--
-- IMPORTANT : 045 avait rendu thread_owner_id "not null" — le code revenu en
-- arrière ne l'envoie plus du tout à l'insertion, donc SANS cette ligne,
-- chaque nouveau commentaire échoue silencieusement (violation de contrainte)
-- et n'apparaît jamais. On rend la colonne à nouveau optionnelle plutôt que
-- de la supprimer (aucune donnée perdue, juste plus utilisée par personne).
-- =============================================================================

alter table comments alter column thread_owner_id drop not null;

drop policy if exists "comments visible to thread owner and post author" on comments;
create policy "comments readable" on comments for select using (true);

drop policy if exists "author creates comments in own or owned thread" on comments;
create policy "author creates comments" on comments for insert with check (auth.uid() = author_id);

notify pgrst, 'reload schema';
