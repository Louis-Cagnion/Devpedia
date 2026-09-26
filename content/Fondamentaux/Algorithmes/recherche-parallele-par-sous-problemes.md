---
order: 7
---

# Paralléliser une recherche : découper en sous-problèmes indépendants (EPS)

Un [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) essaie les choix possibles un par un, en revenant en arrière à chaque impasse. Un ordinateur moderne a plusieurs **cœurs** (des unités de calcul capables de travailler en même temps, voir [Le parallélisme](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) : peut-on explorer plusieurs pistes à la fois ? L'**EPS** (*Embarrassingly Parallel Search*, « recherche parallèle embarrassante », c'est-à-dire tellement facile à paralléliser que c'en est gênant) est une réponse simple : découper d'abord le problème en nombreux petits problèmes indépendants, puis les distribuer.

## L'arbre de recherche, vu comme une liste de sous-problèmes

Chaque choix du backtracking ouvre une branche. Tout ce qui se trouve sous une branche est un **sous-problème** : le problème de départ, avec quelques variables déjà fixées.

```
                     (problème complet)
              /              |              \
         A = 1            A = 2            A = 3          <- 1er choix : 3 sous-problèmes
        /     \          /     \          /     \
    B = 1   B = 2    B = 1   B = 3    B = 2   B = 3       <- 2e choix : 6 sous-problèmes
```

Deux sous-problèmes de même niveau ne partagent rien : chercher dans `A = 1` ne dit rien sur `A = 2`. On peut donc les confier à des **workers** différents (un worker est un thread ou un processus qui traite une tâche, voir [Threads](/?c=langages&s=c&p=threads)).

## Pourquoi il faut beaucoup plus de sous-problèmes que de workers

| Approche | Ce qui se passe |
|---|---|
| Lancer N threads sur le **même** état de recherche | Ils modifient la même mémoire en même temps : résultats faux (voir [Mémoire partagée](/?c=langages&s=c&p=threads#memoire-partagee-un-avantage-et-un-danger)). |
| **Un** sous-problème par worker | Les sous-problèmes n'ont pas la même difficulté : un worker finit en 1 seconde et attend, pendant qu'un autre peine 9 secondes. |
| **30 à 100** sous-problèmes par worker, dans une file | Un worker qui finit vite reprend aussitôt le suivant : la charge s'équilibre toute seule. |

Exemple chiffré, 4 workers :

| Découpage | Durées des sous-problèmes | Temps total |
|---|---|---|
| 4 sous-problèmes | 1 s, 1 s, 1 s, 9 s | 9 s (trois workers attendent 8 s) |
| 40 sous-problèmes, même travail total (12 s) | environ 0,3 s chacun | environ 3 s (12 s ÷ 4) |

## Les trois étapes de l'EPS

```
 1. Découper                 2. Distribuer                 3. Résoudre
 (un seul worker)            (file partagée)               (chacun de son côté)

 racine                      [sp1][sp2][sp3]...[sp240]     worker 1 : sp1, sp5, sp9...
   -> développer l'arbre  ->        |    |    |       ->   worker 2 : sp2, sp6...
      jusqu'à 240 sous-             v    v    v            worker 3 : sp3, sp7...
      problèmes                  prendre le suivant        (backtracking ordinaire)
```

| Étape | Ce qu'on fait | Synchronisation nécessaire |
|---|---|---|
| 1. Découper | Développer l'arbre depuis la racine jusqu'à la cible (ex. 30 × nombre de workers), en appliquant la [propagation de contraintes](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#reduire-les-domaines-avant-meme-d-essayer-la-propagation-de-contraintes) à chaque sous-problème : ceux qui sont déjà impossibles disparaissent. | Aucune (un seul worker) |
| 2. Distribuer | Ranger les sous-problèmes dans une file ; chaque worker prend le suivant quand il est libre. | Seulement pour « prendre le suivant » (un [mutex](/?c=langages&s=c&p=threads#proteger-une-donnee-partagee-avec-un-mutex)) |
| 3. Résoudre | Chaque worker lance un backtracking séquentiel normal sur son sous-problème. | Aucune pendant la recherche |

Si l'on cherche **une seule** solution, il faut ajouter un drapeau partagé « solution trouvée » : le premier worker qui réussit le lève, et les autres s'arrêtent dès qu'ils le voient.

## Choisir quel sous-problème découper

Pour atteindre la cible en peu d'étapes, on découpe à chaque fois le sous-problème qui produira **le plus** de nouveaux sous-problèmes : celui dont la prochaine variable (choisie par [MRV](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#choisir-la-bonne-variable-en-premier-l-heuristique-mrv), la plus contrainte) a le plus de valeurs possibles.

| Sous-problème | Valeurs possibles de sa variable MRV | Le découper donne |
|---|---|---|
| sp1 | 2 | +1 sous-problème (1 remplacé par 2) |
| sp2 | 5 | +4 sous-problèmes : **à découper en premier** |

## Copier l'état : la condition du « sans synchronisation »

Chaque sous-problème doit posséder **sa propre copie** de toutes ses données : une *copie profonde*. Une copie qui garderait un pointeur vers les données d'un autre sous-problème (une *copie superficielle*) ferait retomber deux workers sur la même mémoire.

```c
typedef struct {
    int  n;          // nombre de variables
    int *valeurs;    // valeurs[i] = valeur choisie pour la variable i, ou -1
} t_etat;

t_etat *copier_etat(const t_etat *src)
{
    t_etat *copie = malloc(sizeof(t_etat));              // nouvelle structure
    copie->n = src->n;                                   // un entier se copie tel quel
    copie->valeurs = malloc(src->n * sizeof(int));       // NOUVEAU tableau, pas celui de src
    memcpy(copie->valeurs, src->valeurs, src->n * sizeof(int)); // on recopie son contenu
    return copie;                                        // aucun pointeur partagé avec src
}
```

Écrire `copie->valeurs = src->valeurs;` à la place des deux lignes `malloc`/`memcpy` serait une copie superficielle : les deux états modifieraient alors le même tableau.

## Quand l'EPS ne fait rien gagner : un cas mesuré

L'EPS a été essayé sur un solveur de puzzle *Skyscraper* (backtracking avec MRV et propagation, en C, 8 threads), puis retiré :

| Grille | Séquentiel | EPS (240 sous-problèmes) |
|---|---|---|
| 10 × 10 | 1,08 s | 13,06 s (12 fois plus lent) |
| 11 × 11 | 14 à 16 s | 82 s à plus de 90 s |

| Cause | Explication |
|---|---|
| Le découpage coûte cher | Chaque sous-problème créé demande une propagation complète : 240 propagations avant même de commencer à chercher, alors que la recherche séquentielle n'explorait que 7 à 50 nœuds. |
| L'arbre réel est étroit | MRV et la propagation élaguent tellement que presque tout le travail tient dans quelques branches. Avec un sous-problème par thread, le temps revient à celui du séquentiel, sans gain : 110 % d'utilisation processeur sur 8 threads, soit à peine plus d'un cœur occupé. |

La leçon : l'EPS paie quand l'arbre est **large** et que les sous-problèmes coûtent peu à créer. Avant de paralléliser, il faut [mesurer](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) où part vraiment le temps.

Source : *Embarrassingly Parallel Search*, Régin, Rezgui et Malapert, JAIR 2016 ([jair.org/index.php/jair/article/view/11031](https://jair.org/index.php/jair/article/view/11031)).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'EPS découpe l'arbre de recherche en sous-problèmes indépendants (30 à 100 par worker), les range dans une file, et laisse chaque worker faire un backtracking ordinaire sans communiquer. |
| **Outils utilisables** | Propagation de contraintes pendant le découpage, MRV pour choisir le sous-problème à découper, une file protégée par un mutex, un drapeau partagé pour arrêter les autres workers. |
| **Pièges à éviter** | Un seul sous-problème par worker (charge déséquilibrée) ; une copie superficielle de l'état (mémoire partagée) ; paralléliser une recherche dont l'arbre est déjà étroit. |
| **Bonnes pratiques** | Mesurer le séquentiel avant et après ; garder le découpage peu coûteux ; copier l'état en profondeur pour chaque sous-problème. |
