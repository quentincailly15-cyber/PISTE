// notificationService.js
// Appels Supabase réels pour les notifications (table "notifications" —
// présente dans 001_init.sql, jamais exploitée ; triggers ajoutés par la
// migration 014 pour like/comment/follow/repost/message/group_invite/new_post).

import { supabase } from "./supabaseClient.js";

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    targetId: row.target_id,
    targetType: row.target_type,
    lu: row.lu,
    createdAt: row.created_at,
    actor: row.profiles ? { id: row.profiles.id, username: row.profiles.username, nom: row.profiles.nom || row.profiles.username, avatar: row.profiles.avatar_url } : null,
  };
}

export async function fetchNotifications() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*, profiles!notifications_actor_id_fkey(id, username, nom, avatar_url)")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map(mapNotification);
}

export async function fetchUnreadCount() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userData.user.id)
    .eq("lu", false);
  if (error) throw error;
  return count || 0;
}

export async function markAsRead(id) {
  const { error } = await supabase.from("notifications").update({ lu: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllAsRead() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { error } = await supabase.from("notifications").update({ lu: true }).eq("user_id", userData.user.id).eq("lu", false);
  if (error) throw error;
}

/**
 * Marque comme lues toutes les notifications d'un ou plusieurs types donnés,
 * sans cible précise (ex : "follow" — ouvrir sa liste d'abonnés résout d'un
 * coup toutes les notifications de nouveaux abonnés, il n'y a pas un post ou
 * une conversation individuelle à cibler comme pour markReadByTarget).
 */
export async function markReadByType(types) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || !types || types.length === 0) return;
  const { error } = await supabase.from("notifications").update({ lu: true }).eq("user_id", userData.user.id).eq("lu", false).in("type", types);
  if (error) throw error;
}

/**
 * Marque comme lues toutes les notifications pointant vers une cible précise
 * (target_id — voir migration 014 pour la correspondance par type : un post
 * pour like/comment/repost/new_post, une conversation pour message/
 * group_invite, un profil pour follow). Sert à retirer automatiquement une
 * notification quand l'utilisateur fait "la chose" ailleurs dans l'app
 * (ouvrir la conversation, les commentaires du post, ses abonnés...) sans
 * être passé par le panneau de notifications lui-même.
 */
export async function markReadByTarget(targetId, types) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || !targetId) return;
  let query = supabase.from("notifications").update({ lu: true }).eq("user_id", userData.user.id).eq("target_id", targetId).eq("lu", false);
  if (types && types.length > 0) query = query.in("type", types);
  const { error } = await query;
  if (error) throw error;
}

/** Abonnement realtime — voir migration 014 (ajout de "notifications" à la
 *  publication supabase_realtime). */
export function subscribeToNotifications(userId, onInsert) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
      onInsert(payload.new);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}
