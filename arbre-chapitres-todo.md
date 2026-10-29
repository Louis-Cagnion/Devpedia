# Arbre : chapitres du todo (chapitres commités 9/30, audio complet 8/30)

Statuts : [ ] à faire, [~] en cours, [x] faite, [v] validée (commitée, audio des 4 langues généré), [!] bloquée, [>] reportée.
Arbre validé par Louis le 28/10/2026 (lancement des 3 Haiku de traduction par chapitre compris).
Prochaine feuille prête : C05.b (relecture du FR, 933 lignes, 22 tableaux ; rapport de l'agent : Chrome vérifié sous Windows seulement, 13 liens externes non vérifiés), puis audio de C07 (point 6).
Arrêt demandé par Louis le 29/10/2026 une fois le builder C05 revenu et les Haiku C07 finis ; à reprendre ici.
Moniteur : claude-sonnet-5-5, effort high (`modelSettings` de `settings.json`), réévalué à la clôture du premier chapitre.
Lot parallèle du 28/10/2026 (8 rédactions FR) arrêté par Louis à 14h : 5 chapitres FR récupérés (C03, C04, C08, C25, C26), 3 à relancer (C05, C07, C30). Retour aux conditions normales : une seule rédaction FR à la fois, traductions Haiku par trio, un seul audio à la fois. Autorisé par Louis le 28/10/2026 : pendant qu'un trio Haiku traduit le chapitre N, un builder rédige déjà le FR du chapitre N+1 (jamais deux rédacteurs FR en même temps) ; commit dès les 4 langues relues, audio noté au todo point 6.
Échéance : tout est commité avant 17h (hygiène dès 16h45) ; un chapitre qui ne finit pas avant 16h45 ne démarre pas.

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
| C07 | `constexpr` et constantes (`Langages/C++/`) | point 3 | [x] commité sans audio (todo point 6) |
| C08 | Boucle de jeu avec SFML (`Fondamentaux/Graphisme/`) | point 3 | [v] |
| C09 | Drupal : plateforme et noyau | point 4 | [ ] |
| C10 | Drupal : entités, plugins et annotations | point 4 | [ ] |
| C11 | Drupal : multisite et adresses | point 4 | [ ] |
| C12 | Drupal : files d'attente et verrous | point 4 | [ ] |
| C13 | Drupal : migration et propagation de données | point 4 | [ ] |
| C14 | Drupal : cache et affichage | point 4 | [ ] |
| C15 | Drupal : interfaces et hygiène | point 4 | [ ] |
| C16 | Appel système interrompu (`EINTR`) (`Langages/C/`) | point 5 | [ ] |
| C17 | Filtrage sur place à deux pointeurs (`Langages/C/`) | point 5 | [ ] |
| C18 | `offsetof` et littéral composé (`Langages/C/`) | point 5 | [ ] |
| C19 | Tri puis balayage (sweep and prune) | point 5 | [ ] |
| C20 | Précision des `float` loin de l'origine | point 5 | [ ] |
| C21 | GLSL : `flat`, bruit de valeur et hash de shader | point 5 | [ ] |
| C22 | Beer-Lambert et Euler semi-implicite (sections ajoutées à `effets-de-rendu-et-interaction-3d.md`) | point 5 | [ ] |
| C23 | Blocage de cardan et rotation incrémentale | point 5 | [ ] |
| C24 | Liens OWASP Top 10 et notions de l'introduction (`Sécurité/Cybersécurité/`) | cybersécurité | [ ] |
| C25 | Signaler une faille trouvée sur un site : légalité et divulgation responsable | cybersécurité | [v] |
| C26 | Mots de passe : bonnes pratiques côté utilisateur et côté site | cybersécurité | [v] |
| C27 | Serveurs web : rôle et fonctionnement (nouvelle sous-section) | serveurs web | [ ] |
| C28 | Serveurs web : codes de statut et en-têtes de contrôle (`Retry-After`) | serveurs web | [ ] |
| C29 | Serveurs web : proxy inverse et limitation de débit | serveurs web | [ ] |
| C30 | Alias PowerShell, des simples aux complexes (`Langages/PowerShell/`), puis Bash et Zsh si absents | powershell | [ ] à relancer (agent arrêté sans fichier) |

## Faits pour la suite
- Audio : UN SEUL job à la fois. Seul, un chapitre de 3 000 clips sort en 4 à 5 minutes (C01) ; à trois en parallèle, moins de 100 clips par minute (saturation du processeur par Piper), donc plus lent au total. Les répertoires `.audio-tmp-*` appartiennent à des jobs vivants : ne jamais en supprimer sans avoir lu la ligne de commande de leurs processus Piper.
- C01 : a sonnet/high a tenu en 8 min (726 lignes, juste du premier coup) ; c haiku/medium x3 en 4 à 5 min chacun, fidèles aux comptes (fences, titres, tableaux, liens). Garder ces niveaux pour les chapitres semblables.
- C01 : le builder FR écrit en CRLF, les traductions en LF (convention du dépôt) : le moniteur normalise le FR par `sed -i 's/\r$//'`. Les liens vers un nouveau chapitre depuis des chapitres existants (4 langues) sont posés par le moniteur après la relecture.
- C02 : a sonnet/high en 9 min, juste du premier coup (22 blocs JS contrôlés par `node --check`) ; c haiku/medium x3 en 5 à 6 min, comptes identiques. Deux agents ont écrit d'abord un fichier au nom faux (`navegador`) : le brief donne maintenant le chemin exact à copier ; le moniteur supprime tout parasite. Les ancres internes `](#...)` des traductions se recalculent avec `slugify` de `js/text.js`.
- Contrôle croisé des 4 langues (fences, titres, tableaux, liens identiques) : `bash ~/.claude/references/projects/devpedia/verif-chapitre.sh "<chemin sous content/>"`.
- Les notions de revue de projet pro n'entrent dans aucun chapitre sous forme de nom de fichier ou de ligne du projet revu.
