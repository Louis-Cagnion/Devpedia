---
order: 4
---

# Les pointeurs

Un pointeur est une variable qui ne stocke pas une valeur directement, mais l'**adresse mémoire** d'une autre variable. C'est le mécanisme central qui permet en C de manipuler la mémoire directement, de passer des données aux fonctions sans les copier, et de construire des structures de données dynamiques (listes chaînées, arbres...).

## Déclaration, adresse et déréférencement

```c
int age = 25;
int *ptr = &age;

printf("%d\n", age);   // 25          -> la valeur
printf("%p\n", &age);  // 0x7ffee...  -> l'adresse mémoire de age
printf("%p\n", ptr);   // 0x7ffee...  -> la même adresse, stockée dans ptr
printf("%d\n", *ptr);  // 25          -> la valeur pointée par ptr
```

- `&variable` : opérateur "adresse de", renvoie l'adresse mémoire d'une variable.
- `*ptr` (en déclaration) : indique que `ptr` est un pointeur.
- `*ptr` (en dehors d'une déclaration) : opérateur de **déréférencement**, accède à la valeur stockée à l'adresse contenue dans `ptr`.

Modifier `*ptr` modifie directement `age`, puisque les deux désignent le même emplacement mémoire :

```c
*ptr = 30;
printf("%d\n", age); // 30
```

## Arithmétique de pointeurs

Additionner 1 à un pointeur ne l'avance pas d'un octet, mais de `sizeof(type)` octets :

```c
int tab[3] = {10, 20, 30};
int *p = tab;

printf("%d\n", *p);        // 10
printf("%d\n", *(p + 1));  // 20 -> avance de sizeof(int) octets, pas de 1 octet
printf("%d\n", *(p + 2));  // 30
```

> **Note :** un tableau `tab` se comporte comme un pointeur vers son premier élément. `tab[i]` et `*(tab + i)` sont deux écritures strictement équivalentes en C : c'est pour ça que l'indexation de tableau (`[]`) fonctionne aussi sur un pointeur brut.

### `[]` n'est que du sucre syntaxique

L'équivalence ci-dessus est plus profonde qu'une simple commodité d'écriture : l'opérateur `[]` n'a en C **aucune notion** de "tableau" ni d'"index". Le compilateur le traduit mécaniquement, toujours, par :

```text
a[b]  ≡  *(a + b)
```

Comme l'addition est commutative (`tab + 2` et `2 + tab` désignent la même adresse), on obtient une conséquence surprenante mais parfaitement légale :

```c
int tab[5] = {1, 2, 3, 4, 5};

printf("%d\n", tab[2]);      // 3
printf("%d\n", *(tab + 2));  // 3
printf("%d\n", 2[tab]);      // 3 aussi !
```

> `2[tab]` ne sert à rien en pratique et n'a sa place que dans les questions pièges d'entretien. En revanche, comprendre *pourquoi* ça compile est utile : cela ancre le fait qu'en C, indexer un tableau **est** une arithmétique de pointeurs, et rien d'autre.

## Pointeur vers pointeur

Un pointeur peut lui-même être pointé, ce qui est utile pour modifier un pointeur depuis une fonction (cf. passage par adresse ci-dessous) :

```c
int age = 25;
int *ptr = &age;
int **ptrPtr = &ptr;

printf("%d\n", **ptrPtr); // 25 -> déréférence deux fois : ptrPtr -> ptr -> age
```

## Passer un pointeur à une fonction (passage par adresse)

En C, les arguments sont passés **par valeur** (une copie) par défaut : une fonction ne peut donc pas modifier la variable d'origine de l'appelant, sauf en lui passant directement l'adresse de cette variable :

```c
void incrementer(int *nombre)
{
    (*nombre)++; // modifie la valeur à l'adresse pointée, donc la variable d'origine
}

int main(void)
{
    int x = 5;
    incrementer(&x);
    printf("%d\n", x); // 6
}
```

Sans le `*`, `incrementer(int nombre)` ne modifierait qu'une copie locale, sans effet sur `x`.

### Le piège d'une struct passée par valeur, avec un champ pointeur à l'intérieur

Une structure contenant un champ pointeur, passée **par valeur**, complique ce principe : la structure entière est copiée, y compris la *valeur* du pointeur (l'adresse qu'il contient). Modifier ce que ce pointeur désigne reste donc visible pour l'appelant (même mémoire partagée), mais **réaffecter le pointeur lui-même** (par exemple après un `realloc` qui déplace le bloc) ne modifie que la copie locale, exactement comme pour un `int` passé sans `&`.

```c
typedef struct { int *data; size_t count; } Buffer;

void grow_wrong(Buffer buf) {          // struct recue PAR VALEUR
    int *nouveau = realloc(buf.data, (buf.count + 1) * sizeof(int));
    buf.data = nouveau;                // ne modifie que la copie locale de buf
}                                       // l'appelant garde son ancien buf.data,
                                        // potentiellement deja libere si realloc a deplace le bloc

void grow_right(Buffer *buf) {         // struct recue par pointeur
    int *nouveau = realloc(buf->data, (buf->count + 1) * sizeof(int));
    buf->data = nouveau;               // modifie bien la structure de l'appelant
}
```

> **Piège :** avec `grow_wrong`, si `realloc` doit déplacer le bloc, l'appelant continue de pointer vers l'ancienne adresse, que `realloc` vient pourtant de libérer en interne. Le programme peut fonctionner "par chance" un moment (l'ancienne adresse reste lisible tant qu'elle n'est pas réutilisée), avant de produire des erreurs mémoire difficiles à situer (accès invalide, double free) bien plus tard, au moment où l'appelant utilise enfin ce pointeur périmé. Valgrind révèle ce genre de bug en remontant deux traces : où le bloc a été alloué, et où il a été libéré par surprise (voir [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire)).

## Pointeurs de fonctions

Une fonction a elle aussi une adresse en mémoire, qu'on peut stocker dans un pointeur, utile pour choisir dynamiquement quelle fonction appeler (callbacks, tables de dispatch) :

```c
int addition(int a, int b) { return a + b; }
int soustraction(int a, int b) { return a - b; }

int (*operation)(int, int) = addition;

printf("%d\n", operation(4, 2)); // 6
operation = soustraction;
printf("%d\n", operation(4, 2)); // 2
```

## `NULL` et pointeurs invalides

Un pointeur non initialisé contient une adresse **aléatoire** ("wild pointer") : le déréférencer produit un comportement indéfini, souvent un crash (`segmentation fault`). Un pointeur qu'on n'utilise pas encore doit être explicitement mis à `NULL`, et testé avant déréférencement :

```c
int *ptr = NULL;

if (ptr != NULL) {
    printf("%d\n", *ptr);
} else {
    printf("ptr ne pointe vers rien.\n");
}
```

> **Note :** un pointeur qui pointait vers une zone mémoire libérée (`free()`, voir [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire)) est appelé **dangling pointer**. Le déréférencer est un bug classique (*use-after-free*) : la mémoire peut sembler encore contenir la bonne valeur par coïncidence, jusqu'à ce qu'elle soit réutilisée ailleurs.

## Comparer des pointeurs : l'adresse ou la valeur ?

Avec un pointeur, il y a deux choses distinctes à comparer, et confondre les deux est une source d'erreurs :

```c
int a = 5;  // stockee a l'adresse 0x1000
int b = 5;  // stockee a l'adresse 0x2000
int *p1 = &a;
int *p2 = &b;

p1 == p2    // faux : les adresses sont differentes
*p1 == *p2  // vrai : les valeurs pointees sont identiques
```

- `p1 == p2` compare les **adresses** : "ces deux pointeurs désignent-ils le même emplacement mémoire ?"
- `*p1 == *p2` compare les **valeurs pointées** : "le contenu est-il le même ?"

Deux pointeurs peuvent donc parfaitement contenir la même valeur sans être égaux, et inversement.

> Cette distinction (comparaison par **référence** ou par **valeur**) n'est pas propre au C, elle se retrouve dans la plupart des langages. En [Python](/?c=langages-de-programmation&s=python&p=python), `is` compare l'identité (l'équivalent de `p1 == p2`) et `==` compare la valeur (l'équivalent de `*p1 == *p2`) ; voir le chapitre [Variables](/?c=langages-de-programmation&s=python&p=variables) de [Python](/?c=langages-de-programmation&s=python&p=python). Comparer des chaînes en C illustre le même piège : `str1 == str2` compare deux adresses, pas deux textes : il faut `strcmp()`.

## Lire une déclaration complexe : la règle droite-gauche

Un tableau de pointeurs et un pointeur vers un tableau se ressemblent à l'écriture, mais désignent des types complètement différents. Pour les distinguer sans se tromper, la **règle droite-gauche** (*right-left rule*, parfois appelée *spiral rule*) consiste à partir du nom de la variable, puis à alterner à droite et à gauche des symboles qui l'entourent (en respectant les parenthèses, qui forcent l'ordre de lecture) :

```c
int *table[5];    // table : un tableau de 5 pointeurs vers int (le [] se lit avant le *)
int (*table)[5];  // table : un pointeur vers un tableau de 5 int (les parentheses inversent l'ordre)
```

| Déclaration | Lecture (règle droite-gauche) | Signification |
|---|---|---|
| `int *table[5];` | `table` → `[5]` (tableau de 5) → `*` (pointeurs vers) → `int` | Un tableau de 5 pointeurs, chacun pouvant viser une zone de taille indépendante |
| `int (*table)[5];` | `table` → `*` (pointeur vers, grâce aux parenthèses) → `[5]` (un tableau de 5) → `int` | Un seul pointeur, qui vise un bloc de 5 `int` contigus |
| `int *(*table)[5];` | idem, avec un `*` de plus juste avant `int` | Un pointeur vers un tableau de 5 pointeurs vers `int` |

> **Piège :** prendre l'adresse d'une variable (`&`) ajoute un niveau de pointeur **juste à côté du nom**, à l'intérieur des mêmes parenthèses, jamais ailleurs dans la déclaration :
> ```c
> int (*table)[5];    // table : pointeur vers un tableau de 5 int
> int (**ptable)[5];  // ptable : pointeur vers (pointeur vers un tableau de 5 int) = &table
> ```
> Ajouter le `*` à un autre endroit (par exemple juste avant `int`) donne un type totalement différent (ici, "pointeur vers un tableau de 5 pointeurs vers int"), sans rapport avec l'opérateur `&`.

> **Bonne pratique :** un outil comme [cdecl.org](https://cdecl.org) traduit n'importe quelle déclaration C en une phrase en anglais claire : utile pour vérifier sa lecture avant de compiler, surtout sur des types combinant plusieurs `*` et `[]`.

## `const` avec les pointeurs

Deux usages de `const` bien distincts, souvent confondus :

```c
const int *p1;       // p1 peut changer d'adresse, mais pas modifier la valeur pointée
int *const p2 = &x;  // p2 ne peut plus changer d'adresse, mais peut modifier la valeur pointée
```

| Écriture | Ce qui est protégé |
|---|---|
| `const int *p` | La **valeur pointée** ne peut pas être modifiée via `p` |
| `int *const p` | Le **pointeur lui-même** ne peut plus être réassigné après initialisation |
| `const int *const p` | Ni l'un, ni l'autre |

## Résumé

| Notation | Signification |
|---|---|
| `int *ptr` | Déclare un pointeur vers un `int` |
| `&variable` | Adresse mémoire de `variable` |
| `*ptr` | Valeur à l'adresse contenue dans `ptr` |
| `ptr + 1` | Adresse suivante, décalée de `sizeof(type)` octets |
| `NULL` | Pointeur qui ne pointe vers rien de valide |

Voir aussi [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire) (`malloc`/`free`), qui s'appuie directement sur ces notions.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un pointeur stocke l'adresse mémoire d'une variable. `&` récupère une adresse, `*` déréférence (accède à la valeur pointée). Indexer un tableau (`tab[i]`) est strictement équivalent à `*(tab + i)`. La règle droite-gauche permet de lire n'importe quelle déclaration combinant `*` et `[]` sans s'y perdre. |
| **Outils utilisables** | Pointeurs de pointeur, pointeurs de fonction, `const` pour protéger la valeur pointée et/ou le pointeur lui-même, [cdecl.org](https://cdecl.org) pour vérifier la lecture d'une déclaration complexe. |
| **Pièges à éviter** | Déréférencer un pointeur non initialisé ou `NULL` ; confondre comparaison d'adresses (`p1 == p2`) et de valeurs pointées (`*p1 == *p2`) ; utiliser un pointeur après son `free()` (dangling pointer) ; confondre un tableau de pointeurs (`T *tab[N]`) avec un pointeur vers un tableau (`T (*tab)[N]`) ; réaffecter le champ pointeur d'une struct reçue par valeur (invisible pour l'appelant, contrairement à modifier ce que ce pointeur désigne). |
| **Bonnes pratiques** | Initialiser tout pointeur inutilisé à `NULL` et le tester avant déréférencement ; passer l'adresse d'une variable à une fonction uniquement quand elle doit réellement la modifier. |
