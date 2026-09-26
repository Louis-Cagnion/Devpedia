# TODO : Devpedia

> Prochaine tâche : points 22 à 24 dans l'ordre, rédaction autonome demandée par Louis le 26/09 (points 4, 5 et 6 laissés à Louis), audio du point 3 au fil de l'eau ; reste aussi un test navigateur en attente de Louis (point 1) et l'audio de la section IA > Modèles de décision structurée (point 2).

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

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
- `Fondamentaux/Algorithmes/solveurs-sat-et-cdcl` (nouveau, sous-sections des queues lourdes comprises), et le renvoi fusionné de `backtracking-et-satisfaction-de-contraintes`.
- `Fondamentaux/Algorithmes/encodages-sat` (nouveau, sections Tseitin, clauses implicites et propagateurs comprises).
- `Fondamentaux/Mathématiques/combinatoire-des-permutations` (nouveau), et la ligne `O(n!)` et le renvoi vers les problèmes NP-complets ajoutés à `Fondamentaux/Algorithmes/complexite-et-notation-big-o`.
- `Fondamentaux/Mathématiques/carres-latins-et-tirage-uniforme` (nouveau), et le renvoi ajouté à `les-probabilites-de-base`.
- `Langages/C/threads` (sections opérations atomiques et `_Thread_local`).
- `Langages/C/operateurs-binaires` (section fonctions intégrées `__builtin_popcount`/`__builtin_ctz`).
- `Langages/C/mesure-du-temps` (section `clock_gettime(CLOCK_MONOTONIC)`).
- `Langages/C/compilation` (section `-march=native` et `-pthread`).
- `Langages/C/memoire` (sections arène et `memcpy`/`memset`, et en anglais le tableau des quatre bugs mémoire).
- `Fondamentaux/Algorithmes/file-de-priorite-et-tas-binaire` (nouveau).
- `Qualité, performance et outils/Performance/mesurer-avant-d-optimiser` (profileurs natifs, piège de gprof sur les fonctions intégrées ou copiées, compteurs déterministes, programmes limités par la mémoire, portfolio et biais du jeu de test).
- `Langages/Python/sous-processus-et-flux-standard` (section `timeout` et `ThreadPoolExecutor`).
- `Fondamentaux/Algorithmes/backtracking-et-satisfaction-de-contraintes` (section sur quoi brancher).
- `Langages/PHP/routage` (notes `parse_url()` qui renvoie `null` et point final CWE-42).
- `Sécurité/Cybersécurité/failles-de-navigateur` (`Referrer-Policy`, CWE-598 et `autocomplete`) : en français seulement, le chapitre n'existant pas encore dans les autres langues (point 24).
- `Qualité, performance et outils/Qualité et architecture du code/robustesse-traitement-par-lots` (section valider avant de détruire).
- `Fondamentaux/Algorithmes/problemes-np-complets` (nouveau).
- `Tests/property-based-testing` (section test différentiel).
- `Qualité, performance et outils/Performance/cache-cpu-et-simd` (sections accès aléatoires, AoS/SoA, filtre par bitmap, écritures inutiles, TLB et pages géantes).

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

## 22. Heuristiques et mécanismes avancés d'un solveur CDCL (rush01, `research/cdcl.c`)
Complète `Fondamentaux/Algorithmes/solveurs-sat-et-cdcl` : VMTF n'y est défini qu'en une phrase (tableau du portfolio hétérogène) ; 0 résultat pour « move-to-front », « retour arrière chronologique », « simplification à la racine ». Rubrique pressentie : `Fondamentaux/Algorithmes/solveurs-sat-et-cdcl`.
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

## 24. Traduire les 4 chapitres de Sécurité > Cybersécurité restés en français
`failles-de-navigateur`, `securite-des-webhooks`, `ssrf-en-detail` et `upload-de-fichiers` (ajoutés le 16/09) n'existent qu'en français et ne sont pas déclarés dans `structure/struct-en.json`, `struct-es.json` et `struct-br.json` : les traduire en en/es/br, puis les déclarer (à la main, sans `buildStruct`, cf. journal de bord).
