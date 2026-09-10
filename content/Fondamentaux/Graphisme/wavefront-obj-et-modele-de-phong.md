---
order: 2
---

# Le format Wavefront .obj et le modèle de Phong

Le [chapitre précédent](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) simule la 3D à partir d'une carte 2D, sans jamais charger de vrai maillage. Un moteur de rendu 3D moderne (OpenGL, Vulkan, Metal) part au contraire d'un objet modélisé dans un outil comme Blender, exporté dans un fichier texte qu'il faut lire et transformer en données exploitables par la carte graphique.

## Le format .obj : une instruction par ligne

Un fichier **.obj** (format Wavefront) liste, une ligne à la fois, les données géométriques d'un objet. Chaque ligne commence par un mot-clé qui indique le type d'instruction :

| Préfixe | Contenu | Exemple |
|---|---|---|
| `v` | Un sommet, en coordonnées x y z | `v 0.232406 -1.216630 1.133818` |
| `vt` | Une coordonnée de texture (pour plaquer une image sur la surface) | `vt 0.5 0.8` |
| `vn` | Un vecteur normal (orientation d'une surface, utile pour l'éclairage) | `vn 0.0 1.0 0.0` |
| `o` | Le nom de l'objet qui commence à cette ligne | `o Cube` |
| `f` | Une face, qui relie plusieurs sommets déjà déclarés | `f 16 2 3 17` |
| `mtllib` / `usemtl` | Référence vers un fichier de matériaux et le matériau à appliquer | `mtllib 42.mtl` |
| `s` | Active/désactive le lissage des normales pour les faces suivantes (groupe de lissage) | `s off` ou `s 1` |

> **Piège :** les indices utilisés dans une ligne `f` commencent à **1**, pas à 0. `f 16 2 3 17` désigne le 16e sommet déclaré par une ligne `v`, pas le 17e. C'est une source classique d'erreur par décalage d'un cran (*off-by-one*) chez qui écrit son premier analyseur de ce format, l'indexation habituelle des tableaux commençant à 0 dans la plupart des langages.

## Des faces à nombre de sommets variable

Une ligne `f` ne relie pas forcément trois sommets : un modeleur 3D exporte souvent des faces à 4 sommets (des quadrilatères, ou *quads*), voire davantage. Or la carte graphique ne sait dessiner nativement que des triangles (une surface à plus de 3 sommets n'est pas garantie d'être plane). Il faut donc **trianguler** : découper chaque face à 4+ sommets en plusieurs triangles, une étape à part entière du traitement du fichier, distincte de sa simple lecture.

```text
Face lue depuis le fichier :         Une fois triangulee :
f 1 2 3 4                            triangle 1 2 3
(un quad, 4 sommets)                 triangle 1 3 4
```

Cette méthode (relier systématiquement le premier sommet à chaque paire de sommets suivants) s'appelle la **triangulation en éventail** (*fan triangulation*). Elle est simple et rapide, mais elle suppose que la face est **convexe** : sur une face concave, un des triangles produits peut recouvrir une zone qui ne fait pas partie de la forme réelle (le triangle "traverse" l'encoche concave au lieu de la contourner).

Pour une face potentiellement concave, l'algorithme de référence est l'**ear clipping** (*découpe d'oreilles*) : plutôt que de fixer un sommet de référence, il retire un sommet à la fois, en ne l'acceptant que si le triangle qu'il forme avec ses deux voisins reste bien orienté (produit vectoriel local comparé à la normale de la face, voir [Vecteurs et produit scalaire](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) ET ne contient aucun autre sommet de la face. Le polygone rétrécissant à chaque retrait, une [liste doublement chaînée circulaire](/?c=langages-de-programmation&s=c&p=listes-chainees) est une structure bien adaptée pour l'implémenter : chaque retrait ne demande que de reconnecter les deux voisins du sommet retiré, sans décaler de tableau.

> **Bonne pratique :** garder la lecture du fichier (remplir une structure avec les données brutes) et la triangulation dans deux fonctions séparées plutôt que fusionnées. Chacune n'a alors qu'une seule raison de changer (voir [responsabilité unique et couplage](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)), et la triangulation peut être testée indépendamment du parseur.

### Vérifier qu'aucun sommet n'est piégé dans l'oreille

Le test d'orientation seul ne suffit pas : un triangle correctement orienté peut quand même "avaler" un autre sommet du polygone, qui devrait rester à l'extérieur. Il faut donc un second test, appliqué à chaque sommet restant du polygone (hors des 3 sommets du triangle candidat) : le **test du même côté** (*same-side test*), qui vérifie qu'un point donné se trouve à l'intérieur d'un triangle.

Principe : un point `P` est à l'intérieur du triangle `(A, B, C)` si et seulement s'il se trouve du même côté de chacune des 3 arêtes. Ce test réutilise exactement la même primitive géométrique que le test d'orientation (produit vectoriel de deux vecteurs, produit scalaire avec la normale de référence) : seuls les points croisés changent d'un appel à l'autre.

```text
côté 1 = (B-A) × (P-A) . normale
côté 2 = (C-B) × (P-B) . normale
côté 3 = (A-C) × (P-C) . normale

P est dedans si les 3 résultats ont le même signe (tous positifs, ou tous négatifs)
```

> **Bonne pratique :** une seule fonction utilitaire (produit vectoriel de 2 vecteurs + produit scalaire avec la normale) suffit à implémenter à la fois le test d'orientation ET les 3 tests de côté : seuls les points passés en paramètre changent. Éviter de dupliquer ce calcul dans plusieurs fonctions.

### Vérifier une triangulation : la formule `n - 2`

Peu importe l'algorithme (éventail ou ear clipping) et la forme du polygone (convexe ou concave), trianguler un polygone simple à `n` sommets produit toujours exactement `n - 2` triangles (conséquence directe du [théorème des deux oreilles](https://en.wikipedia.org/wiki/Two_ears_theorem) de Meisters (1975), qui garantit que tout polygone simple non-triangle possède au moins deux "oreilles" découpables). Un compte différent de `n - 2` en sortie est la preuve certaine d'un bug ; un compte correct ne prouve pas à lui seul que le découpage est géométriquement juste (à vérifier séparément, par exemple en traçant le polygone et ses diagonales).

## Le fichier .mtl et le modèle de Phong

Un `.obj` référence en général un fichier **.mtl** qui décrit l'apparence des surfaces :

```text
newmtl Material
Ns 96.078431
Ka 0.000000 0.000000 0.000000
Kd 0.640000 0.640000 0.640000
Ks 0.500000 0.500000 0.500000
illum 2
```

| Champ | Signification |
|---|---|
| `Ka` | Couleur ambiante : la couleur perçue même sans lumière directe |
| `Kd` | Couleur diffuse : la couleur de base de la surface sous une lumière directe |
| `Ks` | Couleur spéculaire : la couleur du reflet brillant |
| `Ns` | Exposant spéculaire (*shininess*) : plus il est élevé, plus le reflet est petit et net |

Ces quatre valeurs correspondent exactement aux termes du **modèle de Phong** (*Phong reflection model*), un algorithme d'éclairage classique en synthèse d'image qui décompose la lumière reçue par une surface en trois composantes combinées : ambiante, diffuse et spéculaire.

> **Piège :** un fichier `.mtl` ne définit en général qu'un seul matériau (donc une seule couleur) pour tout l'objet. Si le besoin est de distinguer visuellement des sous-parties différentes (par exemple une couleur par face), cette information doit venir d'ailleurs : le `.mtl` ne la fournit pas.

## L'indexation combinée `v/vt/vn` et la couture UV

Les exemples précédents (`f 16 2 3 17`) ne montrent qu'un seul indice par sommet, celui de la position (`v`). Une ligne `f` réelle référence en général plusieurs listes à la fois, un indice par coin de face et par liste, séparés par `/` :

| Syntaxe | Référence |
|---|---|
| `f 1 2 3` | Position uniquement (utilisé jusqu'ici pour simplifier) |
| `f 1/1 2/2 3/3` | Position **et** coordonnée de texture |
| `f 1/1/1 2/2/2 3/3/3` | Position, texture **et** normale |
| `f 1//1 2//2 3//3` | Position et normale, sans texture (le `//` laisse l'indice de texture vide) |

Pourquoi un indice par liste plutôt qu'un seul indice partagé : `v` (positions) et `vt` (coordonnées de texture) sont deux listes indépendantes, remplies séparément par l'outil d'export, et n'ont aucune raison d'avoir la même longueur ni le même ordre. Un indice unique ne pourrait pas désigner à la fois "le 5e sommet" et "la 5e coordonnée de texture" si ces deux listes ne s'alignent pas terme à terme.

> **Couture UV (*UV seam*) :** un même sommet 3D (un seul indice `v`) peut avoir besoin d'une coordonnée de texture différente selon la face qui le référence. Exemple concret : les 3 faces d'un cube qui se rencontrent en un coin partagent ce sommet, mais chaque face est dépliée à un endroit différent de l'image 2D utilisée comme texture -- donc avec un `vt` différent. Un indice `v` unique combiné à un indice `vt` par coin de face permet de représenter ce cas ; un indice unique partagé entre position et texture ne le permettrait pas.

> **Piège :** stocker les coordonnées de texture indexées uniquement par sommet (un tableau `vt_du_sommet[indice_v]`) casse silencieusement sur une couture UV : chaque face qui référence ce sommet avec un `vt` différent écrase la valeur précédente, seule la dernière écriture survit. La donnée doit être indexée par **couple** (`v`, `vt`), pas par `v` seul -- c'est pourquoi un moteur de rendu duplique en général les sommets à chaque couture UV rencontrée (un sommet unique envoyé à la carte graphique par couple `(v, vt[, vn])` distinct, plutôt qu'un sommet par position).

## Le fichier image référencé par le `.mtl`

Le `.mtl` ne décrit pas que des couleurs unies : la ligne `map_Kd` y référence un fichier image (PNG, JPEG...) utilisé comme texture diffuse :

```text
newmtl Material
map_Kd caisse.png
Kd 0.640000 0.640000 0.640000
```

Au moment de dessiner un triangle, chaque coordonnée `vt` (une paire `(u, v)` avec `u` et `v` entre 0 et 1) désigne un point de cette image, quelle que soit sa résolution réelle en pixels : `(0, 0)` un coin de l'image, `(1, 1)` le coin opposé. La carte graphique interpole ces coordonnées entre les 3 sommets d'un triangle pour savoir, pixel par pixel, quel point de l'image afficher. Si `map_Kd` est absent, `Kd` reste la seule couleur utilisée et les `vt` du fichier n'ont alors aucun effet visuel.

## Les groupes de lissage (`s`)

`s` ne touche pas à la géométrie : il contrôle uniquement le calcul des **normales** utilisées pour l'éclairage.

- `s off` (équivalent à `s 0`) : chaque face garde sa propre normale plate -> rendu à facettes visibles (*flat shading*).
- `s 1`, `s 2`... : les faces qui partagent le même numéro de groupe ont leurs normales moyennées aux sommets qu'elles ont en commun -> rendu lissé (*smooth shading*, aussi appelé *Gouraud shading*).

```text
s 1
f 1 2 5
f 2 3 5
f 3 4 5
f 4 1 5
```

Les 4 faces ci-dessus partagent toutes le sommet `5` et le même groupe de lissage : sa normale sera la moyenne des 4 normales de face, donnant un aspect arrondi à cette pointe plutôt qu'une arête franche.

> **Piège :** `s`, comme `usemtl`, est une **directive d'état** : elle s'applique à toutes les lignes `f` qui suivent, jusqu'à la prochaine `s`/`usemtl` rencontrée dans le fichier. Un parseur doit donc garder en mémoire "quel groupe de lissage et quel matériau sont actifs en ce moment" au fil de la lecture, et les associer à chaque face au moment où elle est lue : cette information n'apparaît jamais sur la ligne `f` elle-même.

## `o` n'est pas une directive d'état comme `s`/`usemtl`

`o` (et son cousin `g`, pour des sous-groupes) se contente d'étiqueter un ensemble de géométrie sous un nom d'objet, pour l'organisation. Contrairement à `s`/`usemtl`, il ne change **rien** à l'interprétation des lignes qui suivent.

> **Piège :** la numérotation des sommets (`v`) reste **globale à tout le fichier** : elle ne redémarre jamais à 1 à chaque nouveau `o`. Dans un fichier à plusieurs objets, les faces du deuxième objet continuent donc la numérotation du premier :
> ```text
> o Cube1
> v 0 0 0
> v 1 0 0
> v 0 1 0
>
> o Cube2
> v 5 5 5   <- 4e sommet du FICHIER, pas le 1er de Cube2
> v 6 5 5
> v 5 6 5
>
> f 4 5 6   <- fait reference aux sommets de Cube2
> ```
> Réinitialiser un compteur de sommets à chaque `o` casse silencieusement l'indexation de toutes les faces dès qu'un fichier contient plus d'un objet.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un `.obj` liste des instructions ligne par ligne (`v`, `vt`, `vn`, `f`, `s`...), avec des indices de sommets qui commencent à 1. Les faces peuvent avoir plus de 3 sommets et doivent être triangulées pour être dessinées par la carte graphique ; l'ear clipping gère aussi les faces concaves grâce à un test d'orientation ET un test "même côté" par sommet restant. Une face combine en général un indice par liste et par coin (`v/vt/vn`), car `v` et `vt` sont deux listes indépendantes non alignées -- nécessaire pour représenter une couture UV. Le `.mtl` associé décrit l'apparence via les 4 paramètres du modèle de Phong (ambiant, diffus, spéculaire, brillance) et peut référencer un fichier image (`map_Kd`) comme texture. `s` contrôle le lissage des normales, indépendamment de la géométrie. |
| **Outils utilisables** | Le modèle de Phong (`Ka`/`Kd`/`Ks`/`Ns`) pour interpréter un `.mtl`. `map_Kd` pour relier un `.mtl` à un fichier image de texture. Les groupes de lissage (`s`) pour choisir entre rendu plat et rendu lissé. La formule `n - 2` pour vérifier le nombre de triangles produit par n'importe quelle triangulation. |
| **Pièges à éviter** | Indices de sommets 1-based plutôt que 0-based. Faces à nombre de sommets variable non triangulées. La triangulation en éventail produit un résultat faux sur une face concave, et un test d'orientation seul (sans test "même côté") peut valider à tort une oreille qui piège un autre sommet. Indexer une coordonnée de texture par sommet seul (plutôt que par couple sommet/texture) casse silencieusement sur une couture UV. Un `.mtl` à matériau unique ne fournit pas une couleur par sous-partie. `s`/`usemtl` sont des directives d'état à suivre pendant tout le parsing, pas des attributs présents sur chaque ligne `f`. `o` n'affecte jamais la numérotation des sommets, qui reste globale au fichier même avec plusieurs objets. |
| **Bonnes pratiques** | Séparer la lecture brute du fichier et la triangulation en deux fonctions distinctes, à responsabilité unique chacune. Réutiliser la même primitive géométrique (produit vectoriel + produit scalaire avec la normale) pour le test d'orientation et le test "même côté", plutôt que de la dupliquer. Vérifier une triangulation avec la formule `n - 2` avant de juger le découpage correct. Dupliquer un sommet par couple unique `(v, vt[, vn])` plutôt que par position seule, pour gérer les coutures UV. Conserver l'état courant (matériau, groupe de lissage) dans des variables mises à jour au fil du parsing, et l'attacher à chaque face lue. |
