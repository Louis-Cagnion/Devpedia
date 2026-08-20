# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

## 1. Chapitres isolés issus de l'audit cursus 42 (`../42Cursus`)
Un chapitre chacun, contenu bien cadré, aucune dépendance entre eux. Traduire FR/EN/ES/BR comme le reste du site.

- **Rendu 3D bas niveau et fenêtrage** (raycasting façon Wolfenstein, MinilibX/X11 — vu dans `Cub3D`/`fract-ol`) : nouvelle petite catégorie « Graphisme », ou sous-catégorie de `Bases de l'informatique` — décision structurelle à trancher avec Louis avant d'écrire (impact site-wide comme pour la catégorie Automatisation).
- **ORM** (mapping objet-relationnel, migrations, type-safety, ex. Prisma) : nouveau chapitre dans `Bases de données` (nouvelle sous-catégorie si le sujet prend de l'ampleur : migrations, requêtes type-safe, N+1).
- **WAF (ModSecurity) + gestion de secrets dédiée (HashiCorp Vault)** : `Cybersécurité`, à côté de `securite-api-web.md`.
- **ELK (Elasticsearch/Logstash/Kibana)** pour l'agrégation de logs, à distinguer du monitoring par métriques (déjà couvert ailleurs) : `Docker` ou `Infrastructure`.
- **PWA** (offline, installabilité, service workers) : `Infrastructure`, ou nouvelle sous-catégorie web dédiée.
- **SSR vs rendu côté client (SPA/CSR)** : `Langages de programmation/JavaScript`.
- **i18n et RTL** : `UI-UX`, à côté de `accessibilite-ux.md`.
- **IA de jeu par imitation** (comportement d'un adversaire appris depuis des enregistrements de parties humaines + dégradation volontaire de précision pour simuler la fatigue) : dans `IA`, sous-catégorie à trancher en écrivant (potentiellement nouvelle « IA/Jeux et agents » si d'autres notions du même genre s'accumulent).
- **Blockchain et smart contracts** (Solidity, réseaux type Avalanche, backends sur ICP) : décision à prendre — nouvelle catégorie top-level « Blockchain » si traité en profondeur, sinon chapitre isolé pour une introduction générale.

## 2. Section Automatisation (n8n)
Ordre déjà validé par Louis (19/08/2026), du plus rapide au plus lent :

1. **Décision structurelle** (bloquant pour la suite) : nouvelle catégorie top-level « Automatisation » sortie d'`Infrastructure` (implique de mettre à jour `structure/struct.json` + les 3 variantes langue, et de déplacer le contenu dans `content/` + les 3 dossiers `content-<lang>/`) vs. garder dans `Infrastructure` en convertissant sa liste plate de chapitres en `subjects` (touche aussi les chapitres non liés à l'automatisation : `api-et-http`, `json`, `cpu-vs-gpu`, `le-cloud`).
2. **Déplacer `automatisation-workflow.md`** (déjà écrit et traduit EN/ES/BR) vers la sous-catégorie « Fonctionnement général » : déplacement de fichier + mise à jour de `struct.json` (+ 3 variantes langue), sans réécrire le contenu.
3. **Chapitre n8n « Prise en main de l'interface »** (canvas, nœuds, connexions, panneau d'exécution, test manuel avant activation).
4. **Chapitre n8n « Catalogue des fonctionnalités / types de nœuds »** (trigger, action, code node JS/Python, nœuds conditionnels/branchement, error workflow).
5. **Chapitre n8n « Le format JSON d'un workflow »** (structure de l'export, portabilité entre instances, import/export, versionner comme du code) : nécessite d'exporter et d'inspecter un vrai workflow avant de rédiger, pas juste de la description théorique.
6. **Chapitre n8n « L'industrialisation »** (self-hosted vs n8n cloud, variables d'environnement, credentials, environnements dev/prod, supervision des exécutions, sécurité de l'éditeur/restriction des nœuds sensibles comme Execute Command) : le plus transversal, donc le plus long à structurer.
7. Potentiellement d'autres chapitres n8n, à compléter en écrivant (même logique que la section Tests ci-dessous).

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

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL/Git/PHP (déjà validés le 2026-08-15).
- **Symboles rares en prose non traités** (`↔`, `±`, `…`, `·` isolé) : laissés de côté, trop peu d'occurrences (1-2 chacun) pour justifier le travail dans l'immédiat.
