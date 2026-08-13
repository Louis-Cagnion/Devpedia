---
order: 2
---

# L'OCR structuré et l'analyse de mise en page

L'**OCR** (*Optical Character Recognition*, reconnaissance optique de caractères) est la famille de modèles qui convertissent des pixels en texte : l'opération nécessaire dès qu'un contenu n'existe que sous forme d'image plutôt que de [texte natif](/?c=traitement-de-documents&p=extraction-pdf) (un scan, un tableau mis en forme comme une image). Un OCR "texte brut" s'arrête là : il renvoie une suite de mots retrouvés sur l'image, avec leur position, sans aucune notion de ce qui les relie entre eux.

## Ce que l'OCR "texte brut" ne capture pas

Un tableau n'est pas qu'une liste de mots dispersés sur une page : c'est une **grille**, avec des lignes et des colonnes qui donnent leur sens aux valeurs qu'elle contient. Un OCR texte brut, sur un tableau, renvoie chaque cellule comme un mot isolé parmi d'autres, sans indiquer sur quelle ligne ni quelle colonne elle se trouve :

| | OCR texte brut | OCR structuré |
|---|---|---|
| Sortie | Une liste de mots, chacun avec sa position sur l'image | Une structure (lignes, colonnes, cellules), avec le texte de chaque cellule à sa bonne place |
| Suffit pour | Un paragraphe de texte simple | Un tableau, un formulaire à champs alignés |
| Ce qui manque au texte brut | Aucun moyen de savoir que deux mots appartiennent à la même ligne d'un tableau, plutôt qu'à deux endroits sans rapport de la page | - |

L'**OCR structuré** ajoute une étape d'**analyse de mise en page** (*layout analysis*) avant même de lire le texte : localiser d'abord les régions de la page (un titre, un paragraphe, un tableau...), puis, pour chaque région reconnue comme un tableau, reconstruire sa grille plutôt que de renvoyer un simple tas de mots.

## Deux modèles, deux coûts : filtrer avant de structurer

Un modèle qui localise des régions (répondre à "y a-t-il un tableau sur cette page ?") est beaucoup moins coûteux à faire tourner qu'un modèle qui, en plus, reconstruit entièrement la structure de ce tableau (lignes, colonnes, texte de chaque cellule). Lancer systématiquement le modèle complet sur chaque page, y compris celles qui ne contiennent visiblement aucun tableau, gaspille l'essentiel du temps de calcul :

```text
Page rendue en image
        │
        ▼
Modele de detection de mise en page (rapide, ~40x plus rapide que le pipeline complet)
        │
        ├── aucune zone "tableau" trouvee ──> page ignoree, rien d'autre a faire
        │
        └── au moins une zone "tableau" ──> pipeline complet de structuration
                                              (localisation precise + reconstruction
                                              de la grille, plus lent)
```

> **Piège :** faire tourner le modèle le plus complet (et le plus lent) sur chaque page d'un document, par simplicité d'implémentation, alors que la plupart des pages n'ont besoin que d'une réponse "y a-t-il un tableau ici ?".
>
> **Bonne pratique :** intercaler un modèle de pré-filtrage rapide qui élimine les cas négatifs évidents, et ne réserver le modèle coûteux qu'aux régions qui en ont réellement besoin. Le même principe qu'un [index qui évite de parcourir une table entière](/?c=domain-specific-languages-dsl&p=sql) : répondre vite à "faut-il chercher ici ?" avant de faire le travail complet.

## Reconstruire la grille : lignes, colonnes, cellules fusionnées

Un tableau détecté ne se limite pas à une grille rectangulaire uniforme : une cellule d'en-tête peut s'étendre sur plusieurs colonnes, ou une cellule de la première colonne peut couvrir plusieurs lignes. Deux notions décrivent ces fusions, héritées directement du vocabulaire HTML des tableaux :

```text
+----------+----------------------+
|          |      Trimestre 1     |   <- "colspan" 2 : une cellule qui couvre 2 colonnes
+----------+-----------+----------+
|          |  Janvier  | Fevrier  |
+----------+-----------+----------+
| Region A |    120    |   135    |
+          +-----------+----------+   <- "rowspan" 2 : "Region A" couvre ces 2 lignes
|          |    98     |   110    |
+----------+-----------+----------+
```

| Terme | Signifie |
|---|---|
| `colspan` (*column span*) | Une cellule occupe plusieurs colonnes sur la même ligne |
| `rowspan` (*row span*) | Une cellule occupe plusieurs lignes sur la même colonne |

Un modèle d'OCR structuré (comme [PP-StructureV3](/?c=ia&s=vision-et-ocr&p=modeles-document-ai), utilisé dans le projet source de ce chapitre) restitue typiquement cette grille au format **HTML** (`<table>`, `<tr>`, `<td colspan="...">`), le même format que celui d'une page web : reconstruire, à partir de ce HTML, la position exacte (ligne, colonne) de chaque cellule en tenant compte des fusions en cours, est un exercice de [parsing incrémental](/?c=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats) à part entière.

> **Piège :** ignorer les fusions et supposer qu'un tableau reconstruit a toujours autant de cellules sur chaque ligne. Une ligne dont une colonne est "sautée" à cause d'un `rowspan` commencé plus haut aurait, sans en tenir compte, un décalage silencieux entre le contenu et la colonne à laquelle il est réellement associé.
>
> **Bonne pratique :** suivre explicitement, colonne par colonne, combien de lignes restantes une fusion verticale doit encore occuper, avant de placer la cellule suivante d'une ligne.

## Les résultats d'un modèle de détection ne sont jamais parfaits

Un modèle qui localise des zones (ici, des tableaux) fournit un **score de confiance** par zone détectée, et peut aussi détecter deux fois la même zone physique sous deux boîtes légèrement différentes (une couvrant tout le tableau, une autre n'en couvrant qu'une partie) : voir [Détection de mise en page : boîtes englobantes, score de confiance et suppression des doublons](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) pour le détail du filtrage par score de confiance et de la déduplication par IoU/NMS, directement applicable ici.

Voir aussi [Extraire le texte et les pages d'un PDF](/?c=traitement-de-documents&p=extraction-pdf) pour l'étape qui précède (obtenir l'image de la page à analyser), et [Arbitrage local vs cloud pour un modèle de vision](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) pour la question de savoir où faire tourner ce type de modèle.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un OCR texte brut renvoie des mots isolés avec leur position ; un OCR structuré ajoute une analyse de mise en page (localiser titres, paragraphes, tableaux) et reconstruit la grille d'un tableau (lignes, colonnes, cellules fusionnées via `rowspan`/`colspan`). |
| **Outils utilisables** | Un modèle de détection de mise en page léger comme pré-filtre, un pipeline complet de structuration réservé aux zones qui en ont besoin. |
| **Pièges à éviter** | Lancer systématiquement le modèle le plus coûteux sur chaque page. Ignorer les fusions de cellules lors de la reconstruction d'une grille. Garder sans filtrage des détections à faible score ou des zones quasi-dupliquées. |
| **Bonnes pratiques** | Pré-filtrer avec un modèle rapide avant le pipeline complet. Suivre explicitement les fusions colonne par colonne. Filtrer par score de confiance et dédupliquer les zones qui se recouvrent fortement. |
