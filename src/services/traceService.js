// traceService.js
// Appels Supabase réels pour TRACE (stories éphémères 24h — table "traces",
// voir migration 024_traces.sql). Réutilise le bucket Storage "posts" déjà
// présent (003_storage_posts_bucket.sql) — ses policies n'autorisent
// l'upload/suppression que dans son propre dossier {user_id}/..., donc aucune
// policy Storage supplémentaire n'était nécessaire pour Trace.

import { supabase } from "./supabaseClient.js";

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Non authentifié");
  return data.user;
}

const TRACE_SELECT = "id, author_id, media_url, media_path, media_type, duration_seconds, texte, created_at, expires_at, profiles!traces_author_id_fkey(username, nom, avatar_url, is_private), trace_views(viewer_id)";

function mapTraceRow(row, meId) {
  return {
    id: row.id,
    authorId: row.author_id,
    username: row.profiles?.username,
    nom: row.profiles?.nom || row.profiles?.username,
    avatar: row.profiles?.avatar_url || null,
    mediaUrl: row.media_url,
    mediaPath: row.media_path,
    mediaType: row.media_type,
    durationSeconds: row.duration_seconds,
    texte: row.texte,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    // RLS ne renvoie que MES propres vues (si je ne suis pas l'auteur) ou
    // TOUTES les vues (si je le suis) — dans les deux cas, ceci détecte
    // correctement si MOI j'ai déjà vu cette Trace.
    viewed: (row.trace_views || []).some((v) => v.viewer_id === meId),
    viewCount: row.author_id === meId ? (row.trace_views || []).length : null,
  };
}

/** Traces actives (non expirées) visibles par l'utilisateur connecté — RLS
 *  filtre déjà les comptes privés non approuvés (voir migration 024). Le
 *  filtre d'expiration est fait ici en plus de la RLS : une Trace expirée ne
 *  doit jamais être "considérée active" même si la ligne existe encore en
 *  base (voir consigne — pas de suppression physique immédiate requise). */
export async function fetchActiveTraces() {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("traces")
    .select(TRACE_SELECT)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((row) => mapTraceRow(row, me.id));
}

/** Trace(s) actives d'un utilisateur précis — pour l'affichage "Trace active"
 *  sur son profil (voir consigne section 7). */
export async function fetchUserActiveTraces(userId) {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("traces")
    .select(TRACE_SELECT)
    .eq("author_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((row) => mapTraceRow(row, me.id));
}

/** Sonde la vraie durée d'une vidéo côté navigateur avant l'envoi — sert à
 *  caler la progression de la visionneuse sur la durée réelle plutôt qu'une
 *  estimation arbitraire. Plafonnée à 15s (format "Trace", pas un lecteur
 *  vidéo classique) ; au-delà, seules les 15 premières secondes sont utiles
 *  côté progression (la vidéo elle-même n'est pas tronquée à l'upload).
 */
function probeVideoDuration(file, timeoutMs = 6000) {
  return new Promise((resolve) => {
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.muted = true;
    videoEl.src = URL.createObjectURL(file);
    let settled = false;
    const finish = (seconds) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(videoEl.src);
      resolve(seconds);
    };
    const timer = setTimeout(() => finish(15), timeoutMs);
    videoEl.onloadedmetadata = () => finish(Math.min(15, Math.max(1, Math.round(videoEl.duration || 15))));
    videoEl.onerror = () => finish(15);
  });
}

/** Crée une Trace réelle : upload du média dans le bucket "posts" existant
 *  (dossier {user_id}/trace-{timestamp}-{nom}), puis insertion en base avec
 *  expires_at = now() + 24h calculé côté base (voir défaut de la colonne). */
export async function createTrace({ file, texte }) {
  const me = await requireUser();
  const mediaType = file.type.startsWith("video") ? "video" : "photo";
  const path = `${me.id}/trace-${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("posts").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data: publicUrl } = supabase.storage.from("posts").getPublicUrl(path);

  const durationSeconds = mediaType === "video" ? await probeVideoDuration(file) : 6;

  const { data: trace, error } = await supabase
    .from("traces")
    .insert({
      author_id: me.id,
      media_url: publicUrl.publicUrl,
      media_path: path,
      media_type: mediaType,
      duration_seconds: durationSeconds,
      texte: texte || null,
    })
    .select(TRACE_SELECT)
    .single();
  if (error) {
    // Le fichier est déjà uploadé — on évite de le laisser orphelin si l'insert échoue.
    await supabase.storage.from("posts").remove([path]).catch(() => {});
    throw error;
  }
  return mapTraceRow(trace, me.id);
}

/** Enregistre une vue — clé primaire (trace_id, viewer_id) empêche tout
 *  comptage en double, `ignoreDuplicates` évite une erreur si déjà vue. */
export async function recordTraceView(traceId) {
  const me = await requireUser();
  if (!traceId) return true;
  const { error } = await supabase
    .from("trace_views")
    .upsert({ trace_id: traceId, viewer_id: me.id }, { onConflict: "trace_id,viewer_id", ignoreDuplicates: true });
  if (error) throw error;
  return true;
}

/** Liste des personnes ayant vu une Trace — réservé à son auteur par la RLS
 *  ("viewer_id = auth.uid() OR je suis l'auteur de la trace"). */
export async function fetchTraceViewers(traceId) {
  const { data, error } = await supabase
    .from("trace_views")
    .select("viewer_id, viewed_at, profiles!trace_views_viewer_id_fkey(username, nom, avatar_url)")
    .eq("trace_id", traceId)
    .order("viewed_at", { ascending: false });
  if (error) throw error;
  return data.filter((r) => r.profiles).map((r) => ({ username: r.profiles.username, nom: r.profiles.nom || r.profiles.username, avatar: r.profiles.avatar_url, viewedAt: r.viewed_at }));
}

/** Suppression réelle : la ligne ET le fichier Storage (contrairement à
 *  deletePost qui ne nettoie pas le bucket — Trace est éphémère par nature,
 *  la propreté du stockage compte davantage ici). */
export async function deleteTrace(traceId, mediaPath) {
  const { error } = await supabase.from("traces").delete().eq("id", traceId);
  if (error) throw error;
  if (mediaPath) await supabase.storage.from("posts").remove([mediaPath]).catch(() => {});
  return true;
}
