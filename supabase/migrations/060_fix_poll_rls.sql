-- =============================================================================
-- PISTE — corrige la fuite RLS sur poll_options / poll_votes
-- =============================================================================
-- À exécuter manuellement dans le SQL Editor Supabase, une seule fois.
--
-- Bug (trouvé lors de l'audit final GO/NO-GO bêta) : exactement le même défaut
-- déjà corrigé 3 fois (post_media/comments/likes en 056, bucket messages en
-- 057, bucket posts en 059) — jamais recherché sur poll_options/poll_votes
-- car ces tables n'existaient pas encore quand le pattern a été établi (036).
-- Leurs policies SELECT sont restées `using (true)` : n'importe qui, même non
-- connecté, peut lire les options ET le vote individuel de chaque personne sur
-- n'importe quel sondage — y compris ceux d'un compte privé ou d'un post
-- restreint.
--
-- Correction : même prédicat que post_media/comments/likes, via la fonction
-- SECURITY DEFINER déjà existante is_post_visible() (056/058) — pas de
-- nouvelle fonction nécessaire, poll_options/poll_votes se rattachent à
-- posts.id exactement comme comments/likes.
-- =============================================================================

drop policy if exists "poll options publicly readable" on poll_options;
create policy "poll options readable if post visible" on poll_options
  for select using (is_post_visible(post_id, auth.uid()));

drop policy if exists "poll votes publicly readable" on poll_votes;
create policy "poll votes readable if post visible" on poll_votes
  for select using (is_post_visible(post_id, auth.uid()));

notify pgrst, 'reload schema';
