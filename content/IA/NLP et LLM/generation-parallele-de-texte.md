---
order: 11
---

# Génération parallèle de texte : diffusion et NCM (31/10/2026)

Un assistant comme [ChatGPT](https://chatgpt.com) (assistant conversationnel d'OpenAI) écrit sa réponse **un morceau de mot après l'autre**, de gauche à droite, et ne peut pas écrire la fin avant le début. Ce chapitre explique pourquoi cette méthode est lente, puis présente deux familles de recherche qui tentent de produire **beaucoup de texte à la fois** : les modèles de **diffusion** et une méthode publiée en octobre 2026 appelée **NCM**. Le sujet en est au **stade de la recherche** : ces approches sont meilleures sur quelques tâches précises, en retrait sur la plupart des autres, et ne remplacent pas les LLM actuels. Les chiffres cités viennent de l'article de recherche, du blog de ses auteurs et de la fiche d'un modèle, relevés le 31/10/2026 ; ils changeront.

Le chapitre suppose connus [les tokens et les LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) (un LLM, *Large Language Model*, est un « grand modèle de langage » entraîné à prédire la suite d'un texte), [le Transformer](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) et [le coût d'un LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production).

## Pourquoi un LLM écrit lentement

### Un jeton après l'autre

Un **jeton** (en anglais *token*) est un morceau de texte : un mot court, une partie de mot, un signe de ponctuation (voir [la tokenisation](/?c=ia&s=nlp-llm&p=nlp-et-llm#la-tokenisation-decouper-le-texte)). Un LLM classique est **autorégressif** : il produit le texte jeton par jeton, chaque nouveau jeton étant calculé **à partir de tous les précédents**, y compris ceux qu'il vient lui-même d'écrire. « Régressif » vient de l'idée de s'appuyer sur ce qui précède, « auto » du fait que ce sont ses propres sorties.

Le code de ce chapitre est écrit en Python (voir [les variables](/?c=langages&s=python&p=variables), [les listes](/?c=langages&s=python&p=listes-et-tuples) et [les boucles](/?c=langages&s=python&p=boucles)) : `print` affiche une valeur, `len` donne la longueur d'une liste, `append` ajoute un élément à sa fin, `round` arrondit un nombre, `abs` donne la valeur absolue d'un nombre (sa distance à zéro, sans signe) et `if` n'exécute les lignes qui suivent que si la condition est vraie. `while` répète ses lignes tant que sa condition est vraie, et `for x in suite` les répète pour chaque élément de la suite. `+=` ajoute une valeur à une variable (`n += 1` équivaut à `n = n + 1`). `liste[3]` lit l'élément de position 3 (on compte à partir de 0). Un **tuple** comme `(1, 100, 1024)` est une liste non modifiable, et `for nom, passes in` range les deux valeurs de chaque élément dans deux variables. Les opérateurs `*`, `/`, `//` et `<` signifient multiplier, diviser, diviser en ne gardant que la partie entière du résultat, et « est plus petit que ».

```python
# Le texte que notre faux modèle va « produire » (un jeton par élément de la liste)
phrase = ["Le", "chat", "dort", "sur", "le", "tapis", "."]
# Le texte écrit jusqu'ici : vide au départ
texte = []
# Compteur du nombre de fois où le modèle doit relire tous ses poids
lectures_des_poids = 0
# Tant que le texte écrit est plus court que la phrase visée
while len(texte) < len(phrase):
    # Chaque jeton oblige à relire l'ensemble des poids du modèle (expliqué plus bas)
    lectures_des_poids += 1
    # Le faux modèle ajoute UN seul jeton : le suivant de la liste
    texte.append(phrase[len(texte)])
# Affiche le texte final et le nombre de lectures
print(texte, lectures_des_poids)
```

Sortie obtenue : `['Le', 'chat', 'dort', 'sur', 'le', 'tapis', '.'] 7`. Sept jetons, sept lectures. Il n'existe aucun raccourci : le jeton 5 ne peut pas être calculé avant le jeton 4, puisqu'il en dépend.

### Les poids, la mémoire et la bande passante

Les **poids** (ou **paramètres**) sont les millions ou milliards de nombres appris pendant l'entraînement, qui définissent le comportement du modèle (voir [les réseaux de neurones](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)). Ils sont stockés dans la **mémoire** de la carte graphique (le GPU, voir [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu)). Pour calculer **un seul** jeton, la puce de calcul doit lire **la quasi-totalité** de ces poids depuis la mémoire (sauf dans un modèle « à mélange d'experts », expliqué avec DiffusionGemma plus bas, où seuls les poids des experts activés sont lus).

La **bande passante mémoire** est la quantité de données que la mémoire peut envoyer à la puce par seconde, en gigaoctets par seconde (**Go/s**). Un **bit** est un chiffre binaire (0 ou 1), un **octet** en compte 8, et un gigaoctet vaut un milliard d'octets. Analogie : une cuisinière très rapide dont les ingrédients sont dans une cave. Si elle doit remonter **toute la cave** pour chaque assiette, c'est la montée de l'escalier qui limite le rythme, pas la vitesse à laquelle elle cuisine. On dit que le travail est limité par la **mémoire** (*memory-bound*) et non par le **calcul** (*compute-bound*).

```
  Mémoire (poids : 16 Go)                    Puce de calcul
  +------------------------+   lecture    +--------------------+
  | tous les poids         | -----------> | quelques opérations|
  +------------------------+  par jeton   | par poids lu       |
          ^                                +----------+---------+
          |                                           |
          +---------- jeton suivant, on recommence ---+
```

Une opération de calcul coûte très peu face au déplacement d'un poids : la puce passe l'essentiel de son temps à attendre les données.

### Un calcul d'ordre de grandeur

La formule est : **temps ≈ taille du modèle × nombre de jetons ÷ bande passante** (≈ : environ égal à ; × : multiplié par ; ÷ : divisé par). Elle donne un **minimum** (le temps de lecture seul), car le reste du travail ne peut que l'allonger.

Données de l'exemple : un modèle de **16 Go** de poids, **1 024 jetons** à produire, une carte [NVIDIA GeForce RTX 5090](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/) (carte graphique du constructeur NVIDIA). Sa bande passante mémoire annoncée par le constructeur est de **1 792 Go/s**. Elle se déduit de la fiche : le **bus** est le nombre de fils qui transportent des bits en parallèle (ici 512), une **broche** est un de ces fils de connexion de la puce, un **gigabit** est un milliard de bits, et la **GDDR7** est un type de mémoire graphique, ici à 28 gigabits par seconde et par broche : 512 × 28 ÷ 8 = 1 792 (on divise par 8 pour passer des bits aux octets). Cette valeur n'a pas pu être revérifiée sur la fiche officielle de NVIDIA à la date de rédaction : à contrôler avant de s'en servir.

```python
# Bande passante en Go/s : 512 bits de large x 28 gigabits par seconde
# Le tout est divisé par 8, car un octet contient 8 bits
bande_passante = 512 * 28 / 8
# Affiche la bande passante utilisée
print("bande passante (Go/s) :", bande_passante)

# Taille du modèle en gigaoctets (Go)
taille_modele = 16
# On essaie trois longueurs de réponse
for nb_jetons in (1, 100, 1024):
    # Formule : taille du modèle x nombre de jetons / bande passante (résultat en secondes)
    temps = taille_modele * nb_jetons / bande_passante
    # Affiche le temps arrondi à 3 décimales
    print(nb_jetons, "jetons ->", round(temps, 3), "s")
# Nombre de jetons par seconde : une lecture complète des poids par jeton
print("jetons par seconde :", round(bande_passante / taille_modele, 1))
```

Sortie obtenue :

```
bande passante (Go/s) : 1792.0
1 jetons -> 0.009 s
100 jetons -> 0.893 s
1024 jetons -> 9.143 s
jetons par seconde : 112.0
```

| Grandeur | Valeur | Origine |
|---|---|---|
| Taille des poids | 16 Go | Hypothèse de l'exemple |
| Bande passante mémoire | 1 792 Go/s | Fiche constructeur de la RTX 5090 (valeur non revérifiée ici) |
| Lecture des poids pour un jeton | environ 8,9 ms | 16 ÷ 1 792 |
| Réponse de 1 024 jetons | environ 9,1 s | 1 024 × 8,9 ms |
| Débit maximal (une seule conversation) | environ 112 jetons par seconde | 1 792 ÷ 16 |

On retrouve l'ordre de grandeur « environ 9 secondes ». Le vrai temps est plus long (calcul, données de contexte, logiciel), mais **jamais plus court** que cette lecture. Acheter une puce capable de calculer deux fois plus vite ne change presque rien si la mémoire n'envoie pas deux fois plus de données.

### Le regroupement de requêtes (batch)

Un **batch** (« lot ») consiste à traiter **plusieurs requêtes en même temps** : la puce lit les poids **une seule fois**, puis s'en sert pour avancer d'un jeton dans chacune des conversations du lot. La lecture, qui coûte cher, est partagée.

```python
# Reprend la bande passante et la taille du modèle de l'exemple précédent
bande_passante = 1792
taille_modele = 16
# On essaie plusieurs tailles de lot (nombre de conversations traitées ensemble)
for taille_lot in (1, 8, 64, 256):
    # Une lecture des poids produit un jeton par conversation du lot
    debit = taille_lot * bande_passante / taille_modele
    # Affiche le débit total maximal (somme sur toutes les conversations)
    print("lot", taille_lot, "->", round(debit), "jetons/s (plafond)")
```

Sortie obtenue : 112, 896, 7 168 et 28 672 jetons par seconde. Ce sont des **plafonds théoriques** (le calcul est fait avec les valeurs de l'exemple) : à partir d'une certaine taille de lot, la puce n'a plus assez de puissance de calcul, et chaque conversation garde en plus sa propre mémoire de contexte (le **cache KV** : les clés et valeurs de l'attention, déjà calculées pour les jetons précédents), qui n'est pas partagée entre elles.

| | Fournisseur d'[API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (beaucoup d'utilisateurs) | Usage local (une conversation) |
|---|---|---|
| Requêtes simultanées | Des centaines, regroupées en lots | Une seule |
| Lectures de poids partagées | Oui : un coût divisé par la taille du lot | Non : chaque jeton paie sa lecture entière |
| Facteur limitant | Plutôt le calcul, à partir d'un certain lot | La bande passante mémoire |
| Effet d'un modèle qui écrirait plusieurs jetons par lecture | Gain modeste : la lecture est déjà amortie | Gain potentiellement grand |
| Où se ressent la lenteur | Surtout sur la latence (le délai d'attente) de chaque utilisateur | Sur tout |

C'est pourquoi un fournisseur est peu sensible à ce goulot, tandis que la même question posée à un modèle exécuté sur son propre ordinateur est lente. Pour le coût d'un appel côté fournisseur, voir [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production).

## Les deux approches parallèles

Idée commune : **produire plusieurs jetons par lecture des poids**. Une lecture est alors servie à beaucoup de positions du texte à la fois ; le calcul augmente, mais le nombre de lectures diminue.

### La diffusion de texte

La **diffusion** est une méthode née pour les images : on part d'un résultat rempli de bruit (une image de pixels aléatoires, un pixel étant un point de couleur de l'image) et un modèle le **nettoie** étape par étape jusqu'à obtenir une image nette. Chaque étape est une **passe de débruitage** : le modèle regarde l'ensemble de l'image bruitée et en produit une version un peu moins bruitée.

Pour du texte, le principe est transposé : on part d'un **brouillon complet** du texte, dont les positions sont masquées ou aléatoires, et à **chaque passe** le modèle **réécrit tout le brouillon** à la fois, en le rendant plus cohérent. Le nombre de passes est choisi à l'avance et peut être très inférieur au nombre de jetons.

Exemple utilisable aujourd'hui : **DiffusionGemma**, modèle de la famille Gemma (modèles ouverts de Google) dont la [fiche officielle](https://ai.google.dev/gemma/docs/diffusiongemma/model_card) décrit un débruitage parallèle de **blocs de 256 jetons**, avec 15 à 20 jetons obtenus par passe.

### NCM : une pyramide de codes

**NCM** signifie *Next-Concept Modeling*, « modélisation du concept suivant ». C'est une méthode soumise le 9 octobre 2026 par une équipe autour de l'université Stanford. Ici, un « concept » n'est **pas** une idée au sens courant : c'est un **code** choisi dans un dictionnaire. Elle fonctionne en deux étapes.

**Étape 1 : fabriquer un tokenizer hiérarchique.** Un **tokenizer** est le programme qui convertit un texte en jetons et inversement ; ici, il produit une hiérarchie de codes. Il repose sur un **VQ-VAE** (*Vector Quantized Variational Auto-Encoder*, « auto-encodeur variationnel à quantification vectorielle »). Un VQ-VAE est un réseau de neurones en trois parties : un encodeur qui compresse un texte, une **quantification** qui remplace chaque résultat par le code le plus proche dans un **dictionnaire** (*codebook*, une liste fixe de vecteurs, c'est-à-dire de listes de nombres, voir [les vecteurs](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)), et un décodeur qui reconstruit le texte à partir des codes. NCM utilise une variante **résiduelle** et **multi-échelle** : le premier niveau code le texte de façon **grossière**, le deuxième code ce qui **reste** (le résidu : l'erreur du premier), le troisième code le reste du reste, et ainsi de suite jusqu'au niveau le plus fin. Chaque niveau a son propre dictionnaire. L'idée est reprise de [VAR](https://arxiv.org/abs/2404.02905) (*Visual AutoRegressive modeling*), une méthode de génération d'images.

La version jouet suivante code **un seul nombre** en trois niveaux, pour voir le principe (de vrais codes sont des vecteurs, pas des nombres seuls).

```python
# Un dictionnaire par niveau (une liste de codes, ici une liste Python)
# Le niveau 1 est grossier, le niveau 3 est fin
niveaux_de_codes = [
    [0, 4, 8, 12],
    [-2, -1, 0, 1, 2],
    [-0.5, -0.25, 0, 0.25, 0.5],
]
# Le nombre à coder
cible = 7.3
# Ce que l'on a reconstruit jusqu'ici : rien au départ
reconstruction = 0
# Numéro du niveau en cours
niveau = 0
# On traite les dictionnaires du grossier au fin
for dictionnaire in niveaux_de_codes:
    # Passe au niveau suivant
    niveau += 1
    # Le reste à coder : ce que la reconstruction n'a pas encore atteint
    reste = cible - reconstruction
    # On suppose d'abord que le premier code du dictionnaire est le meilleur
    meilleur = dictionnaire[0]
    # On examine chaque code du dictionnaire
    for code in dictionnaire:
        # abs donne la valeur absolue (distance sans signe) ; on garde le code le plus proche
        if abs(code - reste) < abs(meilleur - reste):
            meilleur = code
    # Le code choisi est ajouté à la reconstruction
    reconstruction += meilleur
    # Affiche le niveau, le code retenu, la reconstruction cumulée et l'erreur restante
    print(niveau, "code", meilleur, "reconstruction", reconstruction,
          "erreur", round(abs(cible - reconstruction), 2))
```

Sortie obtenue :

```
1 code 8 reconstruction 8 erreur 0.7
2 code -1 reconstruction 7 erreur 0.3
3 code 0.25 reconstruction 7.25 erreur 0.05
```

Chaque niveau **affine** le précédent : l'erreur passe de 0,7 à 0,3 puis à 0,05.

**Étape 2 : générer.** Le tokenizer est **figé** (on ne le change plus). Un Transformer prédit **un niveau à la fois** : à chaque passe, il écrit **tous les codes d'un niveau en parallèle**, en s'appuyant sur la reconstruction cumulée des niveaux déjà produits. Quand la hiérarchie est complète, le décodeur du tokenizer la convertit en texte. L'exemple de traduction du blog des auteurs compte **11 niveaux**, donc 11 passes du Transformer. La hiérarchie est **fixe** au sein d'une tâche (12 évaluations du modèle pour le Sudoku, d'après l'article).

### Les trois façons d'écrire, en schéma

```
Autorégressif : un jeton par passe, de gauche à droite
  passe 1 : [Le] .  .  .  .  .  .
  passe 2 : [Le][chat] .  .  .  .  .
  passe 3 : [Le][chat][dort] .  .  .  .      ... 1 passe par jeton

Diffusion : tout le brouillon est réécrit à chaque passe
  passe 1 : [?][?][?][?][?][?][?]    brouillon très flou
  passe 2 : [Le][?][dort][?][le][?][.]
  passe 3 : [Le][chat][dort][sur][le][tapis][.]   ... quelques passes

NCM : un niveau de la pyramide par passe, sur tout le texte
  niveau 1 (grossier) : forme générale du texte
  niveau 2            : correction du niveau 1
  ...
  niveau 11 (fin)     : détails         -> décodeur -> texte
```

Le schéma de la diffusion est une illustration de principe : les positions fixées à chaque passe dépendent du modèle réel.

### Comparatif

| | Autorégressif | Diffusion de texte | NCM |
|---|---|---|---|
| Ce que fait une passe | Ajoute un jeton | Réécrit tout le brouillon | Écrit un niveau de codes pour tout le texte |
| Nombre de passes | Un par jeton | Choisi à l'avance, souvent bien inférieur au nombre de jetons | Fixe au sein d'une tâche : un par niveau (11 dans l'exemple de traduction du blog) |
| Ce qui est produit | Des jetons | Des jetons | Des codes, convertis en texte par un décodeur |
| Ordre de l'écriture | Gauche à droite | Toutes les positions ensemble | Du grossier au fin |
| Disponibilité | Partout | Un modèle utilisable : DiffusionGemma | Code et poids publiés par les auteurs (GitHub et Hugging Face) |
| Maturité | Très répandue | Recherche, un premier modèle publié | Recherche, essais de petite taille |

Les passes se comptent facilement : avec le modèle de 16 Go de l'exemple et une lecture de 8,9 ms par passe, un texte de 1 024 jetons demande 1 024 passes en autorégressif. Si une passe de diffusion donnait 16 jetons (valeur **inventée** pour l'illustration, proche des 15 à 20 de la fiche DiffusionGemma), il en faudrait 64 ; avec 11 niveaux, NCM en demande 11.

```python
# Temps de lecture des poids pour une passe : 16 Go / 1 792 Go/s
temps_par_passe = 16 / 1792
# Trois scénarios, chacun un couple (nom, nombre de passes) ; les deux derniers sont
# des hypothèses. 1024 // 16 est la division entière : 64 passes de 16 jetons
scenarios = (
    ("autorégressif", 1024),
    ("diffusion, 16 jetons par passe", 1024 // 16),
    ("NCM, 11 niveaux", 11),
)
# On parcourt chaque scénario
for nom, passes in scenarios:
    # Temps total de lecture des poids (hors calcul) pour ce scénario
    print(nom, passes, "passes ->", round(passes * temps_par_passe, 3), "s")
```

Sortie obtenue : 9,143 s, 0,571 s et 0,098 s. Attention : c'est un calcul de **lecture seule**. Un modèle NCM de cette taille n'existe pas (le plus grand fait 725 millions de paramètres), et chaque passe fait plus de calcul qu'une passe autorégressive, puisqu'elle traite beaucoup de positions. Le tableau montre l'**origine** du gain espéré, pas un gain mesuré.

## Résultats et limites

### Ce que NCM a mesuré

Les auteurs comparent NCM, sur une carte [NVIDIA H100](https://www.nvidia.com/en-us/data-center/h100/) (carte de centre de données), au **meilleur modèle de diffusion de texte**. Ils **ne comparent pas** la vitesse à un modèle autorégressif : l'annonce « 10 à 31 fois plus rapide » concerne la diffusion, jamais les LLM habituels.

[**ROUGE-L**](https://aclanthology.org/W04-1013/) est un score qui mesure le recouvrement entre un résumé produit et un résumé de référence écrit par un humain (il repose sur la plus longue suite de mots communs aux deux, dans le même ordre). La **perplexité** mesure à quel point un texte « surprend » un modèle de langage : plus elle est basse, plus le texte est prévisible pour lui. La **perplexité générative** applique cette mesure aux textes qu'un modèle vient de générer, la mesure étant faite par un autre modèle, dit de référence (article, annexe E.1). Les auteurs précisent eux-mêmes qu'elle **ne mesure pas toute la qualité** : un texte plat et répétitif peut obtenir une bonne perplexité.

| Jeu de test | Tâche | Résultat annoncé contre le meilleur modèle de diffusion |
|---|---|---|
| [LM1B](https://arxiv.org/abs/1312.3005) (jeu de phrases) | Générer du texte | 21 fois plus rapide, meilleure perplexité générative |
| [OpenWebText](https://skylion007.github.io/OpenWebTextCorpus/) (textes du web) | Générer du texte | 10 fois plus rapide, qualité comparable |
| [XSum](https://arxiv.org/abs/1808.08745) (résumés d'articles) | Résumer | 31 fois plus rapide, à **ROUGE-L égal** |

Autres points rapportés :

| Point | Valeur |
|---|---|
| Tailles testées | 97 M, 317 M et 725 M de paramètres (M : millions), essais décrits comme **préliminaires** |
| Entraînement | 4 à 5 fois moins de jetons que les modèles de diffusion de référence (4,9 fois sur LM1B, 4 fois sur OpenWebText, entraînement du tokenizer et du générateur cumulés) |
| Traduction (jeu de test [WMT14](https://www.statmt.org/wmt14/), allemand et anglais) et résumé | « Performance similaire ou meilleure » que les meilleurs modèles de diffusion ; aucune comparaison chiffrée à un autorégressif |

### Le Sudoku

Un Sudoku est une grille de 9 × 9 cases à remplir de chiffres de 1 à 9 sans répétition par ligne, colonne et **bloc** (un des neuf carrés de 3 × 3 cases) ; les **indices** sont les chiffres déjà placés. Un programme classique le résout par [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) (essais et retours en arrière). Ici, les modèles doivent écrire la grille. **MDLM** et **DUO** sont deux modèles de diffusion de référence cités par l'[article](https://arxiv.org/abs/2610.14162). Le tableau donne le pourcentage de grilles **entièrement résolues**, par niveau de difficulté.

| Niveau | Autorégressif | MDLM (diffusion) | DUO (diffusion) | NCM |
|---|---|---|---|---|
| Facile (40 indices) | 14,6 % | 92,0 % | 96,3 % | 99,5 % |
| Moyen (35 indices) | 5,1 % | 77,1 % | 84,7 % | 96,5 % |
| Difficile (30 indices) | 1,0 % | 30,2 % | 58,4 % | 86,1 % |

NCM est en tête à chaque niveau, avec bien moins d'**évaluations** du modèle (nombre de passages complets dans le réseau pour produire une grille) : 12 pour NCM contre 128 pour le modèle autorégressif (article, tableau 3). Ce résultat concerne une tâche **précise** et ne dit rien de la rédaction de texte libre. Le modèle autorégressif comparé est un petit modèle de 25 millions de paramètres, entraîné pour cette tâche (article, tableau 3). Lire « 86,1 % contre 1,0 % » comme « NCM est 86 fois meilleur que les LLM » serait donc abusif : rien ne l'assimile à un assistant du commerce.

### DiffusionGemma

La fiche du modèle compare la variante **26B A4B** de [DiffusionGemma](https://ai.google.dev/gemma/docs/diffusiongemma/model_card) à la variante du même nom de Gemma 4, modèle autorégressif de la même famille (dans ce nom, 26B évoque la taille totale et A4B le nombre de paramètres actifs à la fois ; la fiche donne précisément 25,2 milliards au total et 3,8 milliards actifs). Ce sont des modèles dits **à mélange d'experts** : le réseau contient de nombreux sous-réseaux spécialisés (les experts) et, pour chaque jeton, seuls quelques-uns sont activés. Seuls leurs poids sont lus, d'où l'écart entre paramètres au total et paramètres actifs. Les tests sont des concours ou jeux de questions standard.

| Test | Contenu | Gemma 4 26B A4B | DiffusionGemma 26B A4B | Écart |
|---|---|---|---|---|
| [AIME](https://artofproblemsolving.com/wiki/index.php/American_Invitational_Mathematics_Examination) 2026 (sans outils) | Problèmes de mathématiques de concours | 88,3 % | 69,1 % | 19,2 points de pourcentage perdus |
| [LiveCodeBench](https://livecodebench.github.io/) v6 | Problèmes de programmation | 77,1 % | 69,1 % | 8,0 points perdus |
| [Codeforces](https://codeforces.com/) (classement ELO) | Concours de programmation | 1718 | 1429 | 289 points perdus |
| [GPQA](https://arxiv.org/abs/2311.12022) Diamond | Questions de sciences difficiles | 82,3 % | 73,2 % | 9,1 points perdus |
| [MMLU Pro](https://arxiv.org/abs/2406.01574) | Connaissances variées | 82,6 % | 77,6 % | 5,0 points perdus |

« Sans outils » signifie que le modèle ne peut pas appeler de calculatrice ou de code. Le **ELO** est un système de classement : un nombre plus haut indique un meilleur niveau. La diffusion est donc **utilisable aujourd'hui**, mais au prix d'une qualité inférieure sur chacun de ces tests.

Pour la vitesse, la fiche mentionne 15 à 20 jetons par passe et plus de 1 100 jetons par seconde et par utilisateur, en petits lots, sur H100 en FP8 (fiche consultée le 26/10/2026 ; FP8 est un format de nombres sur 8 bits). Un article secondaire cite 1 107 jetons par seconde contre 303 en autorégressif, mais ces deux chiffres précis ne figurent pas dans la fiche : ils sont **non vérifiés** et à ne pas retenir.

### Conséquence matérielle

Si une passe produit beaucoup de jetons, chaque poids lu sert **beaucoup plus de calculs** avant d'être relu. Le travail passerait donc de « limité par la bande passante mémoire » à « limité par le calcul ». C'est un raisonnement, pas une mesure des sources lues. Il rapproche l'usage local d'un fournisseur qui traite déjà des lots : les puces qui comptent seraient alors celles qui calculent vite, un autre terrain que les puces conçues contre le goulot mémoire, comme le LPU présenté dans [TPU, NPU, LPU et VPU](/?c=infrastructure-devops&s=infrastructure&p=tpu-npu-lpu-vpu).

| | Autorégressif, une conversation | Génération parallèle (hypothèse) |
|---|---|---|
| Goulot principal | Bande passante mémoire | Puissance de calcul |
| Ce qui aide | Mémoire plus rapide, poids en mémoire sur la puce | Plus d'unités de calcul |
| Lecture des poids | Une par jeton | Une par passe |

## Ce qui reste incertain

| Question | État |
|---|---|
| NCM passe-t-il à l'échelle des modèles de plusieurs milliards de paramètres ? | Inconnu : essais jusqu'à 725 M, décrits comme préliminaires par les auteurs |
| Que vaut NCM face à un LLM autorégressif, en vitesse et en qualité ? | Non mesuré dans les sources lues |
| La hiérarchie fixe limite-t-elle les textes ? | Limite signalée par les auteurs, effets non détaillés ici |
| La perplexité générative reflète-t-elle la qualité réelle ? | Non entièrement, selon les auteurs |
| Les chiffres de 1 107 et de 303 jetons par seconde (DiffusionGemma, autorégressif) sont-ils justes ? | Non vérifiés : absents de la fiche, qui parle de plus de 1 100 jetons par seconde |
| La génération parallèle se généralise-t-elle au-delà de quelques tâches ? | Inconnu : DiffusionGemma perd 5,0 à 19,2 points de pourcentage sur quatre tests et 289 points d'ELO sur Codeforces (fiche) |

L'article a été soumis le 9 octobre 2026, trois semaines avant la rédaction de ce chapitre : les résultats d'une publication récente et isolée se confirment ou se corrigent souvent ensuite, par d'autres équipes.

## Sources consultées

| Source | Adresse |
|---|---|
| Article de recherche, « Next-Concept Modeling: Fast, Parallel Coarse-to-Fine Text Generation » (9 octobre 2026) | [arxiv.org/abs/2610.14162](https://arxiv.org/abs/2610.14162) (arXiv : site public de dépôt d'articles de recherche) |
| Blog des auteurs (Hazy Research) | [hazyresearch.stanford.edu/blog/2026-10-12-ncm](https://hazyresearch.stanford.edu/blog/2026-10-12-ncm) |
| Fiche officielle de DiffusionGemma | [ai.google.dev/gemma/docs/diffusiongemma/model_card](https://ai.google.dev/gemma/docs/diffusiongemma/model_card?hl=fr) |
| Code de NCM sur [GitHub](/?c=git&p=github-et-plateformes) (plateforme d'hébergement de code) | [github.com/HazyResearch/ncm](https://github.com/HazyResearch/ncm) |
| Poids de NCM (collection Hugging Face, indiquée par le README du dépôt) | [huggingface.co/hazyresearch](https://huggingface.co/hazyresearch) |

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Lire « 31 fois plus rapide » comme « 31 fois plus rapide que ChatGPT » | La mesure compare NCM au meilleur modèle de **diffusion**, jamais à un autorégressif | Toujours lire le point de comparaison |
| Conclure à la fin des LLM actuels | Les résultats sont ponctuels, DiffusionGemma perd en qualité sur les cinq tests cités de sa fiche (écart de 5,0 à 19,2 points de pourcentage, 289 points d'ELO sur Codeforces) | Présenter la génération parallèle comme une piste de recherche |
| Généraliser le Sudoku | Une tâche précise ne prédit pas la qualité sur du texte libre | Citer la tâche avec le chiffre |
| Croire que « concept » désigne une idée | Dans NCM, c'est un code d'un dictionnaire | Dire « code » |
| Se fier à la perplexité seule | Elle ne mesure pas toute la qualité | Regarder aussi des scores de tâche (ROUGE-L, résolution) |
| Prendre un plafond de débit pour une mesure | Le calcul de lecture seule ignore le calcul et la mémoire de contexte | Mesurer sur la machine réelle |
| Reprendre un chiffre d'article secondaire | Il est absent de la fiche officielle (cas de 1 107 et 303 jetons/s) | Remonter à la fiche ou à l'article |
| Supposer qu'un modèle de recherche est prêt à l'emploi | Les poids de NCM sont publiés (README du dépôt, Hugging Face), mais ce sont des essais de petite taille (725 M au plus) | Lire le README et les limites avant d'essayer |
| Confondre taille du modèle et vitesse | À taille égale, le nombre de lectures de poids décide du temps | Compter les passes |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Calculer d'abord l'ordre de grandeur taille × jetons ÷ bande passante | Savoir si une lenteur vient de la mémoire ou du calcul |
| Indiquer la source et la date de tout chiffre de vitesse | Les mesures changent vite et dépendent de la carte |
| Comparer des modèles du même type sur la même tâche | Éviter les comparaisons qui ne disent rien |
| Garder un LLM autorégressif pour la production tant qu'un modèle parallèle n'atteint pas sa qualité | Les pertes de DiffusionGemma sont mesurées |
| Distinguer fournisseur (lots) et usage local (une conversation) | Le goulot n'y est pas le même |
| Lire la section « limites » d'une publication avant son résumé | Les auteurs y disent ce qui n'est pas prouvé |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un LLM **autorégressif** écrit un jeton à la fois et relit tous ses poids pour chacun : il est limité par la **bande passante mémoire**, pas par le calcul (modèle de 16 Go, 1 024 jetons, 1 792 Go/s : au moins 9,1 s). Un fournisseur amortit ces lectures par des **lots** ; un usage local à une conversation ne le peut pas. La **diffusion** réécrit tout le brouillon à chaque **passe de débruitage** (DiffusionGemma, utilisable, mais 19,2 et 8,0 points perdus sur AIME 2026 et LiveCodeBench v6) ; **NCM** code le texte par un VQ-VAE résiduel multi-échelle et génère un niveau de codes, du grossier au fin, par passe (« 31 fois » mesuré contre la diffusion, Sudoku difficile 86,1 % contre 1,0 %, essais jusqu'à 725 M de paramètres). Si la génération parallèle se généralise, le goulot passerait de la mémoire au calcul. Sujet de **recherche**. |
| **Pièges à éviter** | Confondre « plus rapide que la diffusion » et « plus rapide qu'un LLM » ; annoncer la fin des LLM ; généraliser le Sudoku ; croire qu'un « concept » est une idée ; juger par la seule perplexité ; reprendre un chiffre sans source primaire. |
| **Bonnes pratiques** | Estimer le goulot par la formule taille × jetons ÷ bande passante ; dater et sourcer chaque chiffre ; comparer sur la même tâche ; garder l'autorégressif en production tant que la qualité n'est pas égale ; lire les limites des auteurs. |
