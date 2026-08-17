---
order: 18
---

# Les signaux UNIX

Un **signal** est une notification asynchrone envoyée à un processus : contrairement à un appel de fonction classique, il peut arriver à **n'importe quel moment** de l'exécution, interrompant le code en cours pour exécuter un traitement dédié avant de reprendre là où le processus en était. Le système d'exploitation utilise ce mécanisme pour prévenir un processus d'un événement (Ctrl-C pressé au clavier, un [processus](/?c=langages-de-programmation&s=c&p=processus) enfant terminé), ou pour permettre à un processus d'en avertir un autre.

## Les signaux courants

| Signal | Déclencheur habituel | Comportement par défaut |
|---|---|---|
| `SIGINT` | Ctrl-C au clavier | Termine le processus |
| `SIGTERM` | Demande d'arrêt propre (`kill <pid>`) | Termine le processus |
| `SIGKILL` | `kill -9 <pid>` | Termine le processus, **ne peut pas être intercepté** |
| `SIGCHLD` | Un processus enfant se termine | Ignoré par défaut |
| `SIGUSR1` / `SIGUSR2` | Envoyé manuellement par un autre processus (`kill -SIGUSR1 <pid>`) | Termine le processus (mais prévu pour être redéfini) |

> **Note :** `SIGKILL` (et `SIGSTOP`) sont les deux seuls signaux qu'un processus ne peut jamais intercepter ni ignorer : ils garantissent qu'un processus reste toujours arrêtable de l'extérieur, même s'il tente de bloquer tous les autres signaux.

## Intercepter un signal avec `signal()`

`signal()` remplace le comportement par défaut d'un signal par une fonction (un **handler**), appelée automatiquement dès que le signal arrive :

```c
#include <signal.h>
#include <stdio.h>
#include <unistd.h>

volatile sig_atomic_t recu = 0;

void handler(int sig)
{
    recu = 1;   // le handler ne fait quasiment rien : voir "handler minimal" plus bas
}

int main(void)
{
    signal(SIGINT, handler);   // Ctrl-C n'arrete plus le programme, appelle handler() a la place

    while (!recu) {
        pause();   // attend un signal sans consommer de CPU
    }

    printf("Signal recu, arret propre.\n");
    return 0;
}
```

Sans `signal(SIGINT, handler)`, un Ctrl-C aurait terminé le programme immédiatement (comportement par défaut de `SIGINT`) ; avec, le programme intercepte le signal et décide lui-même quoi faire.

## Communiquer entre processus par signal (IPC)

`SIGUSR1`/`SIGUSR2` n'ont aucun sens prédéfini : un programme peut les utiliser comme mécanisme de communication entre processus (*IPC*, *Inter-Process Communication*), en établissant sa propre convention. Exemple : transmettre un bit à la fois, `SIGUSR1` pour `0`, `SIGUSR2` pour `1` :

```c
// Cote emetteur (connait le PID du recepteur)
kill(pid_recepteur, bit ? SIGUSR2 : SIGUSR1);

// Cote recepteur : un handler par bit possible
void handler(int sig)
{
    bit_recu = (sig == SIGUSR2) ? 1 : 0;
    // accumuler ce bit dans un octet en construction...
}
```

Chaque caractère transmis nécessite alors 8 signaux (un par bit), le récepteur reconstruisant l'octet au fur et à mesure. C'est plus lent qu'un [descripteur de fichier](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) classique, mais fonctionne sans aucun canal de communication préalable, seul le PID du destinataire est nécessaire.

## Écrire un handler sûr

Un handler s'exécute en interrompant le code normal du programme, potentiellement **en plein milieu** d'une autre fonction (y compris une fonction de la bibliothèque standard) : il ne peut donc pas se comporter comme une fonction ordinaire.

> **Piège :** appeler une fonction non **async-signal-safe** dans un handler, comme `printf()`. Si le signal arrive pendant que le programme est déjà au milieu d'un appel à `printf()` (buffer interne en cours de modification), un second appel à `printf()` depuis le handler corrompt cet état interne partagé, un bug qui n'apparaît que rarement et de façon non reproductible.
>
> **Bonne pratique :** un handler doit rester minimal : modifier une variable de type `sig_atomic_t` (le seul type dont la lecture/écriture est garantie atomique face à une interruption) et rien de plus. Le programme lit cette variable **en dehors** du handler, dans sa boucle principale, pour réagir au signal de façon sûre.

`volatile sig_atomic_t` combine deux garanties nécessaires ici : `sig_atomic_t` assure que la variable se lit et s'écrit en une seule opération indivisible (jamais à moitié modifiée) ; `volatile` empêche le compilateur d'optimiser sa lecture en supposant, à tort, qu'elle ne peut changer qu'à l'intérieur du flux normal du programme.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un signal interrompt un processus à n'importe quel moment pour exécuter un handler, contrairement à un appel de fonction classique. `SIGUSR1`/`SIGUSR2` n'ont pas de sens prédéfini et peuvent servir de canal de communication entre processus. |
| **Outils utilisables** | `signal()` pour intercepter un signal, `kill()` pour en envoyer un, `volatile sig_atomic_t` pour communiquer entre un handler et le reste du programme. |
| **Pièges à éviter** | Appeler une fonction non async-signal-safe (comme `printf()`) dans un handler. |
| **Bonnes pratiques** | Garder un handler minimal (modifier une seule variable `sig_atomic_t`) et traiter le signal dans la boucle principale du programme, jamais dans le handler lui-même. |
