# TODO : Devpedia

> Prochaine tâche : plus rien d'auto-exécutable pour l'instant. Reste un test navigateur en attente de Louis (point 3).

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 3. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 4. `Element.closest()` absent de la section délégation d'événements (`dom-et-evenements.md`)
Repéré en revoyant `Backoffice-TC` (module `nps_qualite`, mode `/review` interactif) : `public/js/modules/nps_qualite/index.js` (ligne 709) utilise `e.target.closest('[data-role="evolution-metric"]')` dans un écouteur délégué sur un ancêtre. La section "Propagation des événements et délégation" n'illustre la délégation qu'avec `evenement.target.classList.contains(...)`, qui ne matche que si l'élément cliqué EST exactement la cible - `closest()` remonte au premier ancêtre correspondant à un sélecteur CSS depuis l'élément cliqué, ce qui couvre aussi le clic sur un descendant de la cible (ex. une icône SVG à l'intérieur d'un bouton). Complément utile à ajouter à côté de l'exemple existant, pas un remplacement.
