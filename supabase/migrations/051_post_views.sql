-- =============================================================================
-- PISTE — vrai comptage de vues sur les publications/vidéos (posts.vues
-- existait déjà en base mais n'était jamais incrémenté nulle part).
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : même principe que trace_views (024_traces.sql) — une ligne par
-- (post, spectateur), clé primaire composite qui empêche tout comptage en
-- double, et un trigger qui tient à jour posts.vues (déjà affiché partout
-- où le post est mappé, aucun changement de lecture nécessaire côté client).
-- =============================================================================

create table if not exists post_views (
  post_id    uuid not null references posts(id) on delete cascade,
  viewer_id  uuid not null references profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (post_id, viewer_id)
);
alter table post_views enable row level security;

drop policy if exists "viewer or post author reads post views" on post_views;
create policy "viewer or post author reads post views" on post_views
  for select using (
    auth.uid() = viewer_id
    or exists (select 1 from posts p where p.id = post_views.post_id and p.author_id = auth.uid())
  );

drop policy if exists "viewer records own post view" on post_views;
create policy "viewer records own post view" on post_views
  for insert with check (auth.uid() = viewer_id);

create or replace function bump_post_views_count() returns trigger as $$
begin
  update posts set vues = vues + 1 where id = new.post_id;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists post_views_count_trigger on post_views;
create trigger post_views_count_trigger
  after insert on post_views
  for each row execute function bump_post_views_count();

notify pgrst, 'reload schema';
