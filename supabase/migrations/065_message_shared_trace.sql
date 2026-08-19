-- =============================================================================
-- PISTE — référence à une Trace dans un message (répondre à une Trace)
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : jusqu'ici, répondre à une Trace envoyait un simple message texte,
-- sans aucun lien avec la Trace elle-même — le destinataire ne pouvait pas
-- deviner à quoi la réponse se rapportait. Nouvelle colonne, même principe
-- que messages.shared_post_id (041_share_post_in_message.sql) : référence
-- optionnelle vers la Trace, affichée en aperçu dans la bulle du message
-- (miniature + auteur), exactement comme une publication partagée.
--
-- "on delete set null" (pas cascade) : si la Trace est supprimée plus tard,
-- le message reste (juste sans aperçu affichable), pas de perte de
-- l'historique de conversation pour ça.
-- =============================================================================

alter table messages add column if not exists shared_trace_id uuid references traces(id) on delete set null;

notify pgrst, 'reload schema';
