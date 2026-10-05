# TODO : Devpedia

> Prochaine tâche : audio du point 3 (4 langues), un chapitre à la fois. En attente de Louis : test navigateur (point 1), audio de la section IA > Modèles de décision structurée (point 2), arbitrage des doublons (point 7).

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
- `Langages/Bash/variables` (section variable non guillemetée dans zsh) et `Langages/Bash/traitement-de-texte` (section nombres décimaux et locale).
- `Langages/Zsh/zsh` (section lire une touche : `read -k` et touches fléchées).
- `Langages/C/exit-et-codes-de-retour` (section `atexit()`).
- `Langages/C/convertir-un-texte-en-nombre` (nouveau).
- `Langages/C/operateur-virgule` (section ordre d'évaluation des arguments non spécifié, points de séquence).
- `Fondamentaux/Graphisme/wavefront-obj-et-modele-de-phong` (sections lire un `.obj` avec tolérance, fins de ligne et BOM, PPM P6, méthode de Newell, ear clipping robuste, ear clipping par sommets réflexes).
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
- `Langages/C/compilation` (section vérifier à la compilation : `_Static_assert`, `-D`, `#pragma GCC diagnostic` ; section `-Wformat-truncation`).
- `Langages/C/makefiles` (sections en-têtes automatiques `-MMD -MP`, dépendance d'ordre, test d'un outil ou d'une bibliothèque).
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (section comment OpenGL connaît la machine : pilote, GLVND, DRM, `llvmpipe`, plusieurs cartes, Windows et macOS).
- `Fondamentaux/Graphisme/matrices-et-camera` (section normaliser l'échelle d'une scène : plage de tailles, facteur commun, double précision, précision du `float`).
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (sous-section un seul chronomètre par usage : chronomètre partagé, fondu par durée, mesure à plusieurs cadences).
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` (nouveau), et `administration-systeme` (présentation du sujet modifiée).
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` (section envoyer une touche à la bonne fenêtre : protocole sûr).
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` (section mesurer ce que l'application affiche : capture `ffmpeg` et pixels).
- `Qualité, performance et outils/Performance/mesurer-avant-d-optimiser` (section mesurer la complexité : doubler la taille, sur le build normal ; sanitizers et `realloc`).
- Renvois vers `sanitizers-et-tests-d-allocation` ajoutés à `Langages/C/memoire` (note Valgrind), `Sécurité/Sécurité offensive/outils-de-fuzzing` (section sanitizers) et `Infrastructure & DevOps/Administration système/garde-fous-de-ressources` (ligne `ulimit -v` et ASan).
- `Langages/C/memoire` (section tableau de chaînes : le terminer avant de le remplir).
- `Données/Représentation des données/encodage-des-textes` (section BOM dans un fichier lu par un programme : UTF-8 collé à la première directive, UTF-16 et octets NUL).

## 5. Vérifications restantes (machine à pilote graphique)
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (section « Comment OpenGL connaît la machine ») : `glxinfo -B | grep -i renderer` n'a pas été exécuté (paquet `mesa-utils` absent) ; vérifier qu'il affiche le même renderer que `GL_RENDERER`.
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` : sur une session Wayland, vérifier que `xdotool` ne touche que les applications XWayland (la session de Louis est en X11) ; sur la session réelle, `xinput query-state` a été vérifié avec F13, pas avec Échap.

## 6. Relecture par Claude : chapitre « Les agents Azure Pipelines auto-hébergés » (quand le projet `scraping_infomediaires` sera disponible)
`Infrastructure & DevOps/CI-CD/agents-azure-pipelines-auto-heberges` (fr/en/es/br) a été rédigé sans le projet `scraping_infomediaires` (absent de la machine de rédaction) et sans exécuter aucune commande Windows : tout vient de la documentation Microsoft Learn. Dès que le projet est disponible, Claude relit le chapitre en le confrontant à la configuration réelle de l'agent : mode service ou autologon retenu, compte d'exécution, nombre d'agents sur la machine, options de `config.cmd` effectivement utilisées. Si la pratique diffère, corriger le chapitre (4 langues, audio régénéré).

## 7. Doublons à arbitrer après le merge du 05/10/2026
Deux machines ont rédigé les mêmes sujets en parallèle ; les deux versions ont été conservées (struct et fichiers), rien n'a été supprimé. Pour chaque paire, choisir de fusionner ou de supprimer l'une des deux (4 langues, `struct*.json`, renvois, audio) :
- `couplages-et-filtrage-de-regin` (Hall, Kuhn, Régin, mesures solveur) et `couplage-biparti-et-theoreme-de-hall` (Hall et Kuhn seuls).
- `agents-azure-pipelines-auto-heberges` et `agents-auto-heberges-azure` (CI-CD).
- `mesurer-avant-d-optimiser` : section « l'exemple de la division » (distant) face au chapitre `division-par-multiplication` (local).
- `eviter-le-recalcul-redondant` : sections « Réparer le résultat précédent » / « le bitmap » (distant) face à « Reprendre le résultat précédent » / « parcourir une bitmap » (local) ; récapitulatif conservé côté local.
- `scripts-et-shebang` : section `: <<'COMMENT'` conservée côté local, piège du mot de fin indenté repris du distant.
