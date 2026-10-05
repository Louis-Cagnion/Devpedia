---
order: 9
---

# Limiter les ressources d'un programme

Un programme qui consomme trop de **mémoire vive** (la **RAM**, où l'ordinateur garde ce dont les programmes en cours ont besoin) ne se contente pas de planter : il peut figer toute la machine. Quand la RAM est pleine, le système déborde sur le **swap**, une zone du disque utilisée comme mémoire de secours, des centaines de fois plus lente : la souris saccade, le terminal ne répond plus. Si même le swap est saturé, le **noyau** (le programme central du système, qui répartit mémoire, processeur et disque entre tous les autres) déclenche son **OOM killer** (*Out Of Memory*, « plus de mémoire ») : il tue un processus pour libérer de la place, mais pas forcément celui qui est en faute, parfois toute la session graphique de l'utilisateur.

Ce chapitre montre comment poser des **garde-fous** : des plafonds posés avant de lancer un programme, pour que ce soit lui qui s'arrête au dépassement, jamais la machine.

## Quand en a-t-on besoin

| Situation | Pourquoi elle consomme beaucoup |
|---|---|
| Programme de test avec une fuite mémoire ou une boucle qui alloue sans fin | Rien ne l'arrête avant la saturation de la machine |
| Test de robustesse (*fuzzing* : envoyer des milliers d'entrées aléatoires ou mal formées) | Une entrée pathologique peut faire exploser la mémoire ou le temps |
| Programme compilé avec un détecteur d'erreurs mémoire ([ASan](https://clang.llvm.org/docs/AddressSanitizer.html), ou [valgrind](https://valgrind.org/docs/manual/manual.html)) | Ces outils surveillent chaque accès et multiplient la mémoire et le temps par plusieurs fois |
| Traitement d'un très gros fichier | La taille de l'entrée n'est pas maîtrisée |

> **Règle :** tout programme dont on ne connaît pas la consommation maximale se lance sous plafond, même « juste pour essayer ».

## Quelles ressources limiter

| Ressource | Ce qui peut déraper | Outil |
|---|---|---|
| Priorité du processeur | Le programme monopolise le CPU, le reste de la machine rame | `nice` |
| Part du processeur | Le programme occupe plusieurs cœurs en permanence | `CPUQuota` (cgroup) |
| Mémoire | La RAM puis le swap se remplissent, la machine fige | `ulimit -v`, `MemoryMax` et `MemorySwapMax` (cgroup) |
| Disque | Les lectures et écritures du programme retardent tous les autres | `ionice` |
| Durée | Le programme boucle indéfiniment | `timeout`, `RuntimeMaxSec` (cgroup) |

## `nice` et `ionice` : passer après les autres

Chaque [processus](/?c=langages&s=bash&p=gestion-des-processus) (un programme en cours d'exécution) a une **priorité** : quand plusieurs veulent le processeur en même temps, le système sert d'abord les plus prioritaires.

```bash
# nice -n 19 : priorité la plus basse (l'échelle va de -20, la plus haute, à 19)
# ionice -c3 : classe « inactif » (idle), n'accède au disque que si personne d'autre n'en a besoin
nice -n 19 ionice -c3 ./mon_programme
```

- `nice` ne **limite rien** : le programme peut toujours consommer tout le processeur disponible, mais il cède la place dès qu'un autre en a besoin.
- Seul `root` (le compte administrateur) peut abaisser la valeur de `nice` sous 0, donc donner plus de priorité.
- `ionice -c3` n'a d'effet que si l'**ordonnanceur de disque** (le composant du noyau qui décide dans quel ordre servir les demandes d'accès au disque) le gère, ce qui est le cas de BFQ ; sinon la consigne est ignorée sans message.

## `ulimit -v` : une limite par processus

`ulimit` fixe des limites au [shell](/?c=langages&s=bash&p=bash) courant (le programme qui lit les commandes tapées dans le terminal) et à tout ce qu'il lance. L'option `-v` plafonne la **mémoire virtuelle** (l'espace d'adresses que le programme peut réserver, même sans l'avoir rempli), en kilooctets.

```bash
# entre parenthèses : copie temporaire du shell, la limite ne touche pas le terminal lui-même
( ulimit -v 200000; ./mon_programme )   # plafond d'environ 200 Mo
```

Au-delà, la réservation de mémoire échoue : en C, [`malloc`](/?c=langages&s=c&p=memoire) renvoie `NULL`, et un programme bien écrit s'arrête avec un message. Les limites de cet outil :

| Limite | Conséquence |
|---|---|
| Plafonne l'espace **réservé**, pas la mémoire réellement utilisée | Un programme peut échouer alors qu'il n'a presque rien écrit |
| S'applique à **chaque** processus séparément | Un programme qui lance dix enfants peut consommer dix fois le plafond |
| Incompatible avec ASan, qui réserve un très grand espace virtuel | Le programme échoue dès son démarrage |

## cgroups et `systemd-run` : un plafond pour tout le groupe

Les **cgroups** (*control groups*) sont le mécanisme du noyau qui limite la consommation d'un **groupe** de processus, enfants compris : c'est la brique qui fait fonctionner les [conteneurs](/?c=infrastructure-devops&s=docker&p=concepts-de-base). On n'a pas à les manipuler à la main : **systemd**, le programme qui démarre et supervise tout ce qui tourne sur une machine Linux moderne, fournit `systemd-run`, qui lance une commande dans un cgroup créé pour elle.

```bash
# --user  : pour le compte courant, sans droits administrateur
# --scope : lance la commande dans un groupe de processus, au premier plan, dans ce terminal
systemd-run --user --scope \
	-p MemoryMax=300M \
	-p MemorySwapMax=0 \
	-p CPUQuota=50% \
	-p RuntimeMaxSec=20 \
	nice -n 19 ionice -c3 \
	./mon_programme > log.txt 2>&1
```

| Option | Rôle |
|---|---|
| `MemoryMax=300M` | Plafond de RAM du groupe entier : au dépassement, le noyau tue le groupe |
| `MemorySwapMax=0` | Interdit tout swap : **indispensable**, sans lui le programme déborde sur le disque au lieu d'être tué, et c'est la machine qui rame |
| `CPUQuota=50%` | Au plus la moitié d'un cœur (`200%` : deux cœurs) |
| `RuntimeMaxSec=20` | Durée maximale en secondes, puis arrêt |

La dernière ligne redirige la sortie du programme vers un fichier (`> log.txt`), erreurs comprises (`2>&1`, voir [les redirections](/?c=langages&s=bash&p=redirections-et-pipes)). Ce n'est pas un détail : si la machine fige ou si la session est fermée de force, le terminal et son contenu disparaissent, alors que le fichier permet de comprendre après coup ce qui s'est passé.

### Vérifier que le plafond s'applique

Un plafond qu'on n'a jamais vu se déclencher n'est qu'une hypothèse. On le teste avec un programme qui consomme volontairement : il réserve 1 Mo à la fois (`malloc`) et l'**écrit** (`memset`), car le système ne donne réellement la RAM qu'à l'écriture, une simple réservation ne la consomme pas.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MO (1024 * 1024)                 // donne le nom MO à la valeur d'un mégaoctet, en octets

int main(void)
{
	for (int total = 1; total <= 1000; total++)
	{
		char *bloc = malloc(MO);         // demande 1 Mo au système
		if (bloc == NULL)                // refus : on s'arrête avec le code 2
			return 2;
		memset(bloc, 1, MO);             // écrit dedans : la RAM est vraiment consommée
		printf("%d Mo\n", total);
		fflush(stdout);                  // affiche tout de suite, même si le programme est tué
	}
	return 0;
}
```

Lancé sous `MemoryMax=300M` et `MemorySwapMax=0`, il est tué avant 300 Mo, et la machine ne ralentit pas.

## Lire le code de sortie

Un programme qui se termine renvoie un **code de sortie** (0 = succès), lisible juste après avec `echo $?`. Un code supérieur à 128 signifie « tué par un **signal** » (un message envoyé par le système à un processus, voir [le chapitre sur les processus](/?c=langages&s=bash&p=gestion-des-processus)) : le numéro du signal vaut le code moins 128.

| Code | Signification | Cas typique |
|---|---|---|
| `0` | Succès | Le programme a fini normalement |
| `2` | Choisi par le programme | L'exemple ci-dessus, `malloc` a été refusé (plafond `ulimit`) |
| `124` | Durée dépassée | `timeout 60 ./mon_programme` |
| `137` | 128 + 9 : signal `SIGKILL` | Plafond de mémoire dépassé, ou OOM killer |
| `143` | 128 + 15 : signal `SIGTERM` | Arrêt demandé, par exemple à la fin de `RuntimeMaxSec` |

## Plusieurs tests en parallèle

Les plafonds se **cumulent** : trois tests lancés en même temps sous 3 Go chacun peuvent consommer 9 Go ensemble.

| Étape | Exemple pour une machine de 16 Go |
|---|---|
| 1. Réserver de quoi faire vivre la session (système, navigateur, éditeur) | 6 Go |
| 2. Plafond global pour tout ce qui est lancé | 10 Go |
| 3. Nombre de tests × pic de mémoire d'un test (le maximum qu'il utilise à un instant) ≤ plafond global | 4 tests × 2,5 Go = 10 Go |

Un test qui **mesure un temps** (comparaison de vitesse, durée d'une opération) tourne toujours seul, machine au repos : des programmes qui se partagent le processeur et le disque faussent le chronomètre. Seuls les tests qui jugent un résultat (comptage, comparaison de sorties) se lancent ensemble.

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une machine qui fige ou qui swappe est un échec : le plafond se pose avant de lancer le programme, pour que ce soit lui qui soit tué. `systemd-run --user --scope -p MemoryMax=… -p MemorySwapMax=0` plafonne le groupe entier ; `nice` et `ionice` ne limitent rien, ils réduisent seulement la priorité. |
| **Outils utilisables** | `systemd-run`, `nice`, `ionice`, `ulimit -v`, `timeout`, redirection `> log.txt 2>&1`. |
| **Pièges à éviter** | `MemoryMax` sans `MemorySwapMax=0` (le swap fait ramer la machine) ; `ulimit -v` seul (limite par processus, et incompatible avec ASan) ; plafonds dont la somme dépasse la RAM disponible ; sortie affichée dans le terminal seulement. |
| **Bonnes pratiques** | Tester le plafond sur un programme qui consomme volontairement ; lire le code de sortie (137 = tué) ; garder plusieurs Go à la session ; chronométrer seul. |
