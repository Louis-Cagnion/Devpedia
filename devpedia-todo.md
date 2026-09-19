# TODO : Devpedia

> Prochaine tâche : point 4 (accents ES) ou point 5 (mots ambigus BR), aucun ordre imposé entre les deux, à chiffrer avant de commencer.

> Restent : un test navigateur en attente de Louis (point 3). 17 chapitres en échec espeak-ng à investiguer par Louis (point 1). Double mécanisme de résumé dans 8 chapitres à trancher avec Louis (point 2).

## 1. Régénération audio complète : terminée (lots 1 à 6 + 8 chapitres Kubernetes/worktree/distillation/CUDA)
Nécessite `ffmpeg` sur le PATH : `export PATH="/c/Users/lcagnion/tools/ffmpeg-9.0.1-essentials_build/bin:$PATH"` avant chaque commande (cf. `journal-de-bord.md` pour l'installation).
- **17 chapitres en échec espeak-ng (`UnicodeEncodeError: ... surrogates not allowed`), à investiguer par Louis, détail dans `journal-de-bord.md`** : `fr/editeur-de-code-et-ide`, `fr/complexite-et-notation-big-o`, `en/code-programmes-et-fichiers`, `en/editeur-de-code-et-ide`, `en/arborescence-et-chemins`, `en/le-bug`, `en/complexite-et-notation-big-o`, `es/editeur-de-code-et-ide`, `es/complexite-et-notation-big-o`, `es/le-logarithme`, `es/wavefront-obj-et-modele-de-phong`, `br/editeur-de-code-et-ide`, `br/complexite-et-notation-big-o`, `en/architecture-interne`, `en/jupyter-notebooks`, `en/machine-learning-scikit-learn`, `es/k-plus-proches-voisins`. `editeur-de-code-et-ide` et `complexite-et-notation-big-o` échouent dans les 4 langues (pointe vers un caractère du contenu source partagé entre traductions), les 15 autres restent plus proches d'un flaky d'environnement. Retenter individuellement une fois la cause identifiée : `node scripts/generate-audio.mjs <chemin-audio> --lang=<code>`.

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 2. 8 chapitres avec un double mécanisme de résumé (`## Résumé` + `## 📋 Récapitulatif`)
Repéré en lisant `nombres-flottants.md` (item #14) : ce chapitre a un ancien `## Résumé` (table "À retenir/Pourquoi") juste avant le `## 📋 Récapitulatif` standard, deux mécanismes qui se recoupent largement (cf. critère Simplicité de `/best-practice`). Même motif dans 7 autres fichiers : `Langages/PHP/securite.md`, `Langages/JavaScript/nombres.md`, `Langages/C++/gestion-memoire-raii.md`, `Données/Représentation des données/organisation-en-memoire.md`, `entiers-et-debordements.md`, `encodage-des-textes.md`, `aleatoire-et-generateurs.md`. À trancher avec Louis : fusionner en gardant `## 📋 Récapitulatif` seul, ou une autre unification ; changement d'ampleur, pas à faire sans confirmation.

## 3. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 4. Accents manquants dans `content-es/` (espagnol), repérés par endroits dans des diagrammes texte
Même défaut que celui déjà corrigé dans `content-br/` (voir `journal-de-bord.md`), mais pas encore audité ni corrigé pour l'espagnol. À chiffrer avant de s'y lancer.

## 5. Mots ambigus non corrigés dans `content-br/` (portugais)
Le correctif d'accents de `content-br/` (voir `journal-de-bord.md`) a volontairement laissé de côté les mots à plusieurs lectures valides selon le contexte (`e`/`é`, `a`/`à`, `esta`/`está`, `contem`/`contém`/`contêm`, `media`/`média`/`mídia`, `continua`/`contínua`) : chaque occurrence doit être relue individuellement pour choisir la bonne forme, pas automatisable sans risque.
