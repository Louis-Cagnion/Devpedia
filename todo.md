# TODO : Devpedia

> Prochaine tâche : aucune de mon côté. En attente de Louis : test navigateur (point 1), machine avec `ffmpeg` pour l'audio du point 2.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois, sans attente de validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés ; toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).


## 2. Chapitre « Les agents Azure Pipelines auto-hébergés » : audio et confrontation à l'agent réel
- Audio à générer (4 langues) sur une machine équipée de `ffmpeg` (absent de cette machine) : `node scripts/generate-audio.mjs agents-azure-pipelines-auto-heberges`.
- Le projet `scraping_infomediaires` ne documente ni le compte d'exécution, ni le nombre d'agents sur la machine, ni les options de `config.cmd` : à confronter au chapitre uniquement si Louis donne la configuration de l'agent (onglet Capabilities ou machine de l'agent).
