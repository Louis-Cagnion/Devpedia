---
order: 10
---

# La file de priorité et le tas binaire

Une [file](/?c=fondamentaux&s=algorithmes&p=pile-et-file) sert les éléments dans leur ordre d'arrivée. Une **file de priorité** sert toujours **le plus prioritaire** d'abord, comme les urgences d'un hôpital : le patient le plus grave passe avant, quelle que soit son heure d'arrivée.

| Opération | Tableau non trié | Tableau trié | Tas binaire |
|---|---|---|---|
| Ajouter un élément | O(1) | O(n) (décaler pour insérer à sa place) | O(log n) |
| Retirer le plus prioritaire | O(n) (tout parcourir) | O(1) | O(log n) |

Le **tas binaire** fait les deux opérations en O(log n) (voir [La complexité et la notation Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)) : avec un million d'éléments, une vingtaine d'étapes au lieu d'un million.

## Le tas binaire : un arbre rangé dans un tableau

Un tas est un arbre où chaque parent est **au moins aussi prioritaire que ses enfants**. Le plus prioritaire est donc toujours à la racine. L'arbre est rangé ligne par ligne dans un simple tableau, sans pointeurs :

```
            [0] 90                  tableau : 90  70  80  20  50  60
          /        \                case    :  0   1   2   3   4   5
      [1] 70      [2] 80
      /    \       /                parent de la case i     : (i - 1) / 2
  [3] 20  [4] 50  [5] 60            enfants de la case i    : 2i + 1 et 2i + 2
```

| Opération | Comment |
|---|---|
| Ajouter | Placer l'élément à la fin du tableau, puis le faire **remonter** en l'échangeant avec son parent tant qu'il est plus prioritaire |
| Retirer le plus prioritaire | Prendre la racine, mettre le dernier élément à sa place, puis le faire **descendre** en l'échangeant avec son enfant le plus prioritaire tant que nécessaire |

Chaque remontée ou descente parcourt au plus la hauteur de l'arbre, soit log₂(n) étapes.

## Le tas indexé : changer la priorité d'un élément déjà rangé

Certains algorithmes augmentent la priorité d'un élément **déjà dans le tas** : par exemple l'heuristique VSIDS des [solveurs SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl), qui augmente l'activité d'une variable à chaque conflit. Il faut alors savoir **où** se trouve cet élément dans le tableau, sans le chercher case par case. Un **tas indexé** tient une table `pos[x]` : la case où se trouve l'élément x, mise à jour à chaque déplacement.

```c
double priorite[N];                          // priorite[x] : priorité de l'élément x
int    tas[N];                               // les éléments, rangés en tas
int    pos[N];                               // pos[x] : case de x dans tas, ou -1
int    taille = 0;

static void placer(int i, int x) { tas[i] = x; pos[x] = i; }

// Fait remonter l'élément de la case i tant qu'il est plus prioritaire que son parent
static void monter(int i)
{
    int x = tas[i];
    while (i > 0 && priorite[x] > priorite[tas[(i - 1) / 2]]) {
        placer(i, tas[(i - 1) / 2]);         // le parent descend d'un cran
        i = (i - 1) / 2;
    }
    placer(i, x);
}

// Fait descendre l'élément de la case i tant qu'un enfant est plus prioritaire
static void descendre(int i)
{
    int x = tas[i];
    for (;;) {
        int e = 2 * i + 1;                   // enfant gauche
        if (e >= taille)
            break;
        if (e + 1 < taille && priorite[tas[e + 1]] > priorite[tas[e]])
            e++;                             // le plus prioritaire des deux enfants
        if (priorite[tas[e]] <= priorite[x])
            break;
        placer(i, tas[e]);                   // l'enfant remonte d'un cran
        i = e;
    }
    placer(i, x);
}

void inserer(int x) { placer(taille, x); taille++; monter(taille - 1); }

int extraire_max(void)
{
    int x = tas[0];
    pos[x] = -1;                             // x n'est plus dans le tas
    taille--;
    if (taille > 0) {
        placer(0, tas[taille]);              // le dernier prend la place de la racine
        descendre(0);
    }
    return x;
}

void augmenter(int x, double delta)          // la priorité de x augmente
{
    priorite[x] += delta;
    if (pos[x] >= 0)
        monter(pos[x]);                      // grâce à pos : aucune recherche dans le tas
}
```

Au lieu d'échanger deux cases à chaque étape, `monter` et `descendre` décalent les éléments rencontrés et ne posent `x` qu'une fois, à sa case finale : moitié moins d'écritures. Code vérifié sur 200 000 opérations aléatoires (ajouts, augmentations, retraits), en comparant chaque retrait avec une recherche du maximum case par case : aucune différence.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une file de priorité sert toujours le plus prioritaire d'abord. Le tas binaire la réalise dans un simple tableau : parent de la case i en (i − 1) / 2, enfants en 2i + 1 et 2i + 2, ajout et retrait en O(log n). |
| **Outils utilisables** | Remontée et descente dans le tas ; table des positions `pos[x]` (tas indexé) pour augmenter la priorité d'un élément déjà rangé. |
| **Pièges à éviter** | Oublier de mettre à jour `pos` à chaque déplacement (toujours passer par une seule fonction comme `placer`) ; chercher un élément case par case dans le tas, ce qui annule tout le gain. |
| **Bonnes pratiques** | Vérifier un tas contre une version naïve sur de nombreuses opérations aléatoires ; décaler plutôt qu'échanger pendant une remontée ou une descente. |
