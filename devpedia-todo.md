# TODO : Devpedia

> Prochaine tâche : reprendre la régénération audio complète (lot 1/6 en cours, voir point 2 pour l'état exact et la commande à relancer). Sinon, attendre le retour de Louis sur le point 1.

> Restent : un test navigateur en attente de Louis pour continuer l'investigation (point 1). Régénération audio lot 1/6 en cours (point 2).

## 2. Régénération audio complète : lot 1/6 en cours
Commande : `node scripts/generate-audio.mjs --context=blockchain,ui-ux,tests,gestion-de-projet-et-organisation` (nécessite `ffmpeg` sur le PATH : `export PATH="/c/Users/lcagnion/tools/ffmpeg-9.0.1-essentials_build/bin:$PATH"` avant, cf. `journal-de-bord.md` pour l'installation). Bug Piper/pt-BR déjà corrigé (capitales `Á`/`Í`, voir journal) -- le fait qu'un lot plante ne veut plus dire qu'il faut re-déboguer, juste relancer la même commande, elle est idempotente.
- État à l'arrêt de la session (2026-09-15) : FR complet (Blockchain, UI-UX, Tests, Gestion) ; EN/ES complets sauf `gestion-de-projet-et-organisation` (pas commencé) ; BR complet sur Tests, UI-UX partiel (12/22 fichiers), Blockchain et Gestion pas commencés.
- Simplement relancer la commande ci-dessus : elle retraite tout le lot (pas de reprise fine par chapitre), sans risque puisque déjà fait pour FR/une partie d'EN-ES.
- Une fois le lot 1 terminé, enchaîner les 5 lots suivants dans cet ordre (détail dans `journal-de-bord.md`) : `fondamentaux` ; `qualite-performance-et-outils,donnees` ; `securite,ia` ; `infrastructure-devops` ; `langages` (le plus gros, en dernier).
- Chaque lot terminé : `git add audio/` puis commit (les fichiers audio sont versionnés).

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

