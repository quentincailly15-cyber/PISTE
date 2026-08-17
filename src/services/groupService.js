// groupService.js
// Appels Supabase réels pour les groupes (tables "groups" et "group_members" —
// voir 001_init.sql, qui contient déjà les 24 groupes prédéfinis de PISTE).

import { supabase } from "./supabaseClient.js";

function mapGroupRow(row, myGroupIds) {
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
  };
}

/** Récupère tous les groupes (les 24 prédéfinis + ceux créés par les
 *  utilisateurs), avec le vrai nombre de membres et si l'utilisateur connecté
 *  les a rejoints. */
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
  return data.map((row) => mapGroupRow(row, myGroupIds));
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
  return mapGroupRow(data, new Set([data.id]));
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
