-- =============================================================================
-- PISTE — vraies discussions de communauté : un fil avec un titre, dans
-- lequel les membres échangent des messages et peuvent en liker (distinct
-- des publications et des messages privés).
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
-- =============================================================================

create table if not exists group_discussions (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references groups(id) on delete cascade,
  author_id      uuid not null references profiles(id) on delete cascade,
  titre          text not null,
  messages_count integer not null default 0,
  created_at     timestamptz not null default now()
);
alter table group_discussions enable row level security;

drop policy if exists "group discussions publicly readable" on group_discussions;
create policy "group discussions publicly readable" on group_discussions for select using (true);
drop policy if exists "authenticated users create discussions" on group_discussions;
create policy "authenticated users create discussions" on group_discussions
  for insert with check (auth.uid() = author_id);
drop policy if exists "author or admin deletes discussion" on group_discussions;
create policy "author or admin deletes discussion" on group_discussions
  for delete using (auth.uid() = author_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create table if not exists group_discussion_messages (
  id             uuid primary key default gen_random_uuid(),
  discussion_id  uuid not null references group_discussions(id) on delete cascade,
  author_id      uuid not null references profiles(id) on delete cascade,
  texte          text not null,
  created_at     timestamptz not null default now()
);
alter table group_discussion_messages enable row level security;

drop policy if exists "discussion messages publicly readable" on group_discussion_messages;
create policy "discussion messages publicly readable" on group_discussion_messages for select using (true);
drop policy if exists "authenticated users post in discussions" on group_discussion_messages;
create policy "authenticated users post in discussions" on group_discussion_messages
  for insert with check (auth.uid() = author_id);
drop policy if exists "author or admin deletes discussion message" on group_discussion_messages;
create policy "author or admin deletes discussion message" on group_discussion_messages
  for delete using (auth.uid() = author_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create table if not exists group_discussion_message_likes (
  message_id  uuid not null references group_discussion_messages(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table group_discussion_message_likes enable row level security;

drop policy if exists "discussion message likes publicly readable" on group_discussion_message_likes;
create policy "discussion message likes publicly readable" on group_discussion_message_likes for select using (true);
drop policy if exists "user manages own discussion message like" on group_discussion_message_likes;
create policy "user manages own discussion message like" on group_discussion_message_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function bump_discussion_messages_count() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update group_discussions set messages_count = messages_count + 1 where id = new.discussion_id;
  elsif (tg_op = 'DELETE') then
    update group_discussions set messages_count = greatest(0, messages_count - 1) where id = old.discussion_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;
drop trigger if exists discussion_messages_count_trigger on group_discussion_messages;
create trigger discussion_messages_count_trigger
  after insert or delete on group_discussion_messages
  for each row execute function bump_discussion_messages_count();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_discussion_messages'
  ) then
    alter publication supabase_realtime add table group_discussion_messages;
  end if;
end $$;

notify pgrst, 'reload schema';
