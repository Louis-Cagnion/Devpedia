---
order: 2
---

# Sockets et E/S non bloquante

Une fois [l'adressage réseau](/?c=reseaux&p=fondamentaux-reseau) compris, il reste à savoir comment un **programme** échange concrètement des données avec un autre, potentiellement sur une machine distante. C'est le rôle d'une **socket** : un point de terminaison de communication réseau, manipulé par le programme comme un [descripteur de fichier](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) classique (on peut y lire et écrire), mais dont l'autre bout est un réseau plutôt qu'un fichier sur disque.

## Le cycle de vie d'une socket serveur

Créer un serveur réseau suit toujours la même séquence d'appels système :

| Étape | Fonction | Rôle |
|---|---|---|
| 1. Création | `socket()` | Crée la socket, renvoie un descripteur de fichier |
| 2. Association | `bind()` | Associe la socket à une adresse IP et un port précis de la machine |
| 3. Écoute | `listen()` | Passe la socket en mode "j'accepte des connexions entrantes" |
| 4. Acceptation | `accept()` | Bloque jusqu'à ce qu'un client se connecte, renvoie une **nouvelle** socket dédiée à ce client |
| 5. Échange | `read()`/`write()` | Lit ou écrit des données avec ce client précis |
| 6. Fermeture | `close()` | Libère la socket |

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

int main(void)
{
    int serveur = socket(AF_INET, SOCK_STREAM, 0); // AF_INET = IPv4, SOCK_STREAM = TCP

    struct sockaddr_in adresse;
    adresse.sin_family = AF_INET;
    adresse.sin_addr.s_addr = INADDR_ANY;   // accepte les connexions sur toutes les interfaces
    adresse.sin_port = htons(8080);         // port 8080, converti dans l'ordre attendu par le réseau

    bind(serveur, (struct sockaddr *)&adresse, sizeof(adresse));
    listen(serveur, 10); // 10 = nombre de connexions en attente autorisées avant refus

    int client = accept(serveur, NULL, NULL); // bloque ici jusqu'à une connexion

    char tampon[1024];
    read(client, tampon, sizeof(tampon));
    write(client, "OK", 2);

    close(client);
    close(serveur);
    return 0;
}
```

> **Note :** `htons()` (*host to network short*) convertit le numéro de port dans l'**ordre des octets réseau**, qui peut différer de celui utilisé en interne par le processeur de la machine. Un détail à ne jamais oublier lors de la manipulation d'une adresse ou d'un port.

Côté client, la séquence est plus courte : `socket()` puis `connect()` (l'équivalent de `bind()` + `listen()` + `accept()`, mais pour rejoindre un serveur existant plutôt que d'en attendre un) suffisent avant d'échanger des données.

## Le problème du blocage

Dans l'exemple ci-dessus, `accept()` et `read()` sont **bloquants** : le programme s'arrête et attend, sans rien faire d'autre, jusqu'à ce qu'un événement survienne. Un serveur qui doit gérer **plusieurs clients à la fois** ne peut pas se permettre de rester bloqué sur un seul d'entre eux pendant que les autres attendent.

```text
Client A connecte -> accept() bloque sur A
Client B tente de se connecter... mais le serveur est toujours bloqué sur A !
```

## La multiplexion d'E/S : surveiller plusieurs sockets à la fois

Plutôt que de bloquer sur une seule socket, un serveur peut demander au système : "préviens-moi dès que l'une de **ces** sockets a quelque chose de prêt (une nouvelle connexion, des données à lire)". C'est le rôle de `select()`, `poll()` et `epoll()` :

| Fonction | Portabilité | Limite / avantage |
|---|---|---|
| `select()` | POSIX (partout) | Limité à un petit nombre de sockets surveillées (souvent 1024), reparcourt toute la liste à chaque appel |
| `poll()` | POSIX (partout) | Plus de limite de nombre, mais reparcourt aussi toute la liste à chaque appel : coûteux avec beaucoup de sockets |
| `epoll()` | Linux uniquement | Le noyau ne renvoie **que** les sockets réellement prêtes : scalable même avec des dizaines de milliers de connexions |

```text
      +-------------------------------------+
      |  select()/poll()/epoll_wait()       |
      |  "quelles sockets sont pretes ?"     |
      +-------------------------------------+
             |            |            |
        socket A     socket B     socket C
        (rien)       (donnees     (rien)
                       pretes)
                |
                v
      le serveur ne traite QUE la socket B, sans bloquer sur A ni C
```

Cette approche est la base d'une **boucle d'événements** (*event loop*) : une seule boucle qui interroge en continu quelles sockets sont prêtes, et ne traite que celles-là, sans jamais rester bloquée sur une socket inactive.

> **Piège :** utiliser des appels bloquants classiques (`accept()`, `read()`) dans un serveur censé gérer plusieurs clients simultanément, sans multiplexion : le serveur devient de fait mono-client, même s'il accepte techniquement plusieurs connexions.
>
> **Bonne pratique :** passer les sockets en mode non bloquant (`fcntl(socket, F_SETFL, O_NONBLOCK)`) en complément de `select`/`poll`/`epoll`, pour qu'un appel `read()` sur une socket annoncée comme "prête" mais qui se vide entre-temps ne bloque jamais le programme.

## Reconstituer une requête HTTP reçue en plusieurs morceaux

Un appel `read()` sur une socket ne renvoie pas forcément une requête HTTP complète : le réseau peut la découper en plusieurs paquets, livrés au programme en plusieurs appels `read()` successifs. Le programme doit donc **accumuler** les fragments reçus dans un tampon, et déterminer lui-même quand la requête est complète.

```text
read() #1 : "GET /page HTTP/1.1\r\nHost: exe"
read() #2 : "mple.com\r\n\r\n"
-> accumule les deux dans un tampon, jusqu'a detecter la fin des en-tetes
```

Deux règles déterminent quand une requête est complète :

1. **La fin des en-têtes** est marquée par une ligne vide, la séquence `\r\n\r\n` (retour chariot + saut de ligne, deux fois de suite). Tant que cette séquence n'apparaît pas dans le tampon accumulé, les en-têtes ne sont pas encore entièrement reçus.
2. **Pour une requête avec un corps** (typiquement `POST`), l'en-tête `Content-Length` indique le nombre exact d'octets attendus après `\r\n\r\n` : la requête n'est complète que lorsque ce nombre d'octets a réellement été reçu, pas avant.

```text
tampon = tampon + fragment_recu

si "\r\n\r\n" pas encore dans tampon :
    en-tetes pas encore complets, continuer a lire
sinon si un corps est attendu (Content-Length present) :
    si octets recus apres "\r\n\r\n" < Content-Length :
        corps pas encore complet, continuer a lire
    sinon :
        requete complete
sinon :
    requete complete (pas de corps attendu)
```

> **Piège :** traiter une requête comme terminée dès que `\r\n\r\n` apparaît, sans vérifier `Content-Length` pour une requête avec corps. Un corps de requête coupé en plusieurs paquets réseau serait alors traité comme terminé prématurément, avant que toutes ses données n'aient été reçues.
>
> **Bonne pratique :** ne jamais supposer qu'un seul `read()` suffit à recevoir une requête HTTP complète, même sur une connexion locale rapide : toujours accumuler dans un tampon et vérifier explicitement les deux conditions (fin des en-têtes, puis `Content-Length` si un corps est attendu) avant de considérer la requête comme prête à traiter.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une socket serveur suit la séquence `socket()` → `bind()` → `listen()` → `accept()` ; les appels réseau classiques bloquent, ce qui empêche de gérer plusieurs clients avec une seule boucle simple. |
| **Outils utilisables** | `select()`/`poll()` (portables) ou `epoll()` (Linux, plus scalable) pour surveiller plusieurs sockets sans bloquer ; `O_NONBLOCK` pour sécuriser les lectures. Un tampon accumulateur pour reconstituer une requête HTTP reçue en plusieurs `read()`. |
| **Pièges à éviter** | Bloquer sur une seule socket (`accept()`/`read()`) dans un serveur multi-client sans multiplexion. Considérer une requête HTTP complète dès `\r\n\r\n` sans vérifier `Content-Length` pour un corps. |
| **Bonnes pratiques** | Construire le serveur autour d'une boucle d'événements qui n'agit que sur les sockets réellement prêtes. |
