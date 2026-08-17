-- =============================================================================
-- PISTE — répondre à un message précis + réaction "cœur" (double-tap)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : deux ajouts à la messagerie.
--  1. reply_to_id : un message peut citer un message précédent (réponse
--     ciblée), comme dans n'importe quelle app de messagerie moderne.
--  2. message_reactions : réagir à un message (double-tap = cœur, façon
--     Instagram) — table générique (emoji libre) même si seul le cœur est
--     câblé côté interface pour l'instant, pour ne pas avoir à remodeler le
--     schéma le jour où d'autres réactions sont demandées.
-- =============================================================================

alter table messages add column if not exists reply_to_id uuid references messages(id) on delete set null;

create table if not exists message_reactions (
  message_id  uuid not null references messages(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  emoji       text not null default '❤️',
  created_at  timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table message_reactions enable row level security;

-- Même principe que les messages eux-mêmes : seuls les membres de la
-- conversation concernée peuvent lire/écrire (is_conversation_member,
-- migration 013).
drop policy if exists "member reads reactions of own conversations" on message_reactions;
create policy "member reads reactions of own conversations" on message_reactions
  for select using (
    exists (select 1 from messages m where m.id = message_id and is_conversation_member(m.conversation_id, auth.uid()))
  );

drop policy if exists "member manages own reaction" on message_reactions;
create policy "member manages own reaction" on message_reactions
  for all using (auth.uid() = user_id) with check (
    auth.uid() = user_id
    and exists (select 1 from messages m where m.id = message_id and is_conversation_member(m.conversation_id, auth.uid()))
  );

-- Realtime : la réaction de l'autre personne doit apparaître en direct.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions'
  ) then
    alter publication supabase_realtime add table message_reactions;
  end if;
end $$;

notify pgrst, 'reload schema';
