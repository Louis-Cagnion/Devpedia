---
order: 9
---

# Les Makefiles

Un **Makefile** automatise la compilation d'un projet C à plusieurs fichiers : plutôt que de retaper manuellement chaque commande [`gcc`](https://gcc.gnu.org) (voir [Le processus de compilation](/?c=langages-de-programmation&s=c&p=compilation)), on décrit une fois les règles de construction, et l'outil `make` les exécute, en ne recompilant que ce qui a réellement changé depuis la dernière fois.

## Anatomie d'une règle

```makefile
cible: dependances
	commande
```

```makefile
programme: main.o calculs.o
	gcc main.o calculs.o -o programme
```

"Pour construire `programme`, j'ai besoin de `main.o` et `calculs.o` ; si l'un des deux est plus récent que `programme` (ou si `programme` n'existe pas encore), exécute la commande." La ligne de commande **doit** être indentée avec une tabulation, jamais des espaces : une des erreurs les plus fréquentes avec les Makefiles.

## Enchaîner les règles

```makefile
programme: main.o calculs.o
	gcc main.o calculs.o -o programme

main.o: main.c calculs.h
	gcc -c main.c -o main.o

calculs.o: calculs.c calculs.h
	gcc -c calculs.c -o calculs.o
```

En tapant simplement `make`, l'outil construit la **première règle du fichier** (`programme`), et remonte récursivement ses dépendances : pour obtenir `main.o`, il regarde la règle `main.o: ...`, etc. Si `calculs.c` n'a pas changé depuis la dernière compilation, `make` ne recompile pas `calculs.o` : seule la partie modifiée du projet est reconstruite.

## Variables

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -g

programme: main.o calculs.o
	$(CC) main.o calculs.o -o programme

main.o: main.c calculs.h
	$(CC) $(CFLAGS) -c main.c -o main.o
```

`$(CC)` et `$(CFLAGS)` sont des variables Makefile : changer le compilateur ou les options d'avertissement ne demande alors qu'une seule modification, en haut du fichier.

| Option `gcc` courante | Rôle |
|---|---|
| `-Wall -Wextra` | Active la majorité des avertissements utiles du compilateur |
| `-g` | Ajoute les informations de débogage (nécessaires pour `gdb`/Valgrind) |
| `-o nom` | Nomme le fichier de sortie |

## Cibles factices (`.PHONY`)

Une cible comme `clean` ne correspond à aucun vrai fichier à produire : elle sert juste à exécuter une commande utilitaire (ici, supprimer les fichiers compilés) :

```makefile
.PHONY: clean

clean:
	rm -f *.o programme
```

`.PHONY` indique à `make` que `clean` n'est pas un nom de fichier : sans cette ligne, si un fichier nommé `clean` existait par coïncidence dans le dossier, `make clean` pourrait le considérer "à jour" et ne rien exécuter.

> **Note :** appeler une cible en argument (`make clean`, `make programme`) construit **cette** cible précise plutôt que la première du fichier.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un Makefile décrit des règles (`cible: dépendances` + commande) que `make` exécute, en ne reconstruisant que ce qui a réellement changé. |
| **Outils utilisables** | Variables (`CC`, `CFLAGS`), cibles factices (`.PHONY`). |
| **Pièges à éviter** | Indenter une commande avec des espaces plutôt qu'une tabulation : erreur très fréquente qui casse la règle. |
| **Bonnes pratiques** | Déclarer `.PHONY` pour toute cible qui ne produit pas un vrai fichier (`clean`, `test`...), pour éviter un conflit avec un fichier de même nom. |
