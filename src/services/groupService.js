// groupService.js
// Appels Supabase réels pour les groupes (tables "groups" et "group_members" —
// voir 001_init.sql, qui contient déjà les 24 groupes prédéfinis de PISTE).

import { supabase } from "./supabaseClient.js";

function mapGroupRow(row, myGroupIds, previewsByGroup) {
  return {
    id: row.id,
    nom: row.nom,
    description: row.description,
    imageUrl: row.image_url,
    categorie: row.categorie,
    nombreMembres: row.group_members?.[0]?.count || 0,
    joined: myGroupIds.has(row.id),
    createdBy: row.created_by,
    isPredefined: !!row.is_predefined,
    memberPreviews: (previewsByGroup.get(row.id) || []).slice(0, 4),
  };
}

/** Récupère tous les groupes (les 24 prédéfinis + ceux créés par les
 *  utilisateurs), avec le vrai nombre de membres, si l'utilisateur connecté
 *  les a rejoints, et quelques avatars de membres réels (aperçu empilé dans
 *  la liste — jamais d'avatar inventé). */
export async function fetchGroups() {
  const { data, error } = await supabase
    .from("groups")
    .select("*, group_members(count)")
    .order("nom", { ascending: true });
  if (error) throw error;

  const { data: userData } = await supabase.auth.getUser();
  let myGroupIds = new Set();
  if (userData.user) {
    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userData.user.id);
    if (memberError) throw memberError;
    myGroupIds = new Set((memberships || []).map((m) => m.group_id));
  }

  // Un seul aller-retour pour les aperçus d'avatars de TOUS les groupes
  // (plutôt qu'une requête par groupe) — plafonné large, regroupé côté
  // client, 4 avatars max gardés par groupe.
  const { data: previewRows } = await supabase
    .from("group_members")
    .select("group_id, joined_at, profiles(avatar_url)")
    .order("joined_at", { ascending: true })
    .limit(2000);
  const previewsByGroup = new Map();
  for (const r of previewRows || []) {
    if (!r.profiles?.avatar_url) continue;
    if (!previewsByGroup.has(r.group_id)) previewsByGroup.set(r.group_id, []);
    previewsByGroup.get(r.group_id).push(r.profiles.avatar_url);
  }

  return data.map((row) => mapGroupRow(row, myGroupIds, previewsByGroup));
}

export async function createGroup({ nom, description, categorie, imageUrl }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("groups")
    .insert({ nom, description, categorie, image_url: imageUrl, created_by: userData.user.id })
    .select()
    .single();
  if (error) throw error;

  // Le créateur rejoint automatiquement son propre groupe.
  await joinGroup(data.id);
  return mapGroupRow(data, new Set([data.id]), new Map());
}

export async function joinGroup(groupId) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");
  const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: userData.user.id });
  if (error) throw error;
  return true;
}

export async function leaveGroup(groupId) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userData.user.id);
  if (error) throw error;
  return true;
}

/**
 * Upload l'image d'un groupe (bucket "groups" — voir migration 009) puis
 * enregistre son URL publique dans groups.image_url. La policy RLS
 * "creator or admin updates group" (001_init.sql) empêche déjà un utilisateur
 * non autorisé de réussir cet update — en particulier pour les 24 groupes
 * prédéfinis (created_by = NULL), seul un admin peut y arriver.
 */
export async function uploadGroupImage(groupId, file) {
  const path = `${groupId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("groups").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from("groups").getPublicUrl(path);
  const { error: updateError } = await supabase.from("groups").update({ image_url: publicUrl.publicUrl }).eq("id", groupId);
  if (updateError) throw updateError;

  return publicUrl.publicUrl;
}

/**
 * Discussions d'une communauté (table "group_discussions" — voir migration
 * 046) : un fil avec un titre, où les membres échangent de vrais messages
 * (table "group_discussion_messages"), distinct des publications et des
 * messages privés.
 */
export async function fetchGroupDiscussions(groupId) {
  const { data, error } = await supabase
    .from("group_discussions")
    .select("*, profiles!group_discussions_author_id_fkey(username, nom, avatar_url)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    titre: row.titre,
    groupId: row.group_id,
    authorId: row.author_id,
    authorUsername: row.profiles?.username,
    authorNom: row.profiles?.nom || row.profiles?.username,
    authorAvatar: row.profiles?.avatar_url || null,
    messagesCount: row.messages_count || 0,
    createdAt: row.created_at,
  }));
}

export async function createGroupDiscussion(groupId, titre) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");
  const { data, error } = await supabase
    .from("group_discussions")
    .insert({ group_id: groupId, author_id: userData.user.id, titre })
    .select("*, profiles!group_discussions_author_id_fkey(username, nom, avatar_url)")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    titre: data.titre,
    groupId: data.group_id,
    authorId: data.author_id,
    authorUsername: data.profiles?.username,
    authorNom: data.profiles?.nom || data.profiles?.username,
    authorAvatar: data.profiles?.avatar_url || null,
    messagesCount: 0,
    createdAt: data.created_at,
  };
}

export async function deleteGroupDiscussion(discussionId) {
  const { error } = await supabase.from("group_discussions").delete().eq("id", discussionId);
  if (error) throw error;
  return true;
}

// Hints par nom de colonne (author_id / reply_to_id), jamais par nom de
// contrainte — sinon le moindre écart avec le nom auto-généré par Postgres
// fait échouer l'embed avec "Could not find a relationship..." (voir la
// mésaventure vécue sur messages.reply_to_id plus tôt).
const DISCUSSION_MESSAGE_SELECT =
  "*, profiles!author_id(username, nom, avatar_url), group_discussion_message_likes(user_id), reply_to:group_discussion_messages!reply_to_id(id, texte, author_id, profiles!author_id(username, nom))";

function mapDiscussionMessageRow(row, meId) {
  return {
    id: row.id,
    discussionId: row.discussion_id,
    authorId: row.author_id,
    authorUsername: row.profiles?.username,
    authorNom: row.profiles?.nom || row.profiles?.username,
    authorAvatar: row.profiles?.avatar_url || null,
    texte: row.texte,
    createdAt: row.created_at,
    likeCount: row.group_discussion_message_likes?.length || 0,
    liked: meId ? (row.group_discussion_message_likes || []).some((l) => l.user_id === meId) : false,
    replyTo: row.reply_to ? { id: row.reply_to.id, texte: row.reply_to.texte, auteur: row.reply_to.profiles?.nom || row.reply_to.profiles?.username } : null,
  };
}

export async function fetchDiscussionMessages(discussionId) {
  const { data: userData } = await supabase.auth.getUser();
  const meId = userData?.user?.id || null;
  const { data, error } = await supabase
    .from("group_discussion_messages")
    .select(DISCUSSION_MESSAGE_SELECT)
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((row) => mapDiscussionMessageRow(row, meId));
}

export async function sendDiscussionMessage(discussionId, texte, replyToId = null) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");
  const { data, error } = await supabase
    .from("group_discussion_messages")
    .insert({ discussion_id: discussionId, author_id: userData.user.id, texte, reply_to_id: replyToId })
    .select(DISCUSSION_MESSAGE_SELECT)
    .single();
  if (error) throw error;
  return mapDiscussionMessageRow(data, userData.user.id);
}

export async function deleteDiscussionMessage(messageId) {
  const { error } = await supabase.from("group_discussion_messages").delete().eq("id", messageId);
  if (error) throw error;
  return true;
}

export async function toggleDiscussionMessageLike(messageId, shouldLike) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");
  if (shouldLike) {
    const { error } = await supabase.from("group_discussion_message_likes").insert({ message_id: messageId, user_id: userData.user.id });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("group_discussion_message_likes").delete().eq("message_id", messageId).eq("user_id", userData.user.id);
    if (error) throw error;
  }
  return true;
}

/** Vrais membres d'un groupe (jointure group_members → profiles), avec leur
 *  rôle au sein du groupe ('member' | 'admin' — colonne group_members.role,
 *  distincte du rôle plateforme profiles.role). */
export async function fetchGroupMembers(groupId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("role, joined_at, profiles(id, username, nom, avatar_url)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return data
    .filter((r) => r.profiles)
    .map((r) => ({
      id: r.profiles.id,
      username: r.profiles.username,
      nom: r.profiles.nom || r.profiles.username,
      avatar: r.profiles.avatar_url,
      role: r.role,
      joinedAt: r.joined_at,
    }));
}
