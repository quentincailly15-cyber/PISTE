-- =============================================================================
-- PISTE — corrige la récursion infinie des policies du carnet de chasse
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Bug : "infinite recursion detected in policy for relation hunting_logs"
-- au moment d'ajouter une sortie au carnet. Cause : 034_hunting_log_
-- companions.sql a introduit une policy sur hunting_logs qui fait une
-- sous-requête sur hunting_log_companions ("owner and companions read
-- hunting logs"), ET une policy sur hunting_log_companions qui fait une
-- sous-requête sur hunting_logs ("owner manages log companions") — les deux
-- tables se relisent l'une l'autre SOUS RLS, indéfiniment. Un simple insert
-- suffit à déclencher l'erreur dès que Supabase relit la ligne créée
-- (`.select()` après l'insert), qui passe par la policy de lecture récursive.
--
-- Correction standard (déjà utilisée pour ce même problème sur la
-- messagerie, voir 013_fix_conversation_rls_recursion.sql) : des fonctions
-- SECURITY DEFINER, qui contournent RLS en interne, remplacent les sous-
-- requêtes directes qui provoquaient la boucle.
-- =============================================================================

create or replace function public.is_hunting_log_owner(p_log_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from hunting_logs where id = p_log_id and user_id = p_uid
  );
$$;

create or replace function public.is_hunting_log_companion(p_log_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from hunting_log_companions where log_id = p_log_id and user_id = p_uid
  );
$$;

-- --- hunting_log_companions --------------------------------------------
drop policy if exists "owner manages log companions" on hunting_log_companions;
create policy "owner manages log companions" on hunting_log_companions
  for all using (is_hunting_log_owner(log_id, auth.uid()))
  with check (is_hunting_log_owner(log_id, auth.uid()));

-- "companion reads own tag" (034) ne touche pas à hunting_logs, inchangée.

-- --- hunting_logs --------------------------------------------------------
drop policy if exists "owner and companions read hunting logs" on hunting_logs;
create policy "owner and companions read hunting logs" on hunting_logs
  for select using (
    auth.uid() = user_id
    or is_hunting_log_companion(id, auth.uid())
  );

-- "owner inserts/updates/deletes own hunting logs" (034) ne touchent pas à
-- hunting_log_companions, inchangées.

notify pgrst, 'reload schema';
