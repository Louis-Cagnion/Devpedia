---
order: 15
---

# Les opérateurs binaires

Les opérateurs binaires (ou "bit à bit") travaillent directement sur la représentation binaire des entiers, bit par bit. En C, ils servent tous les jours sans qu'on y pense : les drapeaux passés aux appels système, les permissions de fichiers, ou encore l'optimisation de calculs simples reposent dessus.

## Les six opérateurs

| Opérateur | Nom | Effet sur chaque bit |
|---|---|---|
| `&` | ET (AND) | 1 si les **deux** bits sont à 1 |
| `\|` | OU (OR) | 1 si **au moins un** bit est à 1 |
| `^` | OU exclusif (XOR) | 1 si les bits sont **différents** |
| `~` | NON (NOT) | inverse chaque bit |
| `<<` | décalage à gauche | décale les bits vers la gauche |
| `>>` | décalage à droite | décale les bits vers la droite |

```c
unsigned char a = 12;  // 0000 1100
unsigned char b = 10;  // 0000 1010

a & b  // 0000 1000 = 8   -> bits presents dans les deux
a | b  // 0000 1110 = 14  -> bits presents dans l'un ou l'autre
a ^ b  // 0000 0110 = 6   -> bits presents dans un seul des deux
~a     // 1111 0011 = 243 (sur unsigned char)
```

> Ne pas confondre `&` avec `&&`, ni `|` avec `||`. Les versions doubles sont les opérateurs **logiques** : ils travaillent sur des valeurs vraies/fausses et renvoient 0 ou 1. `1 & 2` vaut `0` (aucun bit commun), alors que `1 && 2` vaut `1` (les deux valeurs sont vraies). Cette confusion est une source de bugs silencieux.

## Les décalages

Décaler à gauche de `n` positions revient à **multiplier par 2ⁿ**, décaler à droite à **diviser par 2ⁿ** (division entière) :

```c
unsigned char x = 5;    // 0000 0101

x << 1  // 0000 1010 = 10   (5 * 2)
x << 3  // 0010 1000 = 40   (5 * 8)
x >> 1  // 0000 0010 = 2    (5 / 2, arrondi vers le bas)
```

Les bits qui sortent de la largeur du type sont **perdus** ; ce n'est pas une erreur, il n'y a aucun avertissement :

```c
unsigned char y = 200;  // 1100 1000
y << 1                  // 1001 0000 = 144, et non 400 : un bit est tombe
```

**Deux pièges à connaître :**

- Décaler d'un nombre supérieur ou égal à la largeur du type est un **comportement indéfini** (`x << 32` sur un `int` 32 bits) : le résultat n'est pas garanti, même s'il "semble marcher".
- `>>` sur un entier **signé négatif** dépend de l'implémentation (le bit de signe peut être propagé ou non). Pour manipuler des bits, utilisez systématiquement des types **non signés** (`unsigned int`, `uint32_t`).

## Les masques : la vraie utilité au quotidien

Un **masque** est une valeur dont on se sert pour cibler des bits précis. Les quatre opérations de base :

```c
#define DRAPEAU_LECTURE   (1u << 0)  // 0000 0001
#define DRAPEAU_ECRITURE  (1u << 1)  // 0000 0010
#define DRAPEAU_AJOUT     (1u << 2)  // 0000 0100

unsigned int options = 0;

options |= DRAPEAU_LECTURE;                 // ACTIVER  un bit
options |= DRAPEAU_ECRITURE;

if (options & DRAPEAU_ECRITURE) { ... }     // TESTER   un bit

options &= ~DRAPEAU_ECRITURE;  // DESACTIVER un bit
options ^= DRAPEAU_AJOUT;      // BASCULER un bit
```

C'est exactement le mécanisme des appels système : `open("f.txt", O_WRONLY | O_CREAT)` combine des drapeaux avec `|`, et la fonction les teste ensuite avec `&`. Voir le chapitre [Appels système et descripteurs](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs).

Les permissions de fichiers Unix suivent la même logique en base 8 : `0644` code trois groupes de trois bits (lecture/écriture/exécution pour le propriétaire, le groupe, les autres). Voir aussi le chapitre [Permissions et fichiers](/?c=shells&s=bash&p=permissions-et-fichiers) de Bash.

**Pourquoi des drapeaux plutôt que des booléens séparés ?** Un seul `unsigned int` stocke 32 options indépendantes, se passe en un seul argument, et se teste en une instruction processeur.

## Idiomes courants

```c
// Parite : le bit de poids faible vaut 1 pour un nombre impair
if (n & 1) { /* n est impair */ }

// Puissance de 2 : une seule fois le bit a 1, donc n & (n-1) == 0
int est_puissance_de_2(unsigned int n) {
    return n != 0 && (n & (n - 1)) == 0;
}

// Compter les bits a 1 (algorithme de Kernighan)
int compter_bits(unsigned int n) {
    int total = 0;
    while (n) {
        n &= n - 1;      // efface le bit a 1 le plus a droite
        total++;
    }
    return total;
}

// Echanger deux entiers sans variable temporaire (curiosite, pas a utiliser)
a ^= b; b ^= a; a ^= b;
```

Les deux premiers sont utiles en pratique. Le dernier illustre une propriété du XOR (`x ^ x == 0`, `x ^ 0 == x`) mais est à éviter dans du vrai code : il est illisible, plus lent qu'une variable temporaire sur un processeur moderne, et **faux si les deux variables sont la même** (`a` et `a` deviendraient 0).

## `n & 1` plutôt que `n % 2` ?

Historiquement, `n & 1` était plus rapide que `n % 2`, et `n << 1` plus rapide que `n * 2`. **Ce n'est plus un argument valable** : tout compilateur moderne effectue ces substitutions lui-même quand elles sont correctes.

Écrivez donc ce qui exprime votre intention : `n % 2 == 0` si vous parlez de parité, `n & MASQUE` si vous parlez de bits. La lisibilité y gagne et la performance est identique.

> Attention tout de même : `n % 2` et `n & 1` ne sont **pas** équivalents pour un `n` négatif en C (`-3 % 2` vaut `-1`). C'est une raison de plus de réserver les opérations binaires aux types non signés.

## Résumé

| Objectif | Écriture |
|---|---|
| Activer un bit | `x \|= MASQUE` |
| Désactiver un bit | `x &= ~MASQUE` |
| Basculer un bit | `x ^= MASQUE` |
| Tester un bit | `if (x & MASQUE)` |
| Créer un masque pour le bit *n* | `1u << n` |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les opérateurs binaires (`&`, `\|`, `^`, `~`, `<<`, `>>`) travaillent bit à bit, utilisés pour les drapeaux, permissions, et masques. Ne pas confondre avec `&&`/`\|\|` (logiques). |
| **Outils utilisables** | Masques (`\|=` active, `&= ~` désactive, `^=` bascule, `&` teste un bit). |
| **Pièges à éviter** | Décaler d'un nombre de bits ≥ la largeur du type (comportement indéfini) ; utiliser `>>` sur un signé négatif (dépend de l'implémentation). |
| **Bonnes pratiques** | Réserver les opérations binaires aux types non signés ; écrire `n % 2`/`n * 2` plutôt que `n & 1`/`n << 1` pour la lisibilité : un compilateur moderne optimise déjà l'équivalence. |
