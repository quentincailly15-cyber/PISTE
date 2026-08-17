import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from "react";
import {
  Home, Plus, Users, User, Search, Bell, MessageCircle, ArrowLeft, X, Menu,
  Image as ImageIcon, Type as TypeIcon, CalendarDays, Settings, ChevronRight,
  Check, Video, Film, Dog, Repeat2, MapPin,
  Bookmark, HelpCircle, AlertTriangle, LogOut, Moon, Sun, Monitor, BarChart3,
  Heart, MessageSquare, Share2, MoreHorizontal, Camera, Play, BookOpen, Mic,
} from "lucide-react";
import * as authService from "./services/authService.js";
import * as postService from "./services/postService.js";
import * as profileService from "./services/profileService.js";
import * as dogService from "./services/dogService.js";
import * as groupService from "./services/groupService.js";
import * as socialService from "./services/socialService.js";
import * as messageService from "./services/messageService.js";
import * as notificationService from "./services/notificationService.js";
import { supabase } from "./services/supabaseClient.js";

/* ============================================================
   1. TOKENS DE DESIGN — un seul accent (vert kaki)
   ============================================================ */
const RADIUS = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Inter, sans-serif';

const THEMES = {
  light: {
    background: "#FAFAF8",
    surface: "#FFFFFF",
    surfaceAlt: "#F1F1EF",
    surfaceRaised: "#FFFFFF",
    border: "#E7E7E4",
    text: "#1A1A18",
    textSecondary: "#8A8A85",
    textFaint: "#B7B7B1",
    accent: "#6B7A47",
    accentSoft: "#E6E9D9",
    onAccent: "#FFFFFF",
    error: "#C0453A",
    errorSoft: "#F6E2DF",
    overlay: "rgba(20,18,16,0.38)",
    navBg: "rgba(255,255,255,0.82)",
    headerBg: "rgba(250,250,248,0.82)",
  },
  dark: {
    background: "#151515",
    surface: "#202020",
    surfaceAlt: "#242424",
    surfaceRaised: "#2A2A2A",
    border: "rgba(255,255,255,0.09)",
    text: "#F4F2EF",
    textSecondary: "#A8A8A4",
    textFaint: "#6E6E6A",
    accent: "#94A66C",
    accentSoft: "rgba(148,166,108,0.16)",
    onAccent: "#14170D",
    error: "#E17466",
    errorSoft: "rgba(225,116,102,0.16)",
    overlay: "rgba(0,0,0,0.6)",
    navBg: "rgba(24,24,24,0.82)",
    headerBg: "rgba(21,21,21,0.82)",
  },
};

const ThemeContext = createContext(null);
function useTheme() {
  return useContext(ThemeContext);
}
function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light"); // 'light' | 'dark' | 'system'
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler));
  }, []);
  const resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  const colors = THEMES[resolved];
  const value = useMemo(() => ({ mode, setMode, resolved, colors }), [mode, resolved, colors]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/* ============================================================
   2. MODÈLE DE DONNÉES + COUCHE API (stubs, à connecter)
   Aucune donnée fictive n'est instanciée ici — uniquement la forme.
   ============================================================ */
// const post = { id, nom, avatar, image, texte, date, type, animal, pratique, chienId, localisation, likes, commentaires };
// const video = { id, nom, avatar, image, titre, duree, format, likes, commentaires };
// const group = { id, nom, imageUrl, description, categorie, nombreMembres };
// const profile = { id, nom, username, avatar, imageCouverture, bio, localisation, interets, badges, age, estMineur, statistiques: { abonnes, abonnements, publications } };
// const comment = { id, auteur, texte, date };
// const report = { id, targetId, targetType, reason, date };
// const dog = { id, nom, race, age, photo, description };

const api = {
  // Follow/unfollow, groupes, chiens, profil, blocage et signalement sont
  // désormais réellement branchés (socialService.js / groupService.js /
  // dogService.js / profileService.js) — seule l'assistance reste ici, faute
  // de table dédiée côté base.
  submitHelpRequest: async (request) => { /* TODO: connect to backend / support inbox */ return true; },
};

/* ============================================================
   3. PRIMITIVES
   ============================================================ */
function Logo({ size = 30, background = true }) {
  const { colors } = useTheme();
  // Symbole PISTE : un "P" blanc simple, épuré, sur fond orange — identité réduite au
  // strict minimum. Un seul path avec fillRule="evenodd" pour le "trou" de la lettre :
  // fonctionne aussi bien sur le badge orange qu'en silhouette seule (monochrome).
  const mark = (
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 48 48" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 8H26C33 8 38 12.5 38 19C38 25.5 33 30 26 30H20V40H14V8Z
           M20 14H26C29 14 31.5 16 31.5 19C31.5 22 29 24 26 24H20V14Z"
        fill="white"
      />
    </svg>
  );
  if (!background) return mark;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {mark}
    </div>
  );
}
function Wordmark({ size = 15 }) {
  const { colors } = useTheme();
  return <span style={{ fontWeight: 800, fontSize: size, letterSpacing: 3, color: colors.text }}>PISTE</span>;
}
// Système d'icônes PISTE — construites avec le même vocabulaire graphique que le logo
// (barres arrondies / cercles pleins), pour les futures fonctionnalités de la marque.
function PisteGlyph({ type, size = 16, color }) {
  if (type === "actualites") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="4" rx="2" fill={color} />
        <rect x="3" y="14" width="11" height="4" rx="2" fill={color} />
      </svg>
    );
  }
  if (type === "sorties") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="6.5" width="17" height="14" rx="4" stroke={color} strokeWidth="2" />
        <rect x="7" y="2.5" width="3" height="6" rx="1.5" fill={color} />
        <rect x="14" y="2.5" width="3" height="6" rx="1.5" fill={color} />
      </svg>
    );
  }
  if (type === "carte") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20V6.5z" fill={color} opacity="0.16" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8.5 4v13.5M15.5 6.5V20" stroke={color} strokeWidth="1.6" strokeDasharray="2.2 2.2" strokeLinecap="round" />
        <circle cx="12" cy="11" r="1.8" fill={color} />
      </svg>
    );
  }
  if (type === "marketplace") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <g transform="rotate(45 12 12)">
          <rect x="6" y="9" width="15" height="6" rx="3" fill={color} />
          <circle cx="9.5" cy="12" r="1.3" fill="white" />
        </g>
      </svg>
    );
  }
  return null;
}

function Button({ children, onClick, disabled, variant = "primary", full = true }) {
  const { colors } = useTheme();
  const styles = {
    primary: { background: disabled ? colors.border : colors.accent, color: disabled ? colors.textFaint : colors.onAccent, border: "none" },
    secondary: { background: colors.surface, color: colors.text, border: `1px solid ${colors.border}` },
    ghost: { background: "transparent", color: colors.accent, border: "none" },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} className="transition-transform active:scale-[0.98]" style={{ width: full ? "100%" : "auto", borderRadius: RADIUS.md, padding: "14px 22px", fontSize: 14.5, fontWeight: 700, cursor: disabled ? "default" : "pointer", ...styles }}>
      {children}
    </button>
  );
}
function IconButton({ icon: Icon, onClick, size = 36, active }) {
  const { colors } = useTheme();
  return (
    <button onClick={onClick} className="active:scale-90 transition-transform" style={{ width: size, height: size, borderRadius: RADIUS.sm, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer" }}>
      <Icon size={19} color={active ? colors.accent : colors.text} strokeWidth={1.8} />
    </button>
  );
}
function Chip({ label, active, onClick }) {
  const { colors } = useTheme();
  return (
    <button onClick={onClick} className="transition-colors active:scale-95" style={{ border: `1.5px solid ${active ? colors.accent : colors.border}`, background: active ? colors.accentSoft : colors.surface, color: active ? colors.accent : colors.textSecondary, borderRadius: RADIUS.pill, padding: "9px 15px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      {active && <Check size={12} strokeWidth={3} />}
      {label}
    </button>
  );
}
function EmptyState({ title, subtitle, ctaLabel, onCta }) {
  const { colors } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "56px 32px", gap: 14 }}>
      <div style={{ width: 54, height: 54, borderRadius: RADIUS.md, background: colors.surface, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Logo size={28} background={false} />
        <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.accentSoft, position: "absolute", opacity: 0 }} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{title}</div>
      <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.55, maxWidth: 260 }}>{subtitle}</div>
      {ctaLabel && <div style={{ marginTop: 6 }}><Button onClick={onCta} full={false}>{ctaLabel}</Button></div>}
    </div>
  );
}
function TextField({ label, value, onChange, placeholder, type = "text", error, textarea, rows = 3 }) {
  const { colors } = useTheme();
  const style = { width: "100%", border: `1.5px solid ${error ? colors.error : colors.border}`, background: colors.surface, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 14, color: colors.text, outline: "none", boxSizing: "border-box", fontFamily: FONT };
  return (
    <div style={{ marginBottom: SPACE.lg }}>
      {label && <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.textSecondary, marginBottom: 6, display: "block" }}>{label}</label>}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...style, resize: "none" }} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
      )}
      {error && <div style={{ fontSize: 11.5, color: colors.error, marginTop: 5, fontWeight: 500 }}>{error}</div>}
    </div>
  );
}
function SegmentedControl({ options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{ border: "none", background: value === o.key ? colors.text : "transparent", color: value === o.key ? colors.background : colors.textSecondary, borderRadius: RADIUS.pill, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
function ScreenHeader({ title, onBack, onCloseX }) {
  const { colors } = useTheme();
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
      <div className="flex items-center gap-3">
        {onBack && <IconButton icon={ArrowLeft} onClick={onBack} />}
        <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{title}</span>
      </div>
      {onCloseX && <IconButton icon={X} onClick={onCloseX} />}
    </div>
  );
}
function ProgressDots({ step, total }) {
  const { colors } = useTheme();
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, background: i <= step ? colors.accent : colors.border, transition: "all 200ms ease" }} />
      ))}
    </div>
  );
}

/* ============================================================
   TAXONOMIES (données de structure réelles, pas du contenu)
   ============================================================ */
const INTERESTS = ["Grand gibier", "Petit gibier", "Gibier d'eau", "Battue", "Chasse à courre", "Approche", "Affût", "Chien d'arrêt", "Chiens courants", "Cuisine du gibier", "Matériel", "Photographie", "Nature / observation"];
const PROFILE_TYPES = ["Chasseur", "Passionné", "Créateur", "Professionnel"];
// Structure de données réelle région → départements français (au lieu d'une simple liste
// de régions comparée en texte). Garantit qu'un département affiché appartient forcément
// à la région sélectionnée — l'incohérence devient structurellement impossible plutôt que
// vérifiée après coup.
const REGIONS_DEPARTEMENTS = {
  "Auvergne-Rhône-Alpes": ["01 - Ain", "03 - Allier", "07 - Ardèche", "15 - Cantal", "26 - Drôme", "38 - Isère", "42 - Loire", "43 - Haute-Loire", "63 - Puy-de-Dôme", "69 - Rhône", "73 - Savoie", "74 - Haute-Savoie"],
  "Bourgogne-Franche-Comté": ["21 - Côte-d'Or", "25 - Doubs", "39 - Jura", "58 - Nièvre", "70 - Haute-Saône", "71 - Saône-et-Loire", "89 - Yonne", "90 - Territoire de Belfort"],
  "Bretagne": ["22 - Côtes-d'Armor", "29 - Finistère", "35 - Ille-et-Vilaine", "56 - Morbihan"],
  "Centre-Val de Loire": ["18 - Cher", "28 - Eure-et-Loir", "36 - Indre", "37 - Indre-et-Loire", "41 - Loir-et-Cher", "45 - Loiret"],
  "Corse": ["2A - Corse-du-Sud", "2B - Haute-Corse"],
  "Grand Est": ["08 - Ardennes", "10 - Aube", "51 - Marne", "52 - Haute-Marne", "54 - Meurthe-et-Moselle", "55 - Meuse", "57 - Moselle", "67 - Bas-Rhin", "68 - Haut-Rhin", "88 - Vosges"],
  "Hauts-de-France": ["02 - Aisne", "59 - Nord", "60 - Oise", "62 - Pas-de-Calais", "80 - Somme"],
  "Île-de-France": ["75 - Paris", "77 - Seine-et-Marne", "78 - Yvelines", "91 - Essonne", "92 - Hauts-de-Seine", "93 - Seine-Saint-Denis", "94 - Val-de-Marne", "95 - Val-d'Oise"],
  "Normandie": ["14 - Calvados", "27 - Eure", "50 - Manche", "61 - Orne", "76 - Seine-Maritime"],
  "Nouvelle-Aquitaine": ["16 - Charente", "17 - Charente-Maritime", "19 - Corrèze", "23 - Creuse", "24 - Dordogne", "33 - Gironde", "40 - Landes", "47 - Lot-et-Garonne", "64 - Pyrénées-Atlantiques", "79 - Deux-Sèvres", "86 - Vienne", "87 - Haute-Vienne"],
  "Occitanie": ["09 - Ariège", "11 - Aude", "12 - Aveyron", "30 - Gard", "31 - Haute-Garonne", "32 - Gers", "34 - Hérault", "46 - Lot", "48 - Lozère", "65 - Hautes-Pyrénées", "66 - Pyrénées-Orientales", "81 - Tarn", "82 - Tarn-et-Garonne"],
  "Pays de la Loire": ["44 - Loire-Atlantique", "49 - Maine-et-Loire", "53 - Mayenne", "72 - Sarthe", "85 - Vendée"],
  "Provence-Alpes-Côte d'Azur": ["04 - Alpes-de-Haute-Provence", "05 - Hautes-Alpes", "06 - Alpes-Maritimes", "13 - Bouches-du-Rhône", "83 - Var", "84 - Vaucluse"],
};
const REGIONS = Object.keys(REGIONS_DEPARTEMENTS);

// --- Âge & protection des mineurs -----------------------------------------
// Calcule l'âge réel à partir de la date de naissance plutôt qu'un simple champ "âge"
// déclaratif. Sert de base à des règles d'accès différenciées — mais NE constitue PAS
// à lui seul une garantie de conformité légale (RGPD, protection des mineurs, etc.).
// Ces points devront être validés juridiquement avant tout lancement public :
//   - vérification d'identité réelle de l'âge déclaré
//   - obligations spécifiques selon les juridictions (âge de consentement numérique...)
//   - modalités de consentement parental le cas échéant
function computeAge(day, month, year) {
  if (!day || !month || !year) return null;
  const today = new Date();
  const birth = new Date(Number(year), Number(month) - 1, Number(day));
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}
// Structure (pas encore appliquée automatiquement) des restrictions envisagées par tranche
// d'âge — à brancher sur de vraies vérifications backend avant d'être réellement appliquée.
const MIN_AGE = 14; // en dessous, l'inscription est refusée dès l'onboarding
const MODERATION_AGE_RULES = {
  minor: { maxAge: 17, messagerieOuverte: false, profilPublicParDefaut: false, contenuSensibleMasque: true },
  adult: { messagerieOuverte: true, profilPublicParDefaut: true, contenuSensibleMasque: false },
};
// --- Contenu sensible -------------------------------------------------------
// Classification déclarée par l'auteur à la publication (normal / sensible / interdit).
// "Interdit" reste réservé à la modération réelle (voir REPORT_REASONS) — un auteur ne
// peut se classer lui-même que normal ou sensible. Logique centralisée ici plutôt que
// dispersée dans chaque composant d'affichage.
const CONTENT_RATINGS = {
  normal: { label: "Normal" },
  sensitive: { label: "Sensible", warning: "Cette publication peut contenir des images liées à la chasse (dépouillement, sang, blessures) pouvant choquer certains utilisateurs." },
  restricted: { label: "Interdit" }, // attribué uniquement par la modération, jamais par l'auteur
};
function isContentVisible(rating, viewerIsMinor) {
  if (rating === "restricted") return false; // retiré, quel que soit le spectateur
  if (rating === "sensitive" && viewerIsMinor) return false; // masqué aux mineurs par défaut
  return true;
}

// --- Algorithme de fil (V1) ---------------------------------------------
// Pipeline explicite et centralisé, pensé pour être remplacé par un vrai service
// backend sans changer l'interface : getCandidatePosts → filterSafety → filterAge →
// calculateScores → sortFeed → diversifyFeed. Chaque étape est une fonction pure,
// testable indépendamment (voir piste_core.js / piste_core.test.js).
const FEED_WEIGHTS = { affinity: 3, recency: 2, interaction: 2, interest: 1.5, quality: 1, groupAffinity: 1.2, alreadySeen: -2.5 };

function getCandidatePosts(posts) {
  return posts; // point d'entrée unique — deviendra un vrai fetch paginé côté backend
}
function filterSafety(posts, blockedAuthors, hiddenPostIds) {
  return posts.filter((p) => p.contentRating !== "restricted" && !blockedAuthors.includes(p.username) && !hiddenPostIds.includes(p.id));
}
function filterAge(posts, viewerIsMinor) {
  return posts.filter((p) => isContentVisible(p.contentRating || "normal", viewerIsMinor));
}
function calculateScores(posts, ctx) {
  const { following = [], interests = [], now = Date.now(), myGroupIds = [], seenIds = [] } = ctx;
  return posts.map((p) => {
    const affinity = following.includes(p.username) ? 1 : 0;
    const ageHours = p.createdAt ? (now - p.createdAt) / 36e5 : null;
    const recency = ageHours === null ? 0.6 : Math.max(0, 1 - ageHours / 72); // décroît sur 72h
    const interaction = Math.min(1, ((p.likes || 0) + (p.commentaires || 0) * 2) / 20);
    const interestMatch = (p.animal && interests.includes(p.animal)) || (p.pratique && interests.includes(p.pratique)) ? 1 : 0;
    const quality = p.texte && p.texte.length > 20 ? 1 : 0.5;
    // Signal groupe : un post publié dans un groupe que l'utilisateur a rejoint
    // est plus pertinent — n'a d'effet que si p.groupId existe (voir mapPostRow).
    const groupAffinity = p.groupId && myGroupIds.includes(p.groupId) ? 1 : 0;
    // Pénalité "déjà vu" : fait redescendre (sans l'exclure) un contenu déjà
    // montré récemment dans Découvrir — voir buildDiscoverFeed().
    const alreadySeen = seenIds.includes(p.id) ? 1 : 0;
    const score =
      affinity * FEED_WEIGHTS.affinity +
      recency * FEED_WEIGHTS.recency +
      interaction * FEED_WEIGHTS.interaction +
      interestMatch * FEED_WEIGHTS.interest +
      quality * FEED_WEIGHTS.quality +
      groupAffinity * FEED_WEIGHTS.groupAffinity +
      alreadySeen * FEED_WEIGHTS.alreadySeen;
    return { ...p, _score: score };
  });
}
function sortFeed(posts) {
  return [...posts].sort((a, b) => (b._score || 0) - (a._score || 0));
}
function diversifyFeed(posts) {
  // Round-robin par auteur : évite d'afficher plusieurs contenus du même auteur d'affilée,
  // tout en conservant le classement par score au sein de chaque auteur.
  const byAuthor = {};
  posts.forEach((p) => { const key = p.username || p.nom; (byAuthor[key] = byAuthor[key] || []).push(p); });
  const queues = Object.values(byAuthor);
  const result = [];
  let added = true;
  while (added) {
    added = false;
    for (const q of queues) if (q.length) { result.push(q.shift()); added = true; }
  }
  return result;
}
function buildFeed(posts, ctx) {
  const candidates = getCandidatePosts(posts);
  const safe = filterSafety(candidates, ctx.blockedAuthors || [], ctx.hiddenPostIds || []);
  const ageOk = filterAge(safe, !!ctx.viewerIsMinor);
  const scored = calculateScores(ageOk, ctx);
  return diversifyFeed(sortFeed(scored));
}

// --- Découvrir : mémoire locale des contenus déjà montrés --------------------
// Persistée dans localStorage (survit à un rafraîchissement), scindée par
// utilisateur. Volontairement pas de table Supabase dédiée pour l'instant :
// c'est une préférence d'affichage locale, pas une donnée sociale à partager
// entre appareils — simple à migrer vers une vraie table plus tard si besoin.
const DISCOVER_SEEN_LIMIT = 300;
function getDiscoverSeenIds(userId) {
  if (!userId) return [];
  try {
    return JSON.parse(window.localStorage.getItem(`piste_discover_seen_${userId}`) || "[]");
  } catch (e) {
    return [];
  }
}
function markDiscoverSeen(userId, ids) {
  if (!userId || ids.length === 0) return;
  const current = getDiscoverSeenIds(userId);
  const merged = Array.from(new Set([...current, ...ids])).slice(-DISCOVER_SEEN_LIMIT);
  try {
    window.localStorage.setItem(`piste_discover_seen_${userId}`, JSON.stringify(merged));
  } catch (e) { /* quota localStorage dépassé : tant pis, pas bloquant */ }
}
/**
 * Pipeline "Découvrir" : réutilise buildFeed (mêmes étapes sécurité/âge/score/
 * diversité) en ajoutant deux dimensions propres à cet onglet :
 *  - affinité de groupe (myGroupIds) et pénalité "déjà vu" (seenIds), via
 *    calculateScores ;
 *  - priorité stricte au contenu jamais vu : on ne complète avec du déjà-vu
 *    que s'il n'y a pas assez de contenu frais, pour ne jamais vider le fil.
 * Aucun doublon possible : unseen et seen sont des partitions disjointes du
 * même tableau dédupliqué par id.
 */
function buildDiscoverFeed(posts, ctx) {
  const seenIds = ctx.seenIds || [];
  const unseen = posts.filter((p) => !seenIds.includes(p.id));
  const seen = posts.filter((p) => seenIds.includes(p.id));
  const discoverCtx = { ...ctx, following: [] }; // pas de biais d'affinité : priorité récence/qualité/diversité/groupe
  return [...buildFeed(unseen, discoverCtx), ...buildFeed(seen, discoverCtx)];
}
// Extraction de #hashtags et @mentions depuis le texte réellement saisi par l'auteur
// (jamais inventés) — prépare la recherche par hashtag et les mentions futures.
function extractHashtags(text) {
  return Array.from(new Set((text.match(/#[\p{L}0-9_]+/gu) || []).map((h) => h.toLowerCase())));
}
function extractMentions(text) {
  return Array.from(new Set((text.match(/@[\p{L}0-9_.]+/gu) || []).map((m) => m.toLowerCase())));
}
// Convertit une ligne brute Supabase (posts, jointe à profiles) vers la forme
// attendue par PostCard/VideoCard — l'UI ne connaît que ce format, jamais les
// noms de colonnes SQL.
function formatRelativeDate(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
function mapPostRow(row) {
  return {
    id: row.id,
    nom: row.profiles?.nom || row.profiles?.username || "Utilisateur",
    username: row.profiles?.username || null,
    avatar: row.profiles?.avatar_url || null,
    texte: row.texte,
    image: row.post_media?.[0]?.type === "video" ? null : row.post_media?.[0]?.url || null,
    videoUrl: row.post_media?.[0]?.type === "video" ? row.post_media[0].url : null,
    type: row.type,
    animal: row.animal,
    pratique: row.pratique,
    contentRating: row.content_rating,
    hashtags: row.hashtags || [],
    mentions: row.mentions || [],
    likes: row.likes_count || 0,
    commentaires: row.comments_count || 0,
    reposts: row.reposts_count || 0,
    repostedAt: row.repostedAt || null,
    groupId: row.group_id || null,
    date: formatRelativeDate(row.created_at),
    createdAt: new Date(row.created_at).getTime(),
    titre: row.texte, // pour VideoCard, qui affiche "titre"
  };
}
const ANIMALS = ["Chevreuil", "Sanglier", "Cerf", "Lièvre", "Faisan", "Canard", "Autre", "Aucun"];
const PRACTICE_TYPES = ["Approche", "Affût", "Battue", "Chasse au chien", "Gibier d'eau", "Petit gibier", "Grand gibier", "Observation", "Préparation", "Matériel", "Autre"];
const GROUP_CATEGORIES = ["Grand gibier", "Petit gibier", "Gibier d'eau", "Chiens de chasse", "Approche", "Affût", "Battue", "Matériel", "Photographie", "Nature"];

// --- Modération -------------------------------------------------------------
// Motifs de signalement proposés à l'utilisateur — taxonomie alignée sur la
// contrainte CHECK de la colonne "reason" (table reports, 001_init.sql).
// Signalements réellement persistés via socialService.reportContent().
const REPORT_REASONS = [
  "Violence", "Braconnage", "Contenu illégal", "Harcèlement", "Haine / discrimination",
  "Spam", "Arnaque", "Contenu sexuel", "Mineur en danger", "Usurpation d'identité", "Autre",
];

// --- Règlement PISTE ----------------------------------------------------------
// Base de travail pour la modération — distingue explicitement une pratique de chasse
// légale (autorisée) d'une pratique illégale ou de sa promotion (interdite).
// À valider juridiquement avant tout lancement public.
const RULES_SECTIONS = [
  {
    title: "Contenus strictement interdits",
    items: [
      "Braconnage ou toute incitation au braconnage",
      "Pratiques manifestement illégales (hors périodes, espèces protégées, sans permis...)",
      "Violence gratuite, menaces ou harcèlement",
      "Discrimination ou discours de haine",
      "Contenu sexuel interdit ou exploitation de mineurs",
      "Contenu criminel ou glorification de violences illégales",
      "Fraude, arnaque ou usurpation d'identité",
      "Spam ou publicité non sollicitée",
      "Publication de données personnelles d'autrui sans autorisation",
      "Incitation à des pratiques dangereuses",
    ],
  },
  {
    title: "Chasse légale vs. pratique illégale",
    items: [
      "La présence d'un animal chassé ou d'une scène de chasse n'est jamais, en soi, un motif de suppression.",
      "PISTE distingue le partage d'une activité de chasse légale (respect des périodes, espèces, permis, territoires) de la promotion d'une pratique illégale.",
      "La modération tient compte du contexte donné par l'auteur (type de chasse, période, territoire) avant toute décision.",
    ],
  },
  {
    title: "Ce que la modération peut faire",
    items: [
      "Examiner un contenu signalé",
      "Le masquer temporairement le temps de l'examen",
      "Le supprimer s'il enfreint le règlement",
      "Avertir ou suspendre un compte en cas de récidive",
    ],
  },
];
const FAQ_ITEMS = [
  { q: "Comment créer mon compte ?", a: "Depuis l'écran d'accueil, choisissez « Commencer » puis suivez les étapes : pseudo, e-mail, mot de passe, date de naissance, région et centres d'intérêt." },
  { q: "Comment modifier mon profil ?", a: "Rendez-vous sur l'onglet Profil puis appuyez sur « Modifier le profil » pour changer votre photo, votre bio ou votre localisation." },
  { q: "Comment publier du contenu ?", a: "Utilisez le bouton « Créer » dans la barre de navigation : vous pouvez publier un texte, une photo, une vidéo, un Instant, une discussion, un sondage ou une sortie." },
  { q: "Qu'est-ce qu'un Instant ?", a: "Un Instant est un format vidéo court et vertical, pensé pour partager un moment rapidement." },
  { q: "Comment fonctionnent les likes et commentaires ?", a: "Appuyez sur le cœur pour aimer une publication, ou sur l'icône de commentaire pour ouvrir la discussion et répondre." },
  { q: "Comment suivre quelqu'un ?", a: "Cette fonctionnalité sera activée avec de vrais comptes utilisateurs — la structure est déjà prête côté interface." },
  { q: "Comment rejoindre un groupe ?", a: "Ouvrez l'onglet Groupes, choisissez une catégorie et appuyez sur « Rejoindre »." },
  { q: "Comment gérer mes notifications ?", a: "Dans Paramètres > Notifications, vous pouvez activer ou désactiver chaque type d'alerte." },
  { q: "Comment supprimer mon compte ?", a: "Rendez-vous dans Paramètres > Données > Supprimer mon compte. Cette action nécessitera une confirmation une fois le backend connecté." },
  { q: "Comment signaler un contenu ?", a: "Appuyez sur les trois points d'une publication puis choisissez « Signaler » et sélectionnez un motif." },
  { q: "Comment bloquer quelqu'un ?", a: "Depuis les trois points d'une publication, choisissez « Bloquer l'auteur ». Vous pouvez gérer vos comptes bloqués dans Paramètres > Contenu." },
  { q: "Mes données sont-elles publiques ?", a: "Vous contrôlez la visibilité de votre compte et de vos informations dans Paramètres > Confidentialité." },
];

// Les groupes (les 24 prédéfinis + ceux créés par les utilisateurs) sont
// chargés depuis Supabase via groupService.fetchGroups() — voir MainApp.
// Les 24 groupes prédéfinis sont déjà en base (insérés par 001_init.sql).

// Système de badges profil — élégant, différent d'un emoji, prêt pour une attribution
// automatique future à partir d'attributs vérifiés côté backend (statut chasseur vérifié,
// statut professionnel, statut créateur...). Pour l'instant `profile.badges` reste vide
// par défaut : aucun badge n'est attribué artificiellement.
//
// Le badge "verifie" est un cas particulier : il ne peut JAMAIS être ajouté par
// l'utilisateur lui-même (aucune action de l'interface ne modifie `verificationStatus`).
// Il ne doit être dérivé que d'un `profile.verificationStatus` défini côté backend :
//   verificationStatus = {
//     verified: boolean,
//     type: 'identite' | 'chasseur' | 'professionnel' | 'createur' | null,
//     source: 'piste' | 'partenaire' | null,   // qui a réalisé la vérification
//     verifiedAt: string | null,               // date ISO de vérification
//     active: boolean,                         // permet une révocation sans supprimer l'historique
//   }
// Exemple d'utilisation une fois de vrais badges attribués : <BadgeRow badges={["chasseur", "createur", "verifie"]} />
const BADGE_DEFINITIONS = {
  chasseur: { label: "Chasseur" },
  pro: { label: "Pro" },
  createur: { label: "Créateur" },
  verifie: { label: "Vérifié" },
};
function Badge({ type }) {
  const { colors } = useTheme();
  const def = BADGE_DEFINITIONS[type];
  if (!def) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "3px 9px 3px 7px" }}>
      {type === "verifie" ? <Check size={9} strokeWidth={3.5} color={colors.accent} /> : <span style={{ width: 5, height: 5, borderRadius: 3, background: colors.accent }} />}
      {def.label}
    </span>
  );
}
function BadgeRow({ badges }) {
  if (!badges || badges.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>{badges.map((b) => <Badge key={b} type={b} />)}</div>;
}

/* ============================================================
   4. ONBOARDING
   ============================================================ */
function OnboardingHeader({ onBack, step, total }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-2">
      <IconButton icon={ArrowLeft} onClick={onBack} />
      <ProgressDots step={step} total={total} />
    </div>
  );
}
function StepSplash({ onStart, onLogin }) {
  const { colors } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 32px", textAlign: "center", gap: 22 }}>
      <Logo size={64} />
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 4, color: colors.text }}>PISTE</div>
        <div style={{ fontSize: 13.5, color: colors.textSecondary, marginTop: 8, lineHeight: 1.5 }}>Le réseau social des passionnés de chasse.</div>
      </div>
      <div style={{ width: "100%", marginTop: 12 }}>
        <Button onClick={onStart}>Commencer</Button>
        <div style={{ marginTop: 14 }}>
          <span style={{ fontSize: 12.5, color: colors.textFaint }}>Déjà un compte ? </span>
          <button onClick={onLogin} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Se connecter</button>
        </div>
      </div>
    </div>
  );
}
function StepSignup({ data, setData, onNext, onBack, onLogin }) {
  const { colors } = useTheme();
  const [touched, setTouched] = useState(false);
  const pseudoErr = touched && data.pseudo.trim().length < 3 ? "3 caractères minimum" : null;
  const emailErr = touched && !/^\S+@\S+\.\S+$/.test(data.email) ? "Adresse e-mail invalide" : null;
  const pwErr = touched && data.password.length < 8 ? "8 caractères minimum" : null;
  const valid = data.pseudo.trim().length >= 3 && /^\S+@\S+\.\S+$/.test(data.email) && data.password.length >= 8;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardingHeader onBack={onBack} step={0} total={6} />
      <div style={{ padding: "16px 20px", flex: 1 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: colors.text, marginBottom: 4 }}>Créer votre compte</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 22 }}>Rejoignez la communauté PISTE.</div>
        <TextField label="Pseudo" value={data.pseudo} onChange={(v) => setData({ ...data, pseudo: v })} placeholder="ex : chasseur_vosges" error={pseudoErr} />
        <TextField label="E-mail" value={data.email} onChange={(v) => setData({ ...data, email: v })} placeholder="vous@exemple.com" type="email" error={emailErr} />
        <TextField label="Mot de passe" value={data.password} onChange={(v) => setData({ ...data, password: v })} placeholder="8 caractères minimum" type="password" error={pwErr} />
        <Button disabled={touched ? !valid : false} onClick={() => { setTouched(true); if (valid) onNext(); }}>Continuer</Button>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <span style={{ fontSize: 12.5, color: colors.textFaint }}>Déjà un compte ? </span>
          <button onClick={onLogin} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Se connecter</button>
        </div>
      </div>
    </div>
  );
}
function StepBirthdate({ data, setData, onNext, onBack }) {
  const { colors } = useTheme();
  const valid = data.day && data.month && data.year;
  const age = valid ? computeAge(data.day, data.month, data.year) : null;
  const tooYoung = age !== null && age < MIN_AGE;
  const selStyle = { flex: 1, border: `1.5px solid ${colors.border}`, background: colors.surface, borderRadius: RADIUS.sm, padding: "12px 10px", fontSize: 14, color: colors.text, outline: "none" };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardingHeader onBack={onBack} step={1} total={6} />
      <div style={{ padding: "16px 20px", flex: 1 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: colors.text, marginBottom: 4 }}>Quand êtes-vous né ?</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 22 }}>Cette information reste privée.</div>
        <div className="flex gap-2">
          <select style={selStyle} value={data.day} onChange={(e) => setData({ ...data, day: e.target.value })}><option value="">Jour</option>{Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}</select>
          <select style={selStyle} value={data.month} onChange={(e) => setData({ ...data, month: e.target.value })}><option value="">Mois</option>{["Janv.","Févr.","Mars","Avr.","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
          <select style={selStyle} value={data.year} onChange={(e) => setData({ ...data, year: e.target.value })}><option value="">Année</option>{Array.from({ length: 90 }, (_, i) => 2026 - i).map((y) => <option key={y} value={y}>{y}</option>)}</select>
        </div>
        {tooYoung && (
          <div style={{ marginTop: 16, background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error, lineHeight: 1.5 }}>
            PISTE est réservé aux personnes de {MIN_AGE} ans et plus. La création de compte n'est pas possible avec cette date de naissance.
          </div>
        )}
        <div style={{ marginTop: 24 }}><Button disabled={!valid || tooYoung} onClick={onNext}>Continuer</Button></div>
      </div>
    </div>
  );
}
function StepRegion({ data, setData, onNext, onBack }) {
  const { colors } = useTheme();
  const departements = data.region ? REGIONS_DEPARTEMENTS[data.region] : [];
  const valid = data.region && data.departement;
  const selectRegion = (r) => setData({ ...data, region: r, departement: "" }); // reset dépt si la région change
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardingHeader onBack={onBack} step={2} total={6} />
      <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: colors.text, marginBottom: 4 }}>Où êtes-vous ?</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 18 }}>Votre position précise ne sera jamais affichée publiquement.</div>
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 18 }}>
          {REGIONS.map((r) => <Chip key={r} label={r} active={data.region === r} onClick={() => selectRegion(r)} />)}
        </div>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.textSecondary, marginBottom: 6, display: "block" }}>Département</label>
        <select
          value={data.departement}
          onChange={(e) => setData({ ...data, departement: e.target.value })}
          disabled={!data.region}
          style={{ width: "100%", border: `1.5px solid ${colors.border}`, background: data.region ? colors.surface : colors.surfaceAlt, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 14, color: colors.text, outline: "none", marginBottom: 20 }}
        >
          <option value="">{data.region ? "Sélectionnez votre département" : "Choisissez d'abord une région"}</option>
          {departements.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <Button disabled={!valid} onClick={onNext}>Continuer</Button>
      </div>
    </div>
  );
}
function StepInterests({ data, setData, onNext, onBack }) {
  const { colors } = useTheme();
  const toggle = (i) => setData({ ...data, interests: data.interests.includes(i) ? data.interests.filter((x) => x !== i) : [...data.interests, i] });
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardingHeader onBack={onBack} step={3} total={6} />
      <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: colors.text, marginBottom: 4 }}>Qu'est-ce qui vous intéresse ?</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 18 }}>Sélectionnez tout ce qui vous parle.</div>
        <div className="flex flex-wrap gap-2">{INTERESTS.map((i) => <Chip key={i} label={i} active={data.interests.includes(i)} onClick={() => toggle(i)} />)}</div>
        <div style={{ marginTop: 24 }}><Button disabled={data.interests.length === 0} onClick={onNext}>Continuer</Button></div>
      </div>
    </div>
  );
}
function StepWhoYouAre({ data, setData, onNext, onBack }) {
  const { colors } = useTheme();
  const toggle = (p) => setData({ ...data, profiles: data.profiles.includes(p) ? data.profiles.filter((x) => x !== p) : [...data.profiles, p] });
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardingHeader onBack={onBack} step={4} total={6} />
      <div style={{ padding: "16px 20px", flex: 1 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: colors.text, marginBottom: 4 }}>Vous êtes...</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 18 }}>Plusieurs choix possibles.</div>
        <div className="flex flex-col gap-2">
          {PROFILE_TYPES.map((p) => {
            const active = data.profiles.includes(p);
            return (
              <button key={p} onClick={() => toggle(p)} className="flex items-center justify-between transition-colors active:scale-[0.99]" style={{ border: `1.5px solid ${active ? colors.accent : colors.border}`, background: active ? colors.accentSoft : colors.surface, borderRadius: RADIUS.md, padding: "14px 16px", cursor: "pointer" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: active ? colors.accent : colors.text }}>Je suis {p.toLowerCase()}</span>
                {active && <Check size={17} color={colors.accent} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 24 }}><Button disabled={data.profiles.length === 0} onClick={onNext}>Continuer</Button></div>
      </div>
    </div>
  );
}
function StepAccess({ data, onFinish, onBack }) {
  const { colors } = useTheme();
  const age = computeAge(data.day, data.month, data.year);
  const estMineur = age !== null && age <= MODERATION_AGE_RULES.minor.maxAge;
  const [status, setStatus] = useState("idle"); // idle | loading | error | sent
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const result = await authService.signUp({
        email: data.email,
        password: data.password,
        username: data.pseudo,
        day: data.day,
        month: data.month,
        year: data.year,
        region: data.region,
        departement: data.departement,
      });
      if (result.emailConfirmationRequired) {
        setStatus("sent"); // écran "vérifiez votre e-mail" ci-dessous
      } else {
        onFinish({ age, estMineur }); // confirmation email désactivée côté Supabase : accès direct
      }
    } catch (e) {
      setStatus("error");
      const raw = e.message || "";
      let friendly = raw;
      if (raw.includes("duplicate key") && raw.includes("username")) friendly = "Ce pseudo est déjà utilisé. Retournez à l'étape précédente pour en choisir un autre.";
      else if (raw.includes("duplicate key") && raw.includes("email")) friendly = "Un compte existe déjà avec cet e-mail.";
      else if (raw.toLowerCase().includes("password")) friendly = "Le mot de passe ne respecte pas les critères de sécurité requis.";
      setErrorMsg(friendly || "Une erreur est survenue lors de la création du compte.");
    }
  };

  if (status === "sent") {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <OnboardingHeader onBack={onBack} step={5} total={6} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "0 28px", gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: RADIUS.lg, background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={26} color={colors.accent} strokeWidth={2.5} /></div>
          <div style={{ fontSize: 19, fontWeight: 800, color: colors.text }}>Vérifiez votre e-mail</div>
          <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>
            Un lien de confirmation a été envoyé à <strong>{data.email}</strong>. Cliquez dessus pour activer votre compte, puis revenez vous connecter.
          </div>
          <div style={{ width: "100%", marginTop: 8 }}>
            <Button variant="secondary" onClick={async () => { try { await authService.resendVerificationEmail(data.email); } catch (e) {} }}>Renvoyer l'e-mail</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardingHeader onBack={onBack} step={5} total={6} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "0 28px", gap: 16 }}>
        <div style={{ width: 60, height: 60, borderRadius: RADIUS.lg, background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={26} color={colors.accent} strokeWidth={2.5} /></div>
        <div style={{ fontSize: 19, fontWeight: 800, color: colors.text }}>Bienvenue, {data.pseudo || "chasseur"}.</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>Votre profil est prêt. Nous allons créer votre compte réel.</div>
        {estMineur && (
          <div style={{ background: colors.accentSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12, color: colors.accent, lineHeight: 1.5, textAlign: "left" }}>
            Votre compte sera identifié comme celui d'un utilisateur mineur. Certaines fonctionnalités (messagerie ouverte, visibilité publique par défaut) sont limitées en conséquence.
          </div>
        )}
        {status === "error" && (
          <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error, lineHeight: 1.5, textAlign: "left" }}>{errorMsg}</div>
        )}
        <div style={{ width: "100%", marginTop: 8 }}>
          <Button onClick={submit} disabled={status === "loading"}>{status === "loading" ? "Création du compte..." : "Créer mon compte"}</Button>
        </div>
      </div>
    </div>
  );
}
function LoginScreen({ onBack, onSignup }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");
  const attemptLogin = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      await authService.login({ email, password });
      // Pas de setStage ici : Root() écoute onAuthStateChange et bascule
      // automatiquement vers l'app dès que la session Supabase est confirmée.
    } catch (e) {
      setStatus("error");
      const raw = e.message || "";
      setErrorMsg(
        raw.toLowerCase().includes("invalid login credentials")
          ? "E-mail ou mot de passe incorrect."
          : raw.toLowerCase().includes("email not confirmed")
          ? "Votre e-mail n'a pas encore été vérifié. Consultez votre boîte de réception."
          : raw || "Connexion impossible pour le moment."
      );
    }
  };
  const sendReset = async () => {
    try {
      await authService.requestPasswordReset(email);
      setForgotSent(true);
    } catch (e) {
      setErrorMsg(e.message || "Impossible d'envoyer l'e-mail de réinitialisation.");
    }
  };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="flex items-center px-5 pt-5 pb-2"><IconButton icon={ArrowLeft} onClick={onBack} /></div>
      <div style={{ padding: "16px 20px", flex: 1 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: colors.text, marginBottom: 4 }}>Connexion</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 22 }}>Accédez à votre compte PISTE.</div>
        <TextField label="E-mail" value={email} onChange={setEmail} placeholder="vous@exemple.com" type="email" />
        <TextField label="Mot de passe" value={password} onChange={setPassword} placeholder="Mot de passe" type="password" />
        <div style={{ marginBottom: 18, marginTop: -6 }}>
          <button onClick={() => setForgot(true)} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Mot de passe oublié ?</button>
        </div>
        {forgot && !forgotSent && (
          <div style={{ background: colors.accentSoft, borderRadius: RADIUS.sm, padding: "12px 14px", marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, color: colors.accent, marginBottom: 8 }}>Un e-mail de réinitialisation sera envoyé à {email || "l'adresse ci-dessus"}.</div>
            <Button full={false} onClick={sendReset} disabled={!email}>Envoyer le lien</Button>
          </div>
        )}
        {forgotSent && <div style={{ background: colors.accentSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.accent, marginBottom: 18 }}>E-mail envoyé — vérifiez votre boîte de réception.</div>}
        <Button disabled={!email || !password || status === "loading"} onClick={attemptLogin}>{status === "loading" ? "Connexion..." : "Se connecter"}</Button>
        {status === "error" && (
          <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error, marginTop: 12, lineHeight: 1.5 }}>{errorMsg}</div>
        )}
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <span style={{ fontSize: 12.5, color: colors.textFaint }}>Pas encore de compte ? </span>
          <button onClick={onSignup} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Créer un compte</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   5. APP SHELL — header + nav TOUJOURS fixes
   ============================================================ */
function Header({ onBell, onMenu, unreadCount = 0 }) {
  const { colors } = useTheme();
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: colors.headerBg, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: `1px solid ${colors.border}` }} className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2"><Logo size={28} /><Wordmark /></div>
      <div className="flex items-center gap-1">
        <div style={{ position: "relative" }}>
          <IconButton icon={Bell} onClick={onBell} />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: 2, right: 2, minWidth: 15, height: 15, borderRadius: 8, background: colors.accent, color: colors.onAccent, fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <IconButton icon={Menu} onClick={onMenu} />
      </div>
    </div>
  );
}
const NAV_HEIGHT = 66;
function BottomNav({ active, setActive, onCreate, unreadConversations = 0 }) {
  const { colors } = useTheme();
  const items = [
    { key: "fil", label: "Fil", icon: Home },
    { key: "video", label: "Vidéo", icon: Film },
    { key: "groupes", label: "Groupes", icon: Users },
    { key: "messages", label: "Messages", icon: MessageCircle },
    { key: "create", label: "Créer", icon: Plus, isCreate: true },
    { key: "profil", label: "Profil", icon: User },
  ];
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ width: "100%", maxWidth: 480, pointerEvents: "auto", background: colors.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: `1px solid ${colors.border}`, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center" style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
          {items.map((it) => {
            const Icon = it.icon;
            const isActive = active === it.key;
            if (it.isCreate) {
              return (
                <button key={it.key} onClick={onCreate} aria-label="Créer" className="flex flex-col items-center gap-1 active:scale-95 transition-transform" style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "2px 0", minWidth: 0 }}>
                  <div style={{ width: 26, height: 19, borderRadius: 8, background: colors.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={15} color={colors.onAccent} strokeWidth={2.6} />
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 500, color: colors.textFaint, whiteSpace: "nowrap" }}>Créer</span>
                </button>
              );
            }
            return (
              <button key={it.key} onClick={() => setActive(it.key)} className="flex flex-col items-center gap-1" style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "2px 0", minWidth: 0 }}>
                <div style={{ position: "relative" }}>
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? colors.accent : colors.textFaint} />
                  {it.key === "messages" && unreadConversations > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -8, minWidth: 14, height: 14, borderRadius: 7, background: colors.accent, color: colors.onAccent, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                      {unreadConversations > 9 ? "9+" : unreadConversations}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500, color: isActive ? colors.accent : colors.textFaint, whiteSpace: "nowrap" }}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function AppShell({ children, header, active, setActive, onCreate, unreadConversations }) {
  const { colors } = useTheme();
  return (
    <div style={{ minHeight: "100vh", background: colors.background }}>
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", position: "relative", background: colors.background }}>
        {header}
        <div key={active} style={{ paddingBottom: NAV_HEIGHT + 12, animation: "piste-fade-in 220ms ease" }}>{children}</div>
        <BottomNav active={active} setActive={setActive} onCreate={onCreate} unreadConversations={unreadConversations} />
      </div>
      <style>{`
        @keyframes piste-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes piste-toast-in { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
      `}</style>
    </div>
  );
}
function Toast({ message }) {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <div style={{ position: "fixed", top: 14, left: "50%", zIndex: 90, background: colors.text, color: colors.background, fontSize: 12.5, fontWeight: 600, padding: "10px 18px", borderRadius: RADIUS.pill, boxShadow: "0 8px 20px rgba(0,0,0,0.18)", animation: "piste-toast-in 200ms ease", maxWidth: "80%", textAlign: "center" }}>
      {message}
    </div>
  );
}

/* ============================================================
   6. FIL — PostCard
   ============================================================ */
function ContentActionSheet({ isOwn, onClose, onDelete, onEdit, onReport, onHide, onBlock }) {
  const { colors } = useTheme();
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 62 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: colors.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: "10px 20px 26px" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "6px auto 16px" }} />
        {isOwn ? (
          <>
            <button onClick={onEdit} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>Modifier</span>
            </button>
            <button onClick={onDelete} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.error }}>Supprimer</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={onReport} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}><span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>Signaler</span></button>
            <button onClick={onHide} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}><span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>Masquer</span></button>
            <button onClick={onBlock} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}><span style={{ fontSize: 13.5, fontWeight: 600, color: colors.error }}>Bloquer l'auteur</span></button>
          </>
        )}
      </div>
    </div>
  );
}
/**
 * Vrai écran de profil public — remplace l'ancienne coquille qui n'affichait
 * qu'un nom. Ouvert depuis n'importe où (post, vidéo, notification, message)
 * via un simple username, rendu une seule fois au niveau de MainApp pour
 * pouvoir réutiliser directement ses handlers (like/save/repost/commentaire).
 */
function AuthorProfileSheet({ username, meUsername, isFollowing, bellOn, onClose, onToggleFollow, onToggleBell, onMessage, liked, saved, reposted, commentsByPost, onLike, onSave, onRepost, onAddComment, onDelete, onEditRequest, onReport, onHide, onBlock, onLoadComments }) {
  const { colors } = useTheme();
  const isSelf = username === meUsername;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    profileService.fetchPublicProfile(username)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        return postService.fetchUserPosts(p.id).then((rows) => { if (!cancelled) setPosts(rows.map(mapPostRow)); });
      })
      .catch((e) => { if (!cancelled) setError(e.message || "Profil introuvable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 64, background: colors.background, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title={profile?.username ? `@${profile.username}` : "Profil"} onBack={onClose} />
      {loading ? (
        <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginTop: 40 }}>Chargement...</div>
      ) : error ? (
        <div style={{ textAlign: "center", fontSize: 12.5, color: colors.error, marginTop: 40, padding: "0 24px" }}>{error}</div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ width: "100%", height: 96, background: profile.imageCouverture ? `url(${profile.imageCouverture}) center/cover` : colors.surfaceAlt }} />
          <div className="px-4">
            <div style={{ marginTop: -34 }}>
              <div style={{ width: 72, height: 72, borderRadius: RADIUS.md, background: colors.surface, border: `3px solid ${colors.background}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={30} color={colors.textFaint} strokeWidth={1.6} />}
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{profile.nom}</div>
              <div style={{ fontSize: 13, color: colors.textFaint }}>@{profile.username}</div>
              <BadgeRow badges={profile.badges} />
              {profile.localisation && <div className="flex items-center gap-1" style={{ marginTop: 4 }}><MapPin size={13} color={colors.textFaint} /><span style={{ fontSize: 12.5, color: colors.textFaint }}>{profile.localisation}</span></div>}
              {profile.bio && <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 8, lineHeight: 1.5 }}>{profile.bio}</div>}
            </div>
            <div style={{ marginTop: 16, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.md, padding: "12px 4px" }} className="flex">
              {[["Abonnés", profile.stats.abonnes], ["Abonnements", profile.stats.abonnements], ["Publications", profile.stats.publications]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>{val}</div>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>{label}</div>
                </div>
              ))}
            </div>
            {isSelf ? (
              <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: colors.textFaint }}>C'est vous.</div>
            ) : (
              <div className="flex items-center gap-2" style={{ marginTop: 14 }}>
                <Button full={false} variant={isFollowing ? "secondary" : "primary"} onClick={onToggleFollow}>{isFollowing ? "Abonné" : "Suivre"}</Button>
                <Button full={false} variant="secondary" onClick={() => onMessage(profile.id, profile.nom)}>Message</Button>
                {onToggleBell && (
                  <button
                    onClick={onToggleBell}
                    aria-label={bellOn ? "Désactiver les notifications" : "Activer les notifications"}
                    style={{ width: 38, height: 38, borderRadius: RADIUS.pill, border: `1.5px solid ${bellOn ? colors.accent : colors.border}`, background: bellOn ? colors.accentSoft : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                  >
                    <Bell size={16} color={bellOn ? colors.accent : colors.textFaint} fill={bellOn ? colors.accent : "none"} />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="px-2 mt-5" style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, paddingLeft: 8 }}>PUBLICATIONS</span>
          </div>
          {posts.length === 0 ? (
            <EmptyState title="Aucune publication" subtitle="Les publications de ce compte apparaîtront ici." />
          ) : (
            <div style={{ paddingTop: 10 }}>
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  liked={liked.includes(p.id)}
                  saved={saved.includes(p.id)}
                  reposted={reposted.includes(p.id)}
                  onRepost={() => onRepost(p.id)}
                  commentCount={(commentsByPost[p.id] || []).length}
                  onLike={() => onLike(p.id)}
                  onSave={() => onSave(p.id)}
                  onOpenComments={() => { setSheet({ type: "comments", post: p }); onLoadComments(p.id); }}
                  onOpenActions={() => setSheet({ type: "actions", post: p })}
                  onOpenAuthor={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={isSelf}
          onClose={() => setSheet(null)}
          onEdit={() => { setSheet(null); onEditRequest(sheet.post); }}
          onDelete={() => { onDelete(sheet.post.id); setPosts((p) => p.filter((x) => x.id !== sheet.post.id)); setSheet(null); }}
          onReport={() => setSheet({ type: "report", post: sheet.post })}
          onHide={() => { onHide(sheet.post.id); setSheet(null); }}
          onBlock={() => { onBlock(sheet.post.username); setSheet(null); onClose(); }}
        />
      )}
      {sheet?.type === "report" && (
        <ReportSheet onClose={() => setSheet(null)} onSubmit={(reason) => onReport({ targetId: sheet.post.id, targetType: "post", reason })} />
      )}
      {sheet?.type === "comments" && (
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} />
      )}
    </div>
  );
}
function ReportSheet({ onClose, onSubmit }) {
  const { colors } = useTheme();
  const [reason, setReason] = useState(null);
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 63, background: colors.background, display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Signalement" onCloseX={onClose} />
        <EmptyState title="Signalement envoyé" subtitle="Merci, notre équipe examinera ce contenu. Retrouvez l'historique de vos signalements dans Paramètres > Sécurité." />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 63, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Signaler" onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14 }}>Pourquoi signalez-vous ce contenu ?</div>
        <div className="flex flex-col gap-2">
          {REPORT_REASONS.map((r) => (
            <button key={r} onClick={() => setReason(r)} className="flex items-center justify-between" style={{ border: `1.5px solid ${reason === r ? colors.accent : colors.border}`, background: reason === r ? colors.accentSoft : colors.surface, borderRadius: RADIUS.sm, padding: "12px 14px", cursor: "pointer" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: reason === r ? colors.accent : colors.text }}>{r}</span>
              {reason === r && <Check size={15} color={colors.accent} />}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}>
        <Button disabled={!reason} onClick={() => { onSubmit(reason); setSent(true); }}>Envoyer le signalement</Button>
      </div>
    </div>
  );
}
function CommentsSheet({ comments, onClose, onAdd }) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null); // { id, auteur } | null
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesOf = (id) => comments.filter((c) => c.parentId === id);
  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), replyTo?.id || null);
    setText("");
    setReplyTo(null);
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 61, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Commentaires" onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {comments.length === 0 ? (
          <EmptyState title="Aucun commentaire" subtitle="Soyez le premier à réagir à cette publication." />
        ) : (
          <div style={{ padding: "8px 16px" }}>
            {topLevel.map((c) => (
              <div key={c.id} style={{ padding: "10px 0", borderBottom: `1px solid ${colors.border}` }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.text }}>{c.auteur}</span>
                  <span style={{ fontSize: 11, color: colors.textFaint }}>{c.date}</span>
                </div>
                <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.4 }}>{c.texte}</div>
                <button onClick={() => setReplyTo({ id: c.id, auteur: c.auteur })} style={{ background: "none", border: "none", color: colors.accent, fontSize: 11.5, fontWeight: 700, cursor: "pointer", marginTop: 4, padding: 0 }}>Répondre</button>
                {repliesOf(c.id).map((r) => (
                  <div key={r.id} style={{ marginTop: 8, marginLeft: 18, paddingLeft: 10, borderLeft: `2px solid ${colors.border}` }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{r.auteur}</span>
                      <span style={{ fontSize: 10.5, color: colors.textFaint }}>{r.date}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: colors.text, lineHeight: 1.4 }}>{r.texte}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      {replyTo && (
        <div className="flex items-center justify-between" style={{ padding: "6px 16px", background: colors.surfaceAlt }}>
          <span style={{ fontSize: 11.5, color: colors.textSecondary }}>Réponse à {replyTo.auteur}</span>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={13} color={colors.textFaint} /></button>
        </div>
      )}
      <div className="flex items-center gap-2" style={{ padding: 12, borderTop: `1px solid ${colors.border}` }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={replyTo ? `Répondre à ${replyTo.auteur}...` : "Ajouter un commentaire..."} style={{ flex: 1, border: `1.5px solid ${colors.border}`, borderRadius: RADIUS.pill, padding: "10px 14px", fontSize: 13, color: colors.text, outline: "none", background: colors.surface }} />
        <button onClick={submit} disabled={!text.trim()} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, background: text.trim() ? colors.accent : colors.border, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: text.trim() ? "pointer" : "default", flexShrink: 0 }}>
          <ChevronRight size={17} color="white" />
        </button>
      </div>
    </div>
  );
}
function SensitiveGate({ rating, children }) {
  const { colors } = useTheme();
  const [revealed, setRevealed] = useState(false);
  if (rating !== "sensitive" || revealed) return children;
  const info = CONTENT_RATINGS.sensitive;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(18px)", pointerEvents: "none" }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, background: "rgba(20,18,16,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center", gap: 10 }}>
        <AlertTriangle size={22} color="#fff" strokeWidth={1.8} />
        <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Contenu sensible</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, maxWidth: 240 }}>{info.warning}</div>
        <button onClick={() => setRevealed(true)} style={{ marginTop: 4, background: "#fff", color: colors.text, border: "none", borderRadius: RADIUS.pill, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Afficher le contenu</button>
      </div>
    </div>
  );
}
function PostCard({ post, liked, saved, reposted, commentCount, onLike, onSave, onRepost, onOpenComments, onOpenActions, onOpenAuthor }) {
  const { colors } = useTheme();
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: "PISTE", text: post.texte || "Une publication PISTE" }); } catch (e) {} }
    else alert("Le partage natif n'est pas disponible sur cet appareil. Le partage par lien sera activé une fois le backend connecté.");
  };
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.lg, margin: "0 16px 14px", overflow: "hidden" }}>
      {post.repostedAt && (
        <div className="flex items-center gap-1.5" style={{ padding: "10px 14px 0", fontSize: 11.5, color: colors.textFaint, fontWeight: 600 }}>
          <Repeat2 size={13} /> Reposté
        </div>
      )}
      <div className="flex items-center justify-between" style={{ padding: "12px 14px" }}>
        <button onClick={onOpenAuthor} className="flex items-center gap-2.5" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 11, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {post.avatar ? <img src={post.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={colors.textFaint} />}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{post.nom}</div>
            <div style={{ fontSize: 11, color: colors.textFaint }}>{post.date}</div>
          </div>
        </button>
        <IconButton icon={MoreHorizontal} onClick={onOpenActions} size={30} />
      </div>
      {post.texte && <div style={{ padding: "0 14px 12px", fontSize: 13.5, color: colors.text, lineHeight: 1.5 }}>{post.texte}</div>}
      {post.image && (
        <SensitiveGate rating={post.contentRating}>
          <div style={{ width: "100%", aspectRatio: "4/3", background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={post.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </SensitiveGate>
      )}
      <div className="flex items-center gap-4" style={{ padding: "10px 14px" }}>
        <button onClick={onLike} className="flex items-center gap-1.5 active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Heart size={17} color={liked ? colors.accent : colors.textSecondary} fill={liked ? colors.accent : "none"} strokeWidth={1.8} />
          <span style={{ fontSize: 12, color: liked ? colors.accent : colors.textSecondary, fontWeight: liked ? 700 : 400 }}>{post.likes || 0}</span>
        </button>
        <button onClick={onOpenComments} className="flex items-center gap-1.5" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <MessageSquare size={17} color={colors.textSecondary} strokeWidth={1.8} />
          <span style={{ fontSize: 12, color: colors.textSecondary }}>{commentCount}</span>
        </button>
        {onRepost && (
          <button onClick={onRepost} className="flex items-center gap-1.5 active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Repeat2 size={17} color={reposted ? colors.accent : colors.textSecondary} strokeWidth={1.8} />
            <span style={{ fontSize: 12, color: reposted ? colors.accent : colors.textSecondary, fontWeight: reposted ? 700 : 400 }}>{post.reposts || 0}</span>
          </button>
        )}
        <button onClick={share} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><Share2 size={17} color={colors.textSecondary} strokeWidth={1.8} /></button>
        <div style={{ flex: 1 }} />
        <button onClick={onSave} className="active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <Bookmark size={17} color={saved ? colors.accent : colors.textSecondary} fill={saved ? colors.accent : "none"} strokeWidth={1.8} />
        </button>
      </div>
      {(post.animal || post.pratique || (post.hashtags && post.hashtags.length > 0)) && (
        <div className="flex flex-wrap gap-1.5" style={{ padding: "0 14px 12px" }}>
          {post.animal && post.animal !== "Aucun" && <span style={{ fontSize: 10.5, fontWeight: 600, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "3px 9px" }}>{post.animal}</span>}
          {post.pratique && <span style={{ fontSize: 10.5, fontWeight: 600, color: colors.textSecondary, background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "3px 9px" }}>{post.pratique}</span>}
          {(post.hashtags || []).map((h) => <span key={h} style={{ fontSize: 10.5, fontWeight: 600, color: colors.accent }}>{h}</span>)}
        </div>
      )}
    </div>
  );
}
function ScreenFil({ posts, profile, liked, saved, reposted, commentsByPost, following, myGroupIds, bellUsernames, onToggleFollow, onToggleBell, onOpenProfile, onLike, onSave, onRepost, onAddComment, onDelete, onEdit, onReport, onHide, onBlock, onEditRequest, onLoadComments }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState("pourtoi");
  const [sheet, setSheet] = useState(null); // { type: 'actions'|'report'|'comments'|'author', post }
  const options = [{ key: "pourtoi", label: "Pour toi" }, { key: "abonnements", label: "Abonnements" }, { key: "decouvrir", label: "Découvrir" }];
  const copy = {
    pourtoi: "Votre fil personnalisé apparaîtra ici selon vos centres d'intérêt.",
    abonnements: "Vous ne suivez encore personne. Les publications des membres suivis apparaîtront ici.",
    decouvrir: "Le contenu populaire de la communauté PISTE apparaîtra ici.",
  };
  const meName = profile.nom || "Vous";
  // Pipeline centralisé (voir buildFeed) — même logique de sécurité/âge partout, seule la
  // pondération change selon l'onglet.
  const ctx = { blockedAuthors: [], hiddenPostIds: [], viewerIsMinor: profile.estMineur, following, interests: profile.interets || [], myGroupIds: myGroupIds || [], now: Date.now() };
  const seenIds = tab === "decouvrir" ? getDiscoverSeenIds(profile.id) : [];
  const visible =
    tab === "pourtoi" ? buildFeed(posts, ctx) :
    tab === "abonnements" ? buildFeed(posts.filter((p) => following.includes(p.username)), ctx) :
    buildDiscoverFeed(posts, { ...ctx, seenIds }); // Découvrir : pipeline dédié — voir buildDiscoverFeed()

  // Mémorise ce qui a été montré dans Découvrir pour ne pas le remontrer en
  // priorité la prochaine fois (persiste dans localStorage, survit au refresh).
  useEffect(() => {
    if (tab !== "decouvrir" || !profile.id || visible.length === 0) return;
    markDiscoverSeen(profile.id, visible.map((p) => p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, profile.id, visible.map((p) => p.id).join(",")]);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ padding: "14px 16px 6px" }}><SegmentedControl options={options} value={tab} onChange={setTab} /></div>
      {visible.length === 0 ? (
        <EmptyState title="Aucun contenu pour le moment" subtitle={copy[tab]} />
      ) : (
        <div style={{ paddingTop: 8 }}>
          {visible.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              liked={liked.includes(p.id)}
              saved={saved.includes(p.id)}
              reposted={reposted.includes(p.id)}
              onRepost={() => onRepost(p.id)}
              commentCount={(commentsByPost[p.id] || []).length}
              onLike={() => onLike(p.id)}
              onSave={() => onSave(p.id)}
              onOpenComments={() => { setSheet({ type: "comments", post: p }); onLoadComments(p.id); }}
              onOpenActions={() => setSheet({ type: "actions", post: p })}
              onOpenAuthor={() => onOpenProfile(p.username)}
            />
          ))}
        </div>
      )}
      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={sheet.post.nom === meName}
          onClose={() => setSheet(null)}
          onEdit={() => { setSheet(null); onEditRequest(sheet.post); }}
          onDelete={() => { onDelete(sheet.post.id); setSheet(null); }}
          onReport={() => setSheet({ type: "report", post: sheet.post })}
          onHide={() => { onHide(sheet.post.id); setSheet(null); }}
          onBlock={() => { onBlock(sheet.post.username); setSheet(null); }}
        />
      )}
      {sheet?.type === "report" && (
        <ReportSheet onClose={() => setSheet(null)} onSubmit={(reason) => onReport({ targetId: sheet.post.id, targetType: "post", reason })} />
      )}
      {sheet?.type === "comments" && (
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} />
      )}
    </div>
  );
}

/* ============================================================
   7. VIDÉO — VideoCard
   ============================================================ */
function FullScreenVideoPlayer({ video, onClose }) {
  if (!video) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, display: "flex", justifyContent: "flex-end", padding: 16 }}>
        <button onClick={onClose} aria-label="Fermer" style={{ background: "rgba(0,0,0,0.45)", border: "none", borderRadius: RADIUS.pill, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={18} color="#fff" />
        </button>
      </div>
      <video
        src={video.videoUrl}
        controls
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "contain", margin: "auto" }}
      />
    </div>
  );
}
function VideoCard({ video, liked, commentCount, onLike, onOpenComments, onOpenActions, onOpenAuthor, onOpenPlayer }) {
  const { colors } = useTheme();
  const canPlay = !!video.videoUrl;
  return (
    <div className="flex gap-3" style={{ padding: "10px 16px" }}>
      <button
        onClick={canPlay ? onOpenPlayer : undefined}
        disabled={!canPlay}
        style={{ width: 128, aspectRatio: "16/10", borderRadius: RADIUS.sm, background: colors.surfaceAlt, flexShrink: 0, position: "relative", overflow: "hidden", border: "none", padding: 0, cursor: canPlay ? "pointer" : "default" }}
      >
        {video.videoUrl ? (
          <video src={video.videoUrl} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
        ) : video.image ? (
          <img src={video.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : null}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Play size={18} color="white" fill="white" /></div>
        {video.duree && <span style={{ position: "absolute", right: 5, bottom: 5, fontSize: 10, color: "white", background: "rgba(0,0,0,0.55)", borderRadius: 5, padding: "1px 5px" }}>{video.duree}</span>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <button onClick={canPlay ? onOpenPlayer : undefined} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: canPlay ? "pointer" : "default" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, lineHeight: 1.3 }}>{video.titre}</div>
        </button>
        <button onClick={onOpenAuthor} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}><div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 4 }}>{video.nom}</div></button>
        <div className="flex items-center gap-3" style={{ marginTop: 6 }}>
          <button onClick={onLike} className="flex items-center gap-1 active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Heart size={14} color={liked ? colors.accent : colors.textFaint} fill={liked ? colors.accent : "none"} strokeWidth={1.8} />
            <span style={{ fontSize: 11, color: liked ? colors.accent : colors.textFaint }}>{video.likes || 0}</span>
          </button>
          <button onClick={onOpenComments} className="flex items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <MessageSquare size={14} color={colors.textFaint} strokeWidth={1.8} />
            <span style={{ fontSize: 11, color: colors.textFaint }}>{commentCount}</span>
          </button>
          <button onClick={onOpenActions} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto" }}><MoreHorizontal size={15} color={colors.textFaint} /></button>
        </div>
      </div>
    </div>
  );
}
function ScreenVideo({ videos, profile, liked, commentsByPost, following, bellUsernames, onToggleFollow, onToggleBell, onOpenProfile, onLike, onAddComment, onDelete, onEditRequest, onReport, onHide, onBlock, onLoadComments, onOpenPlayer }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState("instants");
  const [sheet, setSheet] = useState(null);
  const [query, setQuery] = useState("");
  const options = [{ key: "instants", label: "Instants" }, { key: "videos", label: "Vidéos" }, { key: "recherche", label: "Recherche" }];
  const meName = profile.nom || "Vous";
  // Même pipeline que le Fil (interaction pondérée davantage : vues/relecture à brancher
  // plus tard quand un vrai lecteur vidéo remontera ces signaux).
  const ctx = { blockedAuthors: [], hiddenPostIds: [], viewerIsMinor: profile.estMineur, following, interests: profile.interets || [], now: Date.now() };
  const ranked = buildFeed(videos.filter((v) => v.type === "video"), ctx);
  const rankedInstants = buildFeed(videos.filter((v) => v.type === "video_courte"), ctx);
  const activeList = tab === "instants" ? rankedInstants : ranked;
  // Recherche sur les vraies vidéos déjà chargées depuis Supabase (titre/texte,
  // pseudo ou nom d'affichage de l'auteur) — pas de résultats inventés.
  const q = query.trim().toLowerCase();
  const searchResults = q
    ? videos.filter((v) => (v.titre || "").toLowerCase().includes(q) || (v.nom || "").toLowerCase().includes(q) || (v.username || "").toLowerCase().includes(q))
    : [];
  return (
    <div style={{ position: "relative" }}>
      <div style={{ padding: "14px 16px 6px" }}><SegmentedControl options={options} value={tab} onChange={setTab} /></div>
      {tab === "recherche" ? (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2" style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "10px 14px" }}>
            <Search size={17} color={colors.textFaint} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une vidéo, un instant, un créateur" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: colors.text, flex: 1 }} />
          </div>
          {!q ? (
            <EmptyState title="Rechercher une vidéo" subtitle="Lancez une recherche pour trouver des vidéos publiées par la communauté." />
          ) : searchResults.length === 0 ? (
            <EmptyState title="Aucun résultat" subtitle={`Aucune vidéo ne correspond à « ${query} ».`} />
          ) : (
            <div style={{ paddingTop: 6 }}>
              {searchResults.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  liked={liked.includes(v.id)}
                  commentCount={(commentsByPost[v.id] || []).length}
                  onLike={() => onLike(v.id)}
                  onOpenComments={() => { setSheet({ type: "comments", post: v }); onLoadComments(v.id); }}
                  onOpenActions={() => setSheet({ type: "actions", post: v })}
                  onOpenAuthor={() => onOpenProfile(v.username)}
                  onOpenPlayer={() => onOpenPlayer(v)}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeList.length > 0 ? (
        <div style={{ paddingTop: 6 }}>
          {activeList.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              liked={liked.includes(v.id)}
              commentCount={(commentsByPost[v.id] || []).length}
              onLike={() => onLike(v.id)}
              onOpenComments={() => { setSheet({ type: "comments", post: v }); onLoadComments(v.id); }}
              onOpenActions={() => setSheet({ type: "actions", post: v })}
              onOpenAuthor={() => onOpenProfile(v.username)}
              onOpenPlayer={() => onOpenPlayer(v)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title={tab === "instants" ? "Aucun instant pour le moment" : "Aucune vidéo pour le moment"} subtitle={tab === "instants" ? "Instants — le format court et vertical de PISTE — publiés par la communauté apparaîtront ici." : "Les vidéos publiées par la communauté apparaîtront ici."} />
      )}
      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={sheet.post.nom === meName}
          onClose={() => setSheet(null)}
          onEdit={() => { setSheet(null); onEditRequest(sheet.post); }}
          onDelete={() => { onDelete(sheet.post.id); setSheet(null); }}
          onReport={() => setSheet({ type: "report", post: sheet.post })}
          onHide={() => { onHide(sheet.post.id); setSheet(null); }}
          onBlock={() => { onBlock(sheet.post.username); setSheet(null); }}
        />
      )}
      {sheet?.type === "report" && (
        <ReportSheet onClose={() => setSheet(null)} onSubmit={(reason) => onReport({ targetId: sheet.post.id, targetType: "video", reason })} />
      )}
      {sheet?.type === "comments" && (
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} />
      )}
    </div>
  );
}

/* ============================================================
   8. GROUPES — grandes cartes visuelles
   ============================================================ */
function GroupImageArea({ group, height = 92, iconSize = 20 }) {
  const { colors } = useTheme();
  if (group.imageUrl) {
    return (
      <div style={{ width: "100%", height, position: "relative", overflow: "hidden" }}>
        <img src={group.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))" }} />
      </div>
    );
  }
  // Placeholder propre en attendant une vraie photo — jamais d'emoji.
  return (
    <div style={{ width: "100%", height, background: `linear-gradient(135deg, ${colors.surfaceAlt}, ${colors.border})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ImageIcon size={iconSize} color={colors.textFaint} strokeWidth={1.5} />
    </div>
  );
}
function GroupCategoryTile({ group, onOpen }) {
  const { colors } = useTheme();
  return (
    <button onClick={() => onOpen(group)} className="active:scale-[0.97] transition-transform" style={{ textAlign: "left", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.lg, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", padding: 0 }}>
      <div style={{ position: "relative" }}>
        <GroupImageArea group={group} />
        {group.imageUrl && (
          <div style={{ position: "absolute", left: 10, right: 10, bottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", lineHeight: 1.2, textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>{group.nom}</div>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {!group.imageUrl && <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, lineHeight: 1.25 }}>{group.nom}</div>}
        <div style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{group.description}</div>
        <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
          <span style={{ fontSize: 10.5, color: colors.textFaint, fontWeight: 600 }}>{group.nombreMembres ?? 0} membre{(group.nombreMembres ?? 0) !== 1 ? "s" : ""}</span>
          {group.joined && <Check size={13} color={colors.accent} strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}
function GroupPage({ group, onClose, onToggleJoin, onCreatePost, onGroupUpdated, onOpenProfile, profile, liked, saved, reposted, commentsByPost, onLike, onSave, onRepost, onAddComment, onDelete, onEditRequest, onReport, onHide, onBlock, onLoadComments }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState("publications");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const tabs = [["publications", "Publications"], ["videos", "Vidéos"], ["discussions", "Discussions"], ["membres", "Membres"]];
  const meName = profile?.nom || "Vous";
  // La policy RLS "creator or admin updates group" (001_init.sql) applique déjà
  // cette même règle côté base — ce contrôle ici n'est qu'un raccourci d'UX.
  const canEditImage = profile?.role === "admin" || (group.createdBy && group.createdBy === profile?.id);
  const groupImageInputRef = useRef(null);
  const pickGroupImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setImageError("");
    try {
      const url = await groupService.uploadGroupImage(group.id, file);
      onGroupUpdated({ ...group, imageUrl: url });
    } catch (err) {
      setImageError(err.message || "Impossible de mettre à jour l'image pour le moment.");
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    postService.fetchGroupPosts(group.id)
      .then((rows) => { if (!cancelled) setPosts(rows.map(mapPostRow)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [group.id]);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    groupService.fetchGroupMembers(group.id)
      .then((rows) => { if (!cancelled) setMembers(rows); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setMembersLoading(false); });
    return () => { cancelled = true; };
  }, [group.id, group.nombreMembres]);

  const groupPosts = posts.filter((p) => p.type !== "video" && p.type !== "video_courte");

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 45, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title={group.nom} onBack={onClose} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ position: "relative" }}>
          <GroupImageArea group={group} height={150} iconSize={26} />
          {group.imageUrl && (
            <div style={{ position: "absolute", left: 16, right: 16, bottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{group.nom}</div>
            </div>
          )}
          {canEditImage && (
            <>
              <input ref={groupImageInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickGroupImage} style={{ display: "none" }} />
              <button
                onClick={() => groupImageInputRef.current?.click()}
                disabled={uploadingImage}
                aria-label="Changer l'image du groupe"
                style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: RADIUS.pill, background: "rgba(0,0,0,0.45)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Camera size={15} color="#fff" />
              </button>
            </>
          )}
        </div>
        {imageError && <div style={{ margin: "10px 16px 0", background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "10px 14px", fontSize: 12, color: colors.error }}>{imageError}</div>}
        <div style={{ padding: "14px 16px" }}>
          {group.description && <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5, marginBottom: 6 }}>{group.description}</div>}
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: colors.textFaint, fontWeight: 600 }}>{group.nombreMembres ?? 0} membre{(group.nombreMembres ?? 0) !== 1 ? "s" : ""}</span>
            <Button full={false} variant={group.joined ? "secondary" : "primary"} onClick={() => onToggleJoin(group.id)}>{group.joined ? "Rejoint" : "Rejoindre"}</Button>
          </div>
        </div>
        <div className="flex gap-4 px-4" style={{ overflowX: "auto", borderBottom: `1px solid ${colors.border}` }}>
          {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{ background: "none", border: "none", padding: "6px 0 10px", whiteSpace: "nowrap", borderBottom: `2px solid ${tab === k ? colors.accent : "transparent"}`, color: tab === k ? colors.text : colors.textFaint, fontSize: 12.5, fontWeight: tab === k ? 700 : 500, cursor: "pointer" }}>{l}</button>)}
        </div>
        {tab === "publications" ? (
          loading ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: colors.textFaint }}>Chargement...</div>
          ) : groupPosts.length === 0 ? (
            <EmptyState title="Aucune publication" subtitle="Les publications de ce groupe apparaîtront ici." />
          ) : (
            <div style={{ paddingTop: 6 }}>
              {groupPosts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  liked={liked.includes(p.id)}
                  saved={saved.includes(p.id)}
                  reposted={reposted.includes(p.id)}
                  onRepost={() => onRepost(p.id)}
                  commentCount={(commentsByPost[p.id] || []).length}
                  onLike={() => onLike(p.id)}
                  onSave={() => onSave(p.id)}
                  onOpenComments={() => { setSheet({ type: "comments", post: p }); onLoadComments(p.id); }}
                  onOpenActions={() => setSheet({ type: "actions", post: p })}
                  onOpenAuthor={() => onOpenProfile(p.username)}
                />
              ))}
            </div>
          )
        ) : tab === "membres" ? (
          membersLoading ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: colors.textFaint }}>Chargement...</div>
          ) : members.length === 0 ? (
            <EmptyState title="Aucun membre" subtitle="Les membres de ce groupe apparaîtront ici." />
          ) : (
            <div className="flex flex-col gap-2" style={{ padding: "10px 16px" }}>
              {members.map((m) => (
                <button key={m.id} onClick={() => onOpenProfile(m.username)} className="flex items-center gap-3" style={{ padding: "8px 4px", background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}>
                  <div style={{ width: 38, height: 38, borderRadius: RADIUS.sm, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {m.avatar ? <img src={m.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={colors.textFaint} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{m.nom}</div>
                    <div style={{ fontSize: 11.5, color: colors.textFaint }}>@{m.username}</div>
                  </div>
                  {m.role === "admin" && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "3px 9px" }}>Admin du groupe</span>
                  )}
                </button>
              ))}
            </div>
          )
        ) : (
          <EmptyState title="Aucun contenu" subtitle={`La section « ${tabs.find((t) => t[0] === tab)[1]} » de ce groupe est vide pour le moment.`} />
        )}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}><Button onClick={() => { onClose(); onCreatePost(group.id); }}>Publier dans ce groupe</Button></div>
      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={sheet.post.nom === meName}
          onClose={() => setSheet(null)}
          onEdit={() => { setSheet(null); onEditRequest(sheet.post); }}
          onDelete={() => { onDelete(sheet.post.id); setSheet(null); setPosts((p) => p.filter((x) => x.id !== sheet.post.id)); }}
          onReport={() => setSheet({ type: "report", post: sheet.post })}
          onHide={() => setSheet(null)}
          onBlock={() => { onBlock(sheet.post.username); setSheet(null); }}
        />
      )}
      {sheet?.type === "report" && (
        <ReportSheet onClose={() => setSheet(null)} onSubmit={(reason) => onReport({ targetId: sheet.post.id, targetType: "post", reason })} />
      )}
      {sheet?.type === "comments" && (
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} />
      )}
    </div>
  );
}
function CreateGroupForm({ onClose, onCreated }) {
  const { colors } = useTheme();
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);
  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const g = await groupService.createGroup({ nom, description, categorie, imageUrl: null });
      if (imageFile) {
        const url = await groupService.uploadGroupImage(g.id, imageFile);
        g.imageUrl = url;
      }
      onCreated(g);
    } catch (e) {
      setError(e.message || "Impossible de créer ce groupe pour le moment.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 46, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Créer un groupe" onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} style={{ display: "none" }} />
        <button
          onClick={() => imageInputRef.current?.click()}
          style={{ width: "100%", border: `1.5px dashed ${colors.border}`, borderRadius: RADIUS.md, padding: imagePreview ? 0 : "22px 14px", textAlign: "center", marginBottom: 16, background: "transparent", cursor: "pointer", overflow: "hidden" }}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
          ) : (
            <>
              <Camera size={20} color={colors.textFaint} style={{ margin: "0 auto 6px" }} />
              <div style={{ fontSize: 12.5, color: colors.textFaint }}>Ajouter une image</div>
            </>
          )}
        </button>
        <TextField label="Nom du groupe" value={nom} onChange={setNom} placeholder="ex : Approche en Normandie" />
        <TextField label="Description" value={description} onChange={setDescription} placeholder="Décrivez l'objet de ce groupe." textarea />
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>CATÉGORIE</div>
        <div className="flex flex-wrap gap-2">{GROUP_CATEGORIES.map((c) => <Chip key={c} label={c} active={categorie === c} onClick={() => setCategorie(categorie === c ? null : c)} />)}</div>
        {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error, marginTop: 16 }}>{error}</div>}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}><Button disabled={!nom || saving} onClick={submit}>{saving ? "Création..." : "Créer le groupe"}</Button></div>
    </div>
  );
}
function ScreenGroupes({ groups, addGroup, onToggleJoin, onCreatePost, onGroupUpdated, onOpenProfile, profile, liked, saved, reposted, commentsByPost, onLike, onSave, onRepost, onAddComment, onDelete, onEditRequest, onReport, onHide, onBlock, onLoadComments }) {
  const { colors } = useTheme();
  const [openGroup, setOpenGroup] = useState(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const joined = groups.filter((g) => g.joined);
  const filtered = query.trim() ? groups.filter((g) => g.nom.toLowerCase().includes(query.trim().toLowerCase())) : groups;
  // La sélection ouverte doit refléter l'état à jour (ex. après un "Rejoindre").
  const currentOpen = openGroup ? groups.find((g) => g.id === openGroup.id) : null;
  return (
    <div style={{ position: "relative" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>Groupes</span>
        <button onClick={() => setCreating(true)} style={{ border: `1px solid ${colors.accent}`, color: colors.accent, background: "transparent", borderRadius: RADIUS.pill, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Créer</button>
      </div>
      <div className="px-4 pb-3"><div className="flex items-center gap-2" style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "10px 14px" }}>
        <Search size={17} color={colors.textFaint} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un groupe" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: colors.text, flex: 1 }} />
      </div></div>

      {joined.length > 0 && (
        <div className="px-4 pb-2">
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, marginBottom: 8 }}>GROUPES REJOINTS</div>
        </div>
      )}
      {joined.length > 0 && <div className="grid grid-cols-2 gap-3 px-4 pb-4">{joined.map((g) => <GroupCategoryTile key={g.id} group={g} onOpen={setOpenGroup} />)}</div>}

      <div className="px-4 pb-2"><div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5 }}>À DÉCOUVRIR</div></div>
      {filtered.length === 0 ? (
        <EmptyState title="Aucun groupe trouvé" subtitle="Essayez un autre mot-clé ou créez votre propre groupe." ctaLabel="Créer un groupe" onCta={() => setCreating(true)} />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">{filtered.map((g) => <GroupCategoryTile key={g.id} group={g} onOpen={setOpenGroup} />)}</div>
      )}

      {currentOpen && (
        <GroupPage
          group={currentOpen}
          onClose={() => setOpenGroup(null)}
          onToggleJoin={onToggleJoin}
          onCreatePost={onCreatePost}
          onGroupUpdated={onGroupUpdated}
          onOpenProfile={onOpenProfile}
          profile={profile}
          liked={liked}
          saved={saved}
          reposted={reposted}
          onRepost={onRepost}
          commentsByPost={commentsByPost}
          onLike={onLike}
          onSave={onSave}
          onAddComment={onAddComment}
          onDelete={onDelete}
          onEditRequest={onEditRequest}
          onReport={onReport}
          onHide={onHide}
          onBlock={onBlock}
          onLoadComments={onLoadComments}
        />
      )}
      {creating && <CreateGroupForm onClose={() => setCreating(false)} onCreated={(g) => { addGroup(g); setCreating(false); }} />}
    </div>
  );
}

/* ============================================================
   9. CRÉATION DE CONTENU
   ============================================================ */
const CREATE_OPTIONS = [
  { key: "publication", label: "Publication", icon: TypeIcon },
  { key: "photo", label: "Photo", icon: ImageIcon },
  { key: "video", label: "Vidéo", icon: Video },
  { key: "video_courte", label: "Instant", icon: Film },
  { key: "discussion", label: "Discussion", icon: MessageCircle },
  { key: "sondage", label: "Sondage", icon: BarChart3 },
  { key: "sortie", label: "Sortie", icon: CalendarDays },
];
function ComposeScreen({ type, onClose, dogs, onPublished, authorName, editingPost, groupId }) {
  const { colors } = useTheme();
  const label = editingPost ? "Modifier" : CREATE_OPTIONS.find((o) => o.key === type)?.label || "Publication";
  const [text, setText] = useState(editingPost?.texte || "");
  const [showDetails, setShowDetails] = useState(false);
  const [animal, setAnimal] = useState(editingPost?.animal || null);
  const [pratique, setPratique] = useState(editingPost?.pratique || null);
  const [departement, setDepartement] = useState(editingPost?.localisation?.departement || "");
  const [dogId, setDogId] = useState(editingPost?.chienId || null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [contentRating, setContentRating] = useState(editingPost?.contentRating || "normal"); // 'restricted' réservé à la modération
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const isMedia = type === "photo" || type === "video" || type === "video_courte";
  const isPost = type === "publication" || isMedia;
  const isPoll = type === "sondage";
  const isOuting = type === "sortie";
  const captionLabel = isPoll ? "Question du sondage" : isOuting ? "Titre de la sortie" : type === "discussion" ? "Votre message" : "Description";

  const submit = async () => {
    setSaving(true);
    setError(false);
    const hashtags = extractHashtags(text);
    const mentions = extractMentions(text);
    try {
      if (isPost) {
        // Chemin réel (Supabase) — publication/photo/vidéo/instant.
        if (editingPost) {
          const updated = await postService.updatePost(editingPost.id, {
            texte: text, animal, pratique, departement, contentRating,
          });
          setSaving(false);
          onPublished({ ...editingPost, texte: updated.texte, animal: updated.animal, pratique: updated.pratique, contentRating: updated.content_rating, hashtags: updated.hashtags, mentions: updated.mentions });
        } else {
          const saved = await postService.createPost({
            texte: text, type, animal, pratique,
            dogId: null, // les chiens ne sont pas encore reliés à un vrai compte — à connecter avec le service chiens
            departement, contentRating, mediaFiles, groupId,
          });
          setSaving(false);
          onPublished({
            id: saved.id, nom: authorName, avatar: null,
            texte: saved.texte,
            image: saved.media?.[0]?.type === "video" ? null : saved.media?.[0]?.url || null,
            videoUrl: saved.media?.[0]?.type === "video" ? saved.media[0].url : null,
            type: saved.type, animal: saved.animal, pratique: saved.pratique,
            contentRating: saved.content_rating, hashtags: saved.hashtags || [], mentions: saved.mentions || [],
            likes: 0, commentaires: 0, date: "à l'instant", createdAt: Date.now(), titre: saved.texte,
          });
        }
      } else {
        // Discussion / sondage : pas encore de table dédiée côté base — reste local pour l'instant.
        if (editingPost) {
          onPublished({ ...editingPost, texte: text, contentRating, hashtags, mentions });
        } else {
          onPublished({ id: `local-${Date.now()}`, nom: authorName, avatar: null, texte: text, image: null, type, contentRating, hashtags, mentions, likes: 0, commentaires: 0, date: "à l'instant", createdAt: Date.now() });
        }
        setSaving(false);
      }
    } catch (e) {
      setSaving(false);
      setError(true);
    }
  };

  if (isOuting) {
    // "Sortie" n'est pas encore une vraie fonctionnalité (pas de modèle de données,
    // pas de persistance) — on l'annonce honnêtement plutôt que d'afficher un mini
    // formulaire qui donnait l'impression, à tort, que la création de sortie fonctionnait.
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 70, background: colors.background, display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Sortie" onCloseX={onClose} />
        <EmptyState title="Bientôt disponible" subtitle="La création de sorties fait partie de la vision de PISTE et arrivera avec le carnet de chasse." />
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 70, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title={label} onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        <TextField label={captionLabel} value={text} onChange={setText} placeholder={type === "discussion" ? "Posez une question, lancez une discussion..." : "Ajouter une description... (#hashtag, @mention)"} textarea rows={isPoll ? 2 : 4} />

        {isMedia && !editingPost && (
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="piste-media-input"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: `1.5px dashed ${colors.border}`, borderRadius: RADIUS.md, padding: "22px 14px", textAlign: "center", cursor: "pointer" }}
            >
              <ImageIcon size={20} color={colors.textFaint} />
              <span style={{ fontSize: 12.5, color: colors.textFaint }}>
                {mediaFiles.length > 0 ? `${mediaFiles.length} fichier${mediaFiles.length > 1 ? "s" : ""} sélectionné${mediaFiles.length > 1 ? "s" : ""}` : "Choisir une ou plusieurs images/vidéos"}
              </span>
            </label>
            <input
              id="piste-media-input"
              type="file"
              accept={type === "photo" ? "image/*" : type === "publication" ? "image/*,video/*" : "video/*"}
              multiple
              onChange={(e) => setMediaFiles(Array.from(e.target.files || []))}
              style={{ display: "none" }}
            />
            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
                {mediaFiles.map((f, i) => (
                  <span key={i} style={{ fontSize: 11, color: colors.textSecondary, background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "4px 10px" }}>{f.name}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {isPoll && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.textSecondary, marginBottom: 6, display: "block" }}>Options</label>
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <input value={opt} onChange={(e) => { const arr = [...pollOptions]; arr[i] = e.target.value; setPollOptions(arr); }} placeholder={`Option ${i + 1}`} style={{ flex: 1, border: `1.5px solid ${colors.border}`, background: colors.surface, borderRadius: RADIUS.sm, padding: "11px 14px", fontSize: 14, color: colors.text, outline: "none" }} />
                {pollOptions.length > 2 && <IconButton icon={X} onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} />}
              </div>
            ))}
            {pollOptions.length < 4 && <button onClick={() => setPollOptions([...pollOptions, ""])} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Ajouter une option</button>}
          </div>
        )}



        {isMedia && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>NIVEAU DE CONTENU</div>
            <div className="flex gap-2">
              {["normal", "sensitive"].map((r) => (
                <Chip key={r} label={CONTENT_RATINGS[r].label} active={contentRating === r} onClick={() => setContentRating(r)} />
              ))}
            </div>
            {contentRating === "sensitive" && <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 8, lineHeight: 1.5 }}>Une simple photo de chasse n'a pas besoin de ce marquage. Réservez-le aux images potentiellement choquantes (dépouillement, sang important...).</div>}
          </div>
        )}

        {isPost && (
          <>
            <button onClick={() => setShowDetails(!showDetails)} className="flex items-center justify-between" style={{ width: "100%", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "12px 14px", cursor: "pointer", marginBottom: showDetails ? 14 : 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Ajouter des détails (optionnel)</span>
              <ChevronRight size={15} color={colors.textFaint} style={{ transform: showDetails ? "rotate(90deg)" : "none", transition: "transform 150ms ease" }} />
            </button>
            {showDetails && (
              <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.md, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>ANIMAL</div>
                <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>{ANIMALS.map((a) => <Chip key={a} label={a} active={animal === a} onClick={() => setAnimal(animal === a ? null : a)} />)}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>TYPE</div>
                <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>{PRACTICE_TYPES.map((t) => <Chip key={t} label={t} active={pratique === t} onClick={() => setPratique(pratique === t ? null : t)} />)}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>CHIEN</div>
                <select value={dogId || ""} onChange={(e) => setDogId(e.target.value || null)} style={{ width: "100%", border: `1.5px solid ${colors.border}`, background: colors.surfaceAlt, borderRadius: RADIUS.sm, padding: "11px 14px", fontSize: 13.5, color: colors.text, outline: "none", marginBottom: 16 }}>
                  <option value="">Aucun</option>
                  {dogs.length === 0 && <option disabled>Aucun chien enregistré</option>}
                  {dogs.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>LOCALISATION</div>
                <TextField label={null} value={departement} onChange={setDepartement} placeholder="Département" />
                <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: -8, lineHeight: 1.5 }}><MapPin size={11} style={{ display: "inline", marginRight: 4, verticalAlign: -1 }} />Votre position précise n'est jamais affichée publiquement.</div>
              </div>
            )}
          </>
        )}
        {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error, marginTop: 4 }}>Impossible de publier pour le moment. Réessayez.</div>}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}`, background: colors.surface }}>
        <Button onClick={submit} disabled={saving || (isPoll && pollOptions.filter((o) => o.trim()).length < 2)}>{saving ? (editingPost ? "Enregistrement..." : "Publication...") : editingPost ? "Enregistrer les modifications" : "Publier"}</Button>
      </div>
    </div>
  );
}
function CreateFlow({ open, onClose, dogs, onPublished, authorName, editingPost, onEdited, groupId }) {
  const { colors } = useTheme();
  const [step, setStep] = useState(editingPost ? "compose" : "pick");
  const [type, setType] = useState(editingPost ? editingPost.type : null);
  useEffect(() => {
    if (editingPost) { setType(editingPost.type); setStep("compose"); }
  }, [editingPost]);
  if (!open) return null;
  const close = () => { setStep("pick"); setType(null); onClose(); };
  if (step === "compose") {
    return (
      <ComposeScreen
        type={type}
        onClose={close}
        dogs={dogs}
        authorName={authorName}
        editingPost={editingPost}
        groupId={editingPost ? null : groupId}
        onPublished={(p) => { close(); if (editingPost) onEdited(p); else onPublished(type, p); }}
      />
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
      <div onClick={close} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: colors.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: "10px 20px 26px" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "6px auto 16px" }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 12 }}>Créer</div>
        <div className="grid grid-cols-2 gap-2">
          {CREATE_OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <button key={o.key} onClick={() => { setType(o.key); setStep("compose"); }} className="flex items-center gap-3 active:scale-[0.98] transition-transform" style={{ border: `1px solid ${colors.border}`, borderRadius: RADIUS.md, padding: "13px 12px", background: colors.background, cursor: "pointer" }}>
                <div style={{ width: 32, height: 32, borderRadius: RADIUS.sm, background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={16} color={colors.accent} strokeWidth={1.8} /></div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.text, textAlign: "left" }}>{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   10. PROFIL — header, édition, chien
   ============================================================ */
function ProfileEditor({ profile, onClose, onSave }) {
  const { colors } = useTheme();
  const [form, setForm] = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(profile.imageCouverture || null);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const pickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };
  const pickBanner = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      let avatarUrl = profile.avatar;
      if (avatarFile) {
        avatarUrl = await profileService.uploadAvatar(avatarFile);
      }
      let bannerUrl = profile.imageCouverture;
      if (bannerFile) {
        bannerUrl = await profileService.uploadBanner(bannerFile);
      }
      const saved = await profileService.updateProfile({
        nom: form.nom,
        username: form.username,
        bio: form.bio,
        localisation: form.localisation,
      });
      onSave({ ...saved, avatar: avatarUrl, imageCouverture: bannerUrl, interets: form.interets });
    } catch (e) {
      setError(e.message || "Impossible d'enregistrer le profil pour le moment.");
    } finally {
      setSaving(false);
    }
  };
  const toggleInterest = (i) => setForm({ ...form, interets: form.interets.includes(i) ? form.interets.filter((x) => x !== i) : [...form.interets, i] });
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Modifier le profil" onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <input ref={bannerInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickBanner} style={{ display: "none" }} />
        <button
          onClick={() => bannerInputRef.current?.click()}
          style={{ width: "100%", height: 100, background: bannerPreview ? `url(${bannerPreview}) center/cover` : colors.surfaceAlt, position: "relative", border: "none", padding: 0, cursor: "pointer", display: "block" }}
        >
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: bannerPreview ? "rgba(0,0,0,0.25)" : "transparent" }}><Camera size={20} color={bannerPreview ? "#fff" : colors.textFaint} /></div>
        </button>
        <div style={{ padding: "0 20px" }}>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} style={{ display: "none" }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: 72, height: 72, borderRadius: RADIUS.md, background: colors.surface, border: `3px solid ${colors.background}`, marginTop: -30, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", padding: 0, overflow: "hidden" }}
          >
            {avatarPreview ? <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={28} color={colors.textFaint} />}
            <div style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: 8, background: colors.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={12} color={colors.onAccent} /></div>
          </button>
          <div style={{ marginTop: 16 }}>
            <TextField label="Nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} placeholder="Votre nom" />
            <TextField label="Nom d'utilisateur" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="handle" />
            <TextField label="Bio" value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} placeholder="Quelques mots sur vous." textarea />
            <TextField label="Localisation" value={form.localisation} onChange={(v) => setForm({ ...form, localisation: v })} placeholder="Département" />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>Centres d'intérêt</div>
            <div className="flex flex-wrap gap-2" style={{ marginBottom: 20 }}>{INTERESTS.map((i) => <Chip key={i} label={i} active={form.interets.includes(i)} onClick={() => toggleInterest(i)} />)}</div>
            {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error, marginBottom: 12 }}>{error}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}><Button onClick={submit} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></div>
    </div>
  );
}
function DogFormScreen({ onClose, onSaved }) {
  const { colors } = useTheme();
  const [nom, setNom] = useState("");
  const [race, setRace] = useState("");
  const [age, setAge] = useState("");
  const [sexe, setSexe] = useState(null);
  const [specialite, setSpecialite] = useState(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoInputRef = useRef(null);
  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const dog = await dogService.createDog({ nom, race, age, sexe, specialite, description, photoFile });
      onSaved(dog);
    } catch (e) {
      setError(e.message || "Impossible d'enregistrer ce chien pour le moment.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 65, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Ajouter un chien" onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickPhoto} style={{ display: "none" }} />
        <button
          onClick={() => photoInputRef.current?.click()}
          style={{ width: "100%", border: `1.5px dashed ${colors.border}`, borderRadius: RADIUS.md, padding: photoPreview ? 0 : "22px 14px", textAlign: "center", marginBottom: 16, background: "transparent", cursor: "pointer", overflow: "hidden" }}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
          ) : (
            <>
              <Dog size={20} color={colors.textFaint} style={{ margin: "0 auto 6px" }} />
              <div style={{ fontSize: 12.5, color: colors.textFaint }}>Ajouter une photo</div>
            </>
          )}
        </button>
        <TextField label="Nom" value={nom} onChange={setNom} placeholder="ex : Basco" />
        <TextField label="Race" value={race} onChange={setRace} placeholder="ex : Épagneul breton" />
        <TextField label="Âge" value={age} onChange={setAge} placeholder="ex : 3 ans" type="number" />
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>SEXE</div>
        <div className="flex gap-2" style={{ marginBottom: 16 }}>
          {["Mâle", "Femelle"].map((s) => <Chip key={s} label={s} active={sexe === s} onClick={() => setSexe(sexe === s ? null : s)} />)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>SPÉCIALITÉ</div>
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
          {["Chien d'arrêt", "Chien courant", "Chien de rapport", "Chien de rouge", "Autre"].map((s) => <Chip key={s} label={s} active={specialite === s} onClick={() => setSpecialite(specialite === s ? null : s)} />)}
        </div>
        <TextField label="Description" value={description} onChange={setDescription} placeholder="Quelques mots sur votre compagnon de chasse." textarea />
        {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error }}>{error}</div>}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}><Button disabled={!nom || saving} onClick={submit}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></div>
    </div>
  );
}
function DogPage({ dog, onClose }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState("photos");
  const tabs = [["photos", "Photos"], ["videos", "Vidéos"], ["sorties", "Sorties"], ["publications", "Publications"]];
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 45, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title={dog.nom} onBack={onClose} />
      <div className="px-5 pt-4">
        <div style={{ width: 64, height: 64, borderRadius: RADIUS.md, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, overflow: "hidden" }}>
          {dog.photo_url ? <img src={dog.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Dog size={26} color={colors.textFaint} />}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>{dog.nom}</div>
        <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 2 }}>{[dog.race, dog.sexe, dog.age && `${dog.age} ans`, dog.specialite].filter(Boolean).join(" · ")}</div>
        {dog.description && <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 8, lineHeight: 1.5 }}>{dog.description}</div>}
      </div>
      <div className="flex gap-4 px-4 pt-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
        {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{ background: "none", border: "none", padding: "6px 0 10px", borderBottom: `2px solid ${tab === k ? colors.accent : "transparent"}`, color: tab === k ? colors.text : colors.textFaint, fontSize: 12.5, fontWeight: tab === k ? 700 : 500, cursor: "pointer" }}>{l}</button>)}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}><EmptyState title="Aucun contenu" subtitle={`La section « ${tabs.find((t) => t[0] === tab)[1]} » est vide pour le moment.`} /></div>
    </div>
  );
}
function ScreenProfil({ profile, setProfile, dogs, addDog, posts, videos, liked, saved, reposted, commentsByPost, onLike, onSave, onRepost, onAddComment, onDelete, onEditRequest, onReport, onHide, onBlock, onLoadComments, onOpenPlayer, onOpenProfile }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState("publications");
  const [editing, setEditing] = useState(false);
  const [dogForm, setDogForm] = useState(false);
  const [openDog, setOpenDog] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [repostedPosts, setRepostedPosts] = useState([]);
  const [repostsLoading, setRepostsLoading] = useState(true);
  const tabs = [["publications", "Publications", Home], ["videos", "Vidéos", Video], ["chiens", "Chiens", Dog], ["reposts", "Reposts", Repeat2]];
  const stats = profile.statistiques || { abonnes: 0, abonnements: 0, publications: posts.length };
  const meName = profile.nom || "Vous";

  useEffect(() => {
    let cancelled = false;
    postService.fetchMyRepostedPosts()
      .then((rows) => { if (!cancelled) setRepostedPosts(rows.map(mapPostRow)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRepostsLoading(false); });
    return () => { cancelled = true; };
  }, [reposted]);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ width: "100%", height: 96, background: profile.imageCouverture ? `url(${profile.imageCouverture}) center/cover` : colors.surfaceAlt }} />
      <div className="px-4">
        <div style={{ marginTop: -34 }}>
          <div style={{ width: 72, height: 72, borderRadius: RADIUS.md, background: colors.surface, border: `3px solid ${colors.background}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={30} color={colors.textFaint} strokeWidth={1.6} />}
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{profile.nom || "Votre nom"}</div>
          <div style={{ fontSize: 13, color: colors.textFaint }}>@{profile.username || "handle"}</div>
          <BadgeRow badges={profile.badges} />
          {profile.localisation && <div className="flex items-center gap-1" style={{ marginTop: 4 }}><MapPin size={13} color={colors.textFaint} /><span style={{ fontSize: 12.5, color: colors.textFaint }}>{profile.localisation}</span></div>}
          <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 8, lineHeight: 1.5 }}>{profile.bio || "Aucune biographie renseignée pour le moment."}</div>
        </div>
        <div style={{ marginTop: 16, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.md, padding: "12px 4px" }} className="flex">
          {[["Abonnés", stats.abonnes], ["Abonnements", stats.abonnements], ["Publications", posts.length]].map(([label, val]) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>{val}</div>
              <div style={{ fontSize: 11, color: colors.textSecondary }}>{label}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setEditing(true)} style={{ marginTop: 14, width: "100%", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, borderRadius: RADIUS.sm, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Modifier le profil</button>
      </div>
      <div className="flex px-2 mt-5" style={{ borderBottom: `1px solid ${colors.border}` }}>
        {tabs.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className="flex flex-col items-center gap-1" style={{ flex: 1, padding: "8px 0 10px", background: "none", border: "none", borderBottom: `2px solid ${tab === key ? colors.accent : "transparent"}`, cursor: "pointer" }}>
            <Icon size={16} color={tab === key ? colors.accent : colors.textFaint} strokeWidth={1.8} />
            <span style={{ fontSize: 10.5, fontWeight: tab === key ? 700 : 500, color: tab === key ? colors.text : colors.textFaint }}>{label}</span>
          </button>
        ))}
      </div>

      {tab === "publications" && (
        posts.length === 0 ? <EmptyState title="Aucune publication" subtitle="Vos publications apparaîtront ici." /> : (
          <div style={{ paddingTop: 10 }}>
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                liked={liked.includes(p.id)}
                saved={saved.includes(p.id)}
                reposted={reposted.includes(p.id)}
                onRepost={() => onRepost(p.id)}
                commentCount={(commentsByPost[p.id] || []).length}
                onLike={() => onLike(p.id)}
                onSave={() => onSave(p.id)}
                onOpenComments={() => { setSheet({ type: "comments", post: p }); onLoadComments(p.id); }}
                onOpenActions={() => setSheet({ type: "actions", post: p })}
                onOpenAuthor={() => onOpenProfile(p.username)}
              />
            ))}
          </div>
        )
      )}
      {tab === "videos" && (
        videos.length === 0 ? <EmptyState title="Aucune vidéo" subtitle="Vos vidéos apparaîtront ici." /> : (
          <div style={{ paddingTop: 6 }}>
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                liked={liked.includes(v.id)}
                commentCount={(commentsByPost[v.id] || []).length}
                onLike={() => onLike(v.id)}
                onOpenComments={() => { setSheet({ type: "comments", post: v }); onLoadComments(v.id); }}
                onOpenActions={() => setSheet({ type: "actions", post: v })}
                onOpenAuthor={() => onOpenProfile(v.username)}
                onOpenPlayer={() => onOpenPlayer && onOpenPlayer(v)}
              />
            ))}
          </div>
        )
      )}
      {tab === "reposts" && (
        repostsLoading ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: colors.textFaint }}>Chargement...</div>
        ) : repostedPosts.length === 0 ? (
          <EmptyState title="Aucun repost" subtitle="Les publications que vous repartagez apparaîtront ici." />
        ) : (
          <div style={{ paddingTop: 10 }}>
            {repostedPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                liked={liked.includes(p.id)}
                saved={saved.includes(p.id)}
                reposted={true}
                onRepost={() => onRepost(p.id)}
                commentCount={(commentsByPost[p.id] || []).length}
                onLike={() => onLike(p.id)}
                onSave={() => onSave(p.id)}
                onOpenComments={() => { setSheet({ type: "comments", post: p }); onLoadComments(p.id); }}
                onOpenActions={() => setSheet({ type: "actions", post: p })}
                onOpenAuthor={() => onOpenProfile(p.username)}
              />
            ))}
          </div>
        )
      )}
      {tab === "chiens" && (
        dogs.length === 0 ? (
          <EmptyState title="Aucun chien enregistré" subtitle="Créez le profil de votre chien pour partager ses sorties et ses publications." ctaLabel="Ajouter un chien" onCta={() => setDogForm(true)} />
        ) : (
          <div className="px-4 pt-4 flex flex-col gap-2">
            {dogs.map((d) => (
              <button key={d.id} onClick={() => setOpenDog(d)} className="flex items-center gap-3" style={{ border: `1px solid ${colors.border}`, borderRadius: RADIUS.md, padding: 12, background: colors.surface, cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 40, height: 40, borderRadius: RADIUS.sm, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {d.photo_url ? <img src={d.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Dog size={18} color={colors.textFaint} />}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>{d.nom}</span>
              </button>
            ))}
            <button onClick={() => setDogForm(true)} style={{ marginTop: 4, border: `1px dashed ${colors.border}`, borderRadius: RADIUS.md, padding: 12, background: "transparent", color: colors.accent, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Ajouter un chien</button>
          </div>
        )
      )}

      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={sheet.post.nom === meName}
          onClose={() => setSheet(null)}
          onEdit={() => { setSheet(null); onEditRequest(sheet.post); }}
          onDelete={() => { onDelete(sheet.post.id); setSheet(null); }}
          onReport={() => setSheet({ type: "report", post: sheet.post })}
          onHide={() => { onHide(sheet.post.id); setSheet(null); }}
          onBlock={() => { onBlock(sheet.post.username); setSheet(null); }}
        />
      )}
      {sheet?.type === "report" && (
        <ReportSheet onClose={() => setSheet(null)} onSubmit={(reason) => onReport({ targetId: sheet.post.id, targetType: "post", reason })} />
      )}
      {sheet?.type === "comments" && (
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} />
      )}
      {editing && <ProfileEditor profile={profile} onClose={() => setEditing(false)} onSave={(p) => { setProfile(p); setEditing(false); }} />}
      {dogForm && <DogFormScreen onClose={() => setDogForm(false)} onSaved={(d) => { addDog(d); setDogForm(false); }} />}
      {openDog && <DogPage dog={openDog} onClose={() => setOpenDog(null)} />}
    </div>
  );
}

/* ============================================================
   10.5 MESSAGERIE
   ============================================================ */
function MessageBubble({ mine, media, colors }) {
  if (!media) return null;
  if (media.type === "image") {
    return <img src={media.url} alt="" style={{ maxWidth: "100%", borderRadius: RADIUS.md, display: "block" }} />;
  }
  if (media.type === "video") {
    return <video src={media.url} controls playsInline style={{ maxWidth: "100%", borderRadius: RADIUS.md, display: "block" }} />;
  }
  if (media.type === "audio") {
    return (
      <div className="flex items-center gap-2" style={{ minWidth: 180 }}>
        <audio src={media.url} controls style={{ height: 32, flex: 1 }} />
        {media.duration_seconds != null && (
          <span style={{ fontSize: 10.5, color: mine ? colors.onAccent : colors.textFaint, flexShrink: 0 }}>
            {Math.floor(media.duration_seconds / 60)}:{String(media.duration_seconds % 60).padStart(2, "0")}
          </span>
        )}
      </div>
    );
  }
  return null;
}
function ConversationThread({ conversationId, meId, onClose, title, subtitle, onOpenProfile, onRead }) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const refetch = () => messageService.fetchMessages(conversationId).then(setMessages).catch(() => {});
  const markRead = () => messageService.markConversationRead(conversationId).then(() => onRead?.()).catch(() => {});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    messageService.fetchMessages(conversationId)
      .then((rows) => { if (!cancelled) setMessages(rows); })
      .catch((e) => { if (!cancelled) setLoadError(e.message || "Impossible de charger les messages."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    markRead(); // ouvrir la conversation = la marquer comme lue
    // Le payload realtime brut ne contient pas les jointures (profil, média) —
    // on recharge donc le fil complet à chaque nouveau message plutôt que
    // d'ajouter la ligne brute reçue. La conversation reste "lue" tant qu'elle
    // est ouverte : on remet à jour last_read_at à chaque message reçu ici.
    const unsubscribe = messageService.subscribeToConversation(conversationId, () => { if (!cancelled) { refetch(); markRead(); } });
    return () => { cancelled = true; unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const submit = async () => {
    const texte = text.trim();
    if (!texte) return;
    setSending(true);
    setText("");
    try {
      const sent = await messageService.sendMessage(conversationId, texte);
      setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
    } catch (e) {
      setText(texte); // on redonne le texte pour ne pas le perdre
    } finally {
      setSending(false);
    }
  };

  const pickMedia = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMediaError("");
    setSending(true);
    try {
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      const sent = await messageService.sendMediaMessage(conversationId, file, mediaType);
      setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
    } catch (e2) {
      setMediaError(e2.message || "Impossible d'envoyer ce fichier.");
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    setMediaError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      recorderRef.current = { recorder, stream };
      setRecordSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (e) {
      setMediaError("Microphone indisponible ou accès refusé.");
    }
  };

  const stopRecording = async () => {
    const ref = recorderRef.current;
    if (!ref) return;
    window.clearInterval(timerRef.current);
    const duration = recordSeconds;
    setRecording(false);
    await new Promise((resolve) => {
      ref.recorder.onstop = resolve;
      ref.recorder.stop();
    });
    ref.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    if (duration < 1) return; // enregistrement trop court, probablement annulé
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const file = new File([blob], `vocal-${Date.now()}.webm`, { type: "audio/webm" });
    setSending(true);
    try {
      const sent = await messageService.sendMediaMessage(conversationId, file, "audio", duration);
      setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
    } catch (e) {
      setMediaError(e.message || "Impossible d'envoyer le message vocal.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, background: colors.background, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title={title} onBack={onClose} />
      {subtitle && <div style={{ padding: "0 16px 10px", fontSize: 11.5, color: colors.textFaint, marginTop: -6 }}>{subtitle}</div>}
      <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginTop: 24 }}>Chargement...</div>
        ) : loadError ? (
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.error, marginTop: 24, padding: "0 20px" }}>{loadError}</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginTop: 24 }}>Aucun message. Dites bonjour !</div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === meId;
            const media = m.message_media?.[0];
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "78%" }}>
                  {!mine && (
                    m.profiles?.username ? (
                      <button onClick={() => onOpenProfile(m.profiles.username)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 10.5, color: colors.textFaint, marginBottom: 2, marginLeft: 4 }}>
                        {m.profiles?.nom || m.profiles?.username}
                      </button>
                    ) : (
                      <div style={{ fontSize: 10.5, color: colors.textFaint, marginBottom: 2, marginLeft: 4 }}>Utilisateur</div>
                    )
                  )}
                  <div style={{ background: mine ? colors.accent : colors.surface, border: mine ? "none" : `1px solid ${colors.border}`, color: mine ? colors.onAccent : colors.text, borderRadius: RADIUS.md, padding: media && !m.texte ? 6 : "9px 13px", fontSize: 13.5, lineHeight: 1.4, wordBreak: "break-word" }}>
                    {media && <MessageBubble mine={mine} media={media} colors={colors} />}
                    {m.texte && <div style={{ marginTop: media ? 6 : 0 }}>{m.texte}</div>}
                  </div>
                  <div style={{ fontSize: 9.5, color: colors.textFaint, marginTop: 2, textAlign: mine ? "right" : "left" }}>{formatRelativeDate(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {mediaError && <div style={{ margin: "0 12px 8px", background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "8px 12px", fontSize: 11.5, color: colors.error }}>{mediaError}</div>}
      <div className="flex items-center gap-2" style={{ padding: 12, borderTop: `1px solid ${colors.border}` }}>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={pickMedia} style={{ display: "none" }} />
        {recording ? (
          <button onClick={stopRecording} className="flex items-center gap-2" style={{ flex: 1, border: `1.5px solid ${colors.error}`, background: colors.errorSoft, borderRadius: RADIUS.pill, padding: "10px 16px", cursor: "pointer" }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: colors.error }} />
            <span style={{ fontSize: 13, color: colors.error, fontWeight: 600 }}>Enregistrement... {recordSeconds}s (toucher pour envoyer)</span>
          </button>
        ) : (
          <>
            <IconButton icon={ImageIcon} onClick={() => fileInputRef.current?.click()} />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !sending) submit(); }}
              placeholder="Écrire un message..."
              style={{ flex: 1, border: `1.5px solid ${colors.border}`, background: colors.surface, borderRadius: RADIUS.pill, padding: "10px 16px", fontSize: 13.5, color: colors.text, outline: "none" }}
            />
            {text.trim() ? (
              <button onClick={submit} disabled={sending} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, background: colors.accent, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <ArrowLeft size={16} color={colors.onAccent} style={{ transform: "rotate(135deg)" }} />
              </button>
            ) : (
              <button onClick={startRecording} disabled={sending} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, background: colors.surfaceAlt, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <Mic size={16} color={colors.textFaint} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
function NewConversationSheet({ onClose, onStarted }) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [groupMode, setGroupMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      socialService.searchUsers(q)
        .then((rows) => { if (!cancelled) setResults(rows); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  const toggleSelect = (u) => setSelected((s) => (s.some((x) => x.id === u.id) ? s.filter((x) => x.id !== u.id) : [...s, u]));

  const startDirect = async (u) => {
    setError("");
    try {
      const conversationId = await messageService.startDirectConversation(u.id);
      onStarted(conversationId, u.nom || u.username);
    } catch (e) {
      setError(e.message || "Impossible de démarrer la conversation.");
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    setCreating(true);
    setError("");
    try {
      const conversationId = await messageService.createGroupConversation(groupName.trim(), selected.map((u) => u.id));
      onStarted(conversationId, groupName.trim());
    } catch (e) {
      setError(e.message || "Impossible de créer ce groupe pour le moment.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, background: colors.background, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title={groupMode ? "Nouveau groupe" : "Nouveau message"} onCloseX={onClose} />
      <div style={{ padding: "0 16px 10px" }}>
        <SegmentedControl
          options={[{ key: "direct", label: "Message direct" }, { key: "group", label: "Groupe" }]}
          value={groupMode ? "group" : "direct"}
          onChange={(k) => setGroupMode(k === "group")}
        />
      </div>
      {groupMode && (
        <div style={{ padding: "0 16px 10px" }}>
          <TextField label="Nom du groupe" value={groupName} onChange={setGroupName} placeholder="ex : Sortie du week-end" />
        </div>
      )}
      <div style={{ padding: "0 16px 10px" }}>
        <div className="flex items-center gap-2" style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "10px 14px" }}>
          <Search size={17} color={colors.textFaint} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un pseudo ou un nom" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: colors.text, flex: 1 }} />
        </div>
      </div>
      {groupMode && selected.length > 0 && (
        <div className="flex flex-wrap gap-2" style={{ padding: "0 16px 10px" }}>
          {selected.map((u) => <Chip key={u.id} label={u.nom || u.username} active onClick={() => toggleSelect(u)} />)}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
        {searching ? (
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginTop: 20 }}>Recherche...</div>
        ) : results.length === 0 ? (
          <EmptyState title={query.trim() ? "Aucun résultat" : "Rechercher un utilisateur"} subtitle={query.trim() ? `Personne ne correspond à « ${query} ».` : "Tapez un pseudo ou un nom pour démarrer."} />
        ) : (
          results.map((u) => (
            <button
              key={u.id}
              onClick={() => (groupMode ? toggleSelect(u) : startDirect(u))}
              className="flex items-center gap-3"
              style={{ width: "100%", background: "none", border: "none", padding: "10px 2px", cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ width: 38, height: 38, borderRadius: RADIUS.sm, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={colors.textFaint} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{u.nom || u.username}</div>
                <div style={{ fontSize: 11.5, color: colors.textFaint }}>@{u.username}</div>
              </div>
              {groupMode && (
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${selected.some((x) => x.id === u.id) ? colors.accent : colors.border}`, background: selected.some((x) => x.id === u.id) ? colors.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selected.some((x) => x.id === u.id) && <Check size={12} color={colors.onAccent} strokeWidth={3} />}
                </div>
              )}
            </button>
          ))
        )}
      </div>
      {error && <div style={{ margin: "0 16px 10px", background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "10px 14px", fontSize: 12, color: colors.error }}>{error}</div>}
      {groupMode && (
        <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}>
          <Button disabled={!groupName.trim() || selected.length === 0 || creating} onClick={createGroup}>{creating ? "Création..." : "Créer le groupe"}</Button>
        </div>
      )}
    </div>
  );
}
function ScreenMessages({ meId, initialConversationId, onConsumeInitialConversation, onOpenProfile, onRead }) {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openConv, setOpenConv] = useState(null); // { id, title }
  const [showNew, setShowNew] = useState(false);

  const refresh = () => {
    messageService.fetchConversations().then(setConversations).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    messageService.fetchConversations().then(setConversations).catch(() => {}).finally(() => setLoading(false));
    const unsubscribe = messageService.subscribeToMyMessages(() => refresh());
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ouverture directe d'une conversation depuis une notification (message /
  // ajout à un groupe) — voir NotificationsPanel.
  useEffect(() => {
    if (!initialConversationId || conversations.length === 0) return;
    const conv = conversations.find((c) => c.id === initialConversationId);
    if (conv) setOpenConv({ id: conv.id, title: conv.nom });
    onConsumeInitialConversation?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, conversations]);

  return (
    <div style={{ position: "relative" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>Messages</span>
        <button onClick={() => setShowNew(true)} style={{ border: `1px solid ${colors.accent}`, color: colors.accent, background: "transparent", borderRadius: RADIUS.pill, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Nouveau</button>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginTop: 24 }}>Chargement...</div>
      ) : conversations.length === 0 ? (
        <EmptyState title="Aucun message pour le moment" subtitle="Vos conversations avec les autres membres de PISTE apparaîtront ici." ctaLabel="Démarrer une conversation" onCta={() => setShowNew(true)} />
      ) : (
        <div className="flex flex-col" style={{ padding: "4px 8px" }}>
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setOpenConv({ id: c.id, title: c.nom })} className="flex items-center gap-3" style={{ width: "100%", background: "none", border: "none", padding: "10px 8px", cursor: "pointer", textAlign: "left", borderRadius: RADIUS.sm }}>
              <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {c.type === "group" ? <Users size={18} color={colors.textFaint} /> : c.avatar ? <img src={c.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={18} color={colors.textFaint} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.text }}>{c.nom}</div>
                <div style={{ fontSize: 12, color: colors.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.lastMessage
                    ? `${c.lastSenderIsMe ? "Vous : " : ""}${c.lastMessage}`
                    : c.hasLastMessage
                    ? (c.lastSenderIsMe ? "Vous : nouveau message" : "Nouveau message")
                    : "Aucun message"}
                </div>
              </div>
              <div style={{ fontSize: 10.5, color: colors.textFaint, flexShrink: 0 }}>{formatRelativeDate(c.lastMessageAt)}</div>
            </button>
          ))}
        </div>
      )}
      {openConv && <ConversationThread conversationId={openConv.id} meId={meId} onClose={() => { setOpenConv(null); refresh(); }} title={openConv.title} onOpenProfile={onOpenProfile} onRead={onRead} />}
      {showNew && (
        <NewConversationSheet
          onClose={() => setShowNew(false)}
          onStarted={(conversationId, title) => { setShowNew(false); setOpenConv({ id: conversationId, title }); refresh(); }}
        />
      )}
    </div>
  );
}

const NOTIF_ICON = { like: Heart, comment: MessageSquare, follow: User, repost: Repeat2, message: MessageCircle, group_invite: Users, new_post: Bell, mention: MessageSquare, moderation: AlertTriangle, system: Bell };
const NOTIF_TEXT = {
  like: (nom) => `${nom} a aimé votre publication.`,
  comment: (nom) => `${nom} a commenté votre publication.`,
  follow: (nom) => `${nom} a commencé à vous suivre.`,
  repost: (nom) => `${nom} a reposté votre publication.`,
  message: (nom) => `${nom} vous a envoyé un message.`,
  group_invite: (nom) => `${nom} vous a ajouté à un groupe de messagerie.`,
  new_post: (nom) => `${nom} a publié quelque chose de nouveau.`,
  mention: (nom) => `${nom} vous a mentionné.`,
  moderation: () => `Une action de modération concerne votre compte.`,
  system: () => `Notification système.`,
};
function NotificationsPanel({ onClose, onOpenConversation, onOpenAuthor, onGoToFeed, onUnreadChange }) {
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    notificationService.fetchNotifications()
      .then((rows) => { setItems(rows); onUnreadChange?.(rows.filter((r) => !r.lu).length); })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (n) => {
    if (!n.lu) {
      notificationService.markAsRead(n.id).catch(() => {});
      setItems((its) => its.map((x) => (x.id === n.id ? { ...x, lu: true } : x)));
      onUnreadChange?.((prev) => Math.max(0, prev - 1));
    }
    if (n.type === "message" || n.type === "group_invite") onOpenConversation(n.targetId);
    else if (n.actor?.username) onOpenAuthor(n.actor.username);
    else onGoToFeed();
    onClose();
  };

  const markAll = () => {
    notificationService.markAllAsRead().catch(() => {});
    setItems((its) => its.map((x) => ({ ...x, lu: true })));
    onUnreadChange?.(0);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: colors.background, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title="Notifications" onBack={onClose} />
      {items.some((n) => !n.lu) && (
        <div style={{ padding: "0 16px 8px", textAlign: "right" }}>
          <button onClick={markAll} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Tout marquer comme lu</button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginTop: 24 }}>Chargement...</div>
        ) : items.length === 0 ? (
          <EmptyState title="Aucune notification pour le moment" subtitle="Vous serez averti ici des interactions et des nouveautés qui vous concernent." />
        ) : (
          items.map((n) => {
            const Icon = NOTIF_ICON[n.type] || Bell;
            const nom = n.actor?.nom || n.actor?.username || "Quelqu'un";
            const text = NOTIF_TEXT[n.type] ? NOTIF_TEXT[n.type](nom) : "Nouvelle notification.";
            return (
              <button key={n.id} onClick={() => open(n)} className="flex items-center gap-3" style={{ width: "100%", background: n.lu ? "none" : colors.accentSoft, border: "none", borderBottom: `1px solid ${colors.border}`, padding: "12px 16px", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {n.actor?.avatar ? <img src={n.actor.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon size={16} color={colors.textFaint} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.4 }}>{text}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{formatRelativeDate(n.createdAt)}</div>
                </div>
                {!n.lu && <div style={{ width: 8, height: 8, borderRadius: 4, background: colors.accent, flexShrink: 0 }} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ============================================================
   11. PANNEAU "PLUS"
   ============================================================ */
const FEATURE_ITEMS = [
  { key: "marketplace", label: "Marketplace", glyph: "marketplace", desc: "Vêtements, optiques, matériel et équipement de la communauté PISTE." },
  { key: "carte", label: "Carte", glyph: "carte", desc: "Professionnels, associations, formations et événements près de chez vous." },
  { key: "actualites", label: "Actualités", glyph: "actualites", desc: "Réglementation, biodiversité, gestion de la faune et informations régionales." },
  { key: "sorties", label: "Sorties", glyph: "sorties", desc: "Organisez et retrouvez les sorties de votre communauté." },
  { key: "enregistrements", label: "Enregistrements", icon: Bookmark, real: true },
];
const APP_ITEMS = [
  { key: "parametres", label: "Paramètres", icon: Settings, real: true },
  { key: "apparence", label: "Apparence", icon: Moon, appearance: true },
  { key: "aide", label: "Aide", icon: HelpCircle, real: true },
  { key: "reglement", label: "Règlement PISTE", icon: BookOpen, real: true },
  { key: "signaler", label: "Signaler un problème", icon: AlertTriangle, desc: "Faites-nous remonter un bug ou un souci." },
];
function PlusRow({ item, onOpen }) {
  const { colors } = useTheme();
  const Icon = item.icon;
  return (
    <button onClick={() => onOpen(item)} className="flex items-center justify-between active:scale-[0.98] transition-transform" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}>
      <div className="flex items-center gap-3">
        <div style={{ width: 32, height: 32, borderRadius: RADIUS.sm, background: item.glyph ? colors.accentSoft : colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {item.glyph ? <PisteGlyph type={item.glyph} size={16} color={colors.accent} /> : <Icon size={16} color={colors.text} strokeWidth={1.7} />}
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>{item.label}</span>
      </div>
      <ChevronRight size={15} color={colors.textFaint} />
    </button>
  );
}
function ToggleRow({ label, value, onToggle }) {
  const { colors } = useTheme();
  return (
    <button onClick={onToggle} className="flex items-center justify-between" style={{ width: "100%", background: "none", border: "none", borderBottom: `1px solid ${colors.border}`, padding: "12px 2px", cursor: "pointer" }}>
      <span style={{ fontSize: 13, color: colors.text }}>{label}</span>
      <div style={{ width: 38, height: 22, borderRadius: 11, background: value ? colors.accent : colors.border, position: "relative", transition: "background 150ms", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 2, left: value ? 18 : 2, width: 18, height: 18, borderRadius: 9, background: "white", transition: "left 150ms" }} />
      </div>
    </button>
  );
}
function SavedList({ posts, savedIds, onUnsave }) {
  const { colors } = useTheme();
  const saved = posts.filter((p) => savedIds.includes(p.id));
  if (saved.length === 0) return <EmptyState title="Aucun enregistrement pour le moment" subtitle="Les publications que vous enregistrez apparaîtront ici." />;
  return (
    <div className="px-4 pt-3 flex flex-col gap-2">
      {saved.map((p) => (
        <div key={p.id} className="flex items-center justify-between" style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "12px 14px" }}>
          <div style={{ fontSize: 12.5, color: colors.text, flex: 1, marginRight: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.texte || "Publication"}</div>
          <button onClick={() => onUnsave(p.id)} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Retirer</button>
        </div>
      ))}
    </div>
  );
}
function ParametresScreen({ profile, setProfile, blockedAuthors, onUnblock, hiddenCount, reports, notifPrefs, setNotifPrefs, privacy, setPrivacy }) {
  const { colors } = useTheme();
  const [section, setSection] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const rows = [
    { key: "compte", label: "Compte" },
    { key: "confidentialite", label: "Confidentialité" },
    { key: "notifications", label: "Notifications" },
    { key: "securite", label: "Sécurité" },
    { key: "contenu", label: "Contenu" },
    { key: "donnees", label: "Données" },
  ];
  return (
    <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
      <div style={{ padding: "8px 18px" }}>
        {rows.map((r) => (
          <button key={r.key} onClick={() => setSection(r.key)} className="flex items-center justify-between" style={{ width: "100%", background: "none", border: "none", borderBottom: `1px solid ${colors.border}`, padding: "14px 2px", cursor: "pointer" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>{r.label}</span>
            <ChevronRight size={15} color={colors.textFaint} />
          </button>
        ))}
      </div>

      {section && (
        <div style={{ position: "absolute", inset: 0, background: colors.background, display: "flex", flexDirection: "column" }}>
          <ScreenHeader title={rows.find((r) => r.key === section).label} onBack={() => setSection(null)} />
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {section === "compte" && (
              <div className="flex flex-col gap-2">
                <button onClick={() => setEditing(true)} className="flex items-center justify-between" style={{ width: "100%", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "13px 14px", cursor: "pointer" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Nom, pseudo, photo, bio, localisation</span>
                  <ChevronRight size={14} color={colors.textFaint} />
                </button>
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "13px 14px" }}>
                  <div style={{ fontSize: 11.5, color: colors.textFaint, marginBottom: 3 }}>E-mail</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary }}>Modification disponible une fois l'authentification connectée.</div>
                </div>
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "13px 14px" }}>
                  <div style={{ fontSize: 11.5, color: colors.textFaint, marginBottom: 3 }}>Mot de passe</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary }}>Bientôt disponible</div>
                </div>
              </div>
            )}
            {section === "confidentialite" && (
              <div className="flex flex-col gap-5">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>COMPTE</div>
                  <div className="flex gap-2">{[["public", "Public"], ["prive", "Privé"]].map(([k, l]) => <Chip key={k} label={l} active={privacy.compte === k} onClick={() => setPrivacy({ ...privacy, compte: k })} />)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>QUI PEUT COMMENTER</div>
                  <div className="flex gap-2 flex-wrap">{[["tout_le_monde", "Tout le monde"], ["abonnes", "Abonnés"], ["personne", "Personne"]].map(([k, l]) => <Chip key={k} label={l} active={privacy.commentaires === k} onClick={() => setPrivacy({ ...privacy, commentaires: k })} />)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>QUI PEUT M'ENVOYER UN MESSAGE</div>
                  <div className="flex gap-2 flex-wrap">{[["tout_le_monde", "Tout le monde"], ["abonnes", "Abonnés"], ["personne", "Personne"]].map(([k, l]) => <Chip key={k} label={l} active={privacy.messages === k} onClick={() => setPrivacy({ ...privacy, messages: k })} />)}</div>
                </div>
              </div>
            )}
            {section === "notifications" && (
              <div>
                {[["likes", "Likes"], ["commentaires", "Commentaires"], ["abonnes", "Nouveaux abonnés"], ["publications", "Publications"], ["groupes", "Groupes"], ["messages", "Messages"], ["systeme", "Système"]].map(([k, l]) => (
                  <ToggleRow key={k} label={l} value={notifPrefs[k]} onToggle={() => setNotifPrefs({ ...notifPrefs, [k]: !notifPrefs[k] })} />
                ))}
              </div>
            )}
            {section === "securite" && (
              <div className="flex flex-col gap-2">
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "13px 14px", fontSize: 12.5, color: colors.textSecondary }}>Changement de mot de passe — bientôt disponible</div>
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "13px 14px", fontSize: 12.5, color: colors.textSecondary }}>Déconnexion de tous les appareils — bientôt disponible</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, margin: "14px 0 8px" }}>VOS SIGNALEMENTS</div>
                {reports.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: colors.textFaint }}>Aucun signalement envoyé.</div>
                ) : reports.map((r) => (
                  <div key={r.id} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "11px 14px" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.text }}>{r.reason}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{r.targetType} · {r.date}</div>
                  </div>
                ))}
              </div>
            )}
            {section === "contenu" && (
              <div className="flex flex-col gap-5">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>COMPTES BLOQUÉS</div>
                  {blockedAuthors.length === 0 ? (
                    <div style={{ fontSize: 12.5, color: colors.textFaint }}>Aucun compte bloqué.</div>
                  ) : blockedAuthors.map((nom) => (
                    <div key={nom} className="flex items-center justify-between" style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "11px 14px", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: colors.text }}>{nom}</span>
                      <button onClick={() => onUnblock(nom)} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Débloquer</button>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>CONTENUS MASQUÉS</div>
                  <div style={{ fontSize: 12.5, color: colors.textFaint }}>{hiddenCount} contenu{hiddenCount !== 1 ? "s" : ""} masqué{hiddenCount !== 1 ? "s" : ""}.</div>
                </div>
              </div>
            )}
            {section === "donnees" && (
              <div className="flex flex-col gap-2">
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "13px 14px", fontSize: 12.5, color: colors.textSecondary }}>Télécharger mes données — bientôt disponible</div>
                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)} style={{ background: colors.errorSoft, border: "none", borderRadius: RADIUS.sm, padding: "13px 14px", textAlign: "left", fontSize: 13, fontWeight: 600, color: colors.error, cursor: "pointer" }}>Supprimer mon compte</button>
                ) : (
                  <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: 14, fontSize: 12.5, color: colors.error, lineHeight: 1.5 }}>
                    La suppression réelle sera activée une fois le backend connecté. Cette action sera alors irréversible.
                    <div style={{ marginTop: 8 }}><button onClick={() => setDeleteConfirm(false)} style={{ background: "none", border: "none", color: colors.error, textDecoration: "underline", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Fermer</button></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {editing && (
        <div style={{ position: "absolute", inset: 0, zIndex: 70 }}>
          <ProfileEditor profile={profile} onClose={() => setEditing(false)} onSave={(p) => { setProfile(p); setEditing(false); }} />
        </div>
      )}
    </div>
  );
}
function AideScreen() {
  const { colors } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);
  const categories = ["Problème technique", "Compte", "Sécurité", "Modération", "Contenu", "Confidentialité", "Autre"];
  const submit = async () => {
    await api.submitHelpRequest({ category, subject, description }); // TODO: connect to backend
    setSent(true);
  };
  if (showForm) {
    if (sent) return <EmptyState title="Demande envoyée" subtitle="Merci — l'équipe PISTE reviendra vers vous dès que le support sera connecté à un vrai système de tickets." />;
    return (
      <div style={{ padding: "16px 20px" }}>
        <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginBottom: 14 }}>← Retour à l'aide</button>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>CATÉGORIE</div>
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>{categories.map((c) => <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />)}</div>
        <TextField label="Sujet" value={subject} onChange={setSubject} placeholder="Résumez votre demande" />
        <TextField label="Description" value={description} onChange={setDescription} placeholder="Décrivez votre problème en détail." textarea rows={5} />
        <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: -10, marginBottom: 16 }}>Pièce jointe — bientôt disponible</div>
        <Button disabled={!category || !subject || !description} onClick={submit}>Envoyer</Button>
      </div>
    );
  }
  return (
    <div style={{ padding: "16px 20px" }}>
      <Button variant="secondary" onClick={() => setShowForm(true)}>Contacter PISTE</Button>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, margin: "22px 0 8px" }}>QUESTIONS FRÉQUENTES</div>
      <div className="flex flex-col gap-2">
        {FAQ_ITEMS.map((f, i) => (
          <div key={i} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, overflow: "hidden" }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between" style={{ width: "100%", background: "none", border: "none", padding: "13px 14px", cursor: "pointer" }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.text, textAlign: "left" }}>{f.q}</span>
              <ChevronRight size={14} color={colors.textFaint} style={{ transform: openFaq === i ? "rotate(90deg)" : "none", transition: "transform 150ms", flexShrink: 0, marginLeft: 8 }} />
            </button>
            {openFaq === i && <div style={{ padding: "0 14px 13px", fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
function ReglementScreen() {
  const { colors } = useTheme();
  return (
    <div style={{ padding: "16px 20px 32px" }}>
      <div style={{ fontSize: 11.5, color: colors.textSecondary, background: colors.surfaceAlt, borderRadius: RADIUS.sm, padding: "10px 12px", marginBottom: 18, lineHeight: 1.5 }}>
        Base de travail — ce règlement devra être validé juridiquement avant tout lancement public.
      </div>
      {RULES_SECTIONS.map((s) => (
        <div key={s.title} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.text, marginBottom: 10 }}>{s.title}</div>
          <div className="flex flex-col gap-2">
            {s.items.map((it, i) => (
              <div key={i} className="flex items-start gap-2">
                <div style={{ width: 4, height: 4, borderRadius: 2, background: colors.accent, marginTop: 7, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.5 }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
function PlusPanel({ open, onClose, profile, setProfile, posts, savedPostIds, onToggleSave, blockedAuthors, onUnblockAuthor, hiddenPostIds, reports, notifPrefs, setNotifPrefs, privacy, setPrivacy, onLogout }) {
  const { colors, mode, setMode } = useTheme();
  const [sub, setSub] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  if (!open) return null;
  const close = () => { setSub(null); setConfirmLogout(false); onClose(); };
  const doLogout = async () => {
    setLoggingOut(true);
    await onLogout(); // Root() bascule automatiquement vers l'écran d'accueil dès que la session Supabase disparaît
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 55 }}>
      <div onClick={close} style={{ position: "absolute", inset: 0, background: colors.overlay, backdropFilter: "blur(2px)" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "80%", background: colors.background, boxShadow: "-8px 0 30px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>Menu</span>
          <IconButton icon={X} onClick={close} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, margin: "10px 0 4px" }}>FONCTIONNALITÉS</div>
          {FEATURE_ITEMS.map((it) => <PlusRow key={it.key} item={it} onOpen={setSub} />)}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, margin: "18px 0 4px" }}>APPLICATION</div>
          {APP_ITEMS.map((it) => <PlusRow key={it.key} item={it} onOpen={setSub} />)}
          <div style={{ marginTop: 24, borderTop: `1px solid ${colors.border}`, paddingTop: 14 }}>
            {!confirmLogout ? (
              <button onClick={() => setConfirmLogout(true)} className="flex items-center gap-3" style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 2px" }}>
                <LogOut size={17} color={colors.error} strokeWidth={1.8} /><span style={{ fontSize: 13.5, fontWeight: 600, color: colors.error }}>Déconnexion</span>
              </button>
            ) : (
              <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: 12, fontSize: 12.5, color: colors.error }}>
                Voulez-vous vraiment vous déconnecter ?
                <div className="flex gap-3" style={{ marginTop: 8 }}>
                  <button onClick={doLogout} disabled={loggingOut} style={{ background: "none", border: "none", color: colors.error, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{loggingOut ? "..." : "Se déconnecter"}</button>
                  <button onClick={() => setConfirmLogout(false)} style={{ background: "none", border: "none", color: colors.error, textDecoration: "underline", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {sub && (
        <div style={{ position: "absolute", inset: 0, zIndex: 56, background: colors.background, display: "flex", flexDirection: "column" }}>
          <ScreenHeader title={sub.label} onBack={() => setSub(null)} />
          {sub.appearance ? (
            <div style={{ padding: 20 }}>
              <div className="flex flex-col gap-2">
                {[["light", "Clair", Sun], ["dark", "Sombre", Moon], ["system", "Système", Monitor]].map(([m, l, Icon]) => (
                  <button key={m} onClick={() => setMode(m)} className="flex items-center justify-between" style={{ border: `1.5px solid ${mode === m ? colors.accent : colors.border}`, background: mode === m ? colors.accentSoft : colors.surface, borderRadius: RADIUS.sm, padding: "12px 14px", cursor: "pointer" }}>
                    <div className="flex items-center gap-2.5"><Icon size={16} color={mode === m ? colors.accent : colors.text} /><span style={{ fontSize: 13.5, fontWeight: 600, color: mode === m ? colors.accent : colors.text }}>{l}</span></div>
                    {mode === m && <Check size={16} color={colors.accent} />}
                  </button>
                ))}
              </div>
            </div>
          ) : sub.key === "enregistrements" ? (
            <SavedList posts={posts} savedIds={savedPostIds} onUnsave={onToggleSave} />
          ) : sub.key === "parametres" ? (
            <ParametresScreen profile={profile} setProfile={setProfile} blockedAuthors={blockedAuthors} onUnblock={onUnblockAuthor} hiddenCount={hiddenPostIds.length} reports={reports} notifPrefs={notifPrefs} setNotifPrefs={setNotifPrefs} privacy={privacy} setPrivacy={setPrivacy} />
          ) : sub.key === "aide" ? (
            <AideScreen />
          ) : sub.key === "reglement" ? (
            <ReglementScreen />
          ) : (
            <ComingSoon title="Bientôt disponible" subtitle={sub.desc} />
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   12. APP PRINCIPALE
   ============================================================ */
function MainApp({ session, onboardingData, ageInfo }) {
  const { colors } = useTheme();
  const [active, setActive] = useState("fil");
  const [notif, setNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState(0);
  const [pendingConversationId, setPendingConversationId] = useState(null);
  // Écran de profil public — ouvert depuis n'importe où (post, notif, message) par username.
  const [openProfileUsername, setOpenProfileUsername] = useState(null);
  const [plusOpen, setPlusOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createGroupId, setCreateGroupId] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(!session); // true immédiatement si pas de session réelle (ancien flux onboarding local)

  // État en session uniquement au départ — écrasé par le vrai profil Supabase juste après
  // (voir useEffect ci-dessous) si `session` existe.
  const [profile, setProfile] = useState(() => ({
    id: null,
    nom: "",
    username: onboardingData?.pseudo || "",
    avatar: null,
    imageCouverture: null,
    bio: "",
    localisation: onboardingData?.departement || "",
    interets: onboardingData?.interests || [],
    badges: [],
    age: ageInfo?.age ?? null,
    estMineur: ageInfo?.estMineur ?? false,
    verificationStatus: { verified: false, type: null, source: null, verifiedAt: null, active: false },
    statistiques: { abonnes: 0, abonnements: 0 },
  }));

  // Récupère le vrai profil depuis Supabase quand une session réelle existe
  // (connexion, ou retour après actualisation de la page).
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (cancelled) return;
      if (!error && data) {
        // `profiles` n'a pas de colonne "est_mineur" en base (seulement une fonction SQL
        // du même nom, non sélectionnée par select("*")) — on recalcule donc le statut
        // mineur ici à partir de la date de naissance, comme le fait déjà StepAccess.
        const age = data.date_naissance ? computeAge(new Date(data.date_naissance).getDate(), new Date(data.date_naissance).getMonth() + 1, new Date(data.date_naissance).getFullYear()) : null;
        setProfile((p) => ({
          ...p,
          id: data.id,
          nom: data.nom || "",
          username: data.username || "",
          avatar: data.avatar_url || null,
          imageCouverture: data.banniere_url || null,
          bio: data.bio || "",
          localisation: data.departement || "",
          interets: p.interets,
          badges: data.badges || [],
          age,
          estMineur: age !== null && age <= MODERATION_AGE_RULES.minor.maxAge,
          verificationStatus: data.verification_status || p.verificationStatus,
          role: data.role || "user",
        }));
      }
      setProfileLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [session]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch (e) { /* Root() détecte quand même la perte de session via onAuthStateChange */ }
  };

  const [dogs, setDogs] = useState([]);
  // Groupes prédéfinis PISTE : vraies catégories de la communauté, 0 membre tant que
  // personne n'a réellement rejoint (le compteur ne reflète que de vraies actions).
  const [groups, setGroups] = useState([]);
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [editingPost, setEditingPost] = useState(null);

  // --- Interactions sociales & modération ---
  // likedIds/savedPostIds/posts/videos sont hydratés depuis Supabase ci-dessous dès
  // qu'une session existe ; le reste (blocages, signalements, préférences) reste en
  // session locale pour l'instant — pas encore branché.
  const [likedIds, setLikedIds] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [repostedIds, setRepostedIds] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [following, setFollowing] = useState([]);
  const [bellUsernames, setBellUsernames] = useState([]);
  const [blockedAuthors, setBlockedAuthors] = useState([]);
  const [hiddenPostIds, setHiddenPostIds] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState({ likes: true, commentaires: true, abonnes: true, publications: true, groupes: true, messages: true, systeme: true });
  const [privacy, setPrivacy] = useState({ compte: "public", commentaires: "tout_le_monde", messages: "tout_le_monde" });
  const [toast, setToast] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const showToast = (msg) => { setToast(msg); window.clearTimeout(showToast._t); showToast._t = window.setTimeout(() => setToast(null), 2200); };

  // Chargement initial des vraies publications + de mes likes/enregistrements,
  // une fois qu'on sait qui est connecté (voir profileLoaded plus haut).
  const refreshPosts = async () => {
    const rows = await postService.fetchCandidatePosts();
    const mapped = rows.map(mapPostRow);
    setPosts(mapped.filter((p) => p.type === "publication" || p.type === "photo" || p.type === "discussion" || p.type === "sondage"));
    setVideos(mapped.filter((p) => p.type === "video" || p.type === "video_courte"));
  };
  useEffect(() => {
    if (!session || !profileLoaded) return;
    refreshPosts().catch(() => showToast("Impossible de charger le fil pour le moment."));
    postService.fetchMyLikes().then(setLikedIds).catch(() => {});
    postService.fetchMySaves().then(setSavedPostIds).catch(() => {});
    postService.fetchMyReposts().then(setRepostedIds).catch(() => {});
    dogService.fetchMyDogs().then(setDogs).catch(() => {});
    groupService.fetchGroups().then(setGroups).catch(() => showToast("Impossible de charger les groupes pour le moment."));
    socialService.fetchMyFollowing().then(setFollowing).catch(() => {});
    socialService.fetchMyBellUsernames().then(setBellUsernames).catch(() => {});
    socialService.fetchMyBlocks().then(setBlockedAuthors).catch(() => {});
  }, [session, profileLoaded]);

  useEffect(() => {
    if (!session || !profileLoaded) return;
    notificationService.fetchUnreadCount().then(setUnreadCount).catch(() => {});
    const unsubscribe = notificationService.subscribeToNotifications(session.user.id, () => {
      setUnreadCount((c) => c + 1);
    });
    return unsubscribe;
  }, [session, profileLoaded]);

  const refreshUnreadConversations = () => {
    messageService.fetchUnreadConversationCount().then(setUnreadConversations).catch(() => {});
  };
  useEffect(() => {
    if (!session || !profileLoaded) return;
    refreshUnreadConversations();
    // Un nouveau message n'importe où peut changer le nombre de conversations
    // non lues (une conversation déjà lue redevient non lue) — on recalcule
    // plutôt que d'incrémenter, pour ne jamais compter 2 messages d'une même
    // conversation comme 2 conversations non lues.
    const unsubscribe = messageService.subscribeToMyMessages(() => refreshUnreadConversations());
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profileLoaded]);

  const handlePublished = (type, item) => {
    if (!item) return;
    if (type === "video" || type === "video_courte") setVideos((v) => [{ ...item, titre: item.texte || "Sans titre" }, ...v]);
    else setPosts((p) => [item, ...p]);
    showToast("Publication publiée.");
  };
  const handleEdited = (updated) => {
    setPosts((p) => (p.some((x) => x.id === updated.id) ? p.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)) : p));
    setVideos((v) => (v.some((x) => x.id === updated.id) ? v.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)) : v));
    setEditingPost(null);
    showToast("Modifications enregistrées.");
  };

  const toggleJoinGroup = async (groupId) => {
    const current = groups.find((g) => g.id === groupId);
    if (!current) return;
    try {
      if (current.joined) await groupService.leaveGroup(groupId);
      else await groupService.joinGroup(groupId);
    } catch (e) {
      showToast("Action impossible pour le moment.");
      return;
    }
    setGroups((gs) => gs.map((g) => (g.id !== groupId ? g : { ...g, joined: !g.joined, nombreMembres: (g.nombreMembres ?? 0) + (g.joined ? -1 : 1) })));
    showToast(current.joined ? "Vous avez quitté le groupe." : "Groupe rejoint.");
  };

  const bumpLikes = (id, delta) => {
    const apply = (arr) => arr.map((it) => (it.id === id ? { ...it, likes: Math.max(0, (it.likes || 0) + delta) } : it));
    setPosts(apply);
    setVideos(apply);
  };
  // Les publications "discussion"/"sondage" n'ont pas encore de table dédiée en base
  // (voir ComposeScreen) — elles gardent un id local, reconnaissable à ce préfixe,
  // et restent donc en interaction purement locale tant qu'elles ne sont pas
  // réellement persistées.
  const isLocalId = (id) => typeof id === "string" && id.startsWith("local-");
  // Recharge les vrais commentaires d'une publication depuis Supabase au moment où
  // on ouvre la feuille de commentaires — sans ça, les commentaires d'une session
  // précédente resteraient invisibles (commentsByPost part vide à chaque chargement).
  const loadComments = async (postId) => {
    if (isLocalId(postId)) return;
    try {
      const rows = await postService.fetchComments(postId);
      const mapped = rows.map((r) => ({
        id: r.id,
        auteur: r.profiles?.nom || r.profiles?.username || "Utilisateur",
        texte: r.texte,
        date: formatRelativeDate(r.created_at),
        parentId: r.parent_id,
      }));
      setCommentsByPost((m) => ({ ...m, [postId]: mapped }));
    } catch (e) { /* pas bloquant : la feuille s'ouvrira simplement vide */ }
  };
  const toggleLike = async (id) => {
    const isLiked = likedIds.includes(id);
    if (!isLocalId(id)) await postService.toggleLike(id, !isLiked);
    setLikedIds((l) => (isLiked ? l.filter((x) => x !== id) : [...l, id]));
    bumpLikes(id, isLiked ? -1 : 1);
  };
  const toggleSave = async (id) => {
    const isSaved = savedPostIds.includes(id);
    if (!isLocalId(id)) await postService.toggleSave(id, !isSaved);
    setSavedPostIds((s) => (isSaved ? s.filter((x) => x !== id) : [...s, id]));
    showToast(isSaved ? "Retiré des enregistrements." : "Enregistré.");
  };
  const toggleRepost = async (id) => {
    if (isLocalId(id)) { showToast("Ce contenu ne peut pas encore être reposté."); return; }
    const isReposted = repostedIds.includes(id);
    try {
      await postService.toggleRepost(id, !isReposted);
    } catch (e) {
      showToast("Action impossible pour le moment.");
      return;
    }
    setRepostedIds((r) => (isReposted ? r.filter((x) => x !== id) : [...r, id]));
    bumpReposts(id, isReposted ? -1 : 1);
    showToast(isReposted ? "Repost annulé." : "Publication repostée.");
  };
  const bumpReposts = (id, delta) => {
    const apply = (arr) => arr.map((it) => (it.id === id ? { ...it, reposts: Math.max(0, (it.reposts || 0) + delta) } : it));
    setPosts(apply);
    setVideos(apply);
  };
  const addComment = async (id, texte, parentId) => {
    let comment;
    if (isLocalId(id)) {
      comment = { id: `local-${Date.now()}`, auteur: profile.nom || profile.username || "Vous", texte, date: "à l'instant", parentId: parentId || null };
    } else {
      const c = await postService.addComment(id, texte, parentId);
      comment = { id: c.id, auteur: profile.nom || profile.username || "Vous", texte, date: "à l'instant", parentId: parentId || null };
    }
    setCommentsByPost((m) => ({ ...m, [id]: [...(m[id] || []), comment] }));
    bumpComments(id, 1);
  };
  const bumpComments = (id, delta) => {
    const apply = (arr) => arr.map((it) => (it.id === id ? { ...it, commentaires: Math.max(0, (it.commentaires || 0) + delta) } : it));
    setPosts(apply);
    setVideos(apply);
  };
  const deleteContent = async (id) => {
    if (!isLocalId(id)) await postService.deletePost(id);
    setPosts((p) => p.filter((x) => x.id !== id));
    setVideos((v) => v.filter((x) => x.id !== id));
    setLikedIds((l) => l.filter((x) => x !== id));
    setSavedPostIds((s) => s.filter((x) => x !== id));
    setCommentsByPost((m) => { const { [id]: _, ...rest } = m; return rest; });
    showToast("Publication supprimée.");
  };
  const reportContent = async (report) => {
    try {
      const saved = await socialService.reportContent(report);
      setReports((r) => [{ ...saved, date: "à l'instant" }, ...r]);
      showToast("Signalement envoyé.");
    } catch (e) {
      showToast("Impossible d'envoyer le signalement pour le moment.");
    }
  };
  // `username` (unique, colonne "profiles") — jamais `nom` (nom d'affichage,
  // modifiable et non garanti unique) : voir socialService.js.
  const blockAuthor = async (username) => {
    if (!username) return;
    try {
      await socialService.blockUser(username);
      setBlockedAuthors((b) => (b.includes(username) ? b : [...b, username]));
      showToast(`${username} a été bloqué.`);
    } catch (e) {
      showToast("Impossible de bloquer cet utilisateur pour le moment.");
    }
  };
  const unblockAuthor = async (username) => {
    try {
      await socialService.unblockUser(username);
    } catch (e) { /* le retirer localement quand même : au pire il sera re-listé au refresh */ }
    setBlockedAuthors((b) => b.filter((x) => x !== username));
  };
  const hidePost = (id) => { setHiddenPostIds((h) => [...h, id]); showToast("Contenu masqué."); };
  const toggleFollow = async (username) => {
    if (!username) return;
    const isFollowing = following.includes(username);
    try {
      await (isFollowing ? socialService.unfollowUser(username) : socialService.followUser(username));
    } catch (e) {
      showToast("Action impossible pour le moment.");
      return;
    }
    setFollowing((f) => (isFollowing ? f.filter((x) => x !== username) : [...f, username]));
    showToast(isFollowing ? `Vous ne suivez plus ${username}.` : `Vous suivez ${username}.`);
  };
  const toggleBell = async (username) => {
    if (!username) return;
    const isOn = bellUsernames.includes(username);
    try {
      await socialService.setFollowNotifications(username, !isOn);
    } catch (e) {
      showToast("Action impossible pour le moment.");
      return;
    }
    setBellUsernames((b) => (isOn ? b.filter((x) => x !== username) : [...b, username]));
    if (!isOn && !following.includes(username)) setFollowing((f) => [...f, username]); // la cloche abonne aussi
    showToast(isOn ? "Notifications désactivées." : "Vous serez notifié de ses publications.");
  };

  const visiblePosts = posts.filter((p) => !hiddenPostIds.includes(p.id) && !blockedAuthors.includes(p.username));
  const visibleVideos = videos.filter((v) => !hiddenPostIds.includes(v.id) && !blockedAuthors.includes(v.username));

  const screens = {
    fil: (
      <ScreenFil
        posts={visiblePosts}
        profile={profile}
        liked={likedIds}
        saved={savedPostIds}
        reposted={repostedIds}
        commentsByPost={commentsByPost}
        following={following}
        myGroupIds={groups.filter((g) => g.joined).map((g) => g.id)}
        bellUsernames={bellUsernames}
        onToggleFollow={toggleFollow}
        onToggleBell={toggleBell}
        onOpenProfile={setOpenProfileUsername}
        onLike={toggleLike}
        onSave={toggleSave}
        onRepost={toggleRepost}
        onAddComment={addComment}
        onDelete={deleteContent}
        onEditRequest={setEditingPost}
        onReport={reportContent}
        onHide={hidePost}
        onBlock={blockAuthor}
        onLoadComments={loadComments}
      />
    ),
    video: (
      <ScreenVideo
        videos={visibleVideos}
        profile={profile}
        liked={likedIds}
        commentsByPost={commentsByPost}
        following={following}
        bellUsernames={bellUsernames}
        onToggleFollow={toggleFollow}
        onToggleBell={toggleBell}
        onOpenProfile={setOpenProfileUsername}
        onLike={toggleLike}
        onAddComment={addComment}
        onDelete={deleteContent}
        onEditRequest={setEditingPost}
        onReport={reportContent}
        onHide={hidePost}
        onBlock={blockAuthor}
        onLoadComments={loadComments}
        onOpenPlayer={setPlayingVideo}
      />
    ),
    groupes: (
      <ScreenGroupes
        groups={groups}
        addGroup={(g) => setGroups((gs) => [{ ...g, joined: true }, ...gs])}
        onToggleJoin={toggleJoinGroup}
        onCreatePost={(groupId) => { setCreateGroupId(groupId || null); setCreateOpen(true); }}
        onGroupUpdated={(g) => setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, ...g } : x)))}
        onOpenProfile={setOpenProfileUsername}
        profile={profile}
        liked={likedIds}
        saved={savedPostIds}
        reposted={repostedIds}
        commentsByPost={commentsByPost}
        onLike={toggleLike}
        onSave={toggleSave}
        onRepost={toggleRepost}
        onAddComment={addComment}
        onDelete={deleteContent}
        onEditRequest={setEditingPost}
        onReport={reportContent}
        onHide={hidePost}
        onBlock={blockAuthor}
        onLoadComments={loadComments}
      />
    ),
    messages: <ScreenMessages meId={session?.user?.id} initialConversationId={pendingConversationId} onConsumeInitialConversation={() => setPendingConversationId(null)} onOpenProfile={setOpenProfileUsername} onRead={refreshUnreadConversations} />,
    profil: (
      <ScreenProfil
        profile={profile}
        setProfile={setProfile}
        dogs={dogs}
        addDog={(d) => setDogs((ds) => [d, ...ds])}
        posts={posts.filter((p) => p.username === profile.username)}
        videos={videos.filter((v) => v.username === profile.username)}
        onOpenPlayer={setPlayingVideo}
        onOpenProfile={setOpenProfileUsername}
        liked={likedIds}
        saved={savedPostIds}
        reposted={repostedIds}
        onRepost={toggleRepost}
        commentsByPost={commentsByPost}
        onLike={toggleLike}
        onSave={toggleSave}
        onAddComment={addComment}
        onDelete={deleteContent}
        onEditRequest={setEditingPost}
        onReport={reportContent}
        onHide={hidePost}
        onBlock={blockAuthor}
        onLoadComments={loadComments}
      />
    ),
  };

  if (!profileLoaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.background }}>
        <div style={{ fontSize: 13, color: colors.textSecondary }}>Chargement de votre profil...</div>
      </div>
    );
  }

  return (
    <AppShell header={<Header onBell={() => setNotif(true)} onMenu={() => setPlusOpen(true)} unreadCount={unreadCount} />} active={active} setActive={setActive} onCreate={() => setCreateOpen(true)} unreadConversations={unreadConversations}>
      {screens[active]}
      {notif && (
        <NotificationsPanel
          onClose={() => setNotif(false)}
          onUnreadChange={setUnreadCount}
          onOpenConversation={(conversationId) => { setPendingConversationId(conversationId); setActive("messages"); }}
          onOpenAuthor={setOpenProfileUsername}
          onGoToFeed={() => setActive("fil")}
        />
      )}
      {openProfileUsername && (
        <AuthorProfileSheet
          username={openProfileUsername}
          meUsername={profile.username}
          isFollowing={following.includes(openProfileUsername)}
          bellOn={bellUsernames.includes(openProfileUsername)}
          onClose={() => setOpenProfileUsername(null)}
          onToggleFollow={() => toggleFollow(openProfileUsername)}
          onToggleBell={() => toggleBell(openProfileUsername)}
          onMessage={async (userId) => {
            try {
              const conversationId = await messageService.startDirectConversation(userId);
              setOpenProfileUsername(null);
              setPendingConversationId(conversationId);
              setActive("messages");
            } catch (e) {
              showToast("Impossible de démarrer la conversation.");
            }
          }}
          liked={likedIds}
          saved={savedPostIds}
          reposted={repostedIds}
          commentsByPost={commentsByPost}
          onLike={toggleLike}
          onSave={toggleSave}
          onRepost={toggleRepost}
          onAddComment={addComment}
          onDelete={deleteContent}
          onEditRequest={setEditingPost}
          onReport={reportContent}
          onHide={hidePost}
          onBlock={blockAuthor}
          onLoadComments={loadComments}
        />
      )}
      <CreateFlow
        open={createOpen || !!editingPost}
        onClose={() => { setCreateOpen(false); setCreateGroupId(null); setEditingPost(null); }}
        dogs={dogs}
        authorName={profile.nom || "Vous"}
        onPublished={handlePublished}
        editingPost={editingPost}
        onEdited={handleEdited}
        groupId={createGroupId}
      />
      <PlusPanel
        open={plusOpen}
        onClose={() => setPlusOpen(false)}
        profile={profile}
        setProfile={setProfile}
        posts={posts}
        savedPostIds={savedPostIds}
        onToggleSave={toggleSave}
        blockedAuthors={blockedAuthors}
        onUnblockAuthor={unblockAuthor}
        hiddenPostIds={hiddenPostIds}
        reports={reports}
        notifPrefs={notifPrefs}
        setNotifPrefs={setNotifPrefs}
        privacy={privacy}
        setPrivacy={setPrivacy}
        onLogout={handleLogout}
      />
      <Toast message={toast} />
      <FullScreenVideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
    </AppShell>
  );
}

function Root() {
  const { colors } = useTheme();
  const [stage, setStage] = useState("splash");
  const [data, setData] = useState({ pseudo: "", email: "", password: "", day: "", month: "", year: "", region: "", departement: "", interests: [], profiles: [] });
  const [ageInfo, setAgeInfo] = useState({ age: null, estMineur: false });
  // undefined = vérification en cours, null = pas de session, objet = connecté.
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    // Vérifie une seule fois au chargement si une session Supabase existe déjà
    // (ex: rafraîchissement de page) — c'est ce qui garantit "rester connecté".
    authService.getSession().then(setSession).catch(() => setSession(null));
    // Puis reste à l'écoute de tout changement (connexion, déconnexion, refresh de token).
    const unsubscribe = authService.onAuthStateChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  const flow = {
    splash: <StepSplash onStart={() => setStage("signup")} onLogin={() => setStage("login")} />,
    signup: <StepSignup data={data} setData={setData} onNext={() => setStage("birthdate")} onBack={() => setStage("splash")} onLogin={() => setStage("login")} />,
    birthdate: <StepBirthdate data={data} setData={setData} onNext={() => setStage("region")} onBack={() => setStage("signup")} />,
    region: <StepRegion data={data} setData={setData} onNext={() => setStage("interests")} onBack={() => setStage("birthdate")} />,
    interests: <StepInterests data={data} setData={setData} onNext={() => setStage("whoyouare")} onBack={() => setStage("region")} />,
    whoyouare: <StepWhoYouAre data={data} setData={setData} onNext={() => setStage("access")} onBack={() => setStage("interests")} />,
    access: <StepAccess data={data} onFinish={(info) => { setAgeInfo(info); setStage("app"); }} onBack={() => setStage("whoyouare")} />,
    login: <LoginScreen onBack={() => setStage("splash")} onSignup={() => setStage("signup")} />,
  };

  // 1. Encore en train de vérifier s'il existe déjà une session (au tout premier rendu).
  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: colors.background, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ fontSize: 13, color: colors.textSecondary }}>Chargement...</div>
      </div>
    );
  }

  // 2. Session réelle et confirmée (connexion ou retour après actualisation) → accès direct.
  if (session) {
    return <MainApp session={session} onboardingData={data} ageInfo={ageInfo} />;
  }

  // 3. Fin de l'onboarding sans confirmation e-mail requise (rare, selon config Supabase)
  //    → on entre quand même, mais sans session réelle tant que l'utilisateur ne se sera
  //    pas connecté explicitement une première fois.
  if (stage === "app") return <MainApp session={null} onboardingData={data} ageInfo={ageInfo} />;

  return (
    <div style={{ minHeight: "100vh", background: colors.background, display: "flex", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100vh" }}>{flow[stage]}</div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <div style={{ fontFamily: FONT }}>
        <Root />
      </div>
    </ThemeProvider>
  );
}
