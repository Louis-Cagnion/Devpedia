---
order: 1
---

# Hiérarchie visuelle

Face à un écran, personne ne lit dans l'ordre du code source : l'œil saute spontanément vers certains éléments avant d'autres. La **hiérarchie visuelle** est la technique qui décide de cet ordre à la place du hasard.

**Hiérarchie visuelle** : organiser les éléments d'un écran pour que l'œil aille vers ce qui compte le plus en premier, puis vers le reste dans un ordre voulu.

> **Analogie :** la une d'un journal. Le titre principal est énorme, le sous-titre plus petit, le corps de texte plus petit encore. Personne n'a besoin qu'on lui dise quoi lire en premier — la taille seule l'indique.

**Pourquoi ça compte :** sans hiérarchie, tous les éléments ont le même poids visuel. L'utilisateur doit alors tout lire pour trouver l'information qu'il cherche — sur un site ou une appli, ce temps perdu se traduit directement par de l'abandon.

## Les leviers de la hiérarchie

Un élément ressort par rapport aux autres via une combinaison de ces leviers :

| Levier | Effet | Exemple |
|---|---|---|
| Taille | Plus grand = perçu comme plus important | Un titre `h1` plus grand que le texte courant |
| Poids / graisse | Plus épais (gras) = attire l'œil | Un mot-clé en **gras** dans un paragraphe |
| Couleur | Une couleur qui tranche avec le reste attire l'attention | Un bouton d'action coloré au milieu d'une page en niveaux de gris |
| Contraste | Un élément net sur un fond qui l'oppose ressort | Texte foncé sur fond clair, ou l'inverse |
| Espacement | Plus d'espace vide autour d'un élément = il est isolé, donc remarqué | Un titre entouré de marge plutôt que collé au texte suivant |
| Position | Un élément placé en haut ou à gauche (lecture occidentale) est vu en premier | Le logo et le menu principal en haut d'une page |

```
<h1>Titre principal</h1>       → gros, gras : lu en premier
<p>Texte d'introduction.</p>   → taille normale : lu ensuite
<small>Mentions légales</small> → petit, discret : lu en dernier, si besoin
```

Ces leviers se combinent : un titre gros ET gras ET isolé par de l'espace ressort bien plus qu'un titre qui n'a qu'un seul de ces trois atouts.

## Un point focal par écran : primaire, secondaire, tertiaire

Sur un écran donné, chaque élément se classe dans l'un de ces trois rôles :

| Rôle | Rôle sur l'écran | Exemple |
|---|---|---|
| Primaire | L'unique élément que l'utilisateur doit voir en premier | Le bouton "S'inscrire" d'une page d'accueil |
| Secondaire | Ce qui soutient ou explique le primaire | Le sous-titre qui décrit l'offre |
| Tertiaire | Le détail consulté seulement si besoin | Les mentions légales, un lien "en savoir plus" |

> **Piège :** vouloir tout mettre en avant en même temps — un titre énorme, plusieurs boutons colorés, du texte en gras partout. Résultat : plus rien ne ressort, l'écran devient une bouillie visuelle où l'œil ne sait plus où aller (la *surcharge visuelle*).
>
> **Bonne pratique :** choisir un seul élément primaire par écran avant de designer quoi que ce soit d'autre. Tout le reste se hiérarchise ensuite en dessous de lui, jamais à son niveau.

## Schémas de lecture : F-pattern et Z-pattern

Des études de suivi du regard (*eye-tracking*) montrent que l'œil suit des trajectoires récurrentes selon le type de page.

**F-pattern** — pour une page dense en texte (article, résultats de recherche, liste de produits) :

```
█████████████████████████    ← 1re ligne : balayée en entier
████████████
█
████████████████             ← 2e ligne : balayée, plus courte
████
█                             ← puis l'œil descend surtout
█                                le long de la marge de gauche,
█                                lisant peu le reste de chaque ligne
```

L'utilisateur lit en entier les premières lignes, puis se contente de scanner le début des lignes suivantes en descendant. Conséquence pratique : mettre l'information la plus importante dans les premiers mots de chaque titre ou paragraphe.

**Z-pattern** — pour une page simple et peu dense (page d'accueil, landing page) :

```
[Logo]──────────────────────►[Menu / Connexion]
                                            ╱
                                 ╱
                     ╱
           ╱
  ╱
[Argument clé]──────────────►[Bouton d'action]
```

L'œil part en haut à gauche, balaie vers la droite, redescend en diagonale, puis balaie une dernière fois vers la droite — où se place naturellement le bouton d'action principal (le point primaire défini plus haut).

> **Piège :** appliquer un Z-pattern à une page dense en texte (ou l'inverse). Le schéma de lecture dépend de la densité de contenu, pas d'une préférence esthétique — un mauvais choix pousse l'utilisateur à lire dans le désordre voulu par le designer, pas dans celui qui lui vient naturellement.

> **Tendance actuelle (2026) :** après plusieurs années de mises en page très expérimentales, la tendance revient vers des hiérarchies lisibles et prévisibles, plus proches de ces schémas classiques que d'une composition surprenante — la nouveauté visuelle cède du terrain face à la rapidité de compréhension.

## Passer à l'implémentation

Ce chapitre reste volontairement indépendant d'un langage : les leviers ci-dessus (taille, espacement, position...) se traduisent concrètement en CSS via [Le modèle de boîte](/?c=langages-de-balisage&s=css&p=box-model) (espacement, dimensions) et [Le positionnement](/?c=langages-de-balisage&s=css&p=positionnement) (placement des éléments à l'écran).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La hiérarchie visuelle organise un écran pour que l'œil aille vers ce qui compte en premier. Elle s'obtient via des leviers (taille, poids, couleur, contraste, espacement, position) et repose sur un seul élément primaire par écran. |
| **Outils utilisables** | Aucun outil spécifique — la hiérarchie se décide au moment de la conception (croquis, maquette) puis se traduit en code (CSS, principalement). |
| **Pièges à éviter** | Mettre plusieurs éléments en avant en même temps (surcharge visuelle, plus rien ne ressort) ; appliquer un schéma de lecture (F ou Z) qui ne correspond pas à la densité réelle du contenu. |
| **Bonnes pratiques** | Choisir un seul élément primaire par écran avant de hiérarchiser le reste ; combiner plusieurs leviers (taille + espacement + position) plutôt qu'un seul pour renforcer un élément important. |
