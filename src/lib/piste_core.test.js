// piste_core.test.js
// Tests de la logique PURE uniquement (voir piste_core.js). Exécution : node src/lib/piste_core.test.js
// Aucun test ici ne simule d'authentification, de compte ou de backend réels — ce sont des
// fonctions déterministes testées avec assert(). Tout ce qui nécessite un vrai backend
// (unicité réelle d'un @, connexion, session...) est explicitement noté "NÉCESSITE BACKEND"
// et n'est PAS testé ici, conformément à la consigne de ne rien simuler.
import assert from "assert";
import * as core from "./piste_core.js";

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  - ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  - ${name}`);
    console.log(`        ${e.message}`);
  }
}

console.log("\n-- Âge minimum (14 ans) --");
test("un utilisateur de 13 ans est refusé", () => {
  const today = new Date();
  const y = today.getFullYear() - 13;
  const age = core.computeAge(today.getDate(), today.getMonth() + 1, y);
  assert.strictEqual(core.isOldEnough(age), false);
});
test("un utilisateur de 14 ans (anniversaire aujourd'hui) est accepté", () => {
  const today = new Date();
  const y = today.getFullYear() - 14;
  const age = core.computeAge(today.getDate(), today.getMonth() + 1, y);
  assert.strictEqual(core.isOldEnough(age), true);
});
test("un utilisateur de 30 ans est accepté", () => {
  const today = new Date();
  const y = today.getFullYear() - 30;
  const age = core.computeAge(today.getDate(), today.getMonth() + 1, y);
  assert.strictEqual(core.isOldEnough(age), true);
});
test("date de naissance incomplète -> âge nul, jamais accepté", () => {
  assert.strictEqual(core.computeAge(null, null, null), null);
  assert.strictEqual(core.isOldEnough(null), false);
});

console.log("\n-- Statut mineur (protection 14-17) --");
test("17 ans -> mineur", () => assert.strictEqual(core.isMinor(17), true));
test("18 ans -> majeur", () => assert.strictEqual(core.isMinor(18), false));

console.log("\n-- Contenu sensible --");
test("contenu interdit invisible pour tout le monde", () => {
  assert.strictEqual(core.isContentVisible("restricted", false), false);
  assert.strictEqual(core.isContentVisible("restricted", true), false);
});
test("contenu sensible masqué aux mineurs, visible aux majeurs", () => {
  assert.strictEqual(core.isContentVisible("sensitive", true), false);
  assert.strictEqual(core.isContentVisible("sensitive", false), true);
});
test("contenu normal toujours visible", () => {
  assert.strictEqual(core.isContentVisible("normal", true), true);
  assert.strictEqual(core.isContentVisible("normal", false), true);
});

console.log("\n-- Format de username (forme uniquement — voir note) --");
test("username trop court refusé", () => assert.strictEqual(core.validateUsernameFormat("ab").valid, false));
test("username avec caractères interdits refusé", () => assert.strictEqual(core.validateUsernameFormat("quentin!").valid, false));
test("username réservé refusé", () => assert.strictEqual(core.validateUsernameFormat("admin").valid, false));
test("username valide accepté et normalisé en minuscule", () => {
  const r = core.validateUsernameFormat("Quentin_17");
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.normalized, "quentin_17");
});
console.log("  (NÉCESSITE BACKEND : l'unicité réelle d'un @ n'est pas et ne doit pas être testée ici)");

console.log("\n-- Hashtags & mentions --");
test("extrait les hashtags réellement présents dans le texte", () => {
  assert.deepStrictEqual(core.extractHashtags("Belle sortie #chevreuil #approche aujourd'hui"), ["#chevreuil", "#approche"]);
});
test("extrait les mentions réellement présentes dans le texte", () => {
  assert.deepStrictEqual(core.extractMentions("Merci @jean.piste pour la sortie"), ["@jean.piste"]);
});
test("aucun hashtag ni mention inventé si absent du texte", () => {
  assert.deepStrictEqual(core.extractHashtags("Belle matinée."), []);
  assert.deepStrictEqual(core.extractMentions("Belle matinée."), []);
});

console.log("\n-- Algorithme de fil --");
test("filterSafety retire les auteurs bloqués et le contenu masqué", () => {
  // Filtré par username (identifiant réel, unique), pas par "nom" (nom
  // d'affichage, non unique et souvent vide) — voir mapPostRow côté App.jsx.
  const posts = [
    { id: "1", username: "a", contentRating: "normal" },
    { id: "2", username: "b", contentRating: "normal" },
    { id: "3", username: "a", contentRating: "restricted" },
  ];
  const result = core.filterSafety(posts, ["b"], ["3"]);
  assert.deepStrictEqual(result.map((p) => p.id), ["1"]);
});
test("filterAge masque le contenu sensible aux mineurs uniquement", () => {
  const posts = [{ id: "1", contentRating: "sensitive" }, { id: "2", contentRating: "normal" }];
  assert.deepStrictEqual(core.filterAge(posts, true).map((p) => p.id), ["2"]);
  assert.deepStrictEqual(core.filterAge(posts, false).map((p) => p.id), ["1", "2"]);
});
test("calculateScores donne un score plus élevé à un auteur suivi", () => {
  const posts = [
    { id: "1", username: "suivi", likes: 0, commentaires: 0 },
    { id: "2", username: "inconnu", likes: 0, commentaires: 0 },
  ];
  const scored = core.calculateScores(posts, { following: ["suivi"], now: Date.now() });
  const suivi = scored.find((p) => p.id === "1");
  const inconnu = scored.find((p) => p.id === "2");
  assert.ok(suivi._score > inconnu._score);
});
test("calculateScores donne un score plus élevé à un post d'un groupe rejoint", () => {
  const posts = [
    { id: "1", username: "a", groupId: "g1", likes: 0, commentaires: 0 },
    { id: "2", username: "b", groupId: "g2", likes: 0, commentaires: 0 },
  ];
  const scored = core.calculateScores(posts, { myGroupIds: ["g1"], now: Date.now() });
  const dansMonGroupe = scored.find((p) => p.id === "1");
  const autreGroupe = scored.find((p) => p.id === "2");
  assert.ok(dansMonGroupe._score > autreGroupe._score);
});
test("calculateScores pénalise un post déjà vu récemment (sans l'exclure)", () => {
  const posts = [
    { id: "1", username: "a", likes: 0, commentaires: 0 },
    { id: "2", username: "b", likes: 0, commentaires: 0 },
  ];
  const scored = core.calculateScores(posts, { seenIds: ["1"], now: Date.now() });
  const dejaVu = scored.find((p) => p.id === "1");
  const jamaisVu = scored.find((p) => p.id === "2");
  assert.ok(dejaVu._score < jamaisVu._score);
});
test("diversifyFeed alterne les auteurs plutôt que de les grouper", () => {
  const posts = [
    { nom: "A", _score: 5 }, { nom: "A", _score: 4 }, { nom: "A", _score: 3 },
    { nom: "B", _score: 2 },
  ];
  const result = core.diversifyFeed(posts);
  assert.deepStrictEqual(result.map((p) => p.nom), ["A", "B", "A", "A"]);
});
test("buildFeed ne montre jamais un contenu interdit, même bien noté", () => {
  const posts = [{ id: "1", nom: "A", contentRating: "restricted", likes: 999, commentaires: 999 }];
  const result = core.buildFeed(posts, { blockedAuthors: [], hiddenPostIds: [], viewerIsMinor: false, following: [], interests: [] });
  assert.strictEqual(result.length, 0);
});
test("buildFeed ne montre jamais de contenu sensible à un mineur", () => {
  const posts = [{ id: "1", nom: "A", contentRating: "sensitive", likes: 5, commentaires: 1 }];
  const asMinor = core.buildFeed(posts, { blockedAuthors: [], hiddenPostIds: [], viewerIsMinor: true, following: [], interests: [] });
  const asAdult = core.buildFeed(posts, { blockedAuthors: [], hiddenPostIds: [], viewerIsMinor: false, following: [], interests: [] });
  assert.strictEqual(asMinor.length, 0);
  assert.strictEqual(asAdult.length, 1);
});
test("buildChronologicalFeed classe strictement par date, jamais par score", () => {
  // Utilisé par "Nouveautés" (Vidéo) et "Abonnements" (Fil) : une publication
  // qui vient de sortir doit toujours passer devant une plus ancienne, même
  // si celle-ci a énormément plus de likes/commentaires (voir App.jsx).
  const posts = [
    { id: "ancien-mais-populaire", contentRating: "normal", createdAt: 1000, likes: 999, commentaires: 999 },
    { id: "recent", contentRating: "normal", createdAt: 5000, likes: 0, commentaires: 0 },
  ];
  const ctx = { blockedAuthors: [], hiddenPostIds: [], viewerIsMinor: false };
  const result = core.buildChronologicalFeed(posts, ctx);
  assert.deepStrictEqual(result.map((p) => p.id), ["recent", "ancien-mais-populaire"]);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).\n`);
if (failed > 0) process.exit(1);
