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
export async function updateProfile({ nom, username, bio, localisation }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      nom,
      username,
      bio,
      departement: localisation,
    })
    .eq("id", userData.user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Upload la photo de profil dans le bucket "avatars" puis enregistre son URL
 * publique dans profiles.avatar_url. Renvoie l'URL publique.
 */
export async function uploadAvatar(file) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");

  const path = `${userData.user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl.publicUrl })
    .eq("id", userData.user.id);
  if (updateError) throw updateError;

  return publicUrl.publicUrl;
}
