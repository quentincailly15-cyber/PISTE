-- =============================================================================
-- PISTE — notifications manquantes/mal dirigées pour les demandes d'abonnement
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : deux trous dans le flux "compte privé" (020_private_accounts.sql) :
-- 1. Créer une demande d'abonnement (follow_requests) ne notifiait jamais le
--    propriétaire du compte privé — il ne le voyait qu'en ouvrant lui-même
--    son profil (incomingRequestsCount côté client), pas de cloche.
-- 2. approve_follow_request() insère dans `follows`, ce qui déclenche
--    notify_on_follow (014_notifications_triggers.sql) — mais cette ligne a
--    pour follower_id le DEMANDEUR et pour followed_id la CIBLE (qui vient
--    d'approuver elle-même). Le trigger notifie donc la cible qu'elle a été
--    suivie par le demandeur — c'est-à-dire qu'il notifie la personne de sa
--    propre action, pendant que le vrai destinataire (le demandeur, qui
--    attendait une réponse) ne reçoit jamais rien.
-- =============================================================================

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('like','comment','follow','follow_request','follow_accepted','mention','group_invite','moderation','system','repost','message','new_post','new_trace'));

-- 1. Notifie le propriétaire du compte privé dès qu'une demande arrive.
create or replace function notify_on_follow_request() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  values (new.target_id, 'follow_request', new.requester_id, 'user', new.requester_id);
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists notify_follow_request_trigger on follow_requests;
create trigger notify_follow_request_trigger after insert on follow_requests
  for each row execute function notify_on_follow_request();

-- 2. Notifie le VRAI destinataire (le demandeur) une fois sa demande
-- approuvée — notify_on_follow continue de se déclencher sur l'insert dans
-- `follows` (redondant pour la cible qui vient d'agir, mais inoffensif) ; ce
-- qui manquait est ajouté ici explicitement.
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
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  values (req.requester_id, 'follow_accepted', req.target_id, 'user', req.target_id);
end;
$$ language plpgsql security definer;

notify pgrst, 'reload schema';
