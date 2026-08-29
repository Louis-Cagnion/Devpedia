# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `prompt.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Boutons de lecture désynchronisés de la voix : audit en 2 passes, à confirmer
Signalé par Louis (29/08/2026) : "les boutons ne sont absolument pas synchronisés avec la voix". Audit de `js/reader.js`/`js/reader-highlight.js` en deux temps (détail dans `journal-de-bord.md`) :
1. `audioEl.play()` rejeté (autoplay) laissait `isPlaying` bloqué à `true` pour toujours -- corrigé, insuffisant seul.
2. Le retest de Louis a montré le bouton repassant sur "Reprendre" en pleine lecture pendant un saut de paragraphe, et le surlignage se bloquant en général entre deux sections séparées par une ponctuation. Root cause commune : l'événement `pause` de l'audio est asynchrone, un minuteur de surlignage périmé pouvait survivre à un saut. Corrigés : `pauseAudioEl()` (marque le pause comme attendu avant de l'appeler), distinction `NotAllowedError` (vraiment bloqué) vs `AbortError` (juste un chevauchement, la voix continue), et le garde de `scheduleEstimatedWords()` comparé à `entry.words` plutôt qu'au highlightTarget partagé par une ligne de tableau.
- Reste à Louis : confirmer sur plusieurs pages/langues, y compris en cliquant "paragraphe suivant/précédent" en rafale et à travers des tableaux, que boutons et surlignage restent synchronisés avec ce qui joue réellement.

## 2. Voix bloquée sur le tableau de l'accueil : corrigé, à confirmer
Signalé par Louis (29/08/2026) en testant l'audio français : la lecture se bloquait sur le tableau "Par où commencer ?" de l'accueil. Corrigé (29/08/2026, détail dans `journal-de-bord.md`) : watchdog anti-blocage dans `speakNextViaSynthesis()` (`js/reader.js`) + audio pré-généré pour `acceuil` désormais inclus (`scripts/generate-audio.mjs`, 4 langues déjà générées).
- Reste à Louis : réécouter l'accueil (chaque langue) et confirmer que le tableau se lit en entier sans blocage, mp3 pré-généré chargé (pas de repli silencieux sur la synthèse live sauf coupure réseau).

## 3. "Paragraphe suivant/précédent" bloquait en entrant dans un tableau : corrigé, à confirmer
Signalé par Louis (29/08/2026). Corrigé le même jour (détail dans `journal-de-bord.md`) : accès nul-sûr dans `scheduleEstimatedWords()` (`js/reader-highlight.js`) sur les entrées de tableau purement composées de texte de connecteur/label (ex. "Votre situation :").
- Reste à Louis : confirmer que "paragraphe suivant"/"paragraphe précédent" fonctionnent normalement en entrant/sortant d'un tableau, sur plusieurs tableaux du site.

## 4. Reprise après verrouillage écran : audio, surlignage et scroll perdent la position réelle
Signalé par Louis (23/08/2026), en deux temps :
1. Après un verrouillage assez long pour qu'iOS coupe vraiment l'audio (pas juste le test de 12s déjà validé), rouvrir le téléphone et cliquer sur reprendre relançait le paragraphe en cours depuis son début au lieu de continuer là où c'était coupé, et le surlignage mot par mot ne suivait plus. Cause : `speakNextViaAudio()`/`scheduleEstimatedWords()` (`js/reader.js`, `js/reader-highlight.js`) traitaient toute reprise sur la même entrée comme un démarrage à zéro. Corrigé (23/08/2026) : ne seeker que si `audioEl.currentTime` est réellement hors de l'intervalle de l'entrée ; sinon reprendre en place et démarrer le surlignage à l'offset déjà écoulé.
2. Une fois (1) en place, Louis a précisé que le problème touchait aussi le cas où l'audio continue vraiment de jouer pendant le verrouillage (le but recherché) : surlignage bloqué sur le dernier mot du paragraphe précédent, pause/reprise relançant un paragraphe déjà dépassé, scroll auto ne suivant plus -- uniquement après un cycle verrouillage/déverrouillage, jamais en écoute normale (confirmé par Louis). Cause : le gestionnaire `timeupdate` (`js/reader.js`) n'avançait `planIndex` que d'une seule entrée par déclenchement -- correct quand les ticks arrivent régulièrement, mais iOS peut suspendre le traitement JS de l'onglet pendant un verrouillage prolongé pendant que l'audio continue réellement d'avancer ; au réveil, le premier tick traité ne rattrapait qu'une seule entrée alors que l'audio en avait traversé plusieurs. Corrigé (23/08/2026) : le gestionnaire rattrape maintenant `planIndex` en boucle jusqu'à l'entrée qui contient réellement `currentTime` (s'arrête sur une entrée "pause" : l'audio ne peut pas avoir dépassé un bloc de code tout seul).
- **Non vérifié en direct** : aucun des deux correctifs n'est testable de façon fiable dans le sandbox de cette session (automatisation Chrome instable pour (1) ; le vrai symptôme de (2) est un comportement de suspension JS propre à iOS verrouillé, pas reproductible sur Chrome desktop). Ce correctif explique probablement aussi le blocage après un bloc de code signalé séparément (Louis : "ça doit entrer en conflit... vu que c'est en transition ça bug") -- à revérifier en même temps plutôt que de garder un point séparé.
- Reste à Louis : confirmer sur iPhone, verrouillage assez long pour couper l'audio ou pour traverser plusieurs paragraphes en poche, que la reprise/le surlignage/le scroll retombent bien sur la bonne position, et que le blocage après un bloc de code a disparu.

## 5. Contrôles Bluetooth/écran verrouillé : suivant/précédent change de paragraphe, artwork ajoutée
Signalé par Louis (23/08/2026) : le Bluetooth changeait de chapitre au lieu de paragraphe (voulu : paragraphe), et l'écran verrouillé n'affichait que pause/reprendre + ±10s + le sélecteur de périphérique audio, sans les flèches précédent/suivant.

- `nexttrack`/`previoustrack` (`js/router.js`) appellent maintenant `nextParagraph()`/`previousParagraph()` au lieu de changer de chapitre. Limite technique actée avec Louis : l'API MediaSession ne distingue pas un appui Bluetooth d'un tap sur les flèches de l'écran verrouillé -- les deux partagent forcément le même comportement, paragraphe pour les deux.
- Ajout d'une `artwork` (`icons/icon-192.png`/`icon-512.png`) au `MediaMetadata` : sans image, iOS retombe sur ses boutons ±10s génériques au lieu d'afficher précédent/suivant -- cause probable de l'absence des flèches, à confirmer sur iPhone (pas vérifiable sans device).
- Reste à Louis : confirmer sur iPhone, écran verrouillé, que les flèches précédent/suivant apparaissent bien et changent de paragraphe (et pas de chapitre).

## 6. Auto-advance vers le chapitre suivant : le délai de 5s ne s'écoulait pas si verrouillé
Signalé par Louis (23/08/2026) : le délai avant de passer automatiquement au chapitre suivant reposait sur un `setTimeout`, suspendu par iOS une fois l'écran verrouillé -- le changement de chapitre n'arrivait donc jamais tout seul en poche. Corrigé (23/08/2026) : `playAutoAdvanceSilence()` (`js/reader.js`) fait jouer un clip silencieux de 5s à travers le même `audioEl` que la lecture pré-générée, dont les événements continuent d'arriver même verrouillé.
- Reste à Louis : confirmer sur iPhone, écran verrouillé, qu'un chapitre qui se termine enchaîne bien tout seul sur le suivant après 5s.

## 7. Pause de lecture sur les parenthèses
Demandé par Louis (23/08/2026) : la lecture ne marquait aucune pause en croisant une parenthèse. Corrigé (23/08/2026) : `CLAUSE_END_PATTERN` (`js/reader-clauses.js`) traite `(` et `)` comme des frontières de clause. Audio des 5 chapitres pilotes régénérée en conséquence (4 langues).
- Reste à Louis : confirmer que le rythme de lecture sonne mieux sur une incise entre parenthèses.

## 8. Tester l'audio prégénéré C/C++/PHP/SQL/Git (4 langues)
Prégénéré (23/08/2026) via `scripts/generate-audio.mjs --context=c,cpp,php,git` (SQL déjà fait) : 60 chapitres, 4 langues, namespacés par dossier catégorie/sujet (`audio/<lang>/<catégorie>[/<sujet>]/<chapitreId>`) pour éviter la collision d'id corrigée le même jour (ex. `variables` existait à la fois en C et PHP).
- Reste à Louis : écouter quelques chapitres de chaque sujet sur iPhone, confirmer que l'audio prégénéré se charge bien (pas de repli silencieux sur `speechSynthesis`) et que la prononciation correspond à la table déjà validée.

## 9. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16) : deux correctifs déjà tentés, sans effet
Signalé par Louis (25/08/2026) : le fond stylisé des pages chapitre (`css/content.css`, `.page::before` — pointillés + halo chaud/froid) reste gris uni sur son iPhone (iOS 16.7.16, Safari), y compris en navigation privée (cache écarté), alors qu'il s'affiche normalement sur desktop. Reproduit sur tous les chapitres (pas spécifique au nouveau chapitre OS qui a révélé le bug), pas seulement en PWA installée.

Deux hypothèses testées et invalidées par le retest de Louis :
1. `color-mix()` non supporté sur mobile ancien → couches concernées isolées dans un `@supports`. Insuffisant : iOS 16.7.16 est censé supporter `color-mix()` (support Safari depuis 16.2), donc `@supports` réactivait la même déclaration combinée, toujours grise.
2. `color-mix()` retiré entièrement, remplacé par des `rgba()` + triplets RGB précalculés (`--accent-rgb`/`--accent-warm-rgb` dans `base.css`), sur l'hypothèse d'un bug de rendu WebKit spécifique à `color-mix()` comme stop de couleur. Toujours gris après redéploiement confirmé (CSS de prod vérifié à jour) et retest en navigation privée.

Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`) : la piste "fonction CSS non supportée" est probablement épuisée, ce qui pointe plutôt vers autre chose (le pseudo-élément entier qui ne se peint pas, plutôt qu'une seule couche de fond qui échoue) — voir `journal-de-bord.md` pour le détail des deux tentatives.

Test demandé à Louis avant de tenter un 3ᵉ correctif à l'aveugle (pour savoir si le bug dépend de la largeur mobile ou du moteur WebKit lui-même, indépendamment de la largeur) : sur la page d'un chapitre, bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement une fois en mode "version pour ordinateur" (toujours sur le téléphone). Si le test ne suffit pas à trancher, l'étape suivante est un accès à l'inspecteur Safari distant (via un Mac connecté à l'iPhone) plutôt que de continuer à deviner sans données réelles de l'appareil.

## 10. Nouvelles corrections de prononciation FR à confirmer à l'oreille
Signalé par Louis (29/08/2026) : PHP lu en un mot au lieu des lettres, PowerShell lu "powshell", Git lu "gi". Corrigé le même jour (détail dans `journal-de-bord.md`) : mécanisme générique `spellOutAcronymsFr()` (tout sigle en MAJUSCULES épelé lettre par lettre, plus besoin d'entrée au cas par cas) + PowerShell/Git respelés individuellement.
- Reste à Louis : confirmer à l'oreille PHP (`P H P`), PowerShell (`Power Shell`) et surtout Git (`Guite`, respelling le moins sûr des trois) ; signaler aussi tout autre sigle qui sonnerait encore mal malgré le nouveau mécanisme général.

## 11. Section "Ce que couvre le site" de l'accueil : réécrite, à valider
Signalé par Louis (29/08/2026) : du nouveau contenu et des changements de structure de projet s'étaient accumulés depuis la dernière rédaction. Réécrite (`content/acceuil.md`) pour couvrir les 11 catégories actuelles (Sécurité, Tests, Blockchain, Gestion de projet et organisation, et la profondeur IA/Infrastructure ajoutées depuis n'étaient pas mentionnées) ; liens vérifiés (`node scripts/generate-struct.js`, aucun lien cassé) et un cliqué en direct. Audio FR régénéré en conséquence.
- Reste à Louis : relire le choix des sujets mis en avant et la formulation, en français uniquement pour l'instant (EN/ES/BR pas encore mis à jour).

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL (déjà validés le 2026-08-15) ; Git/PHP retirés de cette liste suite au point 10 ci-dessus (leur validation du 15/08 ne couvrait pas ces prononciations précises).
