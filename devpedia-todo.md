# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `prompt.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Lecture écran verrouillé / téléphone en poche (Bluetooth) — **décision structurelle bloquante**
Objectif de Louis (21/08/2026) : pouvoir lire en marchant, casque Bluetooth, téléphone verrouillé et en poche, sans avoir à le tenir ni le garder allumé.

**Constat qui remet en cause l'approche actuelle** : le lecteur repose sur `window.speechSynthesis` (Web Speech API, `js/reader.js:25-26`), pas sur un élément `<audio>`. Or `speechSynthesis` n'est pas traité par les navigateurs mobiles comme une vraie lecture média — Chrome et Safari le suspendent quand l'onglet perd le focus ou que l'écran se verrouille (comportement particulièrement agressif sur iOS Safari). La synchronisation Bluetooth (play/pause/piste suivante-précédente via MediaSession API, livrée le 22/08/2026) résout la synchronisation des boutons, mais ne garantit pas que le son continue une fois l'écran verrouillé : ce sont deux problèmes distincts.

Ce qui fonctionne de façon fiable dans ce cas (mécanisme utilisé par tout lecteur audio/podcast web) : un élément `<audio>` qui joue un **fichier audio pré-généré** (pas de synthèse vocale en direct dans le navigateur), couplé à MediaSession — c'est ce que l'OS reconnaît comme une session de lecture média légitime à maintenir en arrière-plan.

**Testé le 22/08/2026 sur iPhone/iOS par Louis : la piste intermédiaire ne marche pas.** Appuyer sur play depuis le casque Bluetooth lance l'app iTunes/Apple Music à la place du site, y compris quand une lecture était déjà en pause sur le site (`mediaSession.playbackState` correctement à `"paused"` avant l'appui). Confirme la limite déjà documentée : `speechSynthesis` n'est jamais reconnu par iOS comme une vraie session média, même avec les hooks MediaSession correctement branchés. Non testé sur Android.

**Décision restante à trancher avec Louis** (cf. les deux options détaillées ci-dessus et dans `journal-de-bord.md`) :
- **Pré-générer l'audio** (impact architecture réel).
- **Abandonner cet objectif de confort**, garder `speechSynthesis` en direct tel quel.

Une fois une architecture pré-rendue effectivement implémentée (si retenue) : mettre à jour `content/IA/Voix IA/choisir-fournisseur-mise-en-production.md`, qui justifie aujourd'hui le choix de la Web Speech API par le fait que Devpédia est « 100% statique... sans serveur ni étape de build » (confirmé au passage : `.github/workflows/pages.yml` ne fait que checkout + upload, aucun build actuellement). Un pré-rendu audio (ex. Piper exécuté à la publication) introduirait une **étape de build** sans nécessiter de **serveur d'inférence live** — nuance absente du chapitre, qui traite aujourd'hui les deux comme un seul bloc. À corriger dans ce chapitre seulement une fois ce point effectivement implémenté, pas avant (éviter de documenter une architecture qui n'existe pas encore).

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL/Git/PHP (déjà validés le 2026-08-15).
