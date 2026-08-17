-- =============================================================================
-- PISTE — corrige la récursion infinie des policies de messagerie
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Bug : la policy "member reads own membership rows" (001_init.sql) fait une
-- sous-requête sur conversation_members DEPUIS une policy sur cette même
-- table — Postgres réapplique la policy à la sous-requête, qui se rappelle
-- elle-même indéfiniment ("infinite recursion detected"). Les policies de
-- "conversations", "messages" et "message_media" référencent aussi
-- conversation_members et déclenchent la même cascade.
--
-- Correction standard (recommandée par la doc Supabase pour ce cas précis) :
-- une fonction SECURITY DEFINER, qui contourne RLS en interne, remplace les
-- sous-requêtes directes sur conversation_members dans toutes ces policies.
-- =============================================================================

create or replace function public.is_conversation_member(conv_id uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from conversation_members
    where conversation_id = conv_id and user_id = uid and left_at is null
  );
$$;

-- --- conversation_members -----------------------------------------------
drop policy if exists "member reads own membership rows" on conversation_members;
create policy "member reads own membership rows" on conversation_members
  for select using (is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "member adds members to own conversations" on conversation_members;
create policy "member adds members to own conversations" on conversation_members
  for insert with check (
    auth.uid() = user_id
    or is_conversation_member(conversation_id, auth.uid())
  );

-- --- conversations ---------------------------------------------------------
drop policy if exists "member reads own conversations" on conversations;
create policy "member reads own conversations" on conversations
  for select using (is_conversation_member(id, auth.uid()));

-- --- messages ----------------------------------------------------------
drop policy if exists "member reads conversation messages" on messages;
create policy "member reads conversation messages" on messages
  for select using (is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "member sends messages" on messages;
create policy "member sends messages" on messages
  for insert with check (auth.uid() = sender_id and is_conversation_member(conversation_id, auth.uid()));

-- --- message_media -------------------------------------------------------
drop policy if exists "member reads media of own conversations" on message_media;
create policy "member reads media of own conversations" on message_media
  for select using (
    exists (select 1 from messages m where m.id = message_media.message_id and is_conversation_member(m.conversation_id, auth.uid()))
  );
