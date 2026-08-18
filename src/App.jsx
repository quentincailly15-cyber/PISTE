import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from "react";
import {
  Home, Plus, Users, User, Search, Bell, MessageCircle, ArrowLeft, X, Menu,
  Image as ImageIcon, Type as TypeIcon, CalendarDays, Settings, ChevronRight,
  Check, Video, Film, Dog, Repeat2, MapPin,
  Bookmark, HelpCircle, AlertTriangle, LogOut, Moon, Sun, Monitor, BarChart3,
  Heart, MessageSquare, Share2, MoreHorizontal, Camera, Play, BookOpen, Mic,
  Volume2, VolumeX, Trash2, Footprints, Pause, Eye, Lock, Clock, Cloud, Target,
  RotateCw, Smartphone, AtSign,
} from "lucide-react";
import * as authService from "./services/authService.js";
import * as traceService from "./services/traceService.js";
import * as huntingLogService from "./services/huntingLogService.js";
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
    background: "#EBEDDF",
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
    navBg: "rgba(255,255,255,0.55)",
    headerBg: "rgba(250,250,248,0.55)",
  },
  dark: {
    background: "#0D0F08",
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
    navBg: "rgba(24,24,24,0.55)",
    headerBg: "rgba(21,21,21,0.55)",
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
    primary: { background: disabled ? colors.border : colors.accent, color: disabled ? colors.textFaint : colors.onAccent, border: "none", boxShadow: disabled ? "none" : `0 3px 12px ${colors.accent}40` },
    secondary: { background: colors.surfaceAlt, color: colors.text, border: "none" },
    ghost: { background: "transparent", color: colors.accent, border: "none" },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} className="transition-transform active:scale-[0.98]" style={{ width: full ? "100%" : "auto", borderRadius: RADIUS.pill, padding: "14px 22px", fontSize: 14.5, fontWeight: 700, cursor: disabled ? "default" : "pointer", ...styles }}>
      {children}
    </button>
  );
}
function IconButton({ icon: Icon, onClick, size = 36, active }) {
  const { colors } = useTheme();
  return (
    <button
      onClick={onClick}
      className="active:scale-90 transition-transform"
      style={{
        width: size,
        height: size,
        borderRadius: RADIUS.pill,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? colors.accentSoft : colors.surfaceAlt,
        border: "none",
        cursor: "pointer",
        transition: "background 150ms ease",
      }}
    >
      <Icon size={18} color={active ? colors.accent : colors.textSecondary} strokeWidth={2} />
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
  const style = { width: "100%", border: `1.5px solid ${error ? colors.error : "transparent"}`, background: colors.surfaceAlt, borderRadius: textarea ? RADIUS.lg : RADIUS.pill, padding: textarea ? "13px 16px" : "13px 18px", fontSize: 14, color: colors.text, outline: "none", boxSizing: "border-box", fontFamily: FONT, boxShadow: error ? "none" : "inset 0 1px 3px rgba(0,0,0,0.04)", transition: "border-color 150ms ease" };
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
// Conteneur en pilule englobant tous les segments (plutôt que des boutons
// isolés) — même langage visuel que les onglets flottants d'Instants,
// décliné avec les couleurs du thème pour rester lisible sur fond normal.
function SegmentedControl({ options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <div className="flex" style={{ background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: RADIUS.pill, padding: 3, gap: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            flex: 1,
            border: "none",
            background: value === o.key ? colors.surface : "transparent",
            color: value === o.key ? colors.text : colors.textFaint,
            borderRadius: RADIUS.pill,
            padding: "7px 13px",
            fontSize: 12.5,
            fontWeight: value === o.key ? 700 : 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: value === o.key ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "background 150ms ease, box-shadow 150ms ease",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
// Balayage depuis le bord gauche de l'écran pour revenir en arrière — pas un
// simple raccourci "comme si on appuyait sur la flèche", un vrai effet de
// glisse : l'écran suit le doigt en direct (transform posé à même le DOM,
// sans passer par un re-render React à chaque pixel, pour rester fluide),
// s'arrondit et projette une ombre pendant le geste, façon liquide. Au
// relâchement : au-delà du seuil, l'écran termine sa glissée puis se ferme ;
// en-deçà, il revient élastiquement à sa place. Écoute le DOM directement
// (une seule fois, jamais réabonnée) plutôt que les événements React
// synthétiques, pour ne rater aucune frame du geste.
function useSwipeBack(onBack) {
  const ref = useRef(null);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = null;
    let startY = null;
    const onStart = (e) => {
      if (!onBackRef.current) return;
      const t = e.touches[0];
      if (t.clientX < 24) { startX = t.clientX; startY = t.clientY; } else { startX = null; }
    };
    const onMove = (e) => {
      if (startX === null) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > 60) { startX = null; el.style.transform = ""; return; }
      if (dx > 0) {
        el.style.transition = "none";
        el.style.transform = `translateX(${dx}px)`;
        el.style.borderTopLeftRadius = `${RADIUS.xl}px`;
        el.style.borderBottomLeftRadius = `${RADIUS.xl}px`;
        el.style.boxShadow = "-10px 0 34px rgba(0,0,0,0.22)";
      }
    };
    const onEnd = (e) => {
      if (startX === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      startX = null;
      el.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 280ms ease, box-shadow 280ms ease";
      if (dx > 90 && onBackRef.current) {
        el.style.transform = "translateX(100%)";
        window.setTimeout(() => onBackRef.current && onBackRef.current(), 220);
      } else {
        el.style.transform = "";
        el.style.borderTopLeftRadius = "";
        el.style.borderBottomLeftRadius = "";
        el.style.boxShadow = "";
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, []);
  return ref;
}
function ScreenHeader({ title, onBack, onCloseX, rightAction, chromeMode = "full" }) {
  const { colors } = useTheme();
  const floating = chromeMode !== "hidden"; // toujours pilule flottante, sauf masqué au défilement
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{
        position: "sticky",
        // env(safe-area-inset-top) : encoche/île dynamique en PWA plein écran
        // sur iPhone (voir viewport-fit=cover, index.html) — vaut 0px partout
        // ailleurs (navigateur classique, Android), donc sans effet là-bas.
        top: floating ? "calc(8px + env(safe-area-inset-top, 0px))" : "env(safe-area-inset-top, 0px)",
        zIndex: 10,
        background: colors.headerBg,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: floating ? "none" : `1px solid ${colors.border}`,
        margin: floating ? "0 8px" : 0,
        borderRadius: floating ? RADIUS.pill : 0,
        boxShadow: floating ? "0 4px 20px rgba(0,0,0,0.18)" : "none",
        transform: chromeMode === "hidden" ? "translateY(-130%)" : "translateY(0)",
        transition: "transform 260ms ease, top 260ms ease, margin 260ms ease, border-radius 260ms ease, box-shadow 260ms ease",
      }}
    >
      <div className="flex items-center gap-3">
        {onBack && <IconButton icon={ArrowLeft} onClick={onBack} />}
        <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{title}</span>
      </div>
      {rightAction || (onCloseX && <IconButton icon={X} onClick={onCloseX} />)}
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
const INTERESTS = ["Grand gibier", "Petit gibier", "Gibier d'eau", "Battue", "Chasse à courre", "Approche", "Affût", "Piégeage", "Vénerie sous terre", "Chien d'arrêt", "Chiens courants", "Cuisine du gibier", "Matériel", "Photographie", "Nature / observation"];
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
// Fil purement chronologique (le plus récent en premier, sans pondération
// affinité/interaction/qualité) — utilisé par l'onglet "Nouveautés" de
// Vidéo - Vidéo : une nouvelle vidéo doit toujours prendre la première place
// dès sa publication, jamais être devancée par une vidéo plus ancienne mais
// mieux notée par l'algorithme (contrairement au Fil "Pour toi").
function buildChronologicalFeed(posts, ctx) {
  const candidates = getCandidatePosts(posts);
  const safe = filterSafety(candidates, ctx.blockedAuthors || [], ctx.hiddenPostIds || []);
  const ageOk = filterAge(safe, !!ctx.viewerIsMinor);
  return [...ageOk].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
function formatVideoDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function mapPostRow(row) {
  return {
    id: row.id,
    nom: row.profiles?.nom || row.profiles?.username || "Utilisateur",
    username: row.profiles?.username || null,
    avatar: row.profiles?.avatar_url || null,
    texte: row.texte,
    image: row.post_media?.[0]?.type === "video" ? row.post_media?.[0]?.thumbnail_url || null : row.post_media?.[0]?.url || null,
    videoUrl: row.post_media?.[0]?.type === "video" ? row.post_media[0].url : null,
    duree: formatVideoDuration(row.post_media?.[0]?.duration_seconds),
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
    titre: row.titre || row.texte || null,
  };
}
const ANIMALS = ["Chevreuil", "Sanglier", "Cerf", "Lièvre", "Faisan", "Canard", "Autre", "Aucun"];
const PRACTICE_TYPES = ["Approche", "Affût", "Battue", "Chasse au chien", "Gibier d'eau", "Petit gibier", "Grand gibier", "Piégeage", "Vénerie sous terre", "Observation", "Préparation", "Matériel", "Autre"];
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
// Base de travail pour la modération et pour les utilisateurs — distingue
// explicitement une pratique de chasse légale (autorisée) d'une pratique
// illégale ou de sa promotion (interdite), et résume les droits RGPD
// (accès, rectification, effacement, portabilité, minimisation, consentement,
// suppression de compte) en attendant une politique de confidentialité dédiée.
// À valider juridiquement avant tout lancement public.
const RULES_SECTIONS = [
  {
    title: "Les principes de PISTE",
    items: [
      "Respect — des personnes, des animaux, de la nature et des territoires.",
      "Transmission — partager ses connaissances et son expérience pour permettre aux autres d'apprendre.",
      "Responsabilité — promouvoir une pratique légale, sécurisée et responsable.",
      "Authenticité — partager des expériences réelles sans tromper volontairement la communauté.",
      "Communauté — échanger entre passionnés sans harcèlement, intimidation ou provocation.",
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
    title: "Contenus pédagogiques autorisés",
    items: [
      "PISTE encourage les contenus qui font apprendre : préparation et dépeçage du gibier, cuisine, entretien du matériel, identification des espèces, traces et indices, sécurité, réglementation, conduite d'un chien de chasse.",
      "Le contexte et l'objectif comptent : « voici comment faire correctement » est autorisé — une mise en scène uniquement destinée à choquer ne l'est pas.",
    ],
  },
  {
    title: "Contenus strictement interdits",
    items: [
      "Braconnage, chasse d'espèces protégées ou interdites, ou toute incitation à ces pratiques",
      "Conseils destinés à contourner volontairement la réglementation ou les contrôles",
      "Organisation, financement ou facilitation d'une activité de chasse illégale",
      "Vente illégale d'armes, de munitions ou de produits réglementés",
      "Menaces, harcèlement, intimidation ou doxxing",
      "Violence gratuite ou contenu extrêmement gore sans intérêt pédagogique, publié uniquement pour choquer",
      "Mise en danger volontaire de soi-même ou d'autrui",
      "Contenu sexuel ou pornographique",
      "Contenu haineux ou discriminatoire",
      "Arnaques, fraudes ou systèmes pyramidaux",
      "Usurpation d'identité ou compte créé pour tromper la communauté",
    ],
  },
  {
    title: "Armes et sécurité",
    items: [
      "Les contenus pédagogiques sur la sécurité, l'entretien ou l'utilisation responsable du matériel de chasse sont autorisés.",
      "Sont interdits : menaces avec une arme, utilisation dangereuse ou irresponsable, démonstrations mettant volontairement autrui en danger, transactions illégales d'armes ou de munitions.",
    ],
  },
  {
    title: "Localisation et territoires",
    items: [
      "Une position GPS précise n'est jamais affichée automatiquement dans une publication publique — elle peut être transformée en zone approximative.",
      "Respect des propriétés privées, réserves et zones réglementées : PISTE ne doit jamais servir à organiser une intrusion.",
    ],
  },
  {
    title: "Respect des personnes et des opinions",
    items: [
      "Insultes répétées, harcèlement, menaces, intimidation, doxxing et discrimination sont interdits.",
      "Le débat et le désaccord entre pratiques ou opinions sont autorisés — le harcèlement ne l'est jamais.",
    ],
  },
  {
    title: "Comptes, identité et contenus IA",
    items: [
      "Interdiction d'usurper une identité, de créer un compte pour tromper la communauté ou de multiplier les comptes pour contourner une sanction.",
      "Un contenu généré ou fortement modifié par intelligence artificielle ne doit jamais être présenté comme une preuve ou une observation réelle — PISTE peut demander qu'il soit identifié comme tel.",
    ],
  },
  {
    title: "Signalement",
    items: [
      "Chaque publication, vidéo, photo, commentaire, profil ou message peut être signalé, pour un motif précis : contenu illégal, braconnage, danger/sécurité, cruauté, harcèlement, haine/discrimination, arnaque, contenu sexuel, spam, fausse information, ou autre.",
    ],
  },
  {
    title: "Ce que la modération peut faire",
    items: [
      "Examiner un contenu signalé et le masquer temporairement le temps de l'examen",
      "Restreindre sa visibilité, le supprimer, avertir ou suspendre un compte selon la gravité, le contexte et la récidive",
      "Agir immédiatement face à un contenu manifestement grave (menace sérieuse, exploitation de mineurs, braconnage organisé) et coopérer avec les autorités lorsque la loi l'impose",
      "Un compte sanctionné peut demander un réexamen de la décision de modération",
    ],
  },
  {
    title: "Vos données personnelles",
    items: [
      "Minimisation — seules les données nécessaires au fonctionnement de PISTE sont collectées.",
      "Vous disposez d'un droit d'accès, de rectification, d'effacement et, lorsque applicable, de portabilité de vos données.",
      "Votre consentement est demandé lorsque c'est nécessaire (par exemple pour des cookies non essentiels).",
      "Vos données sont sécurisées, et vous pouvez supprimer votre compte et vos données à tout moment (Paramètres > Données).",
      "Une politique de confidentialité dédiée détaille les données collectées, leur durée de conservation et leurs destinataires.",
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
  { q: "Comment rejoindre une communauté ?", a: "Ouvrez l'onglet Communautés, choisissez une catégorie et appuyez sur « Rejoindre »." },
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
    <div className="flex items-center gap-3 px-5 pb-2" style={{ paddingTop: "calc(20px + env(safe-area-inset-top, 0px))" }}>
      <IconButton icon={ArrowLeft} onClick={onBack} />
      <ProgressDots step={step} total={total} />
    </div>
  );
}
// Petit badge "BETA" — collé au wordmark PISTE (header de l'app et écrans
// de connexion/inscription) pour rappeler que le produit est en test.
function BetaBadge({ size = 9 }) {
  const { colors } = useTheme();
  return (
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: 0.4, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "2.5px 6.5px", lineHeight: 1 }}>
      BETA
    </span>
  );
}
// Fond animé "verre liquide" + apparition en fondu/glissé — utilisé par les
// écrans de connexion/inscription pour reprendre la DA glass/pilule du reste
// de l'app (jusqu'ici ces écrans étaient restés plats, sans animation).
function AuthBackdrop({ children }) {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden", background: colors.background }}>
      <div style={{ position: "absolute", top: -90, left: -70, width: 220, height: 220, borderRadius: "50%", background: colors.accent, opacity: 0.2, filter: "blur(60px)", animation: "pisteFloatBlob 9s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -110, right: -80, width: 260, height: 260, borderRadius: "50%", background: colors.accent, opacity: 0.14, filter: "blur(70px)", animation: "pisteFloatBlob 11s ease-in-out infinite reverse", pointerEvents: "none" }} />
      <div style={{ position: "relative", height: "100%", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 480ms ease, transform 480ms ease" }}>
        {children}
      </div>
    </div>
  );
}
// Mini-guide "ajouter PISTE sur l'écran d'accueil iPhone" — même carte réutilisée
// en bas de la connexion/inscription (repliée, compacte) et tout en haut de la
// liste dans Aide (voir AideScreen). Repliable pour ne jamais prendre trop de place.
function AddToHomeScreenTip({ defaultOpen = false }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const steps = [
    <>Ouvrez le lien PISTE dans Safari</>,
    <>Appuyez sur les <strong>trois petits points</strong> ou l'icône <strong>Partager</strong></>,
    <>Appuyez sur <strong>Partager</strong></>,
    <>Descendez jusqu'à <strong>Sur l'écran d'accueil</strong></>,
  ];
  return (
    <div style={{ background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: RADIUS.xl, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2" style={{ width: "100%", background: "none", border: "none", padding: "11px 14px", cursor: "pointer" }}>
        <div style={{ width: 24, height: 24, borderRadius: RADIUS.pill, background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Smartphone size={12} color={colors.accent} />
        </div>
        <span style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.text }}>Installer PISTE sur votre iPhone</span>
        <ChevronRight size={14} color={colors.textFaint} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 150ms", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ padding: "0 14px 13px", display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div style={{ width: 18, height: 18, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.textFaint }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 1.4 }}>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function StepSplash({ onStart, onLogin }) {
  const { colors } = useTheme();
  return (
    <AuthBackdrop>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 32px", textAlign: "center", gap: 22, animation: "pisteFadeSlideUp 560ms cubic-bezier(0.22, 1, 0.36, 1) both" }}>
        <Logo size={64} />
        <div>
          <div className="flex items-center justify-center gap-2">
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 4, color: colors.text }}>PISTE</div>
            <BetaBadge />
          </div>
          <div style={{ fontSize: 13.5, color: colors.textSecondary, marginTop: 8, lineHeight: 1.5 }}>Le réseau social des passionnés de chasse.</div>
        </div>
        <div style={{ width: "100%", marginTop: 12 }}>
          <Button onClick={onStart}>Commencer</Button>
          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: 12.5, color: colors.textFaint }}>Déjà un compte ? </span>
            <button onClick={onLogin} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Se connecter</button>
          </div>
          <div style={{ marginTop: 22 }}><AddToHomeScreenTip /></div>
        </div>
      </div>
    </AuthBackdrop>
  );
}
// Propose un pseudo libre proche de celui déjà pris — quelques suffixes
// numériques essayés dans l'ordre, chacun réellement vérifié côté base
// (authService.checkUsernameAvailable) avant d'être suggéré.
async function suggestAvailableUsername(base) {
  const cleanBase = (base || "chasseur").replace(/[^a-z0-9_.]/g, "").slice(0, 18) || "chasseur";
  for (let i = 0; i < 5; i++) {
    const suffix = Math.floor(10 + Math.random() * 990);
    const candidate = `${cleanBase}${suffix}`;
    try {
      const result = await authService.checkUsernameAvailable(candidate);
      if (result.available) return candidate;
    } catch (e) { /* on essaie le suffixe suivant */ }
  }
  return null;
}
function StepSignup({ data, setData, onNext, onBack, onLogin }) {
  const { colors } = useTheme();
  const [touched, setTouched] = useState(false);
  // idle | checking | available | taken — vérification réelle côté base (contrainte
  // UNIQUE sur profiles.username), jamais juste un format local. On ne bloque
  // "Continuer" que sur un pseudo confirmé pris : un échec réseau du check ne
  // doit pas empêcher l'inscription (l'insertion elle-même reste le filet de
  // sécurité final, voir StepAccess.submit()).
  const [pseudoCheck, setPseudoCheck] = useState({ status: "idle", suggestion: null });
  const checkSeq = useRef(0);
  useEffect(() => {
    const raw = data.pseudo.trim();
    if (raw.length < 3) { setPseudoCheck({ status: "idle", suggestion: null }); return; }
    const seq = ++checkSeq.current;
    setPseudoCheck({ status: "checking", suggestion: null });
    const t = setTimeout(async () => {
      try {
        const result = await authService.checkUsernameAvailable(raw);
        if (seq !== checkSeq.current) return; // réponse obsolète (l'utilisateur a retapé entre-temps)
        if (result.available) {
          setPseudoCheck({ status: "available", suggestion: null });
        } else {
          const suggestion = await suggestAvailableUsername(result.normalized || raw);
          if (seq !== checkSeq.current) return;
          setPseudoCheck({ status: "taken", suggestion });
        }
      } catch (e) {
        if (seq !== checkSeq.current) return;
        setPseudoCheck({ status: "idle", suggestion: null });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [data.pseudo]);
  const pseudoErr = touched && data.pseudo.trim().length < 3 ? "3 caractères minimum" : null;
  const emailErr = touched && !/^\S+@\S+\.\S+$/.test(data.email) ? "Adresse e-mail invalide" : null;
  const pwErr = touched && data.password.length < 8 ? "8 caractères minimum" : null;
  const valid = data.pseudo.trim().length >= 3 && pseudoCheck.status !== "taken" && /^\S+@\S+\.\S+$/.test(data.email) && data.password.length >= 8;
  return (
    <AuthBackdrop>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <OnboardingHeader onBack={onBack} step={0} total={6} />
        <div style={{ padding: "16px 20px calc(16px + env(safe-area-inset-bottom, 0px))", flex: 1, animation: "pisteFadeSlideUp 480ms cubic-bezier(0.22, 1, 0.36, 1) both" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: colors.text }}>Créer votre compte</div>
            <BetaBadge />
          </div>
          <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 22 }}>Rejoignez la communauté PISTE.</div>
          <TextField label="Pseudo" value={data.pseudo} onChange={(v) => setData({ ...data, pseudo: v })} placeholder="ex : chasseur_vosges" error={pseudoErr} />
          {!pseudoErr && pseudoCheck.status === "checking" && (
            <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: -10, marginBottom: 16 }}>Vérification de la disponibilité...</div>
          )}
          {!pseudoErr && pseudoCheck.status === "available" && (
            <div className="flex items-center gap-1" style={{ fontSize: 11.5, color: colors.accent, marginTop: -10, marginBottom: 16, fontWeight: 600 }}>
              <Check size={12} strokeWidth={3} /> Pseudo disponible
            </div>
          )}
          {!pseudoErr && pseudoCheck.status === "taken" && (
            <div style={{ marginTop: -10, marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, color: colors.error, fontWeight: 600, marginBottom: pseudoCheck.suggestion ? 6 : 0 }}>Ce pseudo est déjà utilisé.</div>
              {pseudoCheck.suggestion && (
                <button
                  onClick={() => setData({ ...data, pseudo: pseudoCheck.suggestion })}
                  className="flex items-center gap-1.5"
                  style={{ background: colors.accentSoft, border: "none", borderRadius: RADIUS.pill, padding: "6px 12px 6px 6px", cursor: "pointer" }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: RADIUS.pill, background: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={10} color={colors.onAccent} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors.accent }}>Essayer « {pseudoCheck.suggestion} »</span>
                </button>
              )}
            </div>
          )}
          <TextField label="E-mail" value={data.email} onChange={(v) => setData({ ...data, email: v })} placeholder="vous@exemple.com" type="email" error={emailErr} />
          <TextField label="Mot de passe" value={data.password} onChange={(v) => setData({ ...data, password: v })} placeholder="8 caractères minimum" type="password" error={pwErr} />
          <Button disabled={touched ? !valid : false} onClick={() => { setTouched(true); if (valid) onNext(); }}>Continuer</Button>
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span style={{ fontSize: 12.5, color: colors.textFaint }}>Déjà un compte ? </span>
            <button onClick={onLogin} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Se connecter</button>
          </div>
        </div>
      </div>
    </AuthBackdrop>
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
      <div style={{ padding: "16px 20px calc(16px + env(safe-area-inset-bottom, 0px))", flex: 1 }}>
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
      <div style={{ padding: "16px 20px calc(16px + env(safe-area-inset-bottom, 0px))", flex: 1, overflowY: "auto" }}>
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
      <div style={{ padding: "16px 20px calc(16px + env(safe-area-inset-bottom, 0px))", flex: 1, overflowY: "auto" }}>
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
      <div style={{ padding: "16px 20px calc(16px + env(safe-area-inset-bottom, 0px))", flex: 1 }}>
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
    <AuthBackdrop>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center px-5 pb-2" style={{ paddingTop: "calc(20px + env(safe-area-inset-top, 0px))" }}><IconButton icon={ArrowLeft} onClick={onBack} /></div>
        <div style={{ padding: "16px 20px calc(16px + env(safe-area-inset-bottom, 0px))", flex: 1, animation: "pisteFadeSlideUp 480ms cubic-bezier(0.22, 1, 0.36, 1) both" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: colors.text }}>Connexion</div>
            <BetaBadge />
          </div>
          <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 22 }}>Accédez à votre compte PISTE.</div>
          <TextField label="E-mail" value={email} onChange={setEmail} placeholder="vous@exemple.com" type="email" />
          <TextField label="Mot de passe" value={password} onChange={setPassword} placeholder="Mot de passe" type="password" />
          <div style={{ marginBottom: 18, marginTop: -6 }}>
            <button onClick={() => setForgot(true)} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Mot de passe oublié ?</button>
          </div>
          {forgot && !forgotSent && (
            <div style={{ background: colors.accentSoft, borderRadius: RADIUS.xl, padding: "13px 16px", marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, color: colors.accent, marginBottom: 8 }}>Un e-mail de réinitialisation sera envoyé à {email || "l'adresse ci-dessus"}.</div>
              <Button full={false} onClick={sendReset} disabled={!email}>Envoyer le lien</Button>
            </div>
          )}
          {forgotSent && <div style={{ background: colors.accentSoft, borderRadius: RADIUS.xl, padding: "13px 16px", fontSize: 12.5, color: colors.accent, marginBottom: 18 }}>E-mail envoyé — vérifiez votre boîte de réception.</div>}
          <Button disabled={!email || !password || status === "loading"} onClick={attemptLogin}>{status === "loading" ? "Connexion..." : "Se connecter"}</Button>
          {status === "error" && (
            <div style={{ background: colors.errorSoft, borderRadius: RADIUS.xl, padding: "13px 16px", fontSize: 12.5, color: colors.error, marginTop: 12, lineHeight: 1.5 }}>{errorMsg}</div>
          )}
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span style={{ fontSize: 12.5, color: colors.textFaint }}>Pas encore de compte ? </span>
            <button onClick={onSignup} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Créer un compte</button>
          </div>
          <div style={{ marginTop: 22 }}><AddToHomeScreenTip /></div>
        </div>
      </div>
    </AuthBackdrop>
  );
}

/* ============================================================
   5. APP SHELL — header + nav TOUJOURS fixes
   ============================================================ */
// chromeMode : "full" (barre normale, toujours visible) | "hidden" (masquée,
// on défile vers le bas) | "floating" (pilule flottante détachée, on remonte)
// — utilisé uniquement par le Fil pour un rendu immersif façon Instants ;
// les autres écrans restent toujours en "full".
function Header({ onBell, onMenu, onSearch, unreadCount = 0, chromeMode = "full" }) {
  const { colors } = useTheme();
  const floating = chromeMode !== "hidden"; // toujours pilule flottante, sauf masqué au défilement
  return (
    <div
      style={{
        position: "sticky",
        // La marge du haut sur un élément "sticky" ne crée pas un vrai espace
        // fiable (comportement différent d'un élément "fixed") — on décale
        // plutôt sa position elle-même pour obtenir le même détachement que
        // la barre du bas. env(safe-area-inset-top) : encoche/île dynamique
        // en PWA plein écran sur iPhone (voir viewport-fit=cover, index.html).
        top: floating ? "calc(8px + env(safe-area-inset-top, 0px))" : "env(safe-area-inset-top, 0px)",
        zIndex: 20,
        background: colors.headerBg,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: floating ? "none" : `1px solid ${colors.border}`,
        margin: floating ? "0 8px" : 0,
        borderRadius: floating ? RADIUS.pill : 0,
        boxShadow: floating ? "0 4px 20px rgba(0,0,0,0.18)" : "none",
        transform: chromeMode === "hidden" ? "translateY(-130%)" : "translateY(0)",
        transition: "transform 260ms ease, top 260ms ease, margin 260ms ease, border-radius 260ms ease, box-shadow 260ms ease",
      }}
      className="flex items-center justify-between px-4 py-3"
    >
      <div className="flex items-center gap-2"><Logo size={28} /><Wordmark /><BetaBadge /></div>
      <div className="flex items-center gap-1">
        <IconButton icon={Search} onClick={onSearch} />
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
function BottomNav({ active, setActive, onCreate, unreadConversations = 0, chromeMode = "full" }) {
  const { colors } = useTheme();
  const floating = chromeMode !== "hidden"; // toujours pilule flottante, sauf masqué au défilement
  const items = [
    { key: "fil", label: "Fil", icon: Home },
    { key: "video", label: "Vidéo", icon: Film },
    { key: "groupes", label: "Communautés", icon: Users },
    { key: "messages", label: "Messages", icon: MessageCircle },
    { key: "create", label: "Créer", icon: Plus, isCreate: true },
    { key: "profil", label: "Profil", icon: User },
  ];
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          pointerEvents: "auto",
          background: colors.navBg,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: floating ? "none" : `1px solid ${colors.border}`,
          margin: floating ? "0 8px calc(8px + env(safe-area-inset-bottom, 0px))" : 0,
          borderRadius: floating ? RADIUS.pill : 0,
          boxShadow: floating ? "0 4px 20px rgba(0,0,0,0.18)" : "none",
          transform: chromeMode === "hidden" ? "translateY(130%)" : "translateY(0)",
          transition: "transform 260ms ease, margin 260ms ease, border-radius 260ms ease, box-shadow 260ms ease",
          paddingBottom: floating ? 4 : "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center justify-between" style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10 }}>
          {items.map((it) => {
            const Icon = it.icon;
            const isActive = active === it.key;
            if (it.isCreate) {
              return (
                <button key={it.key} onClick={onCreate} aria-label="Créer" className="flex flex-col items-center gap-1 active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                  <div style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px ${colors.accent}55` }}>
                    <Plus size={18} color={colors.onAccent} strokeWidth={2.4} />
                  </div>
                </button>
              );
            }
            return (
              <button key={it.key} onClick={() => setActive(it.key)} className="flex flex-col items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", maxWidth: 64 }}>
                <div
                  style={{
                    position: "relative",
                    width: 40,
                    height: 26,
                    borderRadius: RADIUS.pill,
                    background: isActive ? colors.accentSoft : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 200ms ease",
                  }}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} color={isActive ? colors.accent : colors.textFaint} />
                  {it.key === "messages" && unreadConversations > 0 && (
                    <span style={{ position: "absolute", top: -2, right: 2, minWidth: 14, height: 14, borderRadius: 7, background: colors.accent, color: colors.onAccent, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                      {unreadConversations > 9 ? "9+" : unreadConversations}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500, color: isActive ? colors.accent : colors.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 60 }}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function AppShell({ children, header, active, setActive, onCreate, unreadConversations, chromeMode = "full", refreshKey = 0 }) {
  const { colors } = useTheme();
  return (
    <div style={{ minHeight: "100dvh", background: colors.background }}>
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", position: "relative", background: colors.background }}>
        {header}
        {/* refreshKey force un vrai remontage (donc un rechargement des données)
            quand on retape sur l'onglet déjà actif, pas seulement un défilement. */}
        <div key={`${active}-${refreshKey}`} style={{ paddingBottom: NAV_HEIGHT + 12, animation: "piste-fade-in 220ms ease" }}>{children}</div>
        <BottomNav active={active} setActive={setActive} onCreate={onCreate} unreadConversations={unreadConversations} chromeMode={chromeMode} />
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
function ContentActionSheet({ isOwn, isAdmin, onClose, onDelete, onEdit, onReport, onHide, onBlock }) {
  const { colors } = useTheme();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 62 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`,
          pointerEvents: "none",
        }}
      >
      <div style={{ width: "100%", maxWidth: 460, background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, boxShadow: "0 12px 40px rgba(0,0,0,0.22)", padding: "10px 20px 20px", position: "relative", pointerEvents: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "6px auto 16px" }} />
        <div style={{ position: "absolute", top: 10, right: 12 }}><IconButton icon={X} onClick={onClose} size={30} /></div>
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
            {isAdmin && (
              <button onClick={onDelete} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}><span style={{ fontSize: 13.5, fontWeight: 600, color: colors.error }}>Supprimer (admin)</span></button>
            )}
          </>
        )}
      </div>
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
function AuthorProfileSheet({ username, meUsername, isAdmin, isFollowing, isPending, bellOn, onClose, onToggleFollow, onRequestFollow, onToggleBell, onMessage, onOpenProfile, onOpenPlayer, liked, saved, reposted, commentsByPost, onLike, onSave, onRepost, onAddComment, onDelete, onDeleteComment, onEditRequest, onReport, onHide, onBlock, onLoadComments, traceGroup, onOpenTrace }) {
  const { colors } = useTheme();
  const isSelf = username === meUsername;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [repostedPosts, setRepostedPosts] = useState([]);
  const [tab, setTab] = useState("publications");
  const [openDog, setOpenDog] = useState(null);
  const [followSheet, setFollowSheet] = useState(null); // 'followers' | 'following' | null
  const [viewingInstant, setViewingInstant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(null);
  const [localMode, setLocalMode] = useState("full");
  const tabs = [["publications", "Publications", Home], ["videos", "Vidéos", Video], ["chiens", "Chiens", Dog], ["reposts", "Reposts", Repeat2]];
  const lastScrollTopRef = useRef(0);
  const handleScroll = (e) => {
    const el = e.currentTarget;
    const top = el.scrollTop;
    // Pas assez de contenu pour justifier l'effet immersif (ex. une communauté
    // sans publication) : le léger dépassement de scroll ne doit pas cacher
    // l'en-tête pour rien, alors qu'il n'y a rien de plus à voir en dessous.
    if (el.scrollHeight - el.clientHeight < 80) { setLocalMode("full"); lastScrollTopRef.current = top; return; }
    const delta = top - lastScrollTopRef.current;
    if (top < 40) setLocalMode("full");
    else if (delta > 4) setLocalMode("hidden");
    else if (delta < -4) setLocalMode("floating");
    lastScrollTopRef.current = top;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    profileService.fetchPublicProfile(username)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        // Compte privé et pas encore un abonné approuvé : RLS renverrait de
        // toute façon des listes vides (voir migrations 020/021), mais autant
        // ne pas faire les requêtes pour rien.
        const canView = isSelf || !p.isPrivate || isFollowing;
        if (!canView) return;
        return Promise.all([
          postService.fetchUserPosts(p.id).then((rows) => { if (!cancelled) setPosts(rows.map(mapPostRow)); }),
          dogService.fetchUserDogs(p.id).then((rows) => { if (!cancelled) setDogs(rows); }).catch(() => {}),
          postService.fetchUserRepostedPosts(p.id).then((rows) => { if (!cancelled) setRepostedPosts(rows.map(mapPostRow)); }).catch(() => {}),
        ]);
      })
      .catch((e) => { if (!cancelled) setError(e.message || "Profil introuvable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, isFollowing]);

  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "fixed", inset: 0, zIndex: 64, background: colors.background, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      {loading ? (
        <>
          <ScreenHeader title="Profil" onBack={onClose} />
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginTop: 40 }}>Chargement...</div>
        </>
      ) : error ? (
        <>
          <ScreenHeader title="Profil" onBack={onClose} />
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.error, marginTop: 40, padding: "0 24px" }}>{error}</div>
        </>
      ) : (
        <div onScroll={handleScroll} style={{ flex: 1, overflowY: "auto" }}>
          <ScreenHeader title={`@${profile.username}`} onBack={onClose} chromeMode={localMode} />
          <div style={{ width: "100%", height: 124, marginTop: 10, background: profile.imageCouverture ? `url(${profile.imageCouverture}) center/cover` : `linear-gradient(135deg, ${colors.accentSoft}, ${colors.surfaceAlt})`, borderRadius: RADIUS.xl }} />
          <div className="px-4">
            <div style={{ marginTop: -40 }}>
              {traceGroup && traceGroup.traces.length > 0 ? (
                <button onClick={onOpenTrace} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", borderRadius: RADIUS.pill }}>
                  <div style={{ width: 86, height: 86, borderRadius: RADIUS.pill, padding: 3, boxSizing: "border-box", background: traceGroup.allViewed ? colors.border : `linear-gradient(135deg, ${colors.accent}, ${colors.accentSoft})` }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: RADIUS.pill, background: colors.surface, border: `3px solid ${colors.background}`, boxShadow: "0 6px 18px rgba(0,0,0,0.16)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={32} color={colors.textFaint} strokeWidth={1.6} />}
                    </div>
                  </div>
                </button>
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: RADIUS.pill, background: colors.surface, border: `4px solid ${colors.background}`, boxShadow: "0 6px 18px rgba(0,0,0,0.16)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={32} color={colors.textFaint} strokeWidth={1.6} />}
                </div>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{profile.nom}</div>
              <div style={{ fontSize: 13, color: colors.textFaint }}>@{profile.username}</div>
              <BadgeRow badges={profile.badges} />
              {profile.localisation && (
                <div className="flex items-center gap-1" style={{ marginTop: 6, display: "inline-flex", background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "4px 10px 4px 8px" }}>
                  <MapPin size={12} color={colors.textFaint} /><span style={{ fontSize: 12, color: colors.textSecondary }}>{profile.localisation}</span>
                </div>
              )}
              {profile.bio && <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 10, lineHeight: 1.5, background: colors.surfaceAlt, borderRadius: RADIUS.lg, padding: "10px 12px" }}>{profile.bio}</div>}
            </div>
            <div style={{ marginTop: 16, background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: RADIUS.lg, padding: "12px 4px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }} className="flex">
              {[["Abonnés", profile.stats.abonnes, "followers"], ["Abonnements", profile.stats.abonnements, "following"], ["Publications", profile.stats.publications, null]].map(([label, val, statMode]) => {
                const mode = profile.isPrivate && !isSelf && !isFollowing ? null : statMode;
                return mode ? (
                  <button key={label} onClick={() => setFollowSheet(mode)} style={{ flex: 1, textAlign: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>{val}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{label}</div>
                  </button>
                ) : (
                  <div key={label} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>{val}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{label}</div>
                  </div>
                );
              })}
            </div>
            {isSelf ? (
              <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: colors.textFaint }}>C'est vous.</div>
            ) : (
              <div className="flex items-center gap-2" style={{ marginTop: 14 }}>
                {profile.isPrivate && !isFollowing ? (
                  <Button full={false} variant={isPending ? "secondary" : "primary"} onClick={onRequestFollow}>{isPending ? "Demande envoyée" : "Demander à s'abonner"}</Button>
                ) : (
                  <Button full={false} variant={isFollowing ? "secondary" : "primary"} onClick={onToggleFollow}>{isFollowing ? "Abonné" : "Suivre"}</Button>
                )}
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
          {profile.isPrivate && !isSelf && !isFollowing ? (
            <EmptyState title="Ce compte est privé" subtitle={`Demandez à vous abonner pour voir les publications, vidéos, chiens et reposts de @${profile.username}.`} />
          ) : (
            <>
              <div className="px-4 mt-5">
                <div className="flex" style={{ background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: RADIUS.pill, padding: 3, gap: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                  {tabs.map(([key, label, Icon]) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className="flex items-center justify-center gap-1.5"
                      style={{ flex: 1, padding: "7px 6px", background: tab === key ? colors.surface : "transparent", border: "none", borderRadius: RADIUS.pill, cursor: "pointer", boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "background 150ms ease, box-shadow 150ms ease" }}
                    >
                      <Icon size={14} color={tab === key ? colors.text : colors.textFaint} strokeWidth={1.8} />
                      <span style={{ fontSize: 10.5, fontWeight: tab === key ? 700 : 600, color: tab === key ? colors.text : colors.textFaint, whiteSpace: "nowrap" }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {tab === "publications" && (
                posts.filter((p) => p.type !== "video" && p.type !== "video_courte").length === 0 ? (
                  <EmptyState title="Aucune publication" subtitle="Les publications de ce compte apparaîtront ici." />
                ) : (
                  <div style={{ paddingTop: 10 }}>
                    {posts.filter((p) => p.type !== "video" && p.type !== "video_courte").map((p) => (
                      <PostCard
                        onOpenProfile={onOpenProfile}
                        key={p.id}
                        post={p}
                        liked={liked.includes(p.id)}
                        saved={saved.includes(p.id)}
                        reposted={reposted.includes(p.id)}
                        onRepost={() => onRepost(p.id)}
                        commentCount={commentsByPost[p.id] ? commentsByPost[p.id].length : (p.commentaires || 0)}
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
                posts.filter((p) => p.type === "video" || p.type === "video_courte").length === 0 ? (
                  <EmptyState title="Aucune vidéo" subtitle="Les vidéos de ce compte apparaîtront ici." />
                ) : (
                  <div style={{ paddingTop: 6 }}>
                    {posts.filter((p) => p.type === "video" || p.type === "video_courte").map((v) => (
                      <VideoCard
                        key={v.id}
                        video={v}
                        liked={liked.includes(v.id)}
                        reposted={reposted.includes(v.id)}
                        commentCount={commentsByPost[v.id] ? commentsByPost[v.id].length : (v.commentaires || 0)}
                        onLike={() => onLike(v.id)}
                        onRepost={v.type === "video" ? undefined : () => onRepost(v.id)}
                        onOpenComments={() => { setSheet({ type: "comments", post: v }); onLoadComments(v.id); }}
                        onOpenActions={() => setSheet({ type: "actions", post: v })}
                        onOpenAuthor={() => onOpenProfile(v.username)}
                        onOpenPlayer={() => onOpenPlayer && onOpenPlayer(v)}
                      />
                    ))}
                  </div>
                )
              )}
              {tab === "chiens" && (
                dogs.length === 0 ? (
                  <EmptyState title="Aucun chien enregistré" subtitle="Les chiens de ce compte apparaîtront ici." />
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
                  </div>
                )
              )}
              {tab === "reposts" && (
                repostedPosts.length === 0 ? (
                  <EmptyState title="Aucun repost" subtitle="Les publications repartagées par ce compte apparaîtront ici." />
                ) : (
                  <div style={{ paddingTop: 10 }}>
                    {repostedPosts.map((p) => (
                      p.type === "video_courte" ? (
                        <RepostedInstantCard key={p.id} item={p} onOpen={setViewingInstant} />
                      ) : (
                        <PostCard
                          onOpenProfile={onOpenProfile}
                          key={p.id}
                          post={p}
                          liked={liked.includes(p.id)}
                          saved={saved.includes(p.id)}
                          reposted={true}
                          onRepost={() => onRepost(p.id)}
                          commentCount={commentsByPost[p.id] ? commentsByPost[p.id].length : (p.commentaires || 0)}
                          onLike={() => onLike(p.id)}
                          onSave={() => onSave(p.id)}
                          onOpenComments={() => { setSheet({ type: "comments", post: p }); onLoadComments(p.id); }}
                          onOpenActions={() => setSheet({ type: "actions", post: p })}
                          onOpenAuthor={() => onOpenProfile(p.username)}
                        />
                      )
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      )}
      {openDog && (
        <DogPage
          dog={openDog}
          onClose={() => setOpenDog(null)}
          onOpenProfile={onOpenProfile}
          onOpenPlayer={onOpenPlayer}
          meUsername={meUsername}
          isAdmin={isAdmin}
          liked={liked}
          saved={saved}
          reposted={reposted}
          commentsByPost={commentsByPost}
          onLike={onLike}
          onSave={onSave}
          onRepost={onRepost}
          onAddComment={onAddComment}
          onDelete={onDelete}
          onDeleteComment={onDeleteComment}
          onEditRequest={onEditRequest}
          onReport={onReport}
          onHide={onHide}
          onBlock={onBlock}
          onLoadComments={onLoadComments}
        />
      )}
      {followSheet && <FollowListSheet userId={profile.id} mode={followSheet} onClose={() => setFollowSheet(null)} onOpenProfile={onOpenProfile} />}
      {viewingInstant && (
        <SingleInstantViewer
          item={viewingInstant}
          onClose={() => setViewingInstant(null)}
          liked={liked.includes(viewingInstant.id)}
          reposted={true}
          commentCount={commentsByPost[viewingInstant.id] ? commentsByPost[viewingInstant.id].length : (viewingInstant.commentaires || 0)}
          onLike={() => onLike(viewingInstant.id)}
          onRepost={() => onRepost(viewingInstant.id)}
          onOpenComments={() => { setSheet({ type: "comments", post: viewingInstant }); onLoadComments(viewingInstant.id); }}
          onOpenActions={() => setSheet({ type: "actions", post: viewingInstant })}
          onOpenAuthor={() => onOpenProfile(viewingInstant.username)}
        />
      )}
      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={isSelf}
          isAdmin={isAdmin}
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
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} onDelete={onDeleteComment ? (commentId) => onDeleteComment(sheet.post.id, commentId) : undefined} meUsername={meUsername} onOpenProfile={onOpenProfile} />
      )}
    </div>
  );
}
function ReportSheet({ onClose, onSubmit }) {
  const { colors } = useTheme();
  const [reason, setReason] = useState(null);
  const [sent, setSent] = useState(false);
  const Sheet = ({ children }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 63 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`,
          pointerEvents: "none",
        }}
      >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "82vh",
          background: colors.headerBg,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: RADIUS.xl,
          boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
          display: "flex",
          flexDirection: "column",
          pointerEvents: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
        {children}
      </div>
      </div>
    </div>
  );
  if (sent) {
    return (
      <Sheet>
        <div className="flex items-center justify-between" style={{ padding: "6px 16px 10px" }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>Signalement</span>
          <IconButton icon={X} onClick={onClose} size={30} />
        </div>
        <EmptyState title="Signalement envoyé" subtitle="Merci, notre équipe examinera ce contenu. Retrouvez l'historique de vos signalements dans Paramètres > Sécurité." />
      </Sheet>
    );
  }
  return (
    <Sheet>
      <div className="flex items-center justify-between" style={{ padding: "6px 16px 10px" }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>Signaler</span>
        <IconButton icon={X} onClick={onClose} size={30} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
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
      <div style={{ padding: "12px 20px 20px", borderTop: `1px solid ${colors.border}` }}>
        <Button disabled={!reason} onClick={() => { onSubmit(reason); setSent(true); }}>Envoyer le signalement</Button>
      </div>
    </Sheet>
  );
}
// Rend un texte en transformant chaque "@pseudo" réellement présent en lien
// cliquable vers le profil — jamais de mention inventée, seulement celles
// écrites par l'auteur (même regex que extractMentions).
function renderTextWithMentions(text, colors, onOpenProfile) {
  if (!text) return text;
  const parts = text.split(/(@[a-z0-9_.]+)/gi);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    /^@[a-z0-9_.]+$/i.test(part) ? (
      <span
        key={i}
        onClick={(e) => { e.stopPropagation(); onOpenProfile?.(part.slice(1)); }}
        style={{ color: colors.accent, fontWeight: 700, cursor: onOpenProfile ? "pointer" : "default" }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}
// Bouton "@" à côté d'un champ de commentaire — ouvre une recherche de vrais
// comptes PISTE et insère "@pseudo" dans le texte à la sélection, plutôt que
// de laisser taper un nom à la main (risque de faute, mauvaise personne...).
function MentionPickerButton({ onSelect }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      socialService.searchUsers(q).then((rows) => { if (!cancelled) setResults(rows); }).catch(() => {}).finally(() => { if (!cancelled) setSearching(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, open]);
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Identifier quelqu'un" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexShrink: 0 }}>
        <AtSign size={19} color={colors.textFaint} />
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 95 }}>
          <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`, pointerEvents: "none" }}>
            <div style={{ width: "100%", maxWidth: 460, maxHeight: "60vh", background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, boxShadow: "0 12px 40px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
              <div className="flex items-center justify-between" style={{ padding: "6px 16px 8px" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>Identifier quelqu'un</span>
                <IconButton icon={X} onClick={() => setOpen(false)} size={28} />
              </div>
              <div style={{ padding: "0 16px 10px" }}>
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un pseudo..." style={{ width: "100%", border: "none", background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "10px 14px", fontSize: 13.5, color: colors.text, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px" }}>
                {searching ? (
                  <div style={{ textAlign: "center", fontSize: 12, color: colors.textFaint, padding: 16 }}>Recherche...</div>
                ) : !query.trim() ? (
                  <div style={{ textAlign: "center", fontSize: 12, color: colors.textFaint, padding: 16 }}>Tapez un pseudo pour identifier quelqu'un.</div>
                ) : results.length === 0 ? (
                  <div style={{ textAlign: "center", fontSize: 12, color: colors.textFaint, padding: 16 }}>Aucun résultat.</div>
                ) : (
                  results.map((u) => (
                    <button key={u.id} onClick={() => { onSelect(u); setOpen(false); setQuery(""); }} className="flex items-center gap-2" style={{ width: "100%", background: "none", border: "none", padding: "9px 8px", cursor: "pointer", textAlign: "left", borderRadius: RADIUS.md }}>
                      <div style={{ width: 28, height: 28, borderRadius: RADIUS.pill, background: colors.surfaceAlt, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={13} color={colors.textFaint} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.text }}>{u.nom || u.username}</div>
                        <div style={{ fontSize: 11, color: colors.textFaint }}>@{u.username}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function CommentsSheet({ comments, onClose, onAdd, onDelete, meUsername, onOpenProfile }) {
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
    <div style={{ position: "fixed", inset: 0, zIndex: 61 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`,
          pointerEvents: "none",
        }}
      >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          height: "78vh",
          background: colors.headerBg,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: RADIUS.xl,
          boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
          display: "flex",
          flexDirection: "column",
          pointerEvents: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
        <div className="flex items-center justify-between" style={{ padding: "6px 16px 10px" }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>Commentaires</span>
          <IconButton icon={X} onClick={onClose} size={30} />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
        {comments.length === 0 ? (
          <EmptyState title="Aucun commentaire" subtitle="Soyez le premier à réagir à cette publication." />
        ) : (
          <div style={{ padding: "8px 16px" }}>
            {topLevel.map((c) => (
              <div key={c.id} style={{ padding: "10px 0", borderBottom: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.text }}>{c.auteur}</span>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>{c.date}</span>
                  </div>
                  {onDelete && meUsername && c.authorUsername === meUsername && (
                    <button onClick={() => onDelete(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                      <Trash2 size={13.5} color={colors.textFaint} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.4 }}>{renderTextWithMentions(c.texte, colors, onOpenProfile)}</div>
                <button onClick={() => setReplyTo({ id: c.id, auteur: c.auteur })} style={{ background: "none", border: "none", color: colors.accent, fontSize: 11.5, fontWeight: 700, cursor: "pointer", marginTop: 4, padding: 0 }}>Répondre</button>
                {repliesOf(c.id).map((r) => (
                  <div key={r.id} style={{ marginTop: 8, marginLeft: 18, paddingLeft: 10, borderLeft: `2px solid ${colors.border}` }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{r.auteur}</span>
                        <span style={{ fontSize: 10.5, color: colors.textFaint }}>{r.date}</span>
                      </div>
                      {onDelete && meUsername && r.authorUsername === meUsername && (
                        <button onClick={() => onDelete(r.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                          <Trash2 size={12.5} color={colors.textFaint} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: colors.text, lineHeight: 1.4 }}>{renderTextWithMentions(r.texte, colors, onOpenProfile)}</div>
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
      <div className="flex items-center gap-2" style={{ padding: "10px 16px 14px" }}>
        <MentionPickerButton onSelect={(u) => setText((t) => (t && !t.endsWith(" ") ? t + " " : t) + `@${u.username} `)} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyTo ? `Répondre à ${replyTo.auteur}...` : "Ajouter un commentaire..."}
          style={{ flex: 1, border: "none", borderRadius: RADIUS.pill, padding: "11px 16px", fontSize: 13, color: colors.text, outline: "none", background: colors.surfaceAlt }}
        />
        <button onClick={submit} disabled={!text.trim()} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, background: text.trim() ? colors.accent : colors.surfaceAlt, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: text.trim() ? "pointer" : "default", flexShrink: 0, boxShadow: text.trim() ? `0 2px 8px ${colors.accent}40` : "none", transition: "background 150ms ease, box-shadow 150ms ease" }}>
          <ChevronRight size={17} color={text.trim() ? "white" : colors.textFaint} />
        </button>
      </div>
      </div>
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
// Sondage réel (voir migration 036) — options et votes chargés à l'ouverture
// du post, pas préchargés dans le fil (même principe que les commentaires).
// Un vote change simplement l'option choisie (poll_votes a une seule ligne
// par personne et par sondage), jamais un deuxième vote qui s'ajouterait.
function PollCard({ postId }) {
  const { colors } = useTheme();
  const [options, setOptions] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [voting, setVoting] = useState(false);

  const refresh = () => Promise.all([postService.fetchPollOptions(postId), postService.fetchMyPollVote(postId)]).then(([opts, vote]) => { setOptions(opts); setMyVote(vote); }).catch(() => setOptions([]));

  useEffect(() => { refresh(); }, [postId]);

  if (options === null) {
    return <div style={{ margin: "0 16px 12px", fontSize: 12, color: colors.textFaint }}>Chargement du sondage...</div>;
  }
  const total = options.reduce((sum, o) => sum + o.votes, 0);
  const vote = async (optionId) => {
    if (voting || optionId === myVote) return;
    setVoting(true);
    const previous = { options, myVote };
    // Optimiste : on ajuste les compteurs localement, corrigé si l'appel échoue.
    setOptions((os) => os.map((o) => {
      if (o.id === optionId) return { ...o, votes: o.votes + 1 };
      if (o.id === myVote) return { ...o, votes: Math.max(0, o.votes - 1) };
      return o;
    }));
    setMyVote(optionId);
    try {
      await postService.votePoll(postId, optionId);
    } catch (e) {
      setOptions(previous.options);
      setMyVote(previous.myVote);
    } finally {
      setVoting(false);
    }
  };
  return (
    <div className="flex flex-col gap-2" style={{ margin: "0 16px 12px" }}>
      {options.map((o) => {
        const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
        const mine = o.id === myVote;
        return (
          <button
            key={o.id}
            onClick={() => vote(o.id)}
            disabled={voting}
            style={{ position: "relative", width: "100%", textAlign: "left", border: `1.5px solid ${mine ? colors.accent : colors.border}`, borderRadius: RADIUS.lg, padding: "10px 14px", background: colors.surface, cursor: "pointer", overflow: "hidden" }}
          >
            {myVote && (
              <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: mine ? colors.accentSoft : colors.surfaceAlt, transition: "width 300ms ease" }} />
            )}
            <div className="flex items-center justify-between" style={{ position: "relative" }}>
              <span style={{ fontSize: 13, fontWeight: mine ? 700 : 600, color: mine ? colors.accent : colors.text }}>{o.texte}</span>
              {myVote && <span style={{ fontSize: 12, fontWeight: 700, color: mine ? colors.accent : colors.textFaint }}>{pct}%</span>}
            </div>
          </button>
        );
      })}
      <span style={{ fontSize: 11, color: colors.textFaint }}>{total} vote{total !== 1 ? "s" : ""}{!myVote && total >= 0 ? " · Touchez une option pour voter" : ""}</span>
    </div>
  );
}
// Partager un contenu PISTE (publication/vidéo/Instant) en privé — choisir un
// ou plusieurs destinataires parmi ses conversations existantes ou une
// recherche, puis l'envoyer comme un vrai message référencé dans leur
// conversation (voir messageService.sendSharedPost, migration 041). Le
// contenu n'est jamais dupliqué : seul son id est envoyé, la personne verra
// toujours la version à jour.
function SharePostSheet({ item, onClose }) {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState([]); // [{ key, conversationId?, userId?, name, avatar }]
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    messageService.fetchConversations().then(setConversations).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      socialService.searchUsers(q).then((rows) => { if (!cancelled) setResults(rows); }).catch(() => {}).finally(() => { if (!cancelled) setSearching(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  const toggleConv = (c) => setSelected((s) => (s.some((x) => x.key === `c:${c.id}`) ? s.filter((x) => x.key !== `c:${c.id}`) : [...s, { key: `c:${c.id}`, conversationId: c.id, name: c.nom, avatar: c.avatar }]));
  const toggleUser = (u) => setSelected((s) => (s.some((x) => x.key === `u:${u.id}`) ? s.filter((x) => x.key !== `u:${u.id}`) : [...s, { key: `u:${u.id}`, userId: u.id, name: u.nom || u.username, avatar: u.avatar_url }]));

  const send = async () => {
    if (selected.length === 0) return;
    setSending(true);
    setError("");
    try {
      for (const target of selected) {
        const conversationId = target.conversationId || (await messageService.startDirectConversation(target.userId));
        await messageService.sendSharedPost(conversationId, item.id);
      }
      setSent(true);
    } catch (e) {
      setError(e.message || "Impossible d'envoyer pour le moment.");
    } finally {
      setSending(false);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: "PISTE", text: item.titre || item.texte || "Un contenu PISTE" }); } catch (e) {} }
    else setError("Le partage natif n'est pas disponible sur cet appareil.");
  };

  const thumb = item.image || (item.videoUrl ? null : null);
  const isVideoLike = item.type === "video" || item.type === "video_courte";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 92 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`, pointerEvents: "none" }}>
        <div style={{ width: "100%", maxWidth: 460, maxHeight: "82vh", background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, boxShadow: "0 12px 40px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
          <div className="flex items-center justify-between" style={{ padding: "6px 16px 10px" }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>Envoyer à...</span>
            <IconButton icon={X} onClick={onClose} size={30} />
          </div>
          {sent ? (
            <div style={{ padding: "12px 20px 28px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: RADIUS.pill, background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Check size={22} color={colors.accent} strokeWidth={2.5} /></div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Envoyé</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>Retrouvable dans la conversation avec {selected.length > 1 ? "chaque personne" : "cette personne"}.</div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3" style={{ padding: "0 16px 12px" }}>
                <div style={{ width: 44, height: 44, borderRadius: RADIUS.lg, background: colors.surfaceAlt, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : isVideoLike ? <Film size={18} color={colors.textFaint} /> : <TypeIcon size={18} color={colors.textFaint} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titre || item.texte || "Contenu PISTE"}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint }}>{item.nom}</div>
                </div>
              </div>
              <div style={{ padding: "0 16px 10px" }}>
                <div className="flex items-center gap-2" style={{ background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "10px 14px" }}>
                  <Search size={15} color={colors.textFaint} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un pseudo..." style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: colors.text, flex: 1 }} />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
                {query.trim() ? (
                  searching ? (
                    <div style={{ textAlign: "center", fontSize: 12, color: colors.textFaint, padding: 16 }}>Recherche...</div>
                  ) : results.length === 0 ? (
                    <div style={{ textAlign: "center", fontSize: 12, color: colors.textFaint, padding: 16 }}>Aucun résultat.</div>
                  ) : (
                    results.map((u) => {
                      const active = selected.some((x) => x.key === `u:${u.id}`);
                      return (
                        <button key={u.id} onClick={() => toggleUser(u)} className="flex items-center gap-3" style={{ width: "100%", background: "none", border: "none", padding: "9px 8px", cursor: "pointer", textAlign: "left", borderRadius: RADIUS.md }}>
                          <div style={{ width: 36, height: 36, borderRadius: RADIUS.pill, background: colors.surfaceAlt, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={colors.textFaint} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{u.nom || u.username}</div>
                            <div style={{ fontSize: 11, color: colors.textFaint }}>@{u.username}</div>
                          </div>
                          <div style={{ width: 20, height: 20, borderRadius: RADIUS.pill, border: `1.5px solid ${active ? colors.accent : colors.border}`, background: active ? colors.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {active && <Check size={11} color={colors.onAccent} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })
                  )
                ) : loading ? (
                  <div style={{ textAlign: "center", fontSize: 12, color: colors.textFaint, padding: 16 }}>Chargement...</div>
                ) : conversations.length === 0 ? (
                  <div style={{ textAlign: "center", fontSize: 12, color: colors.textFaint, padding: 16 }}>Recherchez un pseudo pour commencer une conversation.</div>
                ) : (
                  conversations.map((c) => {
                    const active = selected.some((x) => x.key === `c:${c.id}`);
                    return (
                      <button key={c.id} onClick={() => toggleConv(c)} className="flex items-center gap-3" style={{ width: "100%", background: "none", border: "none", padding: "9px 8px", cursor: "pointer", textAlign: "left", borderRadius: RADIUS.md }}>
                        <div style={{ width: 36, height: 36, borderRadius: RADIUS.pill, background: colors.surfaceAlt, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {c.avatar ? <img src={c.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : c.type === "group" ? <Users size={16} color={colors.textFaint} /> : <User size={16} color={colors.textFaint} />}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nom}</div>
                        <div style={{ width: 20, height: 20, borderRadius: RADIUS.pill, border: `1.5px solid ${active ? colors.accent : colors.border}`, background: active ? colors.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {active && <Check size={11} color={colors.onAccent} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              {error && <div style={{ margin: "8px 16px 0", fontSize: 12, color: colors.error }}>{error}</div>}
              <div style={{ padding: 16 }} className="flex flex-col gap-2">
                <Button onClick={send} disabled={selected.length === 0 || sending}>{sending ? "Envoi..." : `Envoyer${selected.length > 0 ? ` (${selected.length})` : ""}`}</Button>
                <Button variant="secondary" onClick={nativeShare}>Partager ailleurs</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function PostCard({ post, liked, saved, reposted, commentCount, onLike, onSave, onRepost, onOpenComments, onOpenActions, onOpenAuthor, onOpenProfile }) {
  const { colors } = useTheme();
  const [showShare, setShowShare] = useState(false);
  return (
    <div style={{ background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${colors.border}`, borderRadius: RADIUS.xl, margin: "0 12px 12px", overflow: "hidden", paddingTop: 14, paddingBottom: 14 }}>
      {post.repostedAt && (
        <div className="flex items-center gap-1.5" style={{ padding: "0 16px 6px", fontSize: 11.5, color: colors.textFaint, fontWeight: 600 }}>
          <Repeat2 size={13} /> Reposté
        </div>
      )}
      <div className="flex items-center justify-between" style={{ padding: "0 16px 10px" }}>
        <button onClick={onOpenAuthor} className="flex items-center gap-2.5" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {post.avatar ? <img src={post.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={colors.textFaint} />}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{post.nom}</div>
            <div style={{ fontSize: 11, color: colors.textFaint }}>{post.date}</div>
          </div>
        </button>
        <IconButton icon={MoreHorizontal} onClick={onOpenActions} size={30} />
      </div>
      {post.texte && <div style={{ padding: "0 16px 12px", fontSize: 13.5, color: colors.text, lineHeight: 1.5 }}>{renderTextWithMentions(post.texte, colors, onOpenProfile)}</div>}
      {post.type === "sondage" && <PollCard postId={post.id} />}
      {post.image && (
        <SensitiveGate rating={post.contentRating}>
          <div style={{ margin: "0 16px", aspectRatio: "4/3", borderRadius: RADIUS.lg, overflow: "hidden", background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={post.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </SensitiveGate>
      )}
      <div className="flex items-center gap-4" style={{ padding: "10px 16px 0" }}>
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
        <button onClick={() => setShowShare(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><Share2 size={17} color={colors.textSecondary} strokeWidth={1.8} /></button>
        <div style={{ flex: 1 }} />
        <button onClick={onSave} className="active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <Bookmark size={17} color={saved ? colors.accent : colors.textSecondary} fill={saved ? colors.accent : "none"} strokeWidth={1.8} />
        </button>
      </div>
      {(post.animal || post.pratique || (post.hashtags && post.hashtags.length > 0)) && (
        <div className="flex flex-wrap gap-1.5" style={{ padding: "10px 16px 0" }}>
          {post.animal && post.animal !== "Aucun" && <span style={{ fontSize: 10.5, fontWeight: 600, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "3px 9px" }}>{post.animal}</span>}
          {post.pratique && <span style={{ fontSize: 10.5, fontWeight: 600, color: colors.textSecondary, background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "3px 9px" }}>{post.pratique}</span>}
          {(post.hashtags || []).map((h) => <span key={h} style={{ fontSize: 10.5, fontWeight: 600, color: colors.accent }}>{h}</span>)}
        </div>
      )}
      {showShare && <SharePostSheet item={post} onClose={() => setShowShare(false)} />}
    </div>
  );
}
/** Barre horizontale des Traces actives — ma Trace toujours en premier (avec
 *  un "+" si je n'en ai pas), puis celles des comptes suivis. Anneau dégradé
 *  = contient une Trace non vue ; anneau neutre = toutes déjà vues. */
function TraceBar({ groups, onOpenGroup, onCreateOwn }) {
  const { colors } = useTheme();
  if (groups.length === 0) return null;
  return (
    <div className="flex gap-3" style={{ padding: "10px 16px 14px", overflowX: "auto" }}>
      {groups.map((g, i) => {
        const empty = g.traces.length === 0;
        return (
          <button
            key={g.authorId}
            onClick={() => (empty ? onCreateOwn() : onOpenGroup(i))}
            className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, width: 64 }}
          >
            <div style={{ position: "relative", width: 60, height: 60 }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: RADIUS.pill,
                  padding: 2.5,
                  boxSizing: "border-box",
                  background: empty ? colors.border : g.allViewed ? colors.border : `linear-gradient(135deg, ${colors.accent}, ${colors.accentSoft})`,
                }}
              >
                <div style={{ width: "100%", height: "100%", borderRadius: RADIUS.pill, background: colors.background, padding: 2, boxSizing: "border-box" }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: RADIUS.pill, background: colors.surfaceAlt, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {g.avatar ? <img src={g.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={22} color={colors.textFaint} />}
                  </div>
                </div>
              </div>
              {g.isMe && empty && (
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: RADIUS.pill, background: colors.accent, border: `2px solid ${colors.background}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={11} color={colors.onAccent} strokeWidth={3} />
                </div>
              )}
            </div>
            <span style={{ fontSize: 10.5, color: colors.textSecondary, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 60 }}>
              {g.isMe ? "Ma Trace" : g.nom}
            </span>
          </button>
        );
      })}
    </div>
  );
}
function TraceViewersSheet({ traceId, onClose }) {
  const { colors } = useTheme();
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    traceService.fetchTraceViewers(traceId).then((v) => { if (!cancelled) setViewers(v); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [traceId]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 82 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`, pointerEvents: "none" }}>
        <div style={{ width: "100%", maxWidth: 460, maxHeight: "60vh", background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, boxShadow: "0 12px 40px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
          <div className="flex items-center justify-between" style={{ padding: "6px 16px 10px" }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>{viewers.length} vue{viewers.length !== 1 ? "s" : ""}</span>
            <IconButton icon={X} onClick={onClose} size={30} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
            {loading ? (
              <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, padding: 24 }}>Chargement...</div>
            ) : viewers.length === 0 ? (
              <EmptyState title="Aucune vue pour l'instant" subtitle="Les personnes qui regardent votre Trace apparaîtront ici." />
            ) : (
              viewers.map((v) => (
                <div key={v.username} className="flex items-center gap-3" style={{ padding: "8px 4px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {v.avatar ? <img src={v.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={15} color={colors.textFaint} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{v.nom}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
/** Visionneuse plein écran — navigation entre Traces d'une même personne et
 *  entre personnes, progression réelle (minuteur pour une photo, lecture
 *  réelle pour une vidéo), vue enregistrée une seule fois par Trace. */
function TraceViewer({ groups, startGroupIndex, onClose, meUsername, onView, onDelete, onOpenProfile }) {
  const { colors } = useTheme();
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [traceIndex, setTraceIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const videoRef = useRef(null);
  const elapsedRef = useRef(0);
  const holdTimerRef = useRef(null);
  const heldRef = useRef(false);
  const viewedRef = useRef(new Set());

  const group = groups[groupIndex];
  const trace = group?.traces?.[traceIndex];
  const isMine = !!trace && trace.username === meUsername;

  const goNext = () => {
    setConfirmDelete(false);
    const g = groups[groupIndex];
    if (!g) return;
    if (traceIndex < g.traces.length - 1) {
      setTraceIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setTraceIndex(0);
    } else {
      onClose();
    }
  };
  const goPrev = () => {
    setConfirmDelete(false);
    if (traceIndex > 0) {
      setTraceIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((i) => i - 1);
      setTraceIndex(Math.max(0, prevGroup.traces.length - 1));
    }
  };

  // Enregistre la vue une seule fois par Trace pour cette session de
  // visionnage (une nouvelle visite plus tard sera dédupliquée côté base par
  // la clé primaire (trace_id, viewer_id) — voir traceService.recordTraceView).
  useEffect(() => {
    if (!trace || isMine || viewedRef.current.has(trace.id)) return;
    viewedRef.current.add(trace.id);
    onView(trace.id);
  }, [trace?.id, isMine, onView]);

  // Progression photo : minuteur sur duration_seconds. Progression vidéo :
  // pilotée par la vraie lecture (onTimeUpdate/onEnded plus bas), pas simulée.
  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, [trace?.id]);

  useEffect(() => {
    if (!trace || trace.mediaType === "video" || paused) return;
    const durationMs = (trace.durationSeconds || 6) * 1000;
    const tickMs = 50;
    const id = setInterval(() => {
      elapsedRef.current += tickMs;
      const pct = Math.min(1, elapsedRef.current / durationMs);
      setProgress(pct);
      if (pct >= 1) goNext();
    }, tickMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace?.id, paused]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !trace || trace.mediaType !== "video") return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, trace?.id, trace?.mediaType]);

  const onPressStart = () => {
    heldRef.current = false;
    holdTimerRef.current = setTimeout(() => { heldRef.current = true; setPaused(true); }, 180);
  };
  const onPressEnd = (isRightSide) => {
    clearTimeout(holdTimerRef.current);
    if (heldRef.current) { setPaused(false); return; }
    if (isRightSide) goNext(); else goPrev();
  };

  if (!group || !trace) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "#000", display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 480, height: "100%", overflow: "hidden" }}>
        {trace.mediaType === "video" ? (
          <video
            key={trace.id}
            ref={videoRef}
            src={trace.mediaUrl}
            autoPlay
            playsInline
            onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) setProgress(v.currentTime / v.duration); }}
            onEnded={goNext}
            style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
          />
        ) : (
          <img src={trace.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        )}

        {/* Zones de tap (précédent / suivant) + maintien pour mettre en pause */}
        <div onPointerDown={onPressStart} onPointerUp={() => onPressEnd(false)} onPointerCancel={() => setPaused(false)} style={{ position: "absolute", left: 0, top: "calc(60px + env(safe-area-inset-top, 0px))", bottom: "calc(70px + env(safe-area-inset-bottom, 0px))", width: "35%", zIndex: 2 }} />
        <div onPointerDown={onPressStart} onPointerUp={() => onPressEnd(true)} onPointerCancel={() => setPaused(false)} style={{ position: "absolute", right: 0, top: "calc(60px + env(safe-area-inset-top, 0px))", bottom: "calc(70px + env(safe-area-inset-bottom, 0px))", width: "65%", zIndex: 2 }} />

        {/* Barres de progression */}
        <div className="flex gap-1" style={{ position: "absolute", top: "calc(10px + env(safe-area-inset-top, 0px))", left: 10, right: 10, zIndex: 3 }}>
          {group.traces.map((t, i) => (
            <div key={t.id} style={{ flex: 1, height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${i < traceIndex ? 100 : i === traceIndex ? progress * 100 : 0}%`, background: "#fff" }} />
            </div>
          ))}
        </div>

        {/* En-tête : auteur + fermeture */}
        <div className="flex items-center justify-between" style={{ position: "absolute", top: "calc(20px + env(safe-area-inset-top, 0px))", left: 12, right: 12, zIndex: 3 }}>
          <button onClick={() => onOpenProfile(group.username)} className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 30, height: 30, borderRadius: RADIUS.pill, background: colors.surfaceAlt, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {group.avatar ? <img src={group.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={14} color={colors.textFaint} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{isMine ? "Vous" : group.nom}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{formatRelativeDate(trace.createdAt)}</span>
          </button>
          <div className="flex items-center gap-1" style={{ zIndex: 4, position: "relative" }}>
            {isMine && (
              <button onClick={() => setConfirmDelete(true)} style={{ width: 32, height: 32, borderRadius: RADIUS.pill, background: "rgba(0,0,0,0.4)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Trash2 size={15} color="#fff" />
              </button>
            )}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: RADIUS.pill, background: "rgba(0,0,0,0.4)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="#fff" />
            </button>
          </div>
        </div>

        {/* Légende */}
        {trace.texte && (
          <div style={{ position: "absolute", left: 16, right: 16, bottom: `calc(${isMine ? 64 : 24}px + env(safe-area-inset-bottom, 0px))`, zIndex: 3, fontSize: 13.5, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.5)", textAlign: "center" }}>
            {trace.texte}
          </div>
        )}

        {/* Vues (propriétaire uniquement) */}
        {isMine && (
          <button onClick={() => setShowViewers(true)} className="flex items-center gap-1.5" style={{ position: "absolute", left: 16, bottom: "calc(22px + env(safe-area-inset-bottom, 0px))", zIndex: 3, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: RADIUS.pill, padding: "7px 12px", cursor: "pointer" }}>
            <Eye size={14} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{trace.viewCount ?? 0} vue{(trace.viewCount ?? 0) !== 1 ? "s" : ""}</span>
          </button>
        )}

        {paused && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, pointerEvents: "none" }}>
            <Pause size={40} color="rgba(255,255,255,0.85)" fill="rgba(255,255,255,0.85)" />
          </div>
        )}

        {confirmDelete && (
          <div style={{ position: "absolute", inset: 0, zIndex: 5, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 320, background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 6 }}>Supprimer cette Trace ?</div>
              <div style={{ fontSize: 12.5, color: colors.textSecondary, marginBottom: 16 }}>Elle disparaîtra immédiatement pour tout le monde.</div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Annuler</Button>
                <Button variant="primary" onClick={() => { onDelete(trace); goNext(); }}>Supprimer</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showViewers && <TraceViewersSheet traceId={trace.id} onClose={() => setShowViewers(false)} />}
    </div>
  );
}
function ScreenFil({ posts, profile, liked, saved, reposted, commentsByPost, following, myGroupIds, bellUsernames, onToggleFollow, onToggleBell, onOpenProfile, onLike, onSave, onRepost, onAddComment, onDelete, onDeleteComment, onEdit, onReport, onHide, onBlock, onEditRequest, onLoadComments, chromeMode = "full", traceGroups = [], onOpenTraceGroup, onCreateOwnTrace }) {
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
  //
  // L'ORDRE du fil est mémoïsé séparément des données affichées : liker/commenter
  // change post.likes/commentaires, ce qui changerait le score et rebattrait tout
  // le classement à chaque interaction (le post qu'on vient de liker "disparaît"
  // en sautant ailleurs dans la liste). On ne recalcule donc l'ordre que quand
  // l'ensemble réel des posts, l'onglet ou les abonnements changent — jamais
  // juste parce qu'un compteur a bougé — puis on relit les données à jour par id.
  const postIdsKey = posts.map((p) => p.id).join(",");
  const followingKey = following.join(",");
  const myGroupIdsKey = (myGroupIds || []).join(",");
  const orderedIds = useMemo(() => {
    const ctx = { blockedAuthors: [], hiddenPostIds: [], viewerIsMinor: profile.estMineur, following, interests: profile.interets || [], myGroupIds: myGroupIds || [], now: Date.now() };
    let ordered;
    if (tab === "pourtoi") ordered = buildFeed(posts, ctx);
    // Abonnements = chronologique strict (comme Vidéo - Vidéo) : on veut voir les
    // dernières publications des comptes suivis dans l'ordre, pas un classement
    // pondéré qui ferait remonter un ancien post populaire devant un tout nouveau.
    else if (tab === "abonnements") ordered = buildChronologicalFeed(posts.filter((p) => following.includes(p.username)), ctx);
    else ordered = buildDiscoverFeed(posts, { ...ctx, seenIds: getDiscoverSeenIds(profile.id) }); // Découvrir : pipeline dédié — voir buildDiscoverFeed()
    return ordered.map((p) => p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, postIdsKey, followingKey, myGroupIdsKey, profile.id, profile.estMineur]);
  const postsById = new Map(posts.map((p) => [p.id, p]));
  const visible = orderedIds.map((id) => postsById.get(id)).filter(Boolean);

  // Mémorise ce qui a été montré dans Découvrir pour ne pas le remontrer en
  // priorité la prochaine fois (persiste dans localStorage, survit au refresh).
  useEffect(() => {
    if (tab !== "decouvrir" || !profile.id || visible.length === 0) return;
    markDiscoverSeen(profile.id, visible.map((p) => p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, profile.id, visible.map((p) => p.id).join(",")]);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: chromeMode !== "hidden" ? "calc(74px + env(safe-area-inset-top, 0px))" : "env(safe-area-inset-top, 0px)",
          zIndex: 5,
          padding: "14px 16px 6px",
          opacity: chromeMode === "hidden" ? 0 : 1,
          transform: chromeMode === "hidden" ? "translateY(-140%)" : "translateY(0)",
          transition: "opacity 220ms ease, transform 220ms ease, top 260ms ease",
          pointerEvents: chromeMode === "hidden" ? "none" : "auto",
        }}
      >
        <SegmentedControl options={options} value={tab} onChange={setTab} />
      </div>
      <div style={{ marginTop: 14 }}><TraceBar groups={traceGroups} onOpenGroup={onOpenTraceGroup} onCreateOwn={onCreateOwnTrace} /></div>
      {visible.length === 0 ? (
        <EmptyState title="Aucun contenu pour le moment" subtitle={copy[tab]} />
      ) : (
        <div style={{ paddingTop: 14 }}>
          {visible.map((p) => (
            <PostCard
              onOpenProfile={onOpenProfile}
              key={p.id}
              post={p}
              liked={liked.includes(p.id)}
              saved={saved.includes(p.id)}
              reposted={reposted.includes(p.id)}
              onRepost={() => onRepost(p.id)}
              commentCount={commentsByPost[p.id] ? commentsByPost[p.id].length : (p.commentaires || 0)}
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
          isAdmin={profile.role === "admin"}
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
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} onDelete={onDeleteComment ? (commentId) => onDeleteComment(sheet.post.id, commentId) : undefined} meUsername={profile.username} onOpenProfile={onOpenProfile} />
      )}
    </div>
  );
}

/* ============================================================
   7. VIDÉO — VideoCard
   ============================================================ */
function FullScreenVideoPlayer({ video, onClose }) {
  const videoRef = useRef(null);
  if (!video) return null;

  // "Retourner" la vidéo façon YouTube : plein écran natif du <video> lui-même
  // (webkitEnterFullscreen sur iOS Safari, requestFullscreen ailleurs), qui
  // pivote automatiquement avec l'orientation de l'appareil. On tente en plus
  // un verrouillage paysage explicite là où l'API l'autorise (Android/Chrome) —
  // ignoré silencieusement si le navigateur ne le permet pas (ex. iOS Safari).
  const rotate = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (el.webkitEnterFullscreen) {
        el.webkitEnterFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch(() => {});
        }
      }
    } catch (e) { /* pas grave : les contrôles natifs du lecteur permettent quand même le plein écran */ }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, display: "flex", justifyContent: "space-between", padding: "16px", paddingTop: "calc(16px + env(safe-area-inset-top, 0px))" }}>
        <button onClick={rotate} aria-label="Plein écran / pivoter" style={{ background: "rgba(0,0,0,0.45)", border: "none", borderRadius: RADIUS.pill, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RotateCw size={16} color="#fff" />
        </button>
        <button onClick={onClose} aria-label="Fermer" style={{ background: "rgba(0,0,0,0.45)", border: "none", borderRadius: RADIUS.pill, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={18} color="#fff" />
        </button>
      </div>
      <video
        ref={videoRef}
        src={video.videoUrl}
        controls
        controlsList="noremoteplayback"
        disableRemotePlayback
        x-webkit-airplay="deny"
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "contain", margin: "auto" }}
      />
    </div>
  );
}
function VideoCard({ video, liked, reposted, commentCount, onLike, onRepost, onOpenComments, onOpenActions, onOpenAuthor, onOpenPlayer }) {
  const { colors } = useTheme();
  const canPlay = !!video.videoUrl;
  // Contenu sensible : miniature floutée + avertissement tant que non révélée
  // (même principe que SensitiveGate côté Fil) — un premier tap révèle la
  // miniature, un second lance la lecture, comme n'importe quelle vignette.
  const [revealed, setRevealed] = useState(false);
  const gated = video.contentRating === "sensitive" && !revealed;
  const [showShare, setShowShare] = useState(false);
  return (
    <div style={{ padding: "10px 16px 16px" }}>
      <div className="flex gap-3" style={{ alignItems: "stretch" }}>
        {/* Vidéo en grand */}
        <button
          onClick={gated ? () => setRevealed(true) : (canPlay ? onOpenPlayer : undefined)}
          disabled={!gated && !canPlay}
          style={{ flex: 1, minWidth: 0, aspectRatio: "16/9", borderRadius: RADIUS.md, background: colors.surfaceAlt, position: "relative", overflow: "hidden", border: "none", padding: 0, cursor: gated || canPlay ? "pointer" : "default" }}
        >
          {/* Vraie miniature (image capturée à l'envoi) en priorité — un <video>
              reste souvent noir tant qu'on n'a pas cliqué dessus, selon l'appareil. */}
          {video.image ? (
            <img src={video.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: gated ? "blur(16px)" : "none" }} />
          ) : video.videoUrl ? (
            <video src={video.videoUrl} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", filter: gated ? "blur(16px)" : "none" }} />
          ) : null}
          {gated ? (
            <div style={{ position: "absolute", inset: 0, background: "rgba(20,18,16,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 10, textAlign: "center", gap: 5 }}>
              <AlertTriangle size={17} color="#fff" strokeWidth={1.8} />
              <span style={{ fontSize: 10.5, color: "#fff", fontWeight: 700 }}>Contenu sensible</span>
              <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.85)" }}>Toucher pour afficher</span>
            </div>
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: RADIUS.pill, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={19} color="white" fill="white" />
              </div>
            </div>
          )}
          {video.duree && !gated && <span style={{ position: "absolute", right: 6, bottom: 6, fontSize: 10, color: "white", background: "rgba(0,0,0,0.55)", borderRadius: 5, padding: "1px 5px" }}>{video.duree}</span>}
        </button>
        {/* Pilule verticale d'actions — like/commentaire/repost/partage/plus
            regroupées, jamais collée au bord droit de la carte. */}
        <div className="flex flex-col items-center justify-center gap-3" style={{ flexShrink: 0, width: 40, background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: RADIUS.pill, padding: "12px 0", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <button onClick={onLike} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Heart size={17} color={liked ? colors.accent : colors.textFaint} fill={liked ? colors.accent : "none"} strokeWidth={1.8} />
            <span style={{ fontSize: 9.5, color: liked ? colors.accent : colors.textFaint, fontWeight: 600 }}>{video.likes || 0}</span>
          </button>
          <button onClick={onOpenComments} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <MessageSquare size={17} color={colors.textFaint} strokeWidth={1.8} />
            <span style={{ fontSize: 9.5, color: colors.textFaint, fontWeight: 600 }}>{commentCount}</span>
          </button>
          {onRepost && (
            <button onClick={onRepost} className="active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
              <Repeat2 size={17} color={reposted ? colors.accent : colors.textFaint} strokeWidth={1.8} />
            </button>
          )}
          <button onClick={() => setShowShare(true)} className="active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <Share2 size={16} color={colors.textFaint} strokeWidth={1.8} />
          </button>
          <button onClick={onOpenActions} className="active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <MoreHorizontal size={16} color={colors.textFaint} />
          </button>
        </div>
      </div>
      {video.titre && (
        <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.text, marginTop: 10, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{video.titre}</div>
      )}
      {/* Sous la vidéo — auteur uniquement, les actions sont déjà dans la pilule */}
      <button onClick={onOpenAuthor} className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, minWidth: 0, marginTop: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {video.avatar ? <img src={video.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={12} color={colors.textFaint} />}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{video.nom}</span>
        {video.duree && <span style={{ fontSize: 11, color: colors.textFaint, flexShrink: 0 }}>· {video.duree}</span>}
      </button>
      {showShare && <SharePostSheet item={video} onClose={() => setShowShare(false)} />}
    </div>
  );
}
/** Une "slide" plein écran vertical (façon TikTok/Reels) — lecture auto quand
 *  visible à plus de 60% (IntersectionObserver), pause sinon. Tap = pause/play,
 *  bouton dédié = muet/son. */
function InstantSlide({ item, liked, reposted, commentCount, onLike, onRepost, onOpenComments, onOpenActions, onOpenAuthor }) {
  const { colors } = useTheme();
  const videoRef = useRef(null);
  const slideRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  // Contenu sensible : flouté et mis en pause tant que l'utilisateur n'a pas
  // appuyé sur "Afficher le contenu" — même principe que SensitiveGate (Fil),
  // adapté à une vidéo qui joue automatiquement au lieu d'une image statique.
  const [revealed, setRevealed] = useState(false);
  const gated = item.contentRating === "sensitive" && !revealed;
  const gatedRef = useRef(gated);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    gatedRef.current = gated;
    if (gated) { videoRef.current?.pause(); setPlaying(false); }
  }, [gated]);

  useEffect(() => {
    const el = slideRef.current;
    const vid = videoRef.current;
    if (!el || !vid) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          if (!gatedRef.current) { vid.play().catch(() => {}); setPlaying(true); }
        } else {
          vid.pause();
          setPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play().catch(() => {}); setPlaying(true); }
    else { vid.pause(); setPlaying(false); }
  };

  return (
    <div ref={slideRef} style={{ position: "relative", width: "100%", height: "100%", scrollSnapAlign: "start", background: "#000", flexShrink: 0, overflow: "hidden" }}>
      {item.videoUrl ? (
        <video ref={videoRef} src={item.videoUrl} poster={item.image || undefined} loop muted={muted} playsInline onClick={togglePlay} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Film size={36} color="rgba(255,255,255,0.3)" /></div>
      )}
      {!playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ width: 56, height: 56, borderRadius: RADIUS.pill, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><Play size={26} color="#fff" fill="#fff" /></div>
        </div>
      )}
      <button onClick={() => setMuted((m) => !m)} style={{ position: "absolute", top: "calc(18px + env(safe-area-inset-top, 0px))", right: 14, width: 34, height: 34, borderRadius: RADIUS.pill, background: "rgba(20,20,20,0.4)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {muted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
      </button>
      <div style={{ position: "absolute", left: 0, right: 68, bottom: 0, padding: "0 16px calc(22px + env(safe-area-inset-bottom, 0px))", color: "#fff", pointerEvents: "none" }}>
        <button onClick={onOpenAuthor} className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 8, pointerEvents: "auto" }}>
          <div style={{ width: 30, height: 30, borderRadius: RADIUS.pill, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {item.avatar ? <img src={item.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={14} color="#fff" />}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{item.nom}</span>
        </button>
        {item.texte && <div style={{ fontSize: 12.5, lineHeight: 1.4, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{item.texte}</div>}
      </div>
      <div className="flex flex-col items-center gap-4" style={{ position: "absolute", right: 14, bottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        <button onClick={onLike} className="flex flex-col items-center gap-1 active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: "rgba(20,20,20,0.4)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={18} color={liked ? colors.accent : "#fff"} fill={liked ? colors.accent : "none"} strokeWidth={2} />
          </div>
          <span style={{ fontSize: 10.5, color: "#fff", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{item.likes || 0}</span>
        </button>
        <button onClick={onOpenComments} className="flex flex-col items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: "rgba(20,20,20,0.4)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={18} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontSize: 10.5, color: "#fff", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{commentCount}</span>
        </button>
        {onRepost && (
          <button onClick={onRepost} className="flex flex-col items-center gap-1 active:scale-90 transition-transform" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: "rgba(20,20,20,0.4)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Repeat2 size={18} color={reposted ? colors.accent : "#fff"} strokeWidth={2} />
            </div>
            <span style={{ fontSize: 10.5, color: reposted ? colors.accent : "#fff", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{item.reposts || 0}</span>
          </button>
        )}
        <button onClick={() => setShowShare(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: "rgba(20,20,20,0.4)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Share2 size={17} color="#fff" strokeWidth={2} />
          </div>
        </button>
        <button onClick={onOpenActions} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: "rgba(20,20,20,0.4)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MoreHorizontal size={17} color="#fff" />
          </div>
        </button>
      </div>
      {gated && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(20,18,16,0.6)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center", gap: 12 }}>
          <AlertTriangle size={24} color="#fff" strokeWidth={1.8} />
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>Contenu sensible</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, maxWidth: 260 }}>{CONTENT_RATINGS.sensitive.warning}</div>
          <button onClick={() => setRevealed(true)} style={{ marginTop: 4, background: "#fff", color: "#14170D", border: "none", borderRadius: RADIUS.pill, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Afficher le contenu</button>
        </div>
      )}
      {showShare && <SharePostSheet item={item} onClose={() => setShowShare(false)} />}
    </div>
  );
}
/** Carte compacte pour un Instant reposté (onglet Reposts d'un profil) — se
 *  distingue clairement d'une publication classique (badge "Instant") et
 *  ouvre l'Instant d'origine en plein écran au lieu de l'écraser dans une
 *  carte façon publication. */
function RepostedInstantCard({ item, onOpen }) {
  const { colors } = useTheme();
  return (
    <button onClick={() => onOpen(item)} className="flex items-center gap-3" style={{ width: "100%", background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "none", borderRadius: RADIUS.xl, padding: "10px 14px", margin: "0 12px 10px", cursor: "pointer", textAlign: "left", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ position: "relative", width: 52, height: 70, borderRadius: RADIUS.lg, overflow: "hidden", background: "#000", flexShrink: 0 }}>
        {item.image ? (
          <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: item.contentRating === "sensitive" ? "blur(10px)" : "none" }} />
        ) : item.videoUrl ? (
          <video src={item.videoUrl} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", filter: item.contentRating === "sensitive" ? "blur(10px)" : "none" }} />
        ) : null}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Play size={14} color="#fff" fill="#fff" />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="flex items-center gap-1" style={{ display: "inline-flex", fontSize: 10, fontWeight: 700, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "2px 8px 2px 6px", marginBottom: 5 }}>
          <Footprints size={10} /> Instant
        </span>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.text }}>{item.nom}</div>
        {item.texte && <div style={{ fontSize: 11.5, color: colors.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.texte}</div>}
      </div>
      <ChevronRight size={16} color={colors.textFaint} />
    </button>
  );
}
/** Visionneuse plein écran pour UN SEUL Instant, en dehors du fil — utilisée
 *  pour ouvrir "l'original" d'un Instant reposté depuis l'onglet Reposts. */
function SingleInstantViewer({ item, onClose, liked, reposted, commentCount, onLike, onRepost, onOpenComments, onOpenActions, onOpenAuthor }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "#000", display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 480, height: "100%" }}>
        <InstantSlide item={item} liked={liked} reposted={reposted} commentCount={commentCount} onLike={onLike} onRepost={onRepost} onOpenComments={onOpenComments} onOpenActions={onOpenActions} onOpenAuthor={onOpenAuthor} />
        <button onClick={onClose} style={{ position: "absolute", top: "calc(20px + env(safe-area-inset-top, 0px))", left: 14, zIndex: 10, width: 34, height: 34, borderRadius: RADIUS.pill, background: "rgba(0,0,0,0.45)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}
/** Fil plein écran vertical, défilement par slide (scroll-snap) — remplace la
 *  liste classique pour l'onglet "Instants". */
function InstantsFeed({ items, liked, reposted, commentsByPost, onLike, onRepost, onOpenComments, onOpenActions, onOpenAuthor, tabSwitcher, onChromeMode }) {
  // Instants a son propre conteneur de défilement (pas la fenêtre) — on
  // reproduit ici la même logique que le reste de l'app (masquer/pilule
  // flottante) pour un comportement cohérent partout, voir MainApp. Les
  // onglets flottants (Instants/Vidéos/Recherche) suivent le même mouvement.
  const [localMode, setLocalMode] = useState("full");
  const lastScrollTopRef = useRef(0);
  const handleScroll = (e) => {
    const top = e.currentTarget.scrollTop;
    const delta = top - lastScrollTopRef.current;
    let mode = null;
    if (top < 40) mode = "full";
    else if (delta > 4) mode = "hidden";
    else if (delta < -4) mode = "floating";
    if (mode) {
      setLocalMode(mode);
      onChromeMode?.(mode);
    }
    lastScrollTopRef.current = top;
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 15, background: "#000", display: "flex", justifyContent: "center" }}>
    <div style={{ position: "relative", width: "100%", maxWidth: 480, height: "100%", overflow: "hidden", background: "#000" }}>
      {tabSwitcher && (
        <div
          style={{
            position: "absolute",
            // Header principal maintenant flottant PAR-DESSUS Instants (voir
            // le zIndex du conteneur plein écran ci-dessus) — même décalage
            // que les autres sélecteurs d'onglets sous l'en-tête (top: 74),
            // + env(safe-area-inset-top) pour l'encoche en PWA plein écran.
            top: "calc(74px + env(safe-area-inset-top, 0px))",
            left: 0,
            right: 0,
            zIndex: 5,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            opacity: localMode === "hidden" ? 0 : 1,
            transform: localMode === "hidden" ? "translateY(-140%)" : "translateY(0)",
            transition: "opacity 220ms ease, transform 220ms ease",
          }}
        >
          <div style={{ pointerEvents: "auto" }}>{tabSwitcher}</div>
        </div>
      )}
      {items.length === 0 ? (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
          <EmptyState title="Aucun instant pour le moment" subtitle="Instants — le format court et vertical de PISTE — publiés par la communauté apparaîtront ici." />
        </div>
      ) : (
        <div onScroll={handleScroll} style={{ height: "100%", overflowY: "auto", scrollSnapType: "y mandatory" }}>
          {items.map((item) => (
            <InstantSlide
              key={item.id}
              item={item}
              liked={liked.includes(item.id)}
              reposted={reposted.includes(item.id)}
              commentCount={commentsByPost[item.id] ? commentsByPost[item.id].length : (item.commentaires || 0)}
              onLike={() => onLike(item.id)}
              onRepost={() => onRepost(item.id)}
              onOpenComments={() => onOpenComments(item)}
              onOpenActions={() => onOpenActions(item)}
              onOpenAuthor={() => onOpenAuthor(item)}
            />
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
function ScreenVideo({ videos, profile, liked, reposted, commentsByPost, following, bellUsernames, onToggleFollow, onToggleBell, onOpenProfile, onLike, onRepost, onAddComment, onDelete, onDeleteComment, onEditRequest, onReport, onHide, onBlock, onLoadComments, onOpenPlayer, onChromeMode, chromeMode = "full" }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState("instants");
  const [videoSubTab, setVideoSubTab] = useState("nouveautes");
  const [showFollowing, setShowFollowing] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [query, setQuery] = useState("");
  const options = [{ key: "instants", label: "Instants" }, { key: "videos", label: "Vidéos" }, { key: "recherche", label: "Recherche" }];
  const meName = profile.nom || "Vous";
  // "Nouveautés" = strictement chronologique (voir buildChronologicalFeed) :
  // une vidéo qui vient d'être publiée doit toujours prendre la première
  // place, jamais être devancée par une vidéo plus ancienne mieux notée.
  // Contrairement au Fil "Pour toi", pas de pondération affinité/interaction
  // ici. Ordre mémoïsé séparément des données, même raison que ScreenFil :
  // liker ne doit pas rebattre le classement.
  const followingKey = following.join(",");
  const videoIdsKey = videos.filter((v) => v.type === "video").map((v) => v.id).join(",");
  const instantIdsKey = videos.filter((v) => v.type === "video_courte").map((v) => v.id).join(",");
  const rankedIds = useMemo(() => {
    const ctx = { blockedAuthors: [], hiddenPostIds: [], viewerIsMinor: profile.estMineur };
    return buildChronologicalFeed(videos.filter((v) => v.type === "video"), ctx).map((v) => v.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoIdsKey, profile.estMineur]);
  const rankedInstantIds = useMemo(() => {
    const ctx = { blockedAuthors: [], hiddenPostIds: [], viewerIsMinor: profile.estMineur, following, interests: profile.interets || [], now: Date.now() };
    return buildFeed(videos.filter((v) => v.type === "video_courte"), ctx).map((v) => v.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instantIdsKey, followingKey, profile.estMineur]);
  const videosById = new Map(videos.map((v) => [v.id, v]));
  const ranked = rankedIds.map((id) => videosById.get(id)).filter(Boolean);
  const rankedInstants = rankedInstantIds.map((id) => videosById.get(id)).filter(Boolean);
  const visibleRanked = videoSubTab === "abonnements" ? ranked.filter((v) => following.includes(v.username)) : ranked;
  // Recherche sur les vraies vidéos déjà chargées depuis Supabase (titre/texte,
  // pseudo ou nom d'affichage de l'auteur) — pas de résultats inventés.
  const q = query.trim().toLowerCase();
  const searchResults = q
    ? videos.filter((v) => (v.titre || "").toLowerCase().includes(q) || (v.nom || "").toLowerCase().includes(q) || (v.username || "").toLowerCase().includes(q))
    : [];
  // Sur Instants, un bandeau d'en-tête classique (fond clair/sombre uni)
  // au-dessus d'une vidéo plein écran fait "encadré" — on affiche plutôt les
  // onglets flottants, translucides, directement par-dessus la vidéo.
  const darkTabSwitcher = (
    <div className="flex gap-1.5" style={{ background: "rgba(0,0,0,0.35)", borderRadius: RADIUS.pill, padding: 3, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      {options.map((o) => (
        <button key={o.key} onClick={() => setTab(o.key)} style={{ border: "none", background: tab === o.key ? "rgba(255,255,255,0.95)" : "transparent", color: tab === o.key ? "#14170D" : "#fff", borderRadius: RADIUS.pill, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
  return (
    <div style={{ position: "relative" }}>
      {tab !== "instants" && (
        <div
          style={{
            position: "sticky",
            top: chromeMode !== "hidden" ? "calc(74px + env(safe-area-inset-top, 0px))" : "env(safe-area-inset-top, 0px)",
            zIndex: 5,
            padding: "14px 16px 6px",
            opacity: chromeMode === "hidden" ? 0 : 1,
            transform: chromeMode === "hidden" ? "translateY(-140%)" : "translateY(0)",
            transition: "opacity 220ms ease, transform 220ms ease, top 260ms ease",
            pointerEvents: chromeMode === "hidden" ? "none" : "auto",
          }}
        >
          <SegmentedControl options={options} value={tab} onChange={setTab} />
        </div>
      )}
      {tab === "videos" && (
        <div className="flex items-center gap-2 px-4" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <SegmentedControl options={[{ key: "nouveautes", label: "Nouveautés" }, { key: "abonnements", label: "Abonnements" }]} value={videoSubTab} onChange={setVideoSubTab} />
          </div>
          <button onClick={() => setShowFollowing(true)} aria-label="Mes abonnements" style={{ width: 38, height: 38, borderRadius: RADIUS.pill, background: colors.surfaceAlt, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <Users size={16} color={colors.textFaint} />
          </button>
        </div>
      )}
      {tab === "recherche" ? (
        <div>
          <div className="flex items-center gap-2 mx-4" style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.pill, padding: "10px 14px", marginTop: 12 }}>
            <Search size={17} color={colors.textFaint} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une vidéo, un instant, un créateur" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: colors.text, flex: 1 }} />
          </div>
          {!q ? (
            <EmptyState title="Rechercher une vidéo" subtitle="Lancez une recherche pour trouver des vidéos publiées par la communauté." />
          ) : searchResults.length === 0 ? (
            <EmptyState title="Aucun résultat" subtitle={`Aucune vidéo ne correspond à « ${query} ».`} />
          ) : (
            <div style={{ paddingTop: 12 }}>
              {searchResults.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  liked={liked.includes(v.id)}
                  reposted={reposted.includes(v.id)}
                  commentCount={commentsByPost[v.id] ? commentsByPost[v.id].length : (v.commentaires || 0)}
                  onLike={() => onLike(v.id)}
                  onRepost={v.type === "video" ? undefined : () => onRepost(v.id)}
                  onOpenComments={() => { setSheet({ type: "comments", post: v }); onLoadComments(v.id); }}
                  onOpenActions={() => setSheet({ type: "actions", post: v })}
                  onOpenAuthor={() => onOpenProfile(v.username)}
                  onOpenPlayer={() => onOpenPlayer(v)}
                />
              ))}
            </div>
          )}
        </div>
      ) : tab === "instants" ? (
        <InstantsFeed
          items={rankedInstants}
          liked={liked}
          reposted={reposted}
          commentsByPost={commentsByPost}
          onLike={onLike}
          onRepost={onRepost}
          onOpenComments={(v) => { setSheet({ type: "comments", post: v }); onLoadComments(v.id); }}
          onOpenActions={(v) => setSheet({ type: "actions", post: v })}
          onOpenAuthor={(v) => onOpenProfile(v.username)}
          tabSwitcher={darkTabSwitcher}
          onChromeMode={onChromeMode}
        />
      ) : visibleRanked.length > 0 ? (
        <div style={{ paddingTop: 6 }}>
          {visibleRanked.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              liked={liked.includes(v.id)}
              reposted={reposted.includes(v.id)}
              commentCount={commentsByPost[v.id] ? commentsByPost[v.id].length : (v.commentaires || 0)}
              onLike={() => onLike(v.id)}
              onOpenComments={() => { setSheet({ type: "comments", post: v }); onLoadComments(v.id); }}
              onOpenActions={() => setSheet({ type: "actions", post: v })}
              onOpenAuthor={() => onOpenProfile(v.username)}
              onOpenPlayer={() => onOpenPlayer(v)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={videoSubTab === "abonnements" ? "Aucune vidéo de vos abonnements" : "Aucune vidéo pour le moment"}
          subtitle={videoSubTab === "abonnements" ? "Les vidéos publiées par les comptes que vous suivez apparaîtront ici." : "Les vidéos publiées par la communauté apparaîtront ici."}
        />
      )}
      {showFollowing && <FollowListSheet userId={profile.id} mode="following" onClose={() => setShowFollowing(false)} onOpenProfile={onOpenProfile} />}
      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={sheet.post.nom === meName}
          isAdmin={profile.role === "admin"}
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
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} onDelete={onDeleteComment ? (commentId) => onDeleteComment(sheet.post.id, commentId) : undefined} meUsername={profile.username} onOpenProfile={onOpenProfile} />
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
function GroupPage({ group, onClose, onToggleJoin, onCreatePost, onGroupUpdated, onOpenProfile, profile, liked, saved, reposted, commentsByPost, onLike, onSave, onRepost, onAddComment, onDelete, onDeleteComment, onEditRequest, onReport, onHide, onBlock, onLoadComments }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState("publications");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [localMode, setLocalMode] = useState("full");
  const lastScrollTopRef = useRef(0);
  const handleScroll = (e) => {
    const el = e.currentTarget;
    const top = el.scrollTop;
    // Pas assez de contenu pour justifier l'effet immersif (ex. une communauté
    // sans publication) : le léger dépassement de scroll ne doit pas cacher
    // l'en-tête pour rien, alors qu'il n'y a rien de plus à voir en dessous.
    if (el.scrollHeight - el.clientHeight < 80) { setLocalMode("full"); lastScrollTopRef.current = top; return; }
    const delta = top - lastScrollTopRef.current;
    if (top < 40) setLocalMode("full");
    else if (delta > 4) setLocalMode("hidden");
    else if (delta < -4) setLocalMode("floating");
    lastScrollTopRef.current = top;
  };
  const tabs = [["publications", "Publications"], ["videos", "Vidéos"], ["discussions", "Discussions"], ["membres", "Membres"]];
  const meName = profile?.nom || "Vous";
  // La policy RLS "creator or admin updates group" (001_init.sql) applique déjà
  // cette même règle côté base — ce contrôle ici n'est qu'un raccourci d'UX.
  // Les communautés prédéfinies PISTE (created_by = NULL) ne sont modifiables
  // que par un admin — un simple membre rejoint ne peut pas changer la photo,
  // même si c'est lui qui a créé la communauté (alors createdBy le couvre déjà).
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
  const swipeBack = useSwipeBack(onClose);

  return (
    <div ref={swipeBack} style={{ position: "absolute", inset: 0, zIndex: 45, background: colors.background, display: "flex", flexDirection: "column" }}>
      <div onScroll={handleScroll} style={{ flex: 1, overflowY: "auto" }}>
        <ScreenHeader title={group.nom} onBack={onClose} chromeMode={localMode} />
        <div style={{ position: "relative", marginTop: 10, borderRadius: RADIUS.xl, overflow: "hidden" }}>
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
                aria-label="Changer l'image de la communauté"
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
        <div
          style={{
            position: "sticky",
            top: localMode !== "hidden" ? "calc(74px + env(safe-area-inset-top, 0px))" : "env(safe-area-inset-top, 0px)",
            zIndex: 5,
            padding: "10px 16px",
            background: colors.background,
            opacity: localMode === "hidden" ? 0 : 1,
            transform: localMode === "hidden" ? "translateY(-140%)" : "translateY(0)",
            transition: "opacity 220ms ease, transform 220ms ease, top 260ms ease",
            pointerEvents: localMode === "hidden" ? "none" : "auto",
          }}
        >
          <SegmentedControl options={tabs.map(([k, l]) => ({ key: k, label: l }))} value={tab} onChange={setTab} />
        </div>
        {tab === "publications" ? (
          loading ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: colors.textFaint }}>Chargement...</div>
          ) : groupPosts.length === 0 ? (
            <EmptyState title="Aucune publication" subtitle="Les publications de cette communauté apparaîtront ici." />
          ) : (
            <div style={{ paddingTop: 6 }}>
              {groupPosts.map((p) => (
                <PostCard
                  onOpenProfile={onOpenProfile}
                  key={p.id}
                  post={p}
                  liked={liked.includes(p.id)}
                  saved={saved.includes(p.id)}
                  reposted={reposted.includes(p.id)}
                  onRepost={() => onRepost(p.id)}
                  commentCount={commentsByPost[p.id] ? commentsByPost[p.id].length : (p.commentaires || 0)}
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
            <EmptyState title="Aucun membre" subtitle="Les membres de cette communauté apparaîtront ici." />
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
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "3px 9px" }}>Admin de la communauté</span>
                  )}
                </button>
              ))}
            </div>
          )
        ) : (
          <EmptyState title="Aucun contenu" subtitle={`La section « ${tabs.find((t) => t[0] === tab)[1]} » de cette communauté est vide pour le moment.`} />
        )}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}><Button onClick={() => { onClose(); onCreatePost(group.id); }}>Publier dans cette communauté</Button></div>
      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={sheet.post.nom === meName}
          isAdmin={profile.role === "admin"}
          onClose={() => setSheet(null)}
          onEdit={() => { setSheet(null); onEditRequest(sheet.post); }}
          onDelete={() => { onDelete(sheet.post.id); setSheet(null); setPosts((p) => p.filter((x) => x.id !== sheet.post.id)); }}
          onReport={() => setSheet({ type: "report", post: sheet.post })}
          onHide={() => { onHide(sheet.post.id); setPosts((p) => p.filter((x) => x.id !== sheet.post.id)); setSheet(null); }}
          onBlock={() => { onBlock(sheet.post.username); setSheet(null); }}
        />
      )}
      {sheet?.type === "report" && (
        <ReportSheet onClose={() => setSheet(null)} onSubmit={(reason) => onReport({ targetId: sheet.post.id, targetType: "post", reason })} />
      )}
      {sheet?.type === "comments" && (
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} onDelete={onDeleteComment ? (commentId) => onDeleteComment(sheet.post.id, commentId) : undefined} meUsername={profile.username} onOpenProfile={onOpenProfile} />
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
      setError(e.message || "Impossible de créer cette communauté pour le moment.");
    } finally {
      setSaving(false);
    }
  };
  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "absolute", inset: 0, zIndex: 46, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Créer une communauté" onCloseX={onClose} />
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
        <TextField label="Nom de la communauté" value={nom} onChange={setNom} placeholder="ex : Approche en Normandie" />
        <TextField label="Description" value={description} onChange={setDescription} placeholder="Décrivez l'objet de cette communauté." textarea />
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>CATÉGORIE</div>
        <div className="flex flex-wrap gap-2">{GROUP_CATEGORIES.map((c) => <Chip key={c} label={c} active={categorie === c} onClick={() => setCategorie(categorie === c ? null : c)} />)}</div>
        {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error, marginTop: 16 }}>{error}</div>}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}><Button disabled={!nom || saving} onClick={submit}>{saving ? "Création..." : "Créer la communauté"}</Button></div>
    </div>
  );
}
function ScreenGroupes({ groups, addGroup, onToggleJoin, onCreatePost, onGroupUpdated, onOpenProfile, profile, liked, saved, reposted, commentsByPost, onLike, onSave, onRepost, onAddComment, onDelete, onDeleteComment, onEditRequest, onReport, onHide, onBlock, onLoadComments, chromeMode = "full" }) {
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
      <div
        style={{
          position: "sticky",
          top: chromeMode !== "hidden" ? "calc(74px + env(safe-area-inset-top, 0px))" : "env(safe-area-inset-top, 0px)",
          zIndex: 5,
          background: colors.headerBg,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          margin: chromeMode !== "hidden" ? "0 8px" : 0,
          borderRadius: chromeMode !== "hidden" ? RADIUS.xl : 0,
          boxShadow: chromeMode !== "hidden" ? "0 4px 20px rgba(0,0,0,0.18)" : "none",
          opacity: chromeMode === "hidden" ? 0 : 1,
          transform: chromeMode === "hidden" ? "translateY(-130%)" : "translateY(0)",
          transition: "transform 260ms ease, top 260ms ease, margin 260ms ease, border-radius 260ms ease, box-shadow 260ms ease, opacity 220ms ease",
          pointerEvents: chromeMode === "hidden" ? "none" : "auto",
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>Communautés</span>
          <button onClick={() => setCreating(true)} style={{ border: `1px solid ${colors.accent}`, color: colors.accent, background: "transparent", borderRadius: RADIUS.pill, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Créer</button>
        </div>
        <div className="px-4 pb-4"><div className="flex items-center gap-2" style={{ background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "10px 14px" }}>
          <Search size={17} color={colors.textFaint} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une communauté" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: colors.text, flex: 1 }} />
        </div></div>
      </div>

      {joined.length > 0 && (
        <div className="px-4" style={{ paddingTop: 22, paddingBottom: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, marginBottom: 8 }}>COMMUNAUTÉS REJOINTES</div>
        </div>
      )}
      {joined.length > 0 && <div className="grid grid-cols-2 gap-3 px-4 pb-4">{joined.map((g) => <GroupCategoryTile key={g.id} group={g} onOpen={setOpenGroup} />)}</div>}

      {filtered.length === 0 ? (
        <EmptyState title="Aucune communauté trouvée" subtitle="Essayez un autre mot-clé ou créez votre propre communauté." ctaLabel="Créer une communauté" onCta={() => setCreating(true)} />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4" style={{ paddingTop: joined.length > 0 ? 12 : 22 }}>{filtered.map((g) => <GroupCategoryTile key={g.id} group={g} onOpen={setOpenGroup} />)}</div>
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
          onDeleteComment={onDeleteComment}
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
// Simplifié à 4 choix (voir CreateFlow) — "Photo", "Discussion" et "Sortie"
// n'apportaient rien que "Publication" ne couvre pas déjà (texte + photo),
// et "Sondage" est maintenant une option DANS "Publication" plutôt qu'un
// type séparé (voir addPoll, ComposeScreen).
const CREATE_OPTIONS = [
  { key: "trace", label: "Trace", icon: Footprints },
  { key: "video_courte", label: "Instant", icon: Film },
  { key: "video", label: "Vidéo", icon: Video },
  { key: "publication", label: "Publication", icon: TypeIcon },
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
  const [mediaDurations, setMediaDurations] = useState([]);
  const [mediaError, setMediaError] = useState("");
  const [titre, setTitre] = useState(editingPost?.titre || "");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [addPoll, setAddPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [identifiedUsers, setIdentifiedUsers] = useState([]);
  const [contentRating, setContentRating] = useState(editingPost?.contentRating || "normal"); // 'restricted' réservé à la modération
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const isMedia = type === "photo" || type === "video" || type === "video_courte" || type === "publication";
  // "sondage"/"discussion" ne sont plus proposés à la création (voir
  // CREATE_OPTIONS) mais restent de vrais types en base pour l'édition d'un
  // post déjà publié dans l'un de ces types.
  const isPost = type === "publication" || type === "sondage" || type === "discussion" || isMedia;
  // Sondage : uniquement à la création d'une "Publication", jamais un type à
  // part (voir CREATE_OPTIONS) — éditer les options d'un sondage déjà publié
  // n'est pas proposé (les votes existants perdraient leur sens).
  const isPoll = !editingPost && type === "publication" && addPoll;
  const isVideoType = type === "video" || type === "video_courte";
  const canIdentify = type === "publication";
  const captionLabel = isPoll ? "Question du sondage" : "Description";

  // Sonde durée + dimensions réelles d'une vidéo côté navigateur, sans
  // dépendre du serveur — sert à faire respecter "Instant = vertical, max 1
  // min" et "Vidéo = horizontale, max 30 min" dès la sélection du fichier.
  const probeVideoMeta = (file) => new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = URL.createObjectURL(file);
    const timer = setTimeout(() => { URL.revokeObjectURL(v.src); resolve(null); }, 6000);
    v.onloadedmetadata = () => {
      clearTimeout(timer);
      const meta = { durationSeconds: v.duration || 0, width: v.videoWidth, height: v.videoHeight };
      URL.revokeObjectURL(v.src);
      resolve(meta);
    };
    v.onerror = () => { clearTimeout(timer); URL.revokeObjectURL(v.src); resolve(null); };
  });

  const pickMedia = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setMediaError("");
    if (!isVideoType) { setMediaFiles(files); return; }
    const maxSeconds = type === "video_courte" ? 60 : 1800;
    const valid = [];
    const durations = [];
    for (const f of files) {
      if (!f.type.startsWith("video")) { valid.push(f); durations.push(null); continue; }
      const meta = await probeVideoMeta(f);
      // Sonde impossible (format que le navigateur ne sait pas lire) : on ne
      // bloque pas la publication pour ça, juste la vérification elle-même.
      if (!meta) { valid.push(f); durations.push(null); continue; }
      if (meta.durationSeconds > maxSeconds) {
        setMediaError(type === "video_courte" ? "Un Instant ne peut pas dépasser 1 minute." : "Une vidéo ne peut pas dépasser 30 minutes.");
        continue;
      }
      if (type === "video_courte" && meta.width >= meta.height) {
        setMediaError("Un Instant doit être filmé à la verticale.");
        continue;
      }
      if (type === "video" && meta.height >= meta.width) {
        setMediaError("Une vidéo doit être filmée à l'horizontale.");
        continue;
      }
      valid.push(f);
      durations.push(Math.round(meta.durationSeconds));
    }
    setMediaFiles(valid);
    setMediaDurations(durations);
  };

  const pickThumbnail = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    setSaving(true);
    setError(false);
    // Les personnes identifiées s'ajoutent au texte en @mentions réelles —
    // même mécanisme que les commentaires/le carnet, jamais une simple
    // étiquette décorative : extractMentions() les récupère ensuite pour de
    // vrai (notification, lien cliquable).
    const finalText = identifiedUsers.length > 0
      ? `${text.trim()}${text.trim() ? "\n\n" : ""}${identifiedUsers.map((u) => `@${u.username}`).join(" ")}`
      : text;
    // Un sondage reste stocké comme un post de type "sondage" (inchangé côté
    // base/Fil) — seule la façon de le créer change : plus un type séparé,
    // une simple option dans "Publication" (voir isPoll).
    const savedType = isPoll ? "sondage" : type;
    try {
      if (isPost) {
        // Chemin réel (Supabase) — publication/photo/vidéo/instant/sondage.
        if (editingPost) {
          const updated = await postService.updatePost(editingPost.id, {
            texte: finalText, titre: type === "video" ? titre : undefined, animal, pratique, departement, contentRating,
          });
          setSaving(false);
          onPublished({ ...editingPost, texte: updated.texte, titre: updated.titre || updated.texte, animal: updated.animal, pratique: updated.pratique, contentRating: updated.content_rating, hashtags: updated.hashtags, mentions: updated.mentions });
        } else {
          const saved = await postService.createPost({
            texte: finalText, titre: type === "video" ? titre : null, type: savedType, animal, pratique,
            dogId,
            departement, contentRating, mediaFiles, mediaDurations, thumbnailFile: type === "video" ? thumbnailFile : null, groupId,
            pollOptions: isPoll ? pollOptions : [],
          });
          setSaving(false);
          onPublished({
            id: saved.id, nom: authorName, avatar: null,
            texte: saved.texte,
            image: saved.media?.[0]?.type === "video" ? saved.media?.[0]?.thumbnail_url || null : saved.media?.[0]?.url || null,
            videoUrl: saved.media?.[0]?.type === "video" ? saved.media[0].url : null,
            type: saved.type, animal: saved.animal, pratique: saved.pratique,
            contentRating: saved.content_rating, hashtags: saved.hashtags || [], mentions: saved.mentions || [],
            likes: 0, commentaires: 0, date: "à l'instant", createdAt: Date.now(), titre: saved.titre || saved.texte,
          });
        }
      }
    } catch (e) {
      setSaving(false);
      setError(true);
    }
  };


  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "absolute", inset: 0, zIndex: 70, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title={label} onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        <TextField label={captionLabel} value={text} onChange={setText} placeholder="Ajouter une description... (#hashtag, @mention)" textarea rows={isPoll ? 2 : 4} />

        {type === "video" && !editingPost && (
          <TextField label="Titre de la vidéo" value={titre} onChange={setTitre} placeholder="ex : Approche matinale en forêt" />
        )}

        {isMedia && !editingPost && (
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="piste-media-input"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: `1.5px dashed ${colors.border}`, borderRadius: RADIUS.md, padding: "22px 14px", textAlign: "center", cursor: "pointer" }}
            >
              <ImageIcon size={20} color={colors.textFaint} />
              <span style={{ fontSize: 12.5, color: colors.textFaint }}>
                {mediaFiles.length > 0
                  ? `${mediaFiles.length} fichier${mediaFiles.length > 1 ? "s" : ""} sélectionné${mediaFiles.length > 1 ? "s" : ""}`
                  : type === "publication" ? "Ajouter une photo (facultatif)" : "Choisir une ou plusieurs images/vidéos"}
              </span>
              {type === "video_courte" && <span style={{ fontSize: 11, color: colors.textFaint }}>Format vertical, 1 minute maximum</span>}
              {type === "video" && <span style={{ fontSize: 11, color: colors.textFaint }}>Format horizontal, 30 minutes maximum</span>}
            </label>
            <input
              id="piste-media-input"
              type="file"
              accept={isVideoType ? "video/*" : "image/*"}
              multiple
              onChange={pickMedia}
              style={{ display: "none" }}
            />
            {mediaError && <div style={{ marginTop: 8, fontSize: 12, color: colors.error }}>{mediaError}</div>}
            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
                {mediaFiles.map((f, i) => (
                  <span key={i} style={{ fontSize: 11, color: colors.textSecondary, background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "4px 10px" }}>{f.name}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {type === "video" && !editingPost && mediaFiles.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.textSecondary, marginBottom: 6, display: "block" }}>Miniature (facultatif)</label>
            <input id="piste-thumb-input" type="file" accept="image/*" onChange={pickThumbnail} style={{ display: "none" }} />
            <label htmlFor="piste-thumb-input" className="flex items-center gap-3" style={{ cursor: "pointer" }}>
              <div style={{ width: 66, height: 66, borderRadius: RADIUS.lg, background: colors.surfaceAlt, border: thumbnailPreview ? "none" : `1.5px dashed ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {thumbnailPreview ? <img src={thumbnailPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={18} color={colors.textFaint} />}
              </div>
              <span style={{ fontSize: 12, color: colors.textFaint }}>{thumbnailPreview ? "Changer l'image de miniature" : "Sinon, une image sera extraite automatiquement de la vidéo"}</span>
            </label>
          </div>
        )}

        {type === "publication" && !editingPost && (
          <div style={{ marginBottom: 16 }}>
            <ToggleRow label="Ajouter un sondage" value={addPoll} onToggle={() => setAddPoll((v) => !v)} />
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

        {canIdentify && !editingPost && (
          <UserPickerField
            label="Identifier des personnes (optionnel)"
            selected={identifiedUsers}
            onChange={setIdentifiedUsers}
            placeholder="Rechercher un pseudo..."
          />
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
/** Création d'une Trace — flux volontairement séparé de ComposeScreen : une
 *  Trace n'a ni animal/pratique/sondage/sortie, juste un média + légende
 *  optionnelle, et publie via traceService (table dédiée), pas postService. */
function TraceComposeScreen({ onClose, onPublished }) {
  const { colors } = useTheme();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'photo' | 'video'
  const [texte, setTexte] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMediaType(f.type.startsWith("video") ? "video" : "photo");
    setError("");
  };

  const submit = async () => {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const trace = await traceService.createTrace({ file, texte: texte.trim() || null });
      onPublished(trace);
    } catch (e) {
      setError(e.message || "Impossible de publier cette Trace pour le moment.");
      setSaving(false);
    }
  };

  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "fixed", inset: 0, zIndex: 70, background: colors.background, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title="Nouvelle Trace" onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        <input ref={inputRef} type="file" accept="image/*,video/*" onChange={pick} style={{ display: "none" }} />
        {!preview ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2"
            style={{ width: "100%", aspectRatio: "9/14", border: `1.5px dashed ${colors.border}`, borderRadius: RADIUS.xl, background: colors.surfaceAlt, cursor: "pointer" }}
          >
            <Footprints size={26} color={colors.textFaint} />
            <span style={{ fontSize: 12.5, color: colors.textFaint, fontWeight: 600 }}>Choisir une photo ou une vidéo</span>
            <span style={{ fontSize: 11, color: colors.textFaint }}>Visible 24 heures</span>
          </button>
        ) : (
          <div style={{ position: "relative", width: "100%", aspectRatio: "9/14", borderRadius: RADIUS.xl, overflow: "hidden", background: "#000" }}>
            {mediaType === "video" ? (
              <video src={preview} muted autoPlay loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <button
              onClick={() => inputRef.current?.click()}
              style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: RADIUS.pill, background: "rgba(0,0,0,0.45)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Camera size={16} color="#fff" />
            </button>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <TextField label="Légende (optionnelle)" value={texte} onChange={setTexte} placeholder="Ajouter une légende..." />
        </div>
        {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error }}>{error}</div>}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}>
        <Button disabled={!file || saving} onClick={submit}>{saving ? "Publication..." : "Publier ma Trace"}</Button>
      </div>
    </div>
  );
}
function CreateFlow({ open, onClose, dogs, onPublished, onTraceCreated, authorName, editingPost, onEdited, groupId, initialType }) {
  const { colors } = useTheme();
  const [step, setStep] = useState(editingPost ? "compose" : initialType ? "compose" : "pick");
  const [type, setType] = useState(editingPost ? editingPost.type : initialType || null);
  useEffect(() => {
    if (editingPost) { setType(editingPost.type); setStep("compose"); }
  }, [editingPost]);
  useEffect(() => {
    if (initialType && !editingPost) { setType(initialType); setStep("compose"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialType]);
  if (!open) return null;
  const close = () => { setStep("pick"); setType(null); onClose(); };
  if (step === "compose" && type === "trace") {
    return <TraceComposeScreen onClose={close} onPublished={(trace) => { close(); onTraceCreated(trace); }} />;
  }
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
  // Pilule unique à 4 choix (au lieu d'une grille 2x4 avec Photo/Discussion/
  // Sondage/Sortie séparés) — "simplifier" demandé explicitement : Photo et
  // Sondage vivent maintenant dans "Publication" (voir ComposeScreen).
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      <div onClick={close} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`, pointerEvents: "none" }}>
        <div className="flex" style={{ width: "100%", maxWidth: 400, background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.pill, boxShadow: "0 12px 40px rgba(0,0,0,0.22)", padding: 6, gap: 2, pointerEvents: "auto" }}>
          {CREATE_OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <button key={o.key} onClick={() => { setType(o.key); setStep("compose"); }} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform" style={{ flex: 1, border: "none", borderRadius: RADIUS.pill, padding: "10px 4px 8px", background: "transparent", cursor: "pointer" }}>
                <div style={{ width: 38, height: 38, borderRadius: RADIUS.pill, background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={17} color={colors.accent} strokeWidth={1.8} /></div>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>{o.label}</span>
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
  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "absolute", inset: 0, zIndex: 50, background: colors.background, display: "flex", flexDirection: "column" }}>
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
  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "absolute", inset: 0, zIndex: 65, background: colors.background, display: "flex", flexDirection: "column" }}>
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
          {["Chien d'arrêt", "Chien courant", "Chien leveur", "Chien de terrier", "Chien de rouge", "Autre"].map((s) => <Chip key={s} label={s} active={specialite === s} onClick={() => setSpecialite(specialite === s ? null : s)} />)}
        </div>
        <TextField label="Description" value={description} onChange={setDescription} placeholder="Quelques mots sur votre compagnon de chasse." textarea />
        {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error }}>{error}</div>}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}><Button disabled={!nom || saving} onClick={submit}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></div>
    </div>
  );
}
function DogPage({ dog, onClose, onOpenProfile, onOpenPlayer, meUsername, isAdmin, liked = [], saved = [], reposted = [], commentsByPost = {}, onLike, onSave, onRepost, onAddComment, onDelete, onDeleteComment, onEditRequest, onReport, onHide, onBlock, onLoadComments }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState("photos");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null); // { type: 'actions'|'report'|'comments', post }
  const tabs = [["photos", "Photos"], ["videos", "Vidéos"], ["publications", "Publications"]];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    postService.fetchPostsByDog(dog.id)
      .then((rows) => { if (!cancelled) setPosts(rows.map(mapPostRow)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dog.id]);

  const filtered = posts.filter((p) => {
    if (tab === "videos") return p.type === "video" || p.type === "video_courte";
    if (tab === "photos") return p.type !== "video" && p.type !== "video_courte" && !!p.image;
    return p.type !== "video" && p.type !== "video_courte"; // publications : tout le reste, avec ou sans image
  });

  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "absolute", inset: 0, zIndex: 45, background: colors.background, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title={dog.nom} onBack={onClose} />
      <div className="px-5 pt-4">
        <div style={{ width: 64, height: 64, borderRadius: RADIUS.md, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, overflow: "hidden" }}>
          {dog.photo_url ? <img src={dog.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Dog size={26} color={colors.textFaint} />}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>{dog.nom}</div>
        <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 2 }}>{[dog.race, dog.sexe, dog.age && `${dog.age} ans`, dog.specialite].filter(Boolean).join(" · ")}</div>
        {dog.description && <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 8, lineHeight: 1.5 }}>{dog.description}</div>}
      </div>
      <div className="px-4 pt-4">
        <SegmentedControl options={tabs.map(([k, l]) => ({ key: k, label: l }))} value={tab} onChange={setTab} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, padding: 24 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Aucun contenu" subtitle={`Les ${tabs.find((t) => t[0] === tab)[1].toLowerCase()} où ${dog.nom} est identifié apparaîtront ici.`} />
        ) : tab === "videos" ? (
          filtered.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              liked={liked.includes(v.id)}
              reposted={reposted.includes(v.id)}
              commentCount={commentsByPost[v.id] ? commentsByPost[v.id].length : (v.commentaires || 0)}
              onLike={() => onLike?.(v.id)}
              onRepost={() => onRepost?.(v.id)}
              onOpenComments={() => { setSheet({ type: "comments", post: v }); onLoadComments?.(v.id); }}
              onOpenActions={() => setSheet({ type: "actions", post: v })}
              onOpenAuthor={() => onOpenProfile?.(v.username)}
              onOpenPlayer={() => onOpenPlayer?.(v)}
            />
          ))
        ) : (
          filtered.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              liked={liked.includes(p.id)}
              saved={saved.includes(p.id)}
              reposted={reposted.includes(p.id)}
              commentCount={commentsByPost[p.id] ? commentsByPost[p.id].length : (p.commentaires || 0)}
              onLike={() => onLike?.(p.id)}
              onSave={() => onSave?.(p.id)}
              onRepost={() => onRepost?.(p.id)}
              onOpenComments={() => { setSheet({ type: "comments", post: p }); onLoadComments?.(p.id); }}
              onOpenActions={() => setSheet({ type: "actions", post: p })}
              onOpenAuthor={() => onOpenProfile?.(p.username)}
              onOpenProfile={onOpenProfile}
            />
          ))
        )}
      </div>
      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={sheet.post.username === meUsername}
          isAdmin={isAdmin}
          onClose={() => setSheet(null)}
          onEdit={() => { setSheet(null); onEditRequest?.(sheet.post); }}
          onDelete={() => { onDelete?.(sheet.post.id); setPosts((ps) => ps.filter((x) => x.id !== sheet.post.id)); setSheet(null); }}
          onReport={() => setSheet({ type: "report", post: sheet.post })}
          onHide={() => { onHide?.(sheet.post.id); setPosts((ps) => ps.filter((x) => x.id !== sheet.post.id)); setSheet(null); }}
          onBlock={() => { onBlock?.(sheet.post.username); setSheet(null); }}
        />
      )}
      {sheet?.type === "report" && (
        <ReportSheet onClose={() => setSheet(null)} onSubmit={(reason) => { onReport?.({ targetId: sheet.post.id, targetType: "post", reason }); setSheet(null); }} />
      )}
      {sheet?.type === "comments" && (
        <CommentsSheet
          comments={commentsByPost[sheet.post.id] || []}
          onClose={() => setSheet(null)}
          onAdd={(texte, parentId) => onAddComment?.(sheet.post.id, texte, parentId)}
          onDelete={onDeleteComment ? (commentId) => onDeleteComment(sheet.post.id, commentId) : undefined}
          meUsername={meUsername}
          onOpenProfile={onOpenProfile}
        />
      )}
    </div>
  );
}
/** Ouvre UN post précis (publication/photo/sondage) hors du fil — sert
 *  notamment à faire atterrir une notification like/commentaire/mention sur
 *  le contenu réel plutôt que sur le profil de la personne qui a agi.
 *  `autoOpenComments` ouvre directement les commentaires (notification de
 *  commentaire ou de mention) au lieu de juste montrer le post. */
function SinglePostViewer({ post, autoOpenComments, onClose, onOpenProfile, meUsername, isAdmin, liked = [], saved = [], reposted = [], commentsByPost = {}, onLike, onSave, onRepost, onAddComment, onDelete, onDeleteComment, onEditRequest, onReport, onHide, onBlock, onLoadComments }) {
  const { colors } = useTheme();
  const [sheet, setSheet] = useState(autoOpenComments ? { type: "comments", post } : null);
  useEffect(() => {
    if (autoOpenComments) onLoadComments?.(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "fixed", inset: 0, zIndex: 91, background: colors.background, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title="Publication" onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 8 }}>
        <PostCard
          post={post}
          liked={liked.includes(post.id)}
          saved={saved.includes(post.id)}
          reposted={reposted.includes(post.id)}
          commentCount={commentsByPost[post.id] ? commentsByPost[post.id].length : (post.commentaires || 0)}
          onLike={() => onLike?.(post.id)}
          onSave={() => onSave?.(post.id)}
          onRepost={() => onRepost?.(post.id)}
          onOpenComments={() => { setSheet({ type: "comments", post }); onLoadComments?.(post.id); }}
          onOpenActions={() => setSheet({ type: "actions", post })}
          onOpenAuthor={() => onOpenProfile?.(post.username)}
          onOpenProfile={onOpenProfile}
        />
      </div>
      {sheet?.type === "actions" && (
        <ContentActionSheet
          isOwn={post.username === meUsername}
          isAdmin={isAdmin}
          onClose={() => setSheet(null)}
          onEdit={() => { setSheet(null); onEditRequest?.(post); }}
          onDelete={() => { onDelete?.(post.id); setSheet(null); onClose(); }}
          onReport={() => setSheet({ type: "report", post })}
          onHide={() => { onHide?.(post.id); setSheet(null); onClose(); }}
          onBlock={() => { onBlock?.(post.username); setSheet(null); onClose(); }}
        />
      )}
      {sheet?.type === "report" && (
        <ReportSheet onClose={() => setSheet(null)} onSubmit={(reason) => { onReport?.({ targetId: post.id, targetType: "post", reason }); setSheet(null); }} />
      )}
      {sheet?.type === "comments" && (
        <CommentsSheet
          comments={commentsByPost[post.id] || []}
          onClose={() => setSheet(null)}
          onAdd={(texte, parentId) => onAddComment?.(post.id, texte, parentId)}
          onDelete={onDeleteComment ? (commentId) => onDeleteComment(post.id, commentId) : undefined}
          meUsername={meUsername}
          onOpenProfile={onOpenProfile}
        />
      )}
    </div>
  );
}
/* ============================================================
   CARNET DE CHASSE — strictement privé (voir migration 025)
   ============================================================ */
const HUNTING_TYPES = [
  { key: "chasse", label: "Chasse" },
  { key: "piegeage", label: "Piégeage" },
  { key: "venerie_sous_terre", label: "Vénerie sous terre" },
  { key: "reperage", label: "Repérage" },
  { key: "entrainement_chien", label: "Entraînement chien" },
  { key: "observation", label: "Observation" },
  { key: "autre", label: "Autre" },
];
const HUNTING_TYPE_LABEL = Object.fromEntries(HUNTING_TYPES.map((t) => [t.key, t.label]));
const METEO_OPTIONS = ["Soleil", "Nuageux", "Pluie", "Brouillard", "Vent", "Neige"];
const TERRAIN_OPTIONS = ["Forêt", "Plaine", "Marais", "Montagne", "Bocage", "Autre"];

function formatDuree(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m}`;
}

// Champ "rechercher puis sélectionner" un ou plusieurs vrais comptes PISTE —
// jamais du texte libre, pour être sûr que ce soit la bonne personne (voir
// socialService.searchUsers). Utilisé par le carnet de chasse pour
// identifier les compagnons d'une sortie.
function UserPickerField({ label, selected, onChange, placeholder }) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      socialService.searchUsers(q)
        .then((rows) => { if (!cancelled) setResults(rows.filter((u) => !selected.some((s) => s.id === u.id))); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, selected]);
  const add = (u) => {
    onChange([...selected, { id: u.id, username: u.username, nom: u.nom || u.username, avatar: u.avatar_url }]);
    setQuery("");
    setResults([]);
  };
  const remove = (id) => onChange(selected.filter((s) => s.id !== id));
  return (
    <div style={{ marginBottom: SPACE.lg }}>
      {label && <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.textSecondary, marginBottom: 6, display: "block" }}>{label}</label>}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 8 }}>
          {selected.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5" style={{ background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "3px 8px 3px 4px", fontSize: 12, fontWeight: 600, color: colors.accent }}>
              <div style={{ width: 18, height: 18, borderRadius: RADIUS.pill, background: colors.surfaceAlt, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.avatar ? <img src={s.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={9} color={colors.textFaint} />}
              </div>
              {s.nom}
              <button onClick={() => remove(s.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}><X size={11} color={colors.accent} /></button>
            </span>
          ))}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} style={{ width: "100%", border: "none", background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "11px 16px", fontSize: 13.5, color: colors.text, outline: "none", boxSizing: "border-box" }} />
        {query.trim() && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: RADIUS.lg, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 5, maxHeight: 220, overflowY: "auto" }}>
            {searching ? (
              <div style={{ padding: 12, fontSize: 12, color: colors.textFaint, textAlign: "center" }}>Recherche...</div>
            ) : results.length === 0 ? (
              <div style={{ padding: 12, fontSize: 12, color: colors.textFaint, textAlign: "center" }}>Aucun résultat.</div>
            ) : (
              results.map((u) => (
                <button key={u.id} onClick={() => add(u)} className="flex items-center gap-2" style={{ width: "100%", background: "none", border: "none", padding: "9px 12px", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 26, height: 26, borderRadius: RADIUS.pill, background: colors.surfaceAlt, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={12} color={colors.textFaint} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.text }}>{u.nom || u.username}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>@{u.username}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function HuntingLogFormScreen({ log, dogs, onClose, onSaved }) {
  const { colors } = useTheme();
  const isEdit = !!log;
  const [date, setDate] = useState(log?.date || new Date().toISOString().slice(0, 10));
  const [lieuNom, setLieuNom] = useState(log?.lieuNom || "");
  const [lieuCommune, setLieuCommune] = useState(log?.lieuCommune || "");
  const [typeSortie, setTypeSortie] = useState(log?.typeSortie || "chasse");
  const [typeSortieAutre, setTypeSortieAutre] = useState(log?.typeSortieAutre || "");
  const [avecChien, setAvecChien] = useState(log?.avecChien || false);
  const [dogId, setDogId] = useState(log?.dogId || null);
  const [espece, setEspece] = useState(log?.espece || "");
  const [observation, setObservation] = useState(log?.observation || "");
  const [resultat, setResultat] = useState(log?.resultat || "");
  const [dureeMinutes, setDureeMinutes] = useState(log?.dureeMinutes ? String(log.dureeMinutes) : "");
  const [nombrePersonnes, setNombrePersonnes] = useState(log?.nombrePersonnes ? String(log.nombrePersonnes) : "");
  const [meteo, setMeteo] = useState(log?.meteo || "");
  const [temperature, setTemperature] = useState(log?.temperature != null ? String(log.temperature) : "");
  const [terrain, setTerrain] = useState(log?.terrain || []);
  const [terrainAutre, setTerrainAutre] = useState(log?.terrainAutre || "");
  const [distanceKm, setDistanceKm] = useState(log?.distanceKm != null ? String(log.distanceKm) : "");
  const [nombrePrises, setNombrePrises] = useState(log?.nombrePrises != null ? String(log.nombrePrises) : "");
  const [nombreArrets, setNombreArrets] = useState(log?.nombreArrets != null ? String(log.nombreArrets) : "");
  const [nombreLeves, setNombreLeves] = useState(log?.nombreLeves != null ? String(log.nombreLeves) : "");
  const [nombreTires, setNombreTires] = useState(log?.nombreTires != null ? String(log.nombreTires) : "");
  const [categorieGibier, setCategorieGibier] = useState(log?.categorieGibier || null);
  const [notes, setNotes] = useState(log?.notes || "");
  const [companions, setCompanions] = useState(log?.companions || []);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const photoInputRef = useRef(null);

  const pickPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPhotoFiles((f) => [...f, ...files]);
    setPhotoPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };
  const removePhoto = (i) => {
    setPhotoFiles((f) => f.filter((_, idx) => idx !== i));
    setPhotoPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    const fields = {
      date, lieuNom, lieuCommune, typeSortie, typeSortieAutre, avecChien, dogId,
      espece, observation, resultat,
      dureeMinutes: dureeMinutes ? parseInt(dureeMinutes, 10) : null,
      nombrePersonnes: nombrePersonnes ? parseInt(nombrePersonnes, 10) : null,
      meteo, temperature: temperature ? parseFloat(temperature) : null,
      terrain, terrainAutre,
      distanceKm: distanceKm ? parseFloat(distanceKm) : null,
      nombrePrises: nombrePrises ? parseInt(nombrePrises, 10) : null,
      nombreArrets: nombreArrets ? parseInt(nombreArrets, 10) : null,
      nombreLeves: nombreLeves ? parseInt(nombreLeves, 10) : null,
      nombreTires: nombreTires ? parseInt(nombreTires, 10) : null,
      categorieGibier,
      notes,
    };
    const companionIds = companions.map((c) => c.id);
    try {
      const saved = isEdit ? await huntingLogService.updateLog(log.id, fields, photoFiles, companionIds) : await huntingLogService.createLog(fields, photoFiles, companionIds);
      onSaved(saved);
    } catch (e) {
      setError(e.message || "Impossible d'enregistrer cette sortie pour le moment.");
      setSaving(false);
    }
  };

  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "fixed", inset: 0, zIndex: 70, background: colors.background, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title={isEdit ? "Modifier la sortie" : "Nouvelle sortie"} onCloseX={onClose} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        <TextField label="Date" value={date} onChange={setDate} type="date" />
        <TextField label="Lieu" value={lieuNom} onChange={setLieuNom} placeholder="Nom du lieu (ex : Bois de la Chapelle)" />
        <TextField label="Commune / secteur" value={lieuCommune} onChange={setLieuCommune} placeholder="ex : Saint-Martin (28)" />

        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>TYPE DE SORTIE</div>
        <div className="flex flex-wrap gap-2" style={{ marginBottom: typeSortie === "autre" ? 10 : 16 }}>
          {HUNTING_TYPES.map((t) => <Chip key={t.key} label={t.label} active={typeSortie === t.key} onClick={() => setTypeSortie(t.key)} />)}
        </div>
        {typeSortie === "autre" && (
          <TextField label="Précisez" value={typeSortieAutre} onChange={setTypeSortieAutre} placeholder="ex : Piégeage, régulation..." />
        )}

        <ToggleRow label="Sortie avec un chien" value={avecChien} onToggle={() => setAvecChien((v) => !v)} />
        {avecChien && (
          dogs.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 16 }}>Aucun chien enregistré sur votre profil pour le moment.</div>
          ) : (
            <select value={dogId || ""} onChange={(e) => setDogId(e.target.value || null)} style={{ width: "100%", border: "none", background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "12px 16px", fontSize: 13.5, color: colors.text, outline: "none", marginBottom: 16 }}>
              <option value="">Choisir un chien</option>
              {dogs.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          )
        )}

        <TextField label="Espèce recherchée" value={espece} onChange={setEspece} placeholder="ex : Chevreuil, Bécasse..." />
        <TextField label="Observation" value={observation} onChange={setObservation} placeholder="Ce qui a été observé sur le terrain..." textarea rows={3} />
        <TextField label="Résultat" value={resultat} onChange={setResultat} placeholder="ex : Bredouille, Prise, Observation seulement..." />

        <div className="flex gap-3">
          <div style={{ flex: 1 }}><TextField label="Durée (minutes)" value={dureeMinutes} onChange={setDureeMinutes} type="number" placeholder="120" /></div>
          <div style={{ flex: 1 }}><TextField label="Personnes présentes" value={nombrePersonnes} onChange={setNombrePersonnes} type="number" placeholder="2" /></div>
        </div>

        <UserPickerField
          label="Identifier des compagnons (optionnel)"
          selected={companions}
          onChange={setCompanions}
          placeholder="Rechercher un pseudo..."
        />
        {companions.length > 0 && (
          <div style={{ fontSize: 11, color: colors.textFaint, marginTop: -10, marginBottom: 16, lineHeight: 1.4 }}>
            Cette sortie apparaîtra aussi, en lecture seule, dans le carnet des personnes identifiées — sans vos photos ni vos notes personnelles.
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>MÉTÉO</div>
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
          {METEO_OPTIONS.map((m) => <Chip key={m} label={m} active={meteo === m} onClick={() => setMeteo(meteo === m ? "" : m)} />)}
        </div>

        <div className="flex gap-3">
          <div style={{ flex: 1 }}><TextField label="Température (°C)" value={temperature} onChange={setTemperature} type="number" placeholder="8" /></div>
          <div style={{ flex: 1 }}><TextField label="Distance (km)" value={distanceKm} onChange={setDistanceKm} type="number" placeholder="4.5" /></div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>TERRAIN (plusieurs choix possibles)</div>
        <div className="flex flex-wrap gap-2" style={{ marginBottom: terrain.includes("Autre") ? 10 : 16 }}>
          {TERRAIN_OPTIONS.map((t) => (
            <Chip key={t} label={t} active={terrain.includes(t)} onClick={() => setTerrain(terrain.includes(t) ? terrain.filter((x) => x !== t) : [...terrain, t])} />
          ))}
        </div>
        {terrain.includes("Autre") && (
          <TextField label="Précisez" value={terrainAutre} onChange={setTerrainAutre} placeholder="ex : Vignes, garrigue..." />
        )}

        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>CATÉGORIE DE GIBIER</div>
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
          {[["gros", "Gros gibier"], ["petit", "Petit gibier"]].map(([key, label]) => (
            <Chip key={key} label={label} active={categorieGibier === key} onClick={() => setCategorieGibier(categorieGibier === key ? null : key)} />
          ))}
        </div>

        <div className="flex gap-3">
          <div style={{ flex: 1 }}><TextField label="Arrêts" value={nombreArrets} onChange={setNombreArrets} type="number" placeholder="0" /></div>
          <div style={{ flex: 1 }}><TextField label="Levés" value={nombreLeves} onChange={setNombreLeves} type="number" placeholder="0" /></div>
          <div style={{ flex: 1 }}><TextField label="Tirés" value={nombreTires} onChange={setNombreTires} type="number" placeholder="0" /></div>
        </div>
        <TextField label="Nombre de prises" value={nombrePrises} onChange={setNombrePrises} type="number" placeholder="0" />
        <TextField label="Notes personnelles" value={notes} onChange={setNotes} placeholder="Vos notes, pour vous seul..." textarea rows={3} />

        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>PHOTOS PRIVÉES (facultatif)</div>
        <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={pickPhotos} style={{ display: "none" }} />
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
          {(log?.photos || []).map((p) => (
            <div key={p.id} style={{ width: 66, height: 66, borderRadius: RADIUS.lg, overflow: "hidden" }}>
              <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
          {photoPreviews.map((src, i) => (
            <div key={i} style={{ position: "relative", width: 66, height: 66, borderRadius: RADIUS.lg, overflow: "hidden" }}>
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: RADIUS.pill, background: "rgba(0,0,0,0.55)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={10} color="#fff" />
              </button>
            </div>
          ))}
          <button onClick={() => photoInputRef.current?.click()} style={{ width: 66, height: 66, borderRadius: RADIUS.lg, border: `1.5px dashed ${colors.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Camera size={18} color={colors.textFaint} />
          </button>
        </div>
        <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: colors.textFaint, marginBottom: 8 }}>
          <Lock size={11} /><span>Visible par vous seul.</span>
        </div>

        {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "12px 14px", fontSize: 12.5, color: colors.error }}>{error}</div>}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}>
        <Button disabled={!date || !typeSortie || saving} onClick={submit}>{saving ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Ajouter la sortie"}</Button>
      </div>
    </div>
  );
}

function HuntingLogDetailSheet({ log, onClose, onEdit, onDelete, onOpenProfile }) {
  const { colors } = useTheme();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const terrainLabel = (log.terrain || [])
    .map((t) => (t === "Autre" && log.terrainAutre ? `Autre (${log.terrainAutre})` : t))
    .join(", ");
  const rows = [
    ["Lieu", [log.lieuNom, log.lieuCommune].filter(Boolean).join(" — ") || null],
    ["Chien", log.avecChien ? log.dogNom || "Oui" : null],
    ["Catégorie", log.categorieGibier === "gros" ? "Gros gibier" : log.categorieGibier === "petit" ? "Petit gibier" : null],
    ["Espèce", log.espece],
    ["Résultat", log.resultat],
    ["Durée", formatDuree(log.dureeMinutes)],
    ["Personnes présentes", log.nombrePersonnes],
    ["Météo", [log.meteo, log.temperature != null ? `${log.temperature}°C` : null].filter(Boolean).join(" · ") || null],
    ["Terrain", terrainLabel || null],
    ["Distance", log.distanceKm != null ? `${log.distanceKm} km` : null],
    ["Arrêts", log.nombreArrets],
    ["Levés", log.nombreLeves],
    ["Tirés", log.nombreTires],
    ["Prises", log.nombrePrises],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 71 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`, pointerEvents: "none" }}>
        <div style={{ width: "100%", maxWidth: 460, maxHeight: "82vh", background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, boxShadow: "0 12px 40px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
          <div className="flex items-center justify-between" style={{ padding: "6px 16px 10px" }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>{formatRelativeDate(log.date)}</span>
            <IconButton icon={X} onClick={onClose} size={30} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
            <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 12 }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "4px 10px" }}>
                {log.typeSortie === "autre" && log.typeSortieAutre ? log.typeSortieAutre : HUNTING_TYPE_LABEL[log.typeSortie] || log.typeSortie}
              </span>
              {!log.isOwner && (
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: colors.textSecondary, background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "4px 10px" }}>Sortie partagée</span>
              )}
            </div>
            {!log.isOwner && log.owner && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.textFaint, marginBottom: 6 }}>SORTIE DE</div>
                <button onClick={() => onOpenProfile?.(log.owner.username)} className="flex items-center gap-1.5" style={{ background: colors.surfaceAlt, border: "none", borderRadius: RADIUS.pill, padding: "4px 10px 4px 4px", cursor: onOpenProfile ? "pointer" : "default" }}>
                  <div style={{ width: 20, height: 20, borderRadius: RADIUS.pill, background: colors.accentSoft, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {log.owner.avatar ? <img src={log.owner.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={10} color={colors.accent} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{log.owner.nom}</span>
                </button>
              </div>
            )}
            {log.companions && log.companions.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.textFaint, marginBottom: 6 }}>AVEC</div>
                <div className="flex flex-wrap gap-1.5">
                  {log.companions.map((c) => (
                    <button key={c.id} onClick={() => onOpenProfile?.(c.username)} className="flex items-center gap-1.5" style={{ background: colors.surfaceAlt, border: "none", borderRadius: RADIUS.pill, padding: "4px 10px 4px 4px", cursor: onOpenProfile ? "pointer" : "default" }}>
                      <div style={{ width: 20, height: 20, borderRadius: RADIUS.pill, background: colors.accentSoft, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {c.avatar ? <img src={c.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={10} color={colors.accent} />}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{c.nom}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {log.photos.length > 0 && (
              <div className="flex gap-2" style={{ overflowX: "auto", marginBottom: 14 }}>
                {log.photos.map((p) => (
                  <img key={p.id} src={p.url} alt="" style={{ width: 96, height: 96, borderRadius: RADIUS.lg, objectFit: "cover", flexShrink: 0 }} />
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2" style={{ marginBottom: 14 }}>
              {rows.map(([label, val]) => (
                <div key={label} className="flex items-center justify-between" style={{ background: colors.surfaceAlt, borderRadius: RADIUS.lg, padding: "10px 14px" }}>
                  <span style={{ fontSize: 12, color: colors.textSecondary }}>{label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.text }}>{val}</span>
                </div>
              ))}
            </div>
            {log.observation && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.textFaint, marginBottom: 4 }}>OBSERVATION</div>
                <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5 }}>{log.observation}</div>
              </div>
            )}
            {log.notes && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.textFaint, marginBottom: 4 }}>NOTES</div>
                <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5 }}>{log.notes}</div>
              </div>
            )}
            {!log.isOwner ? null : !confirmDelete ? (
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <Button full={false} variant="secondary" onClick={() => onEdit(log)}>Modifier</Button>
                <Button full={false} variant="secondary" onClick={() => setConfirmDelete(true)}><span style={{ color: colors.error }}>Supprimer</span></Button>
              </div>
            ) : (
              <div style={{ background: colors.errorSoft, borderRadius: RADIUS.lg, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 12.5, color: colors.error, marginBottom: 10 }}>Supprimer définitivement cette sortie et ses photos ?</div>
                <div className="flex gap-3">
                  <button onClick={async () => { setDeleting(true); await onDelete(log); }} disabled={deleting} style={{ background: "none", border: "none", color: colors.error, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{deleting ? "..." : "Confirmer"}</button>
                  <button onClick={() => setConfirmDelete(false)} style={{ background: "none", border: "none", color: colors.error, textDecoration: "underline", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HuntingLogCalendar({ logs, selectedDay, onSelectDay }) {
  const { colors } = useTheme();
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysWithLogs = new Set(logs.filter((l) => { const d = new Date(l.date); return d.getFullYear() === year && d.getMonth() === month; }).map((l) => new Date(l.date).getDate()));
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthLabel = base.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div style={{ background: colors.surfaceAlt, borderRadius: RADIUS.xl, padding: 16, margin: "0 16px 14px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <button onClick={() => setMonthOffset((m) => m - 1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><ChevronRight size={16} color={colors.textFaint} style={{ transform: "rotate(180deg)" }} /></button>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.text, textTransform: "capitalize" }}>{monthLabel}</span>
        <button onClick={() => setMonthOffset((m) => m + 1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><ChevronRight size={16} color={colors.textFaint} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1" style={{ marginBottom: 4 }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: colors.textFaint }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const hasLog = daysWithLogs.has(day);
          const isSelected = selectedDay && selectedDay.getFullYear() === year && selectedDay.getMonth() === month && selectedDay.getDate() === day;
          return (
            <button
              key={i}
              onClick={() => hasLog && onSelectDay(new Date(year, month, day))}
              disabled={!hasLog}
              className="flex flex-col items-center"
              style={{ background: "none", border: "none", padding: "4px 0", cursor: hasLog ? "pointer" : "default" }}
            >
              <div style={{ width: 26, height: 26, borderRadius: RADIUS.pill, display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? colors.accent : "transparent", fontSize: 11.5, fontWeight: hasLog ? 700 : 500, color: isSelected ? colors.onAccent : hasLog ? colors.text : colors.textFaint }}>
                {day}
              </div>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: hasLog && !isSelected ? colors.accent : "transparent", marginTop: 1 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HuntingLogStatsView({ stats }) {
  const { colors } = useTheme();
  const cards = [
    ["Sorties au total", stats.total],
    ["Ce mois-ci", stats.ceMois],
    ["Cette année", stats.cetteAnnee],
    ["Temps sur le terrain", formatDuree(stats.totalMinutes) || "—"],
    ["Sorties avec chien", stats.avecChienCount],
    ["Espèces observées", stats.especesObservees],
    ["Arrêts", stats.totalArrets],
    ["Levés", stats.totalLeves],
    ["Tirés", stats.totalTires],
  ];
  const gibierRows = [
    ["gros", "Gros gibier"],
    ["petit", "Petit gibier"],
  ].filter(([key]) => stats.parCategorieGibier[key].sorties > 0);
  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 16 }}>
        {cards.map(([label, val]) => (
          <div key={label} style={{ background: colors.surfaceAlt, borderRadius: RADIUS.xl, padding: "16px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{val}</div>
            <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      {Object.keys(stats.parType).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, marginBottom: 8 }}>SORTIES PAR TYPE</div>
          <div className="flex flex-col gap-2">
            {Object.entries(stats.parType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between" style={{ background: colors.surfaceAlt, borderRadius: RADIUS.lg, padding: "10px 14px" }}>
                <span style={{ fontSize: 12.5, color: colors.text, fontWeight: 600 }}>{HUNTING_TYPE_LABEL[type] || type}</span>
                <span style={{ fontSize: 12.5, color: colors.textSecondary }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {gibierRows.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, marginBottom: 8 }}>GROS GIBIER / PETIT GIBIER</div>
          <div className="flex flex-col gap-2">
            {gibierRows.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between" style={{ background: colors.surfaceAlt, borderRadius: RADIUS.lg, padding: "10px 14px" }}>
                <span style={{ fontSize: 12.5, color: colors.text, fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 12, color: colors.textSecondary }}>{stats.parCategorieGibier[key].sorties} sortie{stats.parCategorieGibier[key].sorties > 1 ? "s" : ""} · {stats.parCategorieGibier[key].prises} prise{stats.parCategorieGibier[key].prises > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {stats.parChien.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, marginBottom: 8 }}>HISTORIQUE PAR CHIEN</div>
          <div className="flex flex-col gap-2">
            {stats.parChien.map((d) => (
              <div key={d.dogId} className="flex items-center justify-between" style={{ background: colors.surfaceAlt, borderRadius: RADIUS.lg, padding: "10px 14px" }}>
                <span style={{ fontSize: 12.5, color: colors.text, fontWeight: 600 }}>{d.dogNom}</span>
                <span style={{ fontSize: 12, color: colors.textSecondary }}>{d.count} sortie{d.count > 1 ? "s" : ""} · {formatDuree(d.minutes) || "0 min"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {stats.especesListe.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, marginBottom: 8 }}>ESPÈCES OBSERVÉES</div>
          <div className="flex flex-wrap gap-2">
            {stats.especesListe.map((e) => <span key={e} style={{ fontSize: 11.5, fontWeight: 600, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "5px 11px" }}>{e}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function HuntingLogScreen({ onClose, dogs, onOpenProfile }) {
  const { colors } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("liste");
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [detailLog, setDetailLog] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState(null);
  const [filterDog, setFilterDog] = useState(null);
  const [filterShared, setFilterShared] = useState(false); // sous-catégorie "sortie partagée" (voir badge, HuntingLogDetailSheet)

  const refresh = () => huntingLogService.fetchMyLogs().then(setLogs).catch(() => {});
  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = logs.filter((l) => {
    if (filterShared && l.isOwner) return false;
    if (filterType && l.typeSortie !== filterType) return false;
    if (filterDog && l.dogId !== filterDog) return false;
    if (selectedDay) {
      const d = new Date(l.date);
      if (d.getFullYear() !== selectedDay.getFullYear() || d.getMonth() !== selectedDay.getMonth() || d.getDate() !== selectedDay.getDate()) return false;
    }
    if (q && !`${l.lieuNom} ${l.lieuCommune} ${l.espece} ${l.resultat}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const stats = useMemo(() => huntingLogService.computeStats(logs), [logs]);

  const closeForm = () => { setShowForm(false); setEditingLog(null); };
  const swipeBack = useSwipeBack(onClose);

  return (
    <div ref={swipeBack} style={{ position: "fixed", inset: 0, zIndex: 65, background: colors.background, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title="Carnet de chasse" onBack={onClose} />
      <div className="flex items-center gap-1.5" style={{ padding: "10px 16px 0", fontSize: 11, color: colors.textFaint }}>
        <Lock size={11} /><span>Strictement privé — visible par vous et les personnes que vous identifiez sur une sortie.</span>
      </div>
      <div className="px-4" style={{ paddingTop: 12, paddingBottom: 4 }}>
        <SegmentedControl options={[{ key: "liste", label: "Liste" }, { key: "calendrier", label: "Calendrier" }, { key: "stats", label: "Statistiques" }]} value={tab} onChange={setTab} />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, padding: 40 }}>Chargement...</div>
        ) : tab === "stats" ? (
          <div style={{ paddingTop: 12 }}><HuntingLogStatsView stats={stats} /></div>
        ) : (
          <>
            {tab === "calendrier" && (
              <div style={{ paddingTop: 12 }}>
                <HuntingLogCalendar logs={logs} selectedDay={selectedDay} onSelectDay={(d) => setSelectedDay((cur) => (cur && cur.getTime() === d.getTime() ? null : d))} />
              </div>
            )}
            {tab === "liste" && (
              <div className="px-4" style={{ paddingTop: 12 }}>
                <div className="flex items-center gap-2" style={{ background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "9px 14px", marginBottom: 10 }}>
                  <Search size={15} color={colors.textFaint} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (lieu, espèce, résultat...)" style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: colors.text, flex: 1 }} />
                </div>
                <div className="flex flex-wrap gap-2" style={{ marginBottom: 4 }}>
                  <Chip label="Sorties partagées" active={filterShared} onClick={() => setFilterShared((v) => !v)} />
                  {HUNTING_TYPES.map((t) => <Chip key={t.key} label={t.label} active={filterType === t.key} onClick={() => setFilterType(filterType === t.key ? null : t.key)} />)}
                  {dogs.map((d) => <Chip key={d.id} label={d.nom} active={filterDog === d.id} onClick={() => setFilterDog(filterDog === d.id ? null : d.id)} />)}
                </div>
              </div>
            )}
            {selectedDay && tab === "calendrier" && (
              <div className="flex items-center justify-between px-4" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: colors.textSecondary }}>{selectedDay.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
                <button onClick={() => setSelectedDay(null)} style={{ background: "none", border: "none", color: colors.accent, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Voir tout</button>
              </div>
            )}
            {filtered.length === 0 ? (
              <EmptyState title={logs.length === 0 ? "Aucune sortie enregistrée" : "Aucun résultat"} subtitle={logs.length === 0 ? "Ajoutez votre première sortie pour commencer votre carnet." : "Essayez d'autres filtres."} ctaLabel={logs.length === 0 ? "Ajouter une sortie" : undefined} onCta={logs.length === 0 ? () => setShowForm(true) : undefined} />
            ) : (
              <div className="flex flex-col gap-2" style={{ padding: "4px 16px 90px" }}>
                {filtered.map((l) => (
                  <button key={l.id} onClick={() => setDetailLog(l)} className="flex items-center gap-3" style={{ width: "100%", background: colors.surfaceAlt, border: "none", borderRadius: RADIUS.xl, padding: "12px 14px", cursor: "pointer", textAlign: "left" }}>
                    {l.photos.length > 0 ? (
                      <img src={l.photos[0].url} alt="" style={{ width: 48, height: 48, borderRadius: RADIUS.lg, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: RADIUS.lg, background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Footprints size={20} color={colors.accent} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{l.lieuNom || HUNTING_TYPE_LABEL[l.typeSortie]}</span>
                        {l.avecChien && <Dog size={12} color={colors.textFaint} />}
                        {!l.isOwner && (
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.accent, background: colors.accentSoft, borderRadius: RADIUS.pill, padding: "2px 7px", flexShrink: 0 }}>{l.owner?.nom || "Compagnon"}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: colors.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {new Date(l.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })} · {HUNTING_TYPE_LABEL[l.typeSortie]}{l.espece ? ` · ${l.espece}` : ""}
                      </div>
                    </div>
                    <ChevronRight size={16} color={colors.textFaint} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <button
        onClick={() => setShowForm(true)}
        aria-label="Ajouter une sortie"
        style={{ position: "absolute", right: 20, bottom: `calc(20px + env(safe-area-inset-bottom, 0px))`, width: 54, height: 54, borderRadius: RADIUS.pill, background: colors.accent, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 6px 18px ${colors.accent}55` }}
      >
        <Plus size={24} color={colors.onAccent} strokeWidth={2.4} />
      </button>
      {(showForm || editingLog) && (
        <HuntingLogFormScreen
          log={editingLog}
          dogs={dogs}
          onClose={closeForm}
          onSaved={() => { closeForm(); setDetailLog(null); refresh(); }}
        />
      )}
      {detailLog && (
        <HuntingLogDetailSheet
          log={detailLog}
          onClose={() => setDetailLog(null)}
          onEdit={(l) => { setDetailLog(null); setEditingLog(l); }}
          onDelete={async (l) => {
            try {
              await huntingLogService.deleteLog(l.id, l.photos.map((p) => p.path));
              setDetailLog(null);
              refresh();
            } catch (e) { /* la bulle de confirmation reste affichée, l'utilisateur peut réessayer */ }
          }}
          onOpenProfile={onOpenProfile}
        />
      )}
    </div>
  );
}
function ScreenProfil({ profile, setProfile, dogs, addDog, posts, videos, liked, saved, reposted, commentsByPost, onLike, onSave, onRepost, onAddComment, onDelete, onDeleteComment, onEditRequest, onReport, onHide, onBlock, onLoadComments, onOpenPlayer, onOpenProfile, chromeMode = "full", incomingRequestsCount = 0, onApproveRequest, onRejectRequest, traceGroup, onOpenTrace, onOpenFollowers }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState("publications");
  const [editing, setEditing] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showCarnet, setShowCarnet] = useState(false);
  const [dogForm, setDogForm] = useState(false);
  const [openDog, setOpenDog] = useState(null);
  const [followSheet, setFollowSheet] = useState(null); // 'followers' | 'following' | null
  const [viewingInstant, setViewingInstant] = useState(null);
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
      <div style={{ width: "100%", height: 124, marginTop: 10, background: profile.imageCouverture ? `url(${profile.imageCouverture}) center/cover` : `linear-gradient(135deg, ${colors.accentSoft}, ${colors.surfaceAlt})`, borderRadius: RADIUS.xl }} />
      <div className="px-4">
        <div style={{ marginTop: -40 }}>
          {traceGroup && traceGroup.traces.length > 0 ? (
            <button onClick={onOpenTrace} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", borderRadius: RADIUS.pill }}>
              <div style={{ width: 86, height: 86, borderRadius: RADIUS.pill, padding: 3, boxSizing: "border-box", background: traceGroup.allViewed ? colors.border : `linear-gradient(135deg, ${colors.accent}, ${colors.accentSoft})` }}>
                <div style={{ width: "100%", height: "100%", borderRadius: RADIUS.pill, background: colors.surface, border: `3px solid ${colors.background}`, boxShadow: "0 6px 18px rgba(0,0,0,0.16)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={32} color={colors.textFaint} strokeWidth={1.6} />}
                </div>
              </div>
            </button>
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: RADIUS.pill, background: colors.surface, border: `4px solid ${colors.background}`, boxShadow: "0 6px 18px rgba(0,0,0,0.16)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={32} color={colors.textFaint} strokeWidth={1.6} />}
            </div>
          )}
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="flex items-start justify-between" style={{ gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{profile.nom || "Votre nom"}</div>
              <div style={{ fontSize: 13, color: colors.textFaint }}>@{profile.username || "handle"}</div>
            </div>
            <button onClick={() => setEditing(true)} style={{ flexShrink: 0, border: "none", background: colors.surfaceAlt, color: colors.text, borderRadius: RADIUS.pill, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Modifier</button>
          </div>
          <BadgeRow badges={profile.badges} />
          {profile.localisation && (
            <div className="flex items-center gap-1" style={{ marginTop: 6, display: "inline-flex", background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "4px 10px 4px 8px" }}>
              <MapPin size={12} color={colors.textFaint} /><span style={{ fontSize: 12, color: colors.textSecondary }}>{profile.localisation}</span>
            </div>
          )}
          <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 10, lineHeight: 1.5, background: colors.surfaceAlt, borderRadius: RADIUS.lg, padding: "10px 12px" }}>{profile.bio || "Aucune biographie renseignée pour le moment."}</div>
        </div>
        <div style={{ marginTop: 14, background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: RADIUS.lg, padding: "12px 4px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }} className="flex">
          {[["Abonnés", stats.abonnes, "followers"], ["Abonnements", stats.abonnements, "following"], ["Publications", posts.length, null]].map(([label, val, mode]) => (
            mode ? (
              <button key={label} onClick={() => { setFollowSheet(mode); if (mode === "followers") onOpenFollowers?.(); }} style={{ flex: 1, textAlign: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>{val}</div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>{label}</div>
              </button>
            ) : (
              <div key={label} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>{val}</div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>{label}</div>
              </div>
            )
          ))}
        </div>
        <button onClick={() => setShowCarnet(true)} className="flex items-center justify-between" style={{ width: "100%", marginTop: 10, background: colors.surfaceAlt, border: "none", borderRadius: RADIUS.lg, padding: "12px 14px", cursor: "pointer" }}>
          <div className="flex items-center gap-2.5">
            <div style={{ width: 30, height: 30, borderRadius: RADIUS.pill, background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Footprints size={15} color={colors.accent} /></div>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>Carnet de chasse</span>
            <Lock size={11} color={colors.textFaint} />
          </div>
          <ChevronRight size={15} color={colors.textFaint} />
        </button>
        {profile.isPrivate && incomingRequestsCount > 0 && (
          <button onClick={() => setShowRequests(true)} className="flex items-center justify-between" style={{ width: "100%", marginTop: 8, background: colors.accentSoft, border: "none", borderRadius: RADIUS.lg, padding: "11px 14px", cursor: "pointer" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.accent }}>{incomingRequestsCount} demande{incomingRequestsCount > 1 ? "s" : ""} d'abonnement</span>
            <ChevronRight size={15} color={colors.accent} />
          </button>
        )}
      </div>
      {showRequests && <FollowRequestsSheet onClose={() => setShowRequests(false)} onApprove={onApproveRequest} onReject={onRejectRequest} />}
      {showCarnet && <HuntingLogScreen onClose={() => setShowCarnet(false)} dogs={dogs} onOpenProfile={onOpenProfile} />}
      <div
        className="px-4"
        style={{
          position: "sticky",
          top: chromeMode !== "hidden" ? "calc(74px + env(safe-area-inset-top, 0px))" : "env(safe-area-inset-top, 0px)",
          zIndex: 5,
          marginTop: 20,
          paddingBottom: 4,
          opacity: chromeMode === "hidden" ? 0 : 1,
          transform: chromeMode === "hidden" ? "translateY(-140%)" : "translateY(0)",
          transition: "opacity 220ms ease, transform 220ms ease, top 260ms ease",
          pointerEvents: chromeMode === "hidden" ? "none" : "auto",
        }}
      >
        <div className="flex" style={{ background: colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: RADIUS.pill, padding: 3, gap: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          {tabs.map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center justify-center gap-1.5"
              style={{
                flex: 1,
                padding: "7px 6px",
                background: tab === key ? colors.surface : "transparent",
                border: "none",
                borderRadius: RADIUS.pill,
                cursor: "pointer",
                boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "background 150ms ease, box-shadow 150ms ease",
              }}
            >
              <Icon size={14} color={tab === key ? colors.text : colors.textFaint} strokeWidth={1.8} />
              <span style={{ fontSize: 10.5, fontWeight: tab === key ? 700 : 600, color: tab === key ? colors.text : colors.textFaint, whiteSpace: "nowrap" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === "publications" && (
        posts.length === 0 ? <EmptyState title="Aucune publication" subtitle="Vos publications apparaîtront ici." /> : (
          <div style={{ paddingTop: 10 }}>
            {posts.map((p) => (
              <PostCard
                onOpenProfile={onOpenProfile}
                key={p.id}
                post={p}
                liked={liked.includes(p.id)}
                saved={saved.includes(p.id)}
                reposted={reposted.includes(p.id)}
                onRepost={() => onRepost(p.id)}
                commentCount={commentsByPost[p.id] ? commentsByPost[p.id].length : (p.commentaires || 0)}
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
                reposted={reposted.includes(v.id)}
                commentCount={commentsByPost[v.id] ? commentsByPost[v.id].length : (v.commentaires || 0)}
                onLike={() => onLike(v.id)}
                onRepost={v.type === "video" ? undefined : () => onRepost(v.id)}
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
              p.type === "video_courte" ? (
                <RepostedInstantCard key={p.id} item={p} onOpen={setViewingInstant} />
              ) : (
                <PostCard
                  onOpenProfile={onOpenProfile}
                  key={p.id}
                  post={p}
                  liked={liked.includes(p.id)}
                  saved={saved.includes(p.id)}
                  reposted={true}
                  onRepost={() => onRepost(p.id)}
                  commentCount={commentsByPost[p.id] ? commentsByPost[p.id].length : (p.commentaires || 0)}
                  onLike={() => onLike(p.id)}
                  onSave={() => onSave(p.id)}
                  onOpenComments={() => { setSheet({ type: "comments", post: p }); onLoadComments(p.id); }}
                  onOpenActions={() => setSheet({ type: "actions", post: p })}
                  onOpenAuthor={() => onOpenProfile(p.username)}
                />
              )
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
          isAdmin={profile.role === "admin"}
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
        <CommentsSheet comments={commentsByPost[sheet.post.id] || []} onClose={() => setSheet(null)} onAdd={(texte, parentId) => onAddComment(sheet.post.id, texte, parentId)} onDelete={onDeleteComment ? (commentId) => onDeleteComment(sheet.post.id, commentId) : undefined} meUsername={profile.username} onOpenProfile={onOpenProfile} />
      )}
      {editing && <ProfileEditor profile={profile} onClose={() => setEditing(false)} onSave={(p) => { setProfile(p); setEditing(false); }} />}
      {dogForm && <DogFormScreen onClose={() => setDogForm(false)} onSaved={(d) => { addDog(d); setDogForm(false); }} />}
      {openDog && (
        <DogPage
          dog={openDog}
          onClose={() => setOpenDog(null)}
          onOpenProfile={onOpenProfile}
          onOpenPlayer={onOpenPlayer}
          meUsername={profile.username}
          isAdmin={profile.role === "admin"}
          liked={liked}
          saved={saved}
          reposted={reposted}
          commentsByPost={commentsByPost}
          onLike={onLike}
          onSave={onSave}
          onRepost={onRepost}
          onAddComment={onAddComment}
          onDelete={onDelete}
          onDeleteComment={onDeleteComment}
          onEditRequest={onEditRequest}
          onReport={onReport}
          onHide={onHide}
          onBlock={onBlock}
          onLoadComments={onLoadComments}
        />
      )}
      {followSheet && <FollowListSheet userId={profile.id} mode={followSheet} onClose={() => setFollowSheet(null)} onOpenProfile={onOpenProfile} />}
      {viewingInstant && (
        <SingleInstantViewer
          item={viewingInstant}
          onClose={() => setViewingInstant(null)}
          liked={liked.includes(viewingInstant.id)}
          reposted={true}
          commentCount={commentsByPost[viewingInstant.id] ? commentsByPost[viewingInstant.id].length : (viewingInstant.commentaires || 0)}
          onLike={() => onLike(viewingInstant.id)}
          onRepost={() => onRepost(viewingInstant.id)}
          onOpenComments={() => { setSheet({ type: "comments", post: viewingInstant }); onLoadComments(viewingInstant.id); }}
          onOpenActions={() => setSheet({ type: "actions", post: viewingInstant })}
          onOpenAuthor={() => onOpenProfile(viewingInstant.username)}
        />
      )}
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
function DirectConversationOptionsSheet({ conversationId, otherUser, onClose, onOpenProfile, onBlock, onReport, onDeleted }) {
  const { colors } = useTheme();
  const [confirmAction, setConfirmAction] = useState(null); // 'delete' | 'block' | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);

  const deleteConversation = async () => {
    setBusy(true);
    setError("");
    try {
      await messageService.leaveConversation(conversationId);
      onDeleted();
    } catch (e) {
      setError(e.message || "Impossible de supprimer cette conversation pour le moment.");
      setBusy(false);
    }
  };

  const blockUser = async () => {
    setBusy(true);
    setError("");
    try {
      await onBlock(otherUser.username);
      onDeleted();
    } catch (e) {
      setError(e.message || "Impossible de bloquer cet utilisateur pour le moment.");
      setBusy(false);
    }
  };

  if (showReport) {
    return (
      <ReportSheet
        onClose={onClose}
        onSubmit={(reason) => onReport({ targetId: otherUser.id, targetType: "user", reason })}
      />
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 71 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`, pointerEvents: "none" }}>
        <div style={{ width: "100%", maxWidth: 460, background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, boxShadow: "0 12px 40px rgba(0,0,0,0.22)", pointerEvents: "auto", position: "relative" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
          <div style={{ position: "absolute", top: 10, right: 12 }}><IconButton icon={X} onClick={onClose} size={30} /></div>
          <div style={{ padding: "10px 20px 20px" }}>
            {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "10px 14px", fontSize: 12, color: colors.error, marginBottom: 10 }}>{error}</div>}
            {confirmAction ? (
              <div style={{ background: colors.errorSoft, borderRadius: RADIUS.lg, padding: 14 }}>
                <div style={{ fontSize: 12.5, color: colors.error, marginBottom: 10 }}>
                  {confirmAction === "delete" ? "Supprimer cette conversation ? Vous ne recevrez plus ses messages." : `Bloquer @${otherUser?.username} ? Vous ne pourrez plus vous voir mutuellement.`}
                </div>
                <div className="flex gap-3">
                  <button onClick={confirmAction === "delete" ? deleteConversation : blockUser} disabled={busy} style={{ background: "none", border: "none", color: colors.error, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{busy ? "..." : "Confirmer"}</button>
                  <button onClick={() => setConfirmAction(null)} style={{ background: "none", border: "none", color: colors.error, textDecoration: "underline", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                </div>
              </div>
            ) : (
              <>
                {otherUser && (
                  <button onClick={() => { onClose(); onOpenProfile(otherUser.username); }} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>Voir le profil</span>
                  </button>
                )}
                <button onClick={() => setConfirmAction("delete")} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>Supprimer la conversation</span>
                </button>
                {otherUser && (
                  <>
                    <button onClick={() => setShowReport(true)} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>Signaler</span>
                    </button>
                    <button onClick={() => setConfirmAction("block")} className="flex items-center" style={{ width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.error }}>Bloquer @{otherUser.username}</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function GroupConversationSettingsSheet({ conversationId, title, image, onClose, onImageChanged, onLeave, onOpenProfile }) {
  const { colors } = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    messageService.fetchConversationMembers(conversationId).then(setMembers).catch(() => {}).finally(() => setLoading(false));
  }, [conversationId]);

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await messageService.uploadConversationImage(conversationId, file);
      onImageChanged(url);
    } catch (err) {
      setError(err.message || "Impossible de mettre à jour la photo pour le moment.");
    } finally {
      setUploading(false);
    }
  };

  const doLeave = async () => {
    setLeaving(true);
    try {
      await messageService.leaveConversation(conversationId);
      onLeave();
    } catch (err) {
      setError(err.message || "Impossible de quitter ce groupe pour le moment.");
      setLeaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 71 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`, pointerEvents: "none" }}>
        <div style={{ width: "100%", maxWidth: 460, maxHeight: "80vh", background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, boxShadow: "0 12px 40px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
          <div className="flex items-center justify-between" style={{ padding: "6px 16px 10px" }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>Infos du groupe</span>
            <IconButton icon={X} onClick={onClose} size={30} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
            <div className="flex flex-col items-center" style={{ marginBottom: 16 }}>
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} style={{ display: "none" }} />
              <button onClick={() => imageInputRef.current?.click()} disabled={uploading} style={{ width: 76, height: 76, borderRadius: RADIUS.pill, background: colors.surfaceAlt, border: "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", position: "relative", padding: 0 }}>
                {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Users size={26} color={colors.textFaint} />}
                {uploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Camera size={18} color="#fff" />
                  </div>
                )}
              </button>
              <button onClick={() => imageInputRef.current?.click()} style={{ background: "none", border: "none", fontSize: 12, color: colors.accent, fontWeight: 700, marginTop: 8, cursor: "pointer" }}>{uploading ? "Envoi..." : "Changer la photo"}</button>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginTop: 6 }}>{title}</div>
            </div>
            {error && <div style={{ background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "10px 14px", fontSize: 12, color: colors.error, marginBottom: 12 }}>{error}</div>}
            <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textFaint, letterSpacing: 0.5, marginBottom: 8 }}>MEMBRES</div>
            {loading ? (
              <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, padding: 16 }}>Chargement...</div>
            ) : (
              <div className="flex flex-col gap-1">
                {members.map((m) => (
                  <button key={m.id} onClick={() => { onClose(); onOpenProfile(m.username); }} className="flex items-center gap-3" style={{ width: "100%", background: "none", border: "none", padding: "8px 4px", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {m.avatar ? <img src={m.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={14} color={colors.textFaint} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{m.nom}</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginTop: 20 }}>
              {!confirmLeave ? (
                <button onClick={() => setConfirmLeave(true)} style={{ width: "100%", background: colors.errorSoft, border: "none", borderRadius: RADIUS.lg, padding: "12px 14px", fontSize: 13, fontWeight: 700, color: colors.error, cursor: "pointer", textAlign: "left" }}>Quitter le groupe</button>
              ) : (
                <div style={{ background: colors.errorSoft, borderRadius: RADIUS.lg, padding: 14 }}>
                  <div style={{ fontSize: 12.5, color: colors.error, marginBottom: 10 }}>Voulez-vous vraiment quitter ce groupe ? Vous ne recevrez plus ses messages.</div>
                  <div className="flex gap-3">
                    <button onClick={doLeave} disabled={leaving} style={{ background: "none", border: "none", color: colors.error, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{leaving ? "..." : "Quitter"}</button>
                    <button onClick={() => setConfirmLeave(false)} style={{ background: "none", border: "none", color: colors.error, textDecoration: "underline", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// Les vocaux étaient toujours réenregistrés en tant que "audio/webm", quel que
// soit ce que MediaRecorder produisait réellement — Safari (iOS/macOS) ne sait
// PAS enregistrer en webm et choisit son propre conteneur (généralement
// audio/mp4) : le fichier envoyé mentait donc sur son propre format, et la
// lecture échouait selon l'appareil. On détecte ici le premier type que le
// navigateur sait réellement produire, dans l'ordre de préférence.
function pickAudioMimeType() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg;codecs=opus", "audio/mpeg"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}
function audioExtensionFor(mimeType) {
  if (mimeType.includes("mp4") || mimeType.includes("aac")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mpeg")) return "mp3";
  return "webm";
}
function ConversationThread({ conversationId, meId, onClose, onLeave, title, subtitle, type, image, otherUser, onOpenProfile, onBlock, onReport, onRead }) {
  const { colors } = useTheme();
  const [groupImage, setGroupImage] = useState(image || null);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  // last_read_at des AUTRES membres (jamais le mien) — sert à afficher "Lu"
  // sous mon dernier message envoyé, tenu à jour en direct par realtime.
  const [readState, setReadState] = useState([]);
  const [replyTo, setReplyTo] = useState(null); // { id, texte, auteur } | null
  const lastTapRef = useRef({ id: null, time: 0 });
  // Rester appuyé sur un message pour y répondre (au lieu d'une flèche
  // visible sur chaque bulle) — un seul minuteur réutilisé, jamais deux
  // pressions longues actives en même temps.
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);
  // Deux messages qui arrivent coup sur coup déclenchent deux refetch() qui
  // peuvent se terminer dans le désordre — sans garde, la réponse la plus
  // lente écrase la plus récente et la conversation reste figée jusqu'à ce
  // qu'on la rouvre. On n'applique donc que la toute dernière requête lancée.
  const fetchSeqRef = useRef(0);
  const refetch = () => {
    const seq = ++fetchSeqRef.current;
    return messageService.fetchMessages(conversationId).then((rows) => { if (seq === fetchSeqRef.current) setMessages(rows); }).catch(() => {});
  };
  const markRead = async () => {
    // Deux systèmes distincts à mettre à jour : last_read_at (badge de la
    // barre de navigation) et les notifications "message"/"group_invite" en
    // base (badge de la cloche, voir migration 014) — indépendants l'un de
    // l'autre jusqu'ici, d'où la notification qui ne se retirait jamais.
    await Promise.allSettled([
      messageService.markConversationRead(conversationId),
      notificationService.markReadByTarget(conversationId, ["message", "group_invite"]),
    ]);
    onRead?.();
  };

  // Remet le champ à sa hauteur d'une ligne une fois le message envoyé — la
  // hauteur est sinon pilotée directement en DOM par l'auto-grandissement
  // (onChange du textarea), donc jamais réinitialisée par React seul.
  useEffect(() => {
    if (text === "" && textareaRef.current) textareaRef.current.style.height = "auto";
  }, [text]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    const seq = ++fetchSeqRef.current;
    messageService.fetchMessages(conversationId)
      .then((rows) => { if (!cancelled && seq === fetchSeqRef.current) setMessages(rows); })
      .catch((e) => { if (!cancelled) setLoadError(e.message || "Impossible de charger les messages."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    messageService.fetchConversationReadState(conversationId, meId).then((rows) => { if (!cancelled) setReadState(rows); }).catch(() => {});
    markRead(); // ouvrir la conversation = la marquer comme lue
    // Le payload realtime brut ne contient pas les jointures (profil, média) —
    // on recharge donc le fil complet à chaque nouveau message plutôt que
    // d'ajouter la ligne brute reçue. La conversation reste "lue" tant qu'elle
    // est ouverte : on remet à jour last_read_at à chaque message reçu ici.
    const unsubscribe = messageService.subscribeToConversation(conversationId, () => { if (!cancelled) { refetch(); markRead(); } });
    // Fait passer "Lu" en direct dès que l'autre personne ouvre la conversation,
    // sans avoir besoin de rouvrir/recharger la sienne (voir migration 032).
    const unsubscribeRead = messageService.subscribeToReadState(conversationId, (updated) => {
      if (cancelled || updated.user_id === meId) return;
      setReadState((rs) => rs.map((r) => (r.user_id === updated.user_id ? { ...r, last_read_at: updated.last_read_at } : r)));
    });
    return () => { cancelled = true; unsubscribe(); unsubscribeRead(); };
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
    const replyToId = replyTo?.id || null;
    setReplyTo(null);
    try {
      const sent = await messageService.sendMessage(conversationId, texte, replyToId);
      setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
    } catch (e) {
      setText(texte); // on redonne le texte pour ne pas le perdre
      setReplyTo(replyToId ? replyTo : null);
    } finally {
      setSending(false);
    }
  };

  const deleteMsg = async (msg) => {
    const previous = messages;
    setMessages((m) => m.filter((x) => x.id !== msg.id));
    try {
      await messageService.deleteMessage(msg.id, msg.message_media?.[0]?.url || null);
    } catch (e) {
      setMessages(previous); // échec réel : on remet le message, pas de suppression silencieuse fausse
    }
  };

  // Double-tap (façon Instagram) = réagir avec un cœur. Détection manuelle
  // (deux taps sur le même message en moins de 300ms) plutôt que le double-
  // clic natif, peu fiable sur mobile pour un vrai double-tap tactile.
  const handleBubbleTap = (msg) => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (last.id === msg.id && now - last.time < 300) {
      lastTapRef.current = { id: null, time: 0 };
      const mine = msg.message_reactions?.some((r) => r.user_id === meId);
      const previous = messages;
      setMessages((ms) => ms.map((m) => {
        if (m.id !== msg.id) return m;
        const reactions = m.message_reactions || [];
        return { ...m, message_reactions: mine ? reactions.filter((r) => r.user_id !== meId) : [...reactions, { user_id: meId, emoji: "❤️" }] };
      }));
      messageService.toggleMessageReaction(msg.id).catch(() => setMessages(previous));
    } else {
      lastTapRef.current = { id: msg.id, time: now };
    }
  };

  const pickMedia = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMediaError("");
    setSending(true);
    const replyToId = replyTo?.id || null;
    setReplyTo(null);
    try {
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      const sent = await messageService.sendMediaMessage(conversationId, file, mediaType, null, replyToId);
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
      const preferredType = pickAudioMimeType();
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      // recorder.mimeType = ce que le navigateur utilise VRAIMENT (peut différer
      // de preferredType) — c'est cette valeur, jamais une supposition, qui doit
      // étiqueter le fichier envoyé.
      recorderRef.current = { recorder, stream, mimeType: recorder.mimeType || preferredType || "audio/webm" };
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
    // Content-Type déclaré au bucket sans paramètre de codec (ex : pas
    // "audio/webm;codecs=opus") — la liste blanche du bucket "messages"
    // (migration 015) attend le type de base exact.
    const baseType = ref.mimeType.split(";")[0];
    const blob = new Blob(chunksRef.current, { type: baseType });
    const file = new File([blob], `vocal-${Date.now()}.${audioExtensionFor(baseType)}`, { type: baseType });
    setSending(true);
    const replyToId = replyTo?.id || null;
    setReplyTo(null);
    try {
      const sent = await messageService.sendMediaMessage(conversationId, file, "audio", duration, replyToId);
      setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
    } catch (e) {
      setMediaError(e.message || "Impossible d'envoyer le message vocal.");
    } finally {
      setSending(false);
    }
  };

  // "Lu" affiché uniquement sous mon tout dernier message envoyé (comme
  // WhatsApp/iMessage) — pas sous chaque bulle, pour ne pas surcharger.
  const lastMineId = [...messages].reverse().find((x) => x.sender_id === meId)?.id || null;
  const swipeBack = useSwipeBack(onClose);

  return (
    <div ref={swipeBack} style={{ position: "fixed", inset: 0, zIndex: 70, background: colors.background, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title={title} onBack={onClose} rightAction={<IconButton icon={MoreHorizontal} onClick={() => setShowSettings(true)} />} />
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
            // En groupe, "Lu" signifie lu par TOUS les autres membres.
            const isLastMine = mine && m.id === lastMineId;
            const readByAll = isLastMine && readState.length > 0 && readState.every((r) => r.last_read_at && new Date(r.last_read_at) >= new Date(m.created_at));
            const reactionCount = m.message_reactions?.length || 0;
            const senderLabel = m.profiles?.nom || m.profiles?.username || null;
            const triggerReply = () => {
              longPressFiredRef.current = true;
              if (navigator.vibrate) navigator.vibrate(10);
              setReplyTo({ id: m.id, texte: m.texte, auteur: mine ? "Vous" : senderLabel || "ce message" });
            };
            const startLongPress = () => {
              longPressFiredRef.current = false;
              longPressTimerRef.current = window.setTimeout(triggerReply, 500);
            };
            const cancelLongPress = () => {
              if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
            };
            return (
              <div key={m.id} className="flex items-end gap-1.5" style={{ justifyContent: mine ? "flex-end" : "flex-start" }}>
                {mine && (
                  <button onClick={() => deleteMsg(m)} aria-label="Supprimer le message" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0, opacity: 0.5 }}>
                    <Trash2 size={13} color={colors.textFaint} />
                  </button>
                )}
                <div style={{ maxWidth: "78%" }}>
                  {!mine && senderLabel && (
                    <button onClick={() => onOpenProfile(m.profiles.username)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 10.5, color: colors.textFaint, marginBottom: 2, marginLeft: 4 }}>
                      {senderLabel}
                    </button>
                  )}
                  <div
                    onClick={() => { if (!longPressFiredRef.current) handleBubbleTap(m); }}
                    onTouchStart={startLongPress}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onTouchCancel={cancelLongPress}
                    style={{
                      position: "relative",
                      background: mine ? `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)` : colors.headerBg,
                      backdropFilter: mine ? "none" : "blur(20px)",
                      WebkitBackdropFilter: mine ? "none" : "blur(20px)",
                      color: mine ? colors.onAccent : colors.text,
                      borderRadius: RADIUS.lg,
                      borderBottomRightRadius: mine ? 5 : RADIUS.lg,
                      borderBottomLeftRadius: mine ? RADIUS.lg : 5,
                      padding: media && !m.texte ? 6 : "9px 13px",
                      fontSize: 13.5,
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                      boxShadow: mine ? `0 2px 8px ${colors.accent}30` : "0 1px 6px rgba(0,0,0,0.05)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {m.reply_to && (m.reply_to.texte || m.reply_to.profiles?.username) && (
                      <div style={{ borderLeft: `2.5px solid ${mine ? "rgba(255,255,255,0.6)" : colors.accent}`, paddingLeft: 8, marginBottom: 6, opacity: 0.8 }}>
                        {(m.reply_to.profiles?.nom || m.reply_to.profiles?.username) && (
                          <div style={{ fontSize: 10.5, fontWeight: 700 }}>{m.reply_to.profiles?.nom || m.reply_to.profiles?.username}</div>
                        )}
                        {m.reply_to.texte && (
                          <div style={{ fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{m.reply_to.texte}</div>
                        )}
                      </div>
                    )}
                    {m.shared_post && (() => {
                      const sp = m.shared_post;
                      const spMedia = sp.post_media?.[0];
                      const spThumb = spMedia?.type === "video" ? spMedia.thumbnail_url : spMedia?.url;
                      const spIsVideo = sp.type === "video" || sp.type === "video_courte";
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); if (sp.profiles?.username) onOpenProfile(sp.profiles.username); }}
                          className="flex items-center gap-2"
                          style={{ width: "100%", background: mine ? "rgba(255,255,255,0.14)" : colors.surfaceAlt, border: "none", borderRadius: RADIUS.md, padding: 6, marginBottom: m.texte ? 6 : 0, cursor: "pointer", textAlign: "left" }}
                        >
                          <div style={{ position: "relative", width: 44, height: 44, borderRadius: RADIUS.sm, overflow: "hidden", background: "#000", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {spThumb ? <img src={spThumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : spIsVideo ? <Film size={16} color="rgba(255,255,255,0.6)" /> : <TypeIcon size={16} color={colors.textFaint} />}
                            {spIsVideo && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)" }}><Play size={12} color="#fff" fill="#fff" /></div>}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>{sp.type === "video" ? "Vidéo" : sp.type === "video_courte" ? "Instant" : sp.type === "sondage" ? "Sondage" : "Publication"} de {sp.profiles?.nom || sp.profiles?.username || "quelqu'un"}</div>
                            <div style={{ fontSize: 11.5, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{sp.titre || sp.texte || ""}</div>
                          </div>
                        </button>
                      );
                    })()}
                    {media && <MessageBubble mine={mine} media={media} colors={colors} />}
                    {m.texte && <div style={{ marginTop: media ? 6 : 0 }}>{m.texte}</div>}
                    {reactionCount > 0 && (
                      <div style={{ position: "absolute", bottom: -8, [mine ? "left" : "right"]: -4, background: colors.accent, borderRadius: RADIUS.pill, padding: "2px 6px", fontSize: 10.5, boxShadow: "0 1px 4px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 2 }}>
                        <Heart size={11} color="#fff" fill="#fff" />
                        {reactionCount > 1 && <span style={{ color: "#fff", fontWeight: 700 }}>{reactionCount}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 9.5, color: colors.textFaint, marginTop: 2, textAlign: mine ? "right" : "left" }}>
                    {formatRelativeDate(m.created_at)}
                    {isLastMine && (readByAll ? <span style={{ color: colors.accent, fontWeight: 600 }}> · Lu</span> : <span> · Envoyé</span>)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {mediaError && <div style={{ margin: "0 12px 8px", background: colors.errorSoft, borderRadius: RADIUS.sm, padding: "8px 12px", fontSize: 11.5, color: colors.error }}>{mediaError}</div>}
      {replyTo && (
        <div className="flex items-center justify-between" style={{ margin: "0 12px 8px", background: colors.surfaceAlt, borderRadius: RADIUS.lg, padding: "8px 12px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.accent }}>Réponse à {replyTo.auteur}</div>
            {replyTo.texte && <div style={{ fontSize: 11.5, color: colors.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.texte}</div>}
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, marginLeft: 8, display: "flex" }}><X size={14} color={colors.textFaint} /></button>
        </div>
      )}
      <div className="flex items-end gap-2" style={{ padding: `10px 16px calc(14px + env(safe-area-inset-bottom, 0px))` }}>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={pickMedia} style={{ display: "none" }} />
        {recording ? (
          <button onClick={stopRecording} className="flex items-center gap-2" style={{ flex: 1, border: `1.5px solid ${colors.error}`, background: colors.errorSoft, borderRadius: RADIUS.pill, padding: "10px 16px", cursor: "pointer" }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: colors.error }} />
            <span style={{ fontSize: 13, color: colors.error, fontWeight: 600 }}>Enregistrement... {recordSeconds}s (toucher pour envoyer)</span>
          </button>
        ) : (
          <>
            <div style={{ paddingBottom: 1 }}><IconButton icon={ImageIcon} onClick={() => fileInputRef.current?.click()} /></div>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              rows={1}
              placeholder="Écrire un message..."
              // Entrée insère un saut de ligne (comportement par défaut d'un
              // textarea) — l'envoi ne se fait plus qu'au tap sur la flèche.
              style={{ flex: 1, border: "none", background: colors.surfaceAlt, borderRadius: RADIUS.xl, padding: "11px 16px", fontSize: 13.5, color: colors.text, outline: "none", resize: "none", maxHeight: 120, overflowY: "auto", lineHeight: 1.35, fontFamily: FONT }}
            />
            {text.trim() ? (
              <button onClick={submit} disabled={sending} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, background: colors.accent, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: `0 2px 8px ${colors.accent}40` }}>
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
      {showSettings && type === "group" && (
        <GroupConversationSettingsSheet
          conversationId={conversationId}
          title={title}
          image={groupImage}
          onClose={() => setShowSettings(false)}
          onImageChanged={(url) => setGroupImage(url)}
          onLeave={() => { setShowSettings(false); onLeave ? onLeave() : onClose(); }}
          onOpenProfile={onOpenProfile}
        />
      )}
      {showSettings && type !== "group" && (
        <DirectConversationOptionsSheet
          conversationId={conversationId}
          otherUser={otherUser}
          onClose={() => setShowSettings(false)}
          onOpenProfile={onOpenProfile}
          onBlock={onBlock}
          onReport={onReport}
          onDeleted={() => { setShowSettings(false); onLeave ? onLeave() : onClose(); }}
        />
      )}
    </div>
  );
}
/** Recherche d'un utilisateur (bouton loupe du header) — tap sur un résultat
 *  ouvre son vrai profil public. */
function UserSearchSheet({ onClose, onOpenProfile }) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

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

  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "fixed", inset: 0, zIndex: 70, background: colors.background, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title="Rechercher" onCloseX={onClose} />
      <div style={{ padding: "14px 16px 10px" }}>
        <div className="flex items-center gap-2" style={{ background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "10px 14px" }}>
          <Search size={17} color={colors.textFaint} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un pseudo ou un nom" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: colors.text, flex: 1 }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
        {searching ? (
          <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginTop: 20 }}>Recherche...</div>
        ) : results.length === 0 ? (
          <EmptyState title={query.trim() ? "Aucun résultat" : "Rechercher quelqu'un"} subtitle={query.trim() ? `Personne ne correspond à « ${query} ».` : "Tapez un pseudo ou un nom pour trouver un compte."} />
        ) : (
          results.map((u) => (
            <button
              key={u.id}
              onClick={() => { onOpenProfile(u.username); onClose(); }}
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
            </button>
          ))
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);
  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

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
      onStarted(conversationId, u.nom || u.username, "direct", u.avatar_url, { id: u.id, username: u.username, nom: u.nom, avatar: u.avatar_url });
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
      if (imageFile) {
        try { await messageService.uploadConversationImage(conversationId, imageFile); } catch (e) { /* le groupe existe déjà, la photo pourra être ajoutée plus tard */ }
      }
      onStarted(conversationId, groupName.trim(), "group", imagePreview);
    } catch (e) {
      setError(e.message || "Impossible de créer ce groupe pour le moment.");
    } finally {
      setCreating(false);
    }
  };

  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "fixed", inset: 0, zIndex: 70, background: colors.background, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title={groupMode ? "Nouveau groupe" : "Nouveau message"} onCloseX={onClose} />
      <div style={{ padding: "14px 16px 10px" }}>
        <SegmentedControl
          options={[{ key: "direct", label: "Message direct" }, { key: "group", label: "Groupe" }]}
          value={groupMode ? "group" : "direct"}
          onChange={(k) => setGroupMode(k === "group")}
        />
      </div>
      {groupMode && (
        <div style={{ padding: "0 16px 10px" }}>
          <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} style={{ display: "none" }} />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-3"
            style={{ width: "100%", border: "none", background: colors.surfaceAlt, borderRadius: RADIUS.lg, padding: 10, cursor: "pointer", marginBottom: 12, textAlign: "left" }}
          >
            <div style={{ width: 44, height: 44, borderRadius: RADIUS.pill, background: colors.surface, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {imagePreview ? <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={17} color={colors.textFaint} />}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.textSecondary }}>{imagePreview ? "Changer la photo" : "Ajouter une photo de groupe"}</span>
          </button>
          <TextField label="Nom du groupe" value={groupName} onChange={setGroupName} placeholder="ex : Sortie du week-end" />
        </div>
      )}
      <div style={{ padding: "0 16px 10px" }}>
        <div className="flex items-center gap-2" style={{ background: colors.surfaceAlt, borderRadius: RADIUS.pill, padding: "10px 14px" }}>
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
              <div style={{ width: 38, height: 38, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
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
function ScreenMessages({ meId, initialConversationId, onConsumeInitialConversation, onOpenProfile, onBlock, onReport, onRead, chromeMode = "full" }) {
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
    if (conv) setOpenConv({ id: conv.id, title: conv.nom, type: conv.type, image: conv.avatar, otherUser: conv.type === "direct" ? conv.members?.[0] || null : null });
    onConsumeInitialConversation?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, conversations]);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: chromeMode !== "hidden" ? "calc(74px + env(safe-area-inset-top, 0px))" : "env(safe-area-inset-top, 0px)",
          zIndex: 5,
          background: colors.headerBg,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          margin: chromeMode !== "hidden" ? "0 8px" : 0,
          borderRadius: chromeMode !== "hidden" ? RADIUS.xl : 0,
          boxShadow: chromeMode !== "hidden" ? "0 4px 20px rgba(0,0,0,0.18)" : "none",
          opacity: chromeMode === "hidden" ? 0 : 1,
          transform: chromeMode === "hidden" ? "translateY(-130%)" : "translateY(0)",
          transition: "transform 260ms ease, top 260ms ease, margin 260ms ease, border-radius 260ms ease, box-shadow 260ms ease, opacity 220ms ease",
          pointerEvents: chromeMode === "hidden" ? "none" : "auto",
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>Messages</span>
          <button onClick={() => setShowNew(true)} style={{ border: `1px solid ${colors.accent}`, color: colors.accent, background: "transparent", borderRadius: RADIUS.pill, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Nouveau</button>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginTop: 24 }}>Chargement...</div>
      ) : conversations.length === 0 ? (
        <EmptyState title="Aucun message pour le moment" subtitle="Vos conversations avec les autres membres de PISTE apparaîtront ici." ctaLabel="Démarrer une conversation" onCta={() => setShowNew(true)} />
      ) : (
        <div className="flex flex-col gap-1.5" style={{ padding: "16px 12px 4px" }}>
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setOpenConv({ id: c.id, title: c.nom, type: c.type, image: c.avatar, otherUser: c.type === "direct" ? c.members?.[0] || null : null })} className="flex items-center gap-3" style={{ width: "100%", background: c.unread ? colors.accentSoft : colors.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "none", padding: "10px 12px", cursor: "pointer", textAlign: "left", borderRadius: RADIUS.xl, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ width: 46, height: 46, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {c.avatar ? <img src={c.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : c.type === "group" ? <Users size={18} color={colors.textFaint} /> : <User size={18} color={colors.textFaint} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.text }}>{c.nom}</div>
                <div style={{ fontSize: 12, color: c.unread ? colors.text : colors.textFaint, fontWeight: c.unread ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.lastMessage
                    ? `${c.lastSenderIsMe ? "Vous : " : ""}${c.lastMessage}`
                    : c.hasLastMessage
                    ? (c.lastSenderIsMe ? "Vous : nouveau message" : "Nouveau message")
                    : "Aucun message"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1" style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 10.5, color: colors.textFaint }}>{formatRelativeDate(c.lastMessageAt)}</div>
                {c.unread && <div style={{ width: 8, height: 8, borderRadius: 4, background: colors.accent }} />}
              </div>
            </button>
          ))}
        </div>
      )}
      {openConv && (
        <ConversationThread
          conversationId={openConv.id}
          meId={meId}
          onClose={() => { setOpenConv(null); refresh(); }}
          onLeave={() => { setOpenConv(null); refresh(); }}
          title={openConv.title}
          type={openConv.type}
          image={openConv.image}
          otherUser={openConv.otherUser}
          onOpenProfile={onOpenProfile}
          onBlock={onBlock}
          onReport={onReport}
          onRead={onRead}
        />
      )}
      {showNew && (
        <NewConversationSheet
          onClose={() => setShowNew(false)}
          onStarted={(conversationId, title, type, image, otherUser) => { setShowNew(false); setOpenConv({ id: conversationId, title, type, image, otherUser: otherUser || null }); refresh(); }}
        />
      )}
    </div>
  );
}

const NOTIF_ICON = { like: Heart, comment: MessageSquare, follow: User, repost: Repeat2, message: MessageCircle, group_invite: Users, new_post: Bell, new_trace: Footprints, mention: MessageSquare, moderation: AlertTriangle, system: Bell };
const NOTIF_TEXT = {
  like: (nom) => `${nom} a aimé votre publication.`,
  comment: (nom) => `${nom} a commenté votre publication.`,
  follow: (nom) => `${nom} a commencé à vous suivre.`,
  repost: (nom) => `${nom} a reposté votre publication.`,
  message: (nom) => `${nom} vous a envoyé un message.`,
  group_invite: (nom) => `${nom} vous a ajouté à un groupe de messagerie.`,
  new_post: (nom) => `${nom} a publié quelque chose de nouveau.`,
  new_trace: (nom) => `${nom} a publié une nouvelle Trace.`,
  mention: (nom) => `${nom} vous a mentionné.`,
  moderation: () => `Une action de modération concerne votre compte.`,
  system: () => `Notification système.`,
};
function FollowListSheet({ userId, mode, onClose, onOpenProfile }) {
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const title = mode === "followers" ? "Abonnés" : "Abonnements";
  const emptyText = mode === "followers" ? "Aucun abonné pour le moment." : "Ne suit encore personne.";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetcher = mode === "followers" ? socialService.fetchFollowers : socialService.fetchFollowingList;
    fetcher(userId).then((rows) => { if (!cancelled) setItems(rows); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, mode]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 65 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`, pointerEvents: "none" }}>
        <div style={{ width: "100%", maxWidth: 460, height: "72vh", background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, boxShadow: "0 12px 40px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
          <div className="flex items-center justify-between" style={{ padding: "6px 16px 10px" }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>{title}</span>
            <IconButton icon={X} onClick={onClose} size={30} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
            {loading ? (
              <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, padding: 24 }}>Chargement...</div>
            ) : items.length === 0 ? (
              <EmptyState title={title} subtitle={emptyText} />
            ) : (
              items.map((u) => (
                <button key={u.username} onClick={() => { onClose(); onOpenProfile(u.username); }} className="flex items-center gap-3" style={{ width: "100%", background: "none", border: "none", padding: "9px 8px", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 40, height: 40, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={colors.textFaint} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{u.nom || u.username}</div>
                    <div style={{ fontSize: 11.5, color: colors.textFaint }}>@{u.username}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function FollowRequestsSheet({ onClose, onApprove, onReject }) {
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socialService.fetchIncomingFollowRequests().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handle = (id, action) => {
    setItems((its) => its.filter((x) => x.id !== id));
    if (action === "approve") onApprove(id); else onReject(id);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 61 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: colors.overlay }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: `0 10px calc(10px + env(safe-area-inset-bottom, 0px))`, pointerEvents: "none" }}>
        <div style={{ width: "100%", maxWidth: 460, maxHeight: "78vh", background: colors.headerBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: RADIUS.xl, boxShadow: "0 12px 40px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "10px auto 4px" }} />
          <div className="flex items-center justify-between" style={{ padding: "6px 16px 10px" }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>Demandes d'abonnement</span>
            <IconButton icon={X} onClick={onClose} size={30} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
            {loading ? (
              <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, padding: 24 }}>Chargement...</div>
            ) : items.length === 0 ? (
              <EmptyState title="Aucune demande" subtitle="Les demandes d'abonnement à votre compte privé apparaîtront ici." />
            ) : (
              items.map((r) => (
                <div key={r.id} className="flex items-center gap-3" style={{ padding: "10px 8px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: RADIUS.pill, background: colors.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {r.avatar ? <img src={r.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={colors.textFaint} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{r.nom || r.username}</div>
                    <div style={{ fontSize: 11.5, color: colors.textFaint }}>@{r.username}</div>
                  </div>
                  <button onClick={() => handle(r.id, "reject")} style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: colors.surfaceAlt, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <X size={15} color={colors.textFaint} />
                  </button>
                  <button onClick={() => handle(r.id, "approve")} style={{ width: 34, height: 34, borderRadius: RADIUS.pill, background: colors.accent, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <Check size={15} color={colors.onAccent} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function NotificationsPanel({ onClose, onOpenConversation, onOpenAuthor, onOpenPost, onGoToFeed, onUnreadChange }) {
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
    // Chaque notification doit amener sur ce qu'elle concerne réellement —
    // pas juste sur le profil de la personne qui a agi. target_type vient
    // directement de la ligne en base (voir migrations 014/033/036) :
    // 'conversation' pour message/group_invite, 'user' pour follow, 'post'
    // pour like/comment/repost/mention/new_post.
    if (n.type === "message" || n.type === "group_invite" || n.targetType === "conversation") onOpenConversation(n.targetId);
    else if (n.targetType === "post") onOpenPost(n.targetId, n.type);
    else if (n.type === "follow" || n.actor?.username) onOpenAuthor(n.actor.username);
    else onGoToFeed();
    onClose();
  };

  const markAll = () => {
    notificationService.markAllAsRead().catch(() => {});
    setItems((its) => its.map((x) => ({ ...x, lu: true })));
    onUnreadChange?.(0);
  };

  const swipeBack = useSwipeBack(onClose);
  return (
    <div ref={swipeBack} style={{ position: "fixed", inset: 0, zIndex: 50, background: colors.background, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <ScreenHeader title="Notifications" onBack={onClose} />
      {items.some((n) => !n.lu) && (
        <div style={{ padding: "0 16px 8px", textAlign: "right" }}>
          <button onClick={markAll} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Tout marquer comme lu</button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 12px" }}>
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
              <button key={n.id} onClick={() => open(n)} className="flex items-center gap-3" style={{ width: "100%", background: n.lu ? colors.surface : colors.accentSoft, border: "none", borderRadius: RADIUS.lg, padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
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
  const swipeBackSection = useSwipeBack(section ? () => setSection(null) : null);
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null); // { type: 'error'|'success', text }
  const submitPassword = async () => {
    if (pw1.length < 8) { setPwMsg({ type: "error", text: "8 caractères minimum." }); return; }
    if (pw1 !== pw2) { setPwMsg({ type: "error", text: "Les mots de passe ne correspondent pas." }); return; }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await authService.updatePassword(pw1);
      setPwMsg({ type: "success", text: "Mot de passe mis à jour." });
      setPw1(""); setPw2("");
    } catch (e) {
      setPwMsg({ type: "error", text: e.message || "Impossible de mettre à jour le mot de passe." });
    } finally {
      setPwSaving(false);
    }
  };
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
        <div ref={swipeBackSection} style={{ position: "absolute", inset: 0, background: colors.background, display: "flex", flexDirection: "column" }}>
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
                  <div style={{ fontSize: 11.5, color: colors.textFaint, marginBottom: 8 }}>Mot de passe</div>
                  <div className="flex flex-col gap-2">
                    <TextField label="Nouveau mot de passe" value={pw1} onChange={setPw1} placeholder="8 caractères minimum" type="password" />
                    <TextField label="Confirmer le mot de passe" value={pw2} onChange={setPw2} placeholder="Confirmer" type="password" />
                    {pwMsg && <div style={{ fontSize: 12, color: pwMsg.type === "error" ? colors.error : colors.accent }}>{pwMsg.text}</div>}
                    <Button full={false} onClick={submitPassword} disabled={pwSaving || !pw1 || !pw2}>{pwSaving ? "Enregistrement..." : "Mettre à jour"}</Button>
                  </div>
                </div>
              </div>
            )}
            {section === "confidentialite" && (
              <div className="flex flex-col gap-5">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>COMPTE</div>
                  <div className="flex gap-2">
                    {[["public", "Public"], ["prive", "Privé"]].map(([k, l]) => (
                      <Chip
                        key={k}
                        label={l}
                        active={(k === "prive") === !!profile.isPrivate}
                        onClick={async () => {
                          const isPrivate = k === "prive";
                          setProfile((p) => ({ ...p, isPrivate }));
                          try {
                            await profileService.updateProfile({ nom: profile.nom, username: profile.username, bio: profile.bio, localisation: profile.localisation, isPrivate });
                          } catch (e) {
                            setProfile((p) => ({ ...p, isPrivate: !isPrivate }));
                          }
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 6, lineHeight: 1.4 }}>
                    {profile.isPrivate ? "Seuls vos abonnés approuvés voient vos publications." : "Tout le monde peut voir vos publications."}
                  </div>
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
                <button onClick={() => setSection("compte")} className="flex items-center justify-between" style={{ width: "100%", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: RADIUS.sm, padding: "13px 14px", cursor: "pointer" }}>
                  <span style={{ fontSize: 12.5, color: colors.textSecondary }}>Changer le mot de passe — dans Compte</span>
                  <ChevronRight size={14} color={colors.textFaint} />
                </button>
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
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const categories = ["Problème technique", "Compte", "Sécurité", "Modération", "Contenu", "Confidentialité", "Autre"];
  const submit = async () => {
    setSending(true);
    setSendError("");
    try {
      await socialService.submitHelpRequest({ category, subject, description });
      setSent(true);
    } catch (e) {
      setSendError(e.message || "Impossible d'envoyer votre demande pour le moment.");
    } finally {
      setSending(false);
    }
  };
  if (showForm) {
    if (sent) return <EmptyState title="Demande envoyée" subtitle="Merci — l'équipe PISTE reviendra vers vous par e-mail dès que possible." />;
    return (
      <div style={{ padding: "16px 20px" }}>
        <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginBottom: 14 }}>← Retour à l'aide</button>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>CATÉGORIE</div>
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>{categories.map((c) => <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />)}</div>
        <TextField label="Sujet" value={subject} onChange={setSubject} placeholder="Résumez votre demande" />
        <TextField label="Description" value={description} onChange={setDescription} placeholder="Décrivez votre problème en détail." textarea rows={5} />
        <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: -10, marginBottom: 16 }}>Pièce jointe — bientôt disponible</div>
        {sendError && <div style={{ fontSize: 12.5, color: colors.error, marginBottom: 12 }}>{sendError}</div>}
        <Button disabled={!category || !subject || !description || sending} onClick={submit}>{sending ? "Envoi..." : "Envoyer"}</Button>
      </div>
    );
  }
  return (
    <div style={{ padding: "16px 20px" }}>
      <Button variant="secondary" onClick={() => setShowForm(true)}>Contacter PISTE</Button>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, margin: "22px 0 8px" }}>QUESTIONS FRÉQUENTES</div>
      <div className="flex flex-col gap-2">
        <AddToHomeScreenTip />
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
  const swipeBackSub = useSwipeBack(sub ? () => setSub(null) : null);
  if (!open) return null;
  const close = () => { setSub(null); setConfirmLogout(false); onClose(); };
  const doLogout = async () => {
    setLoggingOut(true);
    await onLogout(); // Root() bascule automatiquement vers l'écran d'accueil dès que la session Supabase disparaît
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 55 }}>
      <div onClick={close} style={{ position: "absolute", inset: 0, background: colors.overlay, backdropFilter: "blur(2px)" }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "80%",
          background: colors.headerBg,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          boxShadow: "-8px 0 30px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
        <div ref={swipeBackSub} style={{ position: "absolute", inset: 0, zIndex: 56, background: colors.background, display: "flex", flexDirection: "column" }}>
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
            <EmptyState title="Bientôt disponible" subtitle={sub.desc} />
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
  const [refreshKey, setRefreshKey] = useState(0);
  // Retaper sur l'onglet déjà actif remonte en haut ET force un vrai
  // rechargement (via refreshKey, qui remonte le composant de l'écran) —
  // changer d'onglet suit le chemin normal.
  const handleTabPress = (key) => {
    if (key === active) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setRefreshKey((k) => k + 1); // force le remontage de l'écran (utile pour "messages", qui se recharge à son propre montage)
      // Remonter l'écran ne recharge PAS à lui seul les données qui vivent ici,
      // dans MainApp (posts/vidéos/groupes) — on relance donc explicitement le
      // bon fetch selon l'onglet, sinon "rafraîchir" ne ferait que redéfiler.
      if (key === "fil" || key === "video" || key === "profil") {
        refreshPosts().catch(() => showToast("Impossible de rafraîchir pour le moment."));
      }
      if (key === "groupes") {
        groupService.fetchGroups().then(setGroups).catch(() => showToast("Impossible de rafraîchir pour le moment."));
      }
      if (key === "profil") {
        dogService.fetchMyDogs().then(setDogs).catch(() => {});
      }
    } else {
      setActive(key);
    }
  };
  // Comportement immersif dans tous les onglets : les barres se masquent en
  // défilant vers le bas, réapparaissent en pilule flottante en remontant —
  // même langage visuel que les onglets d'Instants. Réinitialisé à "full" à
  // chaque changement d'onglet pour ne jamais laisser les barres cachées par
  // surprise en arrivant sur un nouvel écran.
  const [chromeMode, setChromeMode] = useState("full");
  const lastScrollYRef = useRef(0);
  useEffect(() => {
    setChromeMode("full");
    lastScrollYRef.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollYRef.current;
      if (y < 40) setChromeMode("full");
      else if (delta > 4) setChromeMode("hidden");
      else if (delta < -4) setChromeMode("floating");
      lastScrollYRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [active]);
  const [notif, setNotif] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
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
          isPrivate: !!data.is_private,
        }));
        // `statistiques` restait figé à { abonnes: 0, abonnements: 0 } (valeur
        // initiale du useState, jamais mise à jour) — le profil affichait donc
        // toujours 0 abonné/abonnement, quel que soit le vrai nombre en base.
        const [{ count: abonnes }, { count: abonnements }] = await Promise.all([
          supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", data.id),
          supabase.from("follows").select("followed_id", { count: "exact", head: true }).eq("follower_id", data.id),
        ]);
        if (cancelled) return;
        setProfile((p) => ({ ...p, statistiques: { abonnes: abonnes || 0, abonnements: abonnements || 0 } }));
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
  const [traces, setTraces] = useState([]);
  const [viewingTraces, setViewingTraces] = useState(null); // { groups, startGroupIndex } | null
  const [createInitialType, setCreateInitialType] = useState(null);
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
  const [pendingFollowUsernames, setPendingFollowUsernames] = useState([]);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
  const [bellUsernames, setBellUsernames] = useState([]);
  const [blockedAuthors, setBlockedAuthors] = useState([]);
  const [hiddenPostIds, setHiddenPostIds] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState({ likes: true, commentaires: true, abonnes: true, publications: true, groupes: true, messages: true, systeme: true });
  const [privacy, setPrivacy] = useState({ compte: "public", commentaires: "tout_le_monde", messages: "tout_le_monde" });
  const [toast, setToast] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  // Cible réelle d'une notification like/commentaire/repost/mention/nouvelle
  // publication (voir openNotificationPost) — avant ça, ces notifications
  // ouvraient à tort le profil de la personne qui avait agi.
  const [notifPost, setNotifPost] = useState(null); // { post, autoOpenComments }
  const [notifInstant, setNotifInstant] = useState(null);
  const [notifInstantSheet, setNotifInstantSheet] = useState(null); // 'comments' | 'actions' | 'report' | null
  const showToast = (msg) => { setToast(msg); window.clearTimeout(showToast._t); showToast._t = window.setTimeout(() => setToast(null), 2200); };

  const openNotificationPost = async (postId, notifType) => {
    try {
      const row = await postService.fetchPostById(postId);
      const mapped = mapPostRow(row);
      if (mapped.type === "video") setPlayingVideo(mapped);
      else if (mapped.type === "video_courte") setNotifInstant(mapped);
      else setNotifPost({ post: mapped, autoOpenComments: notifType === "comment" || notifType === "mention" });
    } catch (e) {
      showToast("Ce contenu n'est plus disponible.");
    }
  };

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
    socialService.fetchMyHiddenPostIds().then(setHiddenPostIds).catch(() => {});
    socialService.fetchMyPendingRequestUsernames().then(setPendingFollowUsernames).catch(() => {});
    socialService.fetchIncomingFollowRequests().then((rows) => setIncomingRequestsCount(rows.length)).catch(() => {});
    traceService.fetchActiveTraces().then(setTraces).catch(() => {});
  }, [session, profileLoaded]);

  // Regroupe les Traces actives par auteur — la mienne toujours en premier
  // (même vide, pour le raccourci de création), puis les autres avec les
  // non-vues en tête (même logique "non vu avant vu" que les stories
  // classiques). RLS (voir migration 024) a déjà filtré les comptes privés
  // non approuvés et les Traces expirées — pas de filtre supplémentaire ici.
  const traceGroups = useMemo(() => {
    const byAuthor = new Map();
    for (const t of traces) {
      if (!byAuthor.has(t.authorId)) byAuthor.set(t.authorId, []);
      byAuthor.get(t.authorId).push(t);
    }
    const mine = byAuthor.get(profile.id) || [];
    byAuthor.delete(profile.id);
    const others = [...byAuthor.entries()].map(([authorId, list]) => ({
      authorId,
      username: list[0].username,
      nom: list[0].nom,
      avatar: list[0].avatar,
      traces: list,
      allViewed: list.every((t) => t.viewed),
      isMe: false,
    }));
    others.sort((a, b) => {
      if (a.allViewed !== b.allViewed) return a.allViewed ? 1 : -1;
      return new Date(b.traces[0].createdAt) - new Date(a.traces[0].createdAt);
    });
    const mineGroup = { authorId: profile.id, username: profile.username, nom: profile.nom || profile.username, avatar: profile.avatar, traces: mine, allViewed: mine.every((t) => t.viewed), isMe: true };
    return [mineGroup, ...others];
  }, [traces, profile.id, profile.username, profile.nom, profile.avatar]);

  const handleTraceCreated = (trace) => {
    setTraces((t) => [...t, trace]);
    setCreateInitialType(null);
    showToast("Trace publiée — visible pendant 24h.");
  };
  const viewTrace = (traceId) => {
    traceService.recordTraceView(traceId).catch(() => {});
    setTraces((t) => t.map((tr) => (tr.id === traceId ? { ...tr, viewed: true } : tr)));
  };
  const deleteTraceHandler = async (trace) => {
    try {
      await traceService.deleteTrace(trace.id, trace.mediaPath);
      setTraces((t) => t.filter((tr) => tr.id !== trace.id));
      showToast("Trace supprimée.");
    } catch (e) {
      showToast("Impossible de supprimer cette Trace pour le moment.");
    }
  };
  const openTraceGroup = (groupIndex) => setViewingTraces({ groups: traceGroups, startGroupIndex: groupIndex });
  const createOwnTrace = () => { setCreateInitialType("trace"); setCreateOpen(true); };

  const refreshUnreadCount = () => {
    notificationService.fetchUnreadCount().then(setUnreadCount).catch(() => {});
  };
  useEffect(() => {
    if (!session || !profileLoaded) return;
    refreshUnreadCount();
    const unsubscribe = notificationService.subscribeToNotifications(session.user.id, () => {
      setUnreadCount((c) => c + 1);
    });
    return unsubscribe;
  }, [session, profileLoaded]);

  const refreshUnreadConversations = () => {
    messageService.fetchUnreadConversationCount().then(setUnreadConversations).catch(() => {});
  };
  // Marque comme lue(s), en base, la ou les notifications correspondant à un
  // contenu qu'on vient d'ouvrir "en vrai" ailleurs dans l'app (messages,
  // commentaires, abonnés...) — pas seulement depuis le panneau Notifications
  // lui-même — puis rafraîchit le badge de la cloche en conséquence.
  const markNotifTargetRead = (targetId, types) => {
    notificationService.markReadByTarget(targetId, types).then(refreshUnreadCount).catch(() => {});
  };
  // Même principe sans cible précise (ex : "follow" — voir ScreenProfil,
  // ouvrir ses abonnés résout toutes les notifications de nouveaux abonnés).
  const markNotifTypeRead = (types) => {
    notificationService.markReadByType(types).then(refreshUnreadCount).catch(() => {});
  };
  // Ouvrir une conversation touche à la fois le badge "messages" de la barre
  // de navigation et celui de la cloche (voir ConversationThread.markRead).
  const refreshUnread = () => { refreshUnreadConversations(); refreshUnreadCount(); };
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
    if (type === "video" || type === "video_courte") setVideos((v) => [{ ...item, titre: item.titre || item.texte || "Sans titre" }, ...v]);
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
    showToast(current.joined ? "Vous avez quitté la communauté." : "Communauté rejointe.");
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
    // Ouvrir les commentaires d'un post = avoir vu ce qui s'y est passé :
    // retire les notifications like/comment/repost/nouvelle-publication qui
    // pointent vers ce post, sans attendre un passage par le panneau Notifications.
    markNotifTargetRead(postId, ["like", "comment", "repost", "new_post", "mention"]);
    try {
      const rows = await postService.fetchComments(postId);
      const mapped = rows.map((r) => ({
        id: r.id,
        auteur: r.profiles?.nom || r.profiles?.username || "Utilisateur",
        authorUsername: r.profiles?.username || null,
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
      comment = { id: `local-${Date.now()}`, auteur: profile.nom || profile.username || "Vous", authorUsername: profile.username, texte, date: "à l'instant", parentId: parentId || null };
    } else {
      const c = await postService.addComment(id, texte, parentId);
      comment = { id: c.id, auteur: profile.nom || profile.username || "Vous", authorUsername: profile.username, texte, date: "à l'instant", parentId: parentId || null };
    }
    setCommentsByPost((m) => ({ ...m, [id]: [...(m[id] || []), comment] }));
    bumpComments(id, 1);
  };
  const deleteComment = async (postId, commentId) => {
    const existing = commentsByPost[postId] || [];
    const removedIds = new Set([commentId, ...existing.filter((c) => c.parentId === commentId).map((c) => c.id)]);
    try {
      if (!String(commentId).startsWith("local-")) await postService.deleteComment(commentId);
    } catch (e) {
      showToast("Impossible de supprimer ce commentaire pour le moment.");
      return;
    }
    setCommentsByPost((m) => ({ ...m, [postId]: (m[postId] || []).filter((c) => !removedIds.has(c.id)) }));
    bumpComments(postId, -removedIds.size);
    showToast("Commentaire supprimé.");
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
  const hidePost = async (id) => {
    if (isLocalId(id)) { setHiddenPostIds((h) => [...h, id]); showToast("Contenu masqué."); return; }
    try {
      await socialService.hidePost(id);
      setHiddenPostIds((h) => [...h, id]);
      showToast("Contenu masqué.");
    } catch (e) {
      showToast("Impossible de masquer ce contenu pour le moment.");
    }
  };
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
  const requestFollow = async (username) => {
    if (!username) return;
    const isPending = pendingFollowUsernames.includes(username);
    try {
      await (isPending ? socialService.cancelFollowRequest(username) : socialService.requestFollow(username));
    } catch (e) {
      showToast("Action impossible pour le moment.");
      return;
    }
    setPendingFollowUsernames((p) => (isPending ? p.filter((x) => x !== username) : [...p, username]));
    showToast(isPending ? "Demande annulée." : "Demande d'abonnement envoyée.");
  };
  const approveRequest = async (requestId) => {
    try {
      await socialService.approveFollowRequest(requestId);
      setIncomingRequestsCount((c) => Math.max(0, c - 1));
      showToast("Demande approuvée.");
    } catch (e) {
      showToast("Impossible d'approuver cette demande.");
    }
  };
  const rejectRequest = async (requestId) => {
    try {
      await socialService.rejectFollowRequest(requestId);
      setIncomingRequestsCount((c) => Math.max(0, c - 1));
    } catch (e) {
      showToast("Impossible de refuser cette demande.");
    }
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
        onDeleteComment={deleteComment}
        onEditRequest={setEditingPost}
        onReport={reportContent}
        onHide={hidePost}
        onBlock={blockAuthor}
        onLoadComments={loadComments}
        chromeMode={chromeMode}
        traceGroups={traceGroups}
        onOpenTraceGroup={openTraceGroup}
        onCreateOwnTrace={createOwnTrace}
      />
    ),
    video: (
      <ScreenVideo
        videos={visibleVideos}
        profile={profile}
        liked={likedIds}
        reposted={repostedIds}
        commentsByPost={commentsByPost}
        following={following}
        bellUsernames={bellUsernames}
        onToggleFollow={toggleFollow}
        onToggleBell={toggleBell}
        onOpenProfile={setOpenProfileUsername}
        onLike={toggleLike}
        onRepost={toggleRepost}
        onAddComment={addComment}
        onDelete={deleteContent}
        onDeleteComment={deleteComment}
        onEditRequest={setEditingPost}
        onReport={reportContent}
        onHide={hidePost}
        onBlock={blockAuthor}
        onLoadComments={loadComments}
        onOpenPlayer={setPlayingVideo}
        onChromeMode={setChromeMode}
        chromeMode={chromeMode}
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
        onDeleteComment={deleteComment}
        onEditRequest={setEditingPost}
        onReport={reportContent}
        onHide={hidePost}
        onBlock={blockAuthor}
        onLoadComments={loadComments}
        chromeMode={chromeMode}
      />
    ),
    messages: <ScreenMessages meId={session?.user?.id} initialConversationId={pendingConversationId} onConsumeInitialConversation={() => setPendingConversationId(null)} onOpenProfile={setOpenProfileUsername} onBlock={blockAuthor} onReport={reportContent} onRead={refreshUnread} chromeMode={chromeMode} />,
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
        onDeleteComment={deleteComment}
        onEditRequest={setEditingPost}
        onReport={reportContent}
        onHide={hidePost}
        onBlock={blockAuthor}
        onLoadComments={loadComments}
        chromeMode={chromeMode}
        incomingRequestsCount={incomingRequestsCount}
        onApproveRequest={approveRequest}
        onRejectRequest={rejectRequest}
        traceGroup={traceGroups[0]}
        onOpenTrace={() => openTraceGroup(0)}
        onOpenFollowers={() => markNotifTypeRead(["follow"])}
      />
    ),
  };

  if (!profileLoaded) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.background }}>
        <div style={{ fontSize: 13, color: colors.textSecondary }}>Chargement de votre profil...</div>
      </div>
    );
  }

  return (
    <AppShell header={<Header onBell={() => setNotif(true)} onMenu={() => setPlusOpen(true)} onSearch={() => setShowUserSearch(true)} unreadCount={unreadCount} chromeMode={chromeMode} />} active={active} setActive={handleTabPress} onCreate={() => setCreateOpen(true)} unreadConversations={unreadConversations} chromeMode={chromeMode} refreshKey={refreshKey}>
      {screens[active]}
      {notif && (
        <NotificationsPanel
          onClose={() => setNotif(false)}
          onUnreadChange={setUnreadCount}
          onOpenConversation={(conversationId) => { setPendingConversationId(conversationId); setActive("messages"); }}
          onOpenAuthor={setOpenProfileUsername}
          onOpenPost={openNotificationPost}
          onGoToFeed={() => setActive("fil")}
        />
      )}
      {showUserSearch && <UserSearchSheet onClose={() => setShowUserSearch(false)} onOpenProfile={setOpenProfileUsername} />}
      {openProfileUsername && (
        <AuthorProfileSheet
          username={openProfileUsername}
          meUsername={profile.username}
          isAdmin={profile.role === "admin"}
          isFollowing={following.includes(openProfileUsername)}
          isPending={pendingFollowUsernames.includes(openProfileUsername)}
          bellOn={bellUsernames.includes(openProfileUsername)}
          onClose={() => setOpenProfileUsername(null)}
          onToggleFollow={() => toggleFollow(openProfileUsername)}
          onRequestFollow={() => requestFollow(openProfileUsername)}
          onToggleBell={() => toggleBell(openProfileUsername)}
          onOpenProfile={setOpenProfileUsername}
          onOpenPlayer={setPlayingVideo}
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
          onDeleteComment={deleteComment}
          onEditRequest={setEditingPost}
          onReport={reportContent}
          onHide={hidePost}
          onBlock={blockAuthor}
          onLoadComments={loadComments}
          traceGroup={traceGroups.find((g) => g.username === openProfileUsername)}
          onOpenTrace={() => { const idx = traceGroups.findIndex((g) => g.username === openProfileUsername); if (idx >= 0) { setOpenProfileUsername(null); openTraceGroup(idx); } }}
        />
      )}
      <CreateFlow
        open={createOpen || !!editingPost}
        onClose={() => { setCreateOpen(false); setCreateGroupId(null); setEditingPost(null); setCreateInitialType(null); }}
        dogs={dogs}
        authorName={profile.nom || "Vous"}
        onPublished={handlePublished}
        onTraceCreated={handleTraceCreated}
        editingPost={editingPost}
        onEdited={handleEdited}
        groupId={createGroupId}
        initialType={createInitialType}
      />
      {viewingTraces && (
        <TraceViewer
          groups={viewingTraces.groups}
          startGroupIndex={viewingTraces.startGroupIndex}
          onClose={() => setViewingTraces(null)}
          meUsername={profile.username}
          onView={viewTrace}
          onDelete={deleteTraceHandler}
          onOpenProfile={(username) => { setViewingTraces(null); setOpenProfileUsername(username); }}
        />
      )}
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
      {notifPost && (
        <SinglePostViewer
          post={notifPost.post}
          autoOpenComments={notifPost.autoOpenComments}
          onClose={() => setNotifPost(null)}
          onOpenProfile={setOpenProfileUsername}
          meUsername={profile.username}
          isAdmin={profile.role === "admin"}
          liked={likedIds}
          saved={savedPostIds}
          reposted={repostedIds}
          commentsByPost={commentsByPost}
          onLike={toggleLike}
          onSave={toggleSave}
          onRepost={toggleRepost}
          onAddComment={addComment}
          onDelete={deleteContent}
          onDeleteComment={deleteComment}
          onEditRequest={setEditingPost}
          onReport={reportContent}
          onHide={hidePost}
          onBlock={blockAuthor}
          onLoadComments={loadComments}
        />
      )}
      {notifInstant && (
        <SingleInstantViewer
          item={notifInstant}
          onClose={() => { setNotifInstant(null); setNotifInstantSheet(null); }}
          liked={likedIds.includes(notifInstant.id)}
          reposted={repostedIds.includes(notifInstant.id)}
          commentCount={commentsByPost[notifInstant.id] ? commentsByPost[notifInstant.id].length : (notifInstant.commentaires || 0)}
          onLike={() => toggleLike(notifInstant.id)}
          onRepost={() => toggleRepost(notifInstant.id)}
          onOpenComments={() => { setNotifInstantSheet("comments"); loadComments(notifInstant.id); }}
          onOpenActions={() => setNotifInstantSheet("actions")}
          onOpenAuthor={() => setOpenProfileUsername(notifInstant.username)}
        />
      )}
      {notifInstant && notifInstantSheet === "actions" && (
        <ContentActionSheet
          isOwn={notifInstant.username === profile.username}
          isAdmin={profile.role === "admin"}
          onClose={() => setNotifInstantSheet(null)}
          onEdit={() => { setNotifInstantSheet(null); setEditingPost(notifInstant); }}
          onDelete={() => { deleteContent(notifInstant.id); setNotifInstant(null); setNotifInstantSheet(null); }}
          onReport={() => setNotifInstantSheet("report")}
          onHide={() => { hidePost(notifInstant.id); setNotifInstant(null); setNotifInstantSheet(null); }}
          onBlock={() => { blockAuthor(notifInstant.username); setNotifInstant(null); setNotifInstantSheet(null); }}
        />
      )}
      {notifInstant && notifInstantSheet === "report" && (
        <ReportSheet onClose={() => setNotifInstantSheet(null)} onSubmit={(reason) => { reportContent({ targetId: notifInstant.id, targetType: "post", reason }); setNotifInstantSheet(null); }} />
      )}
      {notifInstant && notifInstantSheet === "comments" && (
        <CommentsSheet
          comments={commentsByPost[notifInstant.id] || []}
          onClose={() => setNotifInstantSheet(null)}
          onAdd={(texte, parentId) => addComment(notifInstant.id, texte, parentId)}
          onDelete={(commentId) => deleteComment(notifInstant.id, commentId)}
          meUsername={profile.username}
          onOpenProfile={setOpenProfileUsername}
        />
      )}
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
      <div style={{ minHeight: "100dvh", background: colors.background, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
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
    <div style={{ minHeight: "100dvh", background: colors.background, display: "flex", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100dvh" }}>{flow[stage]}</div>
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
