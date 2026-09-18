# TODO : Devpedia

> Prochaine tâche : point 1, lot 6 en cours en tâche de fond -- attendre la fin, puis `git add audio/` et commit.

> Restent : un test navigateur en attente de Louis pour continuer l'investigation (point 4). 17 chapitres en échec espeak-ng à investiguer par Louis (point 1). Double mécanisme de résumé dans 8 chapitres à trancher avec Louis (point 2). Qualité de traduction EN à auditer plus largement (point 3).

## 1. Régénération audio complète : lot 6 restant (le plus gros, en cours en tâche de fond)
Nécessite `ffmpeg` sur le PATH : `export PATH="/c/Users/lcagnion/tools/ffmpeg-9.0.1-essentials_build/bin:$PATH"` avant chaque commande (cf. `journal-de-bord.md` pour l'installation).
- Lot 6 lancé : `node scripts/generate-audio.mjs --context=c,cpp,php,python,javascript,ocaml,html,css,bash,zsh,powershell,domain-specific-languages-dsl,xml`. Une fois terminé : `git add audio/` puis commit.
- **17 chapitres en échec espeak-ng (`UnicodeEncodeError: ... surrogates not allowed`), à investiguer par Louis, détail dans `journal-de-bord.md`** : `fr/editeur-de-code-et-ide`, `fr/complexite-et-notation-big-o`, `en/code-programmes-et-fichiers`, `en/editeur-de-code-et-ide`, `en/arborescence-et-chemins`, `en/le-bug`, `en/complexite-et-notation-big-o`, `es/editeur-de-code-et-ide`, `es/complexite-et-notation-big-o`, `es/le-logarithme`, `es/wavefront-obj-et-modele-de-phong`, `br/editeur-de-code-et-ide`, `br/complexite-et-notation-big-o`, `en/architecture-interne`, `en/jupyter-notebooks`, `en/machine-learning-scikit-learn`, `es/k-plus-proches-voisins`. `editeur-de-code-et-ide` et `complexite-et-notation-big-o` échouent dans les 4 langues (pointe vers un caractère du contenu source partagé entre traductions), les 15 autres restent plus proches d'un flaky d'environnement. Retenter individuellement une fois la cause identifiée : `node scripts/generate-audio.mjs <chemin-audio> --lang=<code>`.

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 2. 8 chapitres avec un double mécanisme de résumé (`## Résumé` + `## 📋 Récapitulatif`)
Repéré en lisant `nombres-flottants.md` (item #14) : ce chapitre a un ancien `## Résumé` (table "À retenir/Pourquoi") juste avant le `## 📋 Récapitulatif` standard, deux mécanismes qui se recoupent largement (cf. critère Simplicité de `/best-practice`). Même motif dans 7 autres fichiers : `Langages/PHP/securite.md`, `Langages/JavaScript/nombres.md`, `Langages/C++/gestion-memoire-raii.md`, `Données/Représentation des données/organisation-en-memoire.md`, `entiers-et-debordements.md`, `encodage-des-textes.md`, `aleatoire-et-generateurs.md`. À trancher avec Louis : fusionner en gardant `## 📋 Récapitulatif` seul, ou une autre unification ; changement d'ampleur, pas à faire sans confirmation.

## 3. Qualité de traduction EN par endroits médiocre (mots-à-mots visibles)
`content-en/Langages/C++/references.md` a le même défaut (mots-à-mots, ex. "Report a reference") que celui déjà corrigé dans `classes-et-objets.md` (détail dans `journal-de-bord.md`), pas encore corrigé. À auditer plus largement dans `content-en/` : d'autres chapitres traduits à la même période pourraient avoir le même défaut.

## 4. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 5. Commentaires de code sans accents dans `content*/` (ancienne convention abandonnée le 31/08/2026)
`grep -rEc "// .*(ecran|echouer|meme|plutot|Echap|donnee|memoire|acces|complete)" content --include="*.md"` remonte 27 fichiers FR potentiellement concernés (probablement dupliqué en `content-en`/`content-es`/`content-br`) ; à lister précisément et corriger.

## 6. Lignes de code entre 96 et anciennement 100 caractères, pas encore repassées au seuil de 95 (abaissé le 16/09/2026)
Repéré dans `dom-et-evenements.md` (les 4 langues, ex. lignes `querySelector`/`innerHTML`), écrites avant l'abaissement du seuil. Probablement répandu dans tout `content*/`. À chiffrer (script de comptage par fichier) puis corriger par lot.
