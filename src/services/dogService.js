// dogService.js
// Appels Supabase réels pour les chiens (table "dogs" — voir 001_init.sql).
// Photo : bucket Storage "dogs" — voir supabase/migrations/006_dogs_bucket.sql.

import { supabase } from "./supabaseClient.js";

export async function createDog({ nom, race, birthDate, sexe, specialite, description, photoFile }) {
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
      birth_date: birthDate || null,
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

/** Chiens d'un utilisateur précis — pour l'onglet Chiens d'un profil public
 *  (voir fetchMyDogs pour son propre profil). RLS masque déjà les chiens d'un
 *  compte privé si on n'est pas abonné approuvé (voir migration 021). */
export async function fetchUserDogs(userId) {
  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Modifie un chien déjà créé — une erreur de saisie (nom, race, date de
 *  naissance...) ne devait jusqu'ici jamais pouvoir être corrigée. La photo
 *  n'est remplacée que si une nouvelle est fournie ; RLS ("owner manages own
 *  dogs", 001_init.sql, déjà "for all") autorise déjà cette mise à jour, pas
 *  de migration nécessaire. */
export async function updateDog(dogId, { nom, race, birthDate, sexe, specialite, description, photoFile }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");

  const update = { nom, race, birth_date: birthDate || null, sexe, specialite, description };
  if (photoFile) {
    const path = `${userData.user.id}/${Date.now()}-${photoFile.name}`;
    const { error: uploadError } = await supabase.storage.from("dogs").upload(path, photoFile, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from("dogs").getPublicUrl(path);
    update.photo_url = publicUrl.publicUrl;
  }

  const { data, error } = await supabase.from("dogs").update(update).eq("id", dogId).select().single();
  if (error) throw error;
  return data;
}

/** Supprime un chien — RLS restreint déjà à son propriétaire. Les
 *  publications qui l'identifiaient (table post_dogs) ne sont pas supprimées
 *  elles-mêmes, seul le lien disparaît (post_dogs.dog_id references dogs(id)
 *  on delete cascade, 001_init.sql) : la publication reste, juste plus liée
 *  à ce chien. */
export async function deleteDog(dogId) {
  const { error } = await supabase.from("dogs").delete().eq("id", dogId);
  if (error) throw error;
  return true;
}
