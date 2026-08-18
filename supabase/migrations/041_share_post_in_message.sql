-- =============================================================================
-- PISTE — partager une publication/vidéo/Instant en privé, dans un message
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Rôle : jusqu'ici, "Partager" ne proposait que le partage natif du système
-- (ou un message d'erreur si indisponible) — impossible d'envoyer un contenu
-- PISTE directement à quelqu'un en message privé. On référence simplement le
-- post existant depuis le message (jamais de duplication de contenu) ; la
-- visibilité du contenu partagé reste celle du post d'origine (policy
-- "posts readable if not restricted or private", 020_private_accounts.sql —
-- si le destinataire n'a pas accès au post d'origine, il ne le verra pas non
-- plus ici).
-- =============================================================================

alter table messages add column if not exists shared_post_id uuid references posts(id) on delete set null;

notify pgrst, 'reload schema';
