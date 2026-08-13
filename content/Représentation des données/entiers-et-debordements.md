---
order: 1
---

# Les entiers, les bits et les débordements

Un entier n'est pas stocké "tel quel" : il occupe un nombre **fixe** de bits, décidé à la déclaration. Toute la mécanique des entiers découle de cette contrainte : les valeurs maximales, les nombres négatifs, et les débordements.

## Combien de valeurs dans *n* bits ?

Avec *n* bits, on dispose de **2ⁿ** combinaisons distinctes, donc 2ⁿ valeurs représentables :

| Bits | Combinaisons | Non signé | Signé |
|---|---|---|---|
| 8 | 256 | 0 → 255 | −128 → 127 |
| 16 | 65 536 | 0 → 65 535 | −32 768 → 32 767 |
| 32 | ~4,3 milliards | 0 → 4 294 967 295 | −2 147 483 648 → 2 147 483 647 |
| 64 | ~1,8 × 10¹⁹ | 0 → ~1,8 × 10¹⁹ | ~−9,2 × 10¹⁸ → ~9,2 × 10¹⁸ |

Le nombre de valeurs ne change pas selon qu'on soit signé ou non : c'est la **plage** qui se décale. Un `char` non signé va de 0 à 255, un signé de −128 à 127 : 256 valeurs dans les deux cas.

**Le calcul à retenir :** pour *n* bits, la valeur maximale non signée est `2ⁿ − 1` (le `− 1` parce que le zéro occupe une combinaison). En signé, la plage est `−2ⁿ⁻¹` à `2ⁿ⁻¹ − 1`.

## Le poids d'un bit

Chaque bit contribue à la valeur totale selon sa position, une puissance de 2 croissante de droite à gauche (son **poids**) :

```text
bit :    1    0    1    1    0    0    1    0
poids : 128   64   32   16   8    4    2    1
         ^                                  ^
    poids fort                        poids faible
```

Le **bit de poids faible** (le plus à droite) est celui qui vaut 1 (2⁰) ; le **bit de poids fort** (le plus à gauche) est celui qui pèse le plus dans la valeur finale, 2ⁿ⁻¹ sur *n* bits. Cette distinction revient dans deux contextes courants : le bit de poids fort sert d'indicateur de signe en complément à deux (voir plus bas), et le bit de poids faible seul suffit à tester la parité d'un nombre (`n & 1`, voir le chapitre [Les opérateurs binaires](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

## Les nombres négatifs : le complément à deux

Comment stocker un signe alors qu'on ne dispose que de 0 et de 1 ? L'idée naïve serait de réserver un bit pour le signe. C'est ce que fait le flottant, mais pas l'entier, car cela poserait deux problèmes : deux représentations du zéro (`+0` et `−0`), et une addition qui devrait traiter les signes à part.

La solution universellement adoptée est le **complément à deux** : pour obtenir `−x`, on inverse tous les bits de `x` puis on ajoute 1.

```text
 5 (sur 8 bits)  = 0000 0101
 inversion       = 1111 1010
 + 1             = 1111 1011  =  -5
```

L'intérêt est décisif : **l'addition fonctionne sans cas particulier**. Le processeur additionne les bits sans savoir ni se soucier du signe.

```text
   5  = 0000 0101
+ -5  = 1111 1011
-----------------
   0  = 0000 0000   (le bit qui deborde est simplement perdu)
```

Le bit de poids fort agit alors comme un indicateur de signe : `0` pour positif, `1` pour négatif. C'est aussi ce qui explique l'**asymétrie** de la plage (`−128` à `127`) : le zéro étant du côté positif, il reste une combinaison de plus pour les négatifs.

## Le débordement (*overflow*)

Que se passe-t-il quand un résultat ne tient plus dans le nombre de bits alloués ? Les bits en trop sont **perdus**, et la valeur "boucle".

```c
unsigned char x = 255;  // 1111 1111, le maximum
x = x + 1;              // 0000 0000 -> 0 !
```

C'est le comportement dit *wraparound* : on repasse au début, comme un compteur kilométrique. Pour un entier **signé**, l'effet est plus surprenant :

```c
signed char y = 127;  // 0111 1111, le maximum
y = y + 1;            // 1000 0000 -> -128 !
```

Ajouter 1 au plus grand nombre positif donne le plus petit négatif.

> **Piège majeur en C/C++ :** le débordement d'un entier **signé** est un **comportement indéfini** (*undefined behavior*), pas un wraparound garanti. Le compilateur a le droit de supposer qu'il n'arrive jamais et d'optimiser en conséquence : un test comme `if (x + 1 < x)` peut être purement supprimé. Le débordement **non signé**, lui, est défini par la norme et boucle bien. Pour compter, comparer ou masquer des bits, préférez donc les types non signés.

## Pourquoi ça compte vraiment

Les débordements d'entiers ne sont pas une curiosité académique :

- Le **bug de l'an 2038** : les systèmes Unix comptent les secondes depuis 1970 dans un entier signé 32 bits. Il débordera le 19 janvier 2038, renvoyant une date en 1901.
- De nombreuses **failles de sécurité** viennent d'un calcul de taille qui déborde : si `taille + 1` boucle à 0, une allocation de 0 octet est suivie d'une écriture de plusieurs milliers : c'est un débordement de tampon. Voir le chapitre [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire) de C.
- La **première Ariane 5** a été détruite en 1996 à cause d'une conversion d'un flottant 64 bits vers un entier 16 bits qui a débordé.

## Selon les langages

| Langage | Comportement |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp) | Taille fixe choisie explicitement. Débordement signé = comportement indéfini |
| [Java](https://docs.oracle.com/en/java/), [C#](https://learn.microsoft.com/en-us/dotnet/csharp/) | Taille fixe, wraparound défini pour tous les entiers |
| **[Python](/?c=langages-de-programmation&s=python&p=python)** | Entiers de **taille arbitraire** : ils grandissent tant que la mémoire suit, aucun débordement |
| JavaScript | Pas de vrai type entier : tout est flottant, donc exact seulement jusqu'à 2⁵³ (voir [Les nombres à virgule flottante](/?c=representation-des-donnees&p=nombres-flottants)). `BigInt` pour aller au-delà |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | Entier natif ; en cas de débordement, conversion automatique en `float` (donc perte de précision) |

Python illustre bien le compromis : ne jamais déborder est confortable, mais chaque entier est un objet plus lourd et plus lent qu'un entier machine. C'est l'une des raisons pour lesquelles les bibliothèques de calcul comme NumPy utilisent des types à taille fixe (`int32`, `int64`). Voir le chapitre [NumPy](/?c=data-science&p=numpy).

## Manipuler les bits directement

Le corollaire de cette représentation binaire est qu'on peut agir sur les bits eux-mêmes : masques, décalages, drapeaux. C'est l'objet du chapitre [Les opérateurs binaires](/?c=langages-de-programmation&s=c&p=operateurs-binaires) en C.

## Résumé

| À retenir | |
|---|---|
| *n* bits | 2ⁿ valeurs ; max non signé = 2ⁿ − 1 |
| Négatifs | Complément à deux : inverser les bits, ajouter 1 |
| Plage signée asymétrique | Le zéro est compté du côté positif |
| Débordement | Les bits en trop sont perdus, la valeur boucle |
| En C, signé qui déborde | Comportement **indéfini** : utiliser du non signé |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un entier occupe un nombre fixe de bits, décidé à la déclaration : *n* bits donnent 2ⁿ valeurs possibles. Les négatifs s'encodent en complément à deux ; un débordement fait "boucler" la valeur (ou provoque un comportement indéfini en C pour un signé). |
| **Outils utilisables** | Les types non signés pour compter/comparer/masquer des bits sans risque d'UB ; les types à taille fixe (`int32`, `int64`) des bibliothèques de calcul. |
| **Pièges à éviter** | Compter sur le débordement d'un entier signé en C/C++ : comportement indéfini, pas un wraparound garanti. |
| **Bonnes pratiques** | Préférer les types non signés pour toute manipulation de bits ; vérifier qu'un calcul de taille ne peut pas déborder avant une allocation mémoire. |
