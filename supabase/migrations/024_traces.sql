-- =============================================================================
-- PISTE — TRACE (stories éphémères 24h)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
-- Nécessite d'avoir déjà exécuté 020_private_accounts.sql (comptes privés +
-- table follow_requests) — les policies ci-dessous réutilisent `is_private`
-- et `follows`, exactement comme les publications (020) et les chiens/reposts
-- (021).
--
-- Rôle : nouveau type de contenu "Trace" — une publication temporaire (photo
-- ou vidéo) visible 24h. Réutilise volontairement :
--   - la table `profiles` et `follows` pour la visibilité (pas de système de
--     followers parallèle) ;
--   - le bucket Storage "posts" déjà créé (003_storage_posts_bucket.sql) —
--     ses policies autorisent déjà l'upload/suppression dans le dossier
--     {user_id}/... de chacun, donc aucune nouvelle policy Storage n'est
--     nécessaire ici ;
--   - le système de notifications (014_notifications_triggers.sql), avec le
--     même mécanisme de "cloche" (follows.notifications_enabled) que les
--     publications ("new_post").
--
-- Fiabilité de l'expiration : `expires_at` est calculé à l'insertion
-- (created_at + 24h) et CHAQUE requête de lecture filtre explicitement
-- `expires_at > now()` — une Trace expirée n'est donc jamais "active" même
-- si la ligne n'a pas encore été supprimée physiquement (aucun processus de
-- nettoyage automatique n'est mis en place ici : voir le rapport final pour
-- le détail de cette limite assumée).
-- =============================================================================

create table traces (
  id                uuid primary key default gen_random_uuid(),
  author_id         uuid not null references profiles(id) on delete cascade,
  media_url         text not null,
  media_path        text not null, -- chemin Storage brut ({user_id}/trace-...), pour une vraie suppression du fichier
  media_type        text not null check (media_type in ('photo','video')),
  duration_seconds  integer not null default 6,
  texte             text,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null default (now() + interval '24 hours')
);
alter table traces enable row level security;

-- Mêmes règles de visibilité que les publications (020_private_accounts.sql) :
-- toujours visible par son auteur ; sinon visible si le compte n'est pas
-- privé, ou si le compte est privé mais que je suis un abonné déjà approuvé —
-- ET seulement si elle n'est pas expirée.
create policy "trace readable if active and not private or approved" on traces
  for select using (
    auth.uid() = author_id
    or (
      expires_at > now()
      and (
        not exists (select 1 from profiles pr where pr.id = traces.author_id and pr.is_private)
        or exists (select 1 from follows f where f.follower_id = auth.uid() and f.followed_id = traces.author_id)
      )
    )
  );

create policy "author creates own trace" on traces
  for insert with check (auth.uid() = author_id);

create policy "author deletes own trace" on traces
  for delete using (auth.uid() = author_id);

create table trace_views (
  trace_id    uuid not null references traces(id) on delete cascade,
  viewer_id   uuid not null references profiles(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  primary key (trace_id, viewer_id)
);
alter table trace_views enable row level security;

create policy "viewer records own view" on trace_views
  for insert with check (auth.uid() = viewer_id);

-- Un viewer ne voit que sa propre ligne de vue ; l'auteur de la Trace voit
-- TOUTES les vues de sa Trace (liste "vu par" + compteur).
create policy "viewer or trace author reads views" on trace_views
  for select using (
    auth.uid() = viewer_id
    or exists (select 1 from traces t where t.id = trace_views.trace_id and t.author_id = auth.uid())
  );

-- --- Notifications : nouvelle Trace d'un compte "cloché" -------------------
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('like','comment','follow','mention','group_invite','moderation','system','repost','message','new_post','new_trace'));

create or replace function notify_on_new_trace() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type, actor_id)
  select f.follower_id, 'new_trace', new.id, 'trace', new.author_id
  from follows f
  where f.followed_id = new.author_id and f.notifications_enabled = true;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists notify_new_trace_trigger on traces;
create trigger notify_new_trace_trigger after insert on traces
  for each row execute function notify_on_new_trace();
