-- =============================================================================
-- PISTE — centres d'intérêt réellement persistés (Fil "Pour toi")
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Constat (vérification de l'algorithme du Fil, demandée explicitement) :
-- l'onboarding (StepInterests) et "Modifier le profil" laissaient tous deux
-- choisir des centres d'intérêt, mais aucun des deux ne les envoyait jamais à
-- Supabase — signUp() ne les incluait pas dans les métadonnées, et
-- updateProfile() ne les incluait pas dans son payload. La colonne n'existait
-- même pas. Résultat : `profile.interets` valait toujours `[]` pour tout
-- compte réel après la première reconnexion, et le signal "interestMatch" du
-- Fil "Pour toi" (poids 1.5) ne s'est donc jamais réellement déclenché en
-- production, malgré le texte "Votre fil personnalisé apparaîtra ici selon
-- vos centres d'intérêt." La logique de scoring elle-même était correcte —
-- seule l'alimentation en données réelles manquait.
-- =============================================================================

alter table public.profiles
  add column if not exists interets text[] not null default '{}'::text[];

-- Étend le trigger de création de profil (voir 002_profile_trigger.sql) pour
-- lire les centres d'intérêt choisis pendant l'onboarding, envoyés par
-- signUp() sous `options.data.interets` (tableau JSON, converti en text[]).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, date_naissance, region, departement, interets)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (new.raw_user_meta_data ->> 'date_naissance')::date,
    new.raw_user_meta_data ->> 'region',
    new.raw_user_meta_data ->> 'departement',
    coalesce(
      (select array_agg(value) from jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'interets', '[]'::jsonb))),
      '{}'::text[]
    )
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

notify pgrst, 'reload schema';
