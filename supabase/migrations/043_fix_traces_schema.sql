-- =============================================================================
-- PISTE — répare la table "traces" : 001_init.sql l'avait déjà créée avec un
-- schéma différent, donc 024_traces.sql ("create table traces ...", sans
-- "if not exists") a très probablement échoué avec "relation traces already
-- exists" chez vous — et tout le reste de ce script (colonnes media_path /
-- duration_seconds, policies de confidentialité, notification "new_trace")
-- n'a alors jamais été appliqué. Résultat : la table réellement en base a le
-- schéma de 001_init (media_type limité à 'image'/'video', pas de
-- media_path ni duration_seconds), incompatible avec ce que le code envoie
-- (traceService.createTrace insère media_path, duration_seconds et
-- media_type = 'photo'/'video') → l'insertion échoue systématiquement, d'où
-- "impossible de publier une Trace".
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
-- =============================================================================

-- --- Colonnes manquantes (schéma 001_init → schéma attendu par le code) ----
alter table traces add column if not exists media_path text;
alter table traces add column if not exists duration_seconds integer not null default 6;

-- --- media_type : 001_init n'autorisait que 'image'/'video', le code envoie
-- 'photo'/'video' — élargit la contrainte pour accepter les deux formes
-- (aucune ligne existante n'est renommée, juste plus permissif).
alter table traces drop constraint if exists traces_media_type_check;
alter table traces add constraint traces_media_type_check
  check (media_type in ('image', 'photo', 'video'));

-- --- Confidentialité : la policy de lecture de 001_init ignorait les
-- comptes privés (is_private / follows) — remplace par la version alignée
-- sur les publications (020_private_accounts.sql), comme prévu par 024.
drop policy if exists "active or own traces readable" on traces;
drop policy if exists "trace readable if active and not private or approved" on traces;
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

-- --- trace_views : 001_init ne laissait pas un viewer relire sa propre
-- ligne de vue (seul l'auteur de la Trace pouvait tout lire) — sans cette
-- policy, le "vu" ne remonte jamais côté viewer dans la jointure trace_views
-- embarquée par TRACE_SELECT.
drop policy if exists "author reads own trace views" on trace_views;
drop policy if exists "viewer or trace author reads views" on trace_views;
create policy "viewer or trace author reads views" on trace_views
  for select using (
    auth.uid() = viewer_id
    or exists (select 1 from traces t where t.id = trace_views.trace_id and t.author_id = auth.uid())
  );

-- --- Notification "nouvelle Trace" (014 puis 024 étendaient la liste des
-- types de notifications — rejoue l'ajout de 'new_trace' au cas où 024 ait
-- échoué avant d'y arriver).
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

notify pgrst, 'reload schema';
