# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `prompt.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Reprise après verrouillage écran : audio, surlignage et scroll perdent la position réelle
Signalé par Louis (23/08/2026), en deux temps :
1. Après un verrouillage assez long pour qu'iOS coupe vraiment l'audio (pas juste le test de 12s déjà validé), rouvrir le téléphone et cliquer sur reprendre relançait le paragraphe en cours depuis son début au lieu de continuer là où c'était coupé, et le surlignage mot par mot ne suivait plus. Cause : `speakNextViaAudio()`/`scheduleEstimatedWords()` (`js/reader.js`, `js/reader-highlight.js`) traitaient toute reprise sur la même entrée comme un démarrage à zéro. Corrigé (23/08/2026) : ne seeker que si `audioEl.currentTime` est réellement hors de l'intervalle de l'entrée ; sinon reprendre en place et démarrer le surlignage à l'offset déjà écoulé.
2. Une fois (1) en place, Louis a précisé que le problème touchait aussi le cas où l'audio continue vraiment de jouer pendant le verrouillage (le but recherché) : surlignage bloqué sur le dernier mot du paragraphe précédent, pause/reprise relançant un paragraphe déjà dépassé, scroll auto ne suivant plus -- uniquement après un cycle verrouillage/déverrouillage, jamais en écoute normale (confirmé par Louis). Cause : le gestionnaire `timeupdate` (`js/reader.js`) n'avançait `planIndex` que d'une seule entrée par déclenchement -- correct quand les ticks arrivent régulièrement, mais iOS peut suspendre le traitement JS de l'onglet pendant un verrouillage prolongé pendant que l'audio continue réellement d'avancer ; au réveil, le premier tick traité ne rattrapait qu'une seule entrée alors que l'audio en avait traversé plusieurs. Corrigé (23/08/2026) : le gestionnaire rattrape maintenant `planIndex` en boucle jusqu'à l'entrée qui contient réellement `currentTime` (s'arrête sur une entrée "pause" : l'audio ne peut pas avoir dépassé un bloc de code tout seul).
- **Non vérifié en direct** : aucun des deux correctifs n'est testable de façon fiable dans le sandbox de cette session (automatisation Chrome instable pour (1) ; le vrai symptôme de (2) est un comportement de suspension JS propre à iOS verrouillé, pas reproductible sur Chrome desktop). Ce correctif explique probablement aussi le blocage après un bloc de code signalé séparément (Louis : "ça doit entrer en conflit... vu que c'est en transition ça bug") -- à revérifier en même temps plutôt que de garder un point séparé.
- Reste à Louis : confirmer sur iPhone, verrouillage assez long pour couper l'audio ou pour traverser plusieurs paragraphes en poche, que la reprise/le surlignage/le scroll retombent bien sur la bonne position, et que le blocage après un bloc de code a disparu.

## 2. Contrôles Bluetooth/écran verrouillé : suivant/précédent change de paragraphe, artwork ajoutée
Signalé par Louis (23/08/2026) : le Bluetooth changeait de chapitre au lieu de paragraphe (voulu : paragraphe), et l'écran verrouillé n'affichait que pause/reprendre + ±10s + le sélecteur de périphérique audio, sans les flèches précédent/suivant.

- `nexttrack`/`previoustrack` (`js/router.js`) appellent maintenant `nextParagraph()`/`previousParagraph()` au lieu de changer de chapitre. Limite technique actée avec Louis : l'API MediaSession ne distingue pas un appui Bluetooth d'un tap sur les flèches de l'écran verrouillé -- les deux partagent forcément le même comportement, paragraphe pour les deux.
- Ajout d'une `artwork` (`icons/icon-192.png`/`icon-512.png`) au `MediaMetadata` : sans image, iOS retombe sur ses boutons ±10s génériques au lieu d'afficher précédent/suivant -- cause probable de l'absence des flèches, à confirmer sur iPhone (pas vérifiable sans device).
- Reste à Louis : confirmer sur iPhone, écran verrouillé, que les flèches précédent/suivant apparaissent bien et changent de paragraphe (et pas de chapitre).

## 3. Auto-advance vers le chapitre suivant : le délai de 5s ne s'écoulait pas si verrouillé
Signalé par Louis (23/08/2026) : le délai avant de passer automatiquement au chapitre suivant reposait sur un `setTimeout`, suspendu par iOS une fois l'écran verrouillé -- le changement de chapitre n'arrivait donc jamais tout seul en poche. Corrigé (23/08/2026) : `playAutoAdvanceSilence()` (`js/reader.js`) fait jouer un clip silencieux de 5s à travers le même `audioEl` que la lecture pré-générée, dont les événements continuent d'arriver même verrouillé.
- Reste à Louis : confirmer sur iPhone, écran verrouillé, qu'un chapitre qui se termine enchaîne bien tout seul sur le suivant après 5s.

## 4. Pause de lecture sur les parenthèses
Demandé par Louis (23/08/2026) : la lecture ne marquait aucune pause en croisant une parenthèse. Corrigé (23/08/2026) : `CLAUSE_END_PATTERN` (`js/reader-clauses.js`) traite `(` et `)` comme des frontières de clause. Audio des 5 chapitres pilotes régénérée en conséquence (4 langues).
- Reste à Louis : confirmer que le rythme de lecture sonne mieux sur une incise entre parenthèses.

## 5. Tester l'audio prégénéré C/C++/PHP/SQL/Git (4 langues)
Prégénéré (23/08/2026) via `scripts/generate-audio.mjs --context=c,cpp,php,git` (SQL déjà fait) : 60 chapitres, 4 langues, namespacés par dossier catégorie/sujet (`audio/<lang>/<catégorie>[/<sujet>]/<chapitreId>`) pour éviter la collision d'id corrigée le même jour (ex. `variables` existait à la fois en C et PHP).
- Reste à Louis : écouter quelques chapitres de chaque sujet sur iPhone, confirmer que l'audio prégénéré se charge bien (pas de repli silencieux sur `speechSynthesis`) et que la prononciation correspond à la table déjà validée.

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL/Git/PHP (déjà validés le 2026-08-15).
