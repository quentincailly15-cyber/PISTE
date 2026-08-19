-- =============================================================================
-- PISTE — bucket "messages" privé (pièces jointes de conversation)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois,
-- APRÈS avoir déployé le code qui accompagne cette migration (le client doit
-- déjà savoir générer des URLs signées avant que le bucket ne devienne privé,
-- sinon les pièces jointes existantes deviennent temporairement inaccessibles).
--
-- Bug (trouvé lors de l'audit pré-bêta) : le bucket "messages" est créé
-- `public: true` (015_message_media.sql), et le code appelait getPublicUrl()
-- pour les photos/vidéos/vocaux envoyés en message privé. Une policy RLS
-- Storage existe bien ("message media readable by conversation members"),
-- mais elle ne s'applique JAMAIS pour un bucket public : Supabase sert les
-- fichiers via /object/public/..., une route qui contourne complètement RLS.
-- Concrètement, la promesse "seuls les membres de cette conversation voient
-- cette pièce jointe" n'était pas réellement tenue — n'importe qui disposant
-- de l'URL (chemin prévisible : {conversation_id}/{message_id}-{nom}) pouvait
-- la charger sans être membre.
--
-- Le code (messageService.js) génère désormais de vraies URLs signées
-- (createSignedUrl/createSignedUrls, 1h de validité) au lieu d'URLs
-- publiques — la policy RLS existante redevient donc effective une fois le
-- bucket basculé en privé ici.
-- =============================================================================

update storage.buckets set public = false where id = 'messages';

notify pgrst, 'reload schema';
