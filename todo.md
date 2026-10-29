# TODO : Devpedia

> Prochaine tâche : C05 (feuille b) : relire `content/Tests/tests-navigateur-sans-fenetre.md` (rédigé, non commité), puis le trio Haiku de traduction, `struct-*.json`, audio de C05 et de C07 (point 6, un seul job `generate-audio.mjs` à la fois), commit ; ensuite suivre `arbre-chapitres-todo.md` (C06, C30 à rédiger). Point 1 : en attente de Louis (test navigateur).

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois, sans attente de validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés ; toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 2. Chapitres issus du projet Portfolio (sujets absents de Devpedia)
Sujets utilisés dans le Portfolio de Louis, sans chapitre dédié. Procédure : français, puis 3 agents de traduction (EN, ES, BR), puis audio des 4 langues généré avant de passer au chapitre suivant. Écrire dans l'ordre, un chapitre à la fois ; chaque chapitre renvoie vers les chapitres voisins existants plutôt que de les répéter.
- `Tests/` : `node:test` (banc de tests Node, en complément de `tests-end-to-end.md` et du chapitre `tests-navigateur-sans-fenetre.md`).

## 4. Notions de Drupal 11 multisite (revue d'un projet Drupal)
Même procédure que le point 2. Déjà couverts (recherche du 12/10/2026 dans `content/`) : injection SQL, CSRF, XSS, cron, injection de dépendances de base et trait PHP (`Langages/PHP/poo.md`), idempotence, redirection ouverte, traversée de chemin et téléversement (`Sécurité/Cybersécurité/upload-de-fichiers.md`), affectation en masse. Exemples génériques de Drupal uniquement, jamais le code du projet revu. Un chapitre par thème :
- Plateforme et noyau : framework et inversion de contrôle (le framework appelle le code du projet via des déclarations : route, hook, service, plugin) ; hook et abonné d'événement avec priorité ; conteneur de services et fournisseur de services (remplacer un service du noyau) ; hook personnalisé (déclarer et appeler son propre point d'extension : `invokeAll`, `alter`) ; dépendance optionnelle (`moduleExists`) et dépendance non déclarée.
- Entités, plugins et annotations : entité de contenu et annotation/attribut de classe ; gestionnaire de plugins ; cycle de vie d'une entité (`preSave`, `postSave`, `preDelete`, `postDelete`) et effets de bord ; schéma de données construit par du code (définitions de champs) et champ calculé ; contrainte de validation de données (plugin).
- Multisite et adresses : un code, plusieurs sites, plusieurs bases (préfixes de tables) ; alias d'adresse, processeur d'adresse entrant et redirection 301 ; conversion automatique d'un paramètre de route en objet (param converter).
- Files d'attente et verrous : file d'attente applicative et planificateur (cron applicatif, worker, supervisord) ; patron « méthode modèle » ; verrou applicatif sur une entité.
- Migration et propagation de données : migration versionnée, mode simulation avant application, SQL en masse contre enregistrement un par un, garde-fou avant suppression ; réplication applicative d'un référentiel vers des satellites (propagation synchrone par HTTP, identifiant externe, satellites désynchronisés) ; machine à états applicative (statut, statut de publication).
- Cache et affichage : invalidation de cache à chaque écriture et risque de déni de service ; métadonnées de cache (contextes, étiquettes, durée de vie) ; affichage d'une entité (view builder, route d'entité `_entity_view`, contrôle d'accès d'entité) ; bloc (plugin) et chargement différé (lazy builder, espace réservé).
- Interfaces et hygiène : ressource REST (plugin) et authentification HTTP Basic ; redimensionnement d'images et format WebP ; désactiver la vérification TLS (`verify => FALSE`) et ses risques ; données personnelles dans les journaux d'erreur et les réplications (RGPD hors IA).

## powershell
- ajouter la creation d'alias dans powershell, des alias simples aux alias complexes, etendre aux autre shells si les niveaux de complexite d'alias ne sont pas gerer

## cybersecurite
- evoque OWASP Top 10 sans renvoyer dessus par un lien, idem pour les notions abordees dans l'introduction, pas de liens vers les chapitres qui en parlent

## ajouter une partie sur les serveurs web
- en lisant un chapitre sur les modeles de decision sctructuree, j'ai appris que les serveur peuvent renvoyer des 'retry-after', j'ai trouve ca interessant et je n'en ai jamais entendu parler, je pense donc que ce serait bien d'avoir une rubrique qui parle de la chose la plus commune qui soit sur internet : les serveurs web/sites internets.

## UI
- mettre quelque chose pour annoncer qu'on change de rubrique en selectionnant les boutons pour passer au prochain chapitre
- suivre la selection dans l'arbre en fonction du chapitre selectionne
- l'introduction n'est pas prise en compte quand on change de rubrique en cliquant sur le bouton de changement de chapitres

## fix
tu parles de "Haskell, l'outil historique du domaine", mais on ne sait pas de quel domaine tu parles

## 5. Notions de la revue finale de scop (19/10/2026)
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

## 6. Audios à générer (chapitres commités sans audio complet)
Un seul `generate-audio.mjs` à la fois (Piper sature le processeur), avec `ffmpeg` dans le `PATH` (`export PATH="$PWD/.tools/ffmpeg-9.0.1-essentials_build/bin:$PATH"`), le français séparément des trois autres langues. Chaque ligne se retire dans le commit qui ajoute l'audio.
- `constexpr-et-constantes` : fr, en, es, br.
