---
order: 18
---

# Détection de mise en page : boîtes englobantes, score de confiance et suppression des doublons

Le chapitre [L'OCR structuré et l'analyse de mise en page](/?c=traitement-de-documents&p=ocr-structure) présente le principe général : avant de lire le texte, un modèle localise d'abord les régions de la page (titre, paragraphe, tableau...). Ce chapitre développe le fonctionnement de ce modèle de localisation lui-même, une **détection d'objets** (*object detection*) au sens général du terme, appliquée ici à des zones de page plutôt qu'à des objets photographiés.

## La boîte englobante : représenter une zone détectée

Une **boîte englobante** (*bounding box*) représente la position d'une zone détectée sur la page par un simple rectangle, décrit par 4 nombres :

```text
(x_min, y_min) ●─────────────────────┐
               │                     │
               │   Zone detectee     │
               │   (ex: un tableau)  │
               │                     │
               └─────────────────────● (x_max, y_max)
```

| Représentation | Les 4 nombres |
|---|---|
| Coins opposés | `x_min`, `y_min` (coin haut-gauche), `x_max`, `y_max` (coin bas-droit) |
| Centre + dimensions | `x_centre`, `y_centre`, `largeur`, `hauteur` |

Les deux représentations décrivent le même rectangle ; le choix entre elles est une convention du modèle utilisé (à vérifier dans sa documentation), pas une différence de fond.

Pour chaque boîte, le modèle produit aussi une **classe** (le type de zone : titre, paragraphe, tableau, figure...) et un **score de confiance** : une probabilité, entre 0 et 1, que cette classe soit la bonne pour cette zone (le même type de sortie qu'une [classification par softmax](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones), la classe retenue étant celle de plus haute probabilité).

> **Piège :** garder toutes les boîtes renvoyées par le modèle, sans regarder leur score de confiance. Un modèle de détection propose systématiquement de nombreuses boîtes candidates sur toute l'image ; la plupart ont un score de confiance très bas (un simple bloc de texte aligné confondu avec un tableau, par exemple) et ne correspondent à rien de réel sur la page.
>
> **Bonne pratique :** écarter toute boîte dont le score de confiance tombe sous un seuil fixé à l'avance (souvent entre 0.3 et 0.7 selon la tolérance aux faux positifs voulue), avant tout autre traitement.

## Le problème des doublons : IoU (*Intersection over Union*)

Un modèle de détection propose ses boîtes candidates indépendamment les unes des autres : il est donc courant qu'il détecte la **même zone physique** plusieurs fois, sous forme de plusieurs boîtes légèrement différentes (l'une couvrant tout un tableau, une autre n'en couvrant qu'une partie, une troisième légèrement décalée) :

```text
┌──────────────────┐
│  ┌───────────────┼──┐    <- 3 boites qui se recouvrent fortement,
│  │///////////////│  │       toutes candidates pour LE MEME tableau
└──┼───────────────┘  │
   └───────────────────┘
```

Pour décider si deux boîtes désignent la même zone (à dédupliquer) ou deux zones réellement distinctes (à garder toutes les deux), il faut mesurer leur recouvrement. L'**IoU** (*Intersection over Union*) est cette mesure : l'aire de leur intersection, divisée par l'aire de leur union.

```text
Boite A          Boite B
┌────────┐
│    ┌───┼────┐
│    │###│    │    ### = intersection (partagee par A et B)
└────┼───┘    │
     └────────┘

IoU = aire(###) / aire(A union B)
```

```python
def iou(boite_a, boite_b):
    # Coordonnees du rectangle d'intersection
    x_min = max(boite_a.x_min, boite_b.x_min)
    y_min = max(boite_a.y_min, boite_b.y_min)
    x_max = min(boite_a.x_max, boite_b.x_max)
    y_max = min(boite_a.y_max, boite_b.y_max)

    largeur_intersection = max(0, x_max - x_min)   # 0 si les boites ne se touchent pas
    hauteur_intersection = max(0, y_max - y_min)
    aire_intersection = largeur_intersection * hauteur_intersection

    aire_a = (boite_a.x_max - boite_a.x_min) * (boite_a.y_max - boite_a.y_min)
    aire_b = (boite_b.x_max - boite_b.x_min) * (boite_b.y_max - boite_b.y_min)
    aire_union = aire_a + aire_b - aire_intersection

    return aire_intersection / aire_union
```

Un IoU de 1 signifie deux boîtes identiques ; un IoU de 0 signifie qu'elles ne se touchent pas du tout. Deux boîtes qui désignent la même zone physique ont typiquement un IoU élevé (souvent au-dessus de 0.5), même si leurs coordonnées exactes diffèrent légèrement.

> **Piège :** soustraire l'intersection une deuxième fois en calculant l'union (`aire_a + aire_b`, sans le `- aire_intersection`). L'intersection appartient aux deux aires individuelles : l'additionner sans la retirer une fois la compte deux fois, ce qui gonfle artificiellement l'union et fait sous-estimer l'IoU.
>
> **Bonne pratique :** toujours vérifier la formule `union = aire_a + aire_b - intersection` (le cas le plus simple du [principe d'inclusion-exclusion](https://fr.wikipedia.org/wiki/Principe_d%27inclusion-exclusion), une règle générale de comptage pour ne pas compter deux fois une partie commune à deux ensembles) plutôt que de l'improviser de mémoire.

## NMS (*Non-Maximum Suppression*) : garder une seule boîte par zone

La **NMS** (suppression des non-maxima) utilise l'IoU pour ne garder qu'une boîte par zone physique, parmi tous les doublons candidats :

```text
1. Trier toutes les boites par score de confiance decroissant
2. Prendre la boite de plus haut score -> la garder definitivement
3. Supprimer toutes les boites restantes dont l'IoU avec elle depasse un seuil
   (ex: 0.5) -> ce sont des doublons de la boite qu'on vient de garder
4. Repeter les etapes 2 et 3 sur les boites qui restent, jusqu'a ce qu'il n'y en ait plus
```

```python
def nms(boites, seuil_iou=0.5):
    boites_triees = sorted(boites, key=lambda b: b.score, reverse=True)
    gardees = []
    while boites_triees:
        meilleure = boites_triees.pop(0)   # score le plus haut restant
        gardees.append(meilleure)
        boites_triees = [
            b for b in boites_triees
            if iou(meilleure, b) <= seuil_iou   # ecarte les doublons de "meilleure"
        ]
    return gardees
```

À chaque tour, la boîte de meilleur score restante est supposée être la meilleure estimation de la zone réelle : toutes celles qui la recouvrent fortement sont donc ses doublons, pas des zones distinctes.

> **Piège :** appliquer la NMS à toutes les boîtes en même temps, sans distinguer leur classe prédite. Une boîte "titre" et une boîte "tableau" peuvent se chevaucher par coïncidence géométrique (un titre juste au-dessus d'un tableau, dont les boîtes se touchent légèrement) sans désigner la même zone : les traiter ensemble risquerait de supprimer à tort l'une des deux.
>
> **Bonne pratique :** appliquer la NMS séparément pour chaque classe (comparer les boîtes "tableau" entre elles, les boîtes "titre" entre elles, etc.), jamais entre classes différentes.

## Le seuil IoU : un compromis, pas une valeur universelle

| Seuil IoU choisi | Effet |
|---|---|
| Trop bas (ex. 0.1) | Des zones réellement distinctes mais proches (deux petits tableaux côte à côte) risquent d'être fusionnées en une seule |
| Trop haut (ex. 0.9) | Des doublons évidents de la même zone, avec des coordonnées légèrement différentes, ne sont pas éliminés |

> **Bonne pratique :** ajuster ce seuil sur des documents représentatifs du cas d'usage réel (des tableaux denses et rapprochés demandent un seuil plus haut qu'une mise en page aérée), plutôt que de garder une valeur par défaut sans l'avoir vérifiée sur ses propres documents.

Voir aussi [L'OCR structuré et l'analyse de mise en page](/?c=traitement-de-documents&p=ocr-structure) pour la suite du pipeline (reconstruire la grille d'un tableau une fois sa zone localisée et dédupliquée), et [Les réseaux de neurones : les fondamentaux](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) pour la classification par score de confiance sur laquelle repose ce chapitre.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un modèle de détection produit des boîtes englobantes (4 coordonnées), chacune avec une classe et un score de confiance. Il détecte souvent la même zone plusieurs fois : l'IoU (aire d'intersection / aire d'union) mesure le recouvrement entre deux boîtes, et la NMS ne garde que la boîte de meilleur score parmi celles qui se recouvrent fortement, classe par classe. |
| **Outils utilisables** | Les bibliothèques de vision par ordinateur ([torchvision](https://pytorch.org/vision/stable/index.html), par exemple) fournissent des implémentations de NMS prêtes à l'emploi, plus rapides que du code [Python](/?c=langages-de-programmation&s=python&p=python) pur sur un grand nombre de boîtes. |
| **Pièges à éviter** | Garder des boîtes à faible score de confiance sans filtrage. Mal calculer l'union en comptant l'intersection deux fois. Appliquer la NMS entre classes différentes plutôt que séparément par classe. Garder un seuil IoU par défaut sans le valider sur ses propres documents. |
| **Bonnes pratiques** | Filtrer par score de confiance avant tout traitement. Vérifier la formule de l'union (inclusion-exclusion). Appliquer la NMS séparément par classe. Ajuster le seuil IoU sur des documents représentatifs du cas d'usage réel. |
