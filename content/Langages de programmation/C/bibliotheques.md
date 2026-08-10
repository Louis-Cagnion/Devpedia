---
order: 9
---

# Les bibliothèques

Une **bibliothèque** (*library*) regroupe des fonctions déjà compilées, réutilisables par n'importe quel programme sans en recompiler le code source — c'est ainsi que fonctionne par exemple la bibliothèque standard C (`printf`, `malloc`...). Il existe deux façons de lier une bibliothèque à un programme : statiquement, ou dynamiquement.

## Bibliothèque statique (`.a`)

Le code de la bibliothèque est **copié directement** dans l'exécutable final, au moment de [l'édition de liens](/?c=langages-de-programmation&s=c&p=compilation).

```text
// 1. compiler chaque fichier source en .o
gcc -c calculs.c -o calculs.o

// 2. regrouper le(s) .o dans une archive statique
ar rcs libcalculs.a calculs.o

// 3. lier le programme à cette bibliothèque
gcc main.c -L. -lcalculs -o programme
```

- `ar` (*archiver*) assemble un ou plusieurs fichiers `.o` en une seule archive `.a`.
- `-L.` indique à `gcc` de chercher aussi les bibliothèques dans le répertoire courant.
- `-lcalculs` demande de lier `libcalculs.a` (le préfixe `lib` et le suffixe `.a` sont sous-entendus).

| Avantage | Inconvénient |
|---|---|
| Exécutable autonome, aucune dépendance externe à installer | Taille de l'exécutable plus grande |
| Pas de risque qu'une version différente de la bibliothèque casse le programme plus tard | Une mise à jour de la bibliothèque impose de recompiler le programme |

## Bibliothèque dynamique (`.so` sous Linux, `.dll` sous Windows)

Le code de la bibliothèque reste dans un fichier **séparé**, chargé en mémoire au lancement du programme (ou même pendant son exécution). Plusieurs programmes peuvent alors partager une seule copie de la bibliothèque en mémoire.

```text
gcc -shared -fPIC calculs.c -o libcalculs.so
gcc main.c -L. -lcalculs -o programme

// au lancement, le système doit savoir où trouver libcalculs.so :
LD_LIBRARY_PATH=. ./programme
```

- `-fPIC` (*Position Independent Code*) génère du code capable de fonctionner quelle que soit l'adresse mémoire où il est chargé — nécessaire pour une bibliothèque partagée, chargée à un endroit différent selon le programme.
- Sans `LD_LIBRARY_PATH` (ou une installation dans un répertoire système standard comme `/usr/lib`), le système ne sait pas où chercher `libcalculs.so` au lancement, et le programme refuse de démarrer.

| Avantage | Inconvénient |
|---|---|
| Exécutable plus léger | Dépendance externe : la bibliothèque doit être présente sur la machine qui exécute le programme |
| Une bibliothèque partagée par plusieurs programmes économise de la mémoire | Une mise à jour incompatible de la bibliothèque peut casser un programme sans recompilation |

## Résumé

| | Statique (`.a`) | Dynamique (`.so`) |
|---|---|---|
| Copiée dans l'exécutable ? | Oui | Non — chargée séparément |
| Quand est-elle liée ? | À la compilation | Au lancement du programme (ou pendant son exécution) |
| Mise à jour de la bibliothèque | Nécessite de recompiler le programme | Le programme profite de la mise à jour sans recompilation |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une bibliothèque statique (`.a`) est copiée dans l'exécutable à la compilation ; une bibliothèque dynamique (`.so`/`.dll`) reste séparée, chargée au lancement, et peut être partagée entre programmes. |
| **Outils utilisables** | `ar` (archive statique), `gcc -shared -fPIC` (bibliothèque dynamique), `-L`/`-l` pour lier. |
| **Pièges à éviter** | Oublier `LD_LIBRARY_PATH` (ou une installation système) : le programme refuse de démarrer, ne trouvant pas la bibliothèque dynamique. |
| **Bonnes pratiques** | Choisir statique pour un exécutable autonome sans dépendance à gérer, dynamique pour économiser mémoire/taille quand plusieurs programmes partagent la même bibliothèque. |
