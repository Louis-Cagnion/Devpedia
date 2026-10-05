# TODO : Devpedia

> Prochaine tâche : rédiger le point 4 en commençant par l'item `Fondamentaux/Algorithmes` (ear clipping : sommets réflexes), puis les autres items dans l'ordre, un item à la fois, sans attendre de validation (récapitulatif relu après coup par Louis). Après : audio du point 3 (4 langues). Point 5 (vérifications GLSL et OpenGL non exécutées) : Louis a précisé qu'il n'a pas de rendu graphique sur cette machine, ne pas lui redemander tant qu'il n'a pas changé de machine. En attente de Louis : test navigateur (point 1), audio de la section IA > Modèles de décision structurée (point 2).

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois, sans attente de validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés ; toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).


## 2. Section IA > Modèles de décision structurée (TypeSafe AI / Jev)
- Générer l'audio des 4 langues de `content(-en/-es/-br)/IA/Modèles de décision structurée/` (12 chapitres + description, une seule passe, sur demande de Louis).

Sources : https://typesafe.ai/blog/introducing-system-one-models-and-jev, https://docs.typesafe.ai/introduction

## 3. Audio à générer (4 langues) pour les chapitres ajoutés ou modifiés
`node scripts/generate-audio.mjs <chemin>` pour chacun, puis retirer la ligne :
- `Infrastructure & DevOps/Administration système/windows-services-sessions-et-droits` (nouveau) et `administration-systeme` (présentation du sujet modifiée).
- `Infrastructure & DevOps/CI-CD/yaml-pipelines-azure` (paramètres de pipeline, alerte non bloquante, nuance sur le pool).
- `Qualité, performance et outils/Qualité et architecture du code/robustesse-traitement-par-lots` (nouveau) et `qualite-et-architecture-du-code` (présentation du sujet modifiée).
- `Sécurité/Cybersécurité/principes-de-developpement-securise` (section rayon d'impact).
- `Langages/Bash/expansion-et-jokers` (section antislash et chemins Windows).
- `Langages/PHP/poo` (section héritage) et `Langages/PHP/http` (section `json_encode()` sur `INF`/`NAN`).
- `Langages/PHP/exceptions` (sous-section `ValueError`).
- `Langages/PHP/methodes` (sections fonctions anonymes, `use`, `callable` et `flock()`, plus deux titres et un exemple en anglais).
- `Fondamentaux/Algorithmes/recherche-parallele-par-sous-problemes` (nouveau), plus les renvois ajoutés à `backtracking-et-satisfaction-de-contraintes` et `Qualité, performance et outils/Performance/parallelisme`.
- `Fondamentaux/Algorithmes/solveurs-sat-et-cdcl` (nouveau, sections heuristiques avancées et queues lourdes comprises), et le renvoi fusionné de `backtracking-et-satisfaction-de-contraintes`.
- `Fondamentaux/Algorithmes/encodages-sat` (nouveau, sections Tseitin, clauses implicites et propagateurs comprises).
- `Fondamentaux/Mathématiques/combinatoire-des-permutations` (nouveau), et la ligne `O(n!)` et le renvoi vers les problèmes NP-complets ajoutés à `Fondamentaux/Algorithmes/complexite-et-notation-big-o`.
- `Fondamentaux/Mathématiques/carres-latins-et-tirage-uniforme` (nouveau), et le renvoi ajouté à `les-probabilites-de-base`.
- `Langages/C/threads` (sections opérations atomiques et `_Thread_local`).
- `Langages/C/operateurs-binaires` (section fonctions intégrées `__builtin_popcount`/`__builtin_ctz`).
- `Langages/C/mesure-du-temps` (section `clock_gettime(CLOCK_MONOTONIC)`).
- `Langages/C/compilation` (section `-march=native` et `-pthread`).
- `Langages/C/memoire` (sections arène et `memcpy`/`memset`, et en anglais le tableau des quatre bugs mémoire).
- `Fondamentaux/Algorithmes/file-de-priorite-et-tas-binaire` (nouveau).
- `Qualité, performance et outils/Performance/mesurer-avant-d-optimiser` (profileurs natifs, piège de gprof sur les fonctions intégrées ou copiées, compteurs déterministes, programmes limités par la mémoire, portfolio et biais du jeu de test ; sections `cachegrind`, compteur de cycles, même travail avant chronométrage, tours alternés, division par un inverse précalculé).
- `Langages/Python/sous-processus-et-flux-standard` (section `timeout` et `ThreadPoolExecutor`, renvoi vers les processus orphelins).
- `Fondamentaux/Algorithmes/backtracking-et-satisfaction-de-contraintes` (section sur quoi brancher).
- `Langages/PHP/routage` (notes `parse_url()` qui renvoie `null` et point final CWE-42).
- `Sécurité/Cybersécurité/failles-de-navigateur` (`Referrer-Policy`, CWE-598 et `autocomplete` en français ; chapitre entier traduit en en/es/br, blocs d'exemple français réaccentués).
- `Qualité, performance et outils/Qualité et architecture du code/robustesse-traitement-par-lots` (section valider avant de détruire).
- `Fondamentaux/Algorithmes/problemes-np-complets` (nouveau).
- `Tests/property-based-testing` (section test différentiel).
- `Sécurité/Cybersécurité/ssrf-en-detail` (traduit en en/es/br ; bloc d'exemple français réaccentué).
- `Sécurité/Cybersécurité/upload-de-fichiers` (traduit en en/es/br ; blocs d'exemple français réaccentués).
- `Sécurité/Cybersécurité/securite-des-webhooks` (traduit en en/es/br ; version française réaccentuée, repli `?? ''` sur l'en-tête de signature).
- `Langages/C/processus` (section processus orphelins, récapitulatif corrigé ; en anglais, titre de la section `wait()` corrigé).
- `Qualité, performance et outils/Performance/cache-cpu-et-simd` (sections accès aléatoires, AoS/SoA, filtre par bitmap, écritures inutiles, TLB et pages géantes).
- `Langages/C/compilation` (sections unité de compilation, `static inline` et `-flto`, optimisation guidée par profil, canari de pile `-fstack-protector`).
- `Infrastructure & DevOps/Administration système/acces-a-distance-windows` (nouveau) et `windows-services-sessions-et-droits` (renvoi vers ce chapitre).
- `Langages/C/makefiles` (sections règles génériques, options sans recompilation et dossier d'objets par jeu d'options, chaîne PGO, `make -q` ; exemple `-I` corrigé).
- `Infrastructure & DevOps/CI-CD/agents-auto-heberges-azure` (nouveau).
- `Infrastructure & DevOps/Réseaux/tunnel-ssh-et-redirection-de-port` (nouveau).
- `Sécurité/Sécurité offensive/attaques-navigateur-automatise` (sections headless ou fenêtre réelle, captchas, profil persistant, débogage à distance de Chrome).
- `Fondamentaux/Algorithmes/couplage-biparti-et-theoreme-de-hall` (nouveau), et le renvoi ajouté à `encodages-sat` (section propagateurs).
- `Qualité, performance et outils/Performance/eviter-le-recalcul-redondant` (sections réparer le résultat précédent et parcours par bitmap).
- `Langages/Bash/gestion-des-processus` (sections `mktemp` et `trap`, `timeout` et Ctrl-C).
- `Langages/Bash/redirections-et-pipes` (section tampon de 4 Ko d'un tube).
- `Langages/Bash/scripts-et-shebang` (section commentaire de bloc `: <<'COMMENT'`).
- `Langages/Zsh/zsh` (section lire une touche : `read -k` et touches fléchées).
- `Langages/C/exit-et-codes-de-retour` (section `atexit()`).
- `Langages/C/convertir-un-texte-en-nombre` (nouveau).
- `Langages/C/operateur-virgule` (section ordre d'évaluation des arguments non spécifié, points de séquence).
- `Fondamentaux/Graphisme/wavefront-obj-et-modele-de-phong` (sections lire un `.obj` avec tolérance, fins de ligne et BOM, PPM P6, méthode de Newell, ear clipping robuste).
- `Fondamentaux/Graphisme/tampons-textures-et-shaders-opengl` (nouveau).
- `Fondamentaux/Graphisme/matrices-et-camera` (nouveau).
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (sections delta time et vsync).
- `Fondamentaux/Graphisme/effets-de-rendu-et-interaction-3d` (sections reflet de Fresnel, ray-marching, objet transparent, ressort amorti, `tanh`, placage triplanaire).
- `Infrastructure & DevOps/Administration système/garde-fous-de-ressources` (nouveau) et `administration-systeme` (présentation du sujet modifiée).
- `Langages/C/appels-systeme-et-descripteurs` (sections fichiers spéciaux : FIFO, `/dev/zero`, `O_NONBLOCK` + `fstat` + `fdopen`, et emplacement de son propre exécutable : `/proc/self/exe`).
- `Langages/C/memoire` (section tampon à doublement : `realloc` sans mise à zéro, `strlen` en condition de boucle, `strnlen`).
- `Qualité, performance et outils/Qualité et architecture du code/inondation-de-logs` (nouveau).
- `Fondamentaux/Graphisme/edition-de-maillage-et-selection-proportionnelle` (section compacter un maillage).
- `Fondamentaux/Graphisme/tampons-textures-et-shaders-opengl` (section éclairage double face : `gl_FrontFacing`).
- `Données/Représentation des données/nombres-flottants` (section absorption et annulation : `float` à 2²⁴, `NaN` et infini).
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (section limites de la carte graphique et `glGetError`, sous-section interroger le pilote graphique et l'écran).
- `Langages/C/compilation` (section vérifier à la compilation : `_Static_assert`, `-D`, `#pragma GCC diagnostic`).
- `Langages/C/makefiles` (sections en-têtes automatiques `-MMD -MP`, dépendance d'ordre, test d'un outil ou d'une bibliothèque).
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (section comment OpenGL connaît la machine : pilote, GLVND, DRM, `llvmpipe`, plusieurs cartes, Windows et macOS).
- `Fondamentaux/Graphisme/matrices-et-camera` (section normaliser l'échelle d'une scène : plage de tailles, facteur commun, double précision, précision du `float`).
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (sous-section un seul chronomètre par usage : chronomètre partagé, fondu par durée, mesure à plusieurs cadences).
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` (nouveau), et `administration-systeme` (présentation du sujet modifiée).
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` (section envoyer une touche à la bonne fenêtre : protocole sûr).
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` (section mesurer ce que l'application affiche : capture `ffmpeg` et pixels).
- `Qualité, performance et outils/Performance/mesurer-avant-d-optimiser` (section mesurer la complexité : doubler la taille, sur le build normal ; sanitizers et `realloc`).

## 4. Notions du projet scop et de sa revue crash-test (01/10/2026, à rédiger, un chapitre à la fois)
Source : toute la session (projet scop en C/OpenGL, revue crash-test, corrections vérifiées par exécution). Recherche faite dans `content/` : ce qui existe déjà est indiqué, le reste a 0 résultat. Ajouts à faire au fil des items de correction (les notions des items 11 à 20 s'ajouteront ici).

**Langages > C**
- `Fondamentaux/Algorithmes` (ou Graphisme, ear clipping) : **n'examiner que les sommets réflexes** : si un sommet est dans le triangle d'une oreille, alors un sommet réflexe l'est aussi, donc un polygone convexe ne coûte rien (12000 côtés : 2,4 s -> 0,03 s) ; liste des réflexes avec suppression en temps constant (échange avec le dernier et mise à jour de la position stockée dans le nœud) ; un sommet ne peut que passer de réflexe à convexe quand on coupe une oreille ; coût résiduel `n x r` ; bruit d'arrondi `float` qui rend « non convexes » des sommets d'un grand polygone convexe.
- `Langages/C/compilation` : l'avertissement `-Wformat-truncation` (actif avec `-O2`, via `_FORTIFY_SOURCE`) quand un `snprintf` peut dépasser son tampon : dimensionner le tampon pour le pire cas (somme des champs bornés par `%.200s`), pas pour le cas courant.
- `Langages/Bash` (et Zsh) : **zsh ne découpe pas une variable non guillemetée en mots** (`for sz in "1920 1080"; set -- $sz` donne un seul mot), contrairement à bash ; utiliser `${=var}` ; décimale à virgule des locales françaises dans `awk`/`printf` (`LC_ALL=C`) qui rend un fichier numérique invalide.
- `Qualité, performance et outils` (chapitre « sanitizers et tests » ou nouveau) : **les faux positifs de l'outil de test** : un vérificateur qui lit les triangles par numéro de sommet casse quand on renumérote ; un curseur de souris dans une capture fausse la boîte englobante (`ffmpeg -draw_mouse 0`) ; recompiler l'outil pendant qu'une série tourne ; un test qui lit une valeur avant l'appel qui la modifie ; toujours confirmer une alerte inattendue sur l'ancien code avant d'accuser le nouveau (ici 7 alertes, toutes dues à l'outil) ; comparer deux rendus après **normalisation de la luminosité** quand le shader pulse.
- `Qualité, performance et outils/Qualité et architecture du code` : **un contexte de travail (struct) pour découper une grosse fonction** : regrouper l'objet, le chemin du fichier, la liste en cours et la normale dans une structure (`Face_job`) passée par pointeur évite les listes de six paramètres et les variables globales, et permet à un seul `fail_face` de tout libérer ; plafonner la longueur d'une fonction et la découper en sous-fonctions au-delà de 100 lignes.
- Un tableau de chaînes alloué par `malloc` sans le terminer : `free_array` qui parcourt jusqu'au `NULL` lit de la mémoire non initialisée si l'échec survient avant la terminaison (bug trouvé et corrigé dans `ft_split`).

**Données > Représentation des données**
- `encodage-des-textes` (BOM déjà couvert) : BOM UTF-16 (`FF FE` / `FE FF`), octets NUL qui coupent chaque ligne dans un lecteur C ; BOM UTF-8 collé à la première directive d'un fichier texte, qui la rend « inconnue » et la fait disparaître en silence.

**Qualité, performance et outils**
- Nouveau chapitre « Sanitizers et tests d'allocation » : `-fsanitize=address,undefined`, LeakSanitizer, UBSan, `ASAN_OPTIONS=hard_rss_limit_mb`, comparaison avec valgrind ; **injection d'échecs d'allocation** (faire échouer la k-ième `malloc` avec `-Wl,--wrap=malloc`, piège de `LD_PRELOAD` qui touche aussi valgrind et le shell) ; valider l'outil de test sur l'ancien code défectueux ; balayage exhaustif de cas valides (formes × sens × départs × plans × échelles) et fuzz, régression conservée à partir d'un échec de fuzz ; comparer ancien et nouveau code sur les mêmes entrées.
- `Qualité et architecture du code` : un **message d'erreur propre à chaque cause** (jamais `error("")` vide ni `exit(1)` nu, jamais un message partagé entre causes) ; échouer sans fuite sur chaque chemin ; ne jamais annoncer « corrigé » sans test réel.

## 5. Vérifications à faire quand le projet scop sera disponible sur la machine
À notifier à Louis à la prochaine session sur Devpedia, pour qu'il décide de me mettre ou non dessus (ne pas lancer seul).
- `Fondamentaux/Graphisme/tampons-textures-et-shaders-opengl` (section éclairage double face) : compiler et exécuter les deux fragment shaders avec un pilote graphique ; sur un maillage à l'envers, vérifier que `gl_FrontFacing` éclaire la face vue par son dos et que `dark_ratio` donne une proportion de pixels noirs élevée sans la correction, faible avec.
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (section limites de la carte graphique et `glGetError`) : compiler `texture_fits`, `gl_error_name` et `check_gl_errors` avec les vrais en-têtes OpenGL (GLAD) et un contexte actif ; provoquer une erreur (`glTexImage2D` avec une taille supérieure à `GL_MAX_TEXTURE_SIZE`) et vérifier que la boucle lit `GL_INVALID_VALUE`, puis `GL_NO_ERROR`. Même chapitre, sous-section pilote et écran : exécuter `print_gl_info` et `window_fits_screen` avec GLFW et un contexte actif (affichage du fabricant, de la carte et de la version ; refus d'une fenêtre plus grande que l'écran).
- Même chapitre, section « Comment OpenGL connaît la machine » : sur une machine équipée d'un pilote graphique, exécuter `lspci`, `ls /dev/dri`, `lsmod`, `glxinfo -B` et `LIBGL_ALWAYS_SOFTWARE=1` (le `GL_RENDERER` doit commencer par `llvmpipe`) ; `DRI_PRIME=1` ou `__NV_PRIME_RENDER_OFFLOAD=1` sur un portable à deux cartes (le `GL_RENDERER` doit changer) ; provoquer l'échec de `glfwCreateWindow` (version demandée trop haute) et vérifier que le message de `glfwGetError` s'affiche. Seule la logique de l'extrait `glfwGetError` a été compilée et exécutée sous WSL contre un faux GLFW.
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (sous-section un seul chronomètre par usage) : sur une machine équipée d'un pilote graphique, lancer une boucle GLFW qui déplace un objet à vitesse constante avec vsync, puis avec `vblank_mode=0` (Mesa) ou `__GL_SYNC_TO_VBLANK=0` (NVIDIA) ; la distance après une seconde doit rester identique. Seule la logique a été simulée sous WSL avec une horloge fictive.
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` : sur une machine avec `xdotool` et `xinput`, vérifier `xdotool keydown`/`keyup`, que `xinput query-state` sur « Virtual core XTEST keyboard » affiche `key[9]=down` pour Échap enfoncée, que `xdotool` ne touche que les applications XWayland sous Wayland, et le protocole `send_escape_once` (seule sa syntaxe bash a été vérifiée, avec `getwindowname`, `getwindowfocus`, `getwindowpid` et le décompte `xinput test-xi2 --root` jamais exécutés). Section capture : `ffmpeg -f x11grab -draw_mouse 0 ... -frames:v 1 shot.ppm` non exécuté (pas de `ffmpeg` sous WSL), à lancer sous Xvfb en vérifiant que le curseur n'apparaît pas ; seul le script Python de boîte englobante a été exécuté, sur des PPM synthétiques. Sous Xvfb, seuls `XQueryKeymap` et `XTestFakeKeyEvent` (prototypes déclarés à la main, liaison aux `.so.6`) et le comportement de `trap` (relâchement remplacé par une ligne de fichier) ont été exécutés.
