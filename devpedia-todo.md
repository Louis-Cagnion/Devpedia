# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `prompt.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Catégorie Blockchain
Catégorie créée, premier chapitre en place (concepts fondamentaux : bloc, hash, consensus, smart contract — fait le 22/08/2026). Traitée en profondeur (plusieurs chapitres à terme, Solidity/smart contracts/réseaux type Avalanche/backends sur ICP), à trancher en écrivant comme la section Tests.

## 2. Section Automatisation (n8n)
Ordre déjà validé par Louis (19/08/2026), du plus rapide au plus lent :

Chapitres faits le 22/08/2026 : « Prise en main de l'interface » (canvas, nœuds, connexions, panneau d'exécution, test manuel), « Catalogue des fonctionnalités / types de nœuds » (trigger, action, code node JS/Python, nœuds conditionnels/branchement, error workflow), « Le format JSON d'un workflow » (structure nodes/connections, credentials en référence, format des données, versionner comme du code — vérifié auprès de la doc officielle n8n avant rédaction, pas de théorie non vérifiée).

Restants :
1. **Chapitre n8n « L'industrialisation »** (self-hosted vs n8n cloud, variables d'environnement, credentials, environnements dev/prod, supervision des exécutions, sécurité de l'éditeur/restriction des nœuds sensibles comme Execute Command) : le plus transversal, donc le plus long à structurer.
2. Potentiellement d'autres chapitres n8n, à compléter en écrivant (même logique que la section Tests ci-dessous).

**Décidé (22/08/2026)** : contenu générique uniquement (l'outil vu de l'extérieur), sans documenter l'usage concret de ce dépôt par `git-scrapping` — évite de mélanger doc générale et doc spécifique à un projet. Le cas `git-scrapping` peut être mentionné en exemple ponctuel sans devenir le fil conducteur. Plus rien ne bloque l'écriture.

## 3. Lecture écran verrouillé / téléphone en poche (Bluetooth) — **décision structurelle bloquante**
Objectif de Louis (21/08/2026) : pouvoir lire en marchant, casque Bluetooth, téléphone verrouillé et en poche, sans avoir à le tenir ni le garder allumé.

**Constat qui remet en cause l'approche actuelle** : le lecteur repose sur `window.speechSynthesis` (Web Speech API, `js/reader.js:25-26`), pas sur un élément `<audio>`. Or `speechSynthesis` n'est pas traité par les navigateurs mobiles comme une vraie lecture média — Chrome et Safari le suspendent quand l'onglet perd le focus ou que l'écran se verrouille (comportement particulièrement agressif sur iOS Safari). La synchronisation Bluetooth (play/pause/piste suivante-précédente via MediaSession API, livrée le 22/08/2026) résout la synchronisation des boutons, mais ne garantit pas que le son continue une fois l'écran verrouillé : ce sont deux problèmes distincts.

Ce qui fonctionne de façon fiable dans ce cas (mécanisme utilisé par tout lecteur audio/podcast web) : un élément `<audio>` qui joue un **fichier audio pré-généré** (pas de synthèse vocale en direct dans le navigateur), couplé à MediaSession — c'est ce que l'OS reconnaît comme une session de lecture média légitime à maintenir en arrière-plan.

**Décidé (22/08/2026)** : tester d'abord la piste intermédiaire avant de choisir entre pré-générer l'audio ou garder `speechSynthesis` en direct — inutile d'investir dans un pipeline de pré-génération si l'intermédiaire suffit.

**Bloqué sur un test que seul Louis peut faire** (nécessite un vrai téléphone, écran verrouillé — hors de portée d'un navigateur desktop automatisé) : avec la synchronisation Bluetooth déjà en place (`js/router.js`, `navigator.mediaSession.playbackState` mis à jour automatiquement), vérifier en conditions réelles (Android puis iOS, écran verrouillé, casque Bluetooth connecté) si `MediaSession.playbackState = "playing"` actif suffit à prolonger `speechSynthesis` au-delà de quelques secondes. Les sources consultées le 21/08/2026 ne confirment ce comportement sur aucune plateforme.
- **Si ça marche** : rien à construire, l'architecture actuelle suffit déjà.
- **Si ça ne marche pas** : retrancher alors entre pré-générer l'audio (impact architecture, cf. options détaillées dans `journal-de-bord.md`) et abandonner cet objectif de confort.

Une fois une architecture pré-rendue effectivement implémentée (si retenue) : mettre à jour `content/IA/Voix IA/choisir-fournisseur-mise-en-production.md`, qui justifie aujourd'hui le choix de la Web Speech API par le fait que Devpédia est « 100% statique... sans serveur ni étape de build » (confirmé au passage : `.github/workflows/pages.yml` ne fait que checkout + upload, aucun build actuellement). Un pré-rendu audio (ex. Piper exécuté à la publication) introduirait une **étape de build** sans nécessiter de **serveur d'inférence live** — nuance absente du chapitre, qui traite aujourd'hui les deux comme un seul bloc. À corriger dans ce chapitre seulement une fois ce point effectivement implémenté, pas avant (éviter de documenter une architecture qui n'existe pas encore).

## 4. Catégorie Tests
Catégorie créée, les 3 chapitres explicitement demandés en place (vocabulaire QA/ISTQB, pyramide de test, architecture de test — faits le 22/08/2026). Section complète demandée, pas des chapitres isolés.

À compléter en écrivant (pas figé) pour une section réellement complète : tests unitaires, tests d'intégration, tests end-to-end, TDD, mocks/stubs/fakes en détail, couverture de code (et ses pièges : 100% de couverture ≠ absence de bugs), et si le niveau « bonnes pratiques avancées » est visé — property-based testing, tests de mutation.

## 5. Nouvelle catégorie : Gestion de projet
Catégorie créée, 2 chapitres en place (méthodologies Agile/Scrum/Kanban, backlog et user stories — faits le 22/08/2026, avec lien ajouté depuis `azure-devops-plateforme.md` et `roles-equipe-developpement.md`). Reste à ajouter des chapitres.

- **Chapitres à ajouter** (pas figé, à trancher en écrivant, « et plus si affinité ») : estimation (points de complexité vs estimation en temps, planning poker) ; outils de suivi (board physique/Jira/Trello/Linear, ticket, epic) ; éventuellement SAFe/Scrumban pour les cas hybrides, OKR pour le lien objectifs ↔ exécution.

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL/Git/PHP (déjà validés le 2026-08-15).
- **Symboles rares en prose non traités** (`↔`, `±`, `…`, `·` isolé) : laissés de côté, trop peu d'occurrences (1-2 chacun) pour justifier le travail dans l'immédiat.
