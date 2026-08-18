-- =============================================================================
-- PISTE — annule les commentaires privés par fil (migration 045) : les
-- commentaires redeviennent publics, visibles par tout le monde comme avant.
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : demande explicite de revenir en arrière sur 045_private_comment_threads.sql.
-- Entièrement rejouable sans erreur, quel que soit l'état réel de votre base
-- (045 jamais appliquée, appliquée en partie, ou ce script lui-même déjà
-- lancé une fois) — chaque étape se protège explicitement au lieu de
-- supposer ce qui existe déjà.
--
-- IMPORTANT : 045 avait rendu thread_owner_id "not null" — le code revenu en
-- arrière ne l'envoie plus du tout à l'insertion, donc sans cette étape,
-- chaque nouveau commentaire échoue silencieusement (violation de contrainte)
-- et n'apparaît jamais. On rend la colonne à nouveau optionnelle plutôt que
-- de la supprimer (aucune donnée perdue, juste plus utilisée par personne).
-- =============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'comments' and column_name = 'thread_owner_id'
  ) then
    alter table comments alter column thread_owner_id drop not null;
  end if;
end $$;

drop policy if exists "comments visible to thread owner and post author" on comments;
drop policy if exists "comments readable" on comments;
create policy "comments readable" on comments for select using (true);

drop policy if exists "author creates comments in own or owned thread" on comments;
drop policy if exists "author creates comments" on comments;
create policy "author creates comments" on comments for insert with check (auth.uid() = author_id);

notify pgrst, 'reload schema';
