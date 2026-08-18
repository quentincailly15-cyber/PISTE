// authService.js
// Remplace l'objet `api.*` (auth) de piste_app.jsx par de vrais appels Supabase Auth.
// Rien ici n'est simulé : chaque fonction appelle réellement le SDK. Ces fonctions
// n'ont jamais été exécutées contre un vrai projet depuis cette conversation.

import { supabase } from "./supabaseClient.js";
import { validateUsernameFormat, computeAge } from "../lib/piste_core.js";

/**
 * Inscription réelle. Déclenche l'envoi de l'e-mail de vérification si la
 * confirmation d'e-mail est activée côté Dashboard Supabase (voir README) —
 * Supabase gère l'envoi lui-même, ce fichier ne fait qu'appeler signUp().
 *
 * La ligne "profiles" n'est plus créée ici : elle est créée automatiquement
 * côté base par le trigger Postgres `on_auth_user_created` (voir
 * supabase/migrations/002_profile_trigger.sql), à partir des métadonnées
 * passées dans `options.data`. Ce fichier ne fait donc qu'un seul appel réseau.
 */
export async function signUp({ email, password, username, day, month, year, region, departement }) {
  const formatCheck = validateUsernameFormat(username);
  if (!formatCheck.valid) {
    throw new Error(`Nom d'utilisateur invalide (${formatCheck.reason})`);
  }
  const age = computeAge(day, month, year);
  if (age === null || age < 14) {
    throw new Error("PISTE est réservé aux personnes de 14 ans et plus.");
  }
  const dateNaissance = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // URL vers laquelle Supabase redirige après clic sur le lien de l'e-mail.
      // Doit être ajoutée à "Redirect URLs" dans le Dashboard (voir README).
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      // Lu par le trigger `handle_new_user()` côté base pour remplir profiles.
      data: {
        username: formatCheck.normalized,
        date_naissance: dateNaissance,
        region,
        departement,
      },
    },
  });
  if (authError) throw authError;

  return { user: authData.user, emailConfirmationRequired: !authData.session };
}

export async function resendVerificationEmail(email) {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw error;
  return true;
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session; // Supabase persiste la session automatiquement (localStorage)
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
  return true;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return true;
}

/** Récupère la session courante — à appeler au démarrage de l'app pour savoir
 *  si l'utilisateur est déjà connecté après une actualisation. */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/** S'abonne aux changements de session (login/logout/refresh) — remplace le
 *  besoin de vérifier manuellement l'état de connexion partout dans l'UI. */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/**
 * Vérifie la disponibilité réelle d'un username côté base (contrainte UNIQUE).
 * Ne jamais se fier uniquement à validateUsernameFormat() côté frontend.
 */
export async function checkUsernameAvailable(username) {
  const formatCheck = validateUsernameFormat(username);
  if (!formatCheck.valid) return { available: false, reason: formatCheck.reason };
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", formatCheck.normalized)
    .maybeSingle();
  if (error) throw error;
  return { available: !data, normalized: formatCheck.normalized };
}

/**
 * Suppression de compte — via la fonction SQL "delete_own_account()"
 * (migration 053), pas une Edge Function : plus simple à mettre en place
 * (un script SQL à coller, comme toutes les autres migrations) qu'à
 * déployer et gérer une fonction serveur séparée. La fonction, exécutée
 * avec des droits élevés côté base mais restreinte à auth.uid() dans son
 * propre corps, supprime la ligne auth.users — profiles.id la référence en
 * "on delete cascade" (001_init.sql), donc le profil et tout ce qui en
 * dépend (publications, messages, commentaires, chiens, carnet...)
 * disparaît réellement avec.
 */
export async function deleteAccount() {
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
  await supabase.auth.signOut();
}
