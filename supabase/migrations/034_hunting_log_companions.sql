-- =============================================================================
-- PISTE — identifier de vrais comptes comme compagnons d'une sortie
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : jusqu'ici "Personnes présentes" n'était qu'un nombre. On ajoute une
-- vraie identification (recherche + sélection d'un compte PISTE réel, voir
-- UserPickerField dans App.jsx) — et la sortie doit alors apparaître aussi
-- dans le carnet du compagnon identifié, en lecture seule.
--
-- Le carnet reste strictement privé par défaut (025_carnet_chasse.sql) : on
-- élargit UNIQUEMENT la lecture de hunting_logs (jamais l'écriture — seul le
-- propriétaire modifie/supprime) aux compagnons identifiés sur cette sortie
-- précise. Les photos et les notes personnelles restent visibles du seul
-- propriétaire : hunting_log_photos garde sa policy d'origine inchangée
-- (impossible même de générer une URL signée sans être le propriétaire —
-- voir la policy Storage du bucket "carnet"), et App.jsx retire notes/photos
-- côté client pour les entrées où l'utilisateur n'est que compagnon.
-- =============================================================================

create table if not exists hunting_log_companions (
  log_id      uuid not null references hunting_logs(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (log_id, user_id)
);
alter table hunting_log_companions enable row level security;

-- Le propriétaire de la sortie gère librement la liste des compagnons.
drop policy if exists "owner manages log companions" on hunting_log_companions;
create policy "owner manages log companions" on hunting_log_companions
  for all using (
    exists (select 1 from hunting_logs hl where hl.id = log_id and hl.user_id = auth.uid())
  ) with check (
    exists (select 1 from hunting_logs hl where hl.id = log_id and hl.user_id = auth.uid())
  );

-- Un compagnon doit pouvoir lire sa propre ligne de tag, sinon il ne saurait
-- même pas qu'il a été identifié sur une sortie (nécessaire pour que
-- hunting_logs.select ci-dessous fonctionne également, RLS oblige).
drop policy if exists "companion reads own tag" on hunting_log_companions;
create policy "companion reads own tag" on hunting_log_companions
  for select using (auth.uid() = user_id);

-- hunting_logs (025_carnet_chasse.sql) n'avait qu'une seule policy "for all"
-- réservée au propriétaire — on la scinde pour élargir uniquement la LECTURE
-- aux compagnons identifiés, sans jamais leur donner de droit d'écriture.
drop policy if exists "owner manages own hunting logs" on hunting_logs;

create policy "owner and companions read hunting logs" on hunting_logs
  for select using (
    auth.uid() = user_id
    or exists (select 1 from hunting_log_companions hlc where hlc.log_id = id and hlc.user_id = auth.uid())
  );

create policy "owner inserts own hunting logs" on hunting_logs
  for insert with check (auth.uid() = user_id);

create policy "owner updates own hunting logs" on hunting_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner deletes own hunting logs" on hunting_logs
  for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
