-- =============================================================================
-- PISTE — likes sur les commentaires
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : jusqu'ici seules les publications pouvaient être likées (table
-- "likes"). Nouvelle table dédiée aux commentaires — même principe que
-- group_discussion_message_likes (046) : clé primaire (comment_id, user_id),
-- empêche tout double-like.
--
-- Lecture gardée par is_post_visible() (056/058/059), exactement comme
-- comments/post_media/likes eux-mêmes — un like sur un commentaire d'un post
-- privé/restreint ne doit pas être lisible en dehors de ce que verrait déjà
-- le post lui-même.
-- =============================================================================

create table if not exists comment_likes (
  comment_id  uuid not null references comments(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table comment_likes enable row level security;

create policy "comment likes readable if post visible" on comment_likes
  for select using (
    exists (
      select 1 from comments c
      where c.id = comment_id and is_post_visible(c.post_id, auth.uid())
    )
  );

create policy "user manages own comment like" on comment_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
