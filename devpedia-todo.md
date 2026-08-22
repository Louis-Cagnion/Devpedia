# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `prompt.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Catégorie Blockchain
Catégorie créée, premier chapitre en place (concepts fondamentaux : bloc, hash, consensus, smart contract — fait le 22/08/2026). Traitée en profondeur (plusieurs chapitres à terme, Solidity/smart contracts/réseaux type Avalanche/backends sur ICP), à trancher en écrivant comme la section Tests.

## 2. Section Automatisation (n8n)
Ordre déjà validé par Louis (19/08/2026), du plus rapide au plus lent :

1. **Chapitre n8n « Prise en main de l'interface »** (canvas, nœuds, connexions, panneau d'exécution, test manuel avant activation).
2. **Chapitre n8n « Catalogue des fonctionnalités / types de nœuds »** (trigger, action, code node JS/Python, nœuds conditionnels/branchement, error workflow).
3. **Chapitre n8n « Le format JSON d'un workflow »** (structure de l'export, portabilité entre instances, import/export, versionner comme du code) : nécessite d'exporter et d'inspecter un vrai workflow avant de rédiger, pas juste de la description théorique.
4. **Chapitre n8n « L'industrialisation »** (self-hosted vs n8n cloud, variables d'environnement, credentials, environnements dev/prod, supervision des exécutions, sécurité de l'éditeur/restriction des nœuds sensibles comme Execute Command) : le plus transversal, donc le plus long à structurer.
5. Potentiellement d'autres chapitres n8n, à compléter en écrivant (même logique que la section Tests ci-dessous).

Décision restante à trancher avant d'écrire les chapitres n8n : contenu générique (l'outil vu de l'extérieur) ou documentant aussi l'usage concret de ce dépôt (le workflow d'orchestration nocturne de `git-scrapping`, cf. section « Automatic orchestration (n8n) » du README) — risque de mélanger doc générale et doc spécifique à un projet.

## 3. Lecteur audio — enchaînement automatique au chapitre suivant
Aujourd'hui `reader-control.js` ne connaît que la navigation par paragraphe (`previousParagraph`/`nextParagraph`) au sein d'un même chapitre ; pas de notion de « chapitre suivant/précédent » au sens navigation entre pages (`?c=...&p=...`). À construire :
- Détection de fin de lecture du chapitre.
- Timer de 5s annulable par un clic sur n'importe quel contrôle du lecteur.
- Résolution du chapitre suivant dans `structure/struct.json` (respecter l'ordre des `chapters`/`subjects`, y compris le passage d'une catégorie à la suivante en fin de catégorie).

## 4. Lecteur audio — synchronisation boutons médias Bluetooth
Permettre suivant/précédent/lecture-pause depuis un casque Bluetooth, comme pour de la musique.
- Mécanisme : [MediaSession API](https://developer.mozilla.org/fr/docs/Web/API/MediaSession) (`navigator.mediaSession.setActionHandler('nexttrack'/'previoustrack'/'play'/'pause', ...)`) — aucune intégration actuelle (`mediaSession` absent de `js/`).
- Se brancher sur la même notion de « chapitre suivant/précédent » que la tâche 3, plutôt que dupliquer la logique.
- `pause`/`play` synchronisé dans les deux sens avec le bouton déjà présent (`primaryButton` dans `reader-control.js`) : un appui Bluetooth met à jour l'état visuel du bouton, et inversement un clic met à jour `navigator.mediaSession.playbackState`.
- Vitesse de lecture : exposer un contrôle (lent/normal/rapide ou slider) branché sur `SpeechSynthesisUtterance.rate` (`js/reader.js`) — indépendant de MediaSession, à traiter dans la même tâche puisque ça touche le même écran de contrôle.

## 4bis. Lecture écran verrouillé / téléphone en poche (Bluetooth) — **décision structurelle bloquante**
Objectif de Louis (21/08/2026) : pouvoir lire en marchant, casque Bluetooth, téléphone verrouillé et en poche, sans avoir à le tenir ni le garder allumé.

**Constat qui remet en cause l'approche actuelle** : le lecteur repose sur `window.speechSynthesis` (Web Speech API, `js/reader.js:25-26`), pas sur un élément `<audio>`. Or `speechSynthesis` n'est pas traité par les navigateurs mobiles comme une vraie lecture média — Chrome et Safari le suspendent quand l'onglet perd le focus ou que l'écran se verrouille (comportement particulièrement agressif sur iOS Safari). MediaSession (tâche 4) résout la synchronisation des boutons Bluetooth, mais ne garantit pas que le son continue une fois l'écran verrouillé : ce sont deux problèmes distincts.

Ce qui fonctionne de façon fiable dans ce cas (mécanisme utilisé par tout lecteur audio/podcast web) : un élément `<audio>` qui joue un **fichier audio pré-généré** (pas de synthèse vocale en direct dans le navigateur), couplé à MediaSession — c'est ce que l'OS reconnaît comme une session de lecture média légitime à maintenir en arrière-plan.

Décision à trancher avec Louis avant d'investir dans les tâches 3/4 en profondeur (impact architecture, pas juste une option de plus) :
- **Pré-générer l'audio** (moteur TTS type Piper/Coqui — auto-hébergé, gratuit — ou API cloud type Google Cloud TTS/Amazon Polly/Azure/ElevenLabs, exécuté à la publication du chapitre, fichier audio stocké/caché par paragraphe ou chapitre, servi via `<audio>`) : lecture fiable écran verrouillé, la vitesse reste ajustable en direct (`audio.playbackRate`, comme `SpeechSynthesisUtterance.rate` aujourd'hui — pas de perte sur ce point). Coût réel : pipeline de génération/stockage à construire, et un fichier figé par voix/langue (déjà aligné avec la structure `content-<lang>/` existante) au lieu du choix de voix instantané actuel du navigateur. Un moteur auto-hébergé permettrait probablement de réutiliser la table de prononciation custom (`reader-pronunciation.js`) plus facilement qu'une voix cloud générique — à vérifier au moment de choisir.
- **Garder `speechSynthesis` en direct** : le plus simple à maintenir, mais le confort visé (poche, écran verrouillé) restera probablement irréalisable de façon fiable multi-navigateurs, quel que soit l'effort mis dans MediaSession/Wake Lock.

Une fois cette décision tranchée en faveur du pré-rendu : mettre à jour `content/IA/Voix IA/choisir-fournisseur-mise-en-production.md`, qui justifie aujourd'hui le choix de la Web Speech API par le fait que Devpédia est « 100% statique... sans serveur ni étape de build » (confirmé au passage : `.github/workflows/pages.yml` ne fait que checkout + upload, aucun build actuellement). Un pré-rendu audio (ex. Piper exécuté à la publication) introduirait une **étape de build** sans nécessiter de **serveur d'inférence live** — nuance absente du chapitre, qui traite aujourd'hui les deux comme un seul bloc. À corriger dans ce chapitre seulement une fois 4bis effectivement implémenté, pas avant (éviter de documenter une architecture qui n'existe pas encore).
- Piste intermédiaire à vérifier expérimentalement avant de trancher : tester en conditions réelles (écran verrouillé, Android puis iOS) si un `MediaSession.playbackState = "playing"` actif suffit à prolonger `speechSynthesis` au-delà de quelques secondes — les sources consultées le 21/08/2026 ne confirment ce comportement sur aucune plateforme.

## 5. Nouvelle catégorie : Tests
Aucune catégorie dédiée à la méthodologie de test logiciel aujourd'hui (`tests-et-audit-de-securite.md` dans `Cybersécurité` couvre l'audit sécu, pas ça). Section complète demandée, pas des chapitres isolés.

Chapitres demandés explicitement :
- **Vocabulaire QA (ISTQB)** : terminologie normalisée (cas de test, plan de test, non-régression, critère de sortie...) — fondation pour le reste de la section.
- **Pyramide de test** : répartition unitaire/intégration/end-to-end, pourquoi peu de tests lents et beaucoup de tests rapides, anti-pattern du « cône de glace » inversé.
- **Architecture de test** : organisation d'une suite de tests (arborescence, fixtures, environnements, test doubles/mocks/stubs), comment rester maintenable.

À compléter en écrivant (pas figé) pour une section réellement complète : tests unitaires, tests d'intégration, tests end-to-end, TDD, mocks/stubs/fakes en détail, couverture de code (et ses pièges : 100% de couverture ≠ absence de bugs), et si le niveau « bonnes pratiques avancées » est visé — property-based testing, tests de mutation.

## 6. Section prompt engineering (developpement approfondi)
Objectif de Louis : aller beaucoup plus loin que l'existant, jusqu'à pouvoir lancer un seul prompt et laisser l'IA mener un projet de A à Z sans s'arrêter, en choisissant elle-même les meilleures options (dépendances, librairies, fonctions, outils, variables, techniques, bonnes pratiques) selon le but recherché, from scratch ou non. Il faut notamment identifier à l'avance quelles informations l'IA a besoin pour y arriver.

Point explicite de Louis, à respecter avant de rédiger quoi que ce soit : sa vision n'est pas à prendre pour acquise. Il veut un vrai débat sur le fonctionnement réel du prompt engineering, pas une section qui va dans son sens pour lui faire plaisir — contester son point de vue et proposer d'autres approches si elles sont plus justes.

Étape 1 (avant toute rédaction) : discussion avec Louis pour caler l'angle de la section, en s'appuyant sur le fonctionnement réel de l'IA plutôt que sur l'intuition de Louis seule.

## 9. Nouvelle catégorie : Gestion de projet
Catégorie créée, `methodologies-agile-scrum-kanban.md` déplacé et premier chapitre en place (fait le 22/08/2026). Reste à ajouter des chapitres.

- **Chapitres à ajouter** (pas figé, à trancher en écrivant, « et plus si affinité ») : backlog et user stories (rédaction, critères d'acceptation, INVEST) ; estimation (points de complexité vs estimation en temps, planning poker) ; outils de suivi (board physique/Jira/Trello/Linear, ticket, epic) ; éventuellement SAFe/Scrumban pour les cas hybrides, OKR pour le lien objectifs ↔ exécution.
- **Vérifié le 21/08/2026** : la notion de backlog n'est nulle part expliquée en profondeur dans le site aujourd'hui, seulement nommée sans lien dans `CI-CD/azure-devops-plateforme.md` (tableau des services Boards) et dans `Organisation en entreprise/roles-equipe-developpement.md` (rôle du Product Owner). Une fois le chapitre « backlog et user stories » ci-dessus écrit, mettre à jour ces deux chapitres pour y ajouter un lien vers lui (règle 7bis de `prompt.md` : jargon nommé doit être défini ou lié).

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL/Git/PHP (déjà validés le 2026-08-15).
- **Symboles rares en prose non traités** (`↔`, `±`, `…`, `·` isolé) : laissés de côté, trop peu d'occurrences (1-2 chacun) pour justifier le travail dans l'immédiat.
