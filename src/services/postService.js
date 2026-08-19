// postService.js
// Remplace les fonctions posts/likes/comments/saves de l'objet `api.*` de
// piste_app.jsx. Appels Supabase réels — jamais exécutés depuis cette
// conversation (pas de réseau, pas de projet connu).

import { supabase } from "./supabaseClient.js";
import { extractHashtags, extractMentions } from "../lib/piste_core.js";

/**
 * Redimensionne/compresse une photo côté navigateur avant l'envoi — sans ça,
 * une photo de téléphone à pleine résolution (15-20 Mo, souvent bien plus
 * grande que ce qu'un écran affiche jamais) partait telle quelle vers
 * Storage, et c'est ce même fichier que chaque personne qui voit la
 * publication téléchargeait. 1920px de plus grand côté suffit largement à
 * un affichage plein écran ; en dessous de cette taille, le fichier original
 * est renvoyé tel quel (repasser par un canvas ferait perdre de la qualité
 * pour rien). Échoue en silence vers le fichier d'origine plutôt que de
 * bloquer la publication si jamais le navigateur ne sait pas décoder l'image.
 */
function compressImage(file, { maxDimension = 1920, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve(file);
        return;
      }
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/**
 * Capture une vraie image (première seconde) d'un fichier vidéo, côté
 * navigateur (canvas) — sert de miniature dans les listes, plutôt que
 * d'afficher un <video> qui reste souvent noir tant qu'on n'a pas cliqué.
 *
 * Sur certains navigateurs mobiles, l'événement "seeked" ne se déclenche
 * parfois jamais sur une vidéo tout juste chargée depuis un blob — sans
 * limite de temps, ça bloquait silencieusement TOUT l'envoi de la publication
 * (createPost attendait cette promesse indéfiniment). D'où le timeout : la
 * miniature est un bonus, jamais une condition pour publier la vidéo.
 */
function generateVideoThumbnail(file, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const videoEl = document.createElement("video");
    // "metadata" + l'évènement "loadeddata" se sont montrés peu fiables pour
    // déclencher une vraie capture sur mobile — "auto" charge davantage de
    // données, et on repart de "loadedmetadata" (durée/dimensions connues,
    // évènement beaucoup plus constant d'un navigateur à l'autre) avant de
    // chercher l'image à capturer. L'élément est aussi attaché au DOM (cadré
    // hors écran) : certains navigateurs ne décodent pas fiablement une vidéo
    // qui n'y est jamais insérée.
    videoEl.preload = "auto";
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
    videoEl.src = URL.createObjectURL(file);
    document.body.appendChild(videoEl);

    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(videoEl.src);
      videoEl.remove();
    };
    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(arg);
    };
    const timer = setTimeout(() => finish(reject, new Error("Génération de la miniature trop longue.")), timeoutMs);

    const capture = () => {
      if (settled) return;
      const canvas = document.createElement("canvas");
      canvas.width = videoEl.videoWidth || 320;
      canvas.height = videoEl.videoHeight || 180;
      canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) finish(resolve, blob);
        else finish(reject, new Error("Impossible de générer une miniature."));
      }, "image/jpeg", 0.82);
    };

    videoEl.onloadedmetadata = () => {
      try {
        videoEl.currentTime = Math.min(0.5, (videoEl.duration || 1) / 4);
      } catch (e) {
        capture(); // certains navigateurs refusent le seek : on capture la frame courante telle quelle
      }
    };
    videoEl.onseeked = capture;
    videoEl.onerror = () => finish(reject, new Error("Impossible de lire cette vidéo pour générer une miniature."));
  });
}

/**
 * Même capture que generateVideoThumbnail, mais depuis une vidéo déjà
 * hébergée (URL du bucket "posts") plutôt qu'un fichier local tout juste
 * choisi — sert à combler après coup les vidéos publiées avant l'existence
 * de la génération automatique (ou dont la génération avait échoué à
 * l'envoi), quand on les croise dans une grille. "crossOrigin: anonymous" +
 * bucket public : la capture ne "tache" pas le canvas, sinon toBlob()
 * échouerait silencieusement.
 */
function generateRemoteVideoThumbnail(url, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const videoEl = document.createElement("video");
    videoEl.preload = "auto";
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.crossOrigin = "anonymous";
    videoEl.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
    videoEl.src = url;
    document.body.appendChild(videoEl);

    let settled = false;
    const cleanup = () => { clearTimeout(timer); videoEl.remove(); };
    const finish = (fn, arg) => { if (settled) return; settled = true; cleanup(); fn(arg); };
    const timer = setTimeout(() => finish(reject, new Error("Génération de la miniature trop longue.")), timeoutMs);

    const capture = () => {
      if (settled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoEl.videoWidth || 320;
        canvas.height = videoEl.videoHeight || 180;
        canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) finish(resolve, blob);
          else finish(reject, new Error("Impossible de générer une miniature."));
        }, "image/jpeg", 0.82);
      } catch (e) {
        finish(reject, e); // canvas "taché" (CORS refusé côté bucket) : abandon silencieux côté appelant
      }
    };

    videoEl.onloadedmetadata = () => {
      try {
        videoEl.currentTime = Math.min(0.5, (videoEl.duration || 1) / 4);
      } catch (e) {
        capture();
      }
    };
    videoEl.onseeked = capture;
    videoEl.onerror = () => finish(reject, new Error("Impossible de lire cette vidéo pour générer une miniature."));
  });
}

/**
 * Génère (depuis l'URL déjà hébergée) et sauvegarde la miniature d'une
 * vidéo qui n'en a pas encore — appelée à l'affichage (VideoThumbCell), pas
 * à la publication. Retourne l'URL publique de la miniature pour un affichage
 * immédiat ; la ligne post_media n'est mise à jour que si l'appelant en est
 * l'auteur (RLS "author manages own post_media", 001_init.sql) — pour un
 * autre spectateur, l'update échoue silencieusement mais l'affichage local
 * fonctionne quand même.
 */
export async function saveGeneratedThumbnail(mediaId, videoUrl) {
  const blob = await generateRemoteVideoThumbnail(videoUrl);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié");
  // La policy Storage "users upload to their own posts folder" exige que le
  // premier segment du chemin soit l'uid de qui envoie — pas forcément
  // l'auteur de la publication (n'importe quel spectateur peut déclencher
  // cette génération), d'où le dossier du VIEWER ici, pas celui de l'auteur.
  const path = `${userData.user.id}/generated/${mediaId}-${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage.from("posts").upload(path, blob, {
    cacheControl: "3600",
    upsert: false,
    contentType: "image/jpeg",
  });
  if (uploadError) throw uploadError;
  const { data: publicUrl } = supabase.storage.from("posts").getPublicUrl(path);
  // Best-effort : pas d'auteur ou pas notre publication -> RLS refuse
  // l'update (résout avec un champ "error", ne rejette jamais) ; on ne le
  // vérifie même pas, l'appelant affiche de toute façon l'URL retournée.
  await supabase.from("post_media").update({ thumbnail_url: publicUrl.publicUrl }).eq("id", mediaId);
  return publicUrl.publicUrl;
}

export async function createPost({ texte, titre, type, animal, pratique, dogId, departement, contentRating, mediaFiles = [], mediaDurations = [], thumbnailFile = null, groupId = null, pollOptions = [] }) {
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
      titre: titre || null,
      animal,
      pratique,
      departement,
      content_rating: contentRating || "normal",
      hashtags,
      mentions,
      group_id: groupId,
    })
    .select()
    .single();
  if (error) throw error;

  if (dogId) {
    const { error: dogLinkError } = await supabase.from("post_dogs").insert({ post_id: post.id, dog_id: dogId });
    if (dogLinkError) throw dogLinkError;
  }

  const cleanPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
  if (cleanPollOptions.length >= 2) {
    const { error: pollError } = await supabase
      .from("poll_options")
      .insert(cleanPollOptions.map((texte, ordre) => ({ post_id: post.id, texte, ordre })));
    if (pollError) throw pollError;
  }

  // Upload média réel vers Supabase Storage (bucket "posts" à créer côté Dashboard).
  const uploadedMedia = [];
  for (let i = 0; i < mediaFiles.length; i++) {
    const rawFile = mediaFiles[i];
    const mediaType = rawFile.type.startsWith("video") ? "video" : "image";
    // Compression uniquement pour les photos — une vidéo se compresse
    // différemment (encodage, pas juste des dimensions), hors de portée d'un
    // simple canvas côté navigateur.
    const file = mediaType === "image" ? await compressImage(rawFile) : rawFile;
    const path = `${userData.user.id}/${post.id}/${i}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("posts").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from("posts").getPublicUrl(path);

    let thumbnailUrl = null;
    if (mediaType === "video") {
      try {
        // Miniature choisie manuellement en priorité, sinon extraite
        // automatiquement d'une image de la vidéo.
        const thumbBlob = thumbnailFile && i === 0 ? thumbnailFile : await generateVideoThumbnail(file);
        const thumbExt = thumbnailFile && i === 0 ? thumbnailFile.name : "thumb.jpg";
        const thumbPath = `${userData.user.id}/${post.id}/${i}-thumb-${thumbExt}`;
        const { error: thumbUploadError } = await supabase.storage.from("posts").upload(thumbPath, thumbBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: thumbnailFile && i === 0 ? thumbnailFile.type : "image/jpeg",
        });
        if (!thumbUploadError) {
          thumbnailUrl = supabase.storage.from("posts").getPublicUrl(thumbPath).data.publicUrl;
        }
      } catch (e) {
        // Pas bloquant : la vidéo est publiée même si la miniature échoue
        // (ex: format vidéo non décodable par le navigateur).
      }
    }

    const { error: mediaError } = await supabase.from("post_media").insert({
      post_id: post.id,
      url: publicUrl.publicUrl,
      ordre: i,
      type: mediaType,
      thumbnail_url: thumbnailUrl,
      duration_seconds: mediaType === "video" ? mediaDurations[i] || null : null,
    });
    if (mediaError) throw mediaError;
    uploadedMedia.push({ url: publicUrl.publicUrl, type: mediaType, thumbnail_url: thumbnailUrl });
  }

  return { ...post, mediaUrls: uploadedMedia.map((m) => m.url), media: uploadedMedia };
}

export async function updatePost(postId, fields) {
  // RLS (voir 001_init.sql) garantit côté serveur que seul l'auteur peut réussir
  // cette requête — inutile et dangereux de ne compter que sur une vérification
  // frontend ici.
  const { data, error } = await supabase
    .from("posts")
    .update({
      texte: fields.texte,
      titre: fields.titre,
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

/**
 * Options d'un sondage avec leur nombre de voix réel (voir migration 036) —
 * chargé à la demande quand le sondage s'affiche, pas préchargé dans chaque
 * requête de fil (même principe que les commentaires, voir loadComments).
 */
export async function fetchPollOptions(postId) {
  const { data, error } = await supabase
    .from("poll_options")
    .select("id, texte, ordre, poll_votes(count)")
    .eq("post_id", postId)
    .order("ordre", { ascending: true });
  if (error) throw error;
  return data.map((o) => ({ id: o.id, texte: o.texte, ordre: o.ordre, votes: o.poll_votes?.[0]?.count || 0 }));
}

export async function fetchMyPollVote(postId) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await supabase.from("poll_votes").select("option_id").eq("post_id", postId).eq("user_id", userData.user.id).maybeSingle();
  if (error) throw error;
  return data?.option_id || null;
}

/** Un seul vote par personne et par sondage (contrainte primary key sur
 *  poll_votes) — revoter change simplement l'option choisie. */
export async function votePoll(postId, optionId) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Non authentifié");
  const { error } = await supabase
    .from("poll_votes")
    .upsert({ post_id: postId, user_id: userData.user.id, option_id: optionId }, { onConflict: "post_id,user_id" });
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
  const mentions = extractMentions(texte || "");
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: userData.user.id, texte, parent_id: parentId, mentions })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Recherche de vidéos/Instants réelle côté serveur (titre, description, ou
 *  auteur) — avant, l'onglet Recherche de Vidéo - Vidéo ne filtrait que les
 *  50 dernières vidéos déjà chargées en mémoire, donc "ne trouve rien" pour
 *  une vidéo plus ancienne ne voulait pas dire "n'existe pas". Deux requêtes
 *  (texte, puis auteur) fusionnées plutôt qu'un OR entre deux tables — un
 *  filtre PostgREST ne combine pas nativement une colonne locale et une
 *  colonne d'une table jointe dans la même clause .or(). */
export async function searchVideos(query, { limit = 30 } = {}) {
  const q = query.trim();
  if (!q) return [];
  const select = "*, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(id, url, ordre, type, thumbnail_url, duration_seconds)";
  const [byText, byAuthor] = await Promise.all([
    supabase.from("posts").select(select).in("type", ["video", "video_courte"]).or(`titre.ilike.%${q}%,texte.ilike.%${q}%`).order("created_at", { ascending: false }).limit(limit),
    supabase.from("posts").select(`*, profiles!posts_author_id_fkey!inner(username, nom, avatar_url), post_media(id, url, ordre, type, thumbnail_url, duration_seconds)`).in("type", ["video", "video_courte"]).or(`username.ilike.%${q}%,nom.ilike.%${q}%`, { foreignTable: "profiles" }).order("created_at", { ascending: false }).limit(limit),
  ]);
  if (byText.error) throw byText.error;
  if (byAuthor.error) throw byAuthor.error;
  const merged = new Map();
  for (const row of [...(byText.data || []), ...(byAuthor.data || [])]) merged.set(row.id, row);
  return [...merged.values()];
}

/** Fil personnalisé : récupère les posts visibles puis applique le pipeline
 *  buildFeed() (piste_core.js) — la logique de tri/diversité ne change pas,
 *  seule la source des données change (base au lieu d'un tableau local). */
export async function fetchCandidatePosts({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(id, url, ordre, type, thumbnail_url, duration_seconds)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** Publications rattachées à un groupe précis (colonne group_id — voir
 *  migration 008) — sert à afficher l'onglet "Publications" d'un groupe. */
export async function fetchGroupPosts(groupId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(id, url, ordre, type, thumbnail_url, duration_seconds)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** Publications d'un utilisateur précis — pour l'écran de profil public. */
export async function fetchUserPosts(userId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(id, url, ordre, type, thumbnail_url, duration_seconds)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** Un post précis par id — sert à ouvrir la bonne cible en tapant une
 *  notification (like/commentaire/repost/mention/nouvelle publication),
 *  jusqu'ici toutes redirigeaient à tort vers le profil de l'auteur de
 *  l'action plutôt que vers le contenu concerné. */
export async function fetchPostById(postId) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(id, url, ordre, type, thumbnail_url, duration_seconds)")
    .eq("id", postId)
    .single();
  if (error) throw error;
  return data;
}

/** Publications où un chien précis a été identifié (table de jointure
 *  post_dogs, déjà utilisée par createPost) — sert à l'onglet "Publications"
 *  de DogPage (tous types de médias confondus). */
export async function fetchPostsByDog(dogId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("post_dogs")
    .select("posts(*, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(id, url, ordre, type, thumbnail_url, duration_seconds))")
    .eq("dog_id", dogId)
    .order("created_at", { ascending: false, foreignTable: "posts" })
    .limit(limit);
  if (error) throw error;
  return data.map((r) => r.posts).filter(Boolean);
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
  return true;
}

// limit : aucune borne jusqu'ici — une publication avec des milliers de
// commentaires chargeait la table entière. Prend les `limit` PLUS RÉCENTS
// (tri descendant côté requête) puis les remet dans l'ordre chronologique
// attendu par l'affichage, même principe que fetchMessages.
export async function fetchComments(postId, { limit = 200 } = {}) {
  // Hint de nom de colonne (author_id), pas juste "profiles(...)" — depuis
  // que 045 a ajouté thread_owner_id (autre FK vers profiles, aujourd'hui
  // abandonnée mais toujours en base), l'embed court est ambigu pour
  // PostgREST et échouait silencieusement (voir 048_drop_comments_thread_owner.sql).
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!author_id(username, nom)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return [...data].reverse();
}

/**
 * Enregistre une vue réelle (table post_views, voir migration 051) — clé
 * primaire (post_id, viewer_id) empêche tout comptage en double, le trigger
 * côté base tient posts.vues à jour tout seul. Appelé à l'ouverture réelle
 * d'une vidéo, pas juste quand la vignette défile dans une liste.
 */
export async function recordPostView(postId) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || !postId) return true;
  const { error } = await supabase
    .from("post_views")
    .upsert({ post_id: postId, viewer_id: userData.user.id }, { onConflict: "post_id,viewer_id", ignoreDuplicates: true });
  if (error) throw error;
  return true;
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

export async function fetchMyReposts() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase.from("reposts").select("post_id").eq("user_id", userData.user.id);
  if (error) throw error;
  return data.map((r) => r.post_id);
}

/** Ajoute/retire un repost (table "reposts" — voir migration 010). Ne duplique
 *  jamais le contenu original : juste une relation (user_id, post_id). */
export async function toggleRepost(postId, shouldRepost) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Non authentifié");
  if (shouldRepost) {
    const { error } = await supabase.from("reposts").insert({ user_id: userData.user.id, post_id: postId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("reposts").delete().eq("user_id", userData.user.id).eq("post_id", postId);
    if (error) throw error;
  }
  return true;
}

/** Publications repostées par l'utilisateur connecté — pour l'onglet
 *  Profil → Reposts. Le contenu original (auteur, texte, médias) est bien
 *  celui de la publication d'origine, pas une copie. */
export async function fetchMyRepostedPosts() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("reposts")
    .select("created_at, posts(*, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(id, url, ordre, type, thumbnail_url, duration_seconds))")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.filter((r) => r.posts).map((r) => ({ ...r.posts, repostedAt: r.created_at }));
}

/** Publications repostées par un utilisateur précis — pour l'onglet Reposts
 *  d'un profil public (voir fetchMyRepostedPosts pour son propre profil). */
export async function fetchUserRepostedPosts(userId) {
  const { data, error } = await supabase
    .from("reposts")
    .select("created_at, posts(*, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(id, url, ordre, type, thumbnail_url, duration_seconds))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.filter((r) => r.posts).map((r) => ({ ...r.posts, repostedAt: r.created_at }));
}

