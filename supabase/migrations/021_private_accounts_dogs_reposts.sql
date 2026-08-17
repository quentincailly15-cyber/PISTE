-- =============================================================================
-- PISTE — comptes privés : étend la protection aux chiens et reposts
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
-- Nécessite d'avoir déjà exécuté 020_private_accounts.sql.
--
-- Rôle : 020_private_accounts.sql protégeait déjà les publications (`posts`)
-- d'un compte privé. Le profil public affiche aussi les chiens et les
-- reposts de la personne — sans le même resserrement, ces deux tables
-- restaient lisibles par n'importe qui même sur un compte privé.
-- =============================================================================

drop policy if exists "dogs publicly readable" on dogs;
create policy "dogs readable if not private or approved" on dogs
  for select using (
    auth.uid() = owner_id
    or (
      not exists (select 1 from profiles pr where pr.id = dogs.owner_id and pr.is_private)
      or exists (select 1 from follows f where f.follower_id = auth.uid() and f.followed_id = dogs.owner_id)
    )
  );

drop policy if exists "reposts publicly readable" on reposts;
create policy "reposts readable if not private or approved" on reposts
  for select using (
    auth.uid() = user_id
    or (
      not exists (select 1 from profiles pr where pr.id = reposts.user_id and pr.is_private)
      or exists (select 1 from follows f where f.follower_id = auth.uid() and f.followed_id = reposts.user_id)
    )
  );
