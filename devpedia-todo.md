# TODO : Devpedia

> Prochaine tâche : point 2 (fusionner ou trancher le double résumé dans les 8 chapitres concernés, décision de Louis déjà prise), puis point 1 (causer racine des échecs espeak-ng).

> Restent : un test navigateur en attente de Louis (point 3).

## 1. Investigation de la cause racine des échecs espeak-ng (17 chapitres, `UnicodeEncodeError: ... surrogates not allowed`)
Nécessite `ffmpeg` sur le PATH : `export PATH="/c/Users/lcagnion/tools/ffmpeg-9.0.1-essentials_build/bin:$PATH"` avant chaque commande de régénération (cf. `journal-de-bord.md` pour l'installation).
`fr/editeur-de-code-et-ide`, `fr/complexite-et-notation-big-o`, `en/code-programmes-et-fichiers`, `en/editeur-de-code-et-ide`, `en/arborescence-et-chemins`, `en/le-bug`, `en/complexite-et-notation-big-o`, `es/editeur-de-code-et-ide`, `es/complexite-et-notation-big-o`, `es/le-logarithme`, `es/wavefront-obj-et-modele-de-phong`, `br/editeur-de-code-et-ide`, `br/complexite-et-notation-big-o`, `en/architecture-interne`, `en/jupyter-notebooks`, `en/machine-learning-scikit-learn`, `es/k-plus-proches-voisins`. `editeur-de-code-et-ide` et `complexite-et-notation-big-o` échouent dans les 4 langues (pointe vers un caractère du contenu source partagé entre traductions), les 15 autres restent plus proches d'un flaky d'environnement. Une fois la cause trouvée et corrigée, régénérer individuellement chaque chapitre fixé : `node scripts/generate-audio.mjs <chemin-audio> --lang=<code>`.

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 2. 8 chapitres avec un double mécanisme de résumé (`## Résumé` + `## 📋 Récapitulatif`)
Chapitres concernés : `nombres-flottants.md`, `Langages/PHP/securite.md`, `Langages/JavaScript/nombres.md`, `Langages/C++/gestion-memoire-raii.md`, `Données/Représentation des données/organisation-en-memoire.md`, `entiers-et-debordements.md`, `encodage-des-textes.md`, `aleatoire-et-generateurs.md`. Décision de Louis : un seul résumé par chapitre -- fusionner les deux sections si pertinent, sinon garder la plus complète et supprimer l'autre. À faire chapitre par chapitre, dans les 4 langues.

## 3. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).
