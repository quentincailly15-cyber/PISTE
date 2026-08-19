-- =============================================================================
-- PISTE — notification quand un message est liké (réaction cœur)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : message_reactions (038_message_replies_and_reactions.sql) existe
-- depuis longtemps côté données, mais ne déclenchait jamais de notification —
-- l'auteur du message n'était prévenu d'aucune façon qu'on avait aimé son
-- message. Même pattern que les autres triggers de notification
-- (014_notifications_triggers.sql) : SECURITY DEFINER, après insert.
--
-- target_type = 'conversation' (pas 'message') : la notification amène sur
-- la conversation, exactement comme les notifications "message"/
-- "group_invite" déjà existantes (voir NotificationsPanel.open côté
-- interface, qui route déjà génériquement tout target_type='conversation'
-- vers onOpenConversation — aucun changement nécessaire à ce routage).
-- =============================================================================

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('like','comment','follow','follow_request','follow_accepted','mention','group_invite','moderation','system','repost','message','new_post','new_trace','message_reaction'));

create or replace function notify_on_message_reaction() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  select m.sender_id, 'message_reaction', m.conversation_id, 'conversation', new.user_id
  from messages m
  where m.id = new.message_id and m.sender_id <> new.user_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists notify_message_reaction_trigger on message_reactions;
create trigger notify_message_reaction_trigger after insert on message_reactions
  for each row execute function notify_on_message_reaction();
