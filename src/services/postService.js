// postService.js
// Remplace les fonctions posts/likes/comments/saves de l'objet `api.*` de
// piste_app.jsx. Appels Supabase réels — jamais exécutés depuis cette
// conversation (pas de réseau, pas de projet connu).

import { supabase } from "./supabaseClient.js";
import { extractHashtags, extractMentions } from "../lib/piste_core.js";

export async function createPost({ texte, type, animal, pratique, dogId, departement, contentRating, mediaFiles = [] }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");

  const hashtags = extractHashtags(texte || "");
  const mentions = extractMentions(texte || "");

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: userData.user.id,
      type,
      texte,
      animal,
      pratique,
      departement,
      content_rating: contentRating || "normal",
      hashtags,
      mentions,
    })
    .select()
    .single();
  if (error) throw error;

  if (dogId) {
    const { error: dogLinkError } = await supabase.from("post_dogs").insert({ post_id: post.id, dog_id: dogId });
    if (dogLinkError) throw dogLinkError;
  }

  // Upload média réel vers Supabase Storage (bucket "posts" à créer côté Dashboard).
  const uploadedUrls = [];
  for (let i = 0; i < mediaFiles.length; i++) {
    const file = mediaFiles[i];
    const path = `${userData.user.id}/${post.id}/${i}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("posts").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from("posts").getPublicUrl(path);
    const { error: mediaError } = await supabase.from("post_media").insert({
      post_id: post.id,
      url: publicUrl.publicUrl,
      ordre: i,
      type: file.type.startsWith("video") ? "video" : "image",
    });
    if (mediaError) throw mediaError;
    uploadedUrls.push(publicUrl.publicUrl);
  }

  return { ...post, mediaUrls: uploadedUrls };
}

export async function updatePost(postId, fields) {
  // RLS (voir 001_init.sql) garantit côté serveur que seul l'auteur peut réussir
  // cette requête — inutile et dangereux de ne compter que sur une vérification
  // frontend ici.
  const { data, error } = await supabase
    .from("posts")
    .update({
      texte: fields.texte,
      animal: fields.animal,
      pratique: fields.pratique,
      departement: fields.departement,
      content_rating: fields.contentRating,
      hashtags: extractHashtags(fields.texte || ""),
      mentions: extractMentions(fields.texte || ""),
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
  return true;
}

export async function toggleLike(postId, shouldLike) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Non authentifié");
  if (shouldLike) {
    const { error } = await supabase.from("likes").insert({ user_id: userData.user.id, post_id: postId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("likes").delete().eq("user_id", userData.user.id).eq("post_id", postId);
    if (error) throw error;
  }
  return true;
}

export async function toggleSave(postId, shouldSave) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Non authentifié");
  if (shouldSave) {
    const { error } = await supabase.from("saves").insert({ user_id: userData.user.id, post_id: postId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("saves").delete().eq("user_id", userData.user.id).eq("post_id", postId);
    if (error) throw error;
  }
  return true;
}

export async function addComment(postId, texte, parentId = null) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Non authentifié");
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: userData.user.id, texte, parent_id: parentId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Fil personnalisé : récupère les posts visibles puis applique le pipeline
 *  buildFeed() (piste_core.js) — la logique de tri/diversité ne change pas,
 *  seule la source des données change (base au lieu d'un tableau local). */
export async function fetchCandidatePosts({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(url, ordre, type)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(username, nom)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

/** Renvoie l'ensemble des post_id likés / enregistrés par l'utilisateur connecté
 *  — sert à savoir quel cœur/marque-page doit apparaître "actif" dans l'UI. */
export async function fetchMyLikes() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase.from("likes").select("post_id").eq("user_id", userData.user.id);
  if (error) throw error;
  return data.map((r) => r.post_id);
}

export async function fetchMySaves() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase.from("saves").select("post_id").eq("user_id", userData.user.id);
  if (error) throw error;
  return data.map((r) => r.post_id);
}

