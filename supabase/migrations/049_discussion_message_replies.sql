-- =============================================================================
-- PISTE — permet de répondre à un message précis dans une discussion de
-- communauté (comme les messages privés) et retire la possibilité de publier
-- un Instant depuis une communauté (repli sur Publication/Discussion).
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
-- =============================================================================

alter table group_discussion_messages add column if not exists reply_to_id uuid;

alter table group_discussion_messages drop constraint if exists group_discussion_messages_reply_to_id_fkey;
alter table group_discussion_messages add constraint group_discussion_messages_reply_to_id_fkey
  foreign key (reply_to_id) references group_discussion_messages(id) on delete set null;

notify pgrst, 'reload schema';
