# TODO : Devpedia

> Prochaine tâche : point 2, audio en, es, br du chapitre `graphemes-et-decoupage-de-texte.md` ; ensuite les chapitres SVG, API de page JavaScript, unités CSS et tests sans fenêtre. Point 1 : en attente de Louis (test navigateur).

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois, sans attente de validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés ; toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 2. Chapitres issus du projet Portfolio (sujets absents de Devpedia)
Sujets utilisés dans le Portfolio de Louis, sans chapitre dédié. Procédure : français, puis 3 agents de traduction (EN, ES, BR), puis audio des 4 langues. Écrire dans l'ordre, un chapitre à la fois ; chaque chapitre renvoie vers les chapitres voisins existants plutôt que de les répéter.
- `Données/Représentation des données/graphemes-et-decoupage-de-texte.md` : générer l'audio en, es et br (le français existe).
- `Langages/HTML/` ou `Langages/CSS/` : le SVG écrit dans la page (formes, `<text>`, animation, accessibilité), aujourd'hui cité en passant dans trois chapitres.
- `Langages/JavaScript/` : les API de page `matchMedia`, `scrollIntoView`, `visibilitychange` (onglet masqué), `AbortController`, les événements pointeur (`pointerdown`, `pointer-events`) et le chargement des polices (`document.fonts.ready`, mesurer un texte après la police).
- `Langages/CSS/` : unités et fonctions de taille (`clamp()`, `dvh`/`svh`), agrandissement de la police à 200 et 300 % (réflexion WCAG).
- `Tests/` : tester une interface dans un navigateur sans fenêtre (banc de tests maison, Chrome DevTools Protocol) et `node:test`, en complément de `tests-end-to-end.md`.

## 3. Notions issues du projet Parot (revue /review, Drupal 11 multisite)
Sujets rencontrés à la revue du 12/10/2026, sans chapitre dédié (recherche dans `content/` faite le 12/10/2026 : couverts à part : injection SQL, CSRF, cron, injection de dépendances de base dans `Langages/PHP/poo.md`, idempotence, redirection ouverte). Famille F01 « Plateforme et noyau » ; d'autres suivront avec les familles suivantes. Chaque notion cite son exemple réel dans le projet.
- Framework et inversion de contrôle : le framework appelle le code du projet via des déclarations (route, hook, service, plugin) ; exemple : `pw_core.module:81` (hook), `pw_core.services.yml:16` (service).
- Hook et abonné d'événement (avec priorité) : `PwPathManagerSubscriber.php:143`.
- Conteneur de services et fournisseur de services (remplacer un service du noyau) : `PwCoreServiceProvider.php:19`.
- Entité de contenu et annotation/attribut de classe : `PwCronQueue.php:19`.
- Multisite : un code, plusieurs sites, plusieurs bases (préfixes de tables) : `pw_global_helpers.php:23`.
- Alias d'adresse, processeur d'adresse entrant et redirection 301 : `pw_path_manager.module:52`, `PwVehicleListPathProcessor.php:18`.
- Gestionnaire de plugins : `PWIMPluginManager.php`.
- File d'attente applicative et planificateur (cron applicatif, worker, supervisord) : `PwCronManager.php:127`.
- Patron « méthode modèle » : `PwCronQueueProcessProvider.php:87`.
- Migration de données versionnée, mode simulation avant application, SQL en masse contre enregistrement un par un, garde-fou avant suppression : `V3_00Commands.php:298`, `V3_00Commands.php:350`.
- Verrou applicatif sur une entité : `PwEntityLockManager.php:25`.
- Invalidation de cache à chaque écriture et risque de déni de service : `pw_core.module:90-111`.
