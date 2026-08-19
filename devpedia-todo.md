# TODO — Devpedia

## Lecture audio automatique du site (priorité de la prochaine session)
- Symboles rares en prose non traités (`↔`, `±`, `…`, `·` isolé) : laissés de côté faute de volume (1-2 occurrences chacun).
- Table de prononciation des symboles (`js/reader-pronunciation.js`) à valider mot à mot par Louis, chapitre par chapitre : reste tout hors C/C++/SQL/Git/PHP, déjà testés en écoute directe le 2026-08-15 (modulo/times/bitwise, XOR, emoji 📋, flèche →, ≈/≥/≠/°).
- **Enchaînement automatique au chapitre suivant** (demandé le 19/08/2026) : à la fin de la lecture d'un chapitre, si aucun clic n'est fait dans les 5s, lancer automatiquement la lecture du chapitre suivant. Aujourd'hui `reader-control.js` ne connaît que la navigation par paragraphe (`previousParagraph`/`nextParagraph`) au sein d'un même chapitre - il n'existe pas encore de notion de "chapitre suivant/précédent" au sens navigation entre pages (`?c=...&p=...`). À construire : détection de fin de lecture du chapitre, timer de 5s annulable par un clic (sur n'importe quel contrôle du lecteur), résolution du chapitre suivant dans `structure/struct.json` (respecter l'ordre des `chapters`/`subjects`, y compris le passage d'une catégorie à la suivante en fin de catégorie).
- **Synchronisation avec les boutons médias Bluetooth** (suivant/précédent/lecture-pause, demandé le 19/08/2026) : permettre de passer au chapitre suivant/précédent et de mettre en pause/reprendre la lecture depuis un casque/oreillettes Bluetooth, comme pour de la musique. Mécanisme naturel côté navigateur : la [MediaSession API](https://developer.mozilla.org/fr/docs/Web/API/MediaSession) (`navigator.mediaSession.setActionHandler('nexttrack'/'previoustrack'/'play'/'pause', ...)`) - aucune intégration de ce type actuellement dans `js/` (aucun fichier ne référence `mediaSession`). Le `pause`/`play` doit rester synchronisé dans les deux sens avec le bouton pause/reprise déjà présent dans `reader-control.js` (`primaryButton`) - un appui Bluetooth doit mettre à jour l'état visuel du bouton, et inversement un clic sur le bouton doit mettre à jour l'état rapporté à `navigator.mediaSession.playbackState`. À brancher sur la même notion de "chapitre suivant/précédent" que le point ci-dessus plutôt que de dupliquer la logique.

## Cursus 42 (notions abordées, absentes de Devpedia)
Audit complet du repo `../42Cursus` le 17/08/2026 (les 7 cercles, code réel lu projet par projet - pas une déduction depuis les noms de dossiers). Deux limites assumées : les sujets PDF originaux ne sont pas commités dans un repo 42 (règle de redistribution), donc les notions viennent du CODE produit, pas de l'énoncé complet ; et les modules C++ 05-09 (Cercle 6) étaient des submodules vides (dossiers ajoutés sans avoir retiré leur `.git` interne, jamais `.gitmodules` créé) - contenu récupéré depuis l'historique git du dépôt (un commit antérieur au remplacement par le lien vide contenait encore les vrais fichiers), donc vérifié malgré tout. Les parties bonus ont été faites sur tous les projets sauf `inception` (confirmé par Louis) : à considérer comme couvertes même sans fichier `_bonus` visible partout.

Comparé au contenu déjà existant (déjà très complet : `IA/Vision et OCR`, `Traitement de documents`, `Performance`, `Qualité et architecture du code`, `Langages de programmation/C`+`C++`, `Docker`, `Cybersécurité`, `Authentification` couvrent une bonne partie du cursus). Manques réels trouvés (0 occurrence vérifiée par recherche dans tout `content/`) :

5 premiers points traités le 18/08/2026 (rédigés en FR puis traduits EN/ES/BR par 3 agents en parallèle, catégories **Réseaux**, **Algorithmes**, **Administration système** + chapitre `cast-cpp` dans C++) : sockets/E-S non bloquante, fondamentaux réseau, algorithmique tri/complexité, cast C++, administration système/durcissement. Reliquat traité le même jour : chapitre `supervision-systeme` ajouté à `Administration système` (`/proc`, commandes dédiées) et traduit dans les 3 langues.

- **Rendu 3D bas niveau et fenêtrage** (raycasting façon Wolfenstein, boucle de rendu manuelle, MinilibX/X11 comme bibliothèque graphique fournie) : 0 occurrence. Vu dans `Cub3D` et `fract-ol` (fractales, même bibliothèque). Recommandation : plus niche que les précédents - un chapitre suffirait, sous une nouvelle petite catégorie "Graphisme" ou en sous-catégorie de `Bases de l'informatique` si on ne veut pas créer une catégorie pour un seul chapitre.

Précisions apportées le 17/08/2026 en lisant le README réel de `transcendence` (stack et modules confirmés, pas déduits) :
- **WebSocket / Socket.IO** (protocole applicatif temps réel bidirectionnel, au-dessus de TCP) : confirmé utilisé pour la synchronisation du jeu Pong en direct - 0 occurrence dans Devpedia. Recommandation : chapitre dans `Infrastructure`, à côté de `api-et-http.md` (même niveau : protocole web, pas socket bas niveau comme la piste "Réseaux" ci-dessus).
- **ORM** (mapping objet-relationnel, migrations, type-safety - Prisma confirmé) : 0 occurrence pertinente - `Bases de données` couvre l'entreposage/analytique (schéma en étoile, data lake), pas le mapping applicatif objet/table d'un backend. Recommandation : nouveau chapitre dans `Bases de données`, ou nouvelle sous-catégorie si le sujet prend de l'ampleur (migrations, requêtes type-safe, N+1).
- **Microservices comme patron d'architecture** (découpage en services à responsabilité unique, communication inter-service, déploiement/scaling indépendants - confirmé comme choix explicite d'architecture, pas juste "on utilise Docker") : 0 occurrence. Recommandation : chapitre dans `Qualité et architecture du code`, à côté de `responsabilite-unique-et-couplage.md` (même principe appliqué à l'échelle service plutôt que fonction/classe).
- **IA de jeu par imitation** (comportement d'un adversaire de jeu appris à partir d'enregistrements de parties humaines réelles, plus dégradation volontaire de précision pour simuler la fatigue - contribution personnelle confirmée sur ce projet) : 0 occurrence. Ne rentre dans aucune des 5 sous-catégories IA actuelles (Fondamentaux deep learning/NLP-LLM/Production et gouvernance/Vision et OCR/Voix IA) - à trancher en écrivant, potentiellement une nouvelle sous-catégorie "IA/Jeux et agents" si d'autres notions du même genre s'accumulent, sinon un chapitre isolé dans IA.
- 2FA/TOTP déjà couvert (`authentification-multifacteur.md`) - vérifié, pas un manque malgré la présence confirmée dans `transcendence`.

Pistes supplémentaires du sujet réel `transcendence` (17/08/2026) : modules optionnels proposés que l'équipe n'a pas choisis, mais discutés/envisagés en faisant les choix d'équipe - à garder même sans preuve d'implémentation directe :
- **RAG et WCAG/accessibilité web** : déjà couverts (`IA/NLP et LLM/rag.md`, `UI-UX/accessibilite-ux.md` + plusieurs chapitres HTML) - pas un manque, vérifié pour ne pas les ajouter à tort.
- **WAF (Web Application Firewall) / ModSecurity + gestion de secrets dédiée (HashiCorp Vault)** : 0 occurrence de WAF/ModSecurity ; `gestion-des-secrets.md` couvre le principe général mais pas Vault spécifiquement. Recommandation : chapitre dans `Cybersécurité`, à côté de `securite-api-web.md`.
- **ELK (Elasticsearch/Logstash/Kibana) pour l'agrégation de logs** : Elasticsearch n'apparaît que comme exemple de runtime à heap géré (`Performance/heap-des-runtimes-manages.md`), jamais comme solution d'observabilité par logs - à distinguer du monitoring par métriques (Prometheus/Grafana, déjà couvert ailleurs). Recommandation : chapitre dans `Docker` ou `Infrastructure`, complémentaire à un futur chapitre metrics/monitoring.
- **PWA (Progressive Web App)** : offline, installabilité, service workers - 0 occurrence. Recommandation : chapitre dans `Infrastructure` ou une nouvelle sous-catégorie web dédiée.
- **SSR (Server-Side Rendering) vs rendu côté client (SPA/CSR)** : 0 occurrence. Recommandation : chapitre dans `Langages de programmation/JavaScript`, pertinent dès qu'un framework front (React et équivalents) y est traité.
- **i18n et RTL** (internationalisation, langues de droite à gauche) : 0 occurrence. Recommandation : chapitre dans `UI-UX`, à côté de `accessibilite-ux.md`.
- **Blockchain et smart contracts** (Solidity, réseaux comme Avalanche, backends sur ICP) : 0 occurrence, et aucune catégorie du tout dans la taxonomie actuelle. Recommandation : nouvelle catégorie **"Blockchain"** si le sujet doit être traité en profondeur, sinon un chapitre isolé pour une introduction générale.

Pistes trouvées le 17/08/2026 dans `../Ultimate_libft_C` (libft personnelle étendue, 150+ fonctions, hors périmètre officiel du cursus mais du code réellement écrit par Louis) :
- **Arithmétique en précision arbitraire sur chaînes** (`ft_multiply` : multiplier deux nombres trop grands pour un type natif, chiffre par chiffre comme à la main) : pas de chapitre dédié, mais `Représentation des données/entiers-et-debordements.md` est le foyer naturel pour l'étendre (le "pourquoi" du débordement y est déjà couvert, pas encore la technique de contournement par calcul sur chaîne).
- **Évaluateur d'expressions arithmétiques** (`calculate`, gestion de la précédence des opérateurs à partir d'une chaîne comme `"3 + 4 * 2"`) : 0 occurrence. Recommandation : chapitre dans `Domain-specific Languages (DSL)`, à côté de `parsing-incremental-machine-a-etats.md` (même famille : transformer une chaîne en résultat structuré/calculé).
- **Simuler des génériques en C par dispatch sur étiquette de type** (`one_for_all`/`all_for_one` : une fonction unique qui reçoit un `void*` et une chaîne indiquant le vrai type, pour se comporter différemment selon ce type - faute de vrais génériques dans le langage) : 0 occurrence. Recommandation : chapitre dans `Langages de programmation/C`, à côté de `pointeurs.md` - à mettre en regard de `templates.md` (C++) pour montrer la même intention (code générique) résolue différemment selon ce que le langage permet.

## Nouvelle catégorie : Tests (section complète demandée le 18/08/2026)
Aucune catégorie dédiée aux tests n'existe aujourd'hui (`tests-et-audit-de-securite.md` dans `Cybersécurité` couvre l'audit de sécurité, pas la méthodologie de test logiciel). Louis a demandé une section complète, pas des chapitres isolés. Chapitres demandés explicitement :
- **Vocabulaire QA (ISTQB)** : terminologie normalisée du métier de testeur (cas de test, plan de test, non-régression, critère de sortie, etc.) - fondation pour comprendre les autres chapitres de la section.
- **Pyramide de test** : répartition unitaire / intégration / end-to-end, pourquoi peu de tests lents et beaucoup de tests rapides, anti-pattern du "cône de glace" inversé.
- **Architecture de test** : organisation d'une suite de tests (arborescence, fixtures, environnements, test doubles/mocks/stubs), comment structurer un projet pour que les tests restent maintenables.
- **et plus encore**

Pour que la section soit réellement complète (à trancher en écrivant, pas figé) : compléter avec des chapitres sur les tests unitaires, les tests d'intégration, les tests end-to-end, le TDD, les mocks/stubs/fakes (test doubles en détail), la couverture de code (et ses pièges : 100% de couverture ≠ absence de bugs), et éventuellement les tests basés sur les propriétés (property-based testing) et les tests de mutation si le niveau "bonnes pratiques avancées" est visé.


## Ordre de mise en place suggéré (contenus du 19/08/2026, du plus rapide au plus long)
1. **Trancher la question structurelle** (nouvelle catégorie « Automatisation » vs restructurer `Infrastructure` en `subjects`) - pas un contenu à rédiger, juste un choix, mais bloquant pour tout le reste ci-dessous.
2. **Déplacer `automatisation-workflow.md`** vers la sous-catégorie « Fonctionnement général » - contenu déjà écrit et déjà traduit, juste un déplacement de fichier + mise à jour de `struct.json` (+ 3 variantes langue).
3. **Chapitre watermarking IA** - un seul chapitre isolé, emplacement déjà tranché (`IA/Production et gouvernance`), aucune dépendance structurelle.
4. **Chapitre n8n « Prise en main de l'interface »** - périmètre court et déjà familier (interface vue en la lançant en local).
5. **Chapitre n8n « Catalogue des fonctionnalités / types de nœuds »** - plus de matière à couvrir (trigger, action, code node, branchement, error workflow).
6. **Chapitre n8n « Le format JSON d'un workflow »** - demande d'exporter et d'inspecter un vrai workflow avant de pouvoir rédiger, pas juste de la description.
7. **Chapitre n8n « L'industrialisation »** - le plus transversal (environnements dev/prod, credentials, sécurité, supervision), donc le plus long à structurer correctement.

## Nouvelle section : Automatisation (n8n) (demandé le 19/08/2026)
Aujourd'hui `automatisation-workflow.md` est un chapitre isolé dans `Infrastructure` (concepts génériques : déclencheur/action/connecteur, SaaS vs self-hosted, n8n/Zapier/Make - déjà traduit EN/ES/BR). Louis veut en faire une vraie section à deux volets plutôt qu'un chapitre unique : le fonctionnement général (déjà écrit) et un approfondissement dédié à n8n spécifiquement.

Structure proposée (schéma `subjects` déjà utilisé pour IA/Langages de balisage/Langages de programmation/Shells dans `structure/struct.json`) :

- **Sous-catégorie « Fonctionnement général »** : reprend tel quel `automatisation-workflow.md` (déclencheur/action/connecteur, SaaS vs self-hosted, n8n/Zapier/Make) - contenu déjà écrit et déjà traduit, à déplacer sans réécrire.
- **Sous-catégorie « n8n »** (nouveaux chapitres, à rédiger) :
  - Prise en main de l'interface (canvas, nœuds, connexions, panneau d'exécution, test manuel avant activation)
  - Catalogue des fonctionnalités / types de nœuds (trigger, action, code node JS/Python, nœuds conditionnels/branchement, gestion d'erreur via error workflow)
  - Le format JSON d'un workflow n8n (structure de l'export, portabilité entre instances, import/export, versionner un workflow comme du code)
  - L'industrialisation de n8n (self-hosted vs n8n cloud, variables d'environnement, gestion des credentials, environnements dev/prod, supervision des exécutions, sécurité - accès à l'éditeur, restriction des nœuds sensibles comme Execute Command)
  - et potentiellement d'autres chapitres n8n, à compléter en écrivant (pas figé, même logique que la section Tests ci-dessus)

Points à trancher avant de commencer à écrire :
- Nouvelle catégorie top-level **« Automatisation »** sortie d'`Infrastructure` (implique de mettre à jour `structure/struct.json` + les 3 variantes `struct-en/es/br.json`, et de déplacer le fichier dans `content/` + les 3 dossiers `content-en/es/br/`), vs. garder ça dans `Infrastructure` en convertissant sa liste plate de chapitres en `subjects` - ce qui touche aussi les chapitres non liés à l'automatisation (`api-et-http`, `json`, `cpu-vs-gpu`, `le-cloud`).
- Contenu n8n générique (l'outil vu de l'extérieur, out of the box) ou documentant aussi l'usage concret de ce dépôt (le workflow d'orchestration nocturne de `git-scrapping`, cf. section « Automatic orchestration (n8n) » du README) - risque de mélanger doc générale et doc spécifique à un projet.

## Nouveau chapitre : le watermarking du contenu généré par IA (demandé le 19/08/2026)
0 occurrence d'un chapitre dédié dans `content/` : seules deux mentions en passant existent (`IA/Voix IA/cloner-une-voix.md` pour l'audio, et une occurrence non liée dans `Bases de données/schemas-et-tables-techniques.md`). Aucun chapitre transversal n'explique le mécanisme.

Recommandation : chapitre dans `IA/Production et gouvernance`, à côté de `reglementation-europeenne-ia.md` (l'AI Act impose justement une obligation de marquage/divulgation du contenu généré par IA - lien naturel avec la réglementation déjà couverte) et de `gouvernance-des-donnees.md`.

À couvrir (à trancher en écrivant, pas figé) :
- Pourquoi marquer du contenu généré par IA (traçabilité, obligation réglementaire type AI Act, lutte contre la désinformation).
- Watermarking de texte (biais statistique sur le choix des tokens générés, détectable par un modèle qui connaît la clé - ex. approche SynthID de DeepMind) : robustesse limitée si le texte est reformulé/traduit.
- Watermarking d'image et d'audio (métadonnées de provenance type C2PA/Content Credentials, watermark perceptible ou imperceptible dans le signal) - à mettre en regard de la mention déjà existante dans `cloner-une-voix.md`.
- Limites : un watermark n'empêche pas la génération de contenu trompeur, seulement sa détection a posteriori ; robustesse face aux transformations (compression, recadrage, reformulation) très variable selon la technique.
- Limites physiques propres au watermarking de texte (le signal statistique disparaît vite) : contenu trop court (peu de tokens générés = peu de biais statistique accumulé, détection peu fiable sur une phrase ou deux) ; réécriture du contenu (reformuler avec un autre modèle ou à la main efface la distribution de tokens d'origine) ; résumé du contenu (un résumé ne reprend pas les tokens exacts du texte source, donc pas le watermark) ; traduction (même effet que la réécriture, changement de vocabulaire complet).

source complementaire watermarking : https://www.instagram.com/reel/DcHmNPfMysl/?igsh=MTVycnRmdW1uOXltbA==&igsi=MTVycnRmdW1uOXltbA==
lire la description du poste instagram