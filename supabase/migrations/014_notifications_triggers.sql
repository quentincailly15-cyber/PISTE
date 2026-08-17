-- =============================================================================
-- PISTE — notifications réelles (likes, commentaires, follows, reposts,
-- messages, ajout à un groupe de messagerie, nouvelle publication d'un
-- compte "cloché")
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- 001_init.sql contenait déjà la table `notifications` et un trigger pour les
-- likes (notify_on_like) — jamais branché à l'interface, jamais complété pour
-- les autres événements. On réutilise exactement le même pattern (trigger
-- SECURITY DEFINER après insert) pour chaque nouvel événement, plutôt que de
-- construire un système différent.
-- =============================================================================

-- La contrainte CHECK d'origine n'autorisait pas 'repost'/'message'/'new_post'.
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('like','comment','follow','mention','group_invite','moderation','system','repost','message','new_post'));

-- notifications n'avait aucune colonne pour identifier QUI a fait l'action
-- (seulement le contenu concerné) — une notification "quelqu'un a aimé votre
-- post" sans savoir qui n'est pas exploitable côté interface.
alter table notifications add column if not exists actor_id uuid references profiles(id) on delete cascade;

-- Le trigger notify_on_like d'origine (001_init.sql) ne remplissait pas
-- encore actor_id — on le corrige au passage.
create or replace function notify_on_like() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  select author_id, 'like', new.post_id, 'post', new.user_id
  from posts where id = new.post_id and author_id <> new.user_id;
  return new;
end;
$$ language plpgsql security definer;

-- --- Commentaire -------------------------------------------------------
create or replace function notify_on_comment() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  select author_id, 'comment', new.post_id, 'post', new.author_id
  from posts where id = new.post_id and author_id <> new.author_id;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists notify_comment_trigger on comments;
create trigger notify_comment_trigger after insert on comments
  for each row execute function notify_on_comment();

-- --- Nouvel abonné -------------------------------------------------------
create or replace function notify_on_follow() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  values (new.followed_id, 'follow', new.follower_id, 'user', new.follower_id);
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists notify_follow_trigger on follows;
create trigger notify_follow_trigger after insert on follows
  for each row execute function notify_on_follow();

-- --- Repost --------------------------------------------------------------
create or replace function notify_on_repost() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  select author_id, 'repost', new.post_id, 'post', new.user_id
  from posts where id = new.post_id and author_id <> new.user_id;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists notify_repost_trigger on reposts;
create trigger notify_repost_trigger after insert on reposts
  for each row execute function notify_on_repost();

-- --- Nouveau message -------------------------------------------------------
create or replace function notify_on_message() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  select cm.user_id, 'message', new.conversation_id, 'conversation', new.sender_id
  from conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id
    and cm.left_at is null;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists notify_message_trigger on messages;
create trigger notify_message_trigger after insert on messages
  for each row execute function notify_on_message();

-- --- Ajout à un groupe de messagerie ----------------------------------
-- Ne notifie que si quelqu'un D'AUTRE vous ajoute (pas votre propre ajout en
-- tant que créateur) et seulement pour les conversations de type "group".
create or replace function notify_on_group_invite() returns trigger as $$
begin
  if new.user_id <> auth.uid() and exists (select 1 from conversations where id = new.conversation_id and type = 'group') then
    insert into notifications (user_id, type, target_id, target_type, actor_id)
    values (new.user_id, 'group_invite', new.conversation_id, 'conversation', auth.uid());
  end if;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists notify_group_invite_trigger on conversation_members;
create trigger notify_group_invite_trigger after insert on conversation_members
  for each row execute function notify_on_group_invite();

-- --- Nouvelle publication d'un compte "cloché" ----------------------------
-- Réutilise follows.notifications_enabled (déjà présent dans 001_init.sql,
-- jamais exploité) plutôt que de créer une nouvelle table pour la "cloche".
create or replace function notify_on_new_post() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  select f.follower_id, 'new_post', new.id, 'post', new.author_id
  from follows f
  where f.followed_id = new.author_id and f.notifications_enabled = true;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists notify_new_post_trigger on posts;
create trigger notify_new_post_trigger after insert on posts
  for each row execute function notify_on_new_post();

-- --- Realtime : les notifications doivent apparaître sans recharger --------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
