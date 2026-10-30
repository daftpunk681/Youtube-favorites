# YouTube Favorites

Une bibliothèque personnelle de vidéos YouTube, avec un accueil éditorial, des catégories et une administration web. Interface en français, thème sombre, adaptée au téléphone et à l’ordinateur.

## Ce que vous pouvez faire

- Ajouter une vidéo en collant un lien YouTube classique, court, Shorts ou Live.
- Récupérer automatiquement le titre et la chaîne avec **YouTube oEmbed**, sans clé ni API payante. La miniature est déduite du lien. Si les informations ne sont pas disponibles, saisir le titre à la main ; une miniature de remplacement s’affiche en cas d’échec.
- Regarder les vidéos dans un lecteur YouTube intégré, chargé uniquement après votre clic.
- Créer, renommer, colorer et supprimer des catégories ; associer plusieurs catégories à une vidéo.
- Rechercher dans les titres, chaînes et notes, sans tenir compte des accents ; filtrer par catégorie et mise en avant ; trier les résultats.
- Mettre des vidéos à la une, modifier leurs informations et les supprimer depuis une administration protégée.
- Retrouver la même collection sur tous vos appareils grâce à PostgreSQL. **Aucune donnée de collection n’est conservée dans localStorage.**

La collection et les vidéos sont **publiques en lecture** pour toute personne connaissant l’adresse du site. Les écritures sont réservées à l’administrateur. Il s’agit d’une collection unique avec un compte administrateur, et non d’un service multi-utilisateur. YouTube continue de gérer la disponibilité des vidéos, les publicités et les restrictions d’intégration.

## Choix techniques

Next.js (App Router), React, TypeScript et Tailwind CSS ; PostgreSQL sur **Neon**, avec son pilote HTTP adapté aux fonctions Vercel. Authentification par empreinte **scrypt** et cookie de session signé **HS256**, `HttpOnly`, `SameSite=Strict`, `Secure` en production, valable 8 heures. Les secrets restent exclusivement sur le serveur.

Neon Free et Vercel Hobby permettent un usage personnel gratuit, dans leurs quotas et conditions actuels. Aucun abonnement payant n’est nécessaire pour le fonctionnement prévu. Le quota d’optimisation d’images Vercel n’est pas sollicité par les miniatures.

## Démarrage rapide

Pré-requis : **Node.js 22.18 ou plus récent**, npm, un compte gratuit [Neon](https://neon.tech) et, pour publier, un compte [Vercel](https://vercel.com).

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrez <http://localhost:3000>. Tant que `DATABASE_URL` est absent, une collection de démonstration s’affiche avec un bandeau explicite. Elle n’enregistre aucune modification. L’administration reste fermée tant que ses secrets et sa base ne sont pas configurés. Aucun service externe n’est requis pour compiler ou visiter la démo.

## Configurer votre vraie collection (une seule fois)

### 1. Créer la base gratuite

1. Créez un projet PostgreSQL sur Neon. Choisissez une région proche de celle de votre déploiement Vercel.
2. Dans **Connect → Connection string**, copiez l’URL PostgreSQL avec SSL dans `DATABASE_URL` de `.env.local`. Cette URL contient un mot de passe : ne la mettez jamais dans GitHub ni dans le navigateur.
3. Exécutez :

```bash
npm run db:migrate
```

Cette commande crée les tables et index dans une transaction. Elle peut être relancée sans effacer vos données. Elle doit être exécutée explicitement : ni le build ni une visite de la page ne modifient le schéma. Utilisez le rôle propriétaire Neon pour la migration.

Une base connectée démarre **vide**. Les vidéos de démonstration ne sont pas importées dans votre collection. Les données de production sont stockées sur Neon et persistent après un redéploiement Vercel.

### 2. Définir le mot de passe administrateur

```bash
npm run admin:hash
```

Choisissez une phrase de passe unique d’au moins 12 caractères (la saisie est masquée). La commande affiche uniquement une ligne `ADMIN_PASSWORD_HASH=…` : copiez-la dans `.env.local`. Le mot de passe lui-même ne doit pas être stocké dans ce fichier. Les caractères spéciaux et espaces sont acceptés.

Pour changer de mot de passe, relancez cette commande et remplacez l’empreinte. Changez aussi `SESSION_SECRET` pour invalider immédiatement les anciennes sessions.

### 3. Créer le secret de session

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copiez le résultat dans `SESSION_SECRET` de `.env.local`. Le secret doit contenir au moins 32 caractères. Définissez aussi `APP_URL=http://localhost:3000`, puis redémarrez le serveur local.

Ouvrez **Administration** dans le menu, connectez-vous et ajoutez votre première vidéo. Ensuite, tout se gère depuis cette interface ; aucun fichier à modifier pour ajouter des vidéos ou des catégories.

## Déploiement gratuit sur Vercel

**Aucun déploiement en production n’est réalisé par ce projet automatiquement.** Une fois la pull request relue et fusionnée, procédez manuellement :

1. Importez le dépôt GitHub dans Vercel et choisissez le framework **Next.js**. Laissez les réglages de build par défaut (`npm run build`). Sélectionnez Node.js 22.18 ou plus récent.
2. Dans **Settings → Environment Variables**, ajoutez `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` et `APP_URL`. `APP_URL` doit correspondre exactement à l’origine HTTPS de votre site, sans slash final (exemple : `https://youtube-favorites.vercel.app`). Vercel indique ce domaine dans la configuration du projet avant le déploiement.
3. Vérifiez que `npm run db:migrate` a été exécuté sur la base ciblée.
4. Lancez le déploiement après votre autorisation. Visitez `/admin`, connectez-vous et testez un ajout.

Ne préfixez **aucune** de ces variables par `NEXT_PUBLIC_`. Les variables sont utilisées au moment de la requête ; elles ne sont pas nécessaires pour le build. Aucun disque local Vercel n’est utilisé pour stocker la collection.

Pour les déploiements de prévisualisation, utilisez une **branche Neon distincte**, une empreinte et un secret distincts, et l’URL propre à la prévisualisation. Ne donnez pas les identifiants de production à une prévisualisation non fiable. Sans `APP_URL`, l’application utilise le domaine `VERCEL_URL` fourni par Vercel ; une valeur `APP_URL` de production ne convient pas à un autre domaine. Une intégration Git Vercel peut déployer automatiquement les branches une fois le dépôt connecté : configurez cette intégration uniquement lorsque vous êtes prêt à publier.

## Vérifications

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

- Tests unitaires : formats YouTube, validation, recherche, sessions, mots de passe, récupération et repli des métadonnées, origine des requêtes et refus des écritures sans connexion.
- Tests PostgreSQL : migration relançable, catégories multiples, doublons, mises à jour atomiques, annulation en cas d’erreur, suppressions en cascade et quota de connexion. Ils utilisent un vrai moteur PostgreSQL embarqué **PGlite**, sans compte Neon.
- Tests navigateur : accueil, recherche, filtres, lecteur, mobile et administration. Les pages et les routes API réelles sont reliées à un moteur PostgreSQL PGlite par un adaptateur de transport réservé au processus de test. Connexion, cookies, catégories, enregistrement et persistance entre deux navigateurs sont ainsi vérifiés sans compte externe. Seules les réponses YouTube oEmbed sont simulées. Ces tests ne remplacent pas une vérification de la connexion à votre propre projet Neon après configuration.

Pour les tests navigateur, installez Chromium si nécessaire :

```bash
npx playwright install chromium --with-deps
```

Un Chromium déjà installé peut être sélectionné avec `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/chemin/vers/chromium`. Les tests lancent leur propre serveur sur le port 3100 avec des identifiants factices réservés aux tests, jamais utilisés par le serveur normal.

La CI GitHub exécute les contrôles de code, le build et les tests navigateur, sans secret de production ni publication.

## Protection de l’administration

Chaque route de modification vérifie la session **côté serveur**, l’origine de la requête et le format des données. Les paramètres SQL ne sont jamais concaténés. Le serveur refuse les corps JSON de plus de 16 Kio et n’accepte que des liens YouTube connus ; la requête oEmbed est reconstruite vers le domaine officiel afin d’éviter des requêtes vers des services arbitraires.

Le quota de connexion est stocké en PostgreSQL : au maximum **8 essais par fenêtre de 15 minutes** par adresse fournie par Vercel ; hors Vercel, le quota est global, sans faire confiance à une adresse IP envoyée par le navigateur. Les réponses ne révèlent pas les détails de connexion ou les secrets. L’expiration d’une session nécessite de se reconnecter. La déconnexion efface le cookie ; la rotation du secret invalide toutes les sessions.

Pour une collection importante, exportez régulièrement votre base avec les outils PostgreSQL ou Neon. La durabilité de la base ne constitue pas à elle seule une sauvegarde indépendante ; vérifiez la rétention disponible sur votre offre gratuite.

## En cas de problème

| Problème                                                | Solution                                                                                                                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le bandeau « Collection démo » s’affiche                | Renseigner `DATABASE_URL`, puis redémarrer ou redéployer.                                                                                                               |
| « Votre espace est presque prêt » dans l’administration | Vérifier la base, le format `scrypt:…` de l’empreinte et la longueur du secret de session.                                                                              |
| Collection indisponible                                 | Vérifier l’URL Neon, les droits du rôle et exécuter `npm run db:migrate`. Une panne n’affiche jamais de fausses données de démonstration.                               |
| « Origine de la requête refusée »                       | Corriger `APP_URL` pour correspondre exactement à l’adresse dans votre navigateur. Utiliser `localhost`, plutôt que `127.0.0.1`, pour la configuration locale proposée. |
| Trop de tentatives                                      | Attendre la fin de la fenêtre de 15 minutes.                                                                                                                            |
| Titre non récupéré                                      | Le saisir dans le formulaire ; l’ajout reste possible.                                                                                                                  |
| Miniature indisponible                                  | Le site affiche un remplacement, sans bloquer la vidéo.                                                                                                                 |
| La vidéo ne se lit pas dans le site                     | Cliquer sur « Ouvrir sur YouTube ». L’auteur peut interdire l’intégration, ou la vidéo peut être privée/supprimée.                                                      |

## Organisation du projet

- `app/` : pages et routes API Next.js.
- `components/` : bibliothèque, formulaires, lecteur et fenêtres accessibles au clavier.
- `lib/` : validation, SQL, authentification, recherche et métadonnées.
- `db/001_initial.sql` : schéma PostgreSQL versionné.
- `scripts/` : migration et génération d’empreinte administrateur.
- `tests/` : tests unitaires, PostgreSQL et navigateur.
- `.env.example` : configuration sans aucun secret réel.

Les vidéos de démonstration servent seulement d’exemples de présentation ; leurs titres sont éditorialisés. YouTube Favorites n’est pas affilié à YouTube ou Google.
