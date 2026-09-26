---
order: 1
---

# Mesurer avant d'optimiser

La règle la plus rentable en performance est aussi la plus ignorée : **ne jamais optimiser sans avoir mesuré**. L'intuition sur "ce qui est lent" est mauvaise de façon fiable, parce qu'on regarde le code qu'on trouve compliqué plutôt que le code qui coûte cher.

## Le cas typique

Sur un programme d'automatisation de navigateur trop lent, mes hypothèses étaient : les chargements de pages, puis la pagination, puis l'extraction des données. Un profilage a donné ceci :

| Étape | Temps | Part |
|---|---|---|
| Attente d'une bannière de cookies | 12,8s | **50 %** |
| Attentes fixes après pagination | ~7,5s | 30 % |
| Chargements de pages + extraction | ~5s | 20 % |

La moitié du temps partait à guetter une bannière **qui n'apparaissait jamais** : le consentement était déjà enregistré dans le profil du navigateur. Aucune de mes trois hypothèses n'était le vrai coupable, et le coupable réel n'était même pas dans ma liste.

## Profiler par phases, pas ligne par ligne

Un profileur classique ([`cProfile`](https://docs.python.org/3/library/profile.html) en [Python](/?c=langages-de-programmation&s=python&p=python), l'onglet Performance d'un navigateur) donne le temps par fonction. C'est utile pour du calcul, beaucoup moins quand le programme passe son temps à **attendre** : tout apparaît sous une poignée de fonctions d'attente, sans dire *pourquoi* on attend.

Dans ce cas, instrumenter soi-même les phases logiques est plus parlant. Le principe : envelopper les fonctions clés pour cumuler leur temps, sans toucher au code mesuré.

```python
import time

timings = []

def chronometrer(module, nom):
    """Remplace module.nom par une version qui enregistre son temps d'execution."""
    original = getattr(module, nom)

    def enveloppe(*args, **kwargs):
        debut = time.perf_counter()
        resultat = original(*args, **kwargs)
        timings.append((nom, time.perf_counter() - debut))
        return resultat

    setattr(module, nom, enveloppe)

chronometrer(mon_module, "attendre_contenu")
chronometrer(mon_module, "fermer_banniere")
```

En agrégeant ensuite par nom, on obtient le nombre d'appels **et** le temps cumulé de chacun. Le nombre d'appels est souvent l'information décisive : une fonction à 0,3s appelée 40 fois coûte plus qu'une fonction à 2s appelée une fois.

> Pensez à afficher aussi le temps **non attribué** (total mesuré moins la somme des phases). S'il est élevé, votre instrumentation rate l'essentiel et vos conclusions porteront à faux.

## Mesurer aussi après

Une optimisation non re-mesurée est une croyance. Deux vérifications valent d'être systématiques :

- **le temps a bien baissé** : parfois un changement "évidemment plus rapide" ne change rien, parce qu'il n'était pas sur le **chemin critique** (la suite d'étapes dépendantes qui détermine à elle seule la durée totale ; accélérer une étape en dehors de cette suite ne raccourcit rien, puisque le programme attend de toute façon la fin des étapes qui, elles, en font partie) ;
- **le résultat est identique** : c'est la vérification qu'on oublie, et c'est la plus importante. Une optimisation qui casse silencieusement la sortie est bien pire qu'un programme lent.

Dans le cas ci-dessus, comparer la sortie octet par octet avant et après chaque étape a permis de détecter une extraction devenue incomplète : un bug qu'aucun chronomètre n'aurait révélé.

## Le piège de la mesure unique

Un seul relevé ne dit rien : le réseau, le cache et la charge de la machine font varier les résultats de dizaines de pourcents. Prenez plusieurs mesures et regardez si l'écart entre deux configurations dépasse leur variation naturelle. Sinon, vous mesurez du bruit.

## Les profileurs natifs sous Linux : `gprof` et `perf`

Un **profileur** indique dans quelles fonctions un programme passe son temps. Deux outils classiques pour un programme compilé (en C par exemple) :

| Outil | Comment l'utiliser | Limite |
|---|---|---|
| `gprof` | Compiler avec `-pg`, lancer le programme (il écrit `gmon.out`), puis `gprof -b -p programme gmon.out` | Fausse avec l'optimisation : les appels que le compilateur déplace ou fusionne disparaissent du profil |
| `perf` | `perf record ./programme` puis `perf report`, sans recompiler (il échantillonne grâce aux compteurs du processeur) | Refusé à un simple utilisateur si `/proc/sys/kernel/perf_event_paranoid` vaut 3 ou 4 (valeur par défaut d'Ubuntu) |

Résultat de `gprof` sur un programme qui appelle 200 fois une fonction `lent` et 200 fois une fonction `rapide`, dix fois plus courte (compilé sans optimisation) :

```
  %   cumulative   self              self     total
 time   seconds   seconds    calls  ms/call  ms/call  name
 88.89      0.56     0.56      200     2.80     2.80  lent
 11.11      0.63     0.07      200     0.35     0.35  rapide
```

Le même programme compilé avec `-O1` donne un profil vide (« no time accumulated ») et un seul appel à `lent` : le compilateur a sorti l'appel de la boucle. Quand `perf` est bloqué, `valgrind --tool=callgrind` fonctionne sans droits particuliers (voir [Valgrind](/?c=langages&s=c&p=memoire)), au prix d'une exécution beaucoup plus lente (il simule chaque instruction).

### Piège : du temps attribué à la mauvaise fonction

Avec l'optimisation (`-O2`), le compilateur peut **intégrer** une fonction dans celle qui l'appelle (*inlining* : il recopie son corps à la place de l'appel) ou en créer une **copie spécialisée** sous un autre nom. `gprof` attribue alors son temps à une autre fonction. Programme de test :

```c
#include <stdio.h>

#ifdef SANS_INTEGRATION
# define INTEGRABLE __attribute__((noinline))        /* interdit l'intégration */
#else
# define INTEGRABLE
#endif

static INTEGRABLE double somme_lente(long n)
{
    double s = 0;

    for (long i = 1; i <= n; i++)
        s += 1.0 / (double)i;                        /* le vrai travail est ici */
    return s;
}

int main(void)
{
    double total = 0;

    for (int k = 0; k < 20; k++)
        total += somme_lente(20000000);              /* 20 appels de la fonction lente */
    printf("%.3f\n", total);
    return 0;
}
```

| Compilation (`cc -O2 -pg`) | Ce qu'affiche `gprof -b -p` | Ce qui s'est vraiment passé |
|---|---|---|
| Telle quelle | 100 % du temps dans `main` | `somme_lente` a été intégrée dans `main` : elle n'existe plus comme fonction |
| Avec `-DSANS_INTEGRATION` | 100 % dans `frame_dummy`, 1 seul appel | GCC a créé une copie `somme_lente.constprop.0` (avec l'argument constant recopié dedans), que `gprof` n'affiche pas : il crédite la fonction placée juste avant en mémoire, une routine de démarrage du programme. Et l'appel, sans effet de bord, n'est plus fait qu'une fois au lieu de 20 |

`nm -n programme` (les symboles du programme triés par adresse) montre le vrai coupable, juste après :

```
0000000000001240 t frame_dummy
0000000000001250 t somme_lente.constprop.0
```

Le graphe d'appels (`gprof -q`) ne corrige rien : il reprend les mêmes noms. `valgrind --tool=callgrind` nomme bien la copie (99,7 % des instructions dans `somme_lente.constprop.0`). Vécu sur un solveur SAT : `gprof` attribuait 11 % du temps à `now()`, une petite fonction de lecture de l'horloge, alors qu'il revenait à `cancel_until`.

## Comparer sur des compteurs de travail, pas seulement sur le temps

Deux exécutions identiques d'un même programme peuvent différer de **±15 %** sur un ordinateur portable (fréquence du processeur, température). Un gain de 5 % mesuré au chronomètre est alors invisible dans le bruit. Quand le programme peut compter son **travail** (nœuds explorés, conflits, propagations), ces compteurs sont **déterministes** : identiques d'une exécution à l'autre.

| Ce qu'on observe | Ce que ça veut dire |
|---|---|
| Compteurs identiques, temps plus court | Le changement accélère le même travail : gain de vitesse pur |
| Compteurs plus bas | Le changement réduit le travail lui-même (meilleure recherche) |
| Compteurs différents, temps dans le bruit | Rien de concluant : mesurer sur plus d'instances |

## Plus de threads, plus lent : les programmes limités par la mémoire

Un programme peut être limité par le **calcul** (*CPU-bound*) ou par les **accès à la mémoire** (*memory-bound*, voir [Le cache CPU](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd)). Dans le second cas, les threads se disputent la même bande passante mémoire : en ajouter peut **ralentir** l'ensemble. Mesuré sur un solveur de puzzle : 577 ms avec un thread, 893 ms avec 8 threads (voir aussi [Le parallélisme](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)).

Deux autres leçons du même projet :

| Constat | Détail |
|---|---|
| Lancer plusieurs recherches différentes en parallèle et garder la première qui aboutit (un **portfolio**) | Très efficace contre les instances catastrophiques (voir [Les queues lourdes](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#les-queues-lourdes-quelques-instances-catastrophiques)), inutile si la mémoire est déjà le goulot |
| Valider sur des instances d'une autre origine | Un gain mesuré sur une seule famille de données peut ne pas se généraliser (voir [Carrés latins et tirage uniforme](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme)) |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Ne jamais optimiser sans avoir mesuré : l'intuition sur "ce qui est lent" cible en général le code qui semble compliqué, pas celui qui coûte réellement cher. |
| **Outils utilisables** | Un profileur classique (par fonction : `gprof`, `perf`, `valgrind --tool=callgrind`), une instrumentation manuelle par phase quand le programme passe son temps à attendre ; des compteurs de travail déterministes pour comparer deux versions. |
| **Pièges à éviter** | Se fier à une mesure unique : le bruit (réseau, cache, charge machine) peut dépasser l'effet réel d'une optimisation ; croire un nom de fonction inattendu dans un profil `gprof` d'un programme optimisé (vérifier avec `nm -n` ou callgrind). |
| **Bonnes pratiques** | Toujours re-mesurer après une optimisation (temps ET exactitude du résultat) ; prendre plusieurs mesures pour distinguer un vrai gain du bruit. |
