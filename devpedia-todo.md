# TODO — Devpedia

Points restants uniquement (le fait/pourquoi/décisions déjà tranchées va dans `journal-de-bord.md`). Ordonné du plus rapide au plus lent à mettre en place ; chaque tâche garde le contexte nécessaire pour l'exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `prompt.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Lecture écran verrouillé / téléphone en poche (Bluetooth) — toujours bloquant après le passage à l'audio pré-généré
Objectif de Louis (21/08/2026) : pouvoir lire en marchant, casque Bluetooth, téléphone verrouillé et en poche, sans avoir à le tenir ni le garder allumé.

Audio pré-généré (Piper TTS, hors ligne) implémenté et en ligne (pilote de 5 chapitres × FR/EN/ES/BR), lecteur basculé sur un vrai élément `<audio>` avec `navigator.mediaSession.metadata` renseigné. **Testé le 22/08/2026 par Louis sur iPhone/Safari (onglet normal, pas ajouté à l'écran d'accueil) : toujours cassé.** Écran allumé, la lecture directe sur le site fonctionne bien au casque Bluetooth. Mais dès l'écran verrouillé, l'écran de verrouillage affiche l'app Musique en pause (pas Devpedia) : iOS ne reconnaît la session Devpedia comme active à aucun moment, et appuyer sur play depuis le casque relance Musique/iTunes au lieu de reprendre le site.

Mode "ajout à l'écran d'accueil" implémenté (`manifest.json`, icônes `icons/`, balises `apple-touch-icon`/`apple-mobile-web-app-*` dans `index.html`). **Testé le 22/08/2026 par Louis en mode standalone : toujours cassé** (l'audio ne continue pas écran verrouillé). Bug distinct corrigé au passage : `audioEl` n'avait aucun listener sur son propre événement `"pause"`, donc quand iOS coupait l'audio de lui-même, l'état interne restait bloqué sur "en lecture" et le bouton ne repassait jamais sur "reprendre" au déverrouillage.

Hypothèse à vérifier : un site ajouté à l'écran d'accueil (mode standalone, sans passer par l'App Store) n'a pas forcément l'autorisation d'exécution en arrière-plan que Safari lui-même a pour l'audio — ce serait alors une limitation d'iOS non contournable en JS, pas un bug du site. Reste à confirmer.

Piste restante, désormais nécessaire (les fixes passifs — `<audio>`, `mediaSession`, mode standalone — sont épuisés sans résultat) :
- Déboguer via Web Inspector distant (Mac connecté à l'iPhone) pour voir les erreurs/avertissements réels côté device au moment précis du verrouillage — actuellement aucune visibilité sur ce qui se passe concrètement sur le téléphone. Nécessite Louis en direct (Mac + iPhone + câble).

## Hors séquence (pas des tâches à planifier, à traiter en continu)
- **Validation de la table de prononciation TTS** (`js/reader-pronunciation.js`), chapitre par chapitre par Louis en écoute directe : reste tout hors C/C++/SQL/Git/PHP (déjà validés le 2026-08-15).
