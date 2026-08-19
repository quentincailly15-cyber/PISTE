-- =============================================================================
-- PISTE — likes sur les Traces
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : le bouton cœur du visionneur de Trace envoyait jusqu'ici "❤️" comme
-- un simple message privé (aucun état persistant, rien à afficher comme
-- "liké") — table dédiée, même principe que trace_views (024_traces.sql),
-- mais togglable (for all, pas seulement insert) puisqu'un like peut être
-- retiré, contrairement à une vue.
-- =============================================================================

create table if not exists trace_likes (
  trace_id  uuid not null references traces(id) on delete cascade,
  viewer_id uuid not null references profiles(id) on delete cascade,
  liked_at  timestamptz not null default now(),
  primary key (trace_id, viewer_id)
);
alter table trace_likes enable row level security;

create policy "viewer manages own trace like" on trace_likes
  for all using (auth.uid() = viewer_id) with check (auth.uid() = viewer_id);

-- Même règle que trace_views : un viewer ne voit que sa propre ligne ;
-- l'auteur de la Trace voit tous les likes de sa Trace (compteur + qui l'a aimée).
create policy "viewer or trace author reads trace likes" on trace_likes
  for select using (
    auth.uid() = viewer_id
    or exists (select 1 from traces t where t.id = trace_likes.trace_id and t.author_id = auth.uid())
  );

notify pgrst, 'reload schema';
