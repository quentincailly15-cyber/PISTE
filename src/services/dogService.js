// dogService.js
// Appels Supabase réels pour les chiens (table "dogs" — voir 001_init.sql).
// L'upload de photo n'est pas couvert : le formulaire actuel (DogFormScreen
// dans App.jsx) n'a pas de vrai sélecteur de fichier pour l'instant.

import { supabase } from "./supabaseClient.js";

export async function createDog({ nom, race, age, sexe, specialite, description }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");

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
