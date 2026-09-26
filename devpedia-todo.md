# TODO : Devpedia

> Prochaine tâche : points 15 à 23 dans l'ordre, rédaction autonome demandée par Louis le 26/09 (points 4, 5 et 6 laissés à Louis), audio du point 3 au fil de l'eau ; reste aussi un test navigateur en attente de Louis (point 1) et l'audio de la section IA > Modèles de décision structurée (point 2).

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés ; toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).


## 2. Section IA > Modèles de décision structurée (TypeSafe AI / Jev)
12 chapitres + description écrits, vérifiés factuellement contre https://docs.typesafe.ai et traduits en EN/ES/BR dans `content(-en/-es/-br)/IA/Modèles de décision structurée/` (les 4 `struct*.json` à jour).
- Reste à générer l'audio des 4 langues (une seule passe, sur demande de Louis).

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
- `Fondamentaux/Algorithmes/solveurs-sat-et-cdcl` (nouveau), et le renvoi fusionné de `backtracking-et-satisfaction-de-contraintes`.
- `Fondamentaux/Algorithmes/encodages-sat` (nouveau).
- `Fondamentaux/Mathématiques/combinatoire-des-permutations` (nouveau), et la ligne `O(n!)` ajoutée à `Fondamentaux/Algorithmes/complexite-et-notation-big-o`.
- `Fondamentaux/Mathématiques/carres-latins-et-tirage-uniforme` (nouveau), et le renvoi ajouté à `les-probabilites-de-base`.
- `Langages/C/threads` (sections opérations atomiques et `_Thread_local`).
- `Langages/C/operateurs-binaires` (section fonctions intégrées `__builtin_popcount`/`__builtin_ctz`).
- `Langages/C/mesure-du-temps` (section `clock_gettime(CLOCK_MONOTONIC)`).
- `Langages/C/compilation` (section `-march=native` et `-pthread`).
- `Langages/C/memoire` (sections arène et `memcpy`/`memset`, et en anglais le tableau des quatre bugs mémoire).
- `Fondamentaux/Algorithmes/file-de-priorite-et-tas-binaire` (nouveau).
- `Qualité, performance et outils/Performance/mesurer-avant-d-optimiser` (profileurs natifs, compteurs déterministes, programmes limités par la mémoire, portfolio et biais du jeu de test).

## 4. Accès à distance Windows : RDP, tscon, shadowing (projet scraping_infomediaires)
Absents de `content/` (« bureau à distance », « tscon », « shadow » : 0 résultat ; les 2 occurrences de « RDP » sont sans rapport). Rubrique pressentie : Infrastructure & DevOps > Administration système.
- **RDP (*Remote Desktop Protocol*)** et l'application Connexion Bureau à distance (`mstsc`) : se connecter avec un compte « prend » sa session, qui quitte l'écran principal ; fermer la fenêtre la verrouille.
- **`tscon %sessionname% /dest:console`** : rend la session à la console au lieu de la verrouiller ; demande en général une élévation (lien avec l'UAC, déjà couverte dans le chapitre `windows-services-sessions-et-droits`).
- **Shadowing RDP** (`query session /server:<machine>`, `mstsc /v:<machine> /shadow:<id> /control /noConsentPrompt`) : observer et piloter la session d'un autre compte depuis la sienne, sans la déplacer ni connaître son mot de passe ; prérequis : GPO « Définir des règles pour le contrôle à distance des sessions utilisateur des services Bureau à distance », droit de contrôle à distance accordé aux opérateurs, ouvertures réseau. Tableau comparatif connexion classique + tscon vs shadowing.

## 5. Azure DevOps : agents auto-hébergés (projet scraping_infomediaires)
À compléter dans Infrastructure & DevOps > CI-CD (nouveau chapitre) ; rédaction interrompue le 26/09, à écrire par Louis.
- **Agent auto-hébergé : mode service vs mode interactif** (`config.cmd --unattended --runAsAutoLogon --windowsLogonAccount … --windowsLogonPassword …`, `--overwriteAutoLogon`), plusieurs agents sur une même machine dans des dossiers séparés, rôle du PAT (déjà défini côté GitHub) uniquement à l'enregistrement.

## 6. Navigateur automatisé : headless, captcha, profil persistant, débogage à distance (projet scraping_infomediaires)
À ajouter dans Sécurité > Sécurité offensive (`attaques-navigateur-automatise.md` couvre déjà Playwright, `navigator.webdriver` et le fingerprinting, mais ni « headless », ni « captcha », ni le profil persistant : 0 résultat).
- **Mode headless vs fenêtre réelle** : empreinte différente, plus de vérifications anti-robot ; alternative « fenêtre réelle placée hors écran » (`--window-position=-32000,-32000`) ; zone d'affichage imposée (`viewport` Playwright, ex. 1280 × 1000) indépendante de la résolution de l'écran, qui ne compte que pour l'humain qui regarde la fenêtre.
- **Captcha** : ce que c'est, pourquoi un robot ne le passe pas, levée manuelle par un humain puis réutilisation du déblocage.
- **Profil de navigateur persistant** (`launch_persistent_context(user_data_dir=…)`) : cookies de vérification réutilisés d'un lancement à l'autre ; un déblocage obtenu avec une fenêtre peut ne plus valoir si le navigateur repasse en headless (empreinte différente) ; le chemin du profil dépend du compte qui exécute.
- **Débogage à distance de Chrome** (`--remote-debugging-port`, `chrome://inspect`, *Chrome DevTools Protocol*) : voir et piloter une page d'un Chrome sans bureau ; risque (contrôle total du navigateur, à n'exposer que sur `localhost`).
- **Tunnel SSH / redirection de port** (`ssh -L`) : atteindre un port distant limité à `localhost` sans l'ouvrir au réseau (rubrique Réseaux ; 0 résultat pour « tunnel SSH » / « redirection de port »).

## 15. Python : lancer et chronométrer des programmes externes en parallèle (rush01, `research/bench.py`)
`sous-processus-et-flux-standard.md` couvre `subprocess.run` et `capture_output`, `parallelisme.md` couvre `multiprocessing.Pool` ; 0 résultat pour « TimeoutExpired », « ThreadPoolExecutor », « concurrent.futures ». Rubrique pressentie : Langages > Python.
- **`subprocess.run(..., timeout=...)` et `subprocess.TimeoutExpired`** : arrêter un programme qui dépasse son budget de temps.
- **`concurrent.futures.ThreadPoolExecutor`** : des threads suffisent quand le vrai travail tourne dans des processus externes (le GIL ne gêne pas) ; `executor.map` conserve l'ordre des résultats.

## 16. Granularité du branchement dans un CSP (rush01, `research/lines2/src/s_backtracking_lines.c`)
`backtracking-et-satisfaction-de-contraintes.md` présente MRV (*first-fail*) mais pas le choix de ce sur quoi on branche. Rubrique pressentie : compléter ce même chapitre.
- **Brancher sur une variable à petit domaine (une case, au plus n valeurs) plutôt que sur une contrainte entière (une ligne, des milliers de permutations candidates)** : chaque échec élimine d'un coup toute une famille de candidats au lieu d'un seul. Mesuré : le pire seed passe de 55 s à 0,14 s de recherche.

## 17. Deuxième run crash-test : chemins Windows, en-têtes HTTP, autofill navigateur, ordre validation/destruction (crash-test projet poc-borne-git)
Notions du second run de crash-test (bugs #23-30), absentes des chapitres existants malgré des sujets voisins déjà couverts.
- **CWE-42 *Path Equivalence: 'filename.' (Trailing Dot)*** : à ajouter dans `routage.md`, juste après la note existante sur `realpath()`/remontée de répertoire (0 résultat pour « trailing dot » / « CWE-42 »). Windows ignore silencieusement un point ou un espace final dans un nom de fichier (`secrets.php.` et `secrets.php` désignent le même fichier pour le filesystem), alors qu'une comparaison de chaîne stricte (blocklist, extension autorisée...) les traite comme différents : un contrôle d'accès qui compare la chaîne brute avant résolution filesystem peut ainsi être contourné par un simple point ajouté en fin d'URL. Parade : comparer après résolution du chemin réel (`realpath()`) ou après un `rtrim($chemin, '. ')` explicite, jamais sur la chaîne brute.
- **`parse_url()` peut renvoyer `null`** : à ajouter dans `routage.md`, à la suite de l'usage de `parse_url(..., PHP_URL_PATH)` déjà montré (0 résultat pour ce cas). Sur une URI malformée (ex. `//chemin`, double slash initial), `parse_url()` renvoie `null` plutôt qu'une chaîne. Passer ce `null` à une fonction interne dont le paramètre attend `string` (ex. `trim()`) déclenche un `Deprecated` en PHP 8.1+ (passage silencieusement toléré aujourd'hui, deviendra une erreur fatale `TypeError` dans une future version majeure). Parade : caster explicitement en `(string)` avant l'appel plutôt que de faire confiance à la valeur de retour.
- **En-tête `Referrer-Policy` et CWE-598 (donnée sensible en query string)** : à ajouter dans `failles-de-navigateur.md`, dans le tableau des en-têtes de sécurité existant (aux côtés de `Content-Security-Policy`/`X-Frame-Options`, 0 résultat pour « Referrer-Policy »). Par défaut, un navigateur inclut l'URL complète de la page courante (query string comprise) dans l'en-tête `Referer` envoyé à tout lien externe ou ressource tierce chargée sur cette page (police, image, script). Si un token/identifiant sensible transite en query string (`?t=jeton`), il fuit ainsi vers n'importe quel domaine tiers référencé sur la page. Parade : `Referrer-Policy: strict-origin-when-cross-origin` (ou plus strict), qui tronque ou supprime le `Referer` envoyé hors du propre domaine.
- **`autocomplete="off"` sur des champs PII, appareil partagé (kiosk/borne)** : à ajouter dans `failles-de-navigateur.md` (0 résultat pour « autocomplete »). Un champ de formulaire HTML mémorisé par le navigateur (`autocomplete` actif par défaut sur des types reconnus comme `name`/`tel`/`email`) est re-suggéré à la prochaine saisie sur le même navigateur : anodin sur un poste personnel, mais sur un appareil partagé par plusieurs utilisateurs successifs (borne, tablette en libre accès), cela fait fuiter les coordonnées d'un client vers l'écran du suivant. Parade : `autocomplete="off"` explicitement sur tout champ collectant une donnée personnelle dans ce contexte d'appareil partagé.
- **Opération destructive avant validation de son remplacement** : notion générale de fiabilité (pas un mécanisme de langage précis), pressentie pour `logique-metier-et-automatisation.md` ou une nouvelle entrée dans les fondamentaux Sécurité (0 résultat pour cette formulation ni équivalent proche). Motif à risque : un traitement qui supprime/remplace un état existant (ex. vider un index de recherche avant de le repeupler) sans avoir d'abord validé que la nouvelle donnée est exploitable : un remplacement raté ou vide écrase alors un état valide par un état cassé ou vide, avec un message de succès trompeur si l'échec de validation n'est pas distingué d'un résultat légitimement vide. Bonne pratique : valider intégralement la nouvelle donnée AVANT toute opération destructive sur l'ancienne (jamais l'inverse), et distinguer explicitement « résultat vide légitime » de « échec de validation ».

## 18. Pourquoi un problème « exponentiel » se résout quand même : NP-complétude, pire cas vs cas typique (rush01, exploration performance)
Question de Louis à l'origine : comment un solveur dépasse une recherche qu'on croyait bloquée par la factorielle des possibilités. `complexite-et-notation-big-o.md` ne cite le pire cas et le cas moyen qu'en une note ; 0 résultat pour « NP-complet », « NP-difficile », « transition de phase », « quasigroup ». Rubrique pressentie : Fondamentaux > Algorithmes (nouveau chapitre `problemes-np-complets.md`, renvoi depuis le chapitre Big O).
- **Classes P et NP, NP-complétude** (Cook 1971, Karp 1972) : vérifier une solution est rapide, en trouver une n'a pas d'algorithme polynomial connu ; SAT est le premier problème NP-complet, compléter un carré latin partiel l'est aussi (Colbourn 1984). NP-complet décrit le pire cas, pas les instances qu'on rencontre.
- **Taille de l'espace vs espace exploré** : une grille 72×72 a un espace brut de (72!)^72 ≈ 10^7472 remplissages ligne par ligne, résolu ici en environ 2 millions de décisions, parce que propagation et clauses apprises éliminent des familles entières de candidats à chaque étape.
- **Transitions de phase** (Cheeseman, Kanefsky & Taylor 1991 ; Mitchell, Selman & Levesque 1992) : les instances aléatoires difficiles se concentrent près du seuil où la probabilité d'avoir une solution passe de 1 à 0 ; loin du seuil (trop ou trop peu contraintes), elles sont faciles. Complétion de carré latin : pic de difficulté vers 42 % de cases pré-remplies (Gomes & Selman 1997).
- **Théorème des mariages de Hall (1935) et rectangles latins** : k lignes complètes d'un carré latin se complètent toujours en carré entier (M. Hall 1945), alors que des trous éparpillés peuvent ne plus avoir de solution. C'est le blocage observé : 56 cases indécises réparties sur 7 lignes, à 99,8 % des variables affectées, pendant plus d'une minute.

## 19. Randomisation contre les queues lourdes : ce qui marche et ce qui casse (rush01, `research/cdcl.c`)
Complète la section « Les queues lourdes » de `Fondamentaux/Algorithmes/solveurs-sat-et-cdcl` par la méthode et les mesures : 0 résultat pour « random_var », « redémarrages aléatoires ». Rubrique pressentie : `Fondamentaux/Algorithmes/solveurs-sat-et-cdcl`.
- **Décisions aléatoires** (`random_var_freq` de MiniSat) : à n=72, 3 % de décisions tirées au hasard résolvent les 4 seeds qui bloquaient au-delà de 90 s, mais sur les 100 seeds, 8 autres bloquent à leur tour (4 sans randomisation). Un même seed passe ou bloque selon la graine : la queue lourde tient à la trajectoire, pas à l'instance, et la randomisation seule la déplace sans la réduire.
- **Biais de sélection dans l'évaluation d'une heuristique** (régression vers la moyenne) : tester une variante sur les seuls cas difficiles de la configuration de référence la favorise mécaniquement, puisque ces cas ont été retenus pour leur malchance avec la référence ; toujours revalider sur l'ensemble complet. Vécu ici : 8 seeds choisis, tout résolu ; 100 seeds, deux fois plus de dépassements.
- **Diversifier sans détruire l'apprentissage** : bruit sur les activités à chaque redémarrage ou retour aux phases initiales font bloquer même les seeds faciles ; la diversification doit porter sur quelques décisions, pas effacer ce que le solveur a appris.
- **Remède classique : multiplier les trajectoires indépendantes** (portfolio de processus, redémarrages complets avec une nouvelle graine) : si chaque exécution bloque avec une probabilité p indépendante, k exécutions bloquent toutes avec p^k. Mesuré à n=72 sur 100 seeds : 4 processus (`fork`, résultat du premier par tube et `poll`) passent de 7 dépassements de 90 s à aucun (moyenne 9,6 s, pire 16,8 s), là où une réinitialisation complète périodique en un seul processus n'en retire que 3. Gomes, Selman & Kautz, *Boosting Combinatorial Search Through Randomization* (AAAI 1998), mesurés justement sur la complétion de carrés latins.
- **Portfolio hétérogène** : diversifier aussi les heuristiques, pas seulement les graines. Mesuré à n=96 : 4 processus VSIDS, 67 s ; 1 VSIDS + 3 VMTF, 32 s (les VMTF gagnent en 25 000 à 30 000 conflits, très réguliers). Frontière d'une minute passée de n=72 (avec 4 % de blocages) à environ n=100.
- **Rendements décroissants d'un portfolio** : au-delà de 4 à 6 processus, la bande passante mémoire partagée ralentit chacun plus que la diversité ne rapporte (8 processus plus lents que 6). Le partage de clauses apprises entre processus (ManySAT, Hamadi, Jabbour & Sais 2009) n'aide que si les clauses apprises sont courtes : ici, 2 à 7 unitaires par résolution, sans intérêt.

## 20. Contraintes implicites, variables auxiliaires et propagateurs dans un solveur SAT (rush01, `research/cdcl.c`)
0 résultat pour « Tseitin », « variables auxiliaires », « propagateur », « lazy clause », « test différentiel ». Rubrique pressentie : `Fondamentaux/Algorithmes/encodages-sat`, et Qualité > Tests pour le test différentiel.
- **Variables auxiliaires définitionnelles** (transformation de Tseitin, 1968) : nommer une sous-formule par une variable (ici « maximum du préfixe ≥ v », « tour i visible ») pour garder un encodage de taille polynomiale ; 68 % des variables de l'encodage n=72.
- **Clauses implicites** : ne pas stocker les clauses à structure régulière mais les retrouver par calcul d'indices au moment de propager ; la raison d'une déduction se code sur 32 bits (famille de clause + variable d'ancrage) et se reconstruit à l'analyse du conflit. Mesuré : ×1,5 en vitesse, mémoire 674 → 263 Mo à n=72.
- **Propagateurs et génération paresseuse de clauses** (*Lazy Clause Generation*, Ohrimenko, Stuckey & Codish 2009) : une contrainte globale propagée par du code dédié, qui ne produit sa clause d'explication que lorsque l'analyse de conflit la demande ; base des solveurs hybrides (Chuffed, OR-Tools CP-SAT).
- **Test différentiel** : valider une réécriture en comparant ses résultats à l'ancienne implémentation sur beaucoup d'entrées (ici : ensemble exact des clauses retirées vs énumérées, puis accord « solution / pas de solution » sur 700 grilles).

## 21. Optimiser un programme limité par la latence mémoire (rush01, `research/cdcl.c`)
Complète `cache-cpu-et-simd.md` (ligne de cache, contiguïté) : 0 résultat pour « bitmap », « bitset », « tableau de structures », « structure de tableaux », « défaut de cache ». Rubrique pressentie : Qualité, performance et outils > Performance.
- **Compter les accès mémoire aléatoires, pas les instructions** : diviser par 2,5 le nombre de littéraux parcourus (recherche circulaire du remplaçant, Gent 2013) n'a pas changé le temps, alors que supprimer un seul accès aléatoire par propagation a donné −21 %.
- **Tableau de structures vs structure de tableaux** (*AoS/SoA*) : ranger ensemble ce qui est écrit ensemble (raison et niveau d'une variable) pour toucher une ligne de cache au lieu de deux : −7 %.
- **Filtre par bitmap** : un bit par élément (575 Ko, tient dans le cache L2) dit s'il y a quelque chose à lire avant de charger un en-tête dans un tableau de 147 Mo ; 91 % des lectures évitées.
- **N'écrire que ce qui sera relu** : phase et tas mis à jour pour les seules variables décidables.
- **Prouver qu'une optimisation ne change pas le calcul** : compteurs de travail (conflits, propagations) strictement identiques avant et après, seul le temps varie.
- **TLB et pages géantes** : la TLB met en cache la traduction adresse virtuelle → physique ; avec des pages de 4 Ko, des accès aléatoires sur des centaines de Mo la débordent sans cesse. Pages géantes transparentes de 2 Mo (THP, modes `always`/`madvise`/`never` dans `/sys/kernel/mm/transparent_hugepage/enabled`), demandées par `madvise(MADV_HUGEPAGE)` ou `GLIBC_TUNABLES=glibc.malloc.hugetlb=1` : −5 % ici en processus seul, gain qui dépend de la dispersion des accès. 0 résultat pour « TLB », « madvise », « pages géantes ».
- **Piège de gprof** : le temps d'une fonction intégrée par le compilateur (*inlining*) peut être crédité à une autre (`now()` à 11 % au lieu de `cancel_until`) ; vérifier dans le graphe d'appels (`gprof -q`).

## 22. Heuristiques et mécanismes avancés d'un solveur CDCL (rush01, `research/cdcl.c`)
Complète `Fondamentaux/Algorithmes/solveurs-sat-et-cdcl` : 0 résultat pour « VMTF », « move-to-front », « retour arrière chronologique », « simplification à la racine ». Rubrique pressentie : `Fondamentaux/Algorithmes/solveurs-sat-et-cdcl`.
- **Branchement restreint** (*restricted branching*) : ne décider que certaines variables (ici « case ≥ v ») et laisser les autres découler de la propagation ; a supprimé la queue lourde à n=56-64 (7,9 s de moyenne au lieu de 27 s avec un seed au-delà de 90 s).
- **VMTF** (*Variable Move-To-Front*, Ryan 2004, mode « focused » de kissat et CaDiCaL) : file doublement chaînée avec horodatages, les variables du dernier conflit passent en tête ; alternative à VSIDS sans tas binaire.
- **Retour arrière chronologique** (Nadel & Ryvchin, SAT 2018) et **réutilisation de la trace** (van der Tak, Ramos & Heule 2011) : éviter de refaire des dizaines de décisions après un saut ; tous deux pires ici, testés via kissat.
- **Phases cibles, rephasing et shrinking** (kissat, Biere 2020) : testés, pires sur cet encodage.
- **Simplification à la racine** : retirer les clauses déjà satisfaites au niveau 0 (MiniSat `simplify`) ; 22 % des implications binaires mortes à n=72.

## 23. Processus orphelins : tuer un programme ne tue pas ses fils (rush01, `research/cdcl.c`, `research/bench.py`)
`processus.md` couvre `fork`/`waitpid`/zombies et `architecture-dun-shell.md` définit le groupe de processus (`setpgid`), mais 0 résultat pour « PDEATHSIG », « prctl », « killpg », « start_new_session », et « orphelin » n'apparaît que pour des lignes SQL. Rubrique pressentie : Langages > C > `processus.md`, renvoi depuis `sous-processus-et-flux-standard.md` (Python).
- **Orphelin** : un fils dont le parent meurt continue de tourner, réadopté par `init`/`systemd`. Vécu : un délai de 90 s tuait le parent d'un portfolio, ses 4 fils tournaient encore 30 minutes, chargeaient la machine et faussaient toutes les mesures suivantes.
- **Côté fils** : `prctl(PR_SET_PDEATHSIG, SIGKILL)` (Linux) demande au noyau de le tuer à la mort du parent ; vérifier ensuite `getppid()` couvre le cas où le parent est mort avant l'appel.
- **Côté lanceur** : démarrer le programme dans son propre groupe de processus (`setsid`, `start_new_session=True` en Python) et tuer tout le groupe au dépassement (`os.killpg(pid, SIGKILL)`), au lieu du seul processus lancé.
- **Piège du nom de processus** : un programme qui se relance via `execv("/proc/self/exe", ...)` s'appelle ensuite `exe` dans `ps`/`pgrep` ; un orphelin a ainsi été pris pour une application de l'utilisateur. Relancer par le chemin réel (`readlink("/proc/self/exe")`).
