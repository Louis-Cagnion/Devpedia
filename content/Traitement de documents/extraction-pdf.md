---
order: 1
---

# Extraire le texte et les pages d'un PDF

Un **PDF** (*Portable Document Format*) est un format de fichier conçu pour qu'un document s'affiche à l'identique sur n'importe quel appareil, contrairement à un fichier éditable ([Word](https://www.microsoft.com/microsoft-365/word), [HTML](/?c=langages-de-balisage&s=html&p=html)) dont la mise en page peut varier selon le logiciel qui l'ouvre. Cette portabilité a un coût pour qui veut en extraire l'information automatiquement : un PDF ne contient pas "du texte" de façon uniforme, il mélange deux natures de contenu très différentes sur une même page.

## Deux natures de contenu, sur la même page

| | Texte natif | Contenu image |
|---|---|---|
| Ce que c'est | De vrais caractères stockés comme tels dans le fichier (comme dans un fichier texte) | Des pixels, exactement comme une photo : aucun caractère n'est stocké derrière |
| D'où ça vient | Un document généré depuis un logiciel (traitement de texte, export web) | Une page scannée, une capture d'écran collée dans le document, un tableau complexe mis en forme comme une image |
| Comment l'extraire | Lire directement les caractères stockés : rapide, fiable, aucune erreur d'interprétation possible | Impossible de "lire" des pixels comme du texte : il faut soit les interpréter visuellement ([OCR structuré](/?c=traitement-de-documents&p=ocr-structure)), soit renoncer à cette portion |

> **Piège :** supposer qu'un PDF contient toujours du texte natif exploitable. Un document entièrement scanné (chaque page est une simple photo pleine page) ne contient **aucun** texte natif, même si le fichier "a l'air" d'un document texte à l'ouverture : sans étape d'OCR, aucune extraction automatique n'y trouvera le moindre caractère.
>
> **Bonne pratique :** vérifier concrètement la présence de texte natif sur un échantillon avant de concevoir un pipeline d'extraction ; ne jamais supposer qu'un PDF "ressemble" à un document texte du seul fait qu'il en a l'apparence visuelle.

## Extraire le texte natif : blocs, positions, taille de police

Une bibliothèque comme [**PyMuPDF**](https://pymupdf.readthedocs.io) (module [Python](/?c=langages-de-programmation&s=python&p=python) `pymupdf`) ouvre un PDF et donne accès, page par page, à sa structure interne : le texte n'est jamais renvoyé comme une seule grande chaîne, mais découpé en **blocs** (un paragraphe, une cellule de tableau...), eux-mêmes découpés en lignes puis en **spans** (une portion de texte partageant la même police et la même taille) :

```python
import pymupdf

with pymupdf.open("document.pdf") as document:
    for numero_page, page in enumerate(document, start=1):
        for bloc in page.get_text("dict")["blocks"]:
            if bloc["type"] != 0:      # 0 = bloc de texte ; 1 = bloc image, à ignorer ici
                continue
            spans = [span for ligne in bloc["lines"] for span in ligne["spans"]]
            texte = "".join(span["text"] for span in spans).strip()
            if not texte:
                continue                # bloc vide (espacement, ligne blanche) : rien à garder
            print(numero_page, bloc["bbox"], texte)
```

- `page.get_text("dict")` renvoie une structure imbriquée (dictionnaire [Python](/?c=langages-de-programmation&s=python&p=python)) plutôt qu'une simple chaîne : c'est ce qui donne accès à la **position** de chaque bloc sur la page (`bbox`, la boîte englobante en coordonnées `x0, y0, x1, y1`) et à sa mise en forme, pas seulement à son contenu textuel.
- `bloc["type"]` distingue un bloc de texte (`0`) d'un bloc image (`1`, couvert dans la section suivante) : un PDF peut mélanger les deux sur une même page, ce filtre ne garde que le texte.
- La **taille de police** d'un span (`span["size"]`) sert, dans un usage réel, à repérer un titre (police plus grande que le corps du texte) sans avoir à deviner la mise en page autrement qu'en la mesurant.

> **Piège :** prendre la taille de police **maximale** d'un bloc pour le caractériser, sans réfléchir à ce qui compose ce bloc. Un bloc peut mélanger, par exemple, un gros numéro de page collé à une petite mention de pied de page : la taille maximale refléterait alors le numéro de page, pas le texte réellement représentatif du bloc.
>
> **Bonne pratique :** caractériser un bloc par la taille de police du span le plus **long** (le plus de caractères), pas par la taille maximale brute : un choix simple qui évite qu'un élément court et isolé (numéro, puce) fausse la mesure.

## Rendre une page comme une image

Certains traitements (l'[OCR structuré](/?c=traitement-de-documents&p=ocr-structure), une vérification visuelle) ont besoin de la page comme une **image**, indépendamment de tout texte natif qu'elle contient déjà. PyMuPDF peut aussi produire ce rendu :

```python
pixmap = page.get_pixmap(dpi=200)
```

Un **DPI** (*dots per inch*, points par pouce) mesure la résolution du rendu : plus il est élevé, plus l'image produite est détaillée (et lourde). C'est un compromis direct :

| DPI | Effet |
|---|---|
| Trop bas (ex. 72, la résolution d'affichage écran classique) | Image floue : un petit texte ou un tableau dense devient illisible, y compris pour un OCR |
| Trop élevé (ex. 600) | Image très nette, mais bien plus lourde en mémoire et plus lente à traiter, sans gain réel au-delà d'un certain seuil |
| Compromis courant (ex. 200) | Suffisant pour la plupart des OCR modernes, sans exploser le temps de traitement |

> **Piège :** choisir un DPI par défaut sans le valider sur ses propres documents. Un DPI trop bas pour un tableau dense produit des erreurs d'OCR difficiles à diagnostiquer (le texte source était déjà illisible avant même que l'OCR n'intervienne) ; rien dans le comportement du programme ne signale cette cause précise.
>
> **Bonne pratique :** tester plusieurs valeurs de DPI sur des documents représentatifs du cas réel (texte dense, tableau fin) avant d'en figer une, plutôt que de recopier une valeur par défaut.

Le rendu produit par `get_pixmap` doit ensuite être converti en un tableau de nombres pour être exploitable par le reste d'un pipeline (OCR, affichage) :

```python
import numpy as np

image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
```

`pixmap.samples` est une suite brute d'octets (les pixels, un après l'autre) ; `reshape` la réorganise en un [tableau NumPy](/?c=data-science&p=numpy) à 3 dimensions (hauteur, largeur, canaux de couleur), la forme attendue par la quasi-totalité des bibliothèques de vision par ordinateur.

## Résultat : une structure, pas juste du texte brut

Un pipeline d'extraction complet produit typiquement, pour un PDF donné, deux collections distinctes plutôt qu'un unique bloc de texte : les blocs de texte natif (avec leur page et leur position) d'une part, les rendus image par page d'autre part. Garder cette séparation (plutôt que de tout fondre en une seule sortie texte) est ce qui permet aux étapes suivantes d'un pipeline de choisir, page par page voire bloc par bloc, la bonne méthode d'extraction.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un PDF mélange texte natif (caractères réellement stockés) et contenu image (pixels) sur une même page. Le texte natif s'extrait directement, avec position et taille de police ; le contenu image doit être rendu comme une image (résolution réglée en DPI) avant d'être interprété autrement. |
| **Outils utilisables** | `pymupdf` : `page.get_text("dict")` pour le texte structuré, `page.get_pixmap(dpi=...)` pour un rendu image, converti en tableau NumPy avec `np.frombuffer`/`reshape`. |
| **Pièges à éviter** | Supposer qu'un PDF scanné contient du texte natif. Caractériser un bloc par sa taille de police maximale plutôt que celle du span le plus long. Choisir un DPI par défaut sans le valider sur des documents réels. |
| **Bonnes pratiques** | Vérifier la présence réelle de texte natif avant de concevoir un pipeline. Mesurer un bloc par le span le plus long. Tester plusieurs DPI sur des documents représentatifs avant d'en figer un. |
