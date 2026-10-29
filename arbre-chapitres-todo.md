# Arbre : chapitres du todo (chapitres commités 13/45, audio complet 13/45)

Statuts : [ ] à faire, [~] en cours, [x] faite, [v] validée (commitée, audio des 4 langues généré), [!] bloquée, [>] reportée.
Arbre validé par Louis le 28/10/2026 (lancement des 3 Haiku de traduction par chapitre compris).
Prochaine feuille prête : C19.c (traductions EN, ES, BR en cours) puis C19.d ; C20.b dès le retour du builder. Le prochain `order` libre de `Langages/C/` est 32.
Arrêt demandé par Louis le 29/10/2026 une fois le builder C05 revenu et les Haiku C07 finis ; à reprendre ici.
Moniteur : claude-sonnet-5-5, effort high (`modelSettings` de `settings.json`, `CLAUDE_CODE_EFFORT_LEVEL` non défini), réévalué à la clôture du premier chapitre. Chapitres de faits spécialisés (Drupal, NCM, ft_linux) : revue `analyst` d'un niveau supérieur au moniteur entre a et b.
Lot parallèle du 28/10/2026 (8 rédactions FR) arrêté par Louis à 14h : 5 chapitres FR récupérés (C03, C04, C08, C25, C26), 3 à relancer (C05, C07, C30). Retour aux conditions normales : une seule rédaction FR à la fois, traductions Haiku par trio, un seul audio à la fois. Autorisé par Louis le 28/10/2026 : pendant qu'un trio Haiku traduit le chapitre N, un builder rédige déjà le FR du chapitre N+1 (jamais deux rédacteurs FR en même temps) ; commit dès les 4 langues relues, audio noté au todo point 6.
Échéance du 28/10/2026 (tout commité avant 17h) : dépassée à la reprise du 29/10/2026 (18h56), Louis ne l'a pas rappelée.

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
| C05 | Tester une interface dans un navigateur sans fenêtre (`Tests/`) | point 2 | [~] a faite (29/10, `Tests/tests-navigateur-sans-fenetre.md`, `order: 12`, non commité) ; b, c, d à faire |
| C06 | `node:test` (`Tests/`) | point 2 | [ ] |
| C07 | `constexpr` et constantes (`Langages/C++/`) | point 3 | [v] |
| C08 | Boucle de jeu avec SFML (`Fondamentaux/Graphisme/`) | point 3 | [v] |
| C09 | Inversion de contrôle et points d'extension : hooks, événements, dépendance optionnelle (`Qualité, performance et outils/Qualité et architecture du code/`) | point 4 | [ ] |
| C10 | Le conteneur de services (`Qualité et architecture du code/`) | point 4 | [ ] |
| C11 | L'architecture à plugins (`Qualité et architecture du code/`) | point 4 | [ ] |
| C12 | Machine à états applicative (`Qualité et architecture du code/`) | point 4 | [ ] |
| C13 | Cycle de vie d'une entité, schéma par code, champ calculé (`Données/Bases de données/`) | point 4 | [ ] |
| C14 | Migrations de données sûres (`Données/Bases de données/`) | point 4 | [ ] |
| C15 | Alias d'adresse, redirection 301, conversion de paramètre de route (`Langages/PHP/`) | point 4 | [ ] |
| C16 | Appel système interrompu (`EINTR`) (`Langages/C/appel-systeme-interrompu-eintr.md`, `order: 29`) | point 5 | [v] |
| C17 | Filtrage sur place à deux pointeurs (`Langages/C/filtrage-sur-place-deux-pointeurs.md`, `order: 30`) | point 5 | [v] |
| C18 | `offsetof` et littéral composé (`Langages/C/offsetof-et-litteral-compose.md`, `order: 31`) | point 5 | [v] |
| C19 | Tri puis balayage (`Fondamentaux/Algorithmes/tri-puis-balayage.md`, `order: 13`) | point 5 | [~] a, b faites (29/10, non commité) ; c en cours ; d à faire |
| C20 | Précision des `float` loin de l'origine (`Données/Représentation des données/flottants-loin-de-l-origine.md`) | point 5 | [~] a en cours (builder lancé le 29/10) |
| C21 | GLSL : `flat`, bruit de valeur et hash de shader | point 5 | [ ] |
| C22 | Beer-Lambert et Euler semi-implicite (sections ajoutées à `effets-de-rendu-et-interaction-3d.md`) | point 5 | [ ] |
| C23 | Blocage de cardan et rotation incrémentale | point 5 | [ ] |
| C24 | Liens OWASP Top 10 et notions de l'introduction (`Sécurité/Cybersécurité/`) | cybersécurité | [ ] |
| C25 | Signaler une faille trouvée sur un site : légalité et divulgation responsable | cybersécurité | [v] |
| C26 | Mots de passe : bonnes pratiques côté utilisateur et côté site | cybersécurité | [v] |
| C27 | Serveurs web : rôle et fonctionnement (nouvelle sous-section) | serveurs web | [ ] |
| C28 | Serveurs web : codes de statut et en-têtes de contrôle (`Retry-After`) | serveurs web | [ ] |
| C29 | Serveurs web : proxy inverse et limitation de débit | serveurs web | [ ] |
| C30 | Alias PowerShell, des simples aux complexes (`Langages/PowerShell/alias-et-raccourcis-de-commandes.md`, `order: 14`) | powershell | [v] ; reste C30.f : alias avancés de Bash puis de Zsh (todo section « powershell ») |
| C31 | SQL pour un premier contact : lire des lignes, types de colonne, variable de table (sections de `Langages/Domain-specific Languages (DSL)/sql.md`) | point 7 | [ ] |
| C32 | Lire une base avec SSMS (`Infrastructure & DevOps/` ou `Outils/`) | point 7 | [ ] |
| C33 | QEMU, KVM, deux sens de « hôte », disque `qcow2` et snapshots (`Infrastructure & DevOps/Administration système/`) | point 8 | [ ] |
| C34 | Deux pièges de débutant dans `composants-dun-ordinateur-et-demarrage.md` (RAM, taille du stockage) | point 8 | [ ] |
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
- C30 : PowerShell absent de cette machine, blocs non exécutés (`@args` avec paramètres nommés, `$PSDefaultParameterValues` avec `-Force`) : vérification à faire sur une machine qui a `pwsh` (todo point 10).
- `verif-chapitre.sh` pointe vers un chemin Windows : copie Linux dans le scratchpad (`sed 's#^cd /c/Users/lcagnion/Desktop/perso/Devpedia#cd <dépôt>#'`).
- Liens internes : forme canonique `c=langages` (`c=shells` n'est qu'une redirection historique, `js/legacy-category-redirects.js`).
- C16 : le libellé du todo « `fread` relance pour soi » était faux (glibc 2.39 : `fread` et `fgets` s'arrêtent avec `ferror` et `errno` à `EINTR`) ; un brief qui contient une affirmation non vérifiée demande de la tester. `order` : le moniteur impose la valeur quand deux builders se suivent (29 pris par C16, 30 par C17).
- Drupal (point 4) : décision de Louis du 29/10/2026, aucun sujet « Drupal » ; 17 chapitres rangés un par un dans les catégories existantes (C09 à C15 et C36 à C45), Drupal sert d'exemple dans le texte. Revue `analyst` des faits entre a et b.
- `||` dans une cellule de tableau : toujours `\|\|` (le site coupe la ligne sinon) ; les briefs de rédaction le disent depuis C18. Défaut préexistant de `boucles.md` au todo (section fix).
- Les sorties d'un programme d'essai sont recopiées dans le chapitre ; depuis C17 les traducteurs recompilent et réexécutent leurs blocs (sorties identiques exigées) ; un bloc de mesure non autonome se complète pour le test.
