# TODO — Devpedia

> Restent : un test navigateur en attente de Louis pour continuer l'investigation (point 11), et les points 21 à 33 (chapitres/compléments à rédiger, rangement déjà tranché). L'audio (FR et autres langues) sera régénéré en un seul passage une fois tous ces chapitres ajoutés, pas point par point.

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 11. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 21. Notions candidates : projet SCOP de Louis (rendu 3D OpenGL)
- Dispersion chromatique (aberration chromatique en post-traitement, réfraction par cubemap à indice de réfraction variable par canal) → `Fondamentaux/Graphisme`, suite de `wavefront-obj-et-modele-de-phong.md`.
- Animation procédurale (recalculée à chaque frame par une formule dépendant du temps, ex. un sinus) → même rubrique.
- Picking souris en 3D (rayon depuis un clic écran via l'inverse de la matrice projection/vue) → même rubrique.
- Sélection proportionnelle (influence dégressive sur les sommets voisins selon la distance, notion Blender) → chapitre dédié "édition de maillage", même rubrique.

## 22. Notions candidates : Makefile du projet SCOP
- `pkg-config` (métadonnées de lib via fichiers `.pc` ; nom de module `pkg-config` vs nom du paquet système, pas toujours identiques) + syntaxe Makefile (prérequis séparés par espaces vs `;` qui introduit une recette en ligne ; `.PHONY` pour une cible sans fichier de sortie ; `-o`/`-I`) → chapitre build C (nouvelle rubrique à créer).
- `()` vs `{}` en shell (sous-shell vs shell courant, syntaxe `{ ; }`) + codes ANSI couleur terminal (`\033[...m`, piège du `echo` sans `-e`) → chapitre shell séparé, même rubrique.
- Mode silencieux `@` en préfixe de ligne de recette (supprime l'écho de la commande avant exécution) + `MAKEFLAGS` (variable transmettant les options aux appels récursifs de `make`) → chapitre build C, avec `pkg-config`/Makefile (Louis, 14/09/2026).

## 23. Notions candidates : setup GLFW+GLAD du projet SCOP
- OpenGL Loading Library (GLAD/GLEW : fonctions OpenGL modernes résolues à l'exécution via `glfwGetProcAddress`, pas liées statiquement) + résolution `#include <...>`/`-I` (concaténation littérale par le préprocesseur, piège du `-I` pointé sur le mauvais niveau de dossier) + vendoring (committer le code généré d'une dépendance dans le repo) → nouvelle sous-rubrique build/OpenGL.
- Double buffering et render loop (`glfwSwapBuffers`, boucle poll/clear/draw/swap) → `Fondamentaux/Graphisme` (avec le point 21).

## 24. Notions candidates : projet SCOP, langage C
- Arguments de ligne de commande (`argc`/`argv`) → chapitre séparé, `Langages/C`.
- Opérateur virgule (`expr1, expr2`, pattern `return printf(...), NULL;`) → chapitre séparé, `Langages/C`.
- `exit()` et codes de retour de processus → chapitre séparé, `Langages/C`.

## 28. Suite de la revue /review poc-borne-git
- Reprendre la revue /review sur le périmètre non couvert (voir `review-progress.md` du projet poc-borne-git).

## 29. Notions candidates : suite revue /review poc-borne-git
- Injection XXE et sa prévention (`libxml_set_external_entity_loader(fn () => null)`, `src/Chat/XmlImporter.php`) → nouveau chapitre XML.
- `IntersectionObserver` (scroll infini), `MutationObserver` (réagir à l'arrivée de messages sans polling), debounce vs throttle (`apps/chat/assets/js/*.js`) → un seul nouveau chapitre JS/DOM navigateur.
- Variable `static` locale en PHP (`src/Shared/helpers.php::frenchMonthLabel()`) → `poo.md`.

## 30. Notions candidates : suite revue /review poc-borne-git
- Chargement dynamique différé d'une lib JS via bootstrap officiel (`importLibrary()`, Google Maps JS API, `apps/atlas/index.php`) + clustering de marqueurs (`@googlemaps/markerclusterer`) → nouveau sous-chapitre "Google Maps JavaScript API".
- Boucle Canvas 2D via `requestAnimationFrame` + mise à l'échelle `devicePixelRatio` + lissage exponentiel vers une cible mobile (`apps/ambient/assets/js/app.js`) → nouveau chapitre "Canvas 2D et animations".
- `history.replaceState` (`apps/atlas/assets/js/app.js::syncUrl()`) → complément de `dom-et-evenements.md`.

## 31. Notions candidates : suite revue /review poc-borne-git
- Interception d'un setter de propriété native via `Object.defineProperty` (`apps/atlas/assets/js/shared.js::enhanceSelect()`) → nouveau sous-chapitre JS dédié.
- Lire une custom property CSS depuis JS (`getComputedStyle(...).getPropertyValue('--orange')`, `charts.js::css()`) → complément de `css.md`/`variables.md` JS.
- Mesure de texte via Canvas 2D `measureText()`, dispersion de points géographiques colocalisés (correction de longitude par `1/cos(latitude)`), deux chemins de rendu Google Maps (`AdvancedMarkerElement` vs `google.maps.Marker`) → rattachés aux chapitres Canvas/Google Maps du point 30.

## 32. Notion candidate : suite revue /review poc-borne-git
- `fastcgi_finish_request()` + `register_shutdown_function()` (PHP-FPM : répondre au client tout de suite puis recalculer un cache coûteux en fond, `src/Atlas/VN/SalesRepository.php::scheduleBackgroundRefresh()`) → nouveau chapitre PHP-FPM.

## 33. Notion candidate : suite revue /review poc-borne-git
- Streaming de sortie HTTP progressive en PHP (`ini_set('output_buffering', 'off')` + `flush()` en boucle, `admin/import_web.php`/`admin/atlas-geocode.php` ; mécanisme inverse du point 32, la connexion reste ouverte tout du long) → complément d'`eviter-le-recalcul-redondant.md`/`pwa-progressive-web-app.md`.
- Reste aussi : chunk 7 de la revue /review (`src/Chat/ImportOrchestrator.php`, `tools/*.php`, `import.php` -- voir `review-progress.md` du projet poc-borne-git).
