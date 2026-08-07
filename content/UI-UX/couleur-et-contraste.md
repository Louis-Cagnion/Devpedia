---
order: 2
---

# Couleur et contraste

La couleur est l'un des leviers de la [hiérarchie visuelle](/?c=ui-ux&p=hierarchie-visuelle) : elle attire l'œil et distingue les éléments entre eux. Elle mérite son propre chapitre car elle obéit à des règles propres — d'harmonie, de lisibilité, et d'accessibilité.

## La roue chromatique et les harmonies

La **roue chromatique** place les couleurs en cercle, dans l'ordre où elles se dégradent les unes vers les autres :

```
                Rouge
        Violet        Orange
        Bleu          Jaune
                Vert
```

Leur position relative sur ce cercle détermine des combinaisons ("harmonies") qui fonctionnent visuellement :

| Harmonie | Comment la repérer sur la roue | Exemple | Effet visuel |
|---|---|---|---|
| Complémentaire | Deux couleurs à l'opposé l'une de l'autre | Rouge / Vert | Fort contraste, dynamique — peut fatiguer l'œil si sur-utilisé |
| Analogue | Plusieurs couleurs voisines | Jaune / Vert / Bleu | Douce et cohérente, peu de contraste |
| Triadique | Trois couleurs régulièrement espacées | Rouge / Jaune / Bleu | Vive et équilibrée, plus difficile à doser |

> **Piège :** choisir une harmonie (par exemple triadique) puis utiliser ses couleurs à parts égales. Le résultat perd toute [hiérarchie visuelle](/?c=ui-ux&p=hierarchie-visuelle) et devient criard — aucune des trois ne se distingue comme la plus importante.
>
> **Bonne pratique :** répartir les couleurs selon une proportion dominante/secondaire/accent — une règle courante est le **60-30-10** : 60 % d'une couleur dominante neutre, 30 % d'une couleur secondaire, 10 % d'une couleur d'accent réservée aux éléments qui doivent vraiment ressortir (un bouton d'action, par exemple).

## Le contraste : la lisibilité avant tout (WCAG)

Le **WCAG** (*Web Content Accessibility Guidelines*) est un ensemble de règles de référence pour l'accessibilité web. Il définit un **ratio de contraste** minimal entre un texte et son fond, mesuré automatiquement par un outil (pas à calculer à la main) :

| Niveau | Ratio minimal | S'applique à |
|---|---|---|
| AA | 4.5 : 1 | Texte normal — le niveau minimal généralement recommandé |
| AA (texte large) | 3 : 1 | Titres et texte de grande taille (≥ 18 pt, ou 14 pt en gras) |
| AAA | 7 : 1 | Niveau renforcé, recommandé pour un public malvoyant |

> **Piège :** un texte gris clair sur fond blanc, choisi "parce que ça fait plus doux". Visuellement discret, mais souvent sous le ratio 4.5:1 — illisible pour une partie des utilisateurs (vue faible, écran en plein soleil, écran mal calibré...).
>
> **Bonne pratique :** vérifier le ratio réel avec un outil dédié (le contrôleur de contraste intégré aux outils de développement du navigateur, ou un vérificateur en ligne) plutôt qu'à l'œil.

## Ne jamais coder une information uniquement par la couleur

```
❌ Mauvais : dans un formulaire, un champ en erreur est bordé de rouge, un champ valide de vert —
   c'est la SEULE différence entre les deux.

✅ Bon : le champ en erreur est bordé de rouge, ET affiche une icône ⚠, ET un message texte
   ("Format d'email invalide") — trois indices, dont deux ne dépendent pas de la perception des couleurs.
```

> **Piège :** distinguer deux états uniquement par la couleur (rouge/vert en particulier). Environ 8 % des hommes (une proportion plus faible chez les femmes) ont une forme de daltonisme et ne perçoivent pas cette différence.
>
> **Bonne pratique :** doubler systématiquement une information codée en couleur par un second indice qui n'en dépend pas : icône, texte, position, forme ou motif.

## Signification culturelle des couleurs

Une couleur n'évoque pas la même chose partout — à nuancer selon le public réellement visé, surtout pour un produit international :

| Couleur | Association fréquente (culture occidentale) | Nuance ailleurs |
|---|---|---|
| Rouge | Danger, urgence | Couleur de chance et de fête en Chine |
| Blanc | Pureté, mariage | Couleur de deuil dans plusieurs cultures d'Asie de l'Est |
| Vert | Nature, validation, argent (culture US) | Association bien plus faible à l'argent hors des États-Unis |

> **Bonne pratique :** ne jamais supposer qu'une association est universelle. Vérifier auprès du public cible réel plutôt que de se fier à une seule référence culturelle.

> **Tendance actuelle (2026) :** hyper-personnalisation des palettes (des interfaces qui peuvent s'adapter aux préférences de chaque utilisateur) et retour à des couleurs affirmées, "avec du caractère", plutôt qu'à des tons neutres passe-partout.

## Passer à l'implémentation

En CSS, une palette de couleurs se déclare comme un ensemble de valeurs réutilisables plutôt que répétées à chaque règle — voir [Variables CSS et la cascade](/?c=langages-de-balisage&s=css&p=variables-et-cascade).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La couleur combine des harmonies (complémentaire, analogue, triadique) et un contraste suffisant (ratios WCAG AA 4.5:1 / AAA 7:1) pour rester à la fois esthétique et lisible par tous. |
| **Outils utilisables** | Un contrôleur de contraste (intégré aux outils de développement du navigateur, ou en ligne) pour vérifier un ratio réel plutôt qu'à l'œil. |
| **Pièges à éviter** | Utiliser les couleurs d'une harmonie à parts égales (perte de hiérarchie) ; coder une information uniquement par la couleur (invisible pour les daltoniens, ~8 % des hommes). |
| **Bonnes pratiques** | Répartir les couleurs en dominante/secondaire/accent (règle du 60-30-10) ; doubler toute information codée en couleur par un second indice (icône, texte, forme). |
