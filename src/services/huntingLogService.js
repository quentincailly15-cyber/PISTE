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

const LOG_SELECT = "*, dogs(id, nom, photo_url), hunting_log_photos(id, path, ordre)";

async function signPhotoUrls(photos) {
  if (!photos || photos.length === 0) return [];
  const sorted = [...photos].sort((a, b) => a.ordre - b.ordre);
  const signed = await Promise.all(
    sorted.map(async (p) => {
      const { data, error } = await supabase.storage.from("carnet").createSignedUrl(p.path, 3600);
      if (error) return null;
      return { id: p.id, path: p.path, url: data.signedUrl };
    })
  );
  return signed.filter(Boolean);
}

function mapLogRow(row, photos) {
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
    terrain: row.terrain,
    distanceKm: row.distance_km,
    nombrePrises: row.nombre_prises,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photos,
  };
}

/** Toutes les sorties de l'utilisateur connecté, les plus récentes en
 *  premier, avec leurs photos déjà résolues en URL signée temporaire. */
export async function fetchMyLogs() {
  const me = await requireUser();
  const { data, error } = await supabase
    .from("hunting_logs")
    .select(LOG_SELECT)
    .eq("user_id", me.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Promise.all(data.map(async (row) => mapLogRow(row, await signPhotoUrls(row.hunting_log_photos))));
}

export async function fetchLog(logId) {
  const me = await requireUser();
  const { data, error } = await supabase.from("hunting_logs").select(LOG_SELECT).eq("id", logId).eq("user_id", me.id).single();
  if (error) throw error;
  return mapLogRow(data, await signPhotoUrls(data.hunting_log_photos));
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

function toRow({ date, lieuNom, lieuCommune, lieuLat, lieuLng, typeSortie, avecChien, dogId, espece, observation, resultat, dureeMinutes, nombrePersonnes, meteo, temperature, terrain, distanceKm, nombrePrises, notes }) {
  return {
    date,
    lieu_nom: lieuNom || null,
    lieu_commune: lieuCommune || null,
    lieu_lat: lieuLat ?? null,
    lieu_lng: lieuLng ?? null,
    type_sortie: typeSortie,
    avec_chien: !!avecChien,
    dog_id: avecChien ? dogId || null : null,
    espece: espece || null,
    observation: observation || null,
    resultat: resultat || null,
    duree_minutes: dureeMinutes || null,
    nombre_personnes: nombrePersonnes || null,
    meteo: meteo || null,
    temperature: temperature === "" || temperature === undefined ? null : temperature,
    terrain: terrain || null,
    distance_km: distanceKm === "" || distanceKm === undefined ? null : distanceKm,
    nombre_prises: nombrePrises === "" || nombrePrises === undefined ? null : nombrePrises,
    notes: notes || null,
  };
}

/** Crée une sortie, puis ses photos éventuelles (le log doit exister avant
 *  l'upload, son id sert de dossier Storage). */
export async function createLog(fields, photoFiles = []) {
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
  return fetchLog(log.id);
}

export async function updateLog(logId, fields, newPhotoFiles = []) {
  const { error } = await supabase.from("hunting_logs").update(toRow(fields)).eq("id", logId);
  if (error) throw error;
  if (newPhotoFiles.length > 0) {
    await uploadLogPhotos(logId, newPhotoFiles);
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

/** Statistiques personnelles calculées côté client à partir des sorties déjà
 *  chargées — le volume par utilisateur reste modeste, une vraie agrégation
 *  SQL n'apporterait rien de plus ici. */
export function computeStats(logs) {
  const now = new Date();
  const isThisMonth = (d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const isThisYear = (d) => d.getFullYear() === now.getFullYear();

  const parsed = logs.map((l) => ({ ...l, _date: new Date(l.date) }));
  const byType = {};
  const byResultat = {};
  const bySpecies = new Set();
  const byDog = {};
  let totalMinutes = 0;
  let avecChienCount = 0;

  for (const l of parsed) {
    byType[l.typeSortie] = (byType[l.typeSortie] || 0) + 1;
    if (l.resultat) byResultat[l.resultat] = (byResultat[l.resultat] || 0) + 1;
    if (l.espece) bySpecies.add(l.espece);
    if (l.dureeMinutes) totalMinutes += l.dureeMinutes;
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
    total: logs.length,
    ceMois: parsed.filter((l) => isThisMonth(l._date)).length,
    cetteAnnee: parsed.filter((l) => isThisYear(l._date)).length,
    totalMinutes,
    avecChienCount,
    especesObservees: bySpecies.size,
    especesListe: [...bySpecies],
    parType: byType,
    parResultat: byResultat,
    parChien: Object.values(byDog).sort((a, b) => b.count - a.count),
  };
}
