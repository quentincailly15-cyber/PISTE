-- =============================================================================
-- PISTE — système de repost
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : 001_init.sql n'avait pas de table pour reposter un contenu existant.
-- On stocke une simple relation (user_id, post_id) — pas de duplication du
-- contenu original — et un compteur dénormalisé sur `posts` (même pattern que
-- likes_count/comments_count) maintenu par trigger.
-- =============================================================================

alter table posts add column if not exists reposts_count integer not null default 0;

create table reposts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  post_id     uuid not null references posts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, post_id)
);
alter table reposts enable row level security;

create policy "reposts publicly readable" on reposts for select using (true);
create policy "user manages own reposts" on reposts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function bump_reposts_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set reposts_count = reposts_count + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set reposts_count = greatest(0, reposts_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;
create trigger reposts_count_trigger
  after insert or delete on reposts
  for each row execute function bump_reposts_count();
