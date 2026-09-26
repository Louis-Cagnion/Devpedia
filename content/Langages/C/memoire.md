---
order: 9
---

# La gestion de la mémoire

Contrairement à des langages comme [PHP](/?c=langages-de-programmation&s=php&p=php) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), qui gèrent automatiquement la mémoire via un ramasse-miettes (*garbage collector*), le C laisse au développeur la responsabilité complète d'allouer et de libérer la mémoire dont son programme a besoin. C'est ce qui permet des performances élevées et un contrôle fin des ressources, au prix d'une vigilance de tous les instants.

## Stack (pile) et Heap (tas)

Un programme C dispose de deux zones mémoire principales pour ses données :

| | Stack | Heap |
|---|---|---|
| Gestion | Automatique (variables locales) | Manuelle (`malloc`/`free`) |
| Durée de vie | Le temps du bloc/de la fonction courante | Jusqu'au `free()` explicite |
| Taille | Limitée, fixée au démarrage du programme | Limitée par la RAM/swap disponible |
| Vitesse | Très rapide (simple déplacement d'un pointeur) | Plus lente (recherche d'un emplacement libre) |

```c
void exemple(void)
{
    // sur la stack, libéré automatiquement à la fin de la fonction
    int x = 5;
    int *p = malloc(sizeof(int));  // sur le heap, reste alloué jusqu'à free(p)
    *p = 5;
    free(p);
}
```

## Les tableaux à taille variable (VLA)

Un VLA (*Variable-Length Array*, tableau à taille variable, [C99](https://en.wikipedia.org/wiki/C99)) est un tableau déclaré comme une variable locale classique (`int tab[n];`), mais dont la taille `n` est une expression connue seulement à l'exécution, pas une constante fixée à la compilation. Contrairement à `malloc()` vu plus bas, il reste sur la stack : pas de `free()` à faire, sa mémoire est libérée automatiquement à la fin du bloc qui le contient.

```c
void exemple(int n)
{
    int tab[n]; // taille décidée au moment de l'appel, pas à la compilation

    for (int i = 0; i < n; i++)
        tab[i] = i;
} // tab disparaît ici, comme toute variable locale -- aucun free() nécessaire
```

### Piège n°1 : l'ordre des paramètres

Quand un VLA est un paramètre de fonction, sa taille (`n`) doit être déclarée **avant** lui dans la liste des paramètres :

```c
void construire(int n, int tab[n]); // correct : n existe déjà quand tab est déclaré
void construire(int tab[n], int n); // erreur de compilation : n inconnu à cet endroit
```

Le compilateur lit les paramètres de gauche à droite : au moment où il doit calculer la taille de `tab`, `n` doit déjà avoir été vu.

### Piège n°2 : `T (*)[n]` n'est pas `T **`

Un VLA à deux dimensions passé en paramètre, comme `uint16_t mask[n][n]`, ne se convertit **pas** en un simple pointeur vers un pointeur (`uint16_t **`). Il se convertit en pointeur vers un tableau de `n` éléments : `uint16_t (*)[n]`.

| | `T (*)[n]` (VLA en paramètre) | `T **` (tableau de pointeurs) |
|---|---|---|
| Mémoire | Un seul bloc contigu de `n * n` éléments | `n` blocs séparés, chacun alloué indépendamment |
| Déclaration | `void f(int n, T tab[n][n])` | `void f(T **tab)` |
| Accès `tab[i][j]` | Calcul d'offset dans le bloc unique | Déréférencement de `tab[i]`, puis accès dans son propre bloc |

Confondre les deux types donne une erreur de compilation explicite (`conflicting types`, ou `makes pointer from integer without a cast`) : le compilateur refuse de passer un `T **` là où un `T (*)[n]` est attendu, et inversement.

### Autres limites à connaître

| Limite | Détail |
|---|---|
| Pas de vérification d'échec | Contrairement à `malloc()` (voir plus bas), un VLA trop grand ne renvoie pas `NULL` : il provoque un débordement de pile, comportement indéfini, sans avertissement |
| Taille figée après déclaration | Contrairement à `realloc()` (voir plus bas), un VLA ne peut pas être agrandi une fois déclaré |
| Disponibilité | Rendue optionnelle par [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)) : un compilateur strictement conforme peut refuser de les supporter (macro `__STDC_NO_VLA__` à vérifier) |

Voir aussi [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs), dont la compréhension est un prérequis à celui-ci.

## Allouer de la mémoire dynamiquement

`malloc()` réserve un bloc de mémoire brut sur le heap, dont la taille est exprimée en octets :

```c
int *tab = malloc(5 * sizeof(int)); // réserve la place pour 5 entiers

if (tab == NULL) {
    // malloc a échoué (mémoire insuffisante) -> tab vaut NULL, à toujours vérifier
    return;
}

for (int i = 0; i < 5; i++) {
    tab[i] = i * 10;
}
```

> **Note :** `malloc()` ne **réinitialise pas** la mémoire allouée : elle peut contenir n'importe quelle valeur résiduelle ("garbage"). `calloc(nombre, taille)` fait la même chose que `malloc(nombre * taille)`, mais met en plus tous les octets à zéro.

```c
int *tab = calloc(5, sizeof(int)); // 5 entiers, tous initialisés à 0
```

## Redimensionner un bloc : `realloc()`

```c
int *tab = malloc(3 * sizeof(int));
// ... on a besoin de plus de place ...
int *nouveauTab = realloc(tab, 6 * sizeof(int));

if (nouveauTab == NULL) {
    // realloc a échoué : l'ancien bloc "tab" est toujours valide, ne pas le perdre
    free(tab);
    return;
}
tab = nouveauTab; // le bloc a pu être déplacé ailleurs en mémoire
```

`realloc()` conserve le contenu existant (tronqué si la nouvelle taille est plus petite), mais peut déplacer le bloc en mémoire si besoin : c'est pour ça qu'on ne réassigne jamais `tab` directement avant d'avoir vérifié que `realloc()` n'a pas renvoyé `NULL`.

## Libérer la mémoire : `free()`

Chaque `malloc()`/`calloc()`/`realloc()` réussi doit correspondre à exactement un `free()`, quand le bloc n'est plus utile :

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p contient toujours l'ancienne adresse ("dangling pointer") : il ne faut plus l'utiliser
p = NULL; // bonne pratique : empêche une utilisation accidentelle après libération
```

## Beaucoup de petits objets : l'allocation en arène

Appeler `malloc()` pour chacun de millions de petits objets coûte cher : chaque appel prend du temps, et les objets finissent éparpillés en mémoire. Une **arène** range tous ces objets **à la suite dans un seul grand tableau**, agrandi par doublement avec `realloc()`, et chaque objet est désigné par sa **position** dans ce tableau.

```c
#include <stdlib.h>
#include <string.h>

typedef struct {
    int    *donnees;                         // un seul grand tableau pour tout
    size_t  taille;                          // cases utilisées
    size_t  capacite;                        // cases réservées
} t_arene;

// Range n entiers à la suite dans l'arène ; renvoie leur position, ou (size_t)-1 si échec
size_t arene_ajouter(t_arene *a, const int *valeurs, size_t n)
{
    size_t capacite = a->capacite ? a->capacite : 1024;
    while (a->taille + n > capacite)
        capacite *= 2;                       // doubler : peu de realloc au total
    if (capacite != a->capacite) {
        int *nouveau = realloc(a->donnees, capacite * sizeof(int));
        if (!nouveau)
            return (size_t)-1;               // échec : l'arène reste intacte
        a->donnees = nouveau;
        a->capacite = capacite;
    }
    memcpy(a->donnees + a->taille, valeurs, n * sizeof(int));
    a->taille += n;
    return a->taille - n;                    // une position, pas un pointeur
}
```

| | Un `malloc()` par objet | Arène |
|---|---|---|
| Nombre d'allocations | Une par objet | Une poignée (le tableau double de taille) |
| Emplacement en mémoire | Éparpillé | Contigu : le processeur lit les objets voisins d'un coup |
| Libération | Un `free()` par objet | Un seul `free()` pour tout |
| Supprimer un objet | `free()` | Laisse un trou : il faut **compacter** soi-même (tout décaler) |

> **Piège :** on garde une **position** et non un pointeur, parce que `realloc()` peut déplacer tout le tableau ailleurs en mémoire : un pointeur vers l'ancien emplacement deviendrait invalide (voir [Redimensionner un bloc](#redimensionner-un-bloc-realloc)), alors qu'une position reste juste.

## Les quatre bugs mémoire classiques

| Bug | Cause | Conséquence |
|---|---|---|
| **Fuite mémoire** (*memory leak*) | Un bloc `malloc`é n'est jamais `free()` | La mémoire utilisée par le programme augmente sans jamais redescendre |
| **Use-after-free** | Le programme déréférence un pointeur après son `free()` | Comportement indéfini : donnée corrompue, crash, ou pire, silencieusement "ça marche" |
| **Double free** | `free()` appelé deux fois sur le même pointeur | Corruption du gestionnaire de mémoire, crash souvent différé et difficile à tracer |
| **Débordement de tampon** (*buffer overflow*) | Écriture au-delà de la taille réellement allouée d'un buffer | Corruption de mémoire adjacente, et une porte ouverte à l'exécution de code arbitraire (voir plus bas) |

```c
int *p = malloc(sizeof(int));
free(p);
free(p); // double free : comportement indéfini
```

> **Note :** ces bugs ne provoquent pas toujours un crash immédiat et visible : c'est ce qui les rend difficiles à détecter. Un outil comme [**Valgrind**](https://valgrind.org) (`valgrind ./mon_programme`) exécute le programme et rapporte précisément les fuites mémoire et les accès invalides, avec la ligne de code responsable.

## Le débordement de tampon (*buffer overflow*), un bug avec des conséquences de sécurité

Contrairement aux trois bugs précédents (qui corrompent la mémoire du programme lui-même, sans intention extérieure), un débordement de tampon est souvent **le résultat d'une entrée contrôlée par un attaquant** : ce qui en fait historiquement l'une des failles de sécurité les plus exploitées en C/[C++](/?c=langages-de-programmation&s=cpp&p=cpp).

```c
char buffer[16];
strcpy(buffer, entree_utilisateur); // AUCUNE vérification de la taille de entree_utilisateur
```

Si `entree_utilisateur` dépasse 16 octets, `strcpy()` continue d'écrire au-delà des limites de `buffer`, dans la mémoire qui suit immédiatement sur la pile, qui peut contenir d'autres variables locales, ou l'**adresse de retour** de la fonction courante (l'endroit où le programme doit reprendre son exécution après le `return`). Un attaquant qui maîtrise précisément le contenu écrit peut, dans le pire cas, remplacer cette adresse de retour par l'adresse de son choix, détournant le flux d'exécution du programme vers du code qu'il contrôle (*stack smashing*).

> **Note :** c'est le même principe qu'une [injection SQL](/?c=langages-de-programmation&s=php&p=securite) ou une [injection de commande Bash](/?c=shells&s=bash&p=variables) : une entrée non contrôlée qui modifie la **structure** de ce qui va s'exécuter, au lieu de rester une donnée passive.

### S'en protéger

```c
strcpy(buffer, entree);                       // dangereux : aucune limite
strncpy(buffer, entree, sizeof(buffer) - 1);  // borné à la taille réelle du buffer
// strncpy ne garantit pas la terminaison si la source est trop longue
buffer[sizeof(buffer) - 1] = '\0';

// lecture bornée dès la saisie, plutôt que de corriger après coup
fgets(buffer, sizeof(buffer), stdin);
```

| Fonction risquée | Alternative bornée |
|---|---|
| `strcpy()` | `strncpy()` (attention à la terminaison, cf. ci-dessus) |
| `strcat()` | `strncat()` |
| `sprintf()` | `snprintf()` (tronque plutôt que déborder) |
| `gets()` | `fgets()` (`gets()` est d'ailleurs retiré du standard C depuis [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)), précisément pour cette raison) |

> **Note :** borner la taille ne suffit qu'à moitié : il faut aussi vérifier que la donnée tronquée reste cohérente pour la suite du programme (un nom de fichier coupé à mi-chemin par `strncpy` reste un nom de fichier syntaxiquement valide, juste incorrect). Le bon réflexe reste de toujours connaître, à chaque écriture, la taille réelle du buffer de destination ; jamais de supposer qu'une entrée respectera une taille attendue sans le vérifier.

### La famille BSD `strlcpy`/`strlcat`

D'origine BSD (pas standard C, mais disponible sur macOS/\*BSD, et facilement réimplémentable soi-même, comme le fait la bibliothèque `libft` avec `ft_strlcpy`/`ft_strlcat`), ces fonctions corrigent le point faible de `strncpy`/`strcat` : détecter une troncature.

```c
// termine TOUJOURS par '\0', contrairement à strncpy
size_t taille_reelle = strlcpy(buffer, entree, sizeof(buffer));

if (taille_reelle >= sizeof(buffer))
{
    // entree a été tronquée : taille_reelle est la taille qu'aurait fait la copie complète
}
```

`strlcpy()`/`strlcat()` renvoient toujours la taille qu'aurait la chaîne source (ou concaténée) si le buffer avait été assez grand, jamais le nombre d'octets réellement écrits : comparer cette valeur à `sizeof(buffer)` détecte une troncature, ce que `strncpy()`/`strcat()` ne permettent pas directement.

## `sizeof`

`sizeof` n'est pas une fonction mais un opérateur évalué à la compilation : il renvoie la taille en octets d'un type ou d'une variable, indispensable pour calculer correctement la taille à allouer :

```c
sizeof(int);       // généralement 4
sizeof(char);      // toujours 1, par définition du standard C
sizeof(int) * 10;  // taille nécessaire pour 10 entiers -> à passer à malloc()
```

Voir aussi [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs), dont la compréhension est un prérequis à celui-ci.

## Copier et remplir des octets : `memcpy()` et `memset()`

Ces deux fonctions de `<string.h>` travaillent sur des **octets bruts**, sans connaître le type des données :

```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

int main(void)
{
    int tab[5];
    memset(tab, 0, sizeof tab);              // met les 20 octets à 0 : 5 entiers à 0
    int copie[5];
    memcpy(copie, tab, sizeof tab);          // copie les 20 octets de tab dans copie
    memset(tab, 1, sizeof tab);              // piège : chaque OCTET vaut 1
    printf("%d\n", tab[0]);                  // 16843009 (0x01010101), pas 1

    float f = 1.0f;
    uint32_t bits;
    memcpy(&bits, &f, sizeof bits);          // lit les 4 octets du float tels quels
    printf("%08X\n", bits);                  // 3F800000 : l'encodage de 1.0 en mémoire
    return 0;
}
```

| Fonction | Rôle | Piège |
|---|---|---|
| `memset(p, v, n)` | Met chacun des n octets à la valeur `v` | `v` remplit des **octets**, pas des entiers : seuls 0 (et -1) donnent la même valeur dans un `int` |
| `memcpy(dst, src, n)` | Copie n octets de `src` vers `dst` | Zones qui se chevauchent : comportement indéfini, utiliser `memmove()` |

Le dernier usage, lire les bits d'un `float` comme un entier (*type punning*), a une version tentante mais **interdite** : `*(uint32_t *)&f`. Accéder à un objet par un pointeur d'un autre type viole la règle d'**aliasing strict** du C (comportement indéfini, que l'optimiseur peut exploiter). `memcpy()` est la façon sûre, et le compilateur la remplace par un simple déplacement de 4 octets.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le C laisse au développeur la responsabilité complète de la mémoire dynamique (heap) : `malloc`/`calloc`/`realloc` pour allouer, `free` pour libérer ; la stack (variables locales, VLA compris) est gérée automatiquement. |
| **Outils utilisables** | `malloc`/`calloc`/`realloc`/`free`, `sizeof`, VLA (`int tab[n]`) pour un tableau de taille dynamique sans `free()`, Valgrind pour détecter fuites et accès invalides ; `memcpy`/`memset` pour copier ou remplir des octets ; une arène pour de très nombreux petits objets. |
| **Pièges à éviter** | Fuite mémoire (jamais de `free`), use-after-free, double free, débordement de tampon, débordement de pile sur un VLA trop grand (aucune détection possible, contrairement à `malloc`), confusion entre `T (*)[n]` (VLA en paramètre) et `T **`. |
| **Bonnes pratiques** | Toujours vérifier qu'un `malloc`/`realloc` n'a pas renvoyé `NULL` ; mettre un pointeur à `NULL` juste après son `free()` ; préférer `fgets`/`strncpy`/`snprintf` aux fonctions non bornées (`gets`/`strcpy`/`sprintf`) ; `strlcpy`/`strlcat` pour détecter une troncature via leur valeur de retour. |
