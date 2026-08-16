# PISTE — mise en place backend (à faire manuellement)

Rien dans ce dossier n'a été exécuté ni déployé. Voici exactement ce qu'il
reste à faire de votre côté, dans l'ordre.

## 1. Créer le projet
1. Aller sur https://supabase.com → New project.
2. Noter l'URL du projet et la clé `anon public` (Project Settings > API).
3. Les mettre dans un fichier `.env.local` copié depuis `.env.example`.

## 2. Appliquer le schéma
1. Dashboard > SQL Editor > New query.
2. Coller le contenu de `migrations/001_init.sql`, cliquer "Run".
3. Vérifier dans Table Editor que les tables sont créées et que "RLS enabled"
   apparaît sur chacune.

## 3. Configurer l'authentification par e-mail
1. Dashboard > Authentication > Providers > Email : activer "Confirm email"
   (sinon aucun e-mail de vérification n'est envoyé — l'inscription active le
   compte immédiatement, ce qui n'est pas ce que vous avez demandé).
2. Dashboard > Authentication > URL Configuration :
   - Site URL : l'URL de votre app une fois déployée (ex. `https://piste.app`).
   - Redirect URLs : ajouter `<votre-url>/auth/callback` et
     `<votre-url>/auth/reset-password` (utilisées par `authService.js`).
3. Par défaut Supabase utilise son propre service d'e-mail avec une limite
   faible (quelques e-mails/heure) — suffisant pour une bêta privée, pas pour
   une ouverture publique. Au-delà, configurer un fournisseur SMTP personnalisé
   dans Authentication > Email Templates > SMTP Settings.

## 4. Créer les buckets de stockage
Dashboard > Storage > New bucket, créer : `avatars`, `posts`, `traces`,
`messages`, `groups`, `dogs` — cocher "Public bucket" pour les contenus
destinés à être visibles publiquement (avatars, posts publics), le laisser
privé pour `messages`. Chaque bucket a besoin de ses propres policies
(non incluses dans `001_init.sql`, qui ne couvre que les tables).

## 5. Suppression de compte (Edge Function)
`authService.deleteAccount()` appelle une Edge Function nommée
`delete-account` qui n'existe pas encore. Elle doit être créée et déployée
avec la CLI Supabase (`supabase functions new delete-account`, puis
`supabase functions deploy delete-account`), car la suppression d'un
utilisateur `auth.users` nécessite la clé `service_role`, jamais exposable au
frontend.

## 6. Installer les dépendances dans le vrai projet
```
npm install @supabase/supabase-js
```

## 7. Ce que je recommande pour la suite
Ce dossier (`backend/`) est du code prêt à l'emploi mais **hors du fichier
`piste_app.jsx`**, qui reste un artefact claude.ai à fichier unique. Pour
assembler tout ça en une vraie application déployable (avec `package.json`,
build, variables d'environnement, et surtout un accès réseau réel pour
exécuter ces étapes), l'outil adapté est **Claude Code** — il peut créer un
vrai projet Vite/Next, y placer ces fichiers, exécuter `npm install`, et
vous guider pour le déploiement (Vercel/Netlify + Supabase). Cette
conversation ne peut pas le faire elle-même (pas de réseau, pas d'accès à un
compte Supabase).
