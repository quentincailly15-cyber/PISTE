-- =============================================================================
-- PISTE — schéma initial (Postgres / Supabase)
-- =============================================================================
-- À exécuter manuellement dans l'éditeur SQL de votre projet Supabase
-- (Dashboard > SQL Editor > New query > coller ce fichier > Run).
-- Ce fichier n'a jamais été exécuté depuis cette conversation : aucun accès
-- réseau, aucune base réelle connue. Il est correct et prêt à l'emploi, mais
-- reste à valider par vous sur votre propre projet avant tout usage en
-- production (relire notamment les policies RLS ci-dessous).
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILES (1-1 avec auth.users, géré nativement par Supabase Auth)
-- ---------------------------------------------------------------------------
create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  username              text unique not null check (char_length(username) between 3 and 24),
  nom                   text,
  avatar_url            text,
  bio                   text,
  region                text,
  departement           text,
  date_naissance        date not null,
  localisation_visible  boolean not null default false,
  role                  text not null default 'user' check (role in ('user','moderator','admin')),
  badges                text[] not null default '{}',
  verification_status   jsonb not null default '{"verified": false, "type": null, "source": null, "verifiedAt": null, "active": false}',
  created_at            timestamptz not null default now()
);

-- Contrainte d'âge minimum appliquée en base, pas seulement en React.
alter table profiles add constraint min_age_14
  check (date_part('year', age(date_naissance)) >= 14);

alter table profiles enable row level security;

create policy "profiles are publicly readable" on profiles
  for select using (true);

create policy "users can update their own profile" on profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- un utilisateur ne peut jamais modifier ces colonnes lui-même :
    and role = (select role from profiles where id = auth.uid())
    and badges = (select badges from profiles where id = auth.uid())
    and verification_status = (select verification_status from profiles where id = auth.uid())
  );

create policy "users can insert their own profile once" on profiles
  for insert with check (auth.uid() = id);

-- Statut "mineur" calculé à la volée (pas stocké : `age()` dépend de la date
-- du jour donc n'est pas "immutable", ce que Postgres exige pour une colonne
-- générée STORED — erreur 42P17 sinon). Un booléen stocké deviendrait de
-- toute façon obsolète au fil du temps (l'utilisateur finit par avoir 18 ans
-- sans que la ligne soit retouchée).
create or replace function est_mineur(date_naissance date) returns boolean as $$
  select date_part('year', age(date_naissance)) <= 17
$$ language sql stable;

-- Utilisation : select *, est_mineur(date_naissance) from profiles;

-- ---------------------------------------------------------------------------
-- DOGS
-- ---------------------------------------------------------------------------
create table dogs (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles(id) on delete cascade,
  nom           text not null,
  race          text,
  age           integer,
  sexe          text check (sexe in ('Mâle','Femelle')),
  specialite    text,
  description   text,
  photo_url     text,
  created_at    timestamptz not null default now()
);
alter table dogs enable row level security;
create policy "dogs publicly readable" on dogs for select using (true);
create policy "owner manages own dogs" on dogs for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- POSTS (couvre aussi les vidéos/Instants via la colonne `type`)
-- ---------------------------------------------------------------------------
create table posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references profiles(id) on delete cascade,
  type            text not null check (type in ('publication','photo','video','video_courte','discussion','sondage')),
  texte           text,
  animal          text,
  pratique        text,
  content_rating  text not null default 'normal' check (content_rating in ('normal','sensitive','restricted')),
  hashtags        text[] not null default '{}',
  mentions        text[] not null default '{}',
  departement     text,
  visibility      text not null default 'public' check (visibility in ('public','followers','private')),
  likes_count     integer not null default 0,
  comments_count  integer not null default 0,
  vues            integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table posts enable row level security;

create policy "posts readable if not restricted" on posts
  for select using (content_rating <> 'restricted' or auth.uid() = author_id);

create policy "author creates own posts" on posts
  for insert with check (auth.uid() = author_id);

-- La règle exigée par l'audit : jamais "post.nom === profile.nom" côté client,
-- toujours auth.uid() = author_id vérifié par Postgres lui-même.
create policy "author updates own posts" on posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "author deletes own posts" on posts
  for delete using (auth.uid() = author_id);

create table post_media (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references posts(id) on delete cascade,
  url       text not null,
  ordre     integer not null default 0,
  type      text not null check (type in ('image','video'))
);
alter table post_media enable row level security;
create policy "post_media readable with post" on post_media for select using (true);
create policy "author manages own post_media" on post_media for all
  using (auth.uid() = (select author_id from posts where id = post_id))
  with check (auth.uid() = (select author_id from posts where id = post_id));

create table post_dogs (
  post_id  uuid not null references posts(id) on delete cascade,
  dog_id   uuid not null references dogs(id) on delete cascade,
  primary key (post_id, dog_id)
);
alter table post_dogs enable row level security;
create policy "post_dogs readable" on post_dogs for select using (true);
create policy "author manages own post_dogs" on post_dogs for all
  using (auth.uid() = (select author_id from posts where id = post_id))
  with check (auth.uid() = (select author_id from posts where id = post_id));

-- ---------------------------------------------------------------------------
-- COMMENTS (avec réponses via parent_id)
-- ---------------------------------------------------------------------------
create table comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  parent_id   uuid references comments(id) on delete cascade,
  texte       text not null,
  created_at  timestamptz not null default now()
);
alter table comments enable row level security;
create policy "comments readable" on comments for select using (true);
create policy "author creates comments" on comments for insert with check (auth.uid() = author_id);
create policy "author manages own comments" on comments for update using (auth.uid() = author_id);
create policy "author deletes own comments" on comments for delete using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- LIKES / SAVES / FOLLOWS
-- ---------------------------------------------------------------------------
create table likes (
  user_id     uuid not null references profiles(id) on delete cascade,
  post_id     uuid not null references posts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table likes enable row level security;
create policy "likes readable" on likes for select using (true);
create policy "user manages own likes" on likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table saves (
  user_id     uuid not null references profiles(id) on delete cascade,
  post_id     uuid not null references posts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table saves enable row level security;
create policy "user reads own saves" on saves for select using (auth.uid() = user_id);
create policy "user manages own saves" on saves for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table follows (
  follower_id            uuid not null references profiles(id) on delete cascade,
  followed_id            uuid not null references profiles(id) on delete cascade,
  notifications_enabled  boolean not null default true,
  created_at             timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
alter table follows enable row level security;
create policy "follows readable" on follows for select using (true);
create policy "user manages own follows" on follows for all
  using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Triggers de compteurs (évite de recalculer likes/comments à chaque lecture)
create or replace function bump_likes_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;
create trigger likes_count_trigger
  after insert or delete on likes
  for each row execute function bump_likes_count();

create or replace function bump_comments_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;
create trigger comments_count_trigger
  after insert or delete on comments
  for each row execute function bump_comments_count();

-- ---------------------------------------------------------------------------
-- TRACES (stories 24h)
-- ---------------------------------------------------------------------------
create table traces (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references profiles(id) on delete cascade,
  media_url       text,
  media_type      text check (media_type in ('image','video')),
  texte           text,
  hashtags        text[] not null default '{}',
  mentions        text[] not null default '{}',
  departement     text,
  content_rating  text not null default 'normal' check (content_rating in ('normal','sensitive','restricted')),
  dog_id          uuid references dogs(id),
  visibility      text not null default 'public' check (visibility in ('public','followers')),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '24 hours')
);
alter table traces enable row level security;
create policy "active or own traces readable" on traces
  for select using (expires_at > now() or auth.uid() = author_id);
create policy "author manages own traces" on traces for all
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

create table trace_views (
  trace_id   uuid not null references traces(id) on delete cascade,
  viewer_id  uuid not null references profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (trace_id, viewer_id)
);
alter table trace_views enable row level security;
create policy "author reads own trace views" on trace_views
  for select using (auth.uid() = (select author_id from traces where id = trace_id));
create policy "viewer records own view" on trace_views
  for insert with check (auth.uid() = viewer_id);

create table trace_archives (
  trace_id     uuid not null references traces(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  archived_at  timestamptz not null default now(),
  primary key (trace_id, user_id)
);
alter table trace_archives enable row level security;
create policy "user manages own archives" on trace_archives for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- GROUPS
-- ---------------------------------------------------------------------------
create table groups (
  id               uuid primary key default gen_random_uuid(),
  nom              text not null,
  description      text,
  image_url        text,
  categorie        text,
  created_by       uuid references profiles(id),
  is_predefined    boolean not null default false,
  created_at       timestamptz not null default now()
);
alter table groups enable row level security;
create policy "groups publicly readable" on groups for select using (true);
create policy "authenticated users create groups" on groups
  for insert with check (auth.uid() is not null);
create policy "creator or admin updates group" on groups
  for update using (auth.uid() = created_by or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create table group_members (
  group_id   uuid not null references groups(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('member','admin')),
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table group_members enable row level security;
create policy "group_members readable" on group_members for select using (true);
create policy "user manages own membership" on group_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed des 24 catégories prédéfinies existantes côté frontend (PREDEFINED_GROUPS) :
-- à exécuter une fois, remplace la constante JS codée en dur.
insert into groups (nom, description, categorie, is_predefined) values
  ('Chevreuil', 'Approche, affût et suivi du chevreuil.', 'Chasse', true),
  ('Grand gibier', 'Cerf, chevreuil, sanglier : tout le grand gibier.', 'Chasse', true),
  ('Petit gibier', 'Lièvre, lapin, perdrix et compagnie.', 'Chasse', true),
  ('Sanglier', 'Battues, techniques et retours d''expérience.', 'Chasse', true),
  ('Gibier d''eau', 'Hutte, canards et chasse à la sauvagine.', 'Chasse', true),
  ('Gibier à plumes', 'Faisan, perdrix, bécasse et gibier ailé.', 'Chasse', true),
  ('Chiens d''arrêt', 'Dressage et pratique avec les chiens d''arrêt.', 'Chiens', true),
  ('Chiens courants', 'Meutes et chiens courants en action.', 'Chiens', true),
  ('Chiens de chasse', 'Tout ce qui concerne l''auxiliaire à quatre pattes.', 'Chiens', true),
  ('Cuisine du gibier', 'Recettes et préparations autour du gibier.', 'Cuisine', true),
  ('Techniques de chasse', 'Échangez sur les techniques.', 'Chasse', true),
  ('Territoires & biotopes', 'Connaître et lire son territoire.', 'Territoire', true),
  ('Observation & nature', 'Observer la faune hors saison de chasse.', 'Observation', true),
  ('Matériel & équipement', 'Armes, optiques, accessoires.', 'Matériel', true),
  ('Vêtements & équipement outdoor', 'S''équiper pour le terrain.', 'Matériel', true),
  ('Photo & vidéo', 'Immortaliser les sorties.', 'Photographie', true),
  ('4x4 & véhicules', 'Accéder au terrain.', 'Matériel', true),
  ('Sorties & territoires', 'Organiser des sorties.', 'Territoire', true),
  ('Chasse entre passionnés', 'Rencontres entre passionnés.', 'Associations', true),
  ('Gestion du territoire', 'Aménagement cynégétique.', 'Territoire', true),
  ('Faune sauvage', 'Connaissance de la faune.', 'Nature', true),
  ('Nature & environnement', 'Biodiversité et milieux naturels.', 'Nature', true),
  ('Réglementation & permis', 'Droit de la chasse.', 'Associations', true),
  ('Débutants & conseils', 'Progresser en chasse.', 'Jeunes chasseurs', true);

-- ---------------------------------------------------------------------------
-- HUNTING LOGS (carnet de chasse — privé par défaut)
-- ---------------------------------------------------------------------------
create table hunting_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  date          date not null,
  lieu          text,
  region        text,
  departement   text,
  dog_id        uuid references dogs(id),
  espece        text,
  type_sortie   text,
  conditions    text,
  observations  text,
  notes         text,
  photos        text[] not null default '{}',
  visibility    text not null default 'private' check (visibility in ('private','public')),
  created_at    timestamptz not null default now()
);
alter table hunting_logs enable row level security;
create policy "owner reads own hunting logs" on hunting_logs
  for select using (auth.uid() = user_id or visibility = 'public');
create policy "owner manages own hunting logs" on hunting_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- MESSAGERIE
-- ---------------------------------------------------------------------------
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('direct','group')),
  nom         text,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);
alter table conversations enable row level security;

create table conversation_members (
  conversation_id  uuid not null references conversations(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  joined_at        timestamptz not null default now(),
  left_at          timestamptz,
  primary key (conversation_id, user_id)
);
alter table conversation_members enable row level security;

-- Un utilisateur ne voit que les conversations dont il est membre.
create policy "member reads own conversations" on conversations
  for select using (exists (
    select 1 from conversation_members
    where conversation_id = conversations.id and user_id = auth.uid() and left_at is null
  ));
create policy "authenticated creates conversation" on conversations
  for insert with check (auth.uid() is not null);

create policy "member reads own membership rows" on conversation_members
  for select using (exists (
    select 1 from conversation_members cm2
    where cm2.conversation_id = conversation_members.conversation_id and cm2.user_id = auth.uid()
  ));
create policy "member manages own membership" on conversation_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references conversations(id) on delete cascade,
  sender_id         uuid not null references profiles(id) on delete cascade,
  texte             text,
  created_at        timestamptz not null default now()
);
alter table messages enable row level security;
create policy "member reads conversation messages" on messages
  for select using (exists (
    select 1 from conversation_members
    where conversation_id = messages.conversation_id and user_id = auth.uid() and left_at is null
  ));
create policy "member sends messages" on messages
  for insert with check (
    auth.uid() = sender_id and exists (
      select 1 from conversation_members
      where conversation_id = messages.conversation_id and user_id = auth.uid() and left_at is null
    )
  );

create table message_media (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references messages(id) on delete cascade,
  url          text not null,
  type         text not null check (type in ('image','video','audio'))
);
alter table message_media enable row level security;
create policy "member reads media of own conversations" on message_media
  for select using (exists (
    select 1 from messages m
    join conversation_members cm on cm.conversation_id = m.conversation_id
    where m.id = message_media.message_id and cm.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null check (type in ('like','comment','follow','mention','group_invite','moderation','system')),
  target_id   uuid,
  target_type text,
  lu          boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table notifications enable row level security;
create policy "user reads own notifications" on notifications
  for select using (auth.uid() = user_id);
create policy "user updates own notifications" on notifications
  for update using (auth.uid() = user_id);

-- Exemple de trigger : notifier l'auteur d'un post lors d'un like.
create or replace function notify_on_like() returns trigger as $$
begin
  insert into notifications (user_id, type, target_id, target_type)
  select author_id, 'like', new.post_id, 'post'
  from posts where id = new.post_id and author_id <> new.user_id;
  return new;
end;
$$ language plpgsql security definer;
create trigger notify_like_trigger after insert on likes
  for each row execute function notify_on_like();

-- ---------------------------------------------------------------------------
-- MODÉRATION
-- ---------------------------------------------------------------------------
create table reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references profiles(id),
  target_id     uuid not null,
  target_type   text not null check (target_type in ('post','video','comment','trace','user','group')),
  reason        text not null check (reason in (
                  'Violence','Braconnage','Contenu illégal','Harcèlement',
                  'Haine / discrimination','Spam','Arnaque','Contenu sexuel',
                  'Mineur en danger','Usurpation d''identité','Autre'
                )),
  description   text,
  status        text not null default 'pending' check (status in ('pending','reviewed','actioned','dismissed')),
  created_at    timestamptz not null default now()
);
alter table reports enable row level security;
create policy "reporter reads own reports" on reports for select using (auth.uid() = reporter_id);
create policy "reporter creates reports" on reports for insert with check (auth.uid() = reporter_id);
-- Lecture complète réservée aux modérateurs/admins :
create policy "moderators read all reports" on reports for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('moderator','admin'))
);

create table moderation_actions (
  id             uuid primary key default gen_random_uuid(),
  report_id      uuid references reports(id),
  moderator_id   uuid not null references profiles(id),
  action         text not null check (action in ('dismiss','remove_content','warn_user','suspend_user','ban_user')),
  target_id      uuid not null,
  created_at     timestamptz not null default now()
);
alter table moderation_actions enable row level security;
create policy "only moderators write moderation actions" on moderation_actions
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('moderator','admin'))
  );

create table user_sanctions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null check (type in ('warning','suspension','ban')),
  reason      text,
  issued_by   uuid references profiles(id),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);
alter table user_sanctions enable row level security;
create policy "user reads own sanctions" on user_sanctions for select using (auth.uid() = user_id);
create policy "only moderators issue sanctions" on user_sanctions
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('moderator','admin'))
  );

-- =============================================================================
-- FIN — rappels avant exécution :
--  1. Ce fichier n'a jamais été exécuté ni validé contre une vraie base.
--  2. Relisez les policies RLS avant toute mise en production.
--  3. Configurez Storage séparément (buckets "avatars", "posts", "traces", "messages")
--     avec leurs propres policies — non couvert par ce fichier SQL.
-- =============================================================================
