-- =============================================================================
-- PISTE — trigger de création automatique du profil
-- =============================================================================
-- À exécuter manuellement dans l'éditeur SQL de votre projet Supabase
-- (Dashboard > SQL Editor > New query > coller ce fichier > Run),
-- APRÈS 001_init.sql.
--
-- Rôle : dès qu'une ligne est insérée dans auth.users (i.e. supabase.auth.signUp()),
-- ce trigger crée automatiquement la ligne profiles correspondante à partir des
-- métadonnées passées dans `options.data` de signUp(). Remplace l'insert manuel
-- que faisait auparavant le code React/JS côté client dans authService.js.
--
-- SECURITY DEFINER : la fonction s'exécute avec les droits de son propriétaire
-- (postgres), ce qui lui permet d'écrire dans profiles malgré la policy RLS
-- "users can insert their own profile once" (auth.uid() n'est pas défini de la
-- même façon dans le contexte d'un trigger système).
--
-- IMPORTANT (constaté le 2026-08-16 sur le projet réel) : un trigger nommé
-- "on_auth_user_created" existe déjà sur auth.users et appelle déjà une fonction
-- public.handle_new_user() — mais celle-ci ne faisait que logger les métadonnées
-- dans une table de debug (debug_signup_log), sans jamais créer de profil.
-- On ne recrée donc PAS le trigger (create trigger n'est pas idempotent et
-- plante si le nom existe déjà) : on se contente de remplacer le corps de la
-- fonction avec CREATE OR REPLACE FUNCTION, qui lui est bien ré-exécutable.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, date_naissance, region, departement)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (new.raw_user_meta_data ->> 'date_naissance')::date,
    new.raw_user_meta_data ->> 'region',
    new.raw_user_meta_data ->> 'departement'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Le trigger existe déjà en base sous ce nom et appelle déjà cette fonction —
-- rien à faire de plus ici. Si vous appliquez ce fichier sur une base qui n'a
-- JAMAIS eu ce trigger, décommentez les lignes ci-dessous :
--
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();

-- Rappel : si l'insert échoue (username déjà pris, âge < 14 ans via la contrainte
-- min_age_14, date_naissance manquante...), toute la transaction — y compris la
-- création de la ligne auth.users — est annulée par Postgres. signUp() renverra
-- alors une erreur côté client (authError), il n'y aura pas de compte "orphelin"
-- sans profil.
