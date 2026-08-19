// huntingLogService.js
// Carnet de chasse — strictement privé (table "hunting_logs", voir migration
// 025_carnet_chasse.sql). Aucune fonction ici ne peut jamais renvoyer les
// entrées d'un autre utilisateur : la RLS ("owner manages own hunting logs")
// filtre déjà tout par auth.uid(), mais chaque requête reste explicitement
// scoped à l'utilisateur connecté par prudence (défense en profondeur).
//
// Photos : bucket Storage "carnet", public = false. On ne stocke JAMAIS
// d'URL publique en base, seulement le chemin brut (`path`) — une URL signée
// temporaire est générée à la demande, uniquement pour le propriétaire
// authentifié (la RLS Storage refuse la génération sinon).

import { supabase } from "./supabaseClient.js";

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Non authentifié");
  return data.user;
}

const LOG_SELECT = "*, dogs(id, nom, photo_url), hunting_log_photos(id, path, ordre), hunting_log_companions(user_id, profiles(id, username, nom, avatar_url)), profiles!hunting_logs_user_id_fkey(id, username, nom, avatar_url)";

// Un seul appel groupé (createSignedUrls) plutôt qu'un aller-retour par photo
// — un carnet avec beaucoup de sorties illustrées de plusieurs photos
// multipliait sinon les requêtes réseau rien que pour afficher une sortie.
async function signPhotoUrls(photos) {
  if (!photos || photos.length === 0) return [];
  const sorted = [...photos].sort((a, b) => a.ordre - b.ordre);
  const { data: signed, error } = await supabase.storage.from("carnet").createSignedUrls(sorted.map((p) => p.path), 3600);
  if (error) return [];
  const byPath = new Map(signed.filter((s) => !s.error).map((s) => [s.path, s.signedUrl]));
  return sorted.map((p) => ({ id: p.id, path: p.path, url: byPath.get(p.path) || null })).filter((p) => p.url);
}

/**
 * meId sert à distinguer "ma sortie" ("isOwner: true") d'une sortie où je
 * n'ai été qu'identifié comme compagnon (voir migration 034) — dans ce
 * second cas, notes reste vide côté client même si jamais renvoyé par une
 * requête mal filtrée : les notes personnelles ne regardent que le
 * propriétaire, seul le fait de la sortie est partagé.
 */
function mapLogRow(row, photos, meId) {
  const isOwner = row.user_id === meId;
  return {
    id: row.id,
    date: row.date,
    lieuNom: row.lieu_nom,
    lieuCommune: row.lieu_commune,
    lieuLat: row.lieu_lat,
    lieuLng: row.lieu_lng,
    typeSortie: row.type_sortie,
    avecChien: row.avec_chien,
    dogId: row.dog_id,
    dogNom: row.dogs?.nom || null,
    dogPhoto: row.dogs?.photo_url || null,
    espece: row.espece,
    observation: row.observation,
    resultat: row.resultat,
    dureeMinutes: row.duree_minutes,
    nombrePersonnes: row.nombre_personnes,
    meteo: row.meteo,
    temperature: row.temperature,
    terrain: row.terrain || [],
    terrainAutre: row.terrain_autre,
    typeSortieAutre: row.type_sortie_autre,
    distanceKm: row.distance_km,
    nombrePrises: row.nombre_prises,
    nombreArrets: row.nombre_arrets,
    nombreLeves: row.nombre_leves,
    nombreMenes: row.nombre_menes,
    nombreTires: row.nombre_tires,
    categorieGibier: row.categorie_gibier,
    notes: isOwner ? row.notes : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photos: isOwner ? photos : [],
    isOwner,
    owner: isOwner || !row.profiles ? null : { id: row.profiles.id, username: row.profiles.username, nom: row.profiles.nom || row.profiles.username, avatar: row.profiles.avatar_url },
    companions: (row.hunting_log_companions || [])
      .map((c) => (c.profiles ? { id: c.profiles.id, username: c.profiles.username, nom: c.profiles.nom || c.profiles.username, avatar: c.profiles.avatar_url } : null))
      .filter(Boolean),
  };
}

/** Toutes les sorties visibles pour l'utilisateur connecté — les siennes et
 *  celles où il a été identifié comme compagnon (voir migration 034), les
 *  plus récentes en premier. Pas de filtre .eq("user_id", ...) ici : c'est
 *  la policy RLS "owner and companions read hunting logs" qui détermine ce
 *  qui est réellement visible, dans les deux cas.
 *
 *  limit : un vrai plafond de sécurité, pas une troncature "assumée" comme
 *  sur les messages/publications — computeStats() a besoin de la totalité
 *  des sorties d'un utilisateur pour être exacte (total, cette année...).
 *  1000 est volontairement large : même une sortie chaque jour depuis des
 *  années resterait très en dessous, ça ne fait que couvrir le cas
 *  pathologique sans jamais fausser les statistiques d'un usage réel. */
export async function fetchMyLogs({ limit = 1000 } = {}) {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("hunting_logs")
    .select(LOG_SELECT)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return Promise.all(data.map(async (row) => mapLogRow(row, row.user_id === me.id ? await signPhotoUrls(row.hunting_log_photos) : [], me.id)));
}

export async function fetchLog(logId) {
  const me = await requireUser();
  const { data, error } = await supabase.from("hunting_logs").select(LOG_SELECT).eq("id", logId).single();
  if (error) throw error;
  return mapLogRow(data, data.user_id === me.id ? await signPhotoUrls(data.hunting_log_photos) : [], me.id);
}

/** Remplace la liste complète des compagnons identifiés sur une sortie (le
 *  propriétaire seul peut le faire — voir la policy RLS de la migration
 *  034). Utilisé à la création et à chaque modification du formulaire. */
export async function setLogCompanions(logId, userIds) {
  const { error: delError } = await supabase.from("hunting_log_companions").delete().eq("log_id", logId);
  if (delError) throw delError;
  if (!userIds || userIds.length === 0) return;
  const rows = userIds.map((userId) => ({ log_id: logId, user_id: userId }));
  const { error } = await supabase.from("hunting_log_companions").insert(rows);
  if (error) throw error;
}

async function uploadLogPhotos(logId, files) {
  const me = await requireUser();
  const uploaded = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = `${me.id}/${logId}/${Date.now()}-${i}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("carnet").upload(path, file, { cacheControl: "3600", upsert: false });
    if (uploadError) throw uploadError;
    const { error: rowError } = await supabase.from("hunting_log_photos").insert({ log_id: logId, path, ordre: i });
    if (rowError) throw rowError;
    uploaded.push(path);
  }
  return uploaded;
}

function toRow({ date, lieuNom, lieuCommune, lieuLat, lieuLng, typeSortie, typeSortieAutre, avecChien, dogId, espece, observation, resultat, dureeMinutes, nombrePersonnes, meteo, temperature, terrain, terrainAutre, distanceKm, nombrePrises, nombreArrets, nombreLeves, nombreMenes, nombreTires, categorieGibier, notes }) {
  return {
    date,
    lieu_nom: lieuNom || null,
    lieu_commune: lieuCommune || null,
    lieu_lat: lieuLat ?? null,
    lieu_lng: lieuLng ?? null,
    type_sortie: typeSortie,
    type_sortie_autre: typeSortie === "autre" ? typeSortieAutre || null : null,
    avec_chien: !!avecChien,
    dog_id: avecChien ? dogId || null : null,
    espece: espece || null,
    observation: observation || null,
    resultat: resultat || null,
    duree_minutes: dureeMinutes || null,
    nombre_personnes: nombrePersonnes || null,
    meteo: meteo || null,
    temperature: temperature === "" || temperature === undefined ? null : temperature,
    terrain: terrain && terrain.length > 0 ? terrain : null,
    terrain_autre: terrain && terrain.includes("Autre") ? terrainAutre || null : null,
    distance_km: distanceKm === "" || distanceKm === undefined ? null : distanceKm,
    nombre_prises: nombrePrises === "" || nombrePrises === undefined ? null : nombrePrises,
    nombre_arrets: nombreArrets === "" || nombreArrets === undefined ? null : nombreArrets,
    nombre_leves: nombreLeves === "" || nombreLeves === undefined ? null : nombreLeves,
    nombre_menes: nombreMenes === "" || nombreMenes === undefined ? null : nombreMenes,
    nombre_tires: nombreTires === "" || nombreTires === undefined ? null : nombreTires,
    categorie_gibier: categorieGibier || null,
    notes: notes || null,
  };
}

/** Crée une sortie, puis ses photos et compagnons éventuels (le log doit
 *  exister avant l'upload/le tag, son id sert de dossier Storage / de clé
 *  étrangère). */
export async function createLog(fields, photoFiles = [], companionIds = []) {
  const me = await requireUser();
  const { data: log, error } = await supabase
    .from("hunting_logs")
    .insert({ user_id: me.id, ...toRow(fields) })
    .select(LOG_SELECT)
    .single();
  if (error) throw error;
  if (photoFiles.length > 0) {
    await uploadLogPhotos(log.id, photoFiles);
  }
  if (companionIds.length > 0) {
    await setLogCompanions(log.id, companionIds);
  }
  return fetchLog(log.id);
}

/** companionIds à null = ne touche pas aux compagnons déjà enregistrés
 *  (utile si le formulaire d'édition ne les a pas rechargés) ; un tableau
 *  (même vide) remplace la liste complète. */
export async function updateLog(logId, fields, newPhotoFiles = [], companionIds = null) {
  const { error } = await supabase.from("hunting_logs").update(toRow(fields)).eq("id", logId);
  if (error) throw error;
  if (newPhotoFiles.length > 0) {
    await uploadLogPhotos(logId, newPhotoFiles);
  }
  if (companionIds !== null) {
    await setLogCompanions(logId, companionIds);
  }
  return fetchLog(logId);
}

export async function deleteLogPhoto(photoId, path) {
  const { error } = await supabase.from("hunting_log_photos").delete().eq("id", photoId);
  if (error) throw error;
  if (path) await supabase.storage.from("carnet").remove([path]).catch(() => {});
  return true;
}

/** Suppression réelle : la ligne (les photos suivent par cascade en base) et
 *  les fichiers Storage associés, pour ne rien laisser d'orphelin — un
 *  carnet privé mérite un vrai nettoyage, pas juste une suppression logique. */
export async function deleteLog(logId, photoPaths = []) {
  const { error } = await supabase.from("hunting_logs").delete().eq("id", logId);
  if (error) throw error;
  if (photoPaths.length > 0) await supabase.storage.from("carnet").remove(photoPaths).catch(() => {});
  return true;
}

/**
 * Statistiques personnelles calculées côté client à partir des sorties déjà
 * chargées — le volume par utilisateur reste modeste, une vraie agrégation
 * SQL n'apporterait rien de plus ici.
 *
 * IMPORTANT : ne compte QUE les sorties dont on est propriétaire. Depuis que
 * fetchMyLogs() renvoie aussi les sorties où on a été identifié comme
 * compagnon (voir migration 034), les inclure ici gonflerait les stats
 * personnelles avec des sorties qui ne sont pas les siennes — une "sortie
 * partagée" reste visible dans la liste, mais ne doit jamais compter comme
 * une sortie à soi.
 */
export function computeStats(logs) {
  const own = logs.filter((l) => l.isOwner !== false);
  const now = new Date();
  const isThisMonth = (d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const isThisYear = (d) => d.getFullYear() === now.getFullYear();

  const parsed = own.map((l) => ({ ...l, _date: new Date(l.date) }));
  const byType = {};
  const byResultat = {};
  const bySpecies = new Set();
  const byDog = {};
  let totalMinutes = 0;
  let avecChienCount = 0;
  let totalArrets = 0;
  let totalLeves = 0;
  let totalMenes = 0;
  let totalTires = 0;
  const parCategorieGibier = {
    gros: { sorties: 0, prises: 0 },
    petit: { sorties: 0, prises: 0 },
  };

  for (const l of parsed) {
    byType[l.typeSortie] = (byType[l.typeSortie] || 0) + 1;
    if (l.resultat) byResultat[l.resultat] = (byResultat[l.resultat] || 0) + 1;
    if (l.espece) bySpecies.add(l.espece);
    if (l.dureeMinutes) totalMinutes += l.dureeMinutes;
    totalArrets += l.nombreArrets || 0;
    totalLeves += l.nombreLeves || 0;
    totalMenes += l.nombreMenes || 0;
    totalTires += l.nombreTires || 0;
    if (l.categorieGibier === "gros" || l.categorieGibier === "petit") {
      parCategorieGibier[l.categorieGibier].sorties++;
      parCategorieGibier[l.categorieGibier].prises += l.nombrePrises || 0;
    }
    if (l.avecChien) {
      avecChienCount++;
      if (l.dogId) {
        const key = l.dogId;
        byDog[key] = byDog[key] || { dogId: l.dogId, dogNom: l.dogNom, count: 0, minutes: 0 };
        byDog[key].count++;
        byDog[key].minutes += l.dureeMinutes || 0;
      }
    }
  }

  return {
    total: own.length,
    ceMois: parsed.filter((l) => isThisMonth(l._date)).length,
    cetteAnnee: parsed.filter((l) => isThisYear(l._date)).length,
    totalMinutes,
    avecChienCount,
    especesObservees: bySpecies.size,
    especesListe: [...bySpecies],
    parType: byType,
    parResultat: byResultat,
    parChien: Object.values(byDog).sort((a, b) => b.count - a.count),
    totalArrets,
    totalLeves,
    totalMenes,
    totalTires,
    parCategorieGibier,
  };
}
