-- =============================================================================
-- PISTE — rattrape la relation reply_to_id si la migration 038 ne l'a pas
-- créée correctement (colonne ajoutée mais contrainte FK manquante, ou
-- migration jamais allée jusqu'au bout)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : "Could not find a relationship between 'messages' and 'messages'"
-- signifie que PostgREST ne trouve aucune contrainte de clé étrangère nommée
-- messages_reply_to_id_fkey — soit parce que la colonne reply_to_id n'existe
-- pas du tout, soit parce qu'elle existe sans sa contrainte. On sépare les
-- deux étapes et on nomme la contrainte explicitement, pour ne dépendre
-- d'aucune supposition sur ce que 038 a réellement exécuté chez vous.
-- =============================================================================

alter table messages add column if not exists reply_to_id uuid;

alter table messages drop constraint if exists messages_reply_to_id_fkey;
alter table messages add constraint messages_reply_to_id_fkey
  foreign key (reply_to_id) references messages(id) on delete set null;

-- Filet de sécurité : si 038 s'est arrêtée avant d'atteindre message_reactions
-- (transaction interrompue par l'erreur ci-dessus), on la rejoue ici aussi —
-- entièrement idempotent, sans risque si elle a déjà été créée avec succès.
create table if not exists message_reactions (
  message_id  uuid not null references messages(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  emoji       text not null default '❤️',
  created_at  timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table message_reactions enable row level security;

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
