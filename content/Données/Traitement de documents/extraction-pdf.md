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

## Détecter un tableau par heuristique géométrique

Repérer un tableau dans une page sans recourir à l'[OCR structuré](/?c=traitement-de-documents&p=ocr-structure) ni à un modèle d'apprentissage automatique : PyMuPDF analyse la **géométrie** de la page (lignes de grille réellement dessinées dans le PDF, alignement des blocs de texte natif entre eux) pour en déduire une structure de tableau :

```python
with pymupdf.open("document.pdf") as document:
    page = document[0]
    for tableau in page.find_tables():
        # liste de lignes, chaque ligne = liste de cellules (str ou None)
        lignes = tableau.extract()
        print(tableau.bbox, len(lignes), "lignes")
```

`find_tables()` renvoie un objet parcourable page par page ; chaque tableau trouvé expose sa position (`bbox`) et une méthode `extract()` qui rend son contenu déjà rangé en lignes/cellules, sans qu'il soit besoin de reconstituer la grille soi-même à partir des positions de texte brutes.

| | Heuristique géométrique (`find_tables()`) | OCR structuré |
|---|---|---|
| S'appuie sur | Lignes vectorielles + alignement du texte natif | Pixels de la page rendue comme une image |
| Fonctionne sur une page scannée | Non (aucun texte natif ni ligne vectorielle à mesurer) | Oui |
| Vitesse | Rapide : pas de modèle à faire tourner | Plus lent : inférence sur une image |

> **Piège :** un tableau sans bordures visibles ni alignement net (colonnes séparées par des espaces irréguliers, pas de grille dessinée) peut être détecté partiellement, voire pas du tout : `find_tables()` mesure une géométrie réellement présente, il ne devine jamais une structure absente du rendu.
>
> **Bonne pratique :** vérifier le résultat de `find_tables()` sur un échantillon représentatif des tableaux réels du projet avant de l'intégrer tel quel à un pipeline, comme pour toute heuristique fondée sur la mise en page.

## Rattraper un sous-comptage de colonnes avec `img2table`

Le piège de `find_tables()` vu plus haut (un tableau sans grille dessinée est mal détecté) a un cas particulier fréquent : un tableau **détecté**, mais avec **moins de colonnes que la réalité**, faute de séparation visuelle nette entre elles. [`img2table`](https://github.com/xavctn/img2table) résout spécifiquement ce cas : plutôt que de s'appuyer sur l'alignement du texte natif, il analyse les **contours** de la page (via OpenCV) comme une image, tout en réutilisant le texte natif du PDF (pas d'OCR) pour remplir les cellules détectées.

```python
from img2table.document import PDF as Img2TablePDF

resultats = Img2TablePDF(
    src="document.pdf", pages=[0], pdf_text_extraction=True
).extract_tables(borderless_tables=True, implicit_rows=False, implicit_columns=False)
```

`pdf_text_extraction=True` demande à `img2table` de réutiliser le texte natif du PDF plutôt que d'invoquer un OCR : plus rapide, et fiable dès que le PDF contient déjà du texte natif (voir plus haut). `borderless_tables=True` active la détection par contours pour un tableau sans bordure visible, précisément le cas qui met `find_tables()` en défaut.

### Combiner les deux plutôt que choisir l'un ou l'autre

`img2table` n'est pas systématiquement meilleur que `find_tables()` : lancer une analyse de contours sur chaque page, y compris celles dont les tableaux sont déjà correctement détectés, coûte du temps sans bénéfice. Une stratégie plus ciblée consiste à ne relancer `img2table` que sur les pages dont un tableau `find_tables()` est jugé structurellement suspect (un signal simple : une cellule qui concatène plusieurs valeurs chiffrées distinctes, symptôme de colonnes fusionnées à tort), puis à ne remplacer le tableau natif par sa version `img2table` que si celle-ci compte réellement plus de colonnes :

```python
def rattraper_tableaux_sous_comptes(chemin_pdf, tableaux_natifs):
    pages_suspectes = {t.page for t in tableaux_natifs if semble_structurellement_suspect(t.cellules)}
    if not pages_suspectes:
        return tableaux_natifs   # rien a rattraper : aucun cout d'img2table paye pour rien

    candidats_par_page = Img2TablePDF(
        src=chemin_pdf, pages=[p - 1 for p in pages_suspectes], pdf_text_extraction=True
    ).extract_tables(borderless_tables=True, implicit_rows=False, implicit_columns=False)

    resultat = []
    for tableau_natif in tableaux_natifs:
        candidats = [c for c in candidats_par_page.get(tableau_natif.page - 1, [])
                     if taux_de_recouvrement(c.bbox, tableau_natif.bbox) >= 0.7]
        meilleur = max((compter_colonnes(c) for c in candidats), default=0)
        if candidats and meilleur > compter_colonnes(tableau_natif.cellules):
            resultat.extend(candidats)   # img2table fait mieux : on le prefere
        else:
            resultat.append(tableau_natif)   # find_tables() suffisait
    return resultat
```

> **Piège :** comparer directement les coordonnées (`bbox`) d'un tableau `img2table` à celles d'un tableau `find_tables()` sans conversion préalable. `img2table` restitue ses coordonnées dans l'espace pixel de son propre rendu interne, à une résolution fixe (200 DPI), indépendante du DPI éventuellement utilisé ailleurs dans le pipeline pour [rendre la page en image](#rendre-une-page-comme-une-image) : sans remise à l'échelle vers ce même DPI de référence, deux tableaux à la même position réelle sur la page peuvent sembler ne pas se chevaucher du tout.
>
> **Bonne pratique :** ne jamais assigner un même tableau `img2table` candidat à plus d'un tableau natif : dès qu'un candidat est retenu pour remplacer un tableau, l'exclure des candidats restants pour les tableaux natifs suivants de la même page, pour éviter qu'un seul tableau détecté par contours serve deux fois de remplacement.

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
| **Outils utilisables** | `pymupdf` : `page.get_text("dict")` pour le texte structuré, `page.find_tables()` pour une détection de tableau par géométrie, `page.get_pixmap(dpi=...)` pour un rendu image, converti en tableau NumPy avec `np.frombuffer`/`reshape`. `img2table` (détection par contours OpenCV + texte natif) pour rattraper un sous-comptage de colonnes de `find_tables()`. |
| **Pièges à éviter** | Supposer qu'un PDF scanné contient du texte natif. Caractériser un bloc par sa taille de police maximale plutôt que celle du span le plus long. Attendre de `find_tables()` qu'il devine un tableau sans grille ni alignement net. Choisir un DPI par défaut sans le valider sur des documents réels. Comparer des `bbox` `img2table`/`find_tables()` sans les remettre à la même échelle de DPI. |
| **Bonnes pratiques** | Vérifier la présence réelle de texte natif avant de concevoir un pipeline. Mesurer un bloc par le span le plus long. Valider `find_tables()` sur un échantillon réel avant de l'automatiser. Tester plusieurs DPI sur des documents représentatifs avant d'en figer un. Ne relancer `img2table` que sur les pages suspectes, et ne remplacer un tableau natif que si `img2table` compte réellement plus de colonnes. |
