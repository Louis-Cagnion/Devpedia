# TODO : Devpedia

> Prochaine tâche : point 2 (setup GLFW+GLAD du projet SCOP : OpenGL Loading Library, résolution `#include`/`-I`, vendoring, double buffering/render loop). Régénération audio complète seulement une fois tout ajouté.

> Restent : un test navigateur en attente de Louis pour continuer l'investigation (point 1), et les points 2 à 8 (chapitres/compléments à rédiger). L'audio (FR et autres langues) sera régénéré en un seul passage une fois tous ces chapitres ajoutés, pas point par point.

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Ordre de traitement imposé pour les points 2 à 8** : la numérotation ci-dessous EST l'ordre d'exécution (du plus court/autonome au plus volumineux/dépendant), pas un simple classement thématique -- traiter strictement dans cet ordre, ne jamais sauter un point pour un autre jugé plus intéressant, sauf instruction contraire explicite de Louis.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 2. Notions candidates : setup GLFW+GLAD du projet SCOP
- OpenGL Loading Library (GLAD/GLEW : fonctions OpenGL modernes résolues à l'exécution via `glfwGetProcAddress`, pas liées statiquement) + résolution `#include <...>`/`-I` (concaténation littérale par le préprocesseur, piège du `-I` pointé sur le mauvais niveau de dossier) + vendoring (committer le code généré d'une dépendance dans le repo) → nouvelle sous-rubrique build/OpenGL.
- Double buffering et render loop (`glfwSwapBuffers`, boucle poll/clear/draw/swap) → `Fondamentaux/Graphisme` (avec le point 8).

## 3. Notions candidates : suite revue /review poc-borne-git
- Injection XXE et sa prévention (`libxml_set_external_entity_loader(fn () => null)`, `src/Chat/XmlImporter.php`) → nouveau chapitre XML.
- `IntersectionObserver` (scroll infini), `MutationObserver` (réagir à l'arrivée de messages sans polling), debounce vs throttle (`apps/chat/assets/js/*.js`) → un seul nouveau chapitre JS/DOM navigateur.

## 4. Notions candidates : suite revue /review poc-borne-git
- Chargement dynamique différé d'une lib JS via bootstrap officiel (`importLibrary()`, Google Maps JS API, `apps/atlas/index.php`) + clustering de marqueurs (`@googlemaps/markerclusterer`) → nouveau sous-chapitre "Google Maps JavaScript API".
- Boucle Canvas 2D via `requestAnimationFrame` + mise à l'échelle `devicePixelRatio` + lissage exponentiel vers une cible mobile (`apps/ambient/assets/js/app.js`) → nouveau chapitre "Canvas 2D et animations".

## 5. Notions candidates : suite revue /review poc-borne-git
- Interception d'un setter de propriété native via `Object.defineProperty` (`apps/atlas/assets/js/shared.js::enhanceSelect()`) → nouveau sous-chapitre JS dédié.
- Mesure de texte via Canvas 2D `measureText()`, dispersion de points géographiques colocalisés (correction de longitude par `1/cos(latitude)`), deux chemins de rendu Google Maps (`AdvancedMarkerElement` vs `google.maps.Marker`) → rattachés aux chapitres Canvas/Google Maps du point 4.

## 6. Suite de la revue /review poc-borne-git
- Reprendre la revue /review sur le périmètre non couvert (voir `review-progress.md` du projet poc-borne-git).

## 7. Notion candidate : suite revue /review poc-borne-git
- Reste : chunk 7 de la revue /review (`src/Chat/ImportOrchestrator.php`, `tools/*.php`, `import.php` -- voir `review-progress.md` du projet poc-borne-git).

## 8. Notions candidates : projet SCOP de Louis (rendu 3D OpenGL)
- Dispersion chromatique (aberration chromatique en post-traitement, réfraction par cubemap à indice de réfraction variable par canal) → `Fondamentaux/Graphisme`, suite de `wavefront-obj-et-modele-de-phong.md`.
- Animation procédurale (recalculée à chaque frame par une formule dépendant du temps, ex. un sinus) → même rubrique.
- Picking souris en 3D (rayon depuis un clic écran via l'inverse de la matrice projection/vue) → même rubrique.
- Sélection proportionnelle (influence dégressive sur les sommets voisins selon la distance, notion Blender) → chapitre dédié "édition de maillage", même rubrique.

## 9. Audit qualité de la traduction EN (ordre pas encore fixé)
4 chapitres Python trouvés à moitié traduits en tombant dessus par ailleurs (15/09/2026) : `gestion-des-erreurs.md`, `typage-avec-annotations.md`, `extraction-pdf.md`, `listes-et-tuples.md` (tous corrigés). Symptômes rencontrés : noms de variables/chaînes restés en français, lien Markdown perdu ou remplacé par du texte simple, récapitulatif final `📋 Summary` absent, alignement des commentaires de fin de ligne décalé. ES et BR contrôlés en parallèle sur ces 4 fichiers : indemnes. `http.md` (PHP, hors Python) trouvé également à moitié traduit en tombant dessus le 15/09/2026 (variables `$codeHttp`/`$corpsJson` restées en français, une phrase `Réponse JSON invalide` non traduite) -- pas corrigé, confirme qu'il faut étendre la vérification au-delà de Python.

## 10. Notion candidate : suite revue /review PDF_parser
- Détection de tableaux par analyse de contours OpenCV, via la bibliothèque `img2table` (`table_extraction.py::_refine_undercounted_native_tables`, appel `_Img2TablePDF(...).extract_tables()`) → nouveau chapitre ou sous-chapitre dans `Données/Traitement de documents`, à rattacher à `extraction-pdf.md` (find_tables PyMuPDF déjà couvert là).
