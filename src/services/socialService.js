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

/** Recherche de vrais utilisateurs (pseudo ou nom d'affichage) — sert par
 *  exemple à choisir un destinataire pour démarrer une conversation. */
export async function searchUsers(query) {
  const me = await requireUser();
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, nom, avatar_url")
    .neq("id", me.id)
    .or(`username.ilike.%${q}%,nom.ilike.%${q}%`)
    .limit(20);
  if (error) throw error;
  return data;
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

/** Compte privé : au lieu d'un follow direct, crée une demande en attente
 *  que le compte cible devra approuver (voir approveFollowRequest). */
export async function requestFollow(username) {
  const me = await requireUser();
  const targetId = await resolveUserIdByUsername(username);
  const { error } = await supabase.from("follow_requests").insert({ requester_id: me.id, target_id: targetId });
  if (error) throw error;
  return true;
}

/** Annule une demande d'abonnement qu'on a soi-même envoyée (encore en attente). */
export async function cancelFollowRequest(username) {
  const me = await requireUser();
  const targetId = await resolveUserIdByUsername(username);
  const { error } = await supabase.from("follow_requests").delete().eq("requester_id", me.id).eq("target_id", targetId).eq("status", "pending");
  if (error) throw error;
  return true;
}

/** État de la relation avec `username` du point de vue de l'utilisateur
 *  connecté : a-t-il déjà une demande en attente vers ce compte privé ? */
export async function fetchMyPendingRequestUsernames() {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("follow_requests")
    .select("profiles!follow_requests_target_id_fkey(username)")
    .eq("requester_id", me.id)
    .eq("status", "pending");
  if (error) throw error;
  return data.map((r) => r.profiles?.username).filter(Boolean);
}

/** Demandes d'abonnement reçues, en attente d'approbation par l'utilisateur
 *  connecté (compte privé) — sert à afficher la liste "Demandes d'abonnement". */
export async function fetchIncomingFollowRequests() {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("follow_requests")
    .select("id, created_at, profiles!follow_requests_requester_id_fkey(username, nom, avatar_url)")
    .eq("target_id", me.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => ({ id: r.id, createdAt: r.created_at, username: r.profiles?.username, nom: r.profiles?.nom, avatar: r.profiles?.avatar_url }));
}

export async function approveFollowRequest(requestId) {
  const { error } = await supabase.rpc("approve_follow_request", { request_id: requestId });
  if (error) throw error;
  return true;
}

export async function rejectFollowRequest(requestId) {
  const { error } = await supabase.rpc("reject_follow_request", { request_id: requestId });
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

/** Liste des abonnés d'un utilisateur précis — pour l'écran "Abonnés" ouvert
 *  depuis n'importe quel profil (le sien ou un profil public). */
export async function fetchFollowers(userId) {
  const { data, error } = await supabase
    .from("follows")
    .select("profiles!follows_follower_id_fkey(username, nom, avatar_url)")
    .eq("followed_id", userId);
  if (error) throw error;
  return data.map((r) => r.profiles).filter(Boolean);
}

/** Liste des abonnements d'un utilisateur précis — pour l'écran "Abonnements". */
export async function fetchFollowingList(userId) {
  const { data, error } = await supabase
    .from("follows")
    .select("profiles!follows_followed_id_fkey(username, nom, avatar_url)")
    .eq("follower_id", userId);
  if (error) throw error;
  return data.map((r) => r.profiles).filter(Boolean);
}

/**
 * Active/désactive la "cloche" (notifications à chaque nouvelle publication
 * de cette personne) — réutilise follows.notifications_enabled (déjà présent
 * dans 001_init.sql). Si l'utilisateur ne suit pas encore la personne et
 * active la cloche, ça l'abonne au passage (la cloche implique de suivre).
 */
export async function setFollowNotifications(username, enabled) {
  const me = await requireUser();
  const targetId = await resolveUserIdByUsername(username);
  const { data: existing, error: fetchError } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", me.id)
    .eq("followed_id", targetId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (!existing) {
    if (!enabled) return true; // pas encore abonné : rien à désactiver
    const { error } = await supabase.from("follows").insert({ follower_id: me.id, followed_id: targetId, notifications_enabled: true });
    if (error) throw error;
    return true;
  }
  const { error } = await supabase.from("follows").update({ notifications_enabled: enabled }).eq("follower_id", me.id).eq("followed_id", targetId);
  if (error) throw error;
  return true;
}

/** Comptes pour lesquels la cloche est activée — à charger au démarrage. */
export async function fetchMyBellUsernames() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("follows")
    .select("profiles!follows_followed_id_fkey(username)")
    .eq("follower_id", userData.user.id)
    .eq("notifications_enabled", true);
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

export async function submitHelpRequest({ category, subject, description }) {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("support_requests")
    .insert({ user_id: me.id, category, subject, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}
