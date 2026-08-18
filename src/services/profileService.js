// profileService.js
// Appels Supabase réels pour la lecture/mise à jour du profil connecté et
// l'upload de la photo de profil (bucket Storage "avatars" — voir
// supabase/migrations/004_avatars_bucket.sql).

import { supabase } from "./supabaseClient.js";

/**
 * Met à jour les champs modifiables du profil connecté. La policy RLS
 * "users can update their own profile" (001_init.sql) empêche de toute façon
 * de modifier le profil de quelqu'un d'autre ou les colonnes protégées
 * (role, badges, verification_status) — ce n'est donc pas revérifié ici.
 */
export async function updateProfile({ nom, username, bio, localisation, isPrivate, interets }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");

  const payload = { nom, username, bio, departement: localisation };
  if (isPrivate !== undefined) payload.is_private = isPrivate;
  if (interets !== undefined) payload.interets = interets;

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userData.user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Profil public de n'importe quel utilisateur (pas seulement le sien) —
 *  sert à afficher un vrai écran de profil quand on clique sur un pseudo,
 *  où que ce soit dans l'app (post, notification, message...). */
export async function fetchPublicProfile(username) {
  const { data, error } = await supabase.from("profiles").select("*").eq("username", username).single();
  if (error) throw error;

  const [{ count: abonnes }, { count: abonnements }, { count: publications }] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", data.id),
    supabase.from("follows").select("followed_id", { count: "exact", head: true }).eq("follower_id", data.id),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", data.id),
  ]);

  return {
    id: data.id,
    username: data.username,
    nom: data.nom || data.username,
    avatar: data.avatar_url,
    imageCouverture: data.banniere_url,
    bio: data.bio,
    localisation: data.departement,
    badges: data.badges || [],
    verificationStatus: data.verification_status,
    isPrivate: !!data.is_private,
    stats: { abonnes: abonnes || 0, abonnements: abonnements || 0, publications: publications || 0 },
  };
}

async function uploadToAvatarsBucket(file, prefix) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");

  const path = `${userData.user.id}/${prefix}-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
  return { userId: userData.user.id, url: publicUrl.publicUrl };
}

/**
 * Upload la photo de profil dans le bucket "avatars" puis enregistre son URL
 * publique dans profiles.avatar_url. Renvoie l'URL publique.
 */
export async function uploadAvatar(file) {
  const { userId, url } = await uploadToAvatarsBucket(file, "avatar");
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (error) throw error;
  return url;
}

/**
 * Upload la bannière de profil (même bucket "avatars", chemin différent) puis
 * enregistre son URL publique dans profiles.banniere_url (voir migration 007).
 */
export async function uploadBanner(file) {
  const { userId, url } = await uploadToAvatarsBucket(file, "banner");
  const { error } = await supabase.from("profiles").update({ banniere_url: url }).eq("id", userId);
  if (error) throw error;
  return url;
}
