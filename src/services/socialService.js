// socialService.js
// Appels Supabase réels pour suivre/bloquer/signaler (tables "follows",
// "blocked_users" — voir supabase/migrations/005_blocked_users.sql — et
// "reports").
//
// Important : ces fonctions prennent un USERNAME (colonne unique de
// "profiles"), pas un nom d'affichage ("nom", modifiable et non unique).
// C'est aussi la clé utilisée côté App.jsx pour identifier un auteur dans
// `following`/`blockedAuthors` — voir mapPostRow().

import { supabase } from "./supabaseClient.js";

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Non authentifié");
  return data.user;
}

async function resolveUserIdByUsername(username) {
  const { data, error } = await supabase.from("profiles").select("id").eq("username", username).single();
  if (error) throw error;
  return data.id;
}

export async function followUser(username) {
  const me = await requireUser();
  const targetId = await resolveUserIdByUsername(username);
  const { error } = await supabase.from("follows").insert({ follower_id: me.id, followed_id: targetId });
  if (error) throw error;
  return true;
}

export async function unfollowUser(username) {
  const me = await requireUser();
  const targetId = await resolveUserIdByUsername(username);
  const { error } = await supabase.from("follows").delete().eq("follower_id", me.id).eq("followed_id", targetId);
  if (error) throw error;
  return true;
}

/** À appeler au chargement pour retrouver les abonnements déjà en base
 *  (sans ça, `following` repartirait vide à chaque rafraîchissement). */
export async function fetchMyFollowing() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("follows")
    .select("profiles!follows_followed_id_fkey(username)")
    .eq("follower_id", userData.user.id);
  if (error) throw error;
  return data.map((r) => r.profiles?.username).filter(Boolean);
}

export async function blockUser(username) {
  const me = await requireUser();
  const targetId = await resolveUserIdByUsername(username);
  const { error } = await supabase.from("blocked_users").insert({ blocker_id: me.id, blocked_id: targetId });
  if (error) throw error;
  return true;
}

export async function unblockUser(username) {
  const me = await requireUser();
  const targetId = await resolveUserIdByUsername(username);
  const { error } = await supabase.from("blocked_users").delete().eq("blocker_id", me.id).eq("blocked_id", targetId);
  if (error) throw error;
  return true;
}

export async function fetchMyBlocks() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("blocked_users")
    .select("profiles!blocked_users_blocked_id_fkey(username)")
    .eq("blocker_id", userData.user.id);
  if (error) throw error;
  return data.map((r) => r.profiles?.username).filter(Boolean);
}

export async function reportContent({ targetId, targetType, reason, description }) {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("reports")
    .insert({ reporter_id: me.id, target_id: targetId, target_type: targetType, reason, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}
