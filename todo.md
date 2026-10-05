# TODO : Devpedia

> Prochaine tâche : aucune de mon côté. En attente de Louis : test navigateur (point 1), relance de l'audio de la section IA > Modèles de décision structurée (point 2), arbitrage des doublons (point 7).

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois, sans attente de validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés ; toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).


## 2. Section IA > Modèles de décision structurée (TypeSafe AI / Jev)
- Générer l'audio des 4 langues de `content(-en/-es/-br)/IA/Modèles de décision structurée/` (12 chapitres + description, une seule passe, sur demande de Louis).

Sources : https://typesafe.ai/blog/introducing-system-one-models-and-jev, https://docs.typesafe.ai/introduction

## 5. Vérifications restantes (machine à pilote graphique)
- `Fondamentaux/Graphisme/glfw-glad-et-boucle-de-rendu` (section « Comment OpenGL connaît la machine ») : `glxinfo -B | grep -i renderer` n'a pas été exécuté (paquet `mesa-utils` absent) ; vérifier qu'il affiche le même renderer que `GL_RENDERER`.
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` : sur une session Wayland, vérifier que `xdotool` ne touche que les applications XWayland (la session de Louis est en X11) ; sur la session réelle, `xinput query-state` a été vérifié avec F13, pas avec Échap.

## 6. Relecture par Claude : chapitre « Les agents Azure Pipelines auto-hébergés » (quand le projet `scraping_infomediaires` sera disponible)
`Infrastructure & DevOps/CI-CD/agents-azure-pipelines-auto-heberges` (fr/en/es/br) a été rédigé sans le projet `scraping_infomediaires` (absent de la machine de rédaction) et sans exécuter aucune commande Windows : tout vient de la documentation Microsoft Learn. Dès que le projet est disponible, Claude relit le chapitre en le confrontant à la configuration réelle de l'agent : mode service ou autologon retenu, compte d'exécution, nombre d'agents sur la machine, options de `config.cmd` effectivement utilisées. Si la pratique diffère, corriger le chapitre (4 langues, audio régénéré).

## 7. Doublons à arbitrer après le merge du 05/10/2026
Deux machines ont rédigé les mêmes sujets en parallèle ; les deux versions ont été conservées (struct et fichiers), rien n'a été supprimé. Pour chaque paire, choisir de fusionner ou de supprimer l'une des deux (4 langues, `struct*.json`, renvois, audio) :
- `couplages-et-filtrage-de-regin` (Hall, Kuhn, Régin, mesures solveur) et `couplage-biparti-et-theoreme-de-hall` (Hall et Kuhn seuls).
- `agents-azure-pipelines-auto-heberges` et `agents-auto-heberges-azure` (CI-CD).
- `mesurer-avant-d-optimiser` : section « l'exemple de la division » (distant) face au chapitre `division-par-multiplication` (local).
- `eviter-le-recalcul-redondant` : sections « Réparer le résultat précédent » / « le bitmap » (distant) face à « Reprendre le résultat précédent » / « parcourir une bitmap » (local) ; récapitulatif conservé côté local.
- `scripts-et-shebang` : section `: <<'COMMENT'` conservée côté local, piège du mot de fin indenté repris du distant.
