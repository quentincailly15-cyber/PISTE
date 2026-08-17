-- =============================================================================
-- PISTE — sondage réel (options + votes), intégré à "Publication"
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : le "Sondage" n'avait jamais de table dédiée — les options tapées
-- dans le formulaire n'étaient jamais enregistrées, il était donc impossible
-- de réellement voter. Le sondage reste stocké sous posts.type = 'sondage'
-- (comme avant, déjà traité comme un post normal partout dans le Fil) : seul
-- le formulaire de création change (l'option est maintenant proposée depuis
-- "Publication" plutôt que comme un type séparé).
-- =============================================================================

create table if not exists poll_options (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  texte       text not null,
  ordre       integer not null default 0
);
alter table poll_options enable row level security;

drop policy if exists "poll options publicly readable" on poll_options;
create policy "poll options publicly readable" on poll_options
  for select using (true);

drop policy if exists "author manages own poll options" on poll_options;
create policy "author manages own poll options" on poll_options
  for all using (
    exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid())
  ) with check (
    exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid())
  );

create table if not exists poll_votes (
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  option_id   uuid not null references poll_options(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table poll_votes enable row level security;

drop policy if exists "poll votes publicly readable" on poll_votes;
create policy "poll votes publicly readable" on poll_votes
  for select using (true);

drop policy if exists "user manages own poll vote" on poll_votes;
create policy "user manages own poll vote" on poll_votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- Bonus (même bundle "identifier quelqu'un") : notifier une personne
-- identifiée dans le texte d'une publication (@pseudo), sur le même modèle
-- que la migration 033 pour les commentaires. posts.mentions existe depuis
-- le début (001_init.sql) mais n'avait jamais de trigger associé.
-- =============================================================================
create or replace function notify_on_post_mention() returns trigger as $$
declare
  mention text;
  mentioned_id uuid;
begin
  if new.mentions is null or array_length(new.mentions, 1) is null then
    return new;
  end if;
  foreach mention in array new.mentions loop
    select id into mentioned_id from profiles where username = ltrim(mention, '@') limit 1;
    if mentioned_id is not null and mentioned_id <> new.author_id then
      insert into notifications (user_id, type, target_id, target_type, actor_id)
      values (mentioned_id, 'mention', new.id, 'post', new.author_id);
    end if;
  end loop;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists notify_post_mention_trigger on posts;
create trigger notify_post_mention_trigger after insert on posts
  for each row execute function notify_on_post_mention();

notify pgrst, 'reload schema';
