-- =============================================================================
-- PISTE — vraie suppression de compte (Paramètres > Données)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : le bouton "Supprimer mon compte" existait déjà côté écran, mais son
-- propre texte prévenait que "la suppression réelle sera activée une fois le
-- backend connecté" — resté vrai depuis, jamais mis à jour. Supprimer une
-- ligne dans auth.users nécessite des droits élevés qu'on ne peut jamais
-- donner au client (ça reviendrait à exposer la clé service_role dans le
-- navigateur). La solution sûre : une fonction SECURITY DEFINER, appelée via
-- RPC par l'utilisateur authentifié, qui ne supprime QUE son propre compte
-- (auth.uid()). profiles.id référence déjà auth.users(id) on delete cascade
-- (001_init.sql), et toutes les tables qui dépendent de profiles.id sont
-- elles-mêmes en cascade — supprimer la ligne auth.users suffit donc à
-- effacer réellement le profil, les publications, messages, commentaires,
-- likes, chiens, carnet de chasse, etc.
-- =============================================================================

create or replace function delete_own_account() returns void as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;

-- N'importe quel utilisateur connecté peut s'appeler lui-même (auth.uid()
-- dans le corps de la fonction empêche déjà de cibler un autre compte) —
-- pas besoin d'être plus restrictif, l'exécution ne fait rien pour un
-- utilisateur non authentifié (auth.uid() vaudrait alors null).
grant execute on function delete_own_account() to authenticated;

notify pgrst, 'reload schema';
