---
order: 6
---

# Cache CPU et vectorisation (SIMD)

Les chapitres précédents traitent du temps perdu à attendre un **autre composant** (réseau, disque, service distant). Pour du calcul pur (additionner des nombres, transformer un tableau), la même distinction [coût fixe / coût marginal](/?c=performance&p=limiter-les-aller-retours) existe, mais ce qui domine le coût marginal n'est plus une latence réseau : c'est la façon dont le processeur accède à la mémoire.

## La hiérarchie de cache

Un processeur ne lit jamais la RAM directement à chaque accès : plusieurs niveaux de mémoire, de plus en plus petits et rapides, s'intercalent entre lui et la RAM.

| Niveau | Taille typique | Latence relative |
|---|---|---|
| Registres | Quelques dizaines d'octets | ~1 cycle |
| Cache L1 | 32-64 Ko | ~4 cycles |
| Cache L2 | 256 Ko-1 Mo | ~15 cycles |
| Cache L3 | Quelques Mo (partagé entre cœurs) | ~40 cycles |
| RAM | Plusieurs Go | ~200 cycles |

Un **registre** est un emplacement de stockage intégré au processeur lui-même (pas en mémoire) : c'est là qu'il place les valeurs sur lesquelles il opère directement. Un **cycle** est le battement de l'horloge interne du processeur, l'unité de temps la plus fine à laquelle il peut agir ; toutes les latences ci-dessus s'expriment en nombre de cycles plutôt qu'en secondes, parce que ce nombre reste stable d'une machine à l'autre, contrairement à la durée réelle d'un cycle (qui dépend de la fréquence du processeur).

Ces chiffres sont des ordres de grandeur (ils varient selon l'architecture), mais le rapport entre eux est ce qui compte : un accès RAM coûte facilement 50 fois plus qu'un accès L1. Un programme qui multiplie les allers-retours vers la RAM plutôt que de réutiliser ce qui est déjà en cache peut être des dizaines de fois plus lent, à nombre d'opérations strictement identique.

## Lignes de cache : la mémoire contiguë est "gratuite"

Le processeur ne charge jamais un seul octet : il charge toujours un bloc de taille fixe, la **ligne de cache** (64 octets sur la plupart des architectures actuelles), même si un seul octet de ce bloc est demandé.

Conséquence directe : lire des données **contiguës** (un tableau parcouru dans l'ordre) profite de lignes déjà chargées par les accès précédents : la majorité des lectures ne coûtent presque rien. Lire des données **dispersées** (une liste chaînée, des objets épars sur le tas) déclenche un nouveau chargement de ligne à chaque accès, sans rien réutiliser.

> C'est la même unité (l'octet comme adresse, le bloc comme granularité de transfert) que celle vue dans [L'organisation des données en mémoire](/?c=representation-des-donnees&p=organisation-en-memoire) : l'alignement et le padding influencent directement combien de lignes de cache une structure occupe.

## Coût fixe vs coût marginal, appliqué au calcul

Appeler une fonction vectorisée (`tableau.sum()`, `tableau * 2`) a, comme un appel réseau, un **coût fixe** : choisir quelle routine bas niveau exécuter, allouer le tableau résultat : indépendant du nombre d'éléments `n`. Le **coût marginal** (le coût par élément) dépend ensuite de deux choses : la localité mémoire vue ci-dessus, et la capacité du processeur à traiter plusieurs éléments par instruction plutôt qu'un seul.

C'est ce second point qu'on appelle **SIMD** (*Single Instruction, Multiple Data*) : une instruction processeur qui applique la même opération à plusieurs valeurs contiguës d'un coup (ex. additionner 8 entiers en une seule instruction, plutôt que 8 instructions séparées). SIMD n'est exploitable que si les données sont **contiguës et de taille uniforme** : exactement ce que garantit un tableau typé, et jamais ce que garantit une collection d'objets épars.

## Pourquoi un tableau NumPy est rapide et une liste Python ne l'est pas

Une liste [Python](/?c=langages-de-programmation&s=python&p=python) est un tableau de **pointeurs** vers des objets, potentiellement dispersés n'importe où sur le tas et de tailles différentes. Une boucle `for` sur une liste [Python](/?c=langages-de-programmation&s=python&p=python) doit, à chaque itération : suivre un pointeur (accès mémoire potentiellement hors cache), vérifier le type de l'objet pointé, puis appeler la bonne routine : le tout piloté par l'interpréteur, instruction par instruction.

Un [tableau NumPy](/?c=data-science&p=numpy) (`ndarray`) est un unique bloc de mémoire **contigu**, contenant les valeurs elles-mêmes (pas des pointeurs), toutes du même type et de la même taille. Une opération vectorisée (`a + b`) délègue à une boucle **compilée** qui parcourt ce bloc de façon séquentielle : les lignes de cache sont réutilisées au maximum, et le processeur peut employer des instructions SIMD sur plusieurs éléments à la fois. Même nombre d'opérations arithmétiques, mais un coût marginal par élément très inférieur.

## Le piège de `dtype=object` : contigu ne veut pas dire uniforme

Un tableau NumPy créé avec des types hétérogènes (ex. un mélange d'entiers et de chaînes) se rabat sur `dtype=object` : le tableau reste bien un bloc **contigu**... de pointeurs vers des objets [Python](/?c=langages-de-programmation&s=python&p=python) potentiellement dispersés, de types différents. Chaque accès redevient un suivi de pointeur suivi d'une vérification de type par élément : le coût marginal explose et redevient comparable à celui d'une liste [Python](/?c=langages-de-programmation&s=python&p=python), malgré la contiguïté du tableau lui-même.

La contiguïté de la mémoire est nécessaire pour profiter du cache et de SIMD, mais **pas suffisante** : il faut aussi que les éléments soient de taille et de type uniformes, pour que le processeur puisse les traiter en bloc sans revérifier chacun individuellement.

## Compter les accès mémoire aléatoires, pas les instructions

Le nombre d'instructions exécutées est un mauvais indicateur du temps réel : d'après la hiérarchie de cache ci-dessus, ce qui coûte, c'est le nombre d'accès mémoire **aléatoires** (ceux qui manquent le cache), pas le nombre d'opérations.

Sur un solveur SAT (voir [Solveurs SAT et CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)) :

| Optimisation | Effet sur les instructions | Effet sur le temps |
|---|---|---|
| Recherche circulaire du remplaçant ([Gent 2013](https://www.jair.org/index.php/jair/article/view/10839)) | Divise par 2,5 le nombre de littéraux parcourus | Aucun changement |
| Supprimer un accès mémoire aléatoire par propagation (voir « Filtre par bitmap » plus bas) | Change peu le nombre d'instructions | −21 % |

La première optimisation réduit le travail mesuré en instructions, mais ce travail restait déjà dans le cache : moins d'instructions pour le même nombre d'accès mémoire déjà bon marché ne change rien. La seconde supprime un accès qui manquait le cache à chaque propagation : un seul accès aléatoire en moins pèse plus que des milliers d'instructions en moins qui, elles, étaient déjà bon marché.

> Ceci rejoint [Comparer sur des compteurs de travail, pas seulement sur le temps](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparer-sur-des-compteurs-de-travail-pas-seulement-sur-le-temps) : le compteur pertinent pour prédire un gain de performance mémoire n'est pas le nombre d'instructions, mais le nombre d'accès mémoire hors cache.

## Tableau de structures vs structure de tableaux (AoS/SoA)

Quand un algorithme lit et écrit ensemble deux champs d'une même donnée à chaque étape (par exemple la raison et le niveau de décision d'une variable dans un solveur SAT), les ranger dans deux tableaux séparés (**structure de tableaux**, *Structure of Arrays*, SoA) coûte deux lignes de cache par accès : une par tableau. Les ranger côte à côte dans une seule structure, elle-même rangée dans un seul tableau (**tableau de structures**, *Array of Structures*, AoS), les fait tenir dans une seule ligne de cache si la structure est assez petite.

| Disposition | Ce qui est proche en mémoire | Lignes de cache touchées par accès |
|---|---|---|
| Structure de tableaux (SoA) | Tous les `raison[i]` ensemble, tous les `niveau[i]` ensemble, séparément | 2 |
| Tableau de structures (AoS) | `raison[i]` et `niveau[i]` côte à côte pour chaque i | 1 |

Sur ce solveur, regrouper la raison et le niveau d'une variable dans une seule structure a donné −7 %. La règle n'est pas « AoS est toujours meilleur que SoA » : la structure de tableaux reste préférable dès qu'un algorithme parcourt un seul champ à la fois sur beaucoup d'éléments (cas typique du calcul vectoriel vu plus haut dans ce chapitre). La règle est « ranger ensemble ce qui est lu et écrit ensemble ».

> Voir aussi [AoS and SoA (Wikipédia, en anglais)](https://en.wikipedia.org/wiki/AoS_and_SoA) et [L'organisation des données en mémoire](/?c=representation-des-donnees&p=organisation-en-memoire) pour l'alignement et le padding d'une structure.

## Filtre par bitmap

Un **bitmap** (ou *bitset*, tableau de bits) utilise un seul bit par élément au lieu d'un octet ou plus : 8 éléments tiennent dans un seul octet. Il sert ici de filtre : avant de charger un en-tête coûteux dans un tableau de 147 Mo (bien plus gros que n'importe quel cache), un bit dit s'il y a quelque chose à lire à cet endroit.

| Structure consultée | Taille | Résultat |
|---|---|---|
| Bitmap (1 bit par élément) | 575 Ko, tient dans le cache L2 | Accès bon marché, quasiment toujours en cache |
| Tableau des en-têtes complets | 147 Mo | Accès mémoire aléatoire coûteux (hors cache) |

Consulter le bitmap avant l'en-tête a évité 91 % des lectures dans le tableau de 147 Mo : la plupart des accès aléatoires coûteux sont remplacés par un accès bon marché dans une structure qui reste en cache.

> Le principe général : filtrer avec une structure petite qui tient en cache, avant de payer un accès aléatoire dans une structure trop grosse pour y tenir. Voir aussi [bit array (Wikipédia, en anglais)](https://en.wikipedia.org/wiki/Bit_array).

## N'écrire que ce qui sera relu

Écrire n'est pas gratuit : pour modifier une donnée, le processeur charge d'abord sa ligne de cache, comme pour une lecture, puis devra la renvoyer en mémoire quand elle sera évincée du cache. Mettre à jour une donnée que personne ne relira, c'est payer ces accès pour rien.

Dans un solveur SAT (voir [Solveurs SAT et CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)), deux structures auxiliaires, la **phase** enregistrée d'une variable et sa position dans le **tas** des priorités (voir [la file de priorité](/?c=fondamentaux&s=algorithmes&p=file-de-priorite-et-tas-binaire)), ne servent qu'aux variables **décidables** : celles sur lesquelles le solveur a le droit de prendre une décision (dans le solveur Skyscraper, une partie seulement des variables ; les autres sont toujours déduites par propagation). Les mettre à jour aussi pour les autres variables écrit dans des lignes de cache que personne ne relira jamais. Restreindre ces deux mises à jour aux variables décidables supprime ces écritures ; avec d'autres retouches du même type, le gain mesuré est de quelques pour cent, à compteurs de travail identiques.

> Le principe rejoint celui du filtre par bitmap ci-dessus : dans les deux cas, la question posée avant d'agir est « cette donnée sera-t-elle relue ? », pas seulement « ce calcul est-il correct ? ».

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un accès RAM coûte ~50× plus qu'un accès cache L1. Des données contiguës et de type uniforme (tableau typé) profitent du cache et du SIMD ; des données dispersées (liste chaînée, objets épars) rechargent une ligne de cache à chaque accès. Le nombre d'accès mémoire aléatoires prédit le temps bien mieux que le nombre d'instructions. |
| **Outils utilisables** | Un tableau typé contigu (NumPy `ndarray`) plutôt qu'une collection d'objets épars pour du calcul intensif ; un bitmap comme filtre bon marché avant un accès aléatoire coûteux. |
| **Pièges à éviter** | Un tableau NumPy en `dtype=object` : reste contigu en apparence, mais perd tout le bénéfice du cache/SIMD (pointeurs vers des objets dispersés). |
| **Bonnes pratiques** | Préférer un tableau typé et contigu dès que le volume de calcul justifie l'effort ; parcourir les données dans l'ordre de leur disposition mémoire ; ranger ensemble (AoS) les champs lus et écrits ensemble, séparer (SoA) ceux parcourus un par un sur beaucoup d'éléments ; ne mettre à jour que les données encore utiles. |
