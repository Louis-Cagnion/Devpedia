# Journal de bord — Devpedia

Suivi de progression du projet (pas destiné au public) : le pourquoi, les pièges, les décisions non évidentes. Le todo (`todo.md`) garde les points restants ; `git log` garde le détail mécanique de ce qui a été fait. Ce qui a été traité et commité n'apparaît pas ici comme une reformulation du commit : seul ce que Git seul ne montre pas mérite une entrée.

## Vérifications graphiques et X11 des chapitres OpenGL et XTEST (2026-10-05)

Le projet scop n'est pas sur cette machine (seule la sauvegarde `~/.claude/scop-crash-test` y est), mais les vérifications du todo n'en ont pas besoin : GLFW 3.3.10, un GLAD 1.x généré avec `pip install glad==0.1.36`, deux cartes (AMD 680M par défaut, NVIDIA RTX 3070) et Xorg suffisent. Le code des chapitres a été compilé tel quel. Trois résultats imprévus, ajoutés aux chapitres : `DRI_PRIME=1` retombe sur `llvmpipe` quand la carte dédiée est NVIDIA propriétaire ; `__GL_SYNC_TO_VBLANK=0` est sans effet en rendu délégué (PRIME offload) alors que `glfwSwapInterval(0)` marche ; le piège du `trap` retardé ne concerne que les traps de signal (`EXIT` seul tue et relâche aussitôt). Les essais clavier se font dans Xephyr (serveur imbriqué, Xvfb absent) et jamais en pressant une vraie touche de la session : seule F13, sans effet dans les applications et réparée aussitôt, l'a été pour confirmer que `xinput query-state` voit `key[N]=down` sur Xorg (Xephyr ne le montre pas). Un plafond de durée d'image fait perdre le temps d'un arrêt plus long que lui (3,81 au lieu de 5 après un arrêt d'environ 0,3 s du pilote NVIDIA).

## Chapitre « Un message d'erreur pour chaque cause » (2026-10-05)

Deux défauts trouvés en écrivant l'exemple, absents du todo : un message qui citait la ligne lue gardait son `\n` (message coupé sur deux lignes), corrigé en nettoyant la ligne avant l'analyse ; et LeakSanitizer ne voit pas un `fclose` oublié (la bibliothèque C garde la trace des fichiers ouverts), la fuite de descripteurs ne se révèle qu'avec `ulimit -n`. Sous `ulimit -n 3`, un exécutable lié dynamiquement ne démarre même pas (le chargeur de bibliothèques a besoin d'un descripteur) : l'essai se fait avec un exécutable `-static`. Le texte d'erreur reste en anglais dans les quatre langues (comme les causes des autres chapitres), seuls les commentaires et les libellés de l'exemple sont traduits.

## Section BOM dans « L'encodage des textes » (2026-10-05)

Mesuré sur six fichiers (UTF-8 avec et sans BOM, UTF-16 et UTF-32 dans les deux ordres) : le BOM UTF-8 ne casse que la première directive (le reste du fichier est lu normalement, d'où la difficulté à remonter à la cause) ; UTF-16 et UTF-32 font tout ignorer, sans erreur. En UTF-16, `fgets` s'arrête au premier octet `0A` du `\n` encodé en `0A 00` : le `00` ouvre la ligne suivante, d'où 3 lignes ignorées en petit-boutiste et 2 en gros-boutiste. Le nombre d'octets lus par `fgets` dépend du texte de l'exemple (33 en français, 29 en anglais, 31 en espagnol), et `file` aligne ses colonnes sur le plus long nom de fichier : les sorties de chaque langue viennent de leur propre exécution. Le BOM UTF-32 petit-boutiste (`FF FE 00 00`) commence comme celui d'UTF-16 : le test à quatre octets doit précéder l'autre.

## Section « Un tableau de chaînes : le terminer avant de le remplir » dans C > Mémoire (2026-10-05)

Le défaut du todo (`free_array` qui lit des cases non initialisées) n'apparaît que si la case en échec n'est pas écrite avant le test : avec `tab[i] = copy(...); if (!tab[i])`, la case vaut `NULL` et le parcours s'arrête juste, sans rapport sous ASan ni valgrind (mesuré, c'est donc le deuxième correctif du chapitre). Le défaut se voit seulement avec `word = copy(...); if (!word) { free_array(tab); } tab[i] = word;`. Sans outil, il reste silencieux (tas neuf à zéro) ; sous ASan, plantage reproductible (SEGV, adresse élevée, mémoire neuve remplie d'un motif non nul) ; sous valgrind, `Conditional jump or move depends on uninitialised value(s)`. Le banc doit rediriger `calloc` en plus de `malloc` (`-Wl,--wrap=calloc`), sinon le correctif par `calloc` échappe à l'injection.

## Chapitre « Un contexte de travail pour découper une grosse fonction » (2026-10-05)

L'exemple n'est pas celui du todo (`Face_job` du projet scop, absent de cette machine) : un chargeur de fichier `nom;âge;ville`, écrit pour être rejoué ici. Son ancienne version fait 98 lignes, sous le plafond de 100 : le défaut mesuré n'est pas la longueur mais les sept blocs de nettoyage dupliqués, dont l'un (échec d'agrandissement du tableau) oubliait deux `free` (44 octets en 6 blocs, trouvés par injection d'échecs sur 13 allocations). Deux pièges mesurés sur la version corrigée : sans remise à `NULL` après le transfert, double libération détectée par ASan ; sans `= {0}`, ASan et UBSan ne disent rien sur cette exécution (la pile valait zéro) et seul valgrind signale la valeur non initialisée. Les tailles de fuite dépendent du mot de l'exemple (« London » en anglais : 43 octets au lieu de 44).

## Chapitre « Sanitizers et tests d'allocation » (2026-10-05)

Tout est rejoué sur cette machine (gcc 12.4, clang 18.1, valgrind 3.22, Ubuntu 24.04), pas sous WSL comme les notes du todo (gcc 13.3, pas de valgrind) : les chiffres du chapitre sont ceux d'ici. Trois résultats imprévus, tous dans le chapitre : `hard_rss_limit_mb` n'est pas un plafond (limite 200 Mio, arrêt à 249 ; limite 300, arrêt à 505, vérification périodique) ; quand LeakSanitizer trouve une fuite, un `stdout` redirigé vers un fichier est perdu (0 octet, les lignes s'affichent sur un terminal) ; le balayage exhaustif à 4 caractères ne voit qu'une divergence sur les 8 874 que le fuzz trouve (nombres de plus de 9 chiffres). `LD_PRELOAD` qui fait échouer la 2e allocation tue aussi `sh` et `valgrind` (code 2). Les tailles de fuite changent avec les mots des exemples traduits (8 et 6 octets en français, 9 et 6 en anglais, 6 et 5 en espagnol et en portugais) : les trois traductions ont été recompilées et leurs sorties comparées au texte.

Les structures traduites (`struct-en/es/br.json`) ne listaient pas cinq chapitres arrivés par la fusion du 05/10 (`tampons-textures-et-shaders-opengl`, `matrices-et-camera`, `inondation-de-logs`, `garde-fous-de-ressources`, `touche-coincee-clavier-virtuel-xtest`) : le chapitre existait en quatre langues mais n'était pas navigable en en/es/br. Ajoutés à la main, avec le titre du fichier traduit. À vérifier à chaque fusion : comparer les identifiants de chapitres des quatre structures.

## Navigateur automatisé et tunnel SSH (2026-10-05)

`attaques-navigateur-automatise` gagne quatre sections (headless, captchas, profil persistant, débogage à distance) et un chapitre `tunnel-ssh-et-redirection-de-port` vient dans Réseaux (le port de débogage de Chrome n'est joignable à distance que par ce tunnel). Fait vérifié en ligne : depuis Chrome 136, `--remote-debugging-port` n'est plus pris en compte sur le profil par défaut, un `--user-data-dir` dédié est obligatoire. Aucun exemple rejoué : pas de serveur SSH ni de profil Chrome distant sous la main.

## Chapitre CI-CD : agents Azure DevOps auto-hébergés (2026-10-05)

`agents-auto-heberges-azure` (order 5, 4 langues) vient de la doc Microsoft « Deploy an Azure Pipelines agent on Windows » (options `config.cmd`, PAT utilisé seulement à l'enregistrement, variables `VSTS_AGENT_INPUT_*`, un dossier par agent), relue en ligne le jour même : aucune commande n'a pu être exécutée ici (pas d'organisation Azure DevOps), le chapitre ne contient donc aucun exemple rejoué. Piège de méthode : régénérer `struct-en/es/br.json` par `buildStruct` réordonne tout (342 lignes de diff, ordre des sections Sécurité perdu) puisque ces fichiers sont alignés à la main sur le français ; l'entrée du nouveau chapitre s'y ajoute à la main, comme pour `struct.json`.

## Chapitre « Les agents Azure Pipelines auto-hébergés » (2026-10-05)

Rédigé sans le projet source (`scraping_infomediaires` n'est pas sur cette machine) : tout vient de la documentation Microsoft Learn (agent Windows, agents, enregistrement par PAT), et aucune commande Windows n'a été exécutée ; le chapitre le dit. Deux nuances de la documentation contredisent l'intuition du todo : (1) le PAT ne sert qu'à l'enregistrement (il faut aussi un jeton pour `config.cmd remove` en mode sans question), un PAT expiré n'arrête donc pas un agent déjà enregistré ; (2) Microsoft recommande **un seul agent par machine** : plusieurs agents sont possibles (un dossier, un nom et un dossier de travail par agent) mais pas conseillés pour des jobs lourds en disque.

## Chapitre « La stabilité d'un tri, les égalités et le bruit reproductible » (2026-10-05)

Le todo et le bilan de recherche disaient que le `qsort` de la glibc 2.39 « garde l'ordre des indices ». Mesuré, c'est vrai seulement tant que la mémoire laisse place au tampon de fusion : `strace` montre un `mmap` de 4 800 512 octets (la taille du tableau de 1,2 M entiers) libéré juste après le tri. Avec `setrlimit(RLIMIT_AS)` laissant moins de 4,8 Mo, le même programme donne 712 247 paires d'égaux dans le désordre ; avec le départage par indice, l'empreinte du résultat est identique dans les deux cas. Le code source de la glibc n'a pas pu être lu en ligne (sourceware bloque, 404 sur les miroirs) : le mécanisme est donc établi par les mesures et `strace`, pas par le code. Le `cmp_act` de `research/solver/portfolio.c` ne départage pas par indice : le prototype dépend de cette stabilité, ce qu'une réécriture ne doit pas reproduire. Autre fait mesuré : en xorshift sans mélange de la graine, le premier tirage de la graine 2 vaut exactement le double de celui de la graine 1 (la multiplication par `0x9E3779B97F4A7C15` sert à ça).

## Chapitre « Comparer deux réglages » et vivification (2026-10-05)

Les cinq exemples Python du chapitre ont été rejoués dans les quatre langues : les sorties de la version française figurent toutes mot pour mot dans le chapitre, et les nombres des trois traductions sont identiques à ceux du français (seuls les libellés changent). Le chapitre a corrigé un chiffre du chapitre sur les couplages : sur les 40 grilles, 12 grilles (et non 11) ne sont résolues qu'avec le filtrage, contre 1 sans lui ; ces 40 grilles contiennent les 20 qui ont servi à choisir le seuil, d'où le renvoi vers le biais de sélection (8 contre 1 sur les 20 autres seules). « Mesurer avant d'optimiser » y renvoie aussi. La vivification est une section ajoutée à solveurs-sat-et-cdcl, pas un chapitre.

## Chapitre Zsh « Lire une touche » et bloc de commentaire Bash (2026-10-04)

Le `read -k` de zsh et les touches fléchées ont été rejoués sur un pseudo-terminal avec les octets réels (flèche = ESC `[` lettre, Alt+x = ESC x, F1 = ESC `O` `P`). Piège de bash vers zsh : `read -n 1` ne produit **aucune erreur** en zsh, la variable reste simplement vide (le manuel réserve `-n` aux fonctions de complétion). Limite documentée et vérifiée : un Échap suivi d'une lettre 20 ms plus tard (comme Alt+lettre) est lu comme le début d'une séquence, jamais comme un Échap isolé. Pour le bloc `: <<'COMMENT'`, le piège réel est le délimiteur sans apostrophes : ses `$(...)` s'exécutent (un `touch` crée bien un fichier). Les messages d'erreur du shell des exemples traduits en espagnol et en portugais sont en anglais (seules les locales `fr_FR` et `en_US` existent sur la machine). Observation, hors périmètre : la table de prononciation ne couvre pas la barre oblique inverse, Piper ignore `\` (« Missing phoneme from id map: \ », 12 occurrences pendant la génération audio du chapitre) : `\033` est lu « 033 ».

## Chapitre Bash « mktemp, trap et timeout » (2026-10-04)

Tout est mesuré en rejouant le script du chapitre sous bash 5.2 et zsh 5.9, avec un vrai Ctrl-C (octet 0x03 envoyé sur un pseudo-terminal) et non un `kill` : un signal envoyé au seul shell ne reproduit pas ce que fait le clavier, qui touche tout le groupe au premier plan. Trois résultats que le plan de départ ne prévoyait pas : (1) **zsh n'exécute pas le `trap ... EXIT` quand un signal tue le script** (INT, TERM et même SIGPIPE), alors que bash l'exécute : `trap 'exit 130' INT TERM` est indispensable en zsh, et `trap 'exit 141' PIPE` pour SIGPIPE (en bash, ce dernier fait apparaître un message d'erreur d'écriture) ; (2) sans `--foreground`, `timeout` se place dans son propre groupe de processus (PGID différent du script, vérifié avec `ps -o pgid`) et **Ctrl-C ne l'atteint plus** : le script attend la fin du délai, `sleep` survit ; (3) l'écart `2>&1` / tampon de 4 096 octets n'apparaît que vers un tube ou un fichier, jamais sur un terminal (vérifié avec `script`), ce qui rend le défaut invisible en test manuel. La coupure tombe à la ligne 67 pour « ligne » (5 lettres) et à la ligne 68 en anglais (« line » en 4) : les exemples traduits gardent des noms de fichiers et de programmes propres à chaque langue, et la ligne citée dans le texte suit la sortie réelle de chaque langue.

## Chapitre « Éviter le recalcul redondant » complété (2026-10-04)

Deux sections ajoutées (calcul incrémental à résultat identique, parcours d'une bitmap), chaque démonstration mesurée sur des compteurs de travail plutôt que sur le temps. Deux surprises à garder : (1) en rejouant le test de Hall avec reprise du couplage, la case laissée sans valeur diffère de celle du calcul complet dans 1 725 conflits sur 2 000 alors que l'ensemble des valeurs atteintes est identique dans les 2 000 : c'est la raison réelle du repli sur le calcul complet (même explication, donc même recherche), pas une différence de verdict ; (2) le parcours des seuls bits à 1 n'est **pas** plus rapide à 9 % de listes non vides (25,1 ms contre 22,4 ms, tableau de 435 Mo) : le gain n'apparaît qu'à 1 % (×3,7) et en dessous, à 30 % le parcours complet devient plus lent. Le chapitre présente donc ce seuil plutôt que le seul gain de 3,3 % du solveur. Les chiffres du chapitre viennent de la série prise une fois la génération audio terminée (14,2 ms à 1 %, trois exécutions identiques) ; une série prise pendant l'audio donnait 16 à 17 ms.

## Chapitre « Couplages, test de Hall et filtrage de Régin » (2026-10-04)

Les chiffres viennent de `RECAP-04-10.md` et `BILAN-RECHERCHE.md` (le `RECAP-27-09.md` cité par le todo n'existe plus). Le code du chapitre (Kuhn, ensemble de Hall, Tarjan, filtrage) est une version lisible de `research/solver/hall.c`, validée contre une énumération exhaustive de toutes les permutations sur 300 000 domaines aléatoires (2 à 8 cases) : existence du couplage, ensemble de Hall (203 500 sur 203 500) et filtrage (le domaine final est exactement l'ensemble des valeurs d'au moins un couplage complet) sans aucun désaccord. Dans les traductions, « couplage » devient *matching* / *emparejamiento* / *emparelhamento* (et « complet » devient *perfect* / *perfecto* / *perfeito*, le terme usuel) ; les anciens chapitres traduisent « case » par *cell* / *casilla* / *casa*, repris ici.

## Chapitre « Remplacer une division par une multiplication » (2026-10-04)

Premier chapitre du point 7 rédigé avec l'audio des quatre langues généré avant le suivant. Trois constats à garder :

- La borne du solveur (`q <= 128`, `d < 2^25`) est **suffisante**, pas nécessaire : la preuve demande seulement `d × e < 2^32` (`e` = erreur d'arrondi de l'inverse), et le premier dividende faux est juste au-dessus de `2^32 / e` (q = 3 : 2 147 483 648 ; q = 127 : 38 693 470). Vérifié sur les 4 294 967 296 paires de la zone garantie en 5,7 s, 0 fausse.
- `gcc` remplace déjà `d / 108` par une multiplication, même en `-O0` : la technique ne sert que pour un diviseur connu à l'exécution. Micro-test ×2 (chaîne dépendante) à ×3,4 (divisions indépendantes), mais −0,5 % dans le solveur : le chapitre insiste sur cet écart plutôt que sur le gain isolé.
- Le `>> 32` n'est licite que parce que le produit est en `uint64_t` : décaler d'un entier de 32 bits de sa largeur est un comportement indéfini (voir `operateurs-binaires`). Piège de rédaction : `validateInternalLinks` ne contrôle pas les ancres `#...`, et dans une traduction l'ancre est le slug du titre **traduit** (`#shifts`, `#los-desplazamientos`) ; elles ont été vérifiées à part. Les chronométrages varient de 0,01 ns d'une exécution à l'autre (1,29 ou 1,30 ns) : le tableau du chapitre arrondit à 1,3 ns, les blocs de sortie montrent chaque exécution réelle.

## Relecture indépendante des chapitres de la recherche rush01 (2026-10-04)

Un agent relecteur a repris les 7 chapitres et les sections issus de la recherche : exemples rejoués, chiffres recoupés avec `RECAP-04-10.md` et `BILAN-RECHERCHE.md`. Deux pièges à retenir :

- Des URL avaient remplacé `MADV` et `GLIBC` à l'intérieur de `madvise(MADV_HUGEPAGE)` et de `GLIBC_TUNABLES=...` dans `cache-cpu-et-simd` (4 langues, depuis le 26/09), sans doute par un remplacement de texte trop large au moment d'ajouter les liens. Après un tel remplacement, relire les blocs et le code en ligne touchés.
- `operateurs-binaires.md` (fr, en) était passé de CRLF à LF au commit 7ecee37c. Un fichier lu en mode texte par Python perd ses CRLF (fins de ligne universelles) quand on le réécrit, et `core.autocrlf=input` ne protège que les fichiers déjà en CRLF dans l'index. Rétabli par `git -c core.autocrlf=false add` ; lire et écrire en binaire (`open(p, "rb")`) évite le piège.

Le tas binaire passe avant les solveurs SAT dans Algorithmes, puisque VSIDS s'en sert (règle 1 du plan zéro-connaissance).

## Chapitre Windows : accès à distance (2026-09-27)

Point 4 du todo (projet scraping_infomediaires) rédigé en nouveau chapitre d'Administration système, après celui des sessions. Les commandes Windows (`mstsc`, `tscon`, `query session`) n'ont pas pu être exécutées sur la machine de rédaction (Linux) : chaque syntaxe et chaque prérequis vient de la documentation Microsoft Learn, dont le fichier de commandes `tscon` de la page Azure DevOps sur les tests d'interface. La page de l'ancienne commande `shadow` (2008) affirme que la console ne peut pas être observée ; elle ne vaut plus pour `mstsc /shadow` (2012 R2 et après) et n'est citée que pour la règle des droits. Les libellés de la stratégie de groupe restent en anglais dans les versions espagnole et portugaise, faute de source pour leur traduction officielle ; le bloc `bat` est passé en `text`, `highlight.js` ne connaissant pas ce langage sur le site.

## Chapitre Mesurer avant d'optimiser complété depuis la recherche rush01 (2026-09-27)

Quatre sections ajoutées (`cachegrind`, compteur de cycles, même travail avant chronométrage, tours alternés), avec des chiffres mesurés sur la machine au repos. Surprise de l'essai `__rdtsc()` : sans `_mm_lfence()`, une lecture en RAM dans la portion mesurée n'y coûte que 26 cycles (autant qu'une portion vide), son coût étant payé après la mesure ; avec la barrière, 318 cycles. Le tableau des tours alternés reprend les vraies mesures A/B du solveur du même soir. Dans les traductions, les identifiants des exemples sont traduits comme ceux de l'exemple `gprof` existant, et chaque version est recompilée et exécutée.

## Chapitre C Makefiles complété depuis la recherche rush01 (2026-09-27)

Quatre sections ajoutées (règles génériques, options sans recompilation, chaîne PGO, `make -q`), chaque piège reproduit dans un dossier d'essai avec `LC_ALL=C` avant d'en citer le message. Trois intuitions de rédaction démenties par l'essai : `$^` avec `FORCE` échoue dans l'éditeur de liens (`cannot find FORCE`), un commentaire en bout de ligne de variable arrête `make` sur un message trompeur (`mixed implicit and normal rules`) au lieu de compiler au mauvais endroit, et l'étape 3 de la PGO sans `rm` des `.o` échoue à l'édition de liens (`__gcov_merge_add`) au lieu de relier les objets instrumentés. L'exemple `-I` existant (4 langues) plaçait l'option sur l'édition de liens, où elle n'a aucun effet. Piège d'outillage : le chapitre français est en CRLF comme la traduction anglaise ; `pathlib.read_text`/`write_text` convertissent silencieusement en LF (diff de 158 lignes détecté par `git diff --stat`), d'où `open(..., newline="")` pour tout script qui réécrit un chapitre.

## Structures traduites alignées sur le français (2026-09-26)

Complétées à la main (cf. entrée sur `buildStruct` plus bas), les structures en/es/br avaient dérivé : ordre différent dans Cybersécurité (3 langues), Mathématiques (en) et les sous-sections de Langages (en, br), et en portugais 4 chapitres restés aux emplacements d'avant la fusion des catégories du 22/08 (`Langages/Python/{pandas,jupyter-notebooks,deep-learning-pytorch}`, `Langages/JavaScript/HTMLElements`), versions plus anciennes que les canoniques et affichées en double. Contrôle à refaire après toute retouche manuelle : pour chaque catégorie et sous-section, la liste des identifiants traduits doit être égale à celle de `struct.json`, et chaque fichier de `content-xx/` doit avoir son équivalent au même chemin dans `content/`.

## Rédaction par 3 agents en parallèle : ce que la relecture a dû corriger (2026-09-26)

Points 19 à 21 confiés à 3 agents Sonnet (un worktree chacun, sur demande de Louis), fusionnés par cherry-pick après relecture. Écarts trouvés, à vérifier d'office sur tout travail délégué : sorties annoncées « réelles » sans le code qui les produit ; une sortie de script française sans accents recopiée telle quelle dans les 4 langues, alors que la convention est de traduire identifiants et chaînes affichées puis de réexécuter chaque version ; un chiffre mal lu dans le récap source (« 2 à 7 littéraux » pour « 2 à 7 clauses unitaires ») ; une définition fausse (« variables décidables »). Liens : `langages-de-programmation` n'est qu'un ancien identifiant redirigé par `js/legacy-category-redirects.js` (le validateur l'accepte) ; un nouveau lien vise `langages`. Le plan zéro-connaissance exclut les sous-agents : cette session est une dérogation explicite de Louis, pas un changement de règle.

## Fins de ligne CRLF dans 39 chapitres : les préserver lors d'une édition par script (2026-09-26)

39 fichiers de `content*/` (dont les versions traduites de `Langages/C/compilation.md`) sont en fins de ligne Windows (CRLF). Un script Python qui les lit puis les réécrit en mode texte les convertit sans rien dire en LF : le diff montre alors le fichier entier modifié (vécu sur `compilation.md`, rattrapé avant le commit). Parade : lire et écrire ces fichiers en binaire, et vérifier `git diff --stat` avant chaque commit ; un ajout doit reprendre la fin de ligne du fichier.

## Structures traduites : ne jamais les régénérer avec `buildStruct` (2026-09-26)

Régénérer `struct-en/es/br.json` avec `buildStruct()` de `scripts/generate-struct.js` dégrade ces fichiers : le libellé d'une sous-section redevient le nom de dossier français, et une sous-section dont le fichier principal traduit ne porte pas le titre du dossier (« Modèles de décision structurée ») voit ce fichier listé comme un chapitre, avec des sous-sections déplacées. Les structures traduites se complètent donc à la main : insérer le nouveau chapitre à la même position qu'en français, puis valider les liens avec `validateInternalLinks()`.

## Convention confirmée : le README.md racine reste en anglais (2026-09-19)

Louis a confirmé explicitement que l'anglais est un choix délibéré pour `README.md`, pas un oubli (règle "Langue du README" de `/best-practice`, français par défaut sauf convention établie). Seuls les titres de catégories principales du README ont par ailleurs été traduits FR→EN ce même jour pour rester cohérents avec le reste du document.

## Item todo #1 terminé : cause racine des échecs espeak-ng -- instabilité d'environnement, pas de contenu (2026-09-19)

17 chapitres laissés en échec sur la machine Windows de la session précédente, dont 2 (`editeur-de-code-et-ide`, `complexite-et-notation-big-o`) échouant dans les 4 langues -- hypothèse d'un caractère partagé jamais vérifiée. Recherche de caractères inhabituels dans les 8 fichiers source : rien de suspect (l'exposant `ⁿ` n'est présent que dans un des deux chapitres, donc pas une cause commune). Piste abandonnée.

Régénération individuelle des 17 combinaisons sur ce poste Linux (`ffmpeg`/`node`/`python3` déjà sur le PATH) : **les 17 ont réussi du premier coup**. Confirme l'hypothèse du 16/09 : le crash `UnicodeEncodeError: ... surrogates not allowed` ne dépend pas du contenu mais d'un état dégradé accumulé côté environnement après une centaine d'appels `piper_batch.py` dans une même session longue -- pas un bug corrigeable dans le dépôt (contrairement au bug distinct des capitales `Á`/`Í` pt-BR, déjà fixé le 15/09). À retenir pour une prochaine régénération qui replante en boucle : redémarrer l'environnement plutôt que chercher un caractère fautif.

## Item todo #2 terminé : double mécanisme de résumé dans 8 chapitres (2026-09-19)

Décision de Louis : un seul résumé par chapitre, fusion si le contenu diffère, sinon garder le plus complet. Traité chapitre par chapitre, 4 langues : `nombres-flottants.md` et `PHP/securite.md` avaient des faits absents du `## 📋 Récapitulatif` (2⁵³/`NaN != NaN` ; panorama réseau MITM/sniffing/session hijacking/brute force/SSRF) -- fusionnés. `JavaScript/nombres.md` : un fait manquant (`Number("")` vaut `0`) -- ajouté. Les 5 autres (`gestion-memoire-raii.md`, `organisation-en-memoire.md`, `entiers-et-debordements.md`, `encodage-des-textes.md`, `aleatoire-et-generateurs.md`) avaient un ancien `## Résumé` strictement redondant -- supprimé sans fusion.

## Revue exhaustive des `a` isolés dans `content-br/` terminée (2026-09-19)

Les ~370 lignes signalées à l'item #5 relues intégralement : immense majorité déjà correcte, quelques crasis authentiques corrigées (`acesso às outras tabelas`). Au passage, une quinzaine d'accents manquants sans lien avec `a`/`à` repérés et ajoutés au dictionnaire (`gracas`→`graças`, `mes`→`mês`, `cabecalho(s)`→`cabeçalho(s)`, `presenca`→`presença`, `seguranca`→`segurança`, `forca`→`força`, `maquina`→`máquina`, `mudanca`→`mudança`, `relogio`→`relógio`, `conteiner`→`contêiner`, `negocio`→`negócio`, `canonico`→`canônico`, `cabeca`→`cabeça`), plus deux corrections manuelles ciblées (`sql.md`, `listes-chainees.md`, en laissant intact le nom de variable C réel `cabeca`).

**Reste non traité, hors périmètre** : quelques blocs `text` non balisés contenant de la prose descriptive avec des accents manquants, protégés par la règle "jamais toucher un langage de bloc de code non reconnu" (`fine-tuning-modele-vision.md`, `authentification-vs-autorisation.md`).

## Item todo #4 terminé : accents espagnols manquants dans `content-es/` (2026-09-19)

87 fichiers corrigés (commit `0a776ba8`), même méthode que `content-br/` (dictionnaire + suffixe `-cion`/`-sion` → `-ción`/`-sión`, jamais sur le pluriel `-ciones`/`-siones` qui reste correct sans accent). Mots volontairement non touchés (ambigus sans contexte) : `el`/`él`, `se`/`sé`, `si`/`sí`, `que`/`qué`, `este`/`esté`, `esta`/`está`, `fallo`/`falló`.

## Item todo #5 terminé : mots ambigus non corrigés dans `content-br/` (2026-09-19)

Relecture individuelle de `esta`/`está` (11), `contem`/`contém`/`contêm` (11), `mantem`/`mantém` (8), `media`/`média` (2) : le sens dépend du contexte grammatical, jamais automatisable. `continua` s'est avéré déjà correct partout (forme verbale, jamais l'adjectif `contínua`). Plusieurs `e`/`é` voisins aussi corrigés, ainsi que les expressions figées `à direita`/`à esquerda`/`à toa`.

## Item todo #4 terminé : accents portugais manquants dans `content-br/` (2026-09-19)

199 fichiers corrigés (commit `d609c81e`) via un dictionnaire (mots sans lecture valide non accentuée) plus des suffixes déterministes (`-cao`→`-ção`, `-encia`→`-ência`, `-ancia`→`-ância`, `-avel`→`-ável`, `-ivel`→`-ível`, `-sao`→`-são`), appliqués aux commentaires et aux chaînes multi-mots. Jamais touché : mots ambigus (`e`/`é`, `a`/`à`, `esta`/`está`, `contem`/`contém`/`contêm`) ni chaînes d'un seul mot.

Piège trouvé et corrigé en route : le script de cohérence des noms de fichiers fictifs (`calculos.h` cité plusieurs fois dans un chapitre) prenait la première orthographe rencontrée comme référence -- si un commentaire accentué précédait le vrai `#include`, ça accentuait le nom partout, y compris dans le `#include` réel. Corrigé pour toujours préférer la forme non accentuée. Piège annexe : un commentaire citant une valeur de sortie du code juste au-dessus (`Python/variables.md`, `"".join(["Python", "e", "legivel"])`) s'est retrouvé désynchronisé une fois le commentaire accentué ; corrigé en accentuant aussi la chaîne source.

Reste non traité : le même problème existe par endroits dans `content-es/` (accents manquants dans certains diagrammes), pas d'audit exhaustif fait.

## Item todo #5 terminé : lignes de code de plus de 95 caractères, 4 langues (2026-09-19)

Chantier complet sur les 4 langues (commits `48d3a50`..`524ce410`). Méthode : script qui déplace un commentaire de fin de ligne trop long au-dessus du code, puis passage manuel pour les compréhensions/appels à exploser et pour trancher les diagrammes ASCII/Unicode (jamais coupés, ça détruirait l'info visuelle).

Piège de méthode : le chiffrage initial ("1719 lignes") comptait des **octets**, pas des caractères -- `awk`/`mawk` sur ce système ne gère pas l'UTF-8 (`length()` compte 2 octets par caractère accentué), gonflant le total détecté d'environ 3x (FR : 180 "détectées" → 60 réelles). Toujours compter avec Python (`len()` sur texte décodé UTF-8), jamais `awk`/`wc -m` sans vérifier l'encodage.

## Item todo #5 terminé (`<details>`/`<summary>`, capture d'événements, Web Storage, Blob) (2026-09-18)

4 notions ajoutées (4 langues) : `<details>`/`<summary>` (`semantique-html5.md`), phase de capture pour un événement non-bouillonnant (`dom-et-evenements.md`), `sessionStorage`/`localStorage`, `Blob`+`URL.createObjectURL()`. Plusieurs commentaires de code préexistants sans accents corrigés au passage ; sweep plus large nécessaire ailleurs dans `content*/`.

## Item todo #17 terminé (CGI classique, parsing HTTP progressif, longest prefix match) (2026-09-17)

3 notions (4 langues) : CGI classique vs FastCGI (`php-fpm.md`), reconstitution d'une requête HTTP fragmentée via `\r\n\r\n`/`Content-Length` (`sockets-et-io-non-bloquante.md`), correspondance de préfixe le plus long (`api-et-http.md`).

## Item todo #16 terminé (ENTRYPOINT+CMD, volume épinglé, certificat TLS auto-signé) (2026-09-17)

3 notions (4 langues) : `ENTRYPOINT`+`CMD` via `exec "$@"` (`dockerfile.md`), volume Docker nommé épinglé (`volumes-et-reseaux.md`), certificat TLS auto-signé via `openssl` (`cryptographie-appliquee.md`).

## Item todo #15 terminé (Ford-Johnson, std::stack, typename, lower_bound) (2026-09-17)

4 notions (4 langues) : tri fusion-insertion de Ford-Johnson (`tri-par-comparaison.md`, explication complète en 5 étapes), `std::stack`/`lower_bound` (`stl-conteneurs.md`), `typename` pour un type dépendant (`templates.md`).

## Item todo #14 terminé (Rule of Three, virgule fixe, héritage multiple/diamant, Prototype, point-dans-triangle) (2026-09-17)

5 notions (4 langues) : forme canonique orthodoxe (`classes-et-objets.md`), héritage multiple/diamant + pattern Prototype (`heritage-et-polymorphisme.md`), virgule fixe (`nombres-flottants.md`), test point-dans-triangle (`vecteurs-et-produit-scalaire.md`). Deux trouvailles notées au todo plutôt que corrigées (changements d'ampleur) : le double mécanisme de résumé dans 8 chapitres ; des titres mal traduits en anglais dans `classes-et-objets.md` (corrigés) et `references.md` (repéré, hors périmètre).

## Item todo #13 terminé (notation CIDR, table de routage) (2026-09-17)

2 notions (4 langues) : notation CIDR et table de routage/route par défaut, ajoutées à `fondamentaux-reseau.md`.

## Item todo #12 terminé (DDA/fisheye, texture mapping, sprite billboarding/z-buffer, souris infinie, bandes de rendu) (2026-09-17)

5 notions (4 langues) ajoutées à `rendu-3d-bas-niveau-et-fenetrage.md` : DDA, correction fisheye, texture mapping, sprite billboarding + z-buffer, souris infinie ; parallélisation d'un rendu par bandes ajoutée à `threads.md` plutôt que `parallelisme.md` (registre CPU-bound en C).

## Item todo #11 terminé (dîner des philosophes, sémaphores POSIX, mesure du temps) (2026-09-17)

3 ajouts (4 langues), tous sous `Langages/C` : deadlock par ordre total sur les verrous (`threads.md`), nouveau chapitre `semaphores.md` (sem_open/sem_wait/sem_post/sem_close/sem_unlink), nouveau chapitre `mesure-du-temps.md` (gettimeofday, imprécision d'usleep, attente active).

## Item todo #7 terminé (fractales, série de Taylor, buffer MinilibX) (2026-09-17)

3 ajouts (4 langues) : écriture directe dans le buffer MinilibX (`rendu-3d-bas-niveau-et-fenetrage.md`), nouveau chapitre `fractales-et-temps-dechappement.md` (Mandelbrot/Julia) sous `Fondamentaux/Graphisme`, nouveau chapitre `approximation-par-serie-de-taylor.md` sous `Fondamentaux/Mathématiques`.

## Item todo #10 terminé (AST, code de sortie 128+signal, heredoc, fnmatch) et bug de lien cassé trouvé (2026-09-17)

4 sections ajoutées à `architecture-dun-shell.md` (4 langues) : AST pour `&&`/`||`/`|`, convention `128 + signal`, here-document `<<DELIM`, `fnmatch` récursif. Bug préexistant repéré en route : dans 4 fichiers ES/BR, "Cómo"/"Código" était scindé par un lien auto-inséré vers le chapitre C (`[C](...)ómo`) -- un outil de génération de liens matchait la lettre "C" en tête de mot sans vérifier de limite de mot. Corrigé (lien retiré, mot restauré), aucune autre occurrence trouvée.

## Item todo #9 terminé (pile/file + algorithme glouton) et `struct.json` stale trouvé (2026-09-17)

Deux nouveaux chapitres sous `Fondamentaux/Algorithmes` (4 langues) : `pile-et-file.md`, `algorithme-glouton.md`. En régénérant `structure/struct.json`, 10 chapitres `content/Sécurité/*` d'une session précédente en étaient absents (jamais régénéré depuis leur ajout) : corrigé pour les 4 langues. 4 de ces 10 étaient déjà traduits (juste absents du struct), les 6 restants réellement jamais traduits, notés au todo plutôt que traduits dans la foulée.

## Item todo #8 terminé (`sigaction()` + codes ANSI) et tirets cadratins résiduels dans 10 chapitres Sécurité (2026-09-17)

`sigaction()` (`signaux-unix.md`) portait des commentaires sans accents, contraire à la convention du reste de `content/Langages/C/*.md` : corrigé, puis traduit EN/ES/BR. Notion ANSI ajoutée à `le-terminal.md` (4 langues).

Balayage plus large (`grep -rl "—" content/`) : 10 chapitres `content/Sécurité/*` (jamais traduits) où la règle anti-tiret-cadratin n'avait pas été appliquée, hors du périmètre des balayages précédents. Tous corrigés. Piège : l'audio FR de 4 de ces chapitres avait déjà été régénéré en tâche de fond AVANT cette correction texte -- à régénérer une fois le lot terminé.

## Fond étoilé : Louis revient sur le scope .chapterPage (2026-09-17)

Après le correctif ci-dessous (scope restreint à `.chapterPage`), Louis a signalé l'absence de fond sur l'accueil comme un problème : décision finale inversée, le traitement stylisé doit s'appliquer à toutes les pages, comme avant l'investigation. `.chapterPage` retiré de tous les sélecteurs de `content.css`, `README.md` mis à jour. Le correctif de largeur (`body:has(.page)::before` fixed + `isolation: isolate`) reste inchangé.

## Fond étoilé des chapitres : scope manquant + régression body::before invisible (2026-09-17)

`README.md` décrivait le traitement stylisé comme scopé à `.chapterPage`, mais aucune règle de `content.css` ne le référençait réellement (tout s'appliquait via `.page` seul). Confirmé avec Louis : le scope `.chapterPage` est voulu, seule la largeur posait problème. Règles requalifiées en `.page.chapterPage`.

Pour la largeur : `.page::before` (`position: absolute`, limité à 900px) → `body:has(.page.chapterPage)::before` (`position: fixed`, plein viewport). Première version invisible malgré des styles calculés corrects : un `::before` en `z-index: -1` sur un `body` sans contexte d'empilement propre remonte au contexte racine, où il se peint *derrière* l'arrière-plan de `body` plutôt que devant. Fix : `isolation: isolate` sur `body:has(.page.chapterPage)` (retirée de `.page`, devenue inutile). Vérifié en navigateur.

## Bug silencieux : `--context=<categorie>` ne génère rien pour une catégorie à subjects (2026-09-16)

Le lot 1 s'est terminé avec succès (exit 0) mais sans jamais toucher `gestion-de-projet-et-organisation` pour EN/ES/BR -- aucune erreur, absence totale. Cause (`scripts/generate-audio.mjs:157`) : le contexte d'un chapitre est `subject.id` s'il existe, sinon `category.id` -- jamais les deux. Cette catégorie a deux subjects : passer l'id de catégorie ne matche donc aucun chapitre. Fonctionnait pour `blockchain`/`ui-ux`/`tests` uniquement parce que ces catégories sont plates.

**Les 6 lots planifiés étaient donc faux pour toutes les catégories à subjects.** Todo mis à jour avec les vrais ids de subjects. Piège annexe : l'id de subject `fondamentaux` existe SOUS `securite`, donc `--context=fondamentaux` cible ce subject-là, jamais la catégorie racine.

## Nouveau crash espeak-ng (lone surrogate) sur `fr_FR-siwis-medium`, non reproductible (2026-09-16)

Lot 2 planté après le 1er chapitre, même signature que le bug `Á`/`Í` pt-BR mais sur la voix FR. Investigation par bisection : ni le chapitre isolé ni ses entrées rejouées une à une n'ont reproduit le crash -- texte strictement identique entre exécution isolée et en séquence. Aucun caractère suspect trouvé. Conclusion initiale : non déterministe -- **révisée ci-dessous, l'instabilité s'est aggravée**.

## Escalade de l'instabilité espeak-ng sur le lot 2, investigation abandonnée (2026-09-16)

Un traitement chapitre par chapitre (contournement censé fiable) a quand même échoué de façon croissante : plusieurs chapitres plantés 3/3, dont `Mathematiques` plantant dès la voix FR sans même un premier succès. Aucun caractère inhabituel trouvé dans le contenu source. Écarté : les diagrammes ASCII ne sont jamais envoyés à la synthèse (un bloc `PRE` devient une simple pause).

**Conclusion retenue, faute de mieux** : l'échec ne dépend pas du contenu, et son taux augmente avec le nombre cumulé d'appels `piper_batch.py` dans la session (plus d'une centaine) -- probablement une fuite de ressource côté environnement plutôt qu'un bug corrigeable ici. Investigation arrêtée : redémarrage recommandé avant de reprendre.

**Erreur commise pendant le dépannage** : un `rm -rf .audio-tmp-*` lancé en pensant nettoyer des débris de runs plantés a en fait supprimé un dossier temporaire activement utilisé par une génération encore en cours, provoquant un échec ffmpeg sans rapport avec le bug espeak-ng. Retenu : ne jamais toucher aux fichiers temporaires d'un process dont on sait qu'il tourne encore.

État final laissé au lot 2 : 30/100 combinaisons chapitre/langue commitées, le reste bloqué par cette instabilité.

## 3 notions PDF_parser supplémentaires ajoutées (2026-09-15)

`Path.write_text()`/`.read_text()` (`manipuler-des-fichiers-et-dossiers.md`), `date.isoformat()`/`.fromisoformat()` (`dates-et-heures.md`), `dataclasses.asdict()` (`dataclasses.md`). FR/EN/ES/BR le jour même. Corrigé un lien manquant vers le chapitre JSON, jamais posé dans ces deux fichiers malgré la mention explicite de JSON.

## Bug Piper/espeak-ng : capitales `Á`/`Í` plantent la voix pt-BR (2026-09-15)

Le lot 1 a planté silencieusement en tâche de fond (le wrapper rapporte `exit code 0` même quand le process Node a crashé -- ne jamais se fier à ce seul code). Investigation par bissection : `espeak-ng`, utilisé par Piper pour `pt_BR-faber-medium`, corrompt un buffer interne en phonémisant une capitale accentuée précise -- confirmé lettre par lettre : `Á` et `Í` (capitales) plantent systématiquement, `É`/`Ó`/`Ú`/`Ã`/`Â` et les minuscules fonctionnent tous.

Corrigé dans `sanitizeForVoice()` (`scripts/generate-audio.mjs`) : le texte envoyé à `pt_BR-faber-medium` remplace `Á`→`á` et `Í`→`í` avant synthèse (sans effet sur la prononciation ni sur le texte affiché).

## `next()` à deux arguments ajouté (2026-09-15)

`next(iterateur, defaut)` ajouté dans `iterateurs-et-generateurs.md`, avec l'exemple `next((x for x in coll if condition), defaut)`. FR/EN/ES/BR le jour même.

## Nouveau chapitre `regex-en-python.md` (2026-09-15)

Nouveau chapitre `Langages/Python/regex-en-python.md` (order 18), FR/EN/ES/BR le jour même : couvre l'API Python (`re.compile`, `match`/`search`/`fullmatch`/`findall`/`finditer`, `Match`, groupes nommés, `re.sub`), renvoie au chapitre DSL `regex.md` pour la syntaxe générale. Lien "Python" du chapitre DSL redirigé vers ce nouveau chapitre.

## 3 notions PDF_parser ajoutées + régénération audio complète lancée (2026-09-15)

`os.environ` (`modules-et-environnements.md`, avec piège explicite vs environnement virtuel), compréhension imbriquée (`listes-et-tuples.md`), `frozenset` (`dictionnaires-et-ensembles.md`). FR/EN/ES/BR le jour même. Deux défauts préexistants corrigés au passage dans `dictionnaires-et-ensembles.md` EN (lien interne perdu, titre mal traduit).

**Blocage d'infrastructure** : `ffmpeg` absent du PATH sur cette machine, `winget` cassé (droits admin indisponibles, `sudo` désactivé). Contourné par téléchargement direct du build officiel `ffmpeg-release-essentials` (gyan.dev), extrait hors du dépôt. Un premier essai a échoué (`CRYPT_E_NO_REVOCATION_CHECK`, piège proxy TLS d'entreprise) ; contourné avec `curl --ssl-no-revoke`.

**Portée** : régénération du site complet (432 chapitres × 4 langues) en 6 lots par taille croissante de catégorie, pour rester reprenable.

## Angle mort du comptage de `##` découvert et corrigé en EN/ES/BR (2026-09-15)

3 fichiers `Git/architecture-interne.md`/`rebase.md`/`resoudre-conflits.md` (order EN décalé de -3) ne portaient qu'un désync de frontmatter, plus pour `rebase.md` une section entière absente, reproduite dans les 3 langues.

Le comptage de `##` promis au todo n'a trouvé aucun écart, mais un test manuel a révélé un angle mort : un bloc `> **Piège :**`/`> **Bonne pratique :**` ne crée jamais de nouveau `##`, donc une traduction peut en perdre plusieurs sans être détectée. Rebalayé avec un comptage de blocs `^> \*\*` (regex générique, chaque langue traduisant différemment).

Ce second balayage a trouvé une corruption bien plus profonde dans 5 fichiers ES (blocs Piège/Bonne pratique manquants, tableaux tronqués, code resté en français, liens perdus, contenu inventé sans équivalent FR) et 4 fichiers EN (traductions plus anciennes que la restructuration FR, `html-elements.md` avec son `## 📋 Summary` positionné au milieu du fichier). Tous réécrits intégralement.

## Audit qualité EN : 34 chapitres avec récap absent, corruption plus profonde dans plusieurs (2026-09-15)

Point de départ : `http.md` (PHP) à moitié traduit. Généralisé en comparant le nombre de fichiers avec récapitulatif entre `content/` et `content-en/` : 34 fichiers FR avec récap n'en avaient aucun en EN. ES/BR indemnes.

Récapitulatifs ajoutés aux 34 fichiers. En vérifiant plus profondément, une dizaine se sont révélés bien plus corrompus : identifiants restés en français, titres mal traduits, sections entières absentes (`conditions.md` PHP avait perdu toute la section `==`/`===`). Réécriture complète de 12 fichiers plutôt que correctifs ponctuels.

Au passage, plusieurs `order` en frontmatter EN désynchronisés du FR corrigés, et deux fichiers avec frontmatter entier absent (`regex.md`/`sql.md`, DSL). Reste ouvert : 3 fichiers Git avec le même symptôme d'`order` décalé, même méthode de diagnostic à appliquer ; ES/BR jamais vérifiés pour ce type de corruption profonde.

## strrchr/strstr en C, rattrapage de traduction, deux bugs d'infra découverts en route (2026-09-14)

En écrivant `strrchr`/`strstr`, constaté que le lot précédent n'avait jamais été traduit EN/ES/BR malgré la règle "traduire le jour même" : un ajout à un chapitre EXISTANT semble échapper au réflexe de traduction, contrairement à un nouveau fichier. Rattrapé manuellement.

Deux bugs d'infrastructure découverts en régénérant l'audio, sans rapport avec le contenu :
- **`scripts/generate-audio.mjs`** codait en dur le chemin Piper en layout Unix (`.venv-piper/bin/python`), jamais testé depuis un Node Windows natif avant ce jour. Corrigé par une sélection de chemin selon `process.platform`.
- **18 dossiers de contenu vides orphelins** traînaient depuis une fusion de catégories antérieure et se faisaient reprendre par `generate-struct.js` comme fausses catégories racine. Supprimés.

Décisions de rangement prises pour 13 notions candidates encore ouvertes, question par question avec Louis ; détail dans `todo.md`.

## Vérification avant coupure d'une semaine : tirets cadratins résiduels (2026-09-04)

Vérification de routine avant une absence de Louis. 33 fichiers avec un tiret cadratin trouvés (le balayage de 2026-08-11 ne couvrait que `content/` ; les traductions EN/ES/BR accumulées depuis n'avaient pas été vérifiées). Tout corrigé, cohérent avec la ponctuation déjà utilisée côté FR. `struct.json` régénéré, aucun lien cassé.

## Connecter une appli PHP locale à SQL Server, hors Devpedia (2026-09-04)

Session sur un autre projet (`Backoffice-TC`, Slim 4 + SQL Server), matière candidate à un futur chapitre Devpedia sur l'environnement de dev local pour une appli PHP connectée à une base externe. Détail dans `todo.md`.

- **`php -S localhost:PORT` sur Windows** : le serveur se bind parfois uniquement en IPv6, invisible pour un hostname résolu en IPv4 via hosts. Correctif : binder explicitement sur `127.0.0.1:PORT`.
- **Extensions PHP manquantes silencieusement bloquantes** : `composer install` échoue extension par extension plutôt que de tout lister d'un coup.
- **OAuth et redirect_uri exact** : Google/Okta refusent tout `redirect_uri` qui ne correspond pas EXACTEMENT à une URL déjà déclarée côté fournisseur.
- **Proxy TLS d'entreprise et Composer** : chaque paquet échoue une fois en téléchargement direct avant de réussir via un clone Git en repli automatique -- même famille de piège que le cas Docker/Playwright déjà documenté ailleurs.
- **Fuite de secrets constatée en passant** : un `.env_copie` en clair suivi par Git sur ce projet -- vérifier qu'un fichier `.env*` copié est bien gitignoré avant de le committer.

## Régénération complète de l'audio FR cassé par le bug des blocs adjacents (2026-09-01)

Le comptage à l'œil du 29/08 (57 chapitres) sous-estimait la portée : un script Python en trouve 61. Root cause déjà corrigée ; régénération lancée pour les 61.

Bug annexe découvert en route : `needsEnglishVoice()` force la voix anglaise même sur un span de code purement ponctuation (`[]`, `{}`), rien à prononcer -- Piper écrivait un WAV sans frame, plantant tout le batch. Corrigé en repliant ce type de span sur la voix de la page.

Trois id de chapitre ambigus site-wide (`regex`, `exceptions`, `boucles` partagés entre plusieurs langages) auraient sinon régénéré des chapitres déjà corrects. `generate-audio.mjs` accepte désormais un `audioPath` complet en argument positionnel pour désambiguïser.

## Chapitre SQL complété : DDL, index, NULL vs sentinelle, pyodbc, SCD2 (2026-09-01)

Lacunes repérées par Louis en migrant un projet vers SQL Server : DDL vs DML, `CREATE TABLE`, index (limite 900 octets, pousse vers une clé technique `IDENTITY`), `ALTER TABLE` (réordonner impose de recréer la table), `NULL` vs valeur sentinelle, `pyodbc`, SCD2.

Choix retenu : tout intégrer dans `sql.md` existant plutôt qu'un second chapitre (prolonge la pratique déjà couverte, pas une théorie à part ; `Bases de données` réservé à une vraie matière théorique future). Traduit EN/ES/BR le même jour.

## Grosse session lecture audio : cache navigateur, 2 bugs de segmentation, voix par défaut du code inline (2026-08-30)

**Faux "l'audio ne marche plus" #1 : cache HTTP.** `python -m http.server` n'envoie aucun `Cache-Control` ; un F5 ne revalide pas les sous-ressources `fetch`. Seul correctif garanti : changer de port (nouvelle origine = cache vide). Ajouté comme piège pédagogique au chapitre "Le serveur local".

**Faux "l'audio ne marche plus" #2 : vrai bug de segmentation.** Un désaccord `timing=173 plan=175` causé par un correctif du jour changeant le découpage. Établi le protocole : tout changement à `collectSegments()`/`speakableCode()`/`speakableText()` implique de régénérer l'audio des pages déjà testées.

**Bug 1** : un lien markdown collé à une ponctuation de fin de clause cassait le découpage (`collectLeafSegments()` sautait le flush au lieu de le faire quand même). Corrigé.

**Bug 2** : un span de code non modifié par `speakableCode()` rejoignait la phrase sans vérifier `needsEnglishVoice()` en premier. Réordonné.

**Voix anglaise par défaut sur tout le code inline** (demande explicite) : `needsEnglishVoice()` inversée en liste noire (anglais par défaut, français seulement si signal explicite). Limite assumée : un identifiant français sans accent basculera aussi en anglais.

**`` [`code`](url) `` jamais reconnu comme span de code** : le `<code>` généré est un enfant du `<a>`, jamais direct du paragraphe. Concerne 30 fichiers. Corrigé via `codeSpanIn()` (`js/reader-highlight.js`).

**Bandeau "chapitre suivant" ne disparaissait pas au changement de page** : nettoyage rendu inconditionnel. Décompte rendu dynamique (5,4,3,2,1) à la demande de Louis.

**Répétitions de mots signalées à ×1.5** : un rattrapage de `timeupdate` suppose les clips parfaitement concaténés, mais l'encodage MP3 laisse quelques ms de flou par frame. Corrigé avec une tolérance de 100ms. Non vérifiable à l'oreille depuis ce sandbox.

**Refactor de la table de prononciation** (demandé explicitement, "pas très scalable") : `js/reader-pronunciation.js` passé à une table plate (`WORD_RESPELLING_FR`) et une boucle sur des paires `[pattern, remplacement]`.

**Lot de respellings FR** : `.txt`→"T-X-T", `macOS`→"mac O-S", `GUI`/`CLI`→épelés, `User`→"Useur", `Command`→"Commande", `graphique`→"graphik", opérateurs de `le-terminal.md` routés en voix FR (bug trouvé : routés à tort vers la voix anglaise).

Portée des régénérations du jour : uniquement "Bases de l'informatique" FR, approuvé par Louis.

## Fin de journée sur la lecture audio : pauses aux clauses, FR pregen-only, nouveau chapitre (2026-08-29)

**Pause de lecture aux clauses enfin audible** : `splitIntoClauses()` ne faisait que découper le texte, jamais insérer de vrai silence. Ajout de `getClausePauseClip()` (180ms de silence). Validé à l'oreille par Louis.

**Plus de repli sur la voix du navigateur pour le français** : Louis a tranché "retire toute voix qui n'est pas pregénérée" (FR seulement, EN/ES/BR gardent le repli). Une page FR sans audio à jour ne lit plus rien du tout tant qu'elle n'est pas régénérée.

**Nouveau chapitre "Le serveur local"**, à la demande de Louis. Traduit EN/ES/BR par 3 agents en parallèle.

**Signalé, pas encore corrigé** : un bégaiement occasionnel en début de section, probablement l'imprécision de seek du MP3 (découpage par frame).

## SQL ajouté aux exceptions au tiret (2026-08-29)

"SQL" mal prononcé. Table de cas spéciaux généralisée en `ACRONYM_OVERRIDES_FR`, SQL ajouté (`S-Q-L`).

## Bug de fond : chapitres à 2+ blocs de code adjacents jamais lus en Piper (2026-08-29)

Louis a détecté que la voix robot du navigateur jouait au lieu du Piper pré-généré malgré un mp3/json fraîchement régénéré. **Root cause** : `buildReadingPlan()` (navigateur) appelle `collapseConsecutivePauses()` après `collectSegments()` ; `buildPlanForChapter()` (script) ne l'appliquait pas -- toute page avec 2 blocs de code adjacents désynchronisait son plan d'exactement une entrée, invalidant silencieusement tout l'audio pré-généré (repli sur voix robot, sans erreur visible). 57 chapitres FR concernés.

Corrigé : `collapseConsecutivePauses()` exportée et appliquée aussi côté script. 56 chapitres restants à régénérer.

## Essais successifs sur PowerShell/Git, jusqu'à validation par Louis (2026-08-29)

Plusieurs variantes testées à la suite : PowerShell → "Pow-eur-shell", Git → "Gui tte" -- confirmées correctes par Louis. Reste en attente : les autres chapitres gardent l'ancienne prononciation, seul l'accueil régénéré à chaque itération.

## Blockchain + Zsh en tiret (2026-08-29)

Zsh passé de "Z S H" à "Z-S-H" (même technique que UI/UX). "Blockchain" respelé "Block cheine" (suggestion de Louis).

## UI/UX : 5e retouche, cas spécial au lieu d'une règle générale (2026-08-29)

Traité comme cas spécial isolé (tiret entre les deux lettres de chaque moitié) plutôt que de toucher le mécanisme générique et risquer une régression sur HTML/CSS.

## Surlignage désynchronisé de la vitesse de lecture + 4e retouche prononciation (2026-08-29)

**Surlignage/vitesse** : `scheduleEstimatedWords()` calculait ses délais à partir de `durationMs` à vitesse normale, jamais ajusté par `readerRate`. Corrigé en divisant `durationMs`/l'offset par `readerRate` avant de les passer à la fonction.

**Prononciation, 4e passage** : la virgule entre chaque lettre (UI/UX) cassait les sigles plus longs (HTML/CSS) -- revenu à l'espace simple. "G I T" jugé faux à l'oral autant que "Guite" -- remplacé par "Gui te".

## Prononciation FR : 2e et 3e retouches après écoute de Louis (2026-08-29)

"UI/UX" toujours mal : remplacé par une virgule entre chaque lettre. "Guite" prononcé "yite" : abandonné, épelé lettre par lettre (`G I T`). "Zsh" lu comme un mot : même traitement lettre par lettre.

## Liens manquants sur la réécriture + bug de prononciation des sigles séparés par "/" (2026-08-29)

Plusieurs sujets nommés en prose sans lien, chacun relié à un chapitre représentatif. **Bug trouvé au passage** : "UI/UX" lu "uzi/uzx" -- `spellOutAcronymsFr()` épelait chaque sigle mais laissait le "/" brut, imprononçable. Généralisé : le motif reconnaît une chaîne de sigles séparés par "/" et les relie par une virgule.

## Section "Ce que couvre le site" réécrite + micro-ajustement scroll (2026-08-29)

Section obsolète depuis l'ajout de nouveau contenu (catégories manquantes). Réécrite en listant les 11 catégories actuelles, liens vérifiés. Fait en français uniquement pour l'instant.

## Suite de l'audit : boutons toujours désynchronisés en changeant de paragraphe (2026-08-29)

**Root cause commune**, dans `js/reader.js`/`js/reader-highlight.js` :
1. `audioEl.pause()` déclenche son événement `pause` de façon asynchrone ; un saut de paragraphe peut classer à tort la fin d'une lecture ancienne comme une coupure de la lecture en cours. Corrigé par `pauseAudioEl()`, qui marque explicitement le `pause()` attendu.
2. Seul `NotAllowedError` signifie que rien ne joue réellement -- un `AbortError` (seek/pause qui se chevauchent) ne l'implique pas.
3. `scheduleEstimatedWords()` comparait `highlightedTarget` (partagé par une ligne de tableau) au lieu de `entry.words`, laissant un minuteur périmé corrompre le surlignage d'une entrée plus récente.

## Audit demandé par Louis : boutons désynchronisés de la voix (2026-08-29)

**Trouvaille principale** : `speakNext()` met `isPlaying = true` avant même que `audioEl.play()` ait démarré ; si `play()` est rejeté (politique autoplay), `isPlaying` restait bloqué à `true` pour toujours. Deux correctifs : le `catch` de `play()` remet l'état à "en pause" ; `notifyOptimisticPlay()` bascule immédiatement le bouton sur "Pause" au tap, avant l'attente de l'audio pré-généré.

## Crash silencieux en sautant de paragraphe dans un tableau (2026-08-29)

`scheduleEstimatedWords()` plantait sur `word.textContent` quand `word` vaut `null` (entrée purement composée de texte de connecteur, ex. "Votre situation :"). Corrigé par un accès nul-sûr (`word?.textContent?.length ?? 4`).

## Prononciation FR généralisée pour tous les sigles + PowerShell/Git (2026-08-29)

Toute abréviation en MAJUSCULES épelée lettre par lettre via `spellOutAcronymsFr()`, sauf une courte liste de conjonctions françaises (ET, OU, NON) pouvant apparaître en capitales d'emphase. "PowerShell" séparé en "Power Shell". "Git" respelé "Guite" (non confirmé à l'oreille).

## Surlignage figé en bas de page après une lecture complète (2026-08-29)

La branche de fin de plan de `speakNext()` ne faisait ni `clearHighlight()` ni scroll, contrairement à la branche "pause" juste en dessous. Corrigé en alignant les deux branches.

## Audio pré-généré pas vraiment prioritaire au démarrage (2026-08-29)

`buildReadingPlan()` lançait le fetch du mp3/json en arrière-plan sans l'attendre : un clic juste après le chargement pouvait démarrer sur la synthèse live puis basculer sur le pregen en cours de route. Corrigé : les 4 points d'entrée de lecture attendent le chargement (borné à 3s) avant de choisir le moteur.

## Voix bloquée sur le tableau de l'accueil : bug Chrome + accueil jamais pré-généré (2026-08-29)

Un bug connu de l'API Web Speech de Chrome : `speak()` appelé juste après le `onend` de l'utterance précédente ne déclenche parfois plus aucun événement, sans erreur. Seul un vrai délai (~300ms) entre `cancel()` et un nouveau `speak()` permet à la resynthèse de repartir. Corrigé par un watchdog (3s, retry, puis abandon de l'entrée). `scripts/generate-audio.mjs` excluait `acceuil` de la pré-génération sans raison retrouvée -- exclusion retirée.

## Ajout ciblé dans `rebase.md` : reformuler un commit sans éditeur interactif (2026-08-27)

Technique trouvée en pratique ailleurs : `reset --soft` vers la base commune, puis recommit un par un via `git show <hash>:<fichier>` -- utile pour reformuler un commit non-HEAD sans `rebase -i` (qui échoue sans terminal attaché). Ajouté comme sous-section de `rebase.md`.

## Nouvelle sous-section "Systèmes d'exploitation" + bug de fond mobile trouvé en vérifiant (2026-08-25)

Nouvelle sous-section, un seul chapitre `creer-un-systeme-d-exploitation.md`, renvoi vers osdev.org en fin de chapitre. Placement tranché par Louis via question à choix. Traduit EN/ES/BR par 3 agents en parallèle.

**Bug trouvé en vérifiant** : le fond étoilé (`css/content.css`, `.page::before`) restait gris uni sur mobile. Hypothèse `color-mix()` non supporté écartée par test iOS. Cause probable : bug de rendu WebKit sur `color-mix()` utilisé comme stop de couleur dans un `radial-gradient`. Fix retenu : remplacé par des triplets RGB précalculés utilisés via `rgba()`.

## 6 nouveaux chapitres issus d'une capture Instagram, dont une nouvelle sous-section "Conception à grande échelle" (2026-08-22)

**Règle du nombre de catégories top-level** : 11 maximum (hors accueil), déjà atteint -- tout ajout futur passe par une sous-section ou un chapitre existant, jamais une 12ᵉ catégorie sans fusion préalable.

Chapitres ajoutés : `tpu-npu-lpu-vpu.md`, `metadonnees-exif-et-format-raw.md`, `fingerprinting-navigateur-et-appareil.md`, `conteneurs-manages-ecs-et-fargate.md`, `hachage-perceptuel-similarite-dimages.md`, `empreinte-audio-reconnaissance-musicale.md`.

**Nouvelle sous-section "Conception à grande échelle"** (priorité explicite de Louis, cf. mémoire `devpedia-content-priority-system-design.md`) : `system-design-lexercice.md`, `autoscaling-et-repartition-de-charge.md`, `cdn-et-diffusion-adaptative.md`.

## 2 chapitres de plus dans "Conception à grande échelle" : Instagram et Twitch, pas les 5 demandés (2026-08-22)

Louis a demandé 5 sujets (Instagram, TikTok, YouTube, Twitch, Spotify) en flaggant le risque de répétitif. Évaluation avant rédaction : 3 des 5 reposent sur le même CDN déjà couvert, hors périmètre. Seuls Instagram (`fil-dactualite-fan-out.md`) et Twitch (`direct-et-chat-a-grande-echelle.md`) apportaient un concept nouveau. Proposé à Louis via question à choix, qui a choisi de s'en tenir à ces deux-là.

## Test réel iPhone : la piste MediaSession seule ne suffit pas (2026-08-22)

Résultat négatif et net : appuyer sur play sur un casque Bluetooth lance l'app native au lieu du site, y compris en pause. `speechSynthesis` n'est jamais reconnu par iOS comme une vraie session de lecture média, même avec les hooks `MediaSession` branchés. Reste à trancher entre pré-générer l'audio et abandonner l'objectif de confort écran verrouillé. Non testé sur Android.

## Débat prompt engineering : critères hiérarchisés plutôt que « sans s'arrêter » (2026-08-22)

Louis voulait une section décrivant un prompt unique menant un projet de A à Z sans arrêt. Débat mené avant rédaction :
1. « Sans s'arrêter » contredit le non-déterminisme d'un LLM déjà documenté ailleurs -- une erreur commise tôt se propage silencieusement.
2. « Choisir elle-même les meilleures options » cache un problème : sans critère explicite, un modèle choisit l'option statistiquement fréquente, pas la meilleure pour le projet. Affiné en critères de décision hiérarchisés (une liste seule ne suffit pas si des critères valides entrent en conflit).
3. Le vrai enjeu : quel type de décision mérite un arrêt (réversible/technique à automatiser, structurante/irréversible à valider), pas « autonome vs supervisé » en bloc.

Résultat : nouvelle section dans `IA/NLP et LLM/prompt-engineering.md`, placée après « Donner un rôle et des instructions explicites ».

## Décisions bloquantes tranchées (2026-08-22)

**Portée des chapitres n8n** : générique uniquement, sans documenter l'usage d'un projet spécifique.

**Lecture écran verrouillé (Bluetooth)** : tester d'abord `MediaSession.playbackState` avant d'investir dans un pipeline de pré-génération audio (options envisagées si échec : TTS auto-hébergé/cloud, ou garder `speechSynthesis` en direct en abandonnant l'objectif).

## Regroupement des 26+ catégories top-level en 10 (2026-08-22)

Décidé avec Louis : fusion en 7 catégories composites + IA/UI-UX/Blockchain restant top-level. Catégories déjà en `subjects` aplaties en sous-catégories directes du nouveau parent.

**Liens internes existants** : ~1700 occurrences réparties sur 441 fichiers référençaient les anciens ids -- réécrire chaque lien aurait été disproportionné. Solution : `js/legacy-category-redirects.js`, résolu par `resolveLegacyCategory()` avant toute recherche de catégorie.

**Découverte importante** : `structure/struct.json` n'est pas censé être édité à la main -- régénéré par `node scripts/generate-struct.js`, qui valide aussi tous les liens internes et échoue au moindre lien cassé. Deux problèmes trouvés en le testant après coup : il ignorait `legacy-category-redirects.js` (corrigé en lui faisant importer `resolveLegacyCategory()`) ; deux ids choisis à la main ne correspondaient pas au slug réel du dossier (mots de liaison gardés). Étendu aux 3 langues traduites via `buildStruct`/`writeStruct`. **Pour toute restructuration future** : préférer relancer `generate-struct.js` plutôt qu'éditer `struct.json` à la main.

Bug préexistant trouvé et supprimé en passant : `struct-br.json` listait une entrée top-level orpheline `"bash"`, sans lien du site pointant dessus.

## 4 chapitres isolés cursus 42 (2026-08-20)

4 chapitres dont le placement ne nécessitait aucune décision structurelle. Chaque insertion "à côté de X" a nécessité de décaler tous les `order` suivants d'un cran, dans les 4 langues.

Écart de convention repéré avant traduction : mes brouillons FR se terminaient par `## Ce qu'il faut retenir` sans `---` ni emoji, alors que les catégories cibles utilisent uniformément `---` + `## 📋 Récapitulatif` -- à vérifier systématiquement par grep sur les fichiers déjà présents avant d'écrire un nouveau chapitre.

12 agents de traduction lancés en une fois. Un agent a signalé avoir accidentellement lancé un script hors périmètre puis l'avoir annulé via `git restore` avant de rendre la main -- vérifié après coup, aucun résidu. Un autre écart corrigé manuellement : un agent a traduit "Piège" par un terme calqué sur un fichier de référence au lieu du terme standard du site -- la terminologie d'un fichier de référence ne se reprend que pour le même terme source.

## Bug de rendu : séparateur `---` affiché en texte littéral (2026-08-20)

`parseAppendText` (`js/parser.js`) ne traitait aucun cas "ligne réduite à `---`" -- elle tombait dans la branche générique `<p>`. Corrigé en ajoutant un cas dédié générant un `<hr>`, plus une règle CSS minimale. Vérifié par grep sur les 4 langues.

## Chapitre watermarking IA (2026-08-20)

Source Instagram donnée par Louis : `WebFetch` renvoie une page vide (contenu réservé aux comptes connectés) ; contournement via l'extension Chrome (`navigate` + `get_page_text`).

Les 4 `struct-<lang>.json` se sont révélés désynchronisés du contenu réel au moment de la régénération (chapitres présents sur disque depuis des sessions antérieures jamais commités dans le struct) : remis en phase. À surveiller : rien ne régénère automatiquement ces fichiers après un commit de contenu seul.

## Nouvelles catégories cursus 42 : Réseaux, Algorithmes, Administration système (2026-08-18)

Piège du pattern "3 agents en parallèle, même worktree" : les agents partagent le même index Git. Deux fois, un `git add`+`commit` d'un agent a transitoirement inclus les fichiers fraîchement stagés par un autre (fenêtre de course entre `add` et `commit`). Détecté et corrigé par les agents eux-mêmes (`git reset --soft HEAD~1` + recommit scoppé), aucune perte -- à surveiller si le pattern est réutilisé avec plus d'agents.

## Clôture de l'audit best-practice du 2026-08-16 (2026-08-17)

Scission de `js/router.js` (684 lignes) en 3 fichiers (résolution cross-langue, URL/historique, rendu+navigation), écart par rapport au découpage proposé pour éviter un import circulaire. Scission de `css/base.css` (928 lignes) en 6 fichiers par concern.

Piège de session : après un redémarrage du serveur de dev, un onglet déjà ouvert peut continuer à servir une version mise en cache de `index.html`, produisant une page qui semble cassée sans erreur console -- vérifier `document.styleSheets`/`document.scripts` avant de conclure à une régression réelle.

## Rattrapage `content-br/` (portugais brésilien)

Le contenu existant utilisait du vocabulaire européen malgré le label "Português (Brasil)" (`ficheiro`/`arquivo`, `utilizador`/`usuário`...), avec des accords de genre/préposition différents. Script réutilisable : `scripts/fix-br-vocabulary.mjs`.

**`content-br/` a atteint la parité structurelle complète avec le FR le 2026-08-14**, après avoir traduit une longue liste de catégories dans la session. **Sweep tirets cadratins terminé le même jour** : 86 fichiers, 4 agents en parallèle. **`semantique-html5.md` retraduit en entier** (n'avait jamais eu sa section récapitulative).

**Audit complet post-parité (2026-08-14)** : révélé un problème systémique bien plus large -- 87 fichiers legacy prédatant le renommage pt→br, jamais eu leur résumé final, certains tronqués de 25 à 46% par rapport au FR (reliquat de l'ancien pipeline DeepL). Louis a choisi la réécriture complète, sans agent cette fois, catégorie par catégorie avec commit+push après chaque.

## Rattrapage `content-es/` (espagnol)

Même chantier que BR : alignement structurel sur le FR (14 catégories créées), puis audit des chapitres déjà "traduits" : sur 118 fichiers, 89 sans résumé final, 29 tronqués à moins de 80% du FR, 48 avec tirets cadratins résiduels. Louis a choisi la réécriture complète, sans agents, catégorie par catégorie (Git, CSS avec agents cette fois, puis Docker/Mathématiques/Qualité et architecture du code/Zsh/Vision et OCR/Voix IA à la main).

**Chapitres FR sans résumé standard** (Mathématiques, Vision et OCR, Voix IA utilisent `## Ce qu'il faut retenir` sans emoji) : traduit à l'identique plutôt qu'harmonisé, pour respecter la structure FR exacte -- à reproduire pareillement pour ces 3 catégories dans toute langue future.

**Champs de blocs de code spéciaux non traduisibles** (`js/charts.js`) : les noms de champs des blocs ```` ```plot-fonction ````/```` ```vecteurs ````/```` ```distribution ```` sont codés en dur, indépendants de la langue -- seule la valeur se traduit, jamais le nom du champ.

Restant après cette session : Performance, UI-UX, Shells/PowerShell.

## Nouvelle catégorie Cybersécurité (2026-08-16)

9 chapitres créés en FR/EN/ES/BR (36 fichiers), en autonomie complète pendant l'absence de Louis, sans agent. `PHP/securite.md` couvrait déjà une bonne partie des sujets de façon non-spécifique à PHP : les nouveaux chapitres y redirigent systématiquement plutôt que de dupliquer.

## Chantier Authentification/variance LLM (2026-08-15)

Convention BR : tout le contenu utilise exclusivement `## O que reter`, jamais la variante emoji. Méthode de vérification retenue avant de déclarer un chantier de traduction terminé : comparer les comptes de fichiers par catégorie/sujet entre langues, pas seulement la qualité de ce qui existe déjà.

## Bug de labels non traduits

`category.label`/`subject.label` viennent du nom de dossier brut (toujours en français, nécessaire au cross-language linking) : rien ne les traduisait à l'affichage. Piège retenu : le `#` d'une page d'intro de subject doit rester littéralement le nom de dossier français pour que `generate-struct.js` la reconnaisse, indépendamment de ce que `tEntityLabel()` affiche désormais.

## Revue de la table de prononciation TTS (2026-08-15)

L'entrée globale `"$": "variable"` matchait aussi `$(...)`/`$((...))` en Bash/Zsh/PowerShell/Git (substitution de commande). Ajouté des clés plus longues et prioritaires par contexte.

3 autres bugs sémantiques trouvés (lectures carrément fausses, pas de simples entrées manquantes) : **C** `"&"` toujours "address of" y compris pour le ET bit à bit -- distingué par espacement (`"& "` vs `"&"`). **C++** même `"&"` toujours "address of" alors que l'usage réel est une référence -- corrigé en "reference". **DSL/SQL** : `sql.md` réutilise `"*"`/`"$"`/`"."` avec un sens différent de `regex.md` -- résolu via `PAGE_SPECIFIC_CONTEXT` routé par `curPageId`.

**Trouvaille plus large** : rien ne traitait les symboles typographiques utilisés directement dans le texte narré (hors code inline). La flèche `→` a deux sens distincts selon le chapitre (plage numérique vs "puis") : vérifié qu'aucun chapitre ne mélange les deux, routé par `curPageId` vers un mot différent par page. Nouvelle fonction `speakableText()`, distincte de `speakableCode()`.

## Séance d'écoute réelle en local (2026-08-15)

Plusieurs allers-retours avec Louis en écoute directe : emoji `📋` retiré du texte synthétisé (gênant à l'oreille). `%`/`*` en C ambigus comme `&` -- même astuce d'espacement. `&` simplifié en "bitwise" (décision explicite de Louis, seulement pour `&`). `XOR` : aller-retour en 3 temps, résolu en respelant `^` en "bitwise XOR" (MAJUSCULES mieux prononcées qu'un mot en minuscules par cette voix). Fluidité de lecture pour du code trivial : un span `code` inchangé par `speakableCode()` rejoint désormais le buffer de la phrase au lieu de forcer un changement de voix.

## Bug TTS : mauvaise voix sur contenu BR

`document.documentElement.lang` recevait le code interne brut `"br"`, pas une balise BCP-47 valide (`"br"` = breton en ISO 639-1) : aucune voix portugais-brésilien trouvée. Corrigé par une table de correspondance `br` → `pt-BR` dans `js/lang.js`.

## Chantier OCR/vision + restructuration IA (2026-08-13)

Piège structurel retenu (`scripts/generate-struct.js:151-166`) : une catégorie est soit 100% plate, soit 100% en subjects ; un fichier resté à plat une fois un sous-dossier créé est silencieusement ignoré. Bug du validateur de liens : un lien "racine de catégorie" n'était jamais vérifié avant que `&p=` soit rendu optionnel.

## Avant le 2026-08-13

Voir `audit-zero-connaissance.md` pour l'historique du plan de réécriture zéro-connaissance (terminé) et le bug camelCase (fichiers renommés en kebab-case le 2026-08-07).
