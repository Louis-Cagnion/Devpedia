---
order: 9
---

# Design systems

Les chapitres précédents (couleur, typographie, espacement, hiérarchie) donnent des principes ; sur un produit d'une seule page, appliquer chacun au cas par cas suffit. Passé quelques dizaines d'écrans et plusieurs personnes qui les conçoivent, réappliquer ces décisions à la main à chaque nouvel écran finit par diverger : deux boutons "principaux" avec un bleu légèrement différent, un espacement qui varie d'un écran à l'autre sans raison. Un **design system** est la réponse organisationnelle à ce problème : un ensemble unique de règles, de valeurs et de composants réutilisables, auquel toute nouvelle interface se réfère plutôt que de redécider chaque détail.

## Les design tokens : nommer les valeurs plutôt que les répéter

Un **design token** est une valeur de design (une couleur, un espacement, un rayon de bordure) à laquelle on donne un nom, pour la référencer partout au lieu de la recopier :

| Catégorie | Exemple de token | Valeur | Vient de |
|---|---|---|---|
| Couleur | `couleur-accent` | Le bleu d'accent choisi pour les actions principales | [Couleur et contraste](/?c=ui-ux&p=couleur-et-contraste) (harmonie, contraste WCAG) |
| Espacement | `espace-m` | 16px | [Espacement et grille](/?c=ui-ux&p=espacement-et-grille) (échelle cohérente) |
| Rayon de bordure | `rayon-standard` | 8px | Décision de style propre au produit |
| Typographie | `texte-titre` | Famille, taille et graisse d'un titre | [Typographie](/?c=ui-ux&p=typographie) (échelle, pairing) |

Un token ne remplace aucun des principes déjà vus (une échelle d'espacement cohérente, un contraste suffisant...) : il leur donne un nom réutilisable, une fois la valeur choisie. Techniquement, un token se traduit le plus souvent en [variable CSS](/?c=langages-de-balisage&s=css&p=variables-et-cascade) : ce chapitre reste au niveau de la décision de conception, pas de sa syntaxe d'implémentation.

> **Piège :** faire cohabiter, pour une même valeur, un token ET des occurrences en dur ailleurs dans le produit (un bouton qui référence `couleur-accent`, un autre écrit directement le code couleur). Changer le token ne corrige alors qu'une partie des cas : exactement le problème qu'une [source unique de vérité](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) est censée éviter.
>
> **Bonne pratique :** une fois un token créé, faire référencer sa valeur partout où elle apparaît, sans exception ponctuelle "pour cette fois" : une seule occurrence en dur suffit à briser la cohérence que le token est censé garantir.

## La bibliothèque de composants : construire une fois, réutiliser partout

Une **bibliothèque de composants** regroupe les éléments d'interface récurrents (bouton, champ de formulaire, carte, menu) construits une seule fois à partir des tokens, puis réutilisés sur chaque écran plutôt que redessinés :

```text
Sans bibliotheque              Avec bibliotheque
------------------------       ------------------------
Ecran A : bouton "Valider"     Ecran A : <BoutonPrincipal>
Ecran B : bouton "Valider"     Ecran B : <BoutonPrincipal>
  (redessine independamment,     (meme composant, une seule
   legere variation de style)     source, garanti identique)
```

> **Piège :** dupliquer un composant existant pour l'adapter légèrement à un nouvel écran ("je repars du bouton existant mais je change juste ce détail"), plutôt que de faire évoluer le composant original. La copie diverge inévitablement de l'original au fil des retouches ultérieures, et le produit se retrouve avec plusieurs versions légèrement différentes du "même" composant.
>
> **Bonne pratique :** faire évoluer le composant partagé lui-même (avec un paramètre pour la variation nécessaire, si elle est légitime) plutôt que de le dupliquer : la même logique que [source unique de vérité](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) et [éviter la répétition](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees) déjà vues côté code s'applique tout autant aux éléments d'interface.

## Piège : construire un design system avant d'avoir des écrans réels

Un design system se dégage de patterns qui se répètent réellement à travers plusieurs écrans déjà conçus, pas d'une anticipation de ce qui pourrait un jour se répéter.

> **Piège :** construire une bibliothèque de composants exhaustive avant même d'avoir conçu quelques écrans réels du produit. Sans cas d'usage réels pour les confronter, les composants anticipés ne correspondent souvent pas aux besoins qui émergent une fois le produit réellement conçu : un temps investi à généraliser un besoin encore hypothétique.
>
> **Bonne pratique :** laisser un design system émerger progressivement à partir d'écrans réels (extraire un composant une fois qu'un motif s'est répété 2 ou 3 fois), plutôt que de le concevoir intégralement à l'avance.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un design system nomme les valeurs de design en tokens réutilisables (couleur, espacement, typographie...) et construit une bibliothèque de composants à partir d'eux, pour garder un produit cohérent au-delà de ce qu'une seule personne peut décider écran par écran. Il émerge de patterns réels plutôt que d'être anticipé. |
| **Outils utilisables** | Des tokens de design (souvent des [variables CSS](/?c=langages-de-balisage&s=css&p=variables-et-cascade)) ; une bibliothèque de composants partagée. |
| **Pièges à éviter** | Laisser une valeur en dur cohabiter avec un token qui la remplace. Dupliquer un composant plutôt que de faire évoluer l'original. Construire un design system complet avant d'avoir des écrans réels à partir desquels généraliser. |
| **Bonnes pratiques** | Référencer un token partout où sa valeur apparaît, sans exception. Faire évoluer un composant partagé plutôt que le dupliquer. Laisser un design system émerger progressivement d'un motif répété plusieurs fois. |
