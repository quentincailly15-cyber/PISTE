// piste_core.js
// Logique métier PURE de PISTE — aucune dépendance React/JSX, aucun accès DOM.
// C'est le miroir exact des fonctions définies dans piste_app.jsx (voir les sections
// "Âge & protection des mineurs" et "Algorithme de fil"). Extraite ici pour :
//   1. pouvoir être testée avec Node, sans backend ni navigateur ;
//   2. servir de point de départ direct à un vrai service backend plus tard
//      (aucune de ces fonctions ne touche à l'UI, elles sont donc réutilisables telles
//      quelles côté serveur, ou remplaçables une par une sans toucher à l'interface).

export const MIN_AGE = 14;

export function computeAge(day, month, year) {
  if (!day || !month || !year) return null;
  const today = new Date();
  const birth = new Date(Number(year), Number(month) - 1, Number(day));
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function isOldEnough(age) {
  return age !== null && age >= MIN_AGE;
}

export const MODERATION_AGE_RULES = {
  minor: { maxAge: 17, messagerieOuverte: false, profilPublicParDefaut: false, contenuSensibleMasque: true },
  adult: { messagerieOuverte: true, profilPublicParDefaut: true, contenuSensibleMasque: false },
};

export function isMinor(age) {
  return age !== null && age <= MODERATION_AGE_RULES.minor.maxAge;
}

// --- Contenu sensible --------------------------------------------------------
export const CONTENT_RATINGS = ["normal", "sensitive", "restricted"];

export function isContentVisible(rating, viewerIsMinor) {
  if (rating === "restricted") return false;
  if (rating === "sensitive" && viewerIsMinor) return false;
  return true;
}

// --- Username --------------------------------------------------------------
// Validation de FORME uniquement — l'unicité réelle ne peut être garantie que côté
// backend (voir api.checkUsernameAvailable dans piste_app.jsx). Ne jamais faire
// confiance à cette seule fonction pour empêcher un doublon.
export const RESERVED_USERNAMES = ["admin", "piste", "moderation", "support", "root", "system"];

export function validateUsernameFormat(username) {
  if (!username) return { valid: false, reason: "empty" };
  const clean = username.trim().toLowerCase();
  if (clean.length < 3 || clean.length > 24) return { valid: false, reason: "length" };
  if (!/^[a-z0-9_.]+$/.test(clean)) return { valid: false, reason: "characters" };
  if (RESERVED_USERNAMES.includes(clean)) return { valid: false, reason: "reserved" };
  return { valid: true, normalized: clean };
}

// --- Algorithme de fil (V1) --------------------------------------------------
export const FEED_WEIGHTS = { affinity: 3, recency: 2, interaction: 2, interest: 1.5, quality: 1 };

export function getCandidatePosts(posts) {
  return posts;
}
export function filterSafety(posts, blockedAuthors, hiddenPostIds) {
  return posts.filter(
    (p) => p.contentRating !== "restricted" && !blockedAuthors.includes(p.nom) && !hiddenPostIds.includes(p.id)
  );
}
export function filterAge(posts, viewerIsMinor) {
  return posts.filter((p) => isContentVisible(p.contentRating || "normal", viewerIsMinor));
}
export function calculateScores(posts, ctx) {
  const { following = [], interests = [], now = Date.now() } = ctx;
  return posts.map((p) => {
    const affinity = following.includes(p.nom) ? 1 : 0;
    const ageHours = p.createdAt ? (now - p.createdAt) / 36e5 : null;
    const recency = ageHours === null ? 0.6 : Math.max(0, 1 - ageHours / 72);
    const interaction = Math.min(1, ((p.likes || 0) + (p.commentaires || 0) * 2) / 20);
    const interestMatch = (p.animal && interests.includes(p.animal)) || (p.pratique && interests.includes(p.pratique)) ? 1 : 0;
    const quality = p.texte && p.texte.length > 20 ? 1 : 0.5;
    const score =
      affinity * FEED_WEIGHTS.affinity +
      recency * FEED_WEIGHTS.recency +
      interaction * FEED_WEIGHTS.interaction +
      interestMatch * FEED_WEIGHTS.interest +
      quality * FEED_WEIGHTS.quality;
    return Object.assign({}, p, { _score: score });
  });
}
export function sortFeed(posts) {
  return posts.slice().sort((a, b) => (b._score || 0) - (a._score || 0));
}
export function diversifyFeed(posts) {
  const byAuthor = {};
  posts.forEach((p) => {
    (byAuthor[p.nom] = byAuthor[p.nom] || []).push(p);
  });
  const queues = Object.values(byAuthor);
  const result = [];
  let added = true;
  while (added) {
    added = false;
    for (const q of queues) {
      if (q.length) {
        result.push(q.shift());
        added = true;
      }
    }
  }
  return result;
}
export function buildFeed(posts, ctx) {
  const candidates = getCandidatePosts(posts);
  const safe = filterSafety(candidates, ctx.blockedAuthors || [], ctx.hiddenPostIds || []);
  const ageOk = filterAge(safe, !!ctx.viewerIsMinor);
  const scored = calculateScores(ageOk, ctx);
  return diversifyFeed(sortFeed(scored));
}

// --- Hashtags / mentions -----------------------------------------------------
export function extractHashtags(text) {
  return Array.from(new Set((text.match(/#[\p{L}0-9_]+/gu) || []).map((h) => h.toLowerCase())));
}
export function extractMentions(text) {
  return Array.from(new Set((text.match(/@[\p{L}0-9_.]+/gu) || []).map((m) => m.toLowerCase())));
}

