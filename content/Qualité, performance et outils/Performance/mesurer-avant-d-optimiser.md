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
    """Remplace module.nom par une version qui enregistre son temps d'exécution."""
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

## Où le programme rate le cache : `cachegrind`

Un profileur dit **où** part le temps, pas **pourquoi**. Quand la mémoire est en cause (voir [La hiérarchie de cache](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#la-hierarchie-de-cache)), [`cachegrind`](https://valgrind.org/docs/manual/cg-manual.html), un outil de Valgrind, exécute le programme sur un processeur **simulé** et compte, par fonction et par ligne, les lectures de données et les **défauts de cache** (*cache misses* : une donnée absente du cache, qu'il faut aller chercher plus loin).

Programme d'essai : le même tableau parcouru dans deux ordres différents.

```c
#include <stdio.h>
#include <stdlib.h>
#define N 4096                                   /* tableau de 4096 x 4096 entiers : 64 Mo */

/* noinline : garde deux fonctions distinctes dans le profil (voir le piège plus haut) */
__attribute__((noinline)) static long somme_lignes(const int *t)
{
    long s = 0;

    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            s += t[i * N + j];                   /* cases voisines en mémoire */
    return s;
}

__attribute__((noinline)) static long somme_colonnes(const int *t)
{
    long s = 0;

    for (int j = 0; j < N; j++)
        for (int i = 0; i < N; i++)
            s += t[i * N + j];                   /* saut de N entiers à chaque accès */
    return s;
}

int main(void)
{
    int *t = malloc(sizeof(int) * N * N);

    for (long k = 0; k < (long)N * N; k++)
        t[k] = 1;
    printf("%ld %ld\n", somme_lignes(t), somme_colonnes(t));
    free(t);
    return 0;
}
```

```bash
gcc -O2 -g parcours.c -o parcours                      # -g : numéros de ligne dans le rapport
valgrind --tool=cachegrind --cache-sim=yes ./parcours  # écrit cachegrind.out.<numéro>
cg_annotate cachegrind.out.<numéro>                    # rapport par fonction, puis par ligne
```

| Fonction | Lectures (`Dr`) | Défauts du cache L1 (`D1mr`) | Défauts du dernier niveau, à chercher en RAM (`DLmr`) | Temps réel, sans Valgrind |
|---|---|---|---|---|
| `somme_lignes` | 4,2 M | 1,0 M | 1,0 M | 3,8 ms |
| `somme_colonnes` | 16,8 M | 16,8 M | 16,8 M | 105 ms |

`somme_lignes` lit 4 entiers par instruction (le compilateur a regroupé les lectures) et ne rate le cache qu'une fois par [ligne de cache](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#lignes-de-cache-la-memoire-contigue-est-gratuite) de 64 octets, soit 16 entiers. `somme_colonnes` saute 16 Ko à chaque lecture : chacune rate le cache, et la fonction est 28 fois plus lente pour le même calcul.

| Piège | Ce qui se passe | Parade |
|---|---|---|
| Oublier `--cache-sim=yes` | Depuis Valgrind 3.21, la simulation du cache est désactivée par défaut : le rapport ne compte que les instructions (`Ir`), qui ne montrent pas l'écart (84 M pour `somme_colonnes` contre 46 M, pour un temps 28 fois plus long) | Toujours passer `--cache-sim=yes` |
| Sources modifiées après le profil | `cg_annotate` relit les sources actuelles : il avertit (`Annotations may not be correct`) mais affiche quand même les comptes, décalés d'autant de lignes qu'on en a ajouté ou retiré | Refaire le profil après toute modification |
| Cache simulé pour un seul programme, sans le préchargement du processeur | Le partage du cache L3 entre programmes simultanés n'apparaît pas ; le processeur réel devine et charge d'avance les lectures faites dans l'ordre, ce que la simulation ignore : les défauts de `somme_lignes` y coûtent bien moins que leur nombre ne le laisse penser | Traiter les comptes comme un ordre de grandeur, confirmé par une mesure réelle |

Vécu sur le solveur SAT : `cachegrind` a montré que 61 % des défauts de cache en écriture venaient d'un seul tableau (le niveau et la raison de chaque variable, réécrits à chaque affectation), une piste qu'aucun profil par fonction ne donnait. Précharger ce tableau à l'avance n'a pourtant rien gagné (+0,4 % et +1,0 % en deux mesures) : le processeur absorbe déjà ces écritures ratées dans son tampon d'écriture, et un défaut de cache ne coûte que s'il fait attendre le processeur.

## Chronométrer une portion de boucle : le compteur de cycles

`clock_gettime` ([Mesurer une durée](/?c=langages&s=c&p=mesure-du-temps#mesurer-une-duree-clock-gettime-clock-monotonic)) chronomètre bien une opération entière. Pour connaître la **part** de quelques lignes exécutées des millions de fois, il faut une mesure plus légère : le **compteur d'horodatage** du processeur (*Time Stamp Counter*, TSC), qui avance à fréquence fixe et se lit en une seule instruction, `rdtsc`, disponible en C sous le nom [`__rdtsc()`](https://gcc.gnu.org/onlinedocs/gcc/x86-Built-in-Functions.html).

```c
#include <stdio.h>
#include <stdlib.h>
#include <x86intrin.h>                           /* __rdtsc, _mm_lfence (x86 seulement) */
#define N (1 << 24)                              /* 16 M entiers : 64 Mo, plus que le cache */

#ifdef BARRIERE
/* attend la fin des instructions précédentes avant de lire le compteur */
# define CYCLES() (_mm_lfence(), __rdtsc())
#else
# define CYCLES() __rdtsc()
#endif

int main(int argc, char **argv)
{
    int vide = argc > 1 && argv[1][0] == 'v';     /* ./portion vide : partie B sans travail */
    int *t = malloc(sizeof(int) * N);
    unsigned long long dans_b = 0, x = 1;
    long s = 0;

    for (int k = 0; k < N; k++)
        t[k] = k;
    unsigned long long debut = CYCLES();
    for (int k = 0; k < N; k++) {
        s += t[k];                               /* partie A : lecture dans l'ordre */
        unsigned long long t0 = CYCLES();
        if (!vide) {
            x = x * 6364136223846793005ULL + 1;  /* partie B : une case tirée au hasard */
            s += t[x >> 40];
        }
        dans_b += CYCLES() - t0;
    }
    unsigned long long total = CYCLES() - debut;
    printf("somme %ld : part de B %.0f %%, %.0f cycles par passage dans B\n",
           s, 100.0 * dans_b / total, (double)dans_b / N);
    free(t);
    return 0;
}
```

```bash
gcc -O2 portion.c -o portion                  # lecture simple du compteur
gcc -O2 -DBARRIERE portion.c -o portion_b     # une barrière avant chaque lecture
./portion ; ./portion vide ; ./portion_b ; ./portion_b vide
```

| Lecture du compteur | Partie B réelle | Partie B vide |
|---|---|---|
| `__rdtsc()` seul | 22 % du temps, 26 cycles par passage | 50 %, 25 cycles |
| `_mm_lfence()` puis `__rdtsc()` | 87 %, 318 cycles | 49 %, 46 cycles |

Sans barrière, la partie B semble ne rien coûter de plus qu'une partie vide. Le processeur exécute en effet les instructions **dans le désordre** : il lance les suivantes sans attendre la fin des précédentes, et `rdtsc` lit le compteur avant que la lecture en RAM de la partie B soit terminée. Ce coût est payé **après** la mesure, dans la partie A. `_mm_lfence()`, une **barrière**, attend la fin des instructions précédentes : la partie B coûte alors 318 − 46 ≈ 270 cycles, l'ordre de grandeur d'un accès en RAM donné par [la hiérarchie de cache](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#la-hierarchie-de-cache).

| Piège | Parade |
|---|---|
| Lire le compteur sans barrière : un travail lancé dans la portion mesurée est payé après elle | `_mm_lfence()` avant chaque lecture du compteur |
| La mesure elle-même coûte (25 à 46 cycles par passage ici) : une portion très courte paraît plus chère qu'elle n'est | Mesurer aussi une portion vide, et retrancher son coût |
| Le compteur avance à fréquence fixe, pas au rythme réel du cœur, qui varie avec la charge et la température | Raisonner en parts d'un total mesuré de la même façon, pas en cycles absolus |
| `__rdtsc()` n'existe que sur les processeurs x86 (Intel, AMD) | `clock_gettime(CLOCK_MONOTONIC)` sur les autres processeurs |

Vécu sur le solveur SAT : cette instrumentation a situé un test ajouté à la recherche à environ 7 % du temps, soit le gain maximal qu'une version plus rapide de ce test pouvait apporter ; la version réécrite a gagné 6,2 %.

## Comparer sur des compteurs de travail, pas seulement sur le temps

Deux exécutions identiques d'un même programme peuvent différer de **±15 %** sur un ordinateur portable (fréquence du processeur, température). Un gain de 5 % mesuré au chronomètre est alors invisible dans le bruit. Quand le programme peut compter son **travail** (nœuds explorés, conflits, propagations), ces compteurs sont **déterministes** : identiques d'une exécution à l'autre.

| Ce qu'on observe | Ce que ça veut dire |
|---|---|
| Compteurs identiques, temps plus court | Le changement accélère le même travail : gain de vitesse pur |
| Compteurs plus bas | Le changement réduit le travail lui-même (meilleure recherche) |
| Compteurs différents, temps dans le bruit | Rien de concluant : mesurer sur plus d'instances |

## Vérifier que deux versions font le même travail, avant de les chronométrer

Une optimisation **à travail identique** (réécrire du code pour qu'il aille plus vite, sans rien changer à ce qu'il calcule) se vérifie **avant** toute mesure de temps. Si les deux versions ne font pas exactement le même travail, l'écart de temps mélange vitesse et travail, et peut cacher un bug (voir [Mesurer aussi après](#mesurer-aussi-apres)).

| Étape | Ce qu'elle vérifie |
|---|---|
| 1. Mêmes résultats et mêmes compteurs, sur beaucoup d'entrées variées | Le changement ne modifie pas le travail |
| 2. Seulement ensuite, la mesure du temps (en tours alternés, section suivante) | Le même travail va plus vite |

Pour automatiser l'étape 1, le programme écrit ce qui est déterministe (résultat, compteurs) sur la sortie standard, et ce qui varie d'une exécution à l'autre (le temps) sur la [sortie d'erreur](/?c=langages&s=bash&p=redirections-et-pipes#rediriger-la-sortie-d-erreur). Un script compare alors les deux versions entrée par entrée :

```bash
ok=0; total=0
for taille in 8 16 24 32 40; do
    for graine in 1 2 3; do                                # graine : fixe le hasard
        ./ancien "$taille" "$graine" > a.txt 2> /dev/null  # résultat et compteurs seuls
        ./nouveau "$taille" "$graine" > b.txt 2> /dev/null
        total=$((total + 1))
        if cmp -s a.txt b.txt; then                        # cmp -s : code 0 si identiques
            ok=$((ok + 1))
        else
            echo "différence : taille $taille, graine $graine"
        fi
    done
done
echo "$ok/$total identiques"
```

[`cmp`](https://man7.org/linux/man-pages/man1/cmp.1.html) compare deux fichiers octet par octet ; `-s` le rend silencieux, seul son [code de sortie](/?c=langages&s=bash&p=scripts-et-shebang#codes-de-sortie-exit) compte. `$((...))` fait un [calcul](/?c=langages&s=bash&p=variables#arithmetique) en Bash.

Vécu sur le solveur SAT : chaque optimisation de vitesse passe d'abord 49 vérifications de ce type (8 réglages en processus seul sur des grilles de 8 à 40 cases de côté, plus le mode parallèle et un auto-test), et la mesure du temps ne commence qu'à 49 sur 49.

## Mesurer en tours alternés

Même à travail identique, le temps reste à mesurer, et la machine **dérive** pendant la mesure : température, fréquence du processeur, autre programme lancé entre-temps. Mesurer toutes les exécutions de A, puis toutes celles de B, attribue cette dérive à la différence entre A et B (voir aussi [Le piège de la mesure unique](#le-piege-de-la-mesure-unique)).

| Ordre des mesures | Si la machine ralentit en cours de route |
|---|---|
| A, A, A, puis B, B, B | B paraît plus lent que A, sans y être pour rien |
| A, B, puis A, B (tours alternés) | La dérive touche A et B à parts égales, et l'écart entre deux tours d'une même version montre le bruit |

Exemple réel sur le solveur SAT : 3 grilles, temps moyen par grille, une version de référence et trois variantes dont les compteurs étaient déjà vérifiés identiques (section précédente), machine au repos (aucune compilation ni autre calcul pendant la mesure).

| Version | Tour 1 | Tour 2 | Écart à la référence du même tour |
|---|---|---|---|
| Référence | 33,8 s | 32,6 s | (base de comparaison) |
| Variante a | 33,0 s | 31,4 s | −2,4 % puis −3,9 % |
| Variante b2 | 33,5 s | 32,1 s | −1,1 % puis −1,6 % |
| Variante b1 | 33,0 s | 32,7 s | −2,6 % puis +0,2 % |

| Constat | Conclusion |
|---|---|
| La référence gagne 3,6 % entre ses deux tours, sans aucun changement | Comparer la variante a du tour 2 à la référence du tour 1 donnerait −7,3 %, deux fois son vrai gain |
| a et b2 gagnent dans les deux tours | Gains retenus |
| b1 change de signe d'un tour à l'autre | Rien de concluant : l'écart est dans le bruit |

Pour conclure à partir de plusieurs grilles plutôt que d'une seule (appariement, test du signe, comparaisons multiples), voir [Comparer deux réglages](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages).

## Un gain de micro-banc n'est pas un gain du programme : l'exemple de la division

Une division entière est une des instructions les plus lentes d'un processeur : sa **latence** (le temps avant que le résultat soit disponible) se compte en dizaines de cycles, contre quelques cycles pour une multiplication. Quand le diviseur change d'une fois à l'autre mais ne prend que peu de valeurs, on peut remplacer la division par une multiplication par un **inverse précalculé** (voir [Éviter le recalcul redondant](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)).

```c
#include <stdint.h>

#define DMAX 128                // plus grand diviseur utilisé
#define XBITS 25                // les dividendes restent sous 2^XBITS
static uint64_t inv[DMAX + 1];  // inv[d] = plafond de 2^32 / d

void init_inverses(void)
{
    for (uint64_t d = 1; d <= DMAX; d++)
        inv[d] = ((1ULL << 32) + d - 1) / d;
}

// Quotient entier de x par d, pour 1 <= d <= DMAX et x < 2^XBITS
static inline uint32_t diviser(uint32_t x, uint32_t d)
{
    return (uint32_t)(((uint64_t)x * inv[d]) >> 32);
}
```

**Pourquoi le résultat est exact.** Notons `e = inv[d] × d − 2³²` : comme `inv[d]` est arrondi vers le haut, `0 ≤ e < d`. Alors `x × inv[d] / 2³² = x/d + x × e / (d × 2³²)`. Tant que `x × e < 2³²` (ici `x < 2²⁵` et `e < d ≤ 128 = 2⁷`), le terme ajouté est inférieur à `1/d`. Or la partie fractionnaire de `x/d` vaut au plus `(d − 1)/d` : la somme reste sous l'entier suivant, et la troncature donne bien le quotient. Vérifié ici par énumération complète : 128 diviseurs × 2²⁵ dividendes, soit 2³² cas, 0 erreur.

**Combien ça gagne, selon l'endroit où l'on mesure.** Même calcul de somme avec la division (A) et avec l'inverse (B), sur un Intel Core Ultra 5 228V (sous WSL, Ubuntu 24.04), gcc 13.3 en `-O2`, médiane de 7 tours alternés, mêmes sommes vérifiées :

| Situation mesurée | A : division | B : inverse | Gain de B |
|---|---|---|---|
| 4 M divisions indépendantes | 8,6 ms | 2,3 ms | −73 % |
| Chaîne où chaque division attend la précédente | 22,4 ms | 8,9 ms | −61 % |
| 32 M accès aléatoires dans un tableau de 128 Mo, une division par accès | 506 ms | 381 ms | −25 % |

Le gain fond à mesure que la division pèse moins dans le temps total : le processeur exécute en désordre et **masque** la latence de la division derrière d'autres instructions ou l'attente de la mémoire. Dans un vrai programme (le solveur de puzzle de la recherche rush01, où la division n'est qu'une opération parmi bien d'autres), le même remplacement n'a gagné que 0,5 % du temps total.

> **Piège :** conclure d'un micro-banc (−73 %) qu'un programme entier ira plus vite. Seule la mesure du **programme réel** dit ce que vaut l'optimisation, avec les [tours alternés](#mesurer-en-tours-alternes) ci-dessus.
>
> **Bonne pratique :** avant de remplacer une division, mesurer la part qu'elle occupe dans le profil du programme ; si elle est faible, laisser le code simple.

> **Piège :** l'inverse en virgule flottante (`1.0 / d`) ne convient pas : `49 × (1.0 / 49)` vaut `0,9999999999999999`, et la troncature donne 0 au lieu de 1. Une valeur hors du domaine annoncé (`x ≥ 2²⁵`, `d > 128`, `d = 0`) donne en plus un résultat faux **sans aucune erreur**.
>
> **Bonne pratique :** rester en entiers avec un inverse arrondi vers le haut, vérifier l'exactitude par énumération sur tout le domaine, et protéger l'entrée par une assertion. Pour un diviseur **constant** à la compilation, inutile : le compilateur fait déjà ce remplacement (gcc produit un `imul` pour `x / 7` et un `div` pour `x / d`).

## Mesurer la complexité : doubler la taille, sur le build normal

Pour savoir comment le temps croît avec la quantité de données (la **complexité**), on **double la taille** de l'entrée et on compare les temps :

| Temps après doublement | Croissance | Nom |
|---|---|---|
| × 2 | proportionnelle à la taille | linéaire |
| × 4 | proportionnelle au **carré** de la taille | quadratique |

Un programme quadratique est souvent invisible sur de petites données et s'effondre sur de grandes. Exemple : ajouter `n` entiers un par un en agrandissant le tableau d'**une case** à chaque fois avec [`realloc`](/?c=langages&s=c&p=memoire#redimensionner-un-bloc-realloc) (qui peut recopier tout le tableau vers un nouvel emplacement) :

```c
for (long i = 0; i < n; i++)
{
	int *bigger = realloc(tab, (size_t)(i + 1) * sizeof *tab);   /* un seul entier de plus */

	if (!bigger)
	{
		free(tab);
		fprintf(stderr, "realloc a échoué à i = %ld\n", i);
		return 1;
	}
	tab = bigger;
	tab[i] = (int)i;
}
```

Mesuré (`gcc -O2`, durée de la seule boucle) :

| Build | n | Durée |
|---|---|---|
| normal (`-O2`) | 400 000 / 800 000 / 1 600 000 | 0,002 s / 0,004 s / 0,006 s (≈ × 2 par doublement) |
| `-fsanitize=address` (ASan) | 6 250 / 12 500 / 25 000 | 0,094 s / 0,335 s / 1,166 s (≈ × 3,6 par doublement) |

**ASan** (*AddressSanitizer*) est une option de compilation qui surveille chaque accès à la mémoire pour détecter les débordements et les usages après libération. Pour cela, son `realloc` **alloue toujours un nouveau bloc et recopie tout**, alors que celui de la glibc agrandit en général sur place : le même programme est **linéaire** en build normal et **quadratique** sous ASan. À `n = 50 000`, le build ASan a même dépassé 2 Gio de mémoire (les anciens blocs restent retenus un temps avant d'être réutilisés) et a été arrêté par `ASAN_OPTIONS=hard_rss_limit_mb=2000`.

> **Piège (une mesure faite sous un outil d'instrumentation) :** les temps d'un build sanitizer, d'un `valgrind` ou d'un profileur ne disent rien de la vitesse réelle, ni de sa complexité : l'outil change lui-même l'algorithme (ici, de linéaire à quadratique). Mesurer la complexité **sur le build normal** (`-O2`, sans instrumentation) ; garder les sanitizers pour la **correction** (voir [Valgrind](/?c=langages&s=c&p=memoire)). Un temps qui devient énorme uniquement sous un outil est un fait de l'outil avant d'être un bug du programme.

La parade au tableau agrandi d'une case est le **doublement de capacité** : on multiplie la capacité par un facteur constant (par exemple 2) seulement quand le tableau est plein ; les recopies deviennent rares et l'ajout reste linéaire sous tous les builds.

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
| **À retenir** | Ne jamais optimiser sans avoir mesuré : l'intuition sur "ce qui est lent" cible en général le code qui semble compliqué, pas celui qui coûte réellement cher. Deux versions se comparent d'abord sur leurs résultats et leurs compteurs, puis seulement sur le temps, en tours alternés. Un gain mesuré sur un micro-banc ne vaut pas pour le programme entier : le processeur masque la latence d'une instruction lente (division) derrière le reste du travail. |
| **Outils utilisables** | Un profileur classique (par fonction : `gprof`, `perf`, `valgrind --tool=callgrind`), une instrumentation manuelle par phase quand le programme passe son temps à attendre ; des compteurs de travail déterministes pour comparer deux versions ; `cachegrind` (`--cache-sim=yes`) pour les défauts de cache ; `__rdtsc()` précédé de `_mm_lfence()` pour la part d'une portion de boucle ; `cmp -s` pour comparer deux sorties. |
| **Pièges à éviter** | Se fier à une mesure unique : le bruit (réseau, cache, charge machine) peut dépasser l'effet réel d'une optimisation ; croire un nom de fonction inattendu dans un profil `gprof` d'un programme optimisé (vérifier avec `nm -n` ou callgrind) ; `cachegrind` sans `--cache-sim=yes`, ou sur des sources modifiées depuis le profil ; lire le compteur de cycles sans barrière ; mesurer A puis B en bloc sur une machine qui dérive ; conclure d'un micro-banc (−73 %) qu'un programme entier gagnera autant (0,5 % mesuré) ; juger une complexité sur un build sanitizer ou valgrind ; un inverse en virgule flottante, ou une entrée hors du domaine vérifié. |
| **Bonnes pratiques** | Toujours re-mesurer après une optimisation (temps ET exactitude du résultat) ; prendre plusieurs mesures pour distinguer un vrai gain du bruit ; vérifier que deux versions font le même travail avant de les chronométrer ; mesurer en tours alternés, machine au repos ; mesurer la complexité en doublant la taille (× 4 de temps = quadratique) sur le build normal ; chiffrer la part d'une instruction dans le profil avant de la remplacer, et vérifier un remplacement exact par énumération sur tout son domaine. |
