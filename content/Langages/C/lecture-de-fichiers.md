---
order: 22
---

# Lire un fichier ligne par ligne : `fopen`, `fgets`, `getline`

Le chapitre sur [les appels système](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) présente `open()`/`read()`/`close()` : des appels bruts, sans mise en forme, qui demandent un aller-retour vers le noyau à chaque lecture. La bibliothèque standard C (*libc*) propose une couche au-dessus, les **flux** (*streams*, type `FILE *`), qui ajoute un tampon interne (*buffer*) : elle lit un gros bloc d'un coup, puis distribue les données au fur et à mesure, sans refaire un appel système à chaque petite lecture.

| | Appels système bruts | Flux bufferisés (libc) |
|---|---|---|
| Fonctions | `open()`, `read()`, `close()` | `fopen()`, `fgets()`/`getline()`, `fclose()` |
| Type manipulé | Un entier (descripteur de fichier) | Un `FILE *` (flux) |
| Découpage en lignes | À la charge du programme | Fait par `fgets()`/`getline()` |
| Page de manuel | Section 2 (`man 2 open`) | Section 3 (`man 3 fopen`) |

## Ouvrir un flux : `fopen()`

```c
FILE *fp = fopen("fichier.txt", "r");
if (!fp) {
    perror("fopen");
    return 1;
}
```

`fopen()` renvoie `NULL` en cas d'échec (fichier absent, droits insuffisants...) : comme tout appel pouvant échouer, la valeur de retour doit être vérifiée avant toute utilisation du flux.

## `fgets()` : un buffer de taille fixe fourni par l'appelant

```c
char buf[256];

while (fgets(buf, sizeof(buf), fp) != NULL) {
    printf("ligne lue : %s", buf);
}
fclose(fp);
```

Signature : `char *fgets(char *s, int size, FILE *stream)`.

| Paramètre | Rôle |
|---|---|
| `s` | Le buffer de destination, déjà alloué par l'appelant |
| `size` | La taille de ce buffer (toujours `sizeof(buf)`, jamais une constante recopiée à la main) |
| `stream` | Le flux ouvert par `fopen()` |

`fgets()` renvoie `s` si une ligne a été lue, `NULL` à la fin du fichier ou en cas d'erreur.

> **Piège :** si une ligne du fichier dépasse `size - 1` caractères, `fgets()` s'arrête à la limite du buffer **sans lire le reste de la ligne** : l'appel suivant reprend où il s'est arrêté. Une "ligne logique" trop longue peut donc se retrouver coupée en plusieurs appels si le buffer est trop petit.

## `getline()` : un buffer que la fonction alloue elle-même

```c
char *line = NULL;
size_t capacity = 0;
ssize_t len;

while ((len = getline(&line, &capacity, fp)) != -1) {
    printf("ligne lue (%zd caracteres) : %s", len, line);
}
free(line);
fclose(fp);
```

Signature (POSIX) : `ssize_t getline(char **lineptr, size_t *n, FILE *stream)`.

| Paramètre | Rôle |
|---|---|
| `lineptr` | Adresse d'un `char *`, initialisé à `NULL` avant le premier appel : `getline()` l'alloue/réalloue elle-même |
| `n` | Adresse d'un `size_t`, initialisé à `0` : `getline()` y suit la capacité actuellement allouée |
| `stream` | Le flux ouvert par `fopen()` |

`getline()` renvoie le nombre de caractères lus (hors `'\0'` final) si une ligne a été lue, `-1` à la fin du fichier ou en cas d'erreur. Contrairement à `fgets()`, elle **réalloue** tant que la ligne n'est pas entièrement lue : aucune troncature possible, quelle que soit la longueur de la ligne.

> **Note :** dans les deux cas, le caractère `'\n'` de fin de ligne est **conservé** dans le buffer (sauf éventuellement sur la toute dernière ligne du fichier, si elle n'a pas de retour à la ligne final). À prendre en compte avant de comparer le contenu lu à une valeur attendue.

> **Bonne pratique :** le buffer alloué par `getline()` doit être libéré par l'appelant avec `free()`, même s'il a été réalloué plusieurs fois en interne au fil des appels.

## Refermer le flux : `fclose()`

```c
fclose(fp);
```

Chaque `fopen()` réussi doit correspondre à exactement un `fclose()`, sur le même principe qu'un `malloc()`/`free()` (voir [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire)) ou qu'un `open()`/`close()`.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `fopen`/`fgets`/`getline`/`fclose` sont des fonctions de la libc, qui ajoutent une couche de tampon (`FILE *`) au-dessus des appels système bruts (`open`/`read`/`close`). `fgets` utilise un buffer de taille fixe fourni par l'appelant (risque de troncature) ; `getline` alloue et réalloue elle-même son buffer (jamais de troncature). |
| **Outils utilisables** | `fopen`, `fgets`, `getline`, `fclose`, `perror` pour diagnostiquer un échec d'ouverture. |
| **Pièges à éviter** | Ne pas vérifier le retour de `fopen()` (`NULL`) avant utilisation. Une ligne plus longue que le buffer de `fgets()` est coupée en plusieurs appels. Oublier de `free()` le buffer alloué par `getline()`. Oublier que `'\n'` reste dans la ligne lue. |
| **Bonnes pratiques** | Toujours vérifier `fopen()` avant utilisation. Préférer `getline()` à `fgets()` dès que la longueur des lignes n'est pas garantie bornée. Un `fclose()` pour chaque `fopen()` réussi. |
