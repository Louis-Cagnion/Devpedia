# C

Un [langage de programmation](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) est un ensemble de règles qui permet d'écrire des instructions qu'un ordinateur peut exécuter. Le C en est un, réputé pour son accès direct aux mécanismes fondamentaux de la machine.

```c
#include <stdio.h>

int main(void) {
    int age = 25;         // une variable, voir le chapitre dédié
    printf("%d\n", age);   // affiche : 25
    return 0;
}
```

| Terme | Ce que ça veut dire |
|---|---|
| Bas niveau | Donne un accès direct à la mémoire et au matériel : peu de mécanismes cachés entre le code écrit et ce que fait réellement le processeur |
| Compilé | Le code source est traduit une fois pour toutes en instructions machine natives (voir [La compilation](/?c=langages-de-programmation&s=c&p=compilation)) avant l'exécution, contrairement à un langage interprété comme [Python](/?c=langages-de-programmation&s=python&p=python) |
| Gestion manuelle de la mémoire | Le programme doit réserver et libérer lui-même la mémoire dont il a besoin (voir [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire)), sans mécanisme automatique |

Cette proximité avec le matériel permet de mieux comprendre ce qui se passe réellement lors de l'exécution d'un programme : comment les données sont stockées en mémoire, comment le processeur exécute les instructions. C'est pourquoi le C reste largement utilisé pour les systèmes d'exploitation, les pilotes matériels, les systèmes embarqués, et sert de base à de nombreux autres langages : voir par exemple [C++](/?c=langages-de-programmation&s=cpp&p=cpp), qui s'appuie directement dessus.
