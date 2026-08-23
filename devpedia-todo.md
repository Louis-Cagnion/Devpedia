# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `prompt.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Reprise après verrouillage écran : audio et surlignage repartent du début de l'entrée en cours
Signalé par Louis (23/08/2026) : après un verrouillage assez long pour qu'iOS coupe vraiment l'audio (contrairement au test de 12s déjà validé), rouvrir le téléphone et cliquer sur reprendre relance le paragraphe en cours depuis son début au lieu de continuer là où c'était coupé, et le surlignage mot par mot ne suit plus.

Cause identifiée dans `speakNextViaAudio()`/`scheduleEstimatedWords()` (`js/reader.js`, `js/reader-highlight.js`) : toute reprise sur la même entrée était traitée comme un démarrage à zéro (seek vers le début si la pause dépassait 1s, et le programme de surlignage mot par mot repartait du mot 0 avec un délai compté depuis l'instant de l'appel). Corrigé (23/08/2026) : ne seeker que si `audioEl.currentTime` est réellement hors de l'intervalle de l'entrée (vrai saut : relire/précédent/suivant) ; sinon reprendre en place et démarrer le surlignage à l'offset déjà écoulé.
- **Non vérifié en direct** : l'automatisation Chrome de cette session a été trop instable pour conclure (gel de capture d'écran, clics n'aboutissant pas, `audioEl:stalled` récurrent dès le boot) -- aucune de ces pannes ne semble liée au changement lui-même (le chemin de lecture de la toute première entrée est resté identique à l'essai 3 déjà validé par Louis sur iPhone), mais ça reste à confirmer sur le vrai scénario : lire un paragraphe assez long pour dépasser 1s, verrouiller assez longtemps pour qu'iOS coupe vraiment l'audio (pas juste 12s), déverrouiller, cliquer reprendre.
- Reste à Louis : confirmer sur iPhone que la reprise continue bien là où c'était coupé, avec le bon mot surligné.

## 2. Contrôles Bluetooth/écran verrouillé : suivant/précédent change de paragraphe, artwork ajoutée
Signalé par Louis (23/08/2026) : le Bluetooth changeait de chapitre au lieu de paragraphe (voulu : paragraphe), et l'écran verrouillé n'affichait que pause/reprendre + ±10s + le sélecteur de périphérique audio, sans les flèches précédent/suivant.

- `nexttrack`/`previoustrack` (`js/router.js`) appellent maintenant `nextParagraph()`/`previousParagraph()` au lieu de changer de chapitre. Limite technique actée avec Louis : l'API MediaSession ne distingue pas un appui Bluetooth d'un tap sur les flèches de l'écran verrouillé -- les deux partagent forcément le même comportement, paragraphe pour les deux.
- Ajout d'une `artwork` (`icons/icon-192.png`/`icon-512.png`) au `MediaMetadata` : sans image, iOS retombe sur ses boutons ±10s génériques au lieu d'afficher précédent/suivant -- cause probable de l'absence des flèches, à confirmer sur iPhone (pas vérifiable sans device).
- Reste à Louis : confirmer sur iPhone, écran verrouillé, que les flèches précédent/suivant apparaissent bien et changent de paragraphe (et pas de chapitre).

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL/Git/PHP (déjà validés le 2026-08-15).
