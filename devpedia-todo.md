# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. 57 chapitres FR sans audio pré-généré ne lisaient plus RIEN : corrigé, à confirmer
Root cause (2+ blocs de code adjacents) et bug annexe découvert en régénérant (span de code purement ponctuation forcé en voix anglaise, imprononçable) corrigés ; audio FR régénéré pour les 61 chapitres concernés (détail dans `journal-de-bord.md`). Probablement autant en EN/ES/BR, pas encore régénéré (moins urgent : ces langues gardent le repli sur la voix du navigateur en attendant).
- Reste à Louis : réécouter quelques-uns des 61 chapitres FR régénérés (liste dans le journal) et confirmer que l'audio pré-généré se charge (pas de silence).

## 2. Boutons de lecture désynchronisés de la voix : audit en 2 passes, à confirmer
Signalé par Louis (29/08/2026) : "les boutons ne sont absolument pas synchronisés avec la voix". Audit de `js/reader.js`/`js/reader-highlight.js` en deux temps (détail dans `journal-de-bord.md`) :
1. `audioEl.play()` rejeté (autoplay) laissait `isPlaying` bloqué à `true` pour toujours -- corrigé, insuffisant seul.
2. Le retest de Louis a montré le bouton repassant sur "Reprendre" en pleine lecture pendant un saut de paragraphe, et le surlignage se bloquant en général entre deux sections séparées par une ponctuation. Root cause commune : l'événement `pause` de l'audio est asynchrone, un minuteur de surlignage périmé pouvait survivre à un saut. Corrigés : `pauseAudioEl()` (marque le pause comme attendu avant de l'appeler), distinction `NotAllowedError` (vraiment bloqué) vs `AbortError` (juste un chevauchement, la voix continue), et le garde de `scheduleEstimatedWords()` comparé à `entry.words` plutôt qu'au highlightTarget partagé par une ligne de tableau.
- Reste à Louis : confirmer sur plusieurs pages/langues, y compris en cliquant "paragraphe suivant/précédent" en rafale et à travers des tableaux, que boutons et surlignage restent synchronisés avec ce qui joue réellement.

## 3. Surlignage désynchronisé de la vitesse de lecture (×1.25/×1.5/×2) : corrigé, à confirmer
Suspecté par Louis (29/08/2026, "je peux me tromper") : confirmé en lisant le code (détail dans `journal-de-bord.md`). `scheduleEstimatedWords()` calculait ses délais à partir de la durée réelle du clip à vitesse normale, jamais ajustée par `readerRate` -- l'audio et le surlignage divergent de plus en plus au fil d'une entrée dès que la vitesse n'est pas ×1. Corrigé en divisant la durée/l'offset par `readerRate` avant de les transmettre (`speakNextViaAudio()`, `js/reader.js`).
- Reste à Louis : confirmer à ×1.25/×1.5/×2 que le surlignage suit bien la voix du début à la fin d'un chapitre, pas seulement au début.

## 4. Voix bloquée sur le tableau de l'accueil : corrigé, à confirmer
Signalé par Louis (29/08/2026) en testant l'audio français : la lecture se bloquait sur le tableau "Par où commencer ?" de l'accueil. Corrigé (29/08/2026, détail dans `journal-de-bord.md`) : watchdog anti-blocage dans `speakNextViaSynthesis()` (`js/reader.js`) + audio pré-généré pour `acceuil` désormais inclus (`scripts/generate-audio.mjs`, 4 langues déjà générées).
- Reste à Louis : réécouter l'accueil (chaque langue) et confirmer que le tableau se lit en entier sans blocage, mp3 pré-généré chargé (pas de repli silencieux sur la synthèse live sauf coupure réseau).

## 5. "Paragraphe suivant/précédent" bloquait en entrant dans un tableau : corrigé, à confirmer
Signalé par Louis (29/08/2026). Corrigé le même jour (détail dans `journal-de-bord.md`) : accès nul-sûr dans `scheduleEstimatedWords()` (`js/reader-highlight.js`) sur les entrées de tableau purement composées de texte de connecteur/label (ex. "Votre situation :").
- Reste à Louis : confirmer que "paragraphe suivant"/"paragraphe précédent" fonctionnent normalement en entrant/sortant d'un tableau, sur plusieurs tableaux du site.

## 6. Reprise après verrouillage écran : audio, surlignage et scroll perdent la position réelle
Signalé par Louis (23/08/2026), en deux temps :
1. Après un verrouillage assez long pour qu'iOS coupe vraiment l'audio (pas juste le test de 12s déjà validé), rouvrir le téléphone et cliquer sur reprendre relançait le paragraphe en cours depuis son début au lieu de continuer là où c'était coupé, et le surlignage mot par mot ne suivait plus. Cause : `speakNextViaAudio()`/`scheduleEstimatedWords()` (`js/reader.js`, `js/reader-highlight.js`) traitaient toute reprise sur la même entrée comme un démarrage à zéro. Corrigé (23/08/2026) : ne seeker que si `audioEl.currentTime` est réellement hors de l'intervalle de l'entrée ; sinon reprendre en place et démarrer le surlignage à l'offset déjà écoulé.
2. Une fois (1) en place, Louis a précisé que le problème touchait aussi le cas où l'audio continue vraiment de jouer pendant le verrouillage (le but recherché) : surlignage bloqué sur le dernier mot du paragraphe précédent, pause/reprise relançant un paragraphe déjà dépassé, scroll auto ne suivant plus -- uniquement après un cycle verrouillage/déverrouillage, jamais en écoute normale (confirmé par Louis). Cause : le gestionnaire `timeupdate` (`js/reader.js`) n'avançait `planIndex` que d'une seule entrée par déclenchement -- correct quand les ticks arrivent régulièrement, mais iOS peut suspendre le traitement JS de l'onglet pendant un verrouillage prolongé pendant que l'audio continue réellement d'avancer ; au réveil, le premier tick traité ne rattrapait qu'une seule entrée alors que l'audio en avait traversé plusieurs. Corrigé (23/08/2026) : le gestionnaire rattrape maintenant `planIndex` en boucle jusqu'à l'entrée qui contient réellement `currentTime` (s'arrête sur une entrée "pause" : l'audio ne peut pas avoir dépassé un bloc de code tout seul).
- **Non vérifié en direct** : aucun des deux correctifs n'est testable de façon fiable dans le sandbox de cette session (automatisation Chrome instable pour (1) ; le vrai symptôme de (2) est un comportement de suspension JS propre à iOS verrouillé, pas reproductible sur Chrome desktop). Ce correctif explique probablement aussi le blocage après un bloc de code signalé séparément (Louis : "ça doit entrer en conflit... vu que c'est en transition ça bug") -- à revérifier en même temps plutôt que de garder un point séparé.
- Reste à Louis : confirmer sur iPhone, verrouillage assez long pour couper l'audio ou pour traverser plusieurs paragraphes en poche, que la reprise/le surlignage/le scroll retombent bien sur la bonne position, et que le blocage après un bloc de code a disparu.

## 7. Contrôles Bluetooth/écran verrouillé : suivant/précédent change de paragraphe, artwork ajoutée
Signalé par Louis (23/08/2026) : le Bluetooth changeait de chapitre au lieu de paragraphe (voulu : paragraphe), et l'écran verrouillé n'affichait que pause/reprendre + ±10s + le sélecteur de périphérique audio, sans les flèches précédent/suivant.

- `nexttrack`/`previoustrack` (`js/router.js`) appellent maintenant `nextParagraph()`/`previousParagraph()` au lieu de changer de chapitre. Limite technique actée avec Louis : l'API MediaSession ne distingue pas un appui Bluetooth d'un tap sur les flèches de l'écran verrouillé -- les deux partagent forcément le même comportement, paragraphe pour les deux.
- Ajout d'une `artwork` (`icons/icon-192.png`/`icon-512.png`) au `MediaMetadata` : sans image, iOS retombe sur ses boutons ±10s génériques au lieu d'afficher précédent/suivant -- cause probable de l'absence des flèches, à confirmer sur iPhone (pas vérifiable sans device).
- Reste à Louis : confirmer sur iPhone, écran verrouillé, que les flèches précédent/suivant apparaissent bien et changent de paragraphe (et pas de chapitre).

## 8. Auto-advance vers le chapitre suivant : le délai de 5s ne s'écoulait pas si verrouillé
Signalé par Louis (23/08/2026) : le délai avant de passer automatiquement au chapitre suivant reposait sur un `setTimeout`, suspendu par iOS une fois l'écran verrouillé -- le changement de chapitre n'arrivait donc jamais tout seul en poche. Corrigé (23/08/2026) : `playAutoAdvanceSilence()` (`js/reader.js`) fait jouer un clip silencieux de 5s à travers le même `audioEl` que la lecture pré-générée, dont les événements continuent d'arriver même verrouillé.
- Reste à Louis : confirmer sur iPhone, écran verrouillé, qu'un chapitre qui se termine enchaîne bien tout seul sur le suivant après 5s.

## 9. Répétitions de mots en milieu de phrase (surtout à vitesse élevée) : corrigé (hypothèse), à confirmer
Signalé à nouveau par Louis (30/08/2026), cette fois avec un exemple précis à ×1.5 (plusieurs clauses courtes à la suite : "Piège : chercher à réparer une commande..."). Même famille que le bégaiement occasionnel du 29/08 ("lit 2 fois le début du premier mot"). Nouvelle hypothèse, plus solide : le rattrapage du `timeupdate` (`js/reader.js`) suppose les clips MP3 parfaitement concaténés sans blanc, mais un vrai encodage laisse quelques ms de flou d'alignement par frame -- plus le rattrapage saute d'entrées courtes d'un coup (plus probable à vitesse élevée), plus ce flou peut faire atterrir `currentTime` juste hors de la plage revendiquée par l'entrée cible, déclenchant un seek arrière inutile qui répète un bout d'audio déjà joué. Corrigé avec une tolérance de 100ms (`ENTRY_BOUNDARY_TOLERANCE_SECONDS`, `speakNextViaAudio()`).
- Reste à Louis : confirmer sur la phrase signalée à ×1.5, et plus généralement que les répétitions ont disparu à vitesse élevée. Pas vérifiable à l'oreille depuis le sandbox de cette session.

## 10. Tester l'audio prégénéré C/C++/PHP/SQL/Git (4 langues)
Prégénéré (23/08/2026) via `scripts/generate-audio.mjs --context=c,cpp,php,git` (SQL déjà fait) : 60 chapitres, 4 langues, namespacés par dossier catégorie/sujet (`audio/<lang>/<catégorie>[/<sujet>]/<chapitreId>`) pour éviter la collision d'id corrigée le même jour (ex. `variables` existait à la fois en C et PHP).
- Reste à Louis : écouter quelques chapitres de chaque sujet sur iPhone, confirmer que l'audio prégénéré se charge bien (pas de repli silencieux sur `speechSynthesis`) et que la prononciation correspond à la table déjà validée.

## 11. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16) : deux correctifs déjà tentés, sans effet
Signalé par Louis (25/08/2026) : le fond stylisé des pages chapitre (`css/content.css`, `.page::before` — pointillés + halo chaud/froid) reste gris uni sur son iPhone (iOS 16.7.16, Safari), y compris en navigation privée (cache écarté), alors qu'il s'affiche normalement sur desktop. Reproduit sur tous les chapitres (pas spécifique au nouveau chapitre OS qui a révélé le bug), pas seulement en PWA installée.

Deux hypothèses testées et invalidées par le retest de Louis :
1. `color-mix()` non supporté sur mobile ancien → couches concernées isolées dans un `@supports`. Insuffisant : iOS 16.7.16 est censé supporter `color-mix()` (support Safari depuis 16.2), donc `@supports` réactivait la même déclaration combinée, toujours grise.
2. `color-mix()` retiré entièrement, remplacé par des `rgba()` + triplets RGB précalculés (`--accent-rgb`/`--accent-warm-rgb` dans `base.css`), sur l'hypothèse d'un bug de rendu WebKit spécifique à `color-mix()` comme stop de couleur. Toujours gris après redéploiement confirmé (CSS de prod vérifié à jour) et retest en navigation privée.

Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`) : la piste "fonction CSS non supportée" est probablement épuisée, ce qui pointe plutôt vers autre chose (le pseudo-élément entier qui ne se peint pas, plutôt qu'une seule couche de fond qui échoue) — voir `journal-de-bord.md` pour le détail des deux tentatives.

Test demandé à Louis avant de tenter un 3ᵉ correctif à l'aveugle (pour savoir si le bug dépend de la largeur mobile ou du moteur WebKit lui-même, indépendamment de la largeur) : sur la page d'un chapitre, bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement une fois en mode "version pour ordinateur" (toujours sur le téléphone). Si le test ne suffit pas à trancher, l'étape suivante est un accès à l'inspecteur Safari distant (via un Mac connecté à l'iPhone) plutôt que de continuer à deviner sans données réelles de l'appareil.

## 12. Audio Git/PHP/PowerShell/Zsh/HTML/CSS/Blockchain/SQL régénéré avec la prononciation stabilisée : à confirmer
Prononciation FR sur l'accueil (détail des retouches dans `journal-de-bord.md`) : sigles en MAJUSCULES épelés lettre par lettre séparées par un tiret (règle standard désormais, ex. `Z-S-H`) ; exceptions listées dans `ACRONYM_OVERRIDES_FR` (`js/reader-pronunciation.js`) pour les sigles qui restent mal prononcés même au tiret simple (UI/UX `U-I, U-X`, SQL `S-Q-L`) ; PowerShell (`Powe-eur-shell`), Git (`Gui tte`), Blockchain (`Block cheine`). Audio FR régénéré pour ces 7 sujets/catégories (01/09/2026, en plus des chapitres déjà couverts par le point 1) ; SQL l'était déjà.
- Reste à Louis : confirmer à l'oreille sur l'accueil et sur ces sujets, notamment SQL (respelling au tiret jamais confirmé). Décider si une régénération FR complète du reste du site est justifiée maintenant : le changement d'algorithme de segmentation du 30/08 (point 16) invalide potentiellement l'audio de toute page pas encore régénérée depuis.
- Reste à Louis : confirmer à l'oreille sur l'accueil, chaque point ci-dessus, notamment SQL.

## 16. Session prononciation/lecture du 30/08 : gros lot à confirmer à l'oreille
Détail complet dans `journal-de-bord.md` (section du 30/08/2026). Uniquement régénéré : sujet "Bases de l'informatique" en FR (9 chapitres). Points corrigés ce jour, tous en attente d'écoute :
- Bug de segmentation (lien markdown collé à une ponctuation de fin de clause, ex. "Pythonne" au lieu de "Python") et bug de voix (span de code inchangé plié dans la phrase sans vérifier la langue requise, ex. ".txt" perdait son "point") -- tous deux dans `js/reader.js`.
- Voix anglaise par défaut sur tout le code inline (demande explicite de Louis) : un identifiant d'exemple français sans accent (`nom_dossier`) n'a aucun signal pour rester en français et basculera aussi en anglais si personne ne le signale.
- `` [`code`](url) `` (span de code utilisé comme texte de lien) jamais reconnu comme du code -- corrigé génériquement, concerne 30 fichiers du site, seul `cmd.exe` (`le-terminal.md`) vérifié à l'oreille pour l'instant.
- Bandeau "chapitre suivant dans N secondes" : ne disparaissait pas au changement de page (corrigé), décompte rendu dynamique (5,4,3,2,1) à la demande de Louis.
- Lot de respellings FR (`.txt`, `macOS`, `GUI`/`CLI`, `User`, `Command`/`Command-Line`, `Cmd`/`Alt`, `cmd.exe`, `graphique`, `>`/`$`/`%` sur `le-terminal.md`) -- liste complète dans le journal.
- Piège cache navigateur ajouté au chapitre "Le serveur local" (4 langues) : un changement de port de serveur local est le correctif le plus fiable contre un contenu périmé, plus fiable qu'un Ctrl+Maj+R ou qu'"Effacer les données du site".
- Reste à Louis : écouter le sujet "Bases de l'informatique" en entier (au moins `le-terminal`, `code-programmes-et-fichiers`), confirmer chaque point ci-dessus ; relire le nouveau Piège cache dans "Le serveur local".

## 13. Section "Ce que couvre le site" de l'accueil : réécrite, à valider
Signalé par Louis (29/08/2026) : du nouveau contenu et des changements de structure de projet s'étaient accumulés depuis la dernière rédaction. Réécrite (`content/acceuil.md`) pour couvrir les 11 catégories actuelles (Sécurité, Tests, Blockchain, Gestion de projet et organisation, et la profondeur IA/Infrastructure ajoutées depuis n'étaient pas mentionnées), chaque sujet nommé relié à un chapitre représentatif ; liens vérifiés (`node scripts/generate-struct.js`, aucun lien cassé) et un cliqué en direct. "voix" reformulé en "voix IA" (Louis : plus clair). Audio FR régénéré à chaque changement de texte/prononciation.
- Reste à Louis : relire le choix des sujets mis en avant et la formulation, en français uniquement pour l'instant (EN/ES/BR pas encore mis à jour).

## 14. 5 nouveaux chapitres sur les algorithmes de ML classiques : à relire
Écrits (29/08/2026) suite à un reel Instagram (@rick.theengineer) comparant 5 algorithmes sur un même graphe : `content/Données/Data Science/regression-lineaire.md`, `regression-logistique.md`, `arbres-de-decision.md`, `svm.md`, `k-plus-proches-voisins.md` (order 6 à 10, suite de `machine-learning-scikit-learn.md`). Plan zéro-connaissance appliqué (`plan-zero-connaissance.md`), liens internes validés (`node scripts/generate-struct.js`, 0 lien cassé), chaque chapitre relié aux notions déjà enseignées (produit scalaire, dérivée/gradient, probabilités) plutôt que de les répéter. Traduits EN/ES/BR le même jour (3 agents parallèles, 1 par langue), ancres recalculées sur les titres réellement traduits, liens validés dans les 4 arborescences (`content`/`content-en`/`content-es`/`content-br`). Audio FR généré le 01/09/2026.
- Reste à Louis : relire les 5 chapitres (FR d'abord, EN/ES/BR ensuite si tu veux vérifier la traduction).

## 15. Nouveau chapitre "Le serveur local" : à relire
Écrit (29/08/2026) suite à la propre question de Louis sur comment lancer un serveur statique pour ses tests d'écoute : `content/Fondamentaux/Bases de l'informatique/serveur-local-de-developpement.md` (order 8, fin de la rubrique). Traduit EN/ES/BR le même jour (3 agents parallèles, 1 par langue). Liens internes validés (`node scripts/generate-struct.js`, 0 lien cassé). Audio FR généré le 01/09/2026.
- Reste à Louis : relire (FR d'abord).

## 17. Chapitre SQL (`content/Langages/Domain-specific Languages (DSL)/sql.md`) : à relire
- Reste à Louis : relire les ajouts du 01/09/2026 (DDL/DML, `CREATE TABLE`, index, `ALTER TABLE`, `NULL` vs sentinelle, `pyodbc`, SCD2 ; détail et raison des choix dans `journal-de-bord.md`), FR d'abord, EN/ES/BR ensuite si tu veux vérifier la traduction. Audio FR déjà régénéré (point 1).

## 18. Nouvelle notion candidate : comment Claude Code utilise Bash ET PowerShell en même temps
Question de Louis (02/09/2026) en session `git-scrapping-infomediaires` : il a remarqué que Claude exécute parfois des commandes Bash (syntaxe Unix, `/dev/null`, etc.) alors que son terminal réel est PowerShell, et voulait comprendre le mécanisme.

Explication à retranscrire dans un futur chapitre (rubrique la plus proche : `content/Fondamentaux/Bases de l'informatique/` ou une rubrique dédiée à l'outillage Claude Code si elle existe déjà) :
- Claude Code expose à Claude deux outils shell distincts et permanents : un outil "Bash" et un outil "PowerShell". Ce ne sont pas des vues sur le terminal visible de l'utilisateur, ce sont deux intégrations séparées du harnais.
- Sur Windows, l'outil "Bash" ne lance pas `cmd.exe` : il lance **Git Bash** (le shell POSIX fourni avec Git pour Windows), s'il est installé. D'où la syntaxe Unix (`/dev/null`, guillemets simples, `$VAR`) qui fonctionne même si l'utilisateur a ouvert une fenêtre PowerShell.
- L'outil "PowerShell" lance lui `powershell.exe` et attend une syntaxe PowerShell (`$env:VAR`, pas de `&&`/`||` sous PowerShell 5.1, etc.).
- Le choix entre les deux à chaque commande est fait par le modèle (Claude), pas imposé par le terminal dans lequel la session a été démarrée — d'où l'impression que "l'interface Windows" reste accessible même en écrivant des commandes Bash.
- Piège pédagogique à mentionner : ça explique pourquoi mélanger les deux syntaxes dans un seul appel (ex. un pipe Unix passé à PowerShell) échoue, et pourquoi corriger un souci de syntaxe demande d'abord d'identifier quel outil a réellement été appelé.
- Reste à Louis : valider l'angle (chapitre outillage Claude Code vs terminal en général) avant rédaction, suivre `plan-zero-connaissance.md` pour le niveau de langage.

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL (déjà validés le 2026-08-15) ; Git/PHP retirés de cette liste suite au point 12 ci-dessus (leur validation du 15/08 ne couvrait pas ces prononciations précises).
