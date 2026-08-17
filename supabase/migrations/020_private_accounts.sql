-- =============================================================================
-- PISTE — comptes privés + demandes d'abonnement
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : Paramètres > Confidentialité affichait déjà un bouton "Privé", mais
-- ce réglage n'était qu'un état local React — jamais enregistré, jamais lu
-- nulle part. Résultat : passer un compte en "Privé" ne changeait rien du
-- tout. Cette migration ajoute une vraie colonne `is_private` sur le profil
-- et une table de demandes d'abonnement en attente d'approbation.
-- =============================================================================

alter table profiles add column if not exists is_private boolean not null default false;

create table follow_requests (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references profiles(id) on delete cascade,
  target_id     uuid not null references profiles(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at    timestamptz not null default now(),
  unique (requester_id, target_id),
  check (requester_id <> target_id)
);
alter table follow_requests enable row level security;
create policy "requester creates own request" on follow_requests for insert with check (auth.uid() = requester_id);
create policy "requester or target reads request" on follow_requests for select using (auth.uid() = requester_id or auth.uid() = target_id);
create policy "requester cancels own pending request" on follow_requests for delete using (auth.uid() = requester_id);

-- `follows` (001_init.sql) n'autorise que le follower à insérer sa propre ligne
-- (auth.uid() = follower_id). Or l'approbation est une action de la CIBLE, pas
-- du demandeur — elle ne peut donc pas insérer directement dans `follows`.
-- Ces deux fonctions SECURITY DEFINER vérifient que l'appelant est bien la
-- cible de la demande avant d'agir (même principe que is_conversation_member,
-- 013_fix_conversation_rls_recursion.sql).
create or replace function approve_follow_request(request_id uuid) returns void as $$
declare
  req follow_requests%rowtype;
begin
  select * into req from follow_requests where id = request_id and target_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'Demande introuvable ou déjà traitée';
  end if;
  update follow_requests set status = 'approved' where id = request_id;
  insert into follows (follower_id, followed_id) values (req.requester_id, req.target_id)
    on conflict (follower_id, followed_id) do nothing;
end;
$$ language plpgsql security definer;

create or replace function reject_follow_request(request_id uuid) returns void as $$
begin
  update follow_requests set status = 'rejected'
  where id = request_id and target_id = auth.uid() and status = 'pending';
end;
$$ language plpgsql security definer;

-- Sans ça, "compte privé" ne serait qu'un habillage côté écran : n'importe qui
-- pourrait toujours lire les publications d'un compte privé directement via
-- l'API (fetchUserPosts). On resserre donc la policy SELECT de `posts` :
-- l'auteur d'un compte privé n'est visible que par lui-même ou par ses
-- abonnés déjà approuvés (table `follows`).
drop policy if exists "posts readable if not restricted" on posts;
create policy "posts readable if not restricted or private" on posts
  for select using (
    auth.uid() = author_id
    or (
      content_rating <> 'restricted'
      and (
        not exists (select 1 from profiles pr where pr.id = posts.author_id and pr.is_private)
        or exists (select 1 from follows f where f.follower_id = auth.uid() and f.followed_id = posts.author_id)
      )
    )
  );
