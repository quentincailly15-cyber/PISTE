-- =============================================================================
-- PISTE — corrige les policies RLS de conversation_members pour la messagerie
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Problème : 001_init.sql n'avait qu'une seule policy "user manages own
-- membership" (for all, auth.uid() = user_id). Elle empêche un utilisateur
-- d'ajouter QUELQU'UN D'AUTRE à une conversation — impossible donc de démarrer
-- une conversation à deux (il faut y ajouter l'autre personne) ou un groupe de
-- messagerie (il faut y ajouter plusieurs amis).
--
-- Correction : on garde le principe (un utilisateur ne gère que sa propre
-- ligne pour update/delete — quitter une conversation), mais on autorise en
-- plus l'INSERT d'un tiers par un membre déjà présent dans la conversation
-- (nécessaire pour créer une conversation ou ajouter des membres à un groupe).
-- =============================================================================

drop policy if exists "user manages own membership" on conversation_members;

create policy "user updates own membership" on conversation_members
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user removes own membership" on conversation_members
  for delete using (auth.uid() = user_id);

create policy "member adds members to own conversations" on conversation_members
  for insert with check (
    auth.uid() = user_id
    or exists (
      select 1 from conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
      and cm.left_at is null
    )
  );
