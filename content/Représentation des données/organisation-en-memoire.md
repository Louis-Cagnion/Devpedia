---
order: 4
---

# L'organisation des données en mémoire

La mémoire est un immense tableau d'octets numérotés. Comprendre comment les valeurs y sont disposées explique plusieurs comportements déroutants : pourquoi une structure occupe plus de place que la somme de ses champs, ou pourquoi un fichier binaire écrit sur une machine peut être illisible sur une autre.

> Ce chapitre traite de la **disposition** des données. Pour l'allocation (pile, tas, `malloc`/`free`) et les bugs associés, voir le chapitre [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire) de C.

## L'unité d'adressage est l'octet

Chaque **octet** (8 bits) possède sa propre adresse. On ne peut pas adresser un bit isolé : pour lire un bit précis, il faut charger l'octet qui le contient puis appliquer un masque (voir [Les opérateurs binaires](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

Le processeur, lui, travaille par **mot** (*word*) : 8 octets sur une machine 64 bits. C'est cette différence d'échelle entre l'unité d'adressage et l'unité de traitement qui explique tout ce qui suit.

## L'alignement

Un processeur lit la mémoire par blocs alignés sur des multiples de la taille du mot. Une valeur de 4 octets placée à une adresse multiple de 4 se lit en un seul accès ; à cheval sur deux blocs, il en faut deux, plus un recollage.

La règle appliquée par les compilateurs : **une valeur de taille *n* est placée à une adresse multiple de *n***.

Sur certaines architectures, un accès non aligné est simplement **interdit** et provoque une erreur matérielle. Sur x86 il fonctionne mais coûte plus cher. Dans les deux cas, le compilateur préfère aligner.

## Le remplissage (*padding*) dans les structures

C'est la conséquence la plus visible de l'alignement : une structure occupe souvent **plus** que la somme de ses champs.

```c
struct Exemple {
    char  a;  // 1 octet
    int   b;  // 4 octets
    char  c;  // 1 octet
};

sizeof(struct Exemple)   // 12, et non 6 !
```

Ce que fait réellement le compilateur :

```text
octet 0     : a
octets 1-3  : REMPLISSAGE (pour aligner b sur un multiple de 4)
octets 4-7  : b
octet 8     : c
octets 9-11 : REMPLISSAGE (pour que la taille totale soit multiple de 4)
```

Le remplissage final existe pour que, dans un **tableau** de structures, chaque élément reste aligné.

**Conséquence pratique : l'ordre de déclaration change la taille.** En regroupant les champs du plus grand au plus petit, on réduit le gaspillage :

```c
struct Compacte {
    int   b;  // octets 0-3
    char  a;  // octet 4
    char  c;  // octet 5
                // octets 6-7 : remplissage final
};              // sizeof = 8 au lieu de 12
```

Sur une structure utilisée en millions d'exemplaires, ce détail change la consommation mémoire d'un tiers, et surtout l'efficacité du cache processeur, souvent plus déterminante que le calcul lui-même.

> Ne calculez donc **jamais** la taille d'une structure à la main : utilisez `sizeof`. Et n'écrivez pas une structure brute dans un fichier ou sur le réseau en supposant sa disposition : le remplissage varie selon le compilateur et l'architecture. C'est le rôle de la **sérialisation** ([JSON](/?c=infrastructure&p=json), [Protobuf](https://protobuf.dev)...) de produire un format défini indépendamment de la machine.

## L'ordre des octets (*endianness*)

Pour une valeur de plusieurs octets, dans quel ordre les ranger en mémoire ? Deux conventions coexistent. Prenons l'entier 32 bits `0x12345678` :

| Convention | Octets en mémoire | Utilisée par |
|---|---|---|
| **Little-endian** | `78 56 34 12` | x86, x86-64, ARM (par défaut) |
| **Big-endian** | `12 34 56 78` | Réseau, certains processeurs (SPARC, PowerPC) |

Le *little-endian* place l'octet de **poids faible** en premier. Ce n'est ni mieux ni pire, c'est un choix historique, mais il n'est pas universel, d'où deux implications :

- Un fichier binaire écrit sur une machine little-endian et lu par une big-endian donnera des valeurs erronées, sans erreur signalée : la lecture réussit, les nombres sont juste faux.
- Les protocoles réseau imposent le big-endian, appelé pour cette raison **ordre réseau**. Les fonctions `htons()`/`ntohl()` en C servent exactement à cette conversion.

C'est encore une raison de préférer un format sérialisé explicite (texte ou binaire spécifié) à une copie brute de la mémoire.

## Ce que "l'adresse" veut dire concrètement

Un pointeur contient l'adresse du **premier** octet d'une valeur. C'est son **type** qui indique combien d'octets lire à partir de là, et comment les interpréter.

```c
int    x = 65;
int   *pi = &x;
char  *pc = (char *)&x;

*pi  // 65      -> lit 4 octets, les interprete comme un entier
*pc  // 'A'     -> lit 1 octet a la MEME adresse, l'interprete comme un caractere
```

C'est aussi pourquoi `pointeur + 1` avance de `sizeof(type)` octets et non de 1 : l'arithmétique de pointeurs compte en éléments, pas en octets. Voir le chapitre [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs).

## Et dans les langages de plus haut niveau ?

[Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) ou [PHP](/?c=langages-de-programmation&s=php&p=php) masquent tout cela : vous ne choisissez pas la disposition mémoire. Mais elle ne disparaît pas, et se manifeste autrement :

- une liste Python de 1 000 entiers occupe beaucoup plus que 4 000 octets, car chaque entier est un **objet** avec son en-tête ;
- c'est précisément pour cette raison que NumPy existe : un tableau NumPy stocke des valeurs brutes contiguës, alignées, sans en-tête par élément : d'où des gains de vitesse d'un ordre de grandeur sur du calcul numérique (voir [NumPy](/?c=data-science&p=numpy)).

## Résumé

| Notion | À retenir |
|---|---|
| Unité d'adressage | L'octet ; un bit seul n'est pas adressable |
| Alignement | Une valeur de *n* octets se place à une adresse multiple de *n* |
| Padding | Une structure ≥ somme de ses champs ; l'ordre de déclaration compte |
| `sizeof` | Toujours mesurer, jamais calculer à la main |
| Endianness | Ordre des octets ; le réseau impose le big-endian |
| Écrire de la mémoire brute | À éviter : sérialiser dans un format défini |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La mémoire s'adresse par octet, mais le processeur préfère lire des valeurs alignées sur des multiples de leur taille : d'où le *padding* qui agrandit une structure au-delà de la somme de ses champs. L'ordre des octets (*endianness*) varie selon l'architecture. |
| **Outils utilisables** | `sizeof` pour mesurer une taille réelle, réordonner les champs d'une structure (plus grand au plus petit) pour réduire le padding. |
| **Pièges à éviter** | Calculer la taille d'une structure à la main plutôt que d'utiliser `sizeof` ; écrire la mémoire brute d'une structure dans un fichier/réseau, sans tenir compte du padding ni de l'endianness. |
| **Bonnes pratiques** | Sérialiser dans un format défini (JSON, Protobuf...) plutôt que copier la mémoire brute d'une structure entre machines. |
