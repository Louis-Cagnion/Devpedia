# TODO : Devpedia

> Prochaine tâche : aucune de mon côté. En attente de Louis : test navigateur (point 1).

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois, sans attente de validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés ; toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).


## 2. Vérification restante (session Wayland)
- `Infrastructure & DevOps/Administration système/touche-coincee-clavier-virtuel-xtest` : sur une vraie session Wayland (la machine de Louis est en X11), vérifier que `xdotool` ne touche que les applications XWayland.

## 3. Relecture par Claude : chapitre « Les agents Azure Pipelines auto-hébergés » (quand le projet `scraping_infomediaires` sera disponible)
`Infrastructure & DevOps/CI-CD/agents-azure-pipelines-auto-heberges` (fr/en/es/br) a été rédigé sans le projet `scraping_infomediaires` (absent de la machine de rédaction) et sans exécuter aucune commande Windows : tout vient de la documentation Microsoft Learn. Dès que le projet est disponible, Claude relit le chapitre en le confrontant à la configuration réelle de l'agent : mode service ou autologon retenu, compte d'exécution, nombre d'agents sur la machine, options de `config.cmd` effectivement utilisées. Si la pratique diffère, corriger le chapitre (4 langues, audio régénéré).
