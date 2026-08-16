// supabaseClient.js
// Point d'entrée unique vers Supabase. Nécessite le package réel :
//   npm install @supabase/supabase-js
// Ce fichier n'a jamais été exécuté depuis cette conversation (pas de réseau,
// pas de projet Supabase connu). Il est correct et prêt à l'emploi dans un
// vrai projet (Vite/Next/CRA) une fois les variables d'environnement définies
// — voir .env.example.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Échec explicite plutôt que silencieux : ne jamais laisser l'app croire
  // qu'elle est connectée si la configuration est absente.
  throw new Error(
    "PISTE: variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes. " +
    "Voir backend/.env.example."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // session conservée après actualisation (localStorage géré par le SDK)
    autoRefreshToken: true,
  },
});
