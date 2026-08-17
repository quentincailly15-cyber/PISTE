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

export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles!messages_sender_id_fkey(username, nom, avatar_url), message_media(url, type, duration_seconds)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendMessage(conversationId, texte) {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: me.id, texte })
    .select("*, profiles!messages_sender_id_fkey(username, nom, avatar_url)")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Envoie un message avec pièce jointe réelle (photo, vidéo ou vocal) — bucket
 * "messages" (voir migration 015). `mediaType` doit être 'image' | 'video' |
 * 'audio'. `durationSeconds` n'est utile que pour les vocaux.
 */
export async function sendMediaMessage(conversationId, file, mediaType, durationSeconds = null) {
  const me = await requireUser();
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: me.id, texte: null })
    .select("*, profiles!messages_sender_id_fkey(username, nom, avatar_url)")
    .single();
  if (msgError) throw msgError;

  const path = `${conversationId}/${message.id}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("messages").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from("messages").getPublicUrl(path);
  const { data: media, error: mediaError } = await supabase
    .from("message_media")
    .insert({ message_id: message.id, url: publicUrl.publicUrl, type: mediaType, duration_seconds: durationSeconds })
    .select("url, type, duration_seconds")
    .single();
  if (mediaError) throw mediaError;

  return { ...message, message_media: [media] };
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
 * rechargement une fois le média réellement disponible.
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
