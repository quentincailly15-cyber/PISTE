-- =============================================================================
-- PISTE — identifier quelqu'un dans un commentaire (@mention réelle)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : jusqu'ici, "@pseudo" dans un commentaire n'était que du texte —
-- jamais stocké à part, jamais notifié à la personne concernée. Le pseudo
-- est maintenant choisi via une vraie recherche de compte (voir
-- MentionPickerButton, App.jsx), donc toujours réel — cette migration
-- ajoute la colonne qui le mémorise et la notification qui en découle.
-- =============================================================================

alter table comments add column if not exists mentions text[] not null default '{}';

create or replace function notify_on_comment_mention() returns trigger as $$
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
      values (mentioned_id, 'mention', new.post_id, 'post', new.author_id);
    end if;
  end loop;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists notify_comment_mention_trigger on comments;
create trigger notify_comment_mention_trigger after insert on comments
  for each row execute function notify_on_comment_mention();
