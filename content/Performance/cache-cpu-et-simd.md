---
order: 6
---

# Cache CPU et vectorisation (SIMD)

Les chapitres précédents traitent du temps perdu à attendre un **autre composant** (réseau, disque, service distant). Pour du calcul pur — additionner des nombres, transformer un tableau — la même distinction [coût fixe / coût marginal](/?c=performance&p=limiter-les-aller-retours) existe, mais ce qui domine le coût marginal n'est plus une latence réseau : c'est la façon dont le processeur accède à la mémoire.

## La hiérarchie de cache

Un processeur ne lit jamais la RAM directement à chaque accès : plusieurs niveaux de mémoire, de plus en plus petits et rapides, s'intercalent entre lui et la RAM.

| Niveau | Taille typique | Latence relative |
|---|---|---|
| Registres | Quelques dizaines d'octets | ~1 cycle |
| Cache L1 | 32-64 Ko | ~4 cycles |
| Cache L2 | 256 Ko-1 Mo | ~15 cycles |
| Cache L3 | Quelques Mo (partagé entre cœurs) | ~40 cycles |
| RAM | Plusieurs Go | ~200 cycles |

Un **registre** est un emplacement de stockage intégré au processeur lui-même (pas en mémoire) : c'est là qu'il place les valeurs sur lesquelles il opère directement. Un **cycle** est le battement de l'horloge interne du processeur — l'unité de temps la plus fine à laquelle il peut agir ; toutes les latences ci-dessus s'expriment en nombre de cycles plutôt qu'en secondes, parce que ce nombre reste stable d'une machine à l'autre, contrairement à la durée réelle d'un cycle (qui dépend de la fréquence du processeur).

Ces chiffres sont des ordres de grandeur (ils varient selon l'architecture), mais le rapport entre eux est ce qui compte : un accès RAM coûte facilement 50 fois plus qu'un accès L1. Un programme qui multiplie les allers-retours vers la RAM plutôt que de réutiliser ce qui est déjà en cache peut être des dizaines de fois plus lent, à nombre d'opérations strictement identique.

## Lignes de cache : la mémoire contiguë est "gratuite"

Le processeur ne charge jamais un seul octet : il charge toujours un bloc de taille fixe, la **ligne de cache** (64 octets sur la plupart des architectures actuelles), même si un seul octet de ce bloc est demandé.

Conséquence directe : lire des données **contiguës** (un tableau parcouru dans l'ordre) profite de lignes déjà chargées par les accès précédents — la majorité des lectures ne coûtent presque rien. Lire des données **dispersées** (une liste chaînée, des objets épars sur le tas) déclenche un nouveau chargement de ligne à chaque accès, sans rien réutiliser.

> C'est la même unité (l'octet comme adresse, le bloc comme granularité de transfert) que celle vue dans [L'organisation des données en mémoire](/?c=representation-des-donnees&p=organisation-en-memoire) — l'alignement et le padding influencent directement combien de lignes de cache une structure occupe.

## Coût fixe vs coût marginal, appliqué au calcul

Appeler une fonction vectorisée (`tableau.sum()`, `tableau * 2`) a, comme un appel réseau, un **coût fixe** : choisir quelle routine bas niveau exécuter, allouer le tableau résultat — indépendant du nombre d'éléments `n`. Le **coût marginal** (le coût par élément) dépend ensuite de deux choses : la localité mémoire vue ci-dessus, et la capacité du processeur à traiter plusieurs éléments par instruction plutôt qu'un seul.

C'est ce second point qu'on appelle **SIMD** (*Single Instruction, Multiple Data*) : une instruction processeur qui applique la même opération à plusieurs valeurs contiguës d'un coup (ex. additionner 8 entiers en une seule instruction, plutôt que 8 instructions séparées). SIMD n'est exploitable que si les données sont **contiguës et de taille uniforme** — exactement ce que garantit un tableau typé, et jamais ce que garantit une collection d'objets épars.

## Pourquoi un tableau NumPy est rapide et une liste Python ne l'est pas

Une liste Python est un tableau de **pointeurs** vers des objets, potentiellement dispersés n'importe où sur le tas et de tailles différentes. Une boucle `for` sur une liste Python doit, à chaque itération : suivre un pointeur (accès mémoire potentiellement hors cache), vérifier le type de l'objet pointé, puis appeler la bonne routine — le tout piloté par l'interpréteur, instruction par instruction.

Un tableau NumPy (`ndarray`) est un unique bloc de mémoire **contigu**, contenant les valeurs elles-mêmes (pas des pointeurs), toutes du même type et de la même taille. Une opération vectorisée (`a + b`) délègue à une boucle **compilée** qui parcourt ce bloc de façon séquentielle : les lignes de cache sont réutilisées au maximum, et le processeur peut employer des instructions SIMD sur plusieurs éléments à la fois. Même nombre d'opérations arithmétiques, mais un coût marginal par élément très inférieur.

## Le piège de `dtype=object` : contigu ne veut pas dire uniforme

Un tableau NumPy créé avec des types hétérogènes (ex. un mélange d'entiers et de chaînes) se rabat sur `dtype=object` : le tableau reste bien un bloc **contigu**... de pointeurs vers des objets Python potentiellement dispersés, de types différents. Chaque accès redevient un suivi de pointeur suivi d'une vérification de type par élément — le coût marginal explose et redevient comparable à celui d'une liste Python, malgré la contiguïté du tableau lui-même.

La contiguïté de la mémoire est nécessaire pour profiter du cache et de SIMD, mais **pas suffisante** : il faut aussi que les éléments soient de taille et de type uniformes, pour que le processeur puisse les traiter en bloc sans revérifier chacun individuellement.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un accès RAM coûte ~50× plus qu'un accès cache L1. Des données contiguës et de type uniforme (tableau typé) profitent du cache et du SIMD ; des données dispersées (liste chaînée, objets épars) rechargent une ligne de cache à chaque accès. |
| **Outils utilisables** | Un tableau typé contigu (NumPy `ndarray`) plutôt qu'une collection d'objets épars pour du calcul intensif. |
| **Pièges à éviter** | Un tableau NumPy en `dtype=object` — reste contigu en apparence, mais perd tout le bénéfice du cache/SIMD (pointeurs vers des objets dispersés). |
| **Bonnes pratiques** | Préférer un tableau typé et contigu dès que le volume de calcul justifie l'effort ; parcourir les données dans l'ordre de leur disposition mémoire. |
