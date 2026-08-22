# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `prompt.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Lecture écran verrouillé / téléphone en poche (Bluetooth) — toujours bloquant après le passage à l'audio pré-généré
Objectif de Louis (21/08/2026) : pouvoir lire en marchant, casque Bluetooth, téléphone verrouillé et en poche, sans avoir à le tenir ni le garder allumé.

Audio pré-généré (Piper TTS, hors ligne, pilote de 5 chapitres × FR/EN/ES/BR) + mode "ajout à l'écran d'accueil" + `mediaSession` : le blocage historique (l'audio coupait dès l'écran verrouillé) est **corrigé, confirmé par Louis le 22/08/2026** sur un chapitre pilote (`mots-de-passe-et-hachage`), écran verrouillé 12s, lecture ininterrompue. À condition de tester sur un des 5 chapitres pilotes (`audio/fr/*.mp3` liste les ids) : les autres pages n'ont pas d'audio pré-généré et retombent sur `speechSynthesis`, qui lui n'a jamais géré le verrouillage.

Bug restant détecté pendant ce test, en deux temps :
1. La voix butait sur des mots au hasard pendant le verrouillage. Corrigé (23/08/2026) en préchargeant le mp3 entier en mémoire (`URL.createObjectURL` dans `loadPregenAudio()`, `js/reader.js`) au lieu de le laisser streamer depuis le réseau, qu'iOS bride fortement en arrière-plan.
2. Une fois (1) en place, Louis a précisé le vrai symptôme : c'est systématiquement le premier mot de **chaque segment** qui se coupe puis reprend depuis le début. Cause trouvée : `speakNextViaAudio()` appelait `audioEl.play()` juste après avoir réglé `audioEl.currentTime`, sans attendre que ce seek (asynchrone) soit terminé -- l'audio jouait un instant l'ancienne position avant de se recaler. Corrigé en attendant l'événement `"seeked"` avant de jouer (sauf si la position est déjà quasi bonne, cas courant vu que les segments sont concaténés sans creux -- pour éviter d'attendre un `"seeked"` qui ne viendrait jamais sur un seek qui ne change rien). `audioEl.play()` catch aussi son rejet désormais (loggé via `reader-debug.js`) au lieu de planter silencieusement.

Outil de diagnostic conservé si un nouveau souci apparaît : `js/reader-debug.js`, activé par 5 taps sur le logo "Devpedia" dans la navbar (moins de 2,5s), log persistant dans `localStorage` affiché en overlay sous la navbar.
- Reste à Louis : sur `mots-de-passe-et-hachage` (ou un autre des 5 pilotes), lancer la lecture, verrouiller, attendre, déverrouiller, et confirmer qu'aucun mot n'est plus coupé/répété en début de segment.

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL/Git/PHP (déjà validés le 2026-08-15).
