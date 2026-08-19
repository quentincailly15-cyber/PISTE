// messageService.js
// Appels Supabase réels pour la messagerie (tables "conversations",
// "conversation_members", "messages" — déjà présentes dans 001_init.sql,
// jamais utilisées jusqu'ici). Voir migration 011 pour la correction RLS
// nécessaire à l'ajout d'un tiers dans une conversation, et 012 pour le
// realtime.

import { supabase } from "./supabaseClient.js";

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Non authentifié");
  return data.user;
}

/** Liste des conversations de l'utilisateur connecté, avec les autres membres
 *  (pour l'affichage nom/avatar en direct) et le dernier message. */
export async function fetchConversations() {
  const me = await requireUser();

  const { data: myMemberships, error: memberError } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at, conversations(id, type, nom, image_url, created_at)")
    .eq("user_id", me.id)
    .is("left_at", null);
  if (memberError) throw memberError;
  if (!myMemberships || myMemberships.length === 0) return [];

  const conversationIds = myMemberships.map((m) => m.conversation_id);

  const { data: allMembers, error: allMembersError } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, profiles(id, username, nom, avatar_url)")
    .in("conversation_id", conversationIds)
    .is("left_at", null);
  if (allMembersError) throw allMembersError;

  const { data: recentMessages, error: messagesError } = await supabase
    .from("messages")
    .select("id, conversation_id, texte, sender_id, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });
  if (messagesError) throw messagesError;

  const lastMessageByConv = {};
  for (const msg of recentMessages) {
    if (!lastMessageByConv[msg.conversation_id]) lastMessageByConv[msg.conversation_id] = msg;
  }
  const membersByConv = {};
  for (const m of allMembers) {
    (membersByConv[m.conversation_id] = membersByConv[m.conversation_id] || []).push(m);
  }

  return myMemberships
    .filter((m) => m.conversations)
    .map((m) => {
      const conv = m.conversations;
      const members = (membersByConv[conv.id] || []).filter((x) => x.user_id !== me.id);
      const last = lastMessageByConv[conv.id];
      const lastSenderIsMe = last?.sender_id === me.id;
      // Non lue : un dernier message existe, n'est pas de moi, et est plus
      // récent que ma dernière lecture de cette conversation (voir migration
      // 016 — même logique que fetchUnreadConversationCount, au niveau d'une
      // seule conversation cette fois pour l'affichage de la liste).
      const unread = !!last && !lastSenderIsMe && (!m.last_read_at || new Date(last.created_at) > new Date(m.last_read_at));
      // Vrai décompte (pas juste un booléen) — pour la pastille numérotée de
      // la liste, comme la référence. Calculé sur les messages déjà chargés
      // ci-dessus, aucune requête supplémentaire par conversation.
      const unreadCount = recentMessages.filter((msg) => (
        msg.conversation_id === conv.id && msg.sender_id !== me.id && (!m.last_read_at || new Date(msg.created_at) > new Date(m.last_read_at))
      )).length;
      return {
        id: conv.id,
        type: conv.type,
        nom: conv.type === "group" ? conv.nom : members[0]?.profiles?.nom || members[0]?.profiles?.username || "Utilisateur",
        avatar: conv.type === "group" ? conv.image_url || null : members[0]?.profiles?.avatar_url || null,
        members: members.map((x) => ({ id: x.user_id, username: x.profiles?.username, nom: x.profiles?.nom || x.profiles?.username, avatar: x.profiles?.avatar_url })),
        lastMessage: last?.texte || null,
        hasLastMessage: !!last, // distingue "aucun message" de "dernier message sans texte" (photo/vidéo/vocal)
        lastMessageAt: last?.created_at || conv.created_at,
        lastSenderIsMe,
        unread,
        unreadCount,
      };
    })
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
}

/** Retrouve une conversation directe existante avec cet utilisateur, ou en
 *  crée une nouvelle si aucune n'existe encore. */
export async function startDirectConversation(otherUserId) {
  const me = await requireUser();
  if (otherUserId === me.id) throw new Error("Impossible de démarrer une conversation avec soi-même.");

  const { data: myDirectMemberships, error: fetchError } = await supabase
    .from("conversation_members")
    .select("conversation_id, conversations!inner(type)")
    .eq("user_id", me.id)
    .eq("conversations.type", "direct");
  if (fetchError) throw fetchError;

  if (myDirectMemberships.length > 0) {
    const { data: otherMemberships, error: otherError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myDirectMemberships.map((m) => m.conversation_id));
    if (otherError) throw otherError;
    if (otherMemberships.length > 0) return otherMemberships[0].conversation_id;
  }

  // L'id est généré côté client (au lieu de laisser Postgres le faire et de le
  // relire juste après) : juste après l'insert, le créateur n'est pas encore
  // membre, donc la policy de lecture bloquerait la relecture immédiate.
  const conversationId = crypto.randomUUID();
  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: conversationId, type: "direct", created_by: me.id });
  if (convError) throw convError;

  // Deux insertions séparées et non un seul lot : au sein d'un même INSERT,
  // les lignes partagent le même instantané — ma propre ligne (ci-dessous)
  // ne serait pas encore "visible" pour autoriser l'ajout de l'autre personne
  // via is_conversation_member() si les deux étaient envoyées ensemble.
  const { error: selfError } = await supabase.from("conversation_members").insert({ conversation_id: conversationId, user_id: me.id });
  if (selfError) throw selfError;
  const { error: otherMemberError } = await supabase.from("conversation_members").insert({ conversation_id: conversationId, user_id: otherUserId });
  if (otherMemberError) throw otherMemberError;

  return conversationId;
}

/** Crée un groupe de messagerie (distinct des groupes communautaires PISTE —
 *  voir groupService.js) avec un nom et plusieurs membres. */
export async function createGroupConversation(nom, memberIds) {
  const me = await requireUser();
  const conversationId = crypto.randomUUID();
  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: conversationId, type: "group", nom, created_by: me.id });
  if (convError) throw convError;

  // Même raison que startDirectConversation : je m'ajoute d'abord seul, puis
  // les autres membres dans une insertion séparée.
  const { error: selfError } = await supabase.from("conversation_members").insert({ conversation_id: conversationId, user_id: me.id });
  if (selfError) throw selfError;
  const others = memberIds.filter((id) => id !== me.id).map((id) => ({ conversation_id: conversationId, user_id: id }));
  if (others.length > 0) {
    const { error: membersError } = await supabase.from("conversation_members").insert(others);
    if (membersError) throw membersError;
  }

  return conversationId;
}

/** Upload la photo d'un groupe de discussion (bucket "conversations" — voir
 *  migration 023) et met à jour conversations.image_url. */
export async function uploadConversationImage(conversationId, file) {
  const path = `${conversationId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("conversations").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from("conversations").getPublicUrl(path);
  const { error: updateError } = await supabase.from("conversations").update({ image_url: publicUrl.publicUrl }).eq("id", conversationId);
  if (updateError) throw updateError;

  return publicUrl.publicUrl;
}

/** Upload une photo de fond pour UNE conversation (bucket "conversations",
 *  même bucket que la photo de groupe mais sous un préfixe distinct) — le
 *  choix du fond lui-même reste une préférence locale à l'appareil (voir
 *  localStorage côté ConversationThread), seule l'image doit être hébergée
 *  quelque part de réel pour survivre au rechargement de la page. */
export async function uploadConversationBackground(conversationId, file) {
  const path = `${conversationId}/background/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("conversations").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data: publicUrl } = supabase.storage.from("conversations").getPublicUrl(path);
  return publicUrl.publicUrl;
}

/** Quitte un groupe de discussion — marque sa propre ligne d'appartenance
 *  comme quittée (left_at) plutôt que de la supprimer, pour garder
 *  l'historique des messages déjà échangés. RLS ("member manages own
 *  membership", 001_init.sql) autorise déjà cette mise à jour. */
export async function leaveConversation(conversationId) {
  const me = await requireUser();
  const { error } = await supabase
    .from("conversation_members")
    .update({ left_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", me.id);
  if (error) throw error;
  return true;
}

export async function fetchConversationMembers(conversationId) {
  const { data, error } = await supabase
    .from("conversation_members")
    .select("user_id, profiles(id, username, nom, avatar_url)")
    .eq("conversation_id", conversationId)
    .is("left_at", null);
  if (error) throw error;
  return data.filter((r) => r.profiles).map((r) => ({ id: r.profiles.id, username: r.profiles.username, nom: r.profiles.nom || r.profiles.username, avatar: r.profiles.avatar_url }));
}

// Pièce commune à toutes les lectures de messages : expéditeur, média,
// message cité (réponse ciblée) et réactions (voir migration 038).
//
// L'indice de jointure "messages!reply_to_id" (nom de COLONNE, pas de
// contrainte) est volontairement utilisé plutôt que "messages!messages_
// reply_to_id_fkey" (nom de contrainte) — PostgREST accepte les deux formes,
// mais celle par nom de contrainte échoue si le nom réellement généré en
// base diffère ne serait-ce que légèrement de ce que le code suppose
// ("Could not find a relationship..."). Le nom de colonne ne dépend d'aucune
// convention de nommage côté Postgres et fonctionne dès que la clé étrangère
// existe, quel que soit son nom.
// reply_to embarque aussi message_media(type) et shared_post_id : sans ça,
// répondre à un message sans texte (photo, vidéo, vocal, publication
// partagée) affichait une citation vide — juste le nom de l'auteur, aucun
// moyen de savoir à quel message précis la réponse renvoyait.
const MESSAGE_SELECT = "*, profiles!messages_sender_id_fkey(username, nom, avatar_url), message_media(url, type, duration_seconds), reply_to:messages!reply_to_id(id, texte, sender_id, profiles!messages_sender_id_fkey(nom, username), message_media(type), shared_post_id), message_reactions(user_id, emoji), shared_post:posts!shared_post_id(id, type, texte, titre, profiles!posts_author_id_fkey(username, nom, avatar_url), post_media(url, ordre, type, thumbnail_url))";

/**
 * Le bucket "messages" est privé (migration 056) — message_media.url ne
 * contient plus une URL publique mais le chemin Storage brut. On génère ici
 * une URL signée (1h) juste avant de renvoyer les messages à l'interface,
 * en un seul appel groupé plutôt qu'un par média. `path` reste accessible
 * à côté de `url` (signée) pour que deleteMessage() puisse supprimer le
 * fichier sans avoir à re-parser une URL.
 */
async function withSignedMedia(rows) {
  const paths = rows.map((m) => m.message_media?.[0]?.url).filter(Boolean);
  if (paths.length === 0) return rows;
  const { data: signed } = await supabase.storage.from("messages").createSignedUrls(paths, 3600);
  const byPath = new Map((signed || []).filter((s) => !s.error).map((s) => [s.path, s.signedUrl]));
  return rows.map((m) => {
    const media = m.message_media?.[0];
    if (!media) return m;
    return { ...m, message_media: [{ ...media, path: media.url, url: byPath.get(media.url) || null }] };
  });
}

export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return withSignedMedia(data);
}

export async function sendMessage(conversationId, texte, replyToId = null) {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: me.id, texte, reply_to_id: replyToId })
    .select(MESSAGE_SELECT)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Partage une publication/vidéo/Instant en message privé (voir migration
 * 041) — référence le post existant, ne duplique jamais son contenu. La
 * visibilité reçue par le destinataire reste celle du post d'origine (RLS
 * sur "posts", inchangée).
 */
export async function sendSharedPost(conversationId, postId, note = null) {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: me.id, texte: note, shared_post_id: postId })
    .select(MESSAGE_SELECT)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Envoie un message avec pièce jointe réelle (photo, vidéo ou vocal) — bucket
 * "messages" (voir migration 015). `mediaType` doit être 'image' | 'video' |
 * 'audio'. `durationSeconds` n'est utile que pour les vocaux.
 */
export async function sendMediaMessage(conversationId, file, mediaType, durationSeconds = null, replyToId = null) {
  const me = await requireUser();
  // MESSAGE_SELECT (pas une version allégée) : sans reply_to embarqué ici,
  // répondre à un message avec une pièce jointe n'affichait aucune citation
  // dans la bulle tant que la conversation n'était pas rechargée.
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: me.id, texte: null, reply_to_id: replyToId })
    .select(MESSAGE_SELECT)
    .single();
  if (msgError) throw msgError;

  const path = `${conversationId}/${message.id}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("messages").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  // Chemin brut stocké (pas d'URL publique — le bucket est privé, migration
  // 056) : une URL signée est générée à la demande, ici pour l'affichage
  // immédiat, et à chaque fetchMessages() ensuite (voir withSignedMedia).
  const { data: media, error: mediaError } = await supabase
    .from("message_media")
    .insert({ message_id: message.id, url: path, type: mediaType, duration_seconds: durationSeconds })
    .select("url, type, duration_seconds")
    .single();
  if (mediaError) throw mediaError;

  const { data: signedData } = await supabase.storage.from("messages").createSignedUrl(path, 3600);
  return { ...message, message_media: [{ ...media, path: media.url, url: signedData?.signedUrl || null }] };
}

/**
 * Supprime un message envoyé par l'utilisateur connecté (RLS : "sender
 * deletes own messages", migration 035). message_media est en cascade côté
 * base, mais le fichier Storage lui-même ne l'est pas — on le retire ici en
 * best-effort. `mediaPath` est le chemin Storage brut (message_media[0].path,
 * voir withSignedMedia) — plus besoin de le re-extraire d'une URL depuis que
 * le bucket est privé et servi par URL signée (migration 056).
 */
export async function deleteMessage(messageId, mediaPath = null) {
  if (mediaPath) {
    await supabase.storage.from("messages").remove([mediaPath]).catch(() => {});
  }
  const { error } = await supabase.from("messages").delete().eq("id", messageId);
  if (error) throw error;
  return true;
}

/**
 * Double-tap sur un message = cœur, façon Instagram (voir migration 038).
 * Bascule : ajoute la réaction si absente, la retire si on avait déjà réagi
 * (une seule réaction par personne et par message, contrainte primary key).
 */
export async function toggleMessageReaction(messageId, emoji = "❤️") {
  const me = await requireUser();
  const { data: existing } = await supabase.from("message_reactions").select("emoji").eq("message_id", messageId).eq("user_id", me.id).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", me.id);
    if (error) throw error;
    return { reacted: false };
  }
  const { error } = await supabase.from("message_reactions").insert({ message_id: messageId, user_id: me.id, emoji });
  if (error) throw error;
  return { reacted: true };
}

/**
 * Abonnement realtime aux nouveaux messages d'une conversation (Supabase
 * Realtime — voir migration 012). Renvoie une fonction de désabonnement.
 *
 * Écoute aussi les insertions dans message_media : pour un message avec
 * pièce jointe, la ligne `messages` est créée AVANT que le fichier soit
 * uploadé et que la ligne `message_media` existe (voir sendMediaMessage).
 * Si on ne réagissait qu'à l'insert de `messages`, un rechargement déclenché
 * trop tôt afficherait le message sans son média, sans jamais se corriger.
 * On réagit donc aussi à l'insert de message_media pour redéclencher un
 * rechargement une fois le média réellement disponible — et à la suppression
 * d'un message pour que sa disparition soit vue par l'autre participant sans
 * qu'il ait besoin de rouvrir la conversation.
 */
export function subscribeToConversation(conversationId, onInsert) {
  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
      onInsert(payload.new);
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_media" }, () => {
      onInsert(null); // on ne sait pas filtrer par conversation ici : on recharge, c'est peu coûteux
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, () => {
      onInsert(null); // idem : le payload DELETE ne contient pas conversation_id, on recharge
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
      onInsert(null); // le double-tap de l'autre personne doit apparaître sans rouvrir la conversation
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/** Abonnement realtime global (toutes conversations confondues) — sert à
 *  rafraîchir la liste des conversations quand un nouveau message arrive
 *  ailleurs que dans la conversation actuellement ouverte. Deux appelants
 *  différents (ScreenMessages et le badge de MainApp) peuvent être actifs en
 *  même temps : chaque appel doit avoir son propre nom de canal Supabase
 *  Realtime, sinon le second `.on()` plante ("cannot add postgres_changes
 *  callbacks... after subscribe()") car Supabase réutilise le canal existant
 *  du même nom. */
export function subscribeToMyMessages(onInsert) {
  const channelName = `my-messages-${crypto.randomUUID()}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      onInsert(payload.new);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/**
 * État de lecture des AUTRES membres d'une conversation (jamais le mien) —
 * sert à afficher "Lu" sous mon dernier message envoyé. RLS ("member reads
 * own membership rows", migration 013) autorise déjà un membre à lire toutes
 * les lignes conversation_members de ses propres conversations, pas
 * seulement la sienne.
 */
export async function fetchConversationReadState(conversationId, meId) {
  const { data, error } = await supabase
    .from("conversation_members")
    .select("user_id, last_read_at")
    .eq("conversation_id", conversationId)
    .is("left_at", null)
    .neq("user_id", meId);
  if (error) throw error;
  return data;
}

/** Abonnement realtime aux mises à jour de last_read_at des autres membres
 *  (voir migration 032) — permet à l'indicateur "Lu" de passer en direct dès
 *  que le destinataire ouvre la conversation, sans recharger. */
export function subscribeToReadState(conversationId, onUpdate) {
  const channel = supabase
    .channel(`read-state-${conversationId}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_members", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
      onUpdate(payload.new);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/** Marque une conversation comme lue "maintenant" — appelé à l'ouverture du
 *  fil (voir migration 016). */
export async function markConversationRead(conversationId) {
  const me = await requireUser();
  const { error } = await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", me.id);
  if (error) throw error;
}

/**
 * Nombre de CONVERSATIONS ayant au moins un message non lu — pas le nombre
 * total de messages non lus (une conversation avec 3 messages non lus compte
 * pour 1, pas 3). Une conversation est "non lue" si son dernier message est
 * postérieur à last_read_at ET n'a pas été envoyé par moi.
 */
export async function fetchUnreadConversationCount() {
  const me = await requireUser();
  const { data: memberships, error: memberError } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at")
    .eq("user_id", me.id)
    .is("left_at", null);
  if (memberError) throw memberError;
  if (!memberships || memberships.length === 0) return 0;

  const { data: recentMessages, error: messagesError } = await supabase
    .from("messages")
    .select("conversation_id, sender_id, created_at")
    .in("conversation_id", memberships.map((m) => m.conversation_id))
    .order("created_at", { ascending: false });
  if (messagesError) throw messagesError;

  const latestByConv = {};
  for (const msg of recentMessages) {
    if (!latestByConv[msg.conversation_id]) latestByConv[msg.conversation_id] = msg;
  }

  let count = 0;
  for (const m of memberships) {
    const latest = latestByConv[m.conversation_id];
    if (!latest || latest.sender_id === me.id) continue;
    if (!m.last_read_at || new Date(latest.created_at) > new Date(m.last_read_at)) count++;
  }
  return count;
}
