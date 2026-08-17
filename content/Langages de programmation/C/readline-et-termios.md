---
order: 19
---

# `readline` et `termios` : contrôler la ligne de commande

Un programme qui lit simplement l'entrée standard avec `read()` reçoit le texte tel que le terminal le lui transmet : rien avant que l'utilisateur appuie sur Entrée, aucune gestion des flèches directionnelles, aucun historique des commandes précédentes. Ce comportement par défaut s'appelle le **mode canonique** (*cooked mode*) : c'est le terminal lui-même qui gère l'édition de la ligne (backspace, déplacement du curseur) avant de transmettre le texte final au programme. Deux outils permettent d'aller au-delà de ce mode par défaut : la bibliothèque `readline`, et l'API `termios` pour contrôler le mode du terminal lui-même.

## `readline` : une ligne de saisie éditable, avec historique

La bibliothèque [`readline`](https://tiswww.case.edu/php/chet/readline/rltop.html) fournit une ligne de saisie complète : édition avec les flèches, navigation dans l'historique des commandes précédentes (flèche haut/bas), sans que le programme ait à réimplémenter ce mécanisme lui-même :

```c
#include <readline/readline.h>
#include <readline/history.h>

int main(void)
{
    char *ligne;

    while ((ligne = readline("mon_shell$ ")) != NULL) {
        if (*ligne) {
            add_history(ligne);   // ajoute cette ligne a l'historique (fleche haut la retrouve)
        }

        printf("Vous avez tape : %s\n", ligne);
        free(ligne);   // readline() alloue la ligne : a liberer soi-meme
    }

    return 0;
}
```

`readline()` affiche le prompt donné en argument, gère l'édition de la ligne pendant que l'utilisateur tape, et renvoie la ligne finale une fois Entrée pressé (`NULL` si l'utilisateur ferme l'entrée avec Ctrl-D). `add_history()` rend cette ligne accessible via la flèche du haut lors des prochaines saisies.

> **Note :** `readline()` alloue la chaîne renvoyée avec `malloc()` : c'est à l'appelant de la libérer avec `free()`, exactement comme pour n'importe quel autre pointeur alloué dynamiquement (voir [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire)).

## `termios` : changer le mode du terminal lui-même

`readline` gère l'édition d'une ligne classique, mais certains programmes ont besoin de **chaque touche pressée immédiatement**, sans attendre Entrée, et sans que le terminal affiche automatiquement ce qui est tapé (un jeu en mode texte, une saisie de mot de passe). C'est le rôle de l'API POSIX `termios` : elle contrôle directement le mode du terminal.

```c
#include <termios.h>
#include <unistd.h>

struct termios ancien, nouveau;

tcgetattr(STDIN_FILENO, &ancien);   // sauvegarde la configuration actuelle du terminal
nouveau = ancien;
nouveau.c_lflag &= ~(ICANON | ECHO);   // desactive le mode canonique ET l'affichage automatique
tcsetattr(STDIN_FILENO, TCSANOW, &nouveau);   // applique le nouveau mode

// ... lecture touche par touche, sans attendre Entree, sans echo automatique ...

tcsetattr(STDIN_FILENO, TCSANOW, &ancien);   // restaure le mode d'origine avant de quitter
```

| Drapeau (`c_lflag`) | Rôle | Désactivé pour... |
|---|---|---|
| `ICANON` | Mode canonique : le terminal ne transmet une ligne qu'après Entrée | Recevoir chaque touche immédiatement (mode brut, *raw mode*) |
| `ECHO` | Le terminal affiche automatiquement ce qui est tapé | Contrôler soi-même ce qui s'affiche (mot de passe masqué, interface personnalisée) |

> **Piège :** modifier le terminal avec `tcsetattr()` sans jamais restaurer sa configuration d'origine avant que le programme se termine. Le terminal de l'utilisateur reste alors en mode brut après la fermeture du programme : plus d'écho des touches tapées, plus d'édition de ligne normale dans le shell qui a repris la main, un terminal qui semble "cassé" jusqu'à ce que l'utilisateur le réinitialise manuellement (`reset` ou `stty sane`).
>
> **Bonne pratique :** toujours sauvegarder la configuration d'origine (`tcgetattr()`) avant de la modifier, et la restaurer explicitement (`tcsetattr()`) à chaque sortie possible du programme, y compris sur un signal d'interruption (voir [Les signaux UNIX](/?c=langages-de-programmation&s=c&p=signaux-unix)) ou une erreur, pas seulement sur le chemin de sortie normal.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le mode canonique (par défaut) laisse le terminal gérer l'édition de ligne ; `readline` fournit une ligne de saisie éditable avec historique sans réimplémenter ce mécanisme ; `termios` permet de désactiver ce mode pour recevoir chaque touche immédiatement (mode brut). |
| **Outils utilisables** | `readline()`/`add_history()` pour une ligne de saisie avec historique. `tcgetattr()`/`tcsetattr()` et les drapeaux `ICANON`/`ECHO` pour contrôler le mode du terminal. |
| **Pièges à éviter** | Modifier le terminal avec `tcsetattr()` sans jamais restaurer sa configuration d'origine, laissant le terminal de l'utilisateur en mode brut après la fermeture du programme. |
| **Bonnes pratiques** | Sauvegarder la configuration d'origine avant modification, et la restaurer sur toute sortie possible du programme (normale, erreur, signal). |
