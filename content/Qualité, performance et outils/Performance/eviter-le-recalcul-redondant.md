---
order: 7
---

# Éviter le recalcul redondant

Un principe plus général se cache derrière [l'attente d'une condition plutôt que d'une durée](/?c=performance&p=attentes-et-temps-morts) : **ne jamais recalculer un résultat que rien n'a pu changer depuis son dernier calcul**. Là où le chapitre précédent portait sur l'attente (du temps qui passe), celui-ci porte sur le calcul (du processeur et de la mémoire qui travaillent) : la même paresse disciplinée, appliquée à un autre type de coût.

## Mémoïser le résultat d'une fonction

Le cas le plus direct : une fonction coûteuse, appelée plusieurs fois avec les mêmes arguments, qui refait le même travail à chaque appel.

```python
def note_de_credit(client_id):
    # requete lourde : agrege l'historique, calcule un score
    return calculer_score(recuperer_historique(client_id))

# appelee 3 fois pour le meme client dans le meme traitement
for commande in commandes_du_client:
    if note_de_credit(client_id) < seuil:
        refuser(commande)
```

Rien ne change `client_id` ni son historique entre ces trois appels : le deuxième et le troisième recalculent exactement ce que le premier a déjà produit.

```python
_cache_notes = {}

def note_de_credit(client_id):
    if client_id not in _cache_notes:
        _cache_notes[client_id] = calculer_score(recuperer_historique(client_id))
    return _cache_notes[client_id]
```

La **mémoïsation** garde en mémoire le résultat pour une entrée donnée et le réutilise tant que rien ne peut l'invalider. La condition qui fait sa correction n'est pas "c'est plus rapide", c'est "l'entrée n'a pas changé" : exactement le même invariant que celui de la bannière de cookies déjà traitée dans le chapitre précédent, appliqué ici à une valeur plutôt qu'à un état d'affichage.

> Une mémoïsation sans invalidation est un bug en sursis : si `client_id` peut voir son historique modifié en cours de traitement (un paiement qui arrive entre deux commandes), le cache renvoie une réponse périmée. Mémoïser, c'est d'abord identifier ce qui rendrait le résultat obsolète, avant de décider de le garder.

## Recalculer seulement ce qui a changé

Le même principe s'applique à l'échelle d'un traitement entier, pas seulement d'un appel de fonction. Si une seule partie des données a changé depuis le dernier passage, retraiter l'ensemble revient à refaire tout le travail déjà validé pour ne modifier qu'un fragment.

```python
# a chaque execution : on retraite les 50 000 lignes du fichier
for ligne in tout_le_fichier:
    resultats.append(traiter(ligne))
```

```python
# on ne retraite que ce qui est arrivé depuis le dernier passage
dernier_horodatage = lire_marque_de_progression()
nouvelles_lignes = [l for l in tout_le_fichier if l.horodatage > dernier_horodatage]

for ligne in nouvelles_lignes:
    resultats.append(traiter(ligne))

ecrire_marque_de_progression(
    nouvelles_lignes[-1].horodatage if nouvelles_lignes else dernier_horodatage,
)
```

Le coût du traitement devient proportionnel à ce qui a **changé**, pas à la taille totale des données : un gain qui s'accentue à mesure que le volume déjà traité grandit par rapport au volume réellement nouveau.

## L'exemple du jeu vidéo 2D : ne redessiner que ce qui bouge

Un jeu 2D qui gère lui-même sa mémoire d'affichage (un tableau de pixels ou de tuiles en mémoire, sans déléguer à un moteur de rendu qui optimise déjà cela) illustre bien le principe à l'échelle d'une image entière.

```python
# a chaque tick : on redessine toute l'image, meme si un seul personnage a bouge
def dessiner_frame(ecran, scene):
    for x in range(ecran.largeur):
        for y in range(ecran.hauteur):
            ecran.definir_pixel(x, y, scene.couleur_a(x, y))
```

Si un tick ne fait bouger qu'un personnage de quelques pixels, le reste du décor est identique pixel pour pixel à la frame précédente : le recalculer ne change rien au résultat, seulement au temps passé à l'obtenir.

```python
# on ne redessine que les rectangles marques "sales" (modifies depuis le dernier tick)
def dessiner_frame(ecran, scene, zones_modifiees):
    for zone in zones_modifiees:
        for x, y in zone.pixels():
            ecran.definir_pixel(x, y, scene.couleur_a(x, y))
```

C'est la logique du **dirty rectangle** (rectangle sale) : la scène signale elle-même quelles zones ont changé depuis le dernier rendu, et seules celles-là sont redessinées. Sur un décor à 90% statique, ça ramène le coût de chaque frame à une fraction de celui d'un rendu complet, pour un résultat visuellement identique.

## Un exemple tiré d'un scraper : ne pas confirmer ce qui est déjà prouvé

Un scraper de petites annonces comparait deux annonces pour savoir si elles décrivaient le même véhicule (doublon) ou deux véhicules différents. La vérification complète ouvrait la page détaillée de chaque annonce pour comparer une dizaine de caractéristiques (kilométrage, options, historique d'entretien) : un appel réseau et un temps de rendu non négligeables.

```python
def sont_potentiellement_dupliquees(annonce_a, annonce_b):
    # tout est deja disponible sur les cartes de la page de resultats
    return (
        annonce_a.marque == annonce_b.marque
        and annonce_a.modele == annonce_b.modele
        and abs(annonce_a.prix - annonce_b.prix) < 200
    )

def sont_dupliquees(annonce_a, annonce_b):
    if not sont_potentiellement_dupliquees(annonce_a, annonce_b):
        return False    # deja tranche : marque ou modele different, ou prix trop eloigne
    detail_a = ouvrir_page_annonce(annonce_a)
    detail_b = ouvrir_page_annonce(annonce_b)
    return comparer_specifications(detail_a, detail_b)
```

Dès que la comparaison "légère" (les champs déjà présents sur la carte de résultats) établit que deux annonces sont différentes, la question est **déjà résolue** : ouvrir les deux pages détaillées pour le confirmer ne ferait que recalculer, au prix fort, un résultat que la donnée bon marché a déjà produit. La vérification coûteuse ne s'exécute que dans le cas ambigu, celui où la donnée légère ne suffit pas à trancher.

> À ne pas confondre avec une optimisation de la **latence réseau**. Ici, ce qu'on évite est un travail redondant côté CPU/logique (recalculer une réponse déjà connue), pas un délai d'E/S. Les pauses volontaires entre requêtes (limite de débit, politesse envers un serveur distant) ou l'attente d'une animation d'interface ne relèvent pas de ce principe : elles restent nécessaires même quand aucun recalcul n'est en jeu, et les supprimer expose à un blocage, pas à une simple lenteur. C'est exactement la distinction posée en fin de [Attendre sans perdre de temps](/?c=performance&p=attentes-et-temps-morts) : un délai de protection n'est pas un gaspillage à éliminer.

## Reprendre le résultat précédent : le calcul incrémental à résultat identique

[Recalculer seulement ce qui a changé](#recalculer-seulement-ce-qui-a-change) traite des **données** qui arrivent par petits morceaux. Le même principe s'applique à un **algorithme** appelé des millions de fois sur une entrée qui a à peine bougé entre deux appels : au lieu de repartir de zéro, il repart du **résultat précédent**.

Exemple tiré du solveur Skyscraper. Son test de Hall cherche, pour une ligne presque remplie, un [couplage entre les cases libres et les valeurs manquantes](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin#trouver-un-couplage-le-chemin-augmentant-algorithme-de-kuhn). Entre deux tests de la même ligne, quelques valeurs seulement ont été retirées : presque toutes les paires du couplage précédent sont encore valables. La fonction ci-dessous les garde et ne lance une recherche de chemin augmentant que pour les cases restées sans valeur. Elle utilise le fichier `couplage.h` du chapitre sur les [couplages](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin).

```c
#include <stdio.h>
#include <stdlib.h>
#include "couplage.h"

static long recherches, valeurs_visitees;       /* compteurs de travail */

/* Couple les cases en reprenant proprio : les paires encore valides sont gardées,
   seules les cases restées sans valeur cherchent un chemin augmentant. */
static int coupler_depuis(int n, const uint64_t *domaine, int *proprio, uint64_t *echec)
{
    uint64_t gardees = 0;                       /* cases dont la paire est reprise */
    uint64_t vues;

    for (int v = 0; v < 64; v++) {
        int i = proprio[v];

        if (i >= 0 && (domaine[i] >> v & 1) && !(gardees >> i & 1))
            gardees |= 1ull << i;               /* paire encore valide */
        else
            proprio[v] = -1;                    /* paire périmée : la valeur est libérée */
    }
    for (int i = 0; i < n; i++) {
        if (gardees >> i & 1)
            continue;
        vues = 0;
        recherches++;
        int ok = augmenter(i, domaine, proprio, &vues);

        valeurs_visitees += __builtin_popcountll(vues);
        if (!ok) {
            *echec = vues;                      /* l'ensemble de Hall de cet échec */
            return i;
        }
    }
    return -1;
}

int main(void)
{
    enum { N = 32, EPISODES = 2000 };
    long etapes = 0, desaccords = 0, travail[2][2] = {{0}};
    long conflits = 0, autre_case = 0, autre_ensemble = 0;

    srand(7);
    for (int ep = 0; ep < EPISODES; ep++) {
        uint64_t dom[N];
        int prec[64], neuf[64];
        uint64_t hall_a, hall_b, ignore;

        for (int i = 0; i < N; i++) {           /* domaines au hasard, 10 % des valeurs */
            dom[i] = 1ull << i;                 /* la valeur i est possible au départ */
            for (int v = 0; v < N; v++)
                if (rand() % 100 < 10)
                    dom[i] |= 1ull << v;
        }
        for (int v = 0; v < 64; v++)
            prec[v] = -1;
        coupler_depuis(N, dom, prec, &ignore);  /* couplage de départ */
        for (int pas = 0; pas < 1000; pas++) {  /* une case perd une valeur à chaque pas */
            int i = rand() % N, v = rand() % N;
            long r0, w0;
            int a, b;

            if (!(dom[i] >> v & 1) || (dom[i] & (dom[i] - 1)) == 0)
                continue;                       /* valeur absente, ou la dernière de la case */
            dom[i] &= ~(1ull << v);
            etapes++;
            for (int k = 0; k < 64; k++)
                neuf[k] = -1;                   /* A : calcul complet, sans rien reprendre */
            r0 = recherches; w0 = valeurs_visitees;
            a = coupler_depuis(N, dom, neuf, &hall_a);
            travail[0][0] += recherches - r0; travail[0][1] += valeurs_visitees - w0;
            r0 = recherches; w0 = valeurs_visitees;
            b = coupler_depuis(N, dom, prec, &hall_b);   /* B : couplage précédent repris */
            travail[1][0] += recherches - r0; travail[1][1] += valeurs_visitees - w0;
            if ((a < 0) != (b < 0))
                desaccords++;                   /* même verdict attendu des deux */
            if (b >= 0) {                       /* conflit : l'épisode s'arrête */
                conflits++;
                autre_case += a != b;           /* la case laissée sans valeur diffère */
                autre_ensemble += hall_a != hall_b;
                break;
            }
        }
    }
    printf("%ld retraits de valeur, %ld désaccords de verdict\n", etapes, desaccords);
    printf("calcul complet : %ld recherches, %ld valeurs visitées\n",
           travail[0][0], travail[0][1]);
    printf("couplage repris : %ld recherches, %ld valeurs visitées\n",
           travail[1][0], travail[1][1]);
    printf("%ld conflits : %ld avec une autre case sans valeur,\n", conflits, autre_case);
    printf("%ld avec un autre ensemble de valeurs atteintes\n", autre_ensemble);
    return desaccords != 0;
}
```

Le programme retire des valeurs une à une dans des domaines au hasard, et refait chaque fois le calcul de deux façons : **A** depuis zéro, **B** en reprenant le couplage précédent.

```
49549 retraits de valeur, 0 désaccords de verdict
calcul complet : 1581056 recherches, 9423329 valeurs visitées
couplage repris : 12710 recherches, 207078 valeurs visitées
2000 conflits : 1725 avec une autre case sans valeur,
0 avec un autre ensemble de valeurs atteintes
```

| Compteur (49 549 retraits de valeur) | Calcul complet (A) | Couplage repris (B) |
|---|---|---|
| Recherches de chemin augmentant lancées | 1 581 056 | 12 710 |
| Valeurs visitées pendant ces recherches | 9 423 329 | 207 078 |
| Désaccords sur le verdict (un couplage existe ou non) | 0 | 0 |

La reprise fait 124 fois moins de recherches, pour exactement les mêmes réponses. Trois précautions rendent cela sûr :

| Précaution | Pourquoi | Dans l'exemple |
|---|---|---|
| Le point de départ doit être encore valide | Une paire périmée fausserait le résultat | Les paires dont la valeur a été retirée sont supprimées avant de repartir |
| Le verdict doit être le même depuis tout point de départ | Sinon l'optimisation change la réponse | L'algorithme de Kuhn est exact depuis n'importe quel couplage valide : 0 désaccord sur 49 549 cas |
| Ce qui dépend du point de départ ne doit pas fuir | Une explication ou une sortie qui change modifie la suite du programme | Lors d'un conflit, repli sur le calcul complet (voir ci-dessous) |

Le dernier point se voit dans la dernière ligne de la sortie. Sur les 2 000 conflits, **1 725** laissent une autre case sans valeur selon le point de départ, alors que l'ensemble des valeurs atteintes est le même dans les 2 000. Or l'[explication du conflit](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin#quand-aucun-couplage-n-existe-l-ensemble-de-hall) est construite à partir de cette case et des détenteurs des valeurs atteintes : elle dépend donc du couplage de départ. Le solveur refait alors, **uniquement quand il y a conflit**, le calcul complet d'origine : l'explication est celle de la version sans reprise, la recherche suit exactement le même chemin, et les compteurs (décisions, conflits, propagations) restent identiques sur les 49 vérifications du protocole. Une optimisation à recherche identique se mesure proprement : seul le temps change (voir [comparer sur des compteurs de travail](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparer-sur-des-compteurs-de-travail-pas-seulement-sur-le-temps)).

> Un compteur divisé par 124 ne donne pas un programme 124 fois plus rapide. Le test de Hall pesait **7,4 %** du temps de la recherche (profil par compteur de cycles, grille 104 × 104 : 4,7 % pour la construction du graphe, 2,5 % pour le couplage) : le gain maximal possible était donc d'environ 7 %. Mesuré : **6,2 %** (33,9 s contre 31,8 s à 96 × 96). Profiler d'abord dit jusqu'où cela vaut la peine d'aller.

## Ne repasser que sur ce qui est marqué : parcourir une bitmap

Le [filtre par bitmap](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#filtre-par-bitmap) évite de lire un élément quand un bit annonce qu'il n'y a rien dedans. Le même bitmap sert aussi à **énumérer** seulement les éléments qui ont quelque chose, sans visiter les autres.

Exemple tiré du même solveur : à chaque nettoyage des clauses apprises, il faut retirer de chaque liste de surveillance les clauses supprimées. Le solveur compte 13,6 millions de listes (une par littéral), presque toutes vides. Un bit par liste dit si elle peut contenir quelque chose. Le programme ci-dessous compare un parcours de toutes les listes avec un parcours des seuls bits à 1 : `bits &= bits - 1` efface le bit le plus bas du mot, `__builtin_ctzll` donne la position du bit à traiter (voir [parcourir les bits à 1](/?c=langages&s=c&p=operateurs-binaires#parcourir-les-bits-a-1-les-fonctions-integrees-du-compilateur)).

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define N 13600000u                 /* nombre de listes, comme les littéraux du solveur */

typedef struct {
    int *d;                         /* les entrées de la liste */
    int n, cap;
    char reserve[16];               /* la place d'une deuxième liste : 32 octets par en-tête */
} liste;

static liste *listes;
static uint64_t *marque;            /* bit i : la liste i peut être non vide */
static long lues;                   /* compteur de travail : en-têtes de liste lus */

/* Compte les entrées « mortes » (impaires), qui représentent des clauses supprimées */
static long compter_tout(void)
{
    long mortes = 0;

    for (unsigned i = 0; i < N; i++) {              /* toutes les listes, vides comprises */
        lues++;
        for (int k = 0; k < listes[i].n; k++)
            mortes += listes[i].d[k] & 1;
    }
    return mortes;
}

static long compter_marquees(void)
{
    long mortes = 0;

    for (unsigned mot = 0; mot < N / 64 + 1; mot++)
        for (uint64_t bits = marque[mot]; bits; bits &= bits - 1) {     /* bits à 1 */
            unsigned i = mot * 64 + __builtin_ctzll(bits);

            lues++;
            for (int k = 0; k < listes[i].n; k++)
                mortes += listes[i].d[k] & 1;
        }
    return mortes;
}

static double maintenant(void)
{
    struct timespec t;

    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(int argc, char **argv)
{
    unsigned pour_mille = argc > 1 ? (unsigned)atoi(argv[1]) : 90;    /* listes non vides */
    int *pool = malloc(sizeof(int) * N * 3);
    uint64_t etat = 88172645463325252ull;
    long attendu, trouve = 0, pris = 0, oubliees = 0, lues_marquees = 0;
    double meilleur[2] = { 1e9, 1e9 };

    listes = calloc(N, sizeof(liste));
    marque = calloc(N / 64 + 1, sizeof(uint64_t));
    if (!pool || !listes || !marque)
        return 1;
    for (unsigned i = 0; i < N; i++) {
        etat ^= etat << 13;                         /* xorshift : un tirage pseudo-aléatoire */
        etat ^= etat >> 7;
        etat ^= etat << 17;
        if (etat % 1000 < pour_mille) {             /* liste non vide, de 1 à 3 entrées */
            listes[i].n = 1 + (int)(etat / 1000 % 3);
            listes[i].d = pool + pris;
            for (int k = 0; k < listes[i].n; k++)
                pool[pris++] = (int)(etat >> (8 * k + 8));
            marque[i / 64] |= 1ull << (i % 64);     /* invariant : non vide implique marquée */
        }
    }
    attendu = compter_tout();
    for (int tour = 0; tour < 5; tour++) {          /* 5 tours alternés, le meilleur compte */
        double t0 = maintenant();
        double duree;

        trouve = compter_tout();
        duree = maintenant() - t0;
        meilleur[0] = duree < meilleur[0] ? duree : meilleur[0];
        t0 = maintenant();
        lues = 0;
        trouve = compter_marquees();
        duree = maintenant() - t0;
        meilleur[1] = duree < meilleur[1] ? duree : meilleur[1];
        lues_marquees = lues;
    }
    printf("%.1f %% de listes non vides\n", pour_mille / 10.0);
    printf("toutes les listes : %5.1f ms, %ld en-têtes lus\n", meilleur[0] * 1e3, (long)N);
    printf("listes marquées   : %5.1f ms, %ld en-têtes lus, même résultat : %s\n",
           meilleur[1] * 1e3, lues_marquees, trouve == attendu ? "oui" : "NON");
    for (unsigned i = 0; i < N; i += 1000)          /* bug : on oublie une marque sur 1000 */
        if (listes[i].n && (marque[i / 64] >> (i % 64) & 1)) {
            marque[i / 64] &= ~(1ull << (i % 64));
            oubliees++;
        }
    printf("avec %ld marques oubliées : %ld entrées mortes au lieu de %ld\n",
           oubliees, compter_marquees(), attendu);
    return 0;
}
```

```
1.0 % de listes non vides
toutes les listes :  14.2 ms, 13600000 en-têtes lus
listes marquées   :   3.8 ms, 135940 en-têtes lus, même résultat : oui
avec 129 marques oubliées : 135683 entrées mortes au lieu de 135817
```

La même mesure pour plusieurs proportions de listes non vides (meilleur de 5 tours alternés, machine au repos) :

| Listes non vides | Toutes les listes | Listes marquées | Rapport |
|---|---|---|---|
| 0,1 % | 7,6 ms | 0,6 ms | ×13 |
| 1 % | 14,2 ms | 3,8 ms | ×3,7 |
| 9 % | 22,4 ms | 25,1 ms | ×0,9 |
| 30 % | 44,2 ms | 31,4 ms | ×1,4 |

Le gain n'est pas garanti : il dépend de la proportion d'éléments qui ont du travail. À 9 %, passer d'une liste marquée à la suivante est un accès au hasard dans un tableau de 435 Mo, aussi coûteux que de lire d'un trait toutes les listes ; une lecture continue est en partie facilitée par le préchargement du processeur (explication probable, non isolée ici). Dans le solveur, la bitmap sert ainsi à deux endroits : la propagation saute les listes vides (91 % des propagations en rencontrent une : 2,0 s contre 1,58 s à 48 × 48, mêmes compteurs), et la purge ne visite que les listes marquées (33,9 s contre 35,1 s à 96 × 96, soit 3,3 % de moins, recherche identique).

> **Piège :** la bitmap est un **contrat**. Un bit à 0 doit garantir que l'élément est vide ; un bit à 1 ne garantit rien (il est remis à 0 plus tard). Oublier de marquer un élément ne produit aucune erreur : la dernière ligne de la sortie montre que 129 marques oubliées font manquer 134 des 135 817 entrées mortes, sans aucun message. Vérifier toute optimisation de ce type en comparant avec le parcours complet sur de petits cas.

## Écriture atomique : jamais de lecture à moitié écrite

Un cache mémoïsé en mémoire (section précédente) disparaît à l'arrêt du processus ; un **cache fichier** survit à un redémarrage, mais introduit un risque nouveau : un lecteur concurrent peut ouvrir le fichier de cache **pendant qu'il est en cours d'écriture**.

```python
# Risque : un lecteur concurrent peut lire ce fichier a moitie ecrit
with open("cache.json", "w") as f:
    json.dump(resultat, f)   # si le processus est interrompu ici, le fichier est corrompu
```

```python
# Ecriture atomique : ecrire dans un fichier temporaire, puis le renommer
import os

chemin_tmp = "cache.json.tmp"
with open(chemin_tmp, "w") as f:
    json.dump(resultat, f)
os.replace(chemin_tmp, "cache.json")   # rename() : atomique au niveau du systeme de fichiers
```

`os.replace()` (comme `rename()` dans la plupart des langages) est **atomique** au niveau du système de fichiers : à tout instant, `cache.json` pointe soit vers l'ancienne version complète, soit vers la nouvelle version complète, jamais vers un état intermédiaire. Aucun lecteur concurrent ne peut donc jamais voir un fichier à moitié écrit, contrairement à une écriture directe interrompue en cours de route.

> **Piège :** écrire directement dans le fichier de cache final, en supposant qu'une interruption (plantage, coupure) est un cas assez rare pour être ignoré. Un fichier de cache corrompu peut ensuite faire planter tous les lecteurs suivants, bien après l'incident initial.
>
> **Bonne pratique :** toujours écrire dans un fichier temporaire puis renommer vers le nom final, pour tout fichier lu par un autre processus pendant qu'il peut être réécrit.

## Stale-while-revalidate : répondre tout de suite, recalculer derrière

La mémoïsation vue plus haut a un défaut à grande échelle : si le cache est vide ou périmé, la requête qui déclenche le recalcul **attend** ce recalcul avant de répondre. Le pattern **stale-while-revalidate** (littéralement "périmé pendant la revalidation", emprunté à l'en-tête HTTP [`Cache-Control: stale-while-revalidate`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate)) change cette règle : répondre **immédiatement** avec la valeur en cache, même périmée, et ne recalculer qu'en tâche de fond.

```text
Cache classique (bloquant) :        Stale-while-revalidate :

requete -> cache perime ?           requete -> cache perime ?
              |  oui                             |  oui
              v                                  v
        recalcule (attend)                repond avec la valeur perimee
              |                            ET declenche un recalcul en fond
              v                                  |
           repond                          (le prochain appel recoit la
                                             valeur fraiche)
```

```python
verrou_recalcul = threading.Lock()

def valeur_avec_cache(cle):
    entree = cache.get(cle)
    if entree is None:
        # tout premier appel : pas d'autre choix que d'attendre
        return recalculer_et_stocker(cle)

    if entree.est_perimee() and verrou_recalcul.acquire(blocking=False):
        threading.Thread(target=lambda: recalculer_et_stocker(cle, verrou_recalcul)).start()

    return entree.valeur   # repond immediatement, perimee ou non
```

Le verrou anti-concurrence (`verrou_recalcul`) évite qu'un recalcul coûteux soit relancé N fois en parallèle pendant qu'il est déjà en cours pour la même clé : seul le tout premier thread à l'acquérir déclenche réellement le recalcul, les autres continuent de servir la valeur périmée en attendant.

> **Piège :** appliquer stale-while-revalidate sans verrou anti-concurrence, sur une clé soumise à beaucoup de requêtes simultanées : chaque requête qui détecte le cache périmé relance son propre recalcul coûteux, ce qui peut annuler tout le bénéfice (voire aggraver la charge par rapport à un cache bloquant classique).
>
> **Bonne pratique :** ne jamais laisser un cache périmé attendre l'utilisateur pour un simple rafraîchissement ; réserver l'attente au tout premier appel, sans aucune valeur en cache.

## Streaming HTTP progressif : quand le calcul est incompressible

Toutes les techniques précédentes évitent un recalcul évitable. Celle-ci s'applique au cas inverse : un calcul réellement **incompressible** (import d'un gros fichier, appel à un service externe lent) qu'aucun cache ne peut raccourcir. Le seul levier restant est alors la façon dont l'utilisateur perçoit l'attente.

Par défaut, un serveur PHP garde en mémoire tout ce qu'un script produit avec `echo`, et ne l'envoie au navigateur qu'une fois le script terminé (ou son tampon plein) : l'utilisateur voit une page blanche jusqu'à la fin, même si le script a déjà produit un résultat utile depuis longtemps.

```php
<?php
ini_set('output_buffering', 'off');   // désactive la mise en mémoire de la sortie
ini_set('implicit_flush', true);      // force l'envoi immédiat après chaque echo
while (ob_get_level() > 0) {
    ob_end_flush();                   // vide aussi tout tampon déjà ouvert par PHP lui-même
}

foreach ($lignesAImporter as $ligne) {
    importerLigne($ligne);
    echo "Ligne importee : {$ligne->id}<br>\n";
    flush();                          // envoie immediatement ce echo au navigateur
}
```

Chaque `echo` suivi de `flush()` part vers le navigateur immédiatement, sans attendre la fin du script : l'utilisateur voit une console qui se remplit en temps réel, comme les logs d'un terminal, plutôt qu'une page blanche suivie d'un résultat final d'un coup.

> **Note :** ce mécanisme est l'inverse de [`fastcgi_finish_request()`](/?c=langages&s=php&p=php-fpm) : là, la connexion se ferme tout de suite et le travail continue caché derrière ; ici, la connexion reste ouverte pendant tout le calcul, ce qui est justement ce qui permet d'en envoyer chaque morceau de résultat au fur et à mesure.

> **Piège :** ce streaming casse dès qu'un serveur intermédiaire (proxy, load balancer, Nginx en mode `fastcgi_buffering`) remet en place son propre tampon : vérifier la configuration complète de la chaîne réseau, pas seulement celle de PHP.

## Récapitulatif

| Situation | Sans le principe | Avec le principe |
|---|---|---|
| Fonction pure appelée plusieurs fois avec la même entrée | Recalcule à chaque appel | Mémoïse le résultat, invalide si l'entrée change |
| Traitement périodique sur des données en grande partie stables | Retraite tout à chaque passage | Ne retraite que ce qui a changé depuis la marque de progression |
| Rendu d'une frame de jeu | Redessine tout l'écran à chaque tick | Ne redessine que les zones marquées comme modifiées |
| Comparaison de deux enregistrements | Ouvre systématiquement le détail coûteux | S'arrête dès qu'une donnée légère a déjà tranché |
| Calcul répété sur une entrée qui change peu | Repart de zéro à chaque appel | Reprend le résultat précédent, avec repli sur le calcul complet si le résultat doit rester identique |
| Boucle sur des millions d'éléments dont presque aucun n'a de travail | Visite tous les éléments | Ne visite que les éléments marqués dans une bitmap |

Dans les quatre premiers cas, le gain ne vient pas d'un calcul rendu plus rapide, mais d'un calcul **qui n'a pas eu lieu** parce que rien ne pouvait en changer le résultat. Dans les deux derniers, le calcul a bien lieu, mais il ne porte plus que sur ce qui a changé (le résultat précédent repris) ou sur ce qui est marqué (la bitmap).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Ne jamais recalculer un résultat que rien n'a pu changer depuis son dernier calcul : mémoïsation, retraitement incrémental, ou dirty rectangle appliquent tous la même idée à des échelles différentes. Un cache fichier ajoute deux techniques : l'écriture atomique (jamais de lecture à moitié écrite) et le stale-while-revalidate (répondre vite, recalculer derrière). Quand le calcul est incompressible (rien à mettre en cache), le streaming HTTP progressif reste la seule façon d'améliorer l'attente perçue. Deux variantes pour les calculs lourds : reprendre le résultat précédent (calcul incrémental, avec repli sur le calcul complet quand le résultat doit rester identique) et ne parcourir que les éléments marqués dans une bitmap. |
| **Outils utilisables** | Un cache en mémoire par entrée (mémoïsation), une marque de progression pour ne retraiter que le nouveau, une comparaison "légère" avant une vérification coûteuse, `rename()`/`os.replace()` pour une écriture atomique, un verrou anti-concurrence pour un recalcul en tâche de fond, `flush()`/`ob_end_flush()` pour un streaming HTTP progressif. Un compteur de travail pour vérifier que deux versions rendent les mêmes verdicts, `__builtin_ctzll` pour parcourir les bits à 1. |
| **Pièges à éviter** | Mémoïser sans identifier ce qui invaliderait le résultat : un cache jamais invalidé devient une source de données périmées. Écrire directement dans un fichier de cache lu par d'autres processus. Appliquer stale-while-revalidate sans verrou anti-concurrence. Streamer une sortie HTTP sans vérifier qu'aucun proxy intermédiaire ne remet en place son propre tampon. Reprendre un point de départ périmé ; laisser fuir ce qui dépend du point de départ ; oublier une marque dans une bitmap (aucune erreur, des résultats perdus). |
| **Bonnes pratiques** | Toujours définir la condition d'invalidation avant de mémoïser ; distinguer un recalcul évitable (ce principe) d'une pause volontaire de protection (à conserver) ; écrire un fichier de cache via un fichier temporaire renommé ; ne faire attendre l'utilisateur qu'au tout premier appel sans cache ; streamer la sortie HTTP dès qu'un calcul long et incompressible produit des résultats progressivement. Profiler avant : la part de la fonction dans le temps total borne le gain ; vérifier qu'une version incrémentale ou filtrée donne les mêmes réponses que le calcul complet. |
