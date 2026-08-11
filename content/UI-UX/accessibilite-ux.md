---
order: 6
---

# Accessibilité de base (UX)

Le chapitre [Attributs data-* et accessibilité (ARIA)](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite) couvre le *comment coder* l'accessibilité. Ce chapitre-ci couvre le *pourquoi* côté conception : des décisions à prendre dès la maquette, avant d'écrire la moindre ligne de code : les rattraper après coup coûte toujours plus cher.

## Les niveaux de conformité WCAG

Le [WCAG](/?c=ui-ux&p=couleur-et-contraste), déjà rencontré au chapitre sur la couleur pour ses ratios de contraste, définit en réalité trois niveaux de conformité globaux, qui couvrent bien plus que le seul contraste :

| Niveau | Ce qu'il couvre | Utilisation typique |
|---|---|---|
| A | Le minimum incontournable : sans lui, une partie du contenu est totalement inutilisable pour certains utilisateurs | Rarement suffisant seul |
| AA | Le niveau généralement visé par défaut sur un projet : bon équilibre entre accessibilité réelle et effort de mise en œuvre | Standard de référence pour la plupart des sites et applications |
| AAA | Un niveau renforcé, difficile à atteindre sur un site entier | Réservé à des contextes spécifiques (services essentiels, contenu explicitement destiné à un public en situation de handicap) |

Les ratios de contraste concrets associés à ces niveaux sont détaillés au chapitre [Couleur et contraste](/?c=ui-ux&p=couleur-et-contraste).

## Taille minimale des zones cliquables et tactiles

Une **cible tactile** (*touch target*) est la zone qu'un doigt ou un curseur doit atteindre pour activer un élément : elle peut être plus grande que l'élément visuel lui-même (une icône) sans que cela se voie.

| Référence | Taille minimale recommandée |
|---|---|
| Apple (Human Interface Guidelines) | 44×44 px |
| Google (Material Design) | 48×48 dp |
| WCAG (critère 2.5.5, niveau AAA) | 44×44 px |

> **Piège :** des boutons ou liens trop petits ou trop rapprochés, en particulier sur mobile. L'utilisateur touche le mauvais élément : un risque accru pour une personne avec un tremblement ou une déficience motrice, mais qui gêne tout le monde (dans un bus, en marchant, avec de grands doigts).
>
> **Bonne pratique :** prévoir une zone cliquable d'au moins 44×44px même quand l'élément visuel (une icône) est plus petit : un espace invisible autour de l'icône peut agrandir la zone réellement cliquable sans changer son apparence.

## Concevoir la navigation clavier dès la maquette

La **navigation clavier** permet d'utiliser toute une interface sans souris : `Tab` pour passer d'un élément interactif au suivant, `Entrée`/`Espace` pour l'activer, `Échap` pour fermer une fenêtre. Elle est indispensable pour les utilisateurs qui ne peuvent pas utiliser une souris, et accélère aussi l'usage pour n'importe qui.

> **Piège :** ne penser la navigation clavier qu'au moment de coder, une fois la maquette figée. L'ordre visuel des éléments, choisi librement sur la maquette, ne correspond alors pas forcément à un ordre de tabulation logique : un rattrapage en code (réordonner manuellement, restructurer le HTML) devient nécessaire après coup.
>
> **Bonne pratique :** définir dès la maquette l'ordre logique de navigation (quel élément reçoit le focus en premier, puis dans quel ordre). Un ordre qui suit le sens de lecture naturel (haut vers bas, gauche vers droite) évite ce problème dans la grande majorité des cas.

## Passer à l'implémentation

La mise en œuvre technique de ces principes (attributs `tabindex`, rôles ARIA, focus visible) est couverte dans [Attributs data-* et accessibilité (ARIA)](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'accessibilité UX se décide en amont du code : niveau WCAG visé (A/AA/AAA), zones cliquables suffisamment grandes (44×44px minimum), et ordre de navigation clavier logique dès la maquette. |
| **Outils utilisables** | Aucun outil spécifique : ces choix se prennent lors de la conception (maquette), avant l'implémentation technique. |
| **Pièges à éviter** | Des zones cliquables trop petites ou trop rapprochées, surtout sur mobile ; repousser la réflexion sur la navigation clavier jusqu'au moment de coder. |
| **Bonnes pratiques** | Viser le niveau AA par défaut ; prévoir des zones cliquables d'au moins 44×44px ; définir l'ordre de tabulation dès la maquette, aligné sur le sens de lecture naturel. |
