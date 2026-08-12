# Audit UI/UX de l'interface Devpedia

Audit de l'interface actuelle du site, à la lumière des concepts couverts par la catégorie UI/UX (phases 1 et 2). Document de travail interne (hors contenu public, comme `devpedia-todo.md`/`audit-zero-connaissance.md`) — recommandations à trier et prioriser, rien n'a été modifié dans le code en écrivant ce document.

Méthode : mesures réelles prises sur le site en local (ratios de contraste calculés via la formule WCAG, tailles de zones cliquables mesurées via `getBoundingClientRect()`), pas une impression visuelle seule.

## 1. Contraste insuffisant sur la catégorie active du menu

**Constat.** Le bouton de catégorie actuellement ouverte dans le menu (`.sidebarCategoryButton.open`, `css/base.css:716`) affiche son texte en `var(--accent)` (`#88c0d0`) sur un fond `var(--bg-hover)` (`#4c566a`). Ratio mesuré : **3.69:1**.

**Pourquoi c'est un problème.** Le chapitre [Couleur et contraste](/?c=ui-ux&p=couleur-et-contraste) que le site enseigne lui-même fixe le seuil AA à 4.5:1 pour du texte normal. 3.69:1 est en dessous — le nom de la catégorie dans laquelle on se trouve, l'information de contexte la plus utile du menu, est précisément celle qui est la moins lisible.

**Recommandation.** Soit foncer le texte (une variante plus saturée de l'accent), soit éclaircir le fond de l'état "ouvert" — à revérifier avec la même formule après changement, plutôt qu'à l'œil.

## 2. Zones cliquables sous la taille recommandée

**Constat.** `.sidebarCategoryButton, .sidebarSubjectButton, .sidebarChapterButton` (`css/base.css:696`) utilisent `padding: 0.4rem 0.5rem` avec `font-size: 0.95rem`, pour une hauteur réelle mesurée de **30px**. Sur la page d'accueil, 37 des 49 éléments interactifs mesurés sont sous 44px de hauteur ou de largeur.

**Pourquoi c'est un problème.** Le chapitre [Accessibilité de base (UX)](/?c=ui-ux&p=accessibilite-ux) recommande explicitement 44×44px pour une zone cliquable/tactile (repère Apple/Google). Ces boutons ne sont pas seulement dans la barre latérale desktop : `js/sidebar.js` réutilise exactement les mêmes classes pour le menu mobile (`.menuDiv`) — sur un écran tactile, où 44px compte le plus, la taille est identique.

**Recommandation.** Augmenter le `padding` vertical de ces boutons (`0.4rem` → environ `0.65rem` suffirait à atteindre ~44px avec la taille de police actuelle) — uniquement pour les boutons de navigation, pas nécessairement pour tout le site.

## 3. Aucun repère de contexte visible sur mobile une fois sur un chapitre

**Constat.** Une page de chapitre affiche seulement deux boutons de navigation (chapitre précédent/suivant) et un bouton "← Retour" — aucun fil d'Ariane (catégorie > sujet > chapitre). Sur desktop, la barre latérale gauche reste visible et affiche l'arborescence dépliée jusqu'au chapitre courant ; sur mobile (`max-width: 1099px`, `css/responsive.css:28`), cette barre latérale est masquée et son contenu déplacé dans le menu hamburger fermé par défaut — donc invisible tant qu'on ne l'ouvre pas.

**Pourquoi c'est un problème.** C'est l'heuristique de Nielsen ["reconnaissance plutôt que rappel"](/?c=ui-ux&p=heuristiques-de-nielsen) : sur mobile, en plein milieu d'un chapitre profondément imbriqué (ex. Shells > Bash > Les boucles), rien à l'écran ne rappelle ce contexte — il faut ouvrir le menu pour se souvenir où l'on se trouve.

**Recommandation.** Ajouter un fil d'Ariane compact en haut du contenu (catégorie > sujet), visible sur toutes les tailles d'écran mais surtout utile sur mobile où c'est actuellement la seule indication manquante.

## Ce qui fonctionne déjà bien (pour ne pas le casser par erreur)

- Le champ de recherche a un style `:focus` visible et différencié (`css/base.css:90`) — la navigation clavier n'est pas un point faible sur cet élément.
- Aucun bouton n'a de `outline: none` non compensé : la navigation clavier garde le focus par défaut du navigateur partout ailleurs (vérifié : un seul `:focus` personnalisé existe dans `base.css`, rien qui désactive le focus natif).
- Les design tokens existants (`--bg-elevated`, `--accent`, `--radius`...) sont déjà centralisés en variables CSS dans `:root` — la base du [design system](/?c=ui-ux&p=design-systems) est là, pas à construire depuis zéro.
