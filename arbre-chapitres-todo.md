# Arbre : chapitres du todo (chapitres validés 0/30)

Statuts : [ ] à faire, [~] en cours, [x] faite, [v] validée (commitée, audio des 4 langues généré), [!] bloquée, [>] reportée.
Prochaine feuille prête : audio graphemes (en cours), puis C02.
Moniteur : claude-sonnet-5-5, effort high (`modelSettings` de `settings.json`), réévalué à la clôture du premier chapitre.
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
| C00 | Audio en, es, br de `graphemes-et-decoupage-de-texte` | point 2 | [~] |
| C01 | SVG dans la page (`Langages/HTML/`) | point 2 | [ ] |
| C02 | API de page : `matchMedia`, `scrollIntoView`, `visibilitychange`, `AbortController` (`Langages/JavaScript/`) | point 2 | [ ] |
| C03 | Événements pointeur et chargement des polices (`Langages/JavaScript/`) | point 2 | [ ] |
| C04 | Unités et fonctions de taille, police à 200 et 300 % (`Langages/CSS/`) | point 2 | [ ] |
| C05 | Tester une interface dans un navigateur sans fenêtre (`Tests/`) | point 2 | [ ] |
| C06 | `node:test` (`Tests/`) | point 2 | [ ] |
| C07 | `constexpr` et constantes (`Langages/C++/`) | point 3 | [ ] |
| C08 | Boucle de jeu avec SFML (`Fondamentaux/Graphisme/`) | point 3 | [ ] |
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
| C25 | Signaler une faille trouvée sur un site : légalité et divulgation responsable | cybersécurité | [ ] |
| C26 | Mots de passe : bonnes pratiques côté utilisateur et côté site | cybersécurité | [ ] |
| C27 | Serveurs web : rôle et fonctionnement (nouvelle sous-section) | serveurs web | [ ] |
| C28 | Serveurs web : codes de statut et en-têtes de contrôle (`Retry-After`) | serveurs web | [ ] |
| C29 | Serveurs web : proxy inverse et limitation de débit | serveurs web | [ ] |
| C30 | Alias PowerShell, des simples aux complexes (`Langages/PowerShell/`), puis Bash et Zsh si absents | powershell | [ ] |

## Faits pour la suite
- Les notions de revue de projet pro n'entrent dans aucun chapitre sous forme de nom de fichier ou de ligne du projet revu.
