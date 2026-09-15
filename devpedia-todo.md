# TODO : Devpedia

> Prochaine tâche : régénération audio complète en cours (6 lots via `scripts/generate-audio.mjs --context=...`), lancée en tâche de fond -- voir `journal-de-bord.md` pour le détail des lots et leur ordre. Sinon, attendre le retour de Louis sur le point 1.

> Restent : un test navigateur en attente de Louis pour continuer l'investigation (point 1). Régénération audio en cours (voir journal).

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 2. Notion manquante : `next(iterateur, valeur_par_defaut)` (Python, forme à deux arguments)
- Repéré dans le projet PDF_parser (`normalization.py`, revue `/review`) : `iterateurs-et-generateurs.md` couvre `next(iterateur)` à un seul argument (lève `StopIteration` si épuisé) mais pas la forme à deux arguments.
- Angle à couvrir : `next(iterable, defaut)` renvoie `defaut` au lieu de lever `StopIteration` quand l'itérateur est épuisé sans avoir produit de valeur. Cas d'usage typique : combiné à une expression génératrice avec filtre, `next((x for x in coll if condition), defaut)` récupère le premier élément vérifiant une condition (ou une valeur de repli s'il n'y en a aucun) sans construire de liste intermédiaire ni écrire de boucle avec un `break`.
- Rubrique cible probable : `Langages/Python/iterateurs-et-generateurs.md` (à la suite de la section `next()` existante).

