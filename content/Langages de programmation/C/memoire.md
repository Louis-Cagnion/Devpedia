---
order: 5
---

# La gestion de la mémoire

Contrairement à des langages comme PHP ou JavaScript, qui gèrent automatiquement la mémoire via un ramasse-miettes (*garbage collector*), le C laisse au développeur la responsabilité complète d'allouer et de libérer la mémoire dont son programme a besoin. C'est ce qui permet des performances élevées et un contrôle fin des ressources, au prix d'une vigilance de tous les instants.

## Stack (pile) et Heap (tas)

Un programme C dispose de deux zones mémoire principales pour ses données :

| | Stack | Heap |
|---|---|---|
| Gestion | Automatique (variables locales) | Manuelle (`malloc`/`free`) |
| Durée de vie | Le temps du bloc/de la fonction courante | Jusqu'au `free()` explicite |
| Taille | Limitée, fixée au démarrage du programme | Limitée par la RAM/swap disponible |
| Vitesse | Très rapide (simple déplacement d'un pointeur) | Plus lente (recherche d'un emplacement libre) |

```
void exemple(void)
{
    int x = 5;            // sur la stack, libéré automatiquement à la fin de la fonction
    int *p = malloc(sizeof(int)); // sur le heap, reste alloué jusqu'à free(p)
    *p = 5;
    free(p);
}
```

## Allouer de la mémoire dynamiquement

`malloc()` réserve un bloc de mémoire brut sur le heap, dont la taille est exprimée en octets :

```
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

```
int *tab = calloc(5, sizeof(int)); // 5 entiers, tous initialisés à 0
```

## Redimensionner un bloc : `realloc()`

```
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

`realloc()` conserve le contenu existant (tronqué si la nouvelle taille est plus petite), mais peut déplacer le bloc en mémoire si besoin — c'est pour ça qu'on ne réassigne jamais `tab` directement avant d'avoir vérifié que `realloc()` n'a pas renvoyé `NULL`.

## Libérer la mémoire : `free()`

Chaque `malloc()`/`calloc()`/`realloc()` réussi doit correspondre à exactement un `free()`, quand le bloc n'est plus utile :

```
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p contient toujours l'ancienne adresse ("dangling pointer") : il ne faut plus l'utiliser
p = NULL; // bonne pratique : empêche une utilisation accidentelle après libération
```

## Les quatre bugs mémoire classiques

| Bug | Cause | Conséquence |
|---|---|---|
| **Fuite mémoire** (*memory leak*) | Un bloc `malloc`é n'est jamais `free()` | La mémoire utilisée par le programme augmente sans jamais redescendre |
| **Use-after-free** | Le programme déréférence un pointeur après son `free()` | Comportement indéfini : donnée corrompue, crash, ou pire, silencieusement "ça marche" |
| **Double free** | `free()` appelé deux fois sur le même pointeur | Corruption du gestionnaire de mémoire, crash souvent différé et difficile à tracer |
| **Débordement de tampon** (*buffer overflow*) | Écriture au-delà de la taille réellement allouée d'un buffer | Corruption de mémoire adjacente — et une porte ouverte à l'exécution de code arbitraire (voir plus bas) |

```
int *p = malloc(sizeof(int));
free(p);
free(p); // double free : comportement indéfini
```

> **Note :** ces bugs ne provoquent pas toujours un crash immédiat et visible — c'est ce qui les rend difficiles à détecter. Un outil comme **Valgrind** (`valgrind ./mon_programme`) exécute le programme et rapporte précisément les fuites mémoire et les accès invalides, avec la ligne de code responsable.

## Le débordement de tampon (*buffer overflow*), un bug avec des conséquences de sécurité

Contrairement aux trois bugs précédents (qui corrompent la mémoire du programme lui-même, sans intention extérieure), un débordement de tampon est souvent **le résultat d'une entrée contrôlée par un attaquant** — ce qui en fait historiquement l'une des failles de sécurité les plus exploitées en C/C++.

```c
char buffer[16];
strcpy(buffer, entree_utilisateur); // AUCUNE vérification de la taille de entree_utilisateur
```

Si `entree_utilisateur` dépasse 16 octets, `strcpy()` continue d'écrire au-delà des limites de `buffer` — dans la mémoire qui suit immédiatement sur la pile, qui peut contenir d'autres variables locales, ou l'**adresse de retour** de la fonction courante (l'endroit où le programme doit reprendre son exécution après le `return`). Un attaquant qui maîtrise précisément le contenu écrit peut, dans le pire cas, remplacer cette adresse de retour par l'adresse de son choix — détournant le flux d'exécution du programme vers du code qu'il contrôle (*stack smashing*).

> **Note :** c'est le même principe qu'une [injection SQL](/?c=langages-de-programmation&s=php&p=securite) ou une [injection de commande Bash](/?c=shells&s=bash&p=variables) — une entrée non contrôlée qui modifie la **structure** de ce qui va s'exécuter, au lieu de rester une donnée passive.

### S'en protéger

```c
strcpy(buffer, entree);                    // dangereux : aucune limite
strncpy(buffer, entree, sizeof(buffer) - 1); // borné à la taille réelle du buffer
buffer[sizeof(buffer) - 1] = '\0';           // strncpy ne garantit pas la terminaison si la source est trop longue

fgets(buffer, sizeof(buffer), stdin);        // lecture bornée dès la saisie, plutôt que de corriger après coup
```

| Fonction risquée | Alternative bornée |
|---|---|
| `strcpy()` | `strncpy()` (attention à la terminaison, cf. ci-dessus) |
| `strcat()` | `strncat()` |
| `sprintf()` | `snprintf()` (tronque plutôt que déborder) |
| `gets()` | `fgets()` (`gets()` est d'ailleurs retiré du standard C depuis C11, précisément pour cette raison) |

> **Note :** borner la taille ne suffit qu'à moitié — il faut aussi vérifier que la donnée tronquée reste cohérente pour la suite du programme (un nom de fichier coupé à mi-chemin par `strncpy` reste un nom de fichier syntaxiquement valide, juste incorrect). Le bon réflexe reste de toujours connaître, à chaque écriture, la taille réelle du buffer de destination — jamais de supposer qu'une entrée respectera une taille attendue sans le vérifier.

## `sizeof`

`sizeof` n'est pas une fonction mais un opérateur évalué à la compilation : il renvoie la taille en octets d'un type ou d'une variable, indispensable pour calculer correctement la taille à allouer :

```
sizeof(int);      // généralement 4
sizeof(char);      // toujours 1, par définition du standard C
sizeof(int) * 10;  // taille nécessaire pour 10 entiers -> à passer à malloc()
```

Voir aussi [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs), dont la compréhension est un prérequis à celui-ci.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le C laisse au développeur la responsabilité complète de la mémoire dynamique (heap) : `malloc`/`calloc`/`realloc` pour allouer, `free` pour libérer — la stack (variables locales) est gérée automatiquement. |
| **Outils utilisables** | `malloc`/`calloc`/`realloc`/`free`, `sizeof`, Valgrind pour détecter fuites et accès invalides. |
| **Pièges à éviter** | Fuite mémoire (jamais de `free`), use-after-free, double free, débordement de tampon — ce dernier pouvant être exploité comme faille de sécurité. |
| **Bonnes pratiques** | Toujours vérifier qu'un `malloc`/`realloc` n'a pas renvoyé `NULL` ; mettre un pointeur à `NULL` juste après son `free()` ; préférer `fgets`/`strncpy`/`snprintf` aux fonctions non bornées (`gets`/`strcpy`/`sprintf`). |
