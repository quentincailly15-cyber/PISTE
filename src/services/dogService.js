// dogService.js
// Appels Supabase réels pour les chiens (table "dogs" — voir 001_init.sql).
// Photo : bucket Storage "dogs" — voir supabase/migrations/006_dogs_bucket.sql.

import { supabase } from "./supabaseClient.js";

export async function createDog({ nom, race, age, sexe, specialite, description, photoFile }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");

  let photoUrl = null;
  if (photoFile) {
    const path = `${userData.user.id}/${Date.now()}-${photoFile.name}`;
    const { error: uploadError } = await supabase.storage.from("dogs").upload(path, photoFile, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from("dogs").getPublicUrl(path);
    photoUrl = publicUrl.publicUrl;
  }

  const { data, error } = await supabase
    .from("dogs")
    .insert({
      owner_id: userData.user.id,
      nom,
      race,
      age: age ? Number(age) : null,
      sexe,
      specialite,
      description,
      photo_url: photoUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** À appeler au chargement du profil pour retrouver les chiens déjà créés
 *  (sans ça, ils disparaîtraient à chaque rafraîchissement de page, comme
 *  c'était le cas pour le fil avant qu'il soit branché sur postService.js). */
export async function fetchMyDogs() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("owner_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
