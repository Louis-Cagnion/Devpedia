# Arbre : chapitres du todo (chapitres commités 30/45, audio complet 22/45)

Statuts : [ ] à faire, [~] en cours, [x] faite, [v] validée (commitée, audio des 4 langues généré), [!] bloquée, [>] reportée.
Arbre validé par Louis le 28/10/2026 (lancement des 3 Haiku de traduction par chapitre compris).
Prochaine feuille : relecture terme par terme des 17 FR (agents `analyst`, un par chapitre, lecture seule) puis corrections ciblées, revue des faits Drupal, intégration des worktrees, anonymisation du FR, audio.
Fenêtre de travail des agents fixée par Louis le 31/10/2026 : lancements jusqu'à 12h20, arrêt des agents encore actifs à cette heure, chapitres complets récupérés.
Moniteur : claude-sonnet-5-5, effort high (`modelSettings` de `settings.json`, `CLAUDE_CODE_EFFORT_LEVEL` non défini), réévalué à la clôture du premier chapitre. Chapitres de faits spécialisés (Drupal, NCM, ft_linux) : revue `analyst` d'un niveau supérieur au moniteur entre a et b.
Une seule rédaction FR à la fois, traductions Haiku par trio, un seul audio à la fois. Autorisé par Louis le 28/10/2026 : pendant qu'un trio Haiku traduit le chapitre N, un builder rédige déjà le FR du chapitre N+1 (jamais deux rédacteurs FR en même temps) ; commit dès les 4 langues relues.
Échéance du 28/10/2026 (tout commité avant 17h) : dépassée à la reprise du 29/10/2026 (18h56), Louis ne l'a pas rappelée.

Vagues décidées par Louis le 31/10/2026 (remplacent « une seule rédaction FR à la fois ») : vague 1 de 9 rédacteurs sonnet/high (C27, C28, C29, C31, C32, C33, C36, C37, C38), puis vague 2 de 8 (C35, C39 à C45). Dès qu'un FR est rendu, ses 3 traducteurs haiku/medium partent aussitôt ; la relecture du moniteur (b) et la revue `analyst` des chapitres de faits tournent en parallèle ; tout écart se corrige par un agent dédié à un chapitre et une langue ; audio de tous les chapitres manquants à la fin, un seul job à la fois. Un worktree par chapitre (`.claude/worktrees/<ID>`, branche `agent/<ID>`, sans `audio/`), partagé par son rédacteur et ses traducteurs (fichiers distincts) ; `structure/` modifiée par le moniteur seul, sur `main`, après fusion.

| ID | Fichier FR | order |
|---|---|---|
| C27 | `Infrastructure & DevOps/Serveurs web/serveurs-web.md` (page de sous-section) | 9 |
| C28 | `Serveurs web/codes-de-statut-et-en-tetes-de-controle.md` | 1 |
| C29 | `Serveurs web/proxy-inverse-et-limitation-de-debit.md` | 2 |
| C31 | sections ajoutées à `Langages/Domain-specific Languages (DSL)/sql.md` | inchangé |
| C32 | `Données/Bases de données/lire-une-base-avec-ssms.md` | 13 |
| C33 | `Infrastructure & DevOps/Administration système/qemu-kvm-et-disques-qcow2.md` | 11 |
| C35 | `IA/NLP et LLM/generation-parallele-de-texte.md` | 11 |
| C36 | `Langages/PHP/afficher-une-entite.md` | 17 |
| C37 | `Conception à grande échelle/un-code-plusieurs-sites.md` | 6 |
| C38 | `Conception à grande échelle/repliquer-un-referentiel-vers-des-satellites.md` | 7 |
| C39 | `Infrastructure & DevOps/Automatisation/file-d-attente-worker-et-verrou.md` | 6 |
| C40 | `Qualité, performance et outils/Performance/metadonnees-de-cache-et-invalidation.md` | 12 |
| C41 | `Performance/chargement-differe-et-espace-reserve.md` | 13 |
| C42 | `Performance/redimensionner-des-images-et-servir-du-webp.md` | 14 |
| C43 | `Sécurité/Cybersécurité/desactiver-la-verification-tls.md` | 23 |
| C44 | `Cybersécurité/authentification-http-basic-et-ressource-rest.md` | 24 |
| C45 | `Cybersécurité/donnees-personnelles-dans-les-journaux.md` | 25 |

État à l'arrêt du 01/11/2026 : les 17 chapitres sont rédigés en FR et traduits en EN, ES, BR (51 traductions), les huit corrections de fond sont faites en 4 langues, aucun agent en cours. Rien n'est commité ni fusionné : tout vit dans `.claude/worktrees/<ID>` (C27, C28, C29, C31, C32, C33, C35 à C45), branches `agent/<ID>` sans commit, plafond de 20 agents simultanés.
- Briefs et faits : `scratchpad/brief-fr.md`, `brief-tr.md`, `faits-C<ID>.md`, script `verif-chapitre.sh` (variable `REPO`), dans `/tmp/claude-1000/-home-sung-jinwoo-Bureau-code-JavaScript-Devpedia/49910c88-5923-4094-ab76-e4cf5d43a8fb/scratchpad/`.
- Reprises à faire (huit chapitres corrigés en 4 langues le 01/11/2026, comptes croisés identiques) : `sql.md` EN, ES, BR : liens internes manquants par rapport au FR (13 liens FR, 9 EN, 11 ES, 11 BR : regex, mémoire C, PHP) et slugs historiques `langages-de-programmation` du FR à passer en `langages` ; parenthèse « 26B A4B » de C35 (taille totale et active) recoupée seulement par des sites secondaires, à confirmer sur la fiche Google ou à retirer.
- À arbitrer : noms d'exemple traduits différemment d'une langue à l'autre (ports du laboratoire de C43 par langue : FR 7231, EN 7241, ES 7251, BR 7261 ; dossier `tls-lab` et journaux `log-a*.txt` en EN ; dossier `caché/` avec accent en ES pour C42 ; `deposer_taches.py` traduit en `depositar_tareas.py` en ES seulement ; fichiers PHP de C36, modules Python de C39 et C45, `mdp` du motif de masquage de C45, dossier `caché/` de C42, `boutique`/`tienda`/`loja` de C37, libellé `Trampas que evitar` contre `Trampas a evitar`) ; identifiants mixtes dans `sql.md` en EN, ES, BR.
- Ensuite : relecture terme par terme des 17 FR ; revue `analyst` des faits Drupal (C36 à C45) ; liens entre chapitres frères (C27/C28/C29, C37/C38, C40/C41/C42, C43/C44/C45) ; commit et fusion de chaque worktree dans `main` ; entrées `structure/struct*.json` ; contrôle complet du FR pour anonymiser toute référence à l'entreprise (exemples fictifs, termes à chercher donnés par Louis, décision du 01/11/2026 ; scan du FR seul, chaque modification répercutée en EN, ES, BR sans nouveau scan), une fois tous les chapitres terminés et avant tout audio ; audio de tous les chapitres manquants, un seul job à la fois ; ancres de `sql.md` à double tiret, noms de bases réels `base_*` dans `sql.md`.
- Relecture terme par terme des 17 FR faite le 01/11/2026 (17 `analyst` sonnet/high en lecture seule, aucun fichier modifié) : rapports dans `/home/sung-jinwoo/.claude/projects/-home-sung-jinwoo-Bureau-code-JavaScript-Devpedia/reprise-c27-c45/rapports/C<ID>.md`. Totaux P1/P2/P3 : C27 3/17/10, C28 2/15/5, C29 1/20/8, C31 2/10/10, C32 1/16/10, C33 4/22/9, C35 5/15/6, C36 1/14/8, C37 1/16/5, C38 1/11/6, C39 2/16/6, C40 6/18/6, C41 3/14/6, C42 2/21/5, C43 2/21/7, C44 2/21/9, C45 3/23/10. Prochaine étape : corrections ciblées FR (P1 puis P2, P3 si peu coûteux), un `sonnet/medium` à la fois, chaque correction répercutée en EN, ES, BR. Décisions de Louis du 01/11/2026 : purge de l'historique Git pour `base_*` (anonymiser `sql.md` puis réécrire l'historique, en dernier, confirmation juste avant le push forcé) ; parenthèse « 26B A4B » de C35 à confirmer sur la fiche Google (la fiche lue par l'analyste donne 25,2 G au total et 3,8 G actifs).
- Corrections (état du 01/11/2026, arrêt demandé par Louis) : corrigés en FR par des `sonnet/medium` (autorisés par Louis le 01/11/2026, puis suspendus à son départ : « pas maintenant », sans exclure le modèle) : C27, C28, C29, C31, C32, C33, C35, C36, C37, C38, C39, C40, C41, C42 (14/17). Traduits en EN, ES, BR (`haiku/medium`) et contrôlés par le moniteur (mêmes nombres de titres, blocs, tableaux et liens que le FR, aucune ligne de code au-dessus de 95 caractères, y compris les blocs `text`, aucun tiret cadratin, aucun `base_`, aucun dossier parasite) : C27 à C42 sauf C30 et C34 (14/17). Reste à corriger en FR : C43 (le sonnet lancé a été arrêté avant toute écriture : fichier FR intact), C44, C45, d'après leurs rapports du scratchpad ; choisir à la reprise un modèle adapté à la tâche (consigne de Louis du 01/11/2026 : suspendre les correcteurs pour l'instant, sans exclure sonnet). Rien n'est commité ni fusionné. Restes : sorties SQL Server de C31 écrites à la main (à rejouer sur un vrai SQL Server), syntaxe nginx de C29 non passée dans `nginx -t`, liens de C27/C28/C29 vers leurs frères valides seulement après fusion, faits Drupal à revoir (C36 à C45). Briefs : `/home/sung-jinwoo/.claude/projects/-home-sung-jinwoo-Bureau-code-JavaScript-Devpedia/reprise-c27-c45/brief-correction.md`, `brief-traduction-sync.md`, listes `/home/sung-jinwoo/.claude/projects/-home-sung-jinwoo-Bureau-code-JavaScript-Devpedia/reprise-c27-c45/corrections/C<ID>.md` (copie locale hors dépôt, non versionnée : elle contient les rapports de relecture).
- Erreurs de fond relevées à ne pas manquer : octet défini comme « plus petite unité » (C42, C44) ; `verify=`/`--cacert` qui remplacent et n'ajoutent pas (C43) ; PSNR plafonné à 255 (C42) ; tableau Sudoku décalé, poids publiés sur Hugging Face, vitesse sur la fiche, points ELO mêlés aux points de pourcentage (C35) ; `Content-Length` trop petit tronque le corps (C28) ; `backupCount` compte des fichiers et `setLevel` manquant (C45) ; double échappement `echapper` + `textContent` (C41) ; sorties SQLite données pour SQL Server (C31) ; test d'isolation sur une table inexistante (C37) ; `max-age=0` et « presque tous » (C40) ; `0 == "abc"` faux en PHP 8 (C36) ; `-drive` avant `qemu-img create` (C33) ; attentes 10/20/40 s avec `MAX_ESSAIS = 3` (C39). Faits Drupal à vérifier sur la doc officielle : `#[RestResource]`/`@RestResource` (C44), `#[QueueWorker]` depuis Drupal 10.3 environ (C39), clés de `$databases` (C37), `invalidateTags` et `node_list` (C40).

## Pipeline d'un chapitre (un seul à la fois, audio compris avant le suivant)

| Feuille | Rôle | Niveau pressenti | Livrable |
|---|---|---|---|
| a | builder | sonnet/high | chapitre FR (`content/`), plan zéro-connaissance |
| b | moniteur | n/a | relecture terme par terme, tirets cadratins, accents, jargon défini sur place |
| c | builder x3 (EN, ES, BR) | haiku/medium, simultanés | traductions sous `content-en/`, `content-es/`, `content-br/` |
| d | moniteur | n/a | contrôles croisés des 4 langues, `generate-struct.js`, audio fr/en/es/br, todo et commit |

Une feuille c revue en échec monte à sonnet/medium. Une notion spécialisée (Drupal) ajoute une revue `analyst` des faits entre a et b.

## Chapitres

| ID | Chapitre (dossier de `content/`) | Source du todo | Statut |
|---|---|---|---|
| C00 | Audio en, es, br de `graphemes-et-decoupage-de-texte` | point 2 | [v] |
| C01 | SVG dans la page (`Langages/HTML/`) | point 2 | [v] |
| C02 | API de page : `matchMedia`, `scrollIntoView`, `visibilitychange`, `AbortController` (`Langages/JavaScript/`) | point 2 | [v] |
| C03 | Événements pointeur et chargement des polices (`Langages/JavaScript/`) | point 2 | [v] |
| C04 | Unités et fonctions de taille, police à 200 et 300 % (`Langages/CSS/`) | point 2 | [v] |
| C05 | Tester une interface dans un navigateur sans fenêtre (`Tests/`) | point 2 | [v] |
| C06 | `node:test` (`Tests/`) | point 2 | [x] |
| C07 | `constexpr` et constantes (`Langages/C++/`) | point 3 | [v] |
| C08 | Boucle de jeu avec SFML (`Fondamentaux/Graphisme/`) | point 3 | [v] |
| C09 | Inversion de contrôle et points d'extension : hooks, événements, dépendance optionnelle (`Qualité, performance et outils/Qualité et architecture du code/`) | point 4 | [x] |
| C10 | Le conteneur de services (`Qualité et architecture du code/`) | point 4 | [x] |
| C11 | L'architecture à plugins (`Qualité et architecture du code/`) | point 4 | [x] |
| C12 | Machine à états applicative (`Qualité et architecture du code/`) | point 4 | [x] |
| C13 | Cycle de vie d'une entité, schéma par code, champ calculé (`Données/Bases de données/`) | point 4 | [x] |
| C14 | Migrations de données sûres (`Données/Bases de données/`) | point 4 | [x] |
| C15 | Alias d'adresse, redirection 301, conversion de paramètre de route (`Langages/PHP/`) | point 4 | [x] |
| C16 | Appel système interrompu (`EINTR`) (`Langages/C/appel-systeme-interrompu-eintr.md`, `order: 29`) | point 5 | [v] |
| C17 | Filtrage sur place à deux pointeurs (`Langages/C/filtrage-sur-place-deux-pointeurs.md`, `order: 30`) | point 5 | [v] |
| C18 | `offsetof` et littéral composé (`Langages/C/offsetof-et-litteral-compose.md`, `order: 31`) | point 5 | [v] |
| C19 | Tri puis balayage (`Fondamentaux/Algorithmes/tri-puis-balayage.md`, `order: 13`) | point 5 | [v] |
| C20 | Précision des `float` loin de l'origine (`Données/Représentation des données/flottants-loin-de-l-origine.md`, `order: 10`) | point 5 | [v] |
| C21 | GLSL : `flat`, bruit de valeur et hash de shader | point 5 | [v] |
| C22 | Beer-Lambert et Euler semi-implicite (sections ajoutées à `effets-de-rendu-et-interaction-3d.md`) | point 5 | [v] |
| C23 | Blocage de cardan et rotation incrémentale | point 5 | [v] |
| C24 | Liens de l'introduction de la Cybersécurité vers les chapitres cités (9 liens, 4 langues) | cybersécurité | [v] |
| C25 | Signaler une faille trouvée sur un site : légalité et divulgation responsable | cybersécurité | [v] |
| C26 | Mots de passe : bonnes pratiques côté utilisateur et côté site | cybersécurité | [v] |
| C27 | Serveurs web : rôle et fonctionnement (nouvelle sous-section) | serveurs web | [ ] |
| C28 | Serveurs web : codes de statut et en-têtes de contrôle (`Retry-After`) | serveurs web | [ ] |
| C29 | Serveurs web : proxy inverse et limitation de débit | serveurs web | [ ] |
| C30 | Alias PowerShell, des simples aux complexes (`Langages/PowerShell/alias-et-raccourcis-de-commandes.md`, `order: 14`) | powershell | [v] ; C30.f1 `Langages/Bash/alias-avances.md` (`order: 16`) [v] ; C30.f2 `Langages/Zsh/alias-avances.md` (`order: 8`) [v] ; liens vers les deux posés dans la section « Et dans Bash et Zsh ? » du chapitre PowerShell (4 langues) |
| C31 | SQL pour un premier contact : lire des lignes, types de colonne, variable de table (sections de `Langages/Domain-specific Languages (DSL)/sql.md`) | point 7 | [ ] |
| C32 | Lire une base avec SSMS (`Infrastructure & DevOps/` ou `Outils/`) | point 7 | [ ] |
| C33 | QEMU, KVM, deux sens de « hôte », disque `qcow2` et snapshots (`Infrastructure & DevOps/Administration système/`) | point 8 | [ ] |
| C34 | Deux pièges de débutant dans `composants-dun-ordinateur-et-demarrage.md` (RAM, taille du stockage) | point 8 | [v] |
| C35 | Génération parallèle de texte : NCM et modèles de diffusion (`IA/`) | point 9 | [ ] |
| C36 | Afficher une entité : view builder, route, contrôle d'accès (`Langages/PHP/`) | point 4 | [ ] |
| C37 | Un code, plusieurs sites (`Infrastructure & DevOps/Conception à grande échelle/`) | point 4 | [ ] |
| C38 | Répliquer un référentiel vers des satellites (`Conception à grande échelle/`) | point 4 | [ ] |
| C39 | File d'attente, worker, verrou, méthode modèle (`Infrastructure & DevOps/Automatisation/`) | point 4 | [ ] |
| C40 | Métadonnées de cache et invalidation (`Qualité, performance et outils/Performance/`) | point 4 | [ ] |
| C41 | Chargement différé : lazy builder et espace réservé (`Performance/`) | point 4 | [ ] |
| C42 | Redimensionner des images et servir du WebP (`Performance/`) | point 4 | [ ] |
| C43 | Désactiver la vérification TLS et ses risques (`Sécurité/Cybersécurité/`) | point 4 | [ ] |
| C44 | Authentification HTTP Basic et ressource REST (`Cybersécurité/`) | point 4 | [ ] |
| C45 | Données personnelles dans les journaux et les réplications (`Cybersécurité/`) | point 4 | [ ] |

## Faits pour la suite
- Audio : UN SEUL job à la fois. Seul, un chapitre de 3 000 clips sort en 4 à 5 minutes (C01) ; à trois en parallèle, moins de 100 clips par minute (saturation du processeur par Piper), donc plus lent au total. Les répertoires `.audio-tmp-*` appartiennent à des jobs vivants : ne jamais en supprimer sans avoir lu la ligne de commande de leurs processus Piper.
- C01 : a sonnet/high a tenu en 8 min (726 lignes, juste du premier coup) ; c haiku/medium x3 en 4 à 5 min chacun, fidèles aux comptes (fences, titres, tableaux, liens). Garder ces niveaux pour les chapitres semblables.
- C01 : le builder FR écrit en CRLF, les traductions en LF (convention du dépôt) : le moniteur normalise le FR par `sed -i 's/\r$//'`. Les liens vers un nouveau chapitre depuis des chapitres existants (4 langues) sont posés par le moniteur après la relecture.
- C02 : a sonnet/high en 9 min, juste du premier coup (22 blocs JS contrôlés par `node --check`) ; c haiku/medium x3 en 5 à 6 min, comptes identiques. Deux agents ont écrit d'abord un fichier au nom faux (`navegador`) : le brief donne maintenant le chemin exact à copier ; le moniteur supprime tout parasite. Les ancres internes `](#...)` des traductions se recalculent avec `slugify` de `js/text.js`.
- Contrôle croisé des 4 langues (fences, titres, tableaux, liens identiques) : `bash ~/.claude/references/projects/devpedia/verif-chapitre.sh "<chemin sous content/>"`.
- Les notions de revue de projet pro n'entrent dans aucun chapitre sous forme de nom de fichier ou de ligne du projet revu.
- C30 : a sonnet/high en 7 min 30 s, juste du premier coup sauf une cellule de tableau Zsh (corrigée par le moniteur) ; c haiku/medium x3 en 3 min chacun, comptes identiques ; libellés de la ligne « À retenir » du tableau final à aligner sur le chapitre voisin (`Key takeaways`, `Para recordar`, `Para lembrar`), brief à compléter pour les prochains chapitres.
- C30.f2 : a sonnet/high a rendu 1043 lignes ; c haiku/medium x3 en 6 à 7 min, comptes identiques. Sous Windows, `generate-audio.mjs` veut le chemin avec antislashs (`'Langages\Zsh\alias-avances'`) pour un id partagé avec un autre sujet. Le moniteur a rejoué les blocs sous Zsh 5.9 (WSL) : une phrase du FR fausse (`alias_func_def` crée plusieurs fonctions, ici `grep` et `.`) corrigée aux 4 langues.
- C30 : PowerShell absent de cette machine, blocs non exécutés (`@args` avec paramètres nommés, `$PSDefaultParameterValues` avec `-Force`) : vérification à faire sur une machine qui a `pwsh` (todo point 10).
- `verif-chapitre.sh` pointe vers un chemin Windows : copie Linux dans le scratchpad (`sed 's#^cd /c/Users/lcagnion/Desktop/perso/Devpedia#cd <dépôt>#'`).
- Liens internes : forme canonique `c=langages` (`c=shells` n'est qu'une redirection historique, `js/legacy-category-redirects.js`).
- C16 : le libellé du todo « `fread` relance pour soi » était faux (glibc 2.39 : `fread` et `fgets` s'arrêtent avec `ferror` et `errno` à `EINTR`) ; un brief qui contient une affirmation non vérifiée demande de la tester. `order` : le moniteur impose la valeur quand deux builders se suivent (29 pris par C16, 30 par C17).
- Drupal (point 4) : décision de Louis du 29/10/2026, aucun sujet « Drupal » ; 17 chapitres rangés un par un dans les catégories existantes (C09 à C15 et C36 à C45), Drupal sert d'exemple dans le texte. Revue `analyst` des faits entre a et b.
- `||` dans une cellule de tableau : toujours `\|\|` (le site coupe la ligne sinon) ; les briefs de rédaction le disent depuis C18. Défaut préexistant de `boucles.md` au todo (section fix).
- Les sorties d'un programme d'essai sont recopiées dans le chapitre ; depuis C17 les traducteurs recompilent et réexécutent leurs blocs (sorties identiques exigées) ; un bloc de mesure non autonome se complète pour le test.
- C20 : les traducteurs ont relevé une phrase fausse dans le FR (le cast `(double)` ne porte que sur le premier opérande) ; corrigée aux 4 langues avant le commit. Le builder avait aussi constaté que le pas de puissance de deux n'améliore pas l'exactitude de la soustraction en `double` (lemme de Sterbenz) : le chapitre le dit au lieu de reprendre l'argument du todo.

- C21 : le hash entier (`0x7feb352d`, `0x846ca68b`) du todo n'existe pas dans les sources de scop ; l'agent l'a écrit d'après les constantes puis mesuré. C22 : la référence `inputs.c:276-282` était fausse (l'intégration est à `inputs.c:245-249`) : le brief demande de relire les lignes citées et de rapporter l'écart.
- C21 : les traducteurs écrivent la décimale des chaînes `printf` avec un point (sortie recopiée) ; des lignes de code de 95 caractères ou plus sont apparues dans des commentaires ajoutés ou traduits : le moniteur les recompte (tabulation = 4) après chaque relecture.