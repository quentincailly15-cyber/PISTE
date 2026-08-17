-- =============================================================================
-- PISTE — Carnet de chasse (strictement privé)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : journal personnel de sorties, jamais public. Contrairement aux
-- publications/Traces (visibles selon abonnement/confidentialité du compte),
-- le carnet n'a AUCUNE policy de lecture publique ou "abonné" — seul le
-- propriétaire peut lire, créer, modifier ou supprimer ses propres entrées,
-- point final. Le bucket Storage des photos est lui-même privé (public: false)
-- : une URL ne suffit pas à voir la photo, il faut une URL signée générée
-- pour le propriétaire authentifié (voir huntingLogService.js).
-- =============================================================================

create table hunting_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  date              date not null,
  lieu_nom          text,
  lieu_commune      text,
  -- Position volontairement approximative (pas de précision GPS fine) — le
  -- carnet ne doit jamais devenir une carte publique de territoires de chasse,
  -- et de toute façon rien ici n'est jamais exposé publiquement.
  lieu_lat          double precision,
  lieu_lng          double precision,
  type_sortie       text not null check (type_sortie in ('chasse','reperage','entrainement_chien','observation','autre')),
  avec_chien        boolean not null default false,
  dog_id            uuid references dogs(id) on delete set null,
  espece            text,
  observation       text,
  resultat          text,
  duree_minutes     integer,
  nombre_personnes  integer,
  meteo             text,
  temperature       numeric,
  terrain           text,
  distance_km       numeric,
  nombre_prises     integer,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table hunting_logs enable row level security;

-- Une seule règle, volontairement stricte : le propriétaire, rien d'autre.
create policy "owner manages own hunting logs" on hunting_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table hunting_log_photos (
  id          uuid primary key default gen_random_uuid(),
  log_id      uuid not null references hunting_logs(id) on delete cascade,
  path        text not null, -- chemin Storage brut (bucket privé "carnet") — pas d'URL publique stockée
  ordre       integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table hunting_log_photos enable row level security;

create policy "owner manages own hunting log photos" on hunting_log_photos
  for all using (
    exists (select 1 from hunting_logs hl where hl.id = hunting_log_photos.log_id and hl.user_id = auth.uid())
  ) with check (
    exists (select 1 from hunting_logs hl where hl.id = hunting_log_photos.log_id and hl.user_id = auth.uid())
  );

-- updated_at tenu à jour automatiquement à chaque modification (pratique pour
-- distinguer "créé le" de "modifié le" plus tard si besoin côté interface).
create or replace function touch_hunting_log_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
drop trigger if exists hunting_logs_touch_updated_at on hunting_logs;
create trigger hunting_logs_touch_updated_at before update on hunting_logs
  for each row execute function touch_hunting_log_updated_at();

-- --- Stockage des photos privées --------------------------------------------
-- Bucket "carnet" : public = false. Contrairement aux buckets "posts"/
-- "groups"/"conversations" (public par nature), une simple URL ne doit jamais
-- suffire à voir une photo du carnet — il faut être authentifié en tant que
-- propriétaire pour qu'une URL signée temporaire puisse même être générée.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('carnet', 'carnet', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Chemin attendu : {user_id}/{log_id}/{index}-{nom_fichier}.
create policy "owner reads own carnet photos" on storage.objects for select
  using (bucket_id = 'carnet' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "owner uploads own carnet photos" on storage.objects for insert
  with check (bucket_id = 'carnet' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "owner updates own carnet photos" on storage.objects for update
  using (bucket_id = 'carnet' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "owner deletes own carnet photos" on storage.objects for delete
  using (bucket_id = 'carnet' and auth.uid()::text = (storage.foldername(name))[1]);
