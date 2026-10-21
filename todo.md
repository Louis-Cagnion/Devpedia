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

## powershell
- ajouter la creation d'alias dans powershell, des alias simples aux alias complexes, etendre aux autre shells si les niveaux de complexite d'alias ne sont pas gerer

## ajouter une partie sur les serveurs web
- en lisant un chapitre sur les modeles de decision sctructuree, j'ai appris que les serveur peuvent renvoyer des 'retry-after', j'ai trouve ca interessant et je n'en ai jamais entendu parler, je pense donc que ce serait bien d'avoir une rubrique qui parle de la chose la plus commune qui soit sur internet : les serveurs web/sites internets.

## UI
- mettre quelque chose pour annoncer qu'on change de rubrique en selectionnant les boutons pour passer au prochain chapitre
- suivre la selection dans l'arbre en fonction du chapitre selectionne
- l'introduction n'est pas prise en compte quand on change de rubrique en cliquant sur le bouton de changement de chapitres

## fix
tu parles de "Haskell, l'outil historique du domaine", mais on ne sait pas de quel domaine tu parles

## 3. Notions de la revue finale de scop (19/10/2026)
Vues pendant la revue de `collect_lines_file.c` et du parseur ; recherche dans `content/` faite, les autres notions (atexit, `O_NONBLOCK`/FIFO/`fstat`, caractères de contrôle, `strtod`, valgrind « definitely lost », `realloc`) sont déjà couvertes.
- `Langages/C/` : appel système interrompu par un signal (`EINTR`), pourquoi `read` doit être relancé et `fread` le fait pour soi (aucune occurrence de `EINTR` dans `content/`).
- `Langages/C/pointeurs.md` ou `memoire.md` : filtrage sur place avec un pointeur de lecture et un pointeur d'écriture (`*out++ = *p`), priorité de `*p++` contre `(*p)++`, différence de deux pointeurs (aucune occurrence de `*x++ =` dans `content/`). Exemple : `join_continued_lines` (`collect_lines_file.c`).

- `Langages/C/` : écrire dans un champ de structure par son décalage (`offsetof`, `*(float *)((char *)p + offset)`) pour piloter une directive par un tableau de `{nom, décalage, min, max}` au lieu d'une chaîne de `if` (aucune occurrence de `offsetof` dans `content/`, la table de dispatch existe déjà en PHP, `routage.md`) : `parser.c:406-481`.
- `Langages/C/` : littéral composé C99, `(Type){valeurs}`, une structure fabriquée sur place et passée en argument : `uv_seams.c:146-147` (aucune occurrence dans `content/`).
- `Fondamentaux/Mathématiques/` ou `Graphisme/` : tri puis balayage (« sweep and prune »), ne comparer que les arêtes dont les boîtes englobantes se recouvrent pour détecter des croisements, au lieu de toutes les paires : `reshape_in_triangles.c:193-250` (le chapitre ear clipping existe, pas cette technique).
- `Fondamentaux/Graphisme/` : perte de précision des `float` loin de l'origine (24 bits de mantisse) et origine locale choisie par pas de puissance de deux, soustraite en double avant la conversion : `parser.c:308-354` (aucune occurrence de « loin de l'origine » ni de FLT_EPSILON dans `content/`).
- `Fondamentaux/Graphisme/` : qualificateur `flat` des variables GLSL (une valeur par triangle, non interpolée entre ses sommets) : `shader.geom:10-15` (aucune occurrence de `flat` dans `content/`).
- `Fondamentaux/Graphisme/` : bruit de valeur 3D (valeurs pseudo-aléatoires aux coins d'une grille, lissées entre elles) et deux hash de shader, `fract(sin(dot(...)))` et hash entier sans état (xor-décalages et multiplications par `0x7feb352d`, `0x846ca68b`) : `crystal.frag:17-30`, `shader.frag:27-32` (aucune occurrence de « bruit de valeur » ni de ce type de hash dans `content/`).
- `Fondamentaux/Graphisme/effets-de-rendu-et-interaction-3d.md` : loi de Beer-Lambert (la lumière s'atténue de façon exponentielle dans un milieu, `1 - exp(-densité)`), à ajouter à la section du ray-marching qui existe : `crystal.frag:94-103` (aucune occurrence de « Beer » dans `content/`).
- `Fondamentaux/Graphisme/effets-de-rendu-et-interaction-3d.md` : intégration d'Euler semi-implicite d'un ressort amorti (la vitesse est mise à jour avant la position, avec un pas de temps plafonné), à relier au ressort amorti déjà décrit : `inputs.c:276-282` (aucune occurrence de « semi-implicite » dans `content/`).
- `Fondamentaux/Graphisme/` ou `Mathématiques/` : blocage de cardan (gimbal lock) des angles d'Euler et rotation incrémentale, accumuler chaque petit pas dans une matrice puis la ré-orthonormaliser pour effacer l'erreur d'arrondi : `inputs.c:232-264` (aucune occurrence de « cardan » ni de « gimbal » dans `content/`).
