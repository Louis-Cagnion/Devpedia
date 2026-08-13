---
order: 10
---

# Les outils du métier

Les chapitres précédents couvrent des concepts (hiérarchie, couleur, tokens, wireframe...) indépendamment de tout logiciel précis. En pratique, un designer d'interface passe le plus clair de son temps dans un outil de conception dédié, puis parfois dans un outil d'animation pour les interactions les plus avancées ; ce chapitre nomme ce paysage d'outils, sans en faire un tutoriel : chacun mérite une prise en main propre, hors du périmètre de ce site.

## Les outils de conception d'interface

La plupart des outils de ce type ([Figma](https://www.figma.com), [Sketch](https://www.sketch.com), Adobe XD, [Penpot](https://penpot.app)...) partagent les mêmes concepts de base, sous des noms parfois différents :

| Concept | Rôle | Équivalent déjà vu |
|---|---|---|
| Calque (*layer*) | Chaque élément (texte, forme, image) existe indépendamment, empilé sur les autres | Similaire à l'empilement des éléments HTML dans un document |
| Composant | Un élément réutilisable (bouton, carte...), défini une fois et instancié partout | La [bibliothèque de composants](/?c=ui-ux&p=design-systems) d'un design system |
| Auto-layout | Un conteneur qui repositionne et redimensionne son contenu automatiquement selon des règles (espacement, alignement), plutôt que des positions fixées à la main | [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) en CSS : le même principe, dans l'outil de conception plutôt que dans le code |

Travailler avec des composants et de l'auto-layout dans l'outil de conception, plutôt qu'avec des positions figées, produit des maquettes qui se comportent déjà comme l'interface codée le fera (un bouton qui s'adapte à la longueur de son texte, par exemple) ; l'écart entre la maquette et le résultat codé s'en trouve réduit.

> **Piège :** construire une maquette entièrement en positions fixes, sans composants ni auto-layout, parce que "c'est plus rapide pour cette fois". Chaque changement ultérieur (un texte plus long, une nouvelle langue) doit alors être répercuté à la main sur chaque occurrence plutôt que sur une seule définition partagée.
>
> **Bonne pratique :** construire un composant dès qu'un élément apparaît une deuxième fois à l'identique, et utiliser l'auto-layout par défaut plutôt que le positionnement fixe : les mêmes réflexes que la [bibliothèque de composants](/?c=ui-ux&p=design-systems) et l'usage de [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) côté code.

## Les outils d'animation pour les interactions avancées

Une transition simple (un bouton qui change légèrement de couleur au survol) se couvre directement en CSS. Une interaction plus élaborée (plusieurs éléments animés dans un ordre précis, un mouvement qui réagit au geste de l'utilisateur, une physique de ressort plutôt qu'une simple accélération linéaire) dépasse ce que les transitions CSS de base couvrent confortablement, et s'appuie alors sur une bibliothèque JavaScript dédiée à l'animation ([GSAP](https://gsap.com), Framer Motion, entre autres) :

| | Transition CSS | Bibliothèque d'animation JS |
|---|---|---|
| Adapté à | Un changement d'état simple (survol, apparition) | Des séquences de plusieurs animations coordonnées, des gestes, une physique de mouvement |
| Contrôle depuis le code | Limité (déclenché par un changement d'état CSS) | Fin (démarrer, mettre en pause, enchaîner des étapes précisément) |
| Coût | Aucune dépendance supplémentaire | Une bibliothèque externe à charger et maintenir |

> **Piège :** utiliser une bibliothèque d'animation JavaScript pour une simple transition d'état (un survol, une apparition) qu'une transition CSS suffirait à couvrir. Le coût (poids de la bibliothèque, complexité de code supplémentaire) dépasse largement le gain sur un cas aussi simple.
>
> **Bonne pratique :** réserver une bibliothèque d'animation JS aux interactions qui dépassent réellement ce que les transitions CSS couvrent (séquences coordonnées, gestes, physique de mouvement), pas comme réflexe par défaut sur toute animation.

## Choisir un outil : la stabilité plutôt que la nouveauté

> **Piège :** changer d'outil de conception parce qu'un nouvel outil est à la mode, sans qu'il résolve un problème concret rencontré avec l'outil actuel. Le changement a un coût réel : réapprentissage de toute l'équipe, migration des maquettes existantes, interruption temporaire de la collaboration avec les autres métiers (développeurs, produit) habitués à l'outil en place.
>
> **Bonne pratique :** choisir un outil en fonction de ce que l'équipe et l'écosystème existant utilisent déjà (interopérabilité avec les autres outils du projet, compétences déjà acquises), et ne changer que face à un besoin concret non couvert par l'outil actuel, pas par anticipation d'un besoin hypothétique.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Les outils de conception d'interface (Figma et ses alternatives) partagent les mêmes concepts de base (calques, composants, auto-layout) qui préfigurent directement la structure du code final. Une bibliothèque d'animation JS (GSAP, Framer Motion) prend le relais des transitions CSS pour des interactions plus élaborées (séquences, gestes, physique de mouvement). |
| **Outils utilisables** | Un outil de conception avec composants et auto-layout (Figma ou équivalent) ; une bibliothèque d'animation JS pour les interactions qui dépassent une simple transition CSS. |
| **Pièges à éviter** | Construire une maquette en positions fixes sans composants ni auto-layout. Utiliser une bibliothèque d'animation JS pour une simple transition qu'une règle CSS suffirait à couvrir. Changer d'outil par mode plutôt que par besoin concret. |
| **Bonnes pratiques** | Créer un composant dès qu'un élément se répète, utiliser l'auto-layout par défaut. Réserver une bibliothèque d'animation JS aux interactions réellement complexes. Choisir un outil pour son adéquation à l'équipe existante, pas pour sa nouveauté. |
