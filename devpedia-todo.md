# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `prompt.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Lecture écran verrouillé / téléphone en poche (Bluetooth) — toujours bloquant après le passage à l'audio pré-généré
Objectif de Louis (21/08/2026) : pouvoir lire en marchant, casque Bluetooth, téléphone verrouillé et en poche, sans avoir à le tenir ni le garder allumé.

Audio pré-généré (Piper TTS, hors ligne, pilote de 5 chapitres × FR/EN/ES/BR) + mode "ajout à l'écran d'accueil" + `mediaSession` : le blocage historique (l'audio coupait dès l'écran verrouillé) est **corrigé, confirmé par Louis le 22/08/2026** sur un chapitre pilote (`mots-de-passe-et-hachage`), écran verrouillé 12s, lecture ininterrompue. À condition de tester sur un des 5 chapitres pilotes (`audio/fr/*.mp3` liste les ids) : les autres pages n'ont pas d'audio pré-généré et retombent sur `speechSynthesis`, qui lui n'a jamais géré le verrouillage.

Bug restant détecté pendant ce test : la voix bute sur certains mots et les re-prononce pendant que le téléphone est verrouillé. Hypothèse retenue et corrigée (23/08/2026, à confirmer par Louis) : `audioEl` chargeait le mp3 en streaming réseau, qu'iOS bride fortement en arrière-plan (micro-coupures/rebufferisation) ; `loadPregenAudio()` (`js/reader.js`) précharge maintenant le mp3 entier en mémoire (`URL.createObjectURL`) avant de le donner à `audioEl`, donc plus aucune dépendance réseau une fois la lecture commencée.

Outil de diagnostic conservé si un nouveau souci apparaît : `js/reader-debug.js`, activé par 5 taps sur le logo "Devpedia" dans la navbar (moins de 2,5s), log persistant dans `localStorage` affiché en overlay sous la navbar.
- Reste à Louis : sur `mots-de-passe-et-hachage` (ou un autre des 5 pilotes), lancer la lecture, verrouiller, attendre, déverrouiller, et confirmer que les mots ne sont plus bafouillés/répétés.

## 2. Évaluer l'ajout d'une section sur les puces IA spécialisées (TPU, NPU, LPU, VPU) en complément de `cpu-vs-gpu.md`
Origine : capture Instagram (`IMG_9833.png`, compte `rick.theengineer`, carrousel "THE MATH" 64/68) comparant CPU/GPU/TPU/NPU/LPU/VPU. **CPU vs GPU est déjà couvert en détail** (`content/Infrastructure & DevOps/Infrastructure/cpu-vs-gpu.md`) : ne pas retraiter ces deux-là. Ce qui manque encore au projet :
- **TPU** (*Tensor Processing Unit*) — puce Google hautement spécialisée pour le machine learning
- **NPU** (*Neural Processing Unit*) — accélération IA embarquée, efficiente en énergie (mobiles/laptops)
- **LPU** et **VPU** — acronymes cités dans la capture sans détail, sens à rechercher avant rédaction (VPU probablement *Vision Processing Unit* ; LPU à vérifier, ex. Groq)

Angle possible : étendre `cpu-vs-gpu.md` (ou une nouvelle sous-section) sur "pourquoi l'IA a poussé à inventer des puces encore plus spécialisées que le GPU", en réutilisant la logique généraliste → spécialisé déjà posée par ce chapitre.

## 3. Priorité de Louis (22/08/2026) : "system design" / gestion du trafic à grande échelle (Uber, LeetCode, Netflix)
Louis a explicitement marqué cet axe comme prioritaire parmi les sujets Instagram repérés : comprendre et documenter comment les grosses applications modernes gèrent le trafic à haut niveau, indépendamment du langage/de la stack utilisée. Rien de ce genre n'existe aujourd'hui dans Devpedia (les chapitres d'architecture existants comme `microservices.md` sont plus bas niveau/orientés qualité de code, pas dimensionnement à grande échelle). Trois angles concrets à couvrir, probablement en plusieurs chapitres liés plutôt qu'un seul :
- **Le "system design" comme genre d'exercice** — ce qu'on entend par "concevoir Uber" ou "concevoir LeetCode" en entretien technique : quelles questions se pose-t-on (estimation de charge, choix de découpage, compromis), à quel niveau d'abstraction (composants/boîtes, pas de code)
- **Autoscaling / répartition de charge** — comment une infrastructure absorbe un pic de trafic (ex. x29 vu dans un reel) sans tomber : ajout dynamique de serveurs, répartiteur de charge (*load balancer*) en amont
- **CDN et diffusion adaptative type Netflix** — pourquoi une vidéo ne vient pas d'un seul serveur central, comment le flux s'adapte à la qualité de connexion, rôle des serveurs répartis géographiquement

Origine des trois : capture Instagram `rick.theengineer`, vignettes de reels seulement (pas de transcription complète, Instagram exige une connexion au-delà du profil public) — à approfondir par une vraie recherche avant rédaction, pas à traiter comme une source fiable en l'état.

## 4. Autres chapitres candidats identifiés via le compte Instagram `rick.theengineer` (reels), absents du projet — priorité moindre que la tâche 3
Origine : mêmes vignettes/légendes que la tâche 3, mêmes réserves (source non vérifiée en détail). Sujets déjà couverts ailleurs dans Devpedia et donc exclus de cette liste : Git vs GitHub (`github-et-plateformes.md`), architecture Docker/daemon (`Docker/concepts-de-base.md`), sessions/tokens (`sessions-et-tokens.md`, `jwt-et-tokens.md`), OTP/TOTP (`authentification-multifacteur.md`). Restent absents :
- **Fingerprinting navigateur/appareil** (empreinte numérique utilisée pour le traçage publicitaire/anti-fraude, sans cookies) — rien en `Sécurité/`
- **Empreinte audio / reconnaissance de musique** (type Shazam : comment un extrait de quelques secondes retrouve un morceau dans une base de millions) — rien en `Données/` ni `IA/`
- **Conteneurs managés cloud** (AWS ECS/Fargate : au-delà de Docker seul, qui fait tourner les conteneurs en production sans gérer soi-même les serveurs) — `Docker/` existe mais rien côté cloud managé
- **Hachage perceptuel / comparaison d'images similaires** (détecter que deux photos différentes montrent "la même chose", au-delà d'une comparaison octet à octet) — rien en `Données/` ni `Sécurité/`
- **Métadonnées EXIF / formats RAW photo** (ce qu'une photo contient au-delà de l'image : appareil, réglages, position) — rien en `Données/`

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL/Git/PHP (déjà validés le 2026-08-15).
